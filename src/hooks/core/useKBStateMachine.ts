/**
 * KB 4.5 - State Machines & Workflows
 * Fase 14 - Patrones tipo XState para estados complejos
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface KBStateNode<TContext = unknown> {
  id: string;
  initial?: boolean;
  final?: boolean;
  entry?: Array<KBAction<TContext>>;
  exit?: Array<KBAction<TContext>>;
  on?: Record<string, KBTransition<TContext>>;
  invoke?: KBInvoke<TContext>;
  meta?: Record<string, unknown>;
}

export interface KBTransition<TContext = unknown> {
  target: string;
  guard?: KBGuard<TContext>;
  actions?: Array<KBAction<TContext>>;
  internal?: boolean;
}

export interface KBAction<TContext = unknown> {
  type: string;
  exec?: (context: TContext, event: KBEvent) => TContext | void;
}

export interface KBGuard<TContext = unknown> {
  type: string;
  predicate: (context: TContext, event: KBEvent) => boolean;
}

export interface KBInvoke<TContext = unknown> {
  id: string;
  src: (context: TContext, event: KBEvent) => Promise<unknown>;
  onDone?: KBTransition<TContext>;
  onError?: KBTransition<TContext>;
}

export interface KBEvent {
  type: string;
  payload?: unknown;
  timestamp?: number;
}

export interface KBMachineConfig<TContext = unknown> {
  id: string;
  initial: string;
  context: TContext;
  states: Record<string, KBStateNode<TContext>>;
  on?: Record<string, KBTransition<TContext>>;
}

export interface KBMachineState<TContext = unknown> {
  value: string;
  context: TContext;
  history: Array<{ state: string; event: KBEvent; timestamp: number }>;
  matches: (state: string) => boolean;
  can: (event: string) => boolean;
  done: boolean;
}

export interface KBMachineReturn<TContext = unknown> {
  state: KBMachineState<TContext>;
  send: (event: string | KBEvent) => void;
  reset: () => void;
  subscribe: (listener: (state: KBMachineState<TContext>) => void) => () => void;
}

// ============================================================================
// STATE MACHINE IMPLEMENTATION
// ============================================================================

export class KBStateMachine<TContext = unknown> {
  private config: KBMachineConfig<TContext>;
  private currentState: string;
  private context: TContext;
  private history: Array<{ state: string; event: KBEvent; timestamp: number }> = [];
  private listeners: Set<(state: KBMachineState<TContext>) => void> = new Set();
  private invokeAbortController: AbortController | null = null;

  constructor(config: KBMachineConfig<TContext>) {
    this.config = config;
    this.currentState = config.initial;
    this.context = { ...config.context };
    this.executeEntryActions(config.initial);
  }

  private executeEntryActions(stateId: string): void {
    const state = this.config.states[stateId];
    if (state?.entry) {
      for (const action of state.entry) {
        const result = action.exec?.(this.context, { type: '$entry' });
        if (result !== undefined && result !== null) {
          this.context = result as TContext;
        }
      }
    }

    // Handle invoke
    if (state?.invoke) {
      this.executeInvoke(state.invoke);
    }
  }

  private executeExitActions(stateId: string): void {
    const state = this.config.states[stateId];
    if (state?.exit) {
      for (const action of state.exit) {
        const result = action.exec?.(this.context, { type: '$exit' });
        if (result !== undefined && result !== null) {
          this.context = result as TContext;
        }
      }
    }
  }

  private executeInvoke(invoke: KBInvoke<TContext>): void {
    this.invokeAbortController?.abort();
    this.invokeAbortController = new AbortController();

    invoke.src(this.context, { type: '$invoke' })
      .then((result) => {
        if (!this.invokeAbortController?.signal.aborted) {
          this.send({ type: `${invoke.id}.done`, payload: result });
        }
      })
      .catch((error) => {
        if (!this.invokeAbortController?.signal.aborted) {
          this.send({ type: `${invoke.id}.error`, payload: error });
        }
      });
  }

  getState(): KBMachineState<TContext> {
    const currentStateNode = this.config.states[this.currentState];
    return {
      value: this.currentState,
      context: this.context,
      history: [...this.history],
      matches: (state: string) => this.currentState === state,
      can: (event: string) => this.canTransition(event),
      done: currentStateNode?.final ?? false,
    };
  }

  private canTransition(eventType: string): boolean {
    const stateNode = this.config.states[this.currentState];
    const transition = stateNode?.on?.[eventType] || this.config.on?.[eventType];
    
    if (!transition) return false;
    if (!transition.guard) return true;
    
    return transition.guard.predicate(this.context, { type: eventType });
  }

  send(eventOrType: string | KBEvent): void {
    const event: KBEvent = typeof eventOrType === 'string' 
      ? { type: eventOrType, timestamp: Date.now() }
      : { ...eventOrType, timestamp: eventOrType.timestamp ?? Date.now() };

    const stateNode = this.config.states[this.currentState];
    
    // Check for invoke done/error handlers
    let transition: KBTransition<TContext> | undefined;
    
    if (stateNode?.invoke) {
      if (event.type === `${stateNode.invoke.id}.done`) {
        transition = stateNode.invoke.onDone;
      } else if (event.type === `${stateNode.invoke.id}.error`) {
        transition = stateNode.invoke.onError;
      }
    }

    // Check state-level transitions
    if (!transition) {
      transition = stateNode?.on?.[event.type];
    }

    // Check machine-level transitions
    if (!transition) {
      transition = this.config.on?.[event.type];
    }

    if (!transition) {
      console.warn(`[KBStateMachine] No transition for event "${event.type}" in state "${this.currentState}"`);
      return;
    }

    // Check guard
    if (transition.guard && !transition.guard.predicate(this.context, event)) {
      console.warn(`[KBStateMachine] Guard blocked transition for event "${event.type}"`);
      return;
    }

    // Cancel any pending invoke
    this.invokeAbortController?.abort();

    // Execute exit actions
    if (!transition.internal) {
      this.executeExitActions(this.currentState);
    }

    // Execute transition actions
    if (transition.actions) {
      for (const action of transition.actions) {
        const result = action.exec?.(this.context, event);
        if (result !== undefined && result !== null) {
          this.context = result as TContext;
        }
      }
    }

    // Record history
    this.history.push({
      state: this.currentState,
      event,
      timestamp: event.timestamp!,
    });

    // Transition to new state
    if (!transition.internal) {
      this.currentState = transition.target;
      this.executeEntryActions(transition.target);
    }

    // Notify listeners
    this.notifyListeners();
  }

  reset(): void {
    this.invokeAbortController?.abort();
    this.currentState = this.config.initial;
    this.context = { ...this.config.context };
    this.history = [];
    this.executeEntryActions(this.config.initial);
    this.notifyListeners();
  }

  subscribe(listener: (state: KBMachineState<TContext>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook principal para state machines
 */
