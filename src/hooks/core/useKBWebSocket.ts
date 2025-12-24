/**
 * KB 4.5 - WebSocket & Real-time
 * Fase 14 - Capacidades real-time más allá de SSE
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type KBWebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export interface KBWebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  id?: string;
  timestamp?: number;
}

export interface KBWebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  reconnectDelayMax?: number;
  heartbeatInterval?: number;
  heartbeatMessage?: unknown;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: unknown) => void;
  onReconnect?: (attempt: number) => void;
}

export interface KBWebSocketState<T = unknown> {
  status: KBWebSocketStatus;
  lastMessage: T | null;
  lastMessageTime: number | null;
  reconnectAttempts: number;
  error: Error | null;
}

export interface KBWebSocketReturn<T = unknown> {
  state: KBWebSocketState<T>;
  send: (data: unknown) => void;
  sendJson: (data: unknown) => void;
  close: (code?: number, reason?: string) => void;
  reconnect: () => void;
  subscribe: <M = unknown>(type: string, handler: (payload: M) => void) => () => void;
}

// ============================================================================
// WEBSOCKET MANAGER
// ============================================================================

class KBWebSocketManager<T = unknown> {
  private ws: WebSocket | null = null;
  private config: Required<KBWebSocketConfig>;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private messageHandlers: Map<string, Set<(payload: unknown) => void>> = new Map();
  private stateListeners: Set<(state: KBWebSocketState<T>) => void> = new Set();
  
  private _state: KBWebSocketState<T> = {
    status: 'disconnected',
    lastMessage: null,
    lastMessageTime: null,
    reconnectAttempts: 0,
    error: null,
  };

  constructor(config: KBWebSocketConfig) {
    this.config = {
      url: config.url,
      protocols: config.protocols ?? [],
      reconnect: config.reconnect ?? true,
      reconnectAttempts: config.reconnectAttempts ?? 5,
      reconnectDelay: config.reconnectDelay ?? 1000,
      reconnectDelayMax: config.reconnectDelayMax ?? 30000,
      heartbeatInterval: config.heartbeatInterval ?? 0,
      heartbeatMessage: config.heartbeatMessage ?? { type: 'ping' },
      onOpen: config.onOpen ?? (() => {}),
      onClose: config.onClose ?? (() => {}),
      onError: config.onError ?? (() => {}),
      onMessage: config.onMessage ?? (() => {}),
      onReconnect: config.onReconnect ?? (() => {}),
    };
  }

  get state(): KBWebSocketState<T> {
    return { ...this._state };
  }

  private setState(updates: Partial<KBWebSocketState<T>>): void {
    this._state = { ...this._state, ...updates };
    this.notifyStateListeners();
  }

  private notifyStateListeners(): void {
    const state = this.state;
    this.stateListeners.forEach(listener => listener(state));
  }

  subscribeToState(listener: (state: KBWebSocketState<T>) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.setState({ status: 'connecting', error: null });

    try {
      this.ws = new WebSocket(
        this.config.url,
        this.config.protocols
      );

      this.ws.onopen = (event) => {
        this.setState({ 
          status: 'connected', 
          reconnectAttempts: 0,
          error: null,
        });
        this.startHeartbeat();
        this.config.onOpen(event);
      };

      this.ws.onclose = (event) => {
        this.setState({ status: 'disconnected' });
        this.stopHeartbeat();
        this.config.onClose(event);

        if (this.config.reconnect && !event.wasClean) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (event) => {
        this.setState({ 
          status: 'error',
          error: new Error('WebSocket error'),
        });
        this.config.onError(event);
      };

      this.ws.onmessage = (event) => {
        let data: unknown;
        
        try {
          data = JSON.parse(event.data);
        } catch {
          data = event.data;
        }

        this.setState({
          lastMessage: data as T,
          lastMessageTime: Date.now(),
        });

        this.config.onMessage(data);

        // Route to type-specific handlers
        if (typeof data === 'object' && data !== null && 'type' in data) {
          const message = data as KBWebSocketMessage;
          const handlers = this.messageHandlers.get(message.type);
          handlers?.forEach(handler => handler(message.payload));
        }
      };
    } catch (error) {
      this.setState({
        status: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  private scheduleReconnect(): void {
    if (this._state.reconnectAttempts >= this.config.reconnectAttempts) {
      this.setState({ 
        status: 'error',
        error: new Error('Max reconnection attempts reached'),
      });
      return;
    }

    const attempt = this._state.reconnectAttempts + 1;
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, attempt - 1),
      this.config.reconnectDelayMax
    );

    this.setState({ 
      status: 'reconnecting',
      reconnectAttempts: attempt,
    });

    this.config.onReconnect(attempt);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    if (this.config.heartbeatInterval <= 0) return;

    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendJson(this.config.heartbeatMessage);
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not open');
      return;
    }
    this.ws.send(data);
  }

  sendJson(data: unknown): void {
    this.send(JSON.stringify(data));
  }

  close(code?: number, reason?: string): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    this.ws?.close(code, reason);
    this.ws = null;
  }

  reconnect(): void {
    this.close();
    this.setState({ reconnectAttempts: 0 });
    this.connect();
  }

  subscribe<M = unknown>(type: string, handler: (payload: M) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler as (payload: unknown) => void);

    return () => {
      this.messageHandlers.get(type)?.delete(handler as (payload: unknown) => void);
    };
  }

  destroy(): void {
    this.close();
    this.messageHandlers.clear();
    this.stateListeners.clear();
  }
}

// ============================================================================
// WEBSOCKET HOOK
// ============================================================================

/**
 * Hook principal para WebSocket
 */
