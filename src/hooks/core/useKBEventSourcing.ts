/**
 * KB 4.5 - Event Sourcing Pattern
 * 
 * Event sourcing implementation for complete audit trails and state reconstruction.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface KBEvent<TPayload = unknown> {
  id: string;
  type: string;
  payload: TPayload;
  timestamp: number;
  version: number;
  aggregateId: string;
  aggregateType: string;
  metadata?: EventMetadata;
  correlationId?: string;
  causationId?: string;
}

export interface EventMetadata {
  userId?: string;
  sessionId?: string;
  source?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface Snapshot<TState> {
  id: string;
  aggregateId: string;
  state: TState;
  version: number;
  timestamp: number;
}

export interface EventStore<TEvent extends KBEvent = KBEvent> {
  append(event: TEvent): Promise<void>;
  appendMany(events: TEvent[]): Promise<void>;
  getEvents(aggregateId: string, fromVersion?: number): Promise<TEvent[]>;
  getEventsByType(type: string, from?: number, limit?: number): Promise<TEvent[]>;
  getSnapshot<TState>(aggregateId: string): Promise<Snapshot<TState> | null>;
  saveSnapshot<TState>(snapshot: Snapshot<TState>): Promise<void>;
  subscribe(handler: (event: TEvent) => void): () => void;
}

export interface Aggregate<TState, TEvent extends KBEvent = KBEvent> {
  id: string;
  type: string;
  state: TState;
  version: number;
  apply(event: TEvent): TState;
  handle(command: unknown): TEvent[];
}

export interface Projection<TState = unknown> {
  name: string;
  initialState: TState;
  handlers: ProjectionHandlers<TState>;
}

export type ProjectionHandlers<TState> = {
  [eventType: string]: (state: TState, event: KBEvent) => TState;
};

export interface KBEventSourcingConfig {
  /** Event store implementation */
  store?: EventStore;
  /** Snapshot frequency (every N events) */
  snapshotFrequency?: number;
  /** Enable optimistic updates */
  optimistic?: boolean;
  /** Maximum events to keep in memory */
  maxEventsInMemory?: number;
  /** Auto-persist events */
  autoPersist?: boolean;
}

export interface KBEventSourcingState<TState> {
  state: TState;
  version: number;
  pendingEvents: KBEvent[];
  isReplaying: boolean;
  lastEventId: string | null;
  error: Error | null;
}

// ============================================================================
// IN-MEMORY EVENT STORE
// ============================================================================

class InMemoryEventStore implements EventStore {
  private events: Map<string, KBEvent[]> = new Map();
  private allEvents: KBEvent[] = [];
  private snapshots: Map<string, Snapshot<unknown>> = new Map();
  private subscribers: Set<(event: KBEvent) => void> = new Set();

  async append(event: KBEvent): Promise<void> {
    const aggregateEvents = this.events.get(event.aggregateId) || [];
    aggregateEvents.push(event);
    this.events.set(event.aggregateId, aggregateEvents);
    this.allEvents.push(event);
    
    // Notify subscribers
    this.subscribers.forEach((handler) => handler(event));
  }

  async appendMany(events: KBEvent[]): Promise<void> {
    for (const event of events) {
      await this.append(event);
    }
  }

  async getEvents(aggregateId: string, fromVersion = 0): Promise<KBEvent[]> {
    const events = this.events.get(aggregateId) || [];
    return events.filter((e) => e.version >= fromVersion);
  }

  async getEventsByType(type: string, from = 0, limit = 100): Promise<KBEvent[]> {
    return this.allEvents
      .filter((e) => e.type === type && e.timestamp >= from)
      .slice(0, limit);
  }

  async getSnapshot<TState>(aggregateId: string): Promise<Snapshot<TState> | null> {
    return (this.snapshots.get(aggregateId) as Snapshot<TState>) || null;
  }

  async saveSnapshot<TState>(snapshot: Snapshot<TState>): Promise<void> {
    this.snapshots.set(snapshot.aggregateId, snapshot);
  }

  subscribe(handler: (event: KBEvent) => void): () => void {
    this.subscribers.add(handler);
    return () => this.subscribers.delete(handler);
  }
}

// ============================================================================
// HOOKS
// ============================================================================

const defaultStore = new InMemoryEventStore();

/**
 * Main Event Sourcing Hook
 */