export function useKBStateMachine<TContext = unknown>(
  config: KBMachineConfig<TContext>
): KBMachineReturn<TContext> {
  const machineRef = useRef<KBStateMachine<TContext> | null>(null);
  
  if (!machineRef.current) {
    machineRef.current = new KBStateMachine(config);
  }

  const [state, setState] = useState<KBMachineState<TContext>>(
    () => machineRef.current!.getState()
  );

  useEffect(() => {
    const machine = machineRef.current!;
    const unsubscribe = machine.subscribe(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  const send = useCallback((event: string | KBEvent) => {
    machineRef.current?.send(event);
  }, []);

  const reset = useCallback(() => {
    machineRef.current?.reset();
  }, []);

  const subscribe = useCallback((listener: (state: KBMachineState<TContext>) => void) => {
    return machineRef.current?.subscribe(listener) ?? (() => {});
  }, []);

  return { state, send, reset, subscribe };
}

// ============================================================================
// WORKFLOW ENGINE
// ============================================================================

export interface KBWorkflowStep<TContext = unknown> {
  id: string;
  name: string;
  execute: (context: TContext) => Promise<TContext>;
  rollback?: (context: TContext) => Promise<TContext>;
  retries?: number;
  timeout?: number;
  condition?: (context: TContext) => boolean;
}

export interface KBWorkflowConfig<TContext = unknown> {
  id: string;
  name: string;
  steps: KBWorkflowStep<TContext>[];
  initialContext: TContext;
  onStepComplete?: (step: KBWorkflowStep<TContext>, context: TContext) => void;
  onStepError?: (step: KBWorkflowStep<TContext>, error: Error, context: TContext) => void;
  onComplete?: (context: TContext) => void;
  onError?: (error: Error, context: TContext) => void;
}

export interface KBWorkflowState<TContext = unknown> {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  currentStepIndex: number;
  currentStep: KBWorkflowStep<TContext> | null;
  context: TContext;
  completedSteps: string[];
  failedSteps: string[];
  error: Error | null;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface KBWorkflowReturn<TContext = unknown> {
  state: KBWorkflowState<TContext>;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => Promise<void>;
  cancel: () => Promise<void>;
  retry: () => Promise<void>;
  goToStep: (stepId: string) => void;
}

/**
 * Hook para workflows secuenciales con rollback
 */
export function useKBWorkflow<TContext = unknown>(
  config: KBWorkflowConfig<TContext>
): KBWorkflowReturn<TContext> {
  const [state, setState] = useState<KBWorkflowState<TContext>>({
    status: 'idle',
    currentStepIndex: -1,
    currentStep: null,
    context: config.initialContext,
    completedSteps: [],
    failedSteps: [],
    error: null,
    startedAt: null,
    completedAt: null,
  });

  const pausedRef = useRef(false);
  const cancelledRef = useRef(false);

  const executeStep = useCallback(async (
    step: KBWorkflowStep<TContext>,
    context: TContext,
    retriesLeft: number
  ): Promise<TContext> => {
    // Check condition
    if (step.condition && !step.condition(context)) {
      return context;
    }

    try {
      // Execute with timeout
      const timeoutPromise = step.timeout 
        ? new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`Step "${step.id}" timed out`)), step.timeout)
          )
        : null;

      const result = timeoutPromise
        ? await Promise.race([step.execute(context), timeoutPromise])
        : await step.execute(context);

      return result;
    } catch (error) {
      if (retriesLeft > 0) {
        console.warn(`[KBWorkflow] Retrying step "${step.id}", ${retriesLeft} retries left`);
        return executeStep(step, context, retriesLeft - 1);
      }
      throw error;
    }
  }, []);

  const rollbackSteps = useCallback(async (
    completedStepIds: string[],
    context: TContext
  ): Promise<TContext> => {
    let currentContext = context;
    
    // Rollback in reverse order
    for (let i = completedStepIds.length - 1; i >= 0; i--) {
      const stepId = completedStepIds[i];
      const step = config.steps.find(s => s.id === stepId);
      
      if (step?.rollback) {
        try {
          currentContext = await step.rollback(currentContext);
        } catch (error) {
          console.error(`[KBWorkflow] Rollback failed for step "${stepId}":`, error);
        }
      }
    }
    
    return currentContext;
  }, [config.steps]);

  const start = useCallback(async () => {
    pausedRef.current = false;
    cancelledRef.current = false;

    setState(prev => ({
      ...prev,
      status: 'running',
      currentStepIndex: 0,
      currentStep: config.steps[0] || null,
      completedSteps: [],
      failedSteps: [],
      error: null,
      startedAt: new Date(),
      completedAt: null,
    }));

    let context = config.initialContext;
    const completedSteps: string[] = [];

    for (let i = 0; i < config.steps.length; i++) {
      if (cancelledRef.current) {
        context = await rollbackSteps(completedSteps, context);
        setState(prev => ({
          ...prev,
          status: 'cancelled',
          context,
          completedAt: new Date(),
        }));
        return;
      }

      while (pausedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (cancelledRef.current) break;
      }

      const step = config.steps[i];

      setState(prev => ({
        ...prev,
        currentStepIndex: i,
        currentStep: step,
      }));

      try {
        context = await executeStep(step, context, step.retries ?? 0);
        completedSteps.push(step.id);
        
        setState(prev => ({
          ...prev,
          context,
          completedSteps: [...completedSteps],
        }));

        config.onStepComplete?.(step, context);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        setState(prev => ({
          ...prev,
          status: 'failed',
          failedSteps: [...prev.failedSteps, step.id],
          error: err,
        }));

        config.onStepError?.(step, err, context);
        config.onError?.(err, context);
        return;
      }
    }

    setState(prev => ({
      ...prev,
      status: 'completed',
      currentStep: null,
      completedAt: new Date(),
    }));

    config.onComplete?.(context);
  }, [config, executeStep, rollbackSteps]);

  const pause = useCallback(() => {
    pausedRef.current = true;
    setState(prev => ({ ...prev, status: 'paused' }));
  }, []);

  const resume = useCallback(async () => {
    pausedRef.current = false;
    setState(prev => ({ ...prev, status: 'running' }));
  }, []);

  const cancel = useCallback(async () => {
    cancelledRef.current = true;
  }, []);

  const retry = useCallback(async () => {
    if (state.status !== 'failed') return;
    
    pausedRef.current = false;
    cancelledRef.current = false;
    
    // Continue from failed step
    const failedStepIndex = state.currentStepIndex;
    let context = state.context;

    setState(prev => ({
      ...prev,
      status: 'running',
      error: null,
      failedSteps: [],
    }));

    const completedSteps = [...state.completedSteps];

    for (let i = failedStepIndex; i < config.steps.length; i++) {
      if (cancelledRef.current) break;
      while (pausedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (cancelledRef.current) break;
      }

      const step = config.steps[i];

      setState(prev => ({
        ...prev,
        currentStepIndex: i,
        currentStep: step,
      }));

      try {
        context = await executeStep(step, context, step.retries ?? 0);
        completedSteps.push(step.id);
        
        setState(prev => ({
          ...prev,
          context,
          completedSteps: [...completedSteps],
        }));

        config.onStepComplete?.(step, context);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        setState(prev => ({
          ...prev,
          status: 'failed',
          failedSteps: [...prev.failedSteps, step.id],
          error: err,
        }));

        config.onStepError?.(step, err, context);
        config.onError?.(err, context);
        return;
      }
    }

    setState(prev => ({
      ...prev,
      status: 'completed',
      currentStep: null,
      completedAt: new Date(),
    }));

    config.onComplete?.(context);
  }, [state, config, executeStep]);

  const goToStep = useCallback((stepId: string) => {
    const index = config.steps.findIndex(s => s.id === stepId);
    if (index !== -1 && state.status === 'paused') {
      setState(prev => ({
        ...prev,
        currentStepIndex: index,
        currentStep: config.steps[index],
      }));
    }
  }, [config.steps, state.status]);

  return {
    state,
    start,
    pause,
    resume,
    cancel,
    retry,
    goToStep,
  };
}