export function useKBWebSocket<T = unknown>(
  config: KBWebSocketConfig
): KBWebSocketReturn<T> {
  const managerRef = useRef<KBWebSocketManager<T> | null>(null);
  const [state, setState] = useState<KBWebSocketState<T>>({
    status: 'disconnected',
    lastMessage: null,
    lastMessageTime: null,
    reconnectAttempts: 0,
    error: null,
  });

  // Initialize manager
  useEffect(() => {
    managerRef.current = new KBWebSocketManager<T>(config);
    const unsubscribe = managerRef.current.subscribeToState(setState);
    managerRef.current.connect();

    return () => {
      unsubscribe();
      managerRef.current?.destroy();
      managerRef.current = null;
    };
  }, [config.url]);

  const send = useCallback((data: unknown) => {
    if (typeof data === 'string') {
      managerRef.current?.send(data);
    } else {
      managerRef.current?.send(JSON.stringify(data));
    }
  }, []);

  const sendJson = useCallback((data: unknown) => {
    managerRef.current?.sendJson(data);
  }, []);

  const close = useCallback((code?: number, reason?: string) => {
    managerRef.current?.close(code, reason);
  }, []);

  const reconnect = useCallback(() => {
    managerRef.current?.reconnect();
  }, []);

  const subscribe = useCallback(<M = unknown>(
    type: string,
    handler: (payload: M) => void
  ) => {
    return managerRef.current?.subscribe(type, handler) ?? (() => {});
  }, []);

  return {
    state,
    send,
    sendJson,
    close,
    reconnect,
    subscribe,
  };
}

// ============================================================================
// CHANNEL PATTERN
// ============================================================================

export interface KBChannelConfig {
  url: string;
  channels?: string[];
  auth?: () => Promise<{ token: string }>;
}

export interface KBChannelMessage<T = unknown> {
  channel: string;
  event: string;
  payload: T;
}

/**
 * Hook para patrón de canales (pub/sub)
 */