export function useKBEventSourcing<TState, TEvent extends KBEvent = KBEvent>(
  aggregateId: string,
  aggregateType: string,
  reducer: (state: TState, event: TEvent) => TState,
  initialState: TState,
  config: KBEventSourcingConfig = {}
) {
  const {
    store = defaultStore,
    snapshotFrequency = 100,
    optimistic = true,
    maxEventsInMemory = 1000,
    autoPersist = true,
  } = config;

  const [state, setState] = useState<KBEventSourcingState<TState>>({
    state: initialState,
    version: 0,
    pendingEvents: [],
    isReplaying: false,
    lastEventId: null,
    error: null,
  });

  const versionRef = useRef(0);
  const eventBufferRef = useRef<TEvent[]>([]);

  // Generate event ID
  const generateEventId = useCallback(() => {
    return `${aggregateId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, [aggregateId]);

  // Create event
  const createEvent = useCallback(<TPayload>(
    type: string,
    payload: TPayload,
    metadata?: EventMetadata
  ): TEvent => {
    versionRef.current += 1;
    
    return {
      id: generateEventId(),
      type,
      payload,
      timestamp: Date.now(),
      version: versionRef.current,
      aggregateId,
      aggregateType,
      metadata,
    } as TEvent;
  }, [aggregateId, aggregateType, generateEventId]);

  // Apply event to state
  const applyEvent = useCallback((currentState: TState, event: TEvent): TState => {
    return reducer(currentState, event);
  }, [reducer]);

  // Dispatch event
  const dispatch = useCallback(async <TPayload>(
    type: string,
    payload: TPayload,
    metadata?: EventMetadata
  ): Promise<TEvent> => {
    const event = createEvent(type, payload, metadata);

    // Optimistic update
    if (optimistic) {
      setState((prev) => ({
        ...prev,
        state: applyEvent(prev.state, event),
        version: event.version,
        pendingEvents: [...prev.pendingEvents, event],
        lastEventId: event.id,
      }));
    }

    try {
      // Persist event
      if (autoPersist) {
        await store.append(event);
      }

      // Buffer for snapshot
      eventBufferRef.current.push(event);

      // Check if snapshot needed
      if (eventBufferRef.current.length >= snapshotFrequency) {
        const snapshot: Snapshot<TState> = {
          id: `snapshot-${aggregateId}-${event.version}`,
          aggregateId,
          state: state.state,
          version: event.version,
          timestamp: Date.now(),
        };
        await store.saveSnapshot(snapshot);
        eventBufferRef.current = [];
      }

      // Remove from pending
      setState((prev) => ({
        ...prev,
        pendingEvents: prev.pendingEvents.filter((e) => e.id !== event.id),
        error: null,
      }));

      return event;
    } catch (error) {
      // Rollback on error
      setState((prev) => {
        const rolledBackState = prev.pendingEvents
          .filter((e) => e.id !== event.id)
          .reduce((s, e) => applyEvent(s, e as TEvent), initialState);

        return {
          ...prev,
          state: rolledBackState,
          pendingEvents: prev.pendingEvents.filter((e) => e.id !== event.id),
          error: error instanceof Error ? error : new Error(String(error)),
        };
      });
      throw error;
    }
  }, [createEvent, optimistic, applyEvent, autoPersist, store, snapshotFrequency, aggregateId, state.state, initialState]);

  // Dispatch multiple events
  const dispatchMany = useCallback(async <TPayload>(
    events: Array<{ type: string; payload: TPayload; metadata?: EventMetadata }>
  ): Promise<TEvent[]> => {
    const results: TEvent[] = [];
    for (const { type, payload, metadata } of events) {
      const event = await dispatch(type, payload, metadata);
      results.push(event);
    }
    return results;
  }, [dispatch]);

  // Replay events from store
  const replay = useCallback(async (fromVersion = 0): Promise<void> => {
    setState((prev) => ({ ...prev, isReplaying: true, error: null }));

    try {
      // Try to load snapshot first
      const snapshot = await store.getSnapshot<TState>(aggregateId);
      let currentState = snapshot?.state ?? initialState;
      let startVersion = snapshot?.version ?? 0;

      if (startVersion > fromVersion) {
        startVersion = fromVersion;
        currentState = initialState;
      }

      // Get events after snapshot
      const events = await store.getEvents(aggregateId, startVersion);

      // Apply events
      for (const event of events) {
        currentState = applyEvent(currentState, event as TEvent);
        versionRef.current = event.version;
      }

      setState({
        state: currentState,
        version: versionRef.current,
        pendingEvents: [],
        isReplaying: false,
        lastEventId: events[events.length - 1]?.id ?? null,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isReplaying: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
    }
  }, [store, aggregateId, initialState, applyEvent]);

  // Get events history
  const getHistory = useCallback(async (limit?: number): Promise<TEvent[]> => {
    const events = await store.getEvents(aggregateId);
    return (limit ? events.slice(-limit) : events) as TEvent[];
  }, [store, aggregateId]);

  // Reset to specific version
  const resetToVersion = useCallback(async (version: number): Promise<void> => {
    setState((prev) => ({ ...prev, isReplaying: true }));

    try {
      const events = await store.getEvents(aggregateId);
      const relevantEvents = events.filter((e) => e.version <= version);

      let currentState = initialState;
      for (const event of relevantEvents) {
        currentState = applyEvent(currentState, event as TEvent);
      }

      versionRef.current = version;
      setState({
        state: currentState,
        version,
        pendingEvents: [],
        isReplaying: false,
        lastEventId: relevantEvents[relevantEvents.length - 1]?.id ?? null,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isReplaying: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
    }
  }, [store, aggregateId, initialState, applyEvent]);

  // Subscribe to external events
  useEffect(() => {
    const unsubscribe = store.subscribe((event) => {
      if (event.aggregateId === aggregateId && event.version > versionRef.current) {
        setState((prev) => ({
          ...prev,
          state: applyEvent(prev.state, event as TEvent),
          version: event.version,
          lastEventId: event.id,
        }));
        versionRef.current = event.version;
      }
    });

    return unsubscribe;
  }, [store, aggregateId, applyEvent]);

  // Initial replay
  useEffect(() => {
    replay();
  }, []);

  return {
    // State
    state: state.state,
    version: state.version,
    pendingEvents: state.pendingEvents,
    isReplaying: state.isReplaying,
    lastEventId: state.lastEventId,
    error: state.error,
    hasPendingEvents: state.pendingEvents.length > 0,

    // Actions
    dispatch,
    dispatchMany,
    replay,
    getHistory,
    resetToVersion,

    // Helpers
    createEvent,
  };
}

/**
 * Projection Hook - Build read models from events
 */
export function useKBProjection<TState>(
  projection: Projection<TState>,
  store: EventStore = defaultStore,
  config: { live?: boolean } = {}
) {
  const [state, setState] = useState<TState>(projection.initialState);
  const [isBuilding, setIsBuilding] = useState(false);
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  const applyEvent = useCallback((currentState: TState, event: KBEvent): TState => {
    const handler = projection.handlers[event.type];
    if (handler) {
      return handler(currentState, event);
    }
    return currentState;
  }, [projection.handlers]);

  const rebuild = useCallback(async () => {
    setIsBuilding(true);
    
    try {
      let currentState = projection.initialState;
      const eventTypes = Object.keys(projection.handlers);
      
      for (const eventType of eventTypes) {
        const events = await store.getEventsByType(eventType);
        for (const event of events) {
          currentState = applyEvent(currentState, event);
          setLastEventId(event.id);
        }
      }

      setState(currentState);
    } finally {
      setIsBuilding(false);
    }
  }, [projection.initialState, projection.handlers, store, applyEvent]);

  // Live updates
  useEffect(() => {
    if (!config.live) return;

    const unsubscribe = store.subscribe((event) => {
      if (projection.handlers[event.type]) {
        setState((prev) => applyEvent(prev, event));
        setLastEventId(event.id);
      }
    });

    return unsubscribe;
  }, [config.live, store, projection.handlers, applyEvent]);

  // Initial build
  useEffect(() => {
    rebuild();
  }, []);

  return {
    state,
    isBuilding,
    lastEventId,
    rebuild,
  };
}

/**
 * Aggregate Hook - Domain-driven event sourcing
 */
export function useKBAggregate<TState, TCommand, TEvent extends KBEvent = KBEvent>(
  aggregateId: string,
  aggregateType: string,
  config: {
    initialState: TState;
    commandHandler: (state: TState, command: TCommand) => TEvent[];
    eventReducer: (state: TState, event: TEvent) => TState;
    store?: EventStore;
  }
) {
  const eventSourcing = useKBEventSourcing(
    aggregateId,
    aggregateType,
    config.eventReducer,
    config.initialState,
    { store: config.store }
  );

  const execute = useCallback(async (command: TCommand): Promise<TEvent[]> => {
    const events = config.commandHandler(eventSourcing.state, command);
    
    for (const event of events) {
      await eventSourcing.dispatch(event.type, event.payload, event.metadata);
    }

    return events;
  }, [config.commandHandler, eventSourcing]);

  return {
    ...eventSourcing,
    execute,
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

export function createEventStore(): EventStore {
  return new InMemoryEventStore();
}

export function createProjection<TState>(
  name: string,
  initialState: TState,
  handlers: ProjectionHandlers<TState>
): Projection<TState> {
  return { name, initialState, handlers };
}

export function createEvent<TPayload>(
  type: string,
  aggregateId: string,
  aggregateType: string,
  payload: TPayload,
  metadata?: EventMetadata
): KBEvent<TPayload> {
  return {
    id: `${aggregateId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    payload,
    timestamp: Date.now(),
    version: 0,
    aggregateId,
    aggregateType,
    metadata,
  };
}

export default useKBEventSourcing;