// ============================================================================
// SAGA PATTERN
// ============================================================================

export interface KBSagaEffect {
  type: 'call' | 'put' | 'take' | 'fork' | 'cancel' | 'select' | 'delay';
  payload: unknown;
}

export function* kbCall<T>(fn: () => Promise<T>): Generator<KBSagaEffect, T, T> {
  return yield { type: 'call', payload: fn };
}

export function* kbPut(action: KBEvent): Generator<KBSagaEffect, void, void> {
  yield { type: 'put', payload: action };
}

export function* kbTake(pattern: string | string[]): Generator<KBSagaEffect, KBEvent, KBEvent> {
  return yield { type: 'take', payload: pattern };
}

export function* kbDelay(ms: number): Generator<KBSagaEffect, void, void> {
  yield { type: 'delay', payload: ms };
}

export function useKBSaga<TContext = unknown>(
  saga: () => Generator<KBSagaEffect, void, unknown>,
  dependencies: unknown[] = []
) {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const eventQueueRef = useRef<KBEvent[]>([]);
  const waitingForRef = useRef<string | string[] | null>(null);
  const resolveWaitRef = useRef<((event: KBEvent) => void) | null>(null);

  const dispatch = useCallback((event: KBEvent) => {
    if (waitingForRef.current) {
      const patterns = Array.isArray(waitingForRef.current) 
        ? waitingForRef.current 
        : [waitingForRef.current];
      
      if (patterns.includes(event.type)) {
        waitingForRef.current = null;
        resolveWaitRef.current?.(event);
        return;
      }
    }
    eventQueueRef.current.push(event);
  }, []);

  const run = useCallback(async () => {
    setIsRunning(true);
    setError(null);

    const generator = saga();
    let result = generator.next();

    try {
      while (!result.done) {
        const effect = result.value as KBSagaEffect;
        let effectResult: unknown;

        switch (effect.type) {
          case 'call':
            effectResult = await (effect.payload as () => Promise<unknown>)();
            break;

          case 'put':
            dispatch(effect.payload as KBEvent);
            break;

          case 'take':
            waitingForRef.current = effect.payload as string | string[];
            effectResult = await new Promise<KBEvent>((resolve) => {
              resolveWaitRef.current = resolve;
              
              // Check queue for matching event
              const patterns = Array.isArray(effect.payload) 
                ? effect.payload as string[]
                : [effect.payload as string];
              
              const queueIndex = eventQueueRef.current.findIndex(e => 
                patterns.includes(e.type)
              );
              
              if (queueIndex !== -1) {
                const event = eventQueueRef.current.splice(queueIndex, 1)[0];
                waitingForRef.current = null;
                resolve(event);
              }
            });
            break;

          case 'delay':
            await new Promise(resolve => setTimeout(resolve, effect.payload as number));
            break;
        }

        result = generator.next(effectResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsRunning(false);
    }
  }, [saga, dispatch, ...dependencies]);

  return {
    run,
    dispatch,
    isRunning,
    error,
  };
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createKBMachine<TContext>(
  config: KBMachineConfig<TContext>
): KBStateMachine<TContext> {
  return new KBStateMachine(config);
}

export function createKBAction<TContext>(
  type: string,
  exec: (context: TContext, event: KBEvent) => TContext | void
): KBAction<TContext> {
  return { type, exec };
}

export function createKBGuard<TContext>(
  type: string,
  predicate: (context: TContext, event: KBEvent) => boolean
): KBGuard<TContext> {
  return { type, predicate };
}

export default useKBStateMachine;