export function useKBChannel<T = unknown>(
  config: KBChannelConfig
): {
  state: KBWebSocketState<KBChannelMessage<T>>;
  join: (channel: string) => void;
  leave: (channel: string) => void;
  publish: (channel: string, event: string, payload: T) => void;
  subscribe: (channel: string, event: string, handler: (payload: T) => void) => () => void;
  channels: string[];
} {
  const [channels, setChannels] = useState<string[]>(config.channels ?? []);
  const handlersRef = useRef<Map<string, Map<string, Set<(payload: T) => void>>>>(new Map());

  const { state, sendJson, subscribe: wsSubscribe } = useKBWebSocket<KBChannelMessage<T>>({
    url: config.url,
    onOpen: async () => {
      // Authenticate if needed
      if (config.auth) {
        const { token } = await config.auth();
        sendJson({ type: 'auth', token });
      }

      // Join initial channels
      for (const channel of channels) {
        sendJson({ type: 'join', channel });
      }
    },
  });

  // Subscribe to channel messages
  useEffect(() => {
    const unsubscribe = wsSubscribe<KBChannelMessage<T>>('message', (message) => {
      const channelHandlers = handlersRef.current.get(message.channel);
      const eventHandlers = channelHandlers?.get(message.event);
      eventHandlers?.forEach(handler => handler(message.payload));
    });

    return unsubscribe;
  }, [wsSubscribe]);

  const join = useCallback((channel: string) => {
    if (!channels.includes(channel)) {
      setChannels(prev => [...prev, channel]);
      sendJson({ type: 'join', channel });
    }
  }, [channels, sendJson]);

  const leave = useCallback((channel: string) => {
    setChannels(prev => prev.filter(c => c !== channel));
    sendJson({ type: 'leave', channel });
    handlersRef.current.delete(channel);
  }, [sendJson]);

  const publish = useCallback((channel: string, event: string, payload: T) => {
    sendJson({ type: 'publish', channel, event, payload });
  }, [sendJson]);

  const subscribe = useCallback((
    channel: string,
    event: string,
    handler: (payload: T) => void
  ) => {
    if (!handlersRef.current.has(channel)) {
      handlersRef.current.set(channel, new Map());
    }
    if (!handlersRef.current.get(channel)!.has(event)) {
      handlersRef.current.get(channel)!.set(event, new Set());
    }
    handlersRef.current.get(channel)!.get(event)!.add(handler);

    return () => {
      handlersRef.current.get(channel)?.get(event)?.delete(handler);
    };
  }, []);

  return {
    state,
    join,
    leave,
    publish,
    subscribe,
    channels,
  };
}

// ============================================================================
// PRESENCE PATTERN
// ============================================================================

export interface KBPresenceUser {
  id: string;
  name?: string;
  avatar?: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
  metadata?: Record<string, unknown>;
  lastSeen?: number;
}

export interface KBPresenceConfig {
  url: string;
  roomId: string;
  userId: string;
  userInfo?: Omit<KBPresenceUser, 'id'>;
  heartbeatInterval?: number;
}

/**
 * Hook para presencia en tiempo real
 */
export function useKBPresence(
  config: KBPresenceConfig
): {
  users: KBPresenceUser[];
  myPresence: KBPresenceUser;
  updatePresence: (updates: Partial<KBPresenceUser>) => void;
  isConnected: boolean;
} {
  const [users, setUsers] = useState<KBPresenceUser[]>([]);
  const [myPresence, setMyPresence] = useState<KBPresenceUser>({
    id: config.userId,
    status: 'online',
    ...config.userInfo,
  });

  const { state, sendJson, subscribe } = useKBWebSocket<{
    type: string;
    users?: KBPresenceUser[];
    user?: KBPresenceUser;
    userId?: string;
  }>({
    url: config.url,
    heartbeatInterval: config.heartbeatInterval ?? 30000,
    heartbeatMessage: { type: 'presence', user: myPresence },
    onOpen: () => {
      sendJson({
        type: 'join_room',
        roomId: config.roomId,
        user: myPresence,
      });
    },
  });

  // Handle presence updates
  useEffect(() => {
    const unsubscribers = [
      subscribe<KBPresenceUser[]>('presence_list', (userList) => {
        setUsers(userList);
      }),
      subscribe<KBPresenceUser>('user_joined', (user) => {
        setUsers(prev => {
          if (prev.some(u => u.id === user.id)) return prev;
          return [...prev, user];
        });
      }),
      subscribe<string>('user_left', (userId) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
      }),
      subscribe<KBPresenceUser>('user_updated', (user) => {
        setUsers(prev => prev.map(u => u.id === user.id ? user : u));
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [subscribe]);

  const updatePresence = useCallback((updates: Partial<KBPresenceUser>) => {
    const newPresence = { ...myPresence, ...updates };
    setMyPresence(newPresence);
    sendJson({ type: 'update_presence', user: newPresence });
  }, [myPresence, sendJson]);

  return {
    users,
    myPresence,
    updatePresence,
    isConnected: state.status === 'connected',
  };
}

// ============================================================================
// REALTIME SYNC PATTERN
// ============================================================================

export interface KBRealtimeSyncConfig<T> {
  url: string;
  documentId: string;
  initialData: T;
  onConflict?: (local: T, remote: T) => T;
}

/**
 * Hook para sincronización en tiempo real
 */
export function useKBRealtimeSync<T>(
  config: KBRealtimeSyncConfig<T>
): {
  data: T;
  update: (updater: (data: T) => T) => void;
  replace: (newData: T) => void;
  isSyncing: boolean;
  lastSyncTime: number | null;
  conflict: { local: T; remote: T } | null;
  resolveConflict: (resolved: T) => void;
} {
  const [data, setData] = useState<T>(config.initialData);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [conflict, setConflict] = useState<{ local: T; remote: T } | null>(null);
  
  const versionRef = useRef(0);
  const pendingUpdatesRef = useRef<Array<{ version: number; data: T }>>([]);

  const { sendJson, subscribe } = useKBWebSocket<{
    type: string;
    data?: T;
    version?: number;
  }>({
    url: config.url,
    onOpen: () => {
      sendJson({ type: 'sync', documentId: config.documentId });
    },
  });

  // Handle sync messages
  useEffect(() => {
    const unsubscribers = [
      subscribe<{ data: T; version: number }>('sync', (payload) => {
        if (payload.version > versionRef.current) {
          versionRef.current = payload.version;
          setData(payload.data);
          setLastSyncTime(Date.now());
        }
      }),
      subscribe<{ data: T; version: number }>('update', (payload) => {
        if (payload.version > versionRef.current) {
          // Check for conflicts
          if (pendingUpdatesRef.current.length > 0) {
            const local = pendingUpdatesRef.current[pendingUpdatesRef.current.length - 1].data;
            if (config.onConflict) {
              const resolved = config.onConflict(local, payload.data);
              setData(resolved);
              versionRef.current = payload.version;
            } else {
              setConflict({ local, remote: payload.data });
            }
            pendingUpdatesRef.current = [];
          } else {
            versionRef.current = payload.version;
            setData(payload.data);
          }
          setLastSyncTime(Date.now());
        }
      }),
      subscribe<void>('ack', () => {
        setIsSyncing(false);
        pendingUpdatesRef.current.shift();
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [subscribe, config.onConflict]);

  const update = useCallback((updater: (data: T) => T) => {
    setData(prev => {
      const newData = updater(prev);
      const version = versionRef.current + 1;
      
      pendingUpdatesRef.current.push({ version, data: newData });
      setIsSyncing(true);
      
      sendJson({
        type: 'update',
        documentId: config.documentId,
        data: newData,
        version,
      });
      
      return newData;
    });
  }, [sendJson, config.documentId]);

  const replace = useCallback((newData: T) => {
    const version = versionRef.current + 1;
    
    pendingUpdatesRef.current.push({ version, data: newData });
    setIsSyncing(true);
    setData(newData);
    
    sendJson({
      type: 'replace',
      documentId: config.documentId,
      data: newData,
      version,
    });
  }, [sendJson, config.documentId]);

  const resolveConflict = useCallback((resolved: T) => {
    setConflict(null);
    replace(resolved);
  }, [replace]);

  return {
    data,
    update,
    replace,
    isSyncing,
    lastSyncTime,
    conflict,
    resolveConflict,
  };
}

// ============================================================================
// BINARY WEBSOCKET
// ============================================================================

/**
 * Hook para WebSocket binario
 */
export function useKBBinaryWebSocket(
  config: Omit<KBWebSocketConfig, 'onMessage'> & {
    onBinary?: (data: ArrayBuffer) => void;
  }
): {
  state: KBWebSocketState<ArrayBuffer>;
  sendBinary: (data: ArrayBuffer | Blob | Uint8Array) => void;
  sendText: (data: string) => void;
  close: () => void;
} {
  const [state, setState] = useState<KBWebSocketState<ArrayBuffer>>({
    status: 'disconnected',
    lastMessage: null,
    lastMessageTime: null,
    reconnectAttempts: 0,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(config.url, config.protocols);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = (event) => {
      setState(prev => ({ ...prev, status: 'connected' }));
      config.onOpen?.(event);
    };

    ws.onclose = (event) => {
      setState(prev => ({ ...prev, status: 'disconnected' }));
      config.onClose?.(event);
    };

    ws.onerror = (event) => {
      setState(prev => ({ ...prev, status: 'error', error: new Error('WebSocket error') }));
      config.onError?.(event);
    };

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        setState(prev => ({
          ...prev,
          lastMessage: event.data,
          lastMessageTime: Date.now(),
        }));
        config.onBinary?.(event.data);
      }
    };

    return () => {
      ws.close();
    };
  }, [config.url]);

  const sendBinary = useCallback((data: ArrayBuffer | Blob | Uint8Array) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  const sendText = useCallback((data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  const close = useCallback(() => {
    wsRef.current?.close();
  }, []);

  return {
    state,
    sendBinary,
    sendText,
    close,
  };
}

export default useKBWebSocket;
