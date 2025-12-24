/**
 * KB 4.5 - Undo/Redo Hooks
 * 
 * Hooks for implementing undo/redo functionality with command pattern.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface KBCommand<T = unknown> {
  id: string;
  type: string;
  description?: string;
  timestamp: number;
  execute: () => T | Promise<T>;
  undo: () => T | Promise<T>;
  redo?: () => T | Promise<T>;
  canMerge?: (other: KBCommand<T>) => boolean;
  merge?: (other: KBCommand<T>) => KBCommand<T>;
}

export interface KBUndoRedoConfig {
  /** Maximum history size */
  maxHistory?: number;
  /** Enable command merging */
  enableMerging?: boolean;
  /** Merge window in milliseconds */
  mergeWindow?: number;
  /** Enable persistence */
  persist?: boolean;
  /** Persistence key */
  persistKey?: string;
  /** Clear redo on new action */
  clearRedoOnAction?: boolean;
}

export interface KBUndoRedoState<T> {
  current: T;
  canUndo: boolean;
  canRedo: boolean;
  undoStack: KBCommand<T>[];
  redoStack: KBCommand<T>[];
  isExecuting: boolean;
  lastAction: string | null;
}

export interface KBUndoRedoReturn<T> {
  state: KBUndoRedoState<T>;
  execute: (command: Omit<KBCommand<T>, 'id' | 'timestamp'>) => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  clear: () => void;
  jumpTo: (commandId: string) => Promise<void>;
  getHistory: () => KBCommand<T>[];
  batch: (commands: Array<Omit<KBCommand<T>, 'id' | 'timestamp'>>) => Promise<void>;
}

// ============================================================================
// COMMAND FACTORIES
// ============================================================================

export function createCommand<T>(
  type: string,
  execute: () => T | Promise<T>,
  undo: () => T | Promise<T>,
  options?: {
    description?: string;
    redo?: () => T | Promise<T>;
    canMerge?: (other: KBCommand<T>) => boolean;
    merge?: (other: KBCommand<T>) => KBCommand<T>;
  }
): Omit<KBCommand<T>, 'id' | 'timestamp'> {
  return {
    type,
    execute,
    undo,
    ...options,
  };
}

export function createValueCommand<T, V>(
  type: string,
  getValue: () => V,
  setValue: (value: V) => T | Promise<T>,
  newValue: V
): Omit<KBCommand<T>, 'id' | 'timestamp'> {
  const oldValue = getValue();
  
  return {
    type,
    description: `Set ${type} from ${oldValue} to ${newValue}`,
    execute: () => setValue(newValue),
    undo: () => setValue(oldValue),
    canMerge: (other) => other.type === type,
  };
}

// ============================================================================
// useKBUndoRedo
// ============================================================================

const DEFAULT_CONFIG: Required<KBUndoRedoConfig> = {
  maxHistory: 100,
  enableMerging: true,
  mergeWindow: 500,
  persist: false,
  persistKey: 'kb_undo_redo',
  clearRedoOnAction: true,
};

export function useKBUndoRedo<T>(
  initialValue: T,
  config: KBUndoRedoConfig = {}
): KBUndoRedoReturn<T> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const [current, setCurrent] = useState<T>(initialValue);
  const [undoStack, setUndoStack] = useState<KBCommand<T>[]>([]);
  const [redoStack, setRedoStack] = useState<KBCommand<T>[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const lastCommandTime = useRef<number>(0);

  // Load from persistence
  useEffect(() => {
    if (mergedConfig.persist) {
      try {
        const saved = localStorage.getItem(mergedConfig.persistKey);
        if (saved) {
          const { current: savedCurrent } = JSON.parse(saved);
          setCurrent(savedCurrent);
        }
      } catch {
        // Ignore persistence errors
      }
    }
  }, [mergedConfig.persist, mergedConfig.persistKey]);

  // Save to persistence
  useEffect(() => {
    if (mergedConfig.persist) {
      try {
        localStorage.setItem(mergedConfig.persistKey, JSON.stringify({ current }));
      } catch {
        // Ignore persistence errors
      }
    }
  }, [current, mergedConfig.persist, mergedConfig.persistKey]);

  const state: KBUndoRedoState<T> = useMemo(() => ({
    current,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoStack,
    redoStack,
    isExecuting,
    lastAction,
  }), [current, undoStack, redoStack, isExecuting, lastAction]);

  const execute = useCallback(async (
    command: Omit<KBCommand<T>, 'id' | 'timestamp'>
  ) => {
    if (isExecuting) return;
    setIsExecuting(true);

    const fullCommand: KBCommand<T> = {
      ...command,
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    try {
      const result = await fullCommand.execute();
      setCurrent(result);

      // Handle command merging
      const now = Date.now();
      const shouldMerge = mergedConfig.enableMerging &&
        undoStack.length > 0 &&
        now - lastCommandTime.current < mergedConfig.mergeWindow &&
        undoStack[undoStack.length - 1].type === fullCommand.type &&
        fullCommand.canMerge?.(undoStack[undoStack.length - 1]);

      if (shouldMerge && fullCommand.merge) {
        const lastCommand = undoStack[undoStack.length - 1];
        const mergedCommand = fullCommand.merge(lastCommand);
        setUndoStack(prev => [...prev.slice(0, -1), mergedCommand]);
      } else {
        setUndoStack(prev => {
          const newStack = [...prev, fullCommand];
          return newStack.slice(-mergedConfig.maxHistory);
        });
      }

      if (mergedConfig.clearRedoOnAction) {
        setRedoStack([]);
      }

      lastCommandTime.current = now;
      setLastAction(fullCommand.type);
    } finally {
      setIsExecuting(false);
    }
  }, [isExecuting, undoStack, mergedConfig]);

  const undo = useCallback(async () => {
    if (!state.canUndo || isExecuting) return;
    setIsExecuting(true);

    const command = undoStack[undoStack.length - 1];

    try {
      const result = await command.undo();
      setCurrent(result);
      
      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, command]);
      setLastAction(`undo:${command.type}`);
    } finally {
      setIsExecuting(false);
    }
  }, [state.canUndo, isExecuting, undoStack]);

  const redo = useCallback(async () => {
    if (!state.canRedo || isExecuting) return;
    setIsExecuting(true);

    const command = redoStack[redoStack.length - 1];
    const redoFn = command.redo || command.execute;

    try {
      const result = await redoFn();
      setCurrent(result);
      
      setRedoStack(prev => prev.slice(0, -1));
      setUndoStack(prev => [...prev, command]);
      setLastAction(`redo:${command.type}`);
    } finally {
      setIsExecuting(false);
    }
  }, [state.canRedo, isExecuting, redoStack]);

  const clear = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
    setLastAction(null);
  }, []);

  const jumpTo = useCallback(async (commandId: string) => {
    // Find command in undo stack
    const undoIndex = undoStack.findIndex(cmd => cmd.id === commandId);
    if (undoIndex !== -1) {
      // Undo all commands after this one
      const commandsToUndo = undoStack.slice(undoIndex + 1).reverse();
      for (const cmd of commandsToUndo) {
        await cmd.undo();
      }
      
      setUndoStack(undoStack.slice(0, undoIndex + 1));
      setRedoStack(prev => [...prev, ...commandsToUndo.reverse()]);
      setCurrent(await undoStack[undoIndex].execute());
      return;
    }

    // Find command in redo stack
    const redoIndex = redoStack.findIndex(cmd => cmd.id === commandId);
    if (redoIndex !== -1) {
      // Redo all commands up to and including this one
      const commandsToRedo = redoStack.slice(redoIndex).reverse();
      for (const cmd of commandsToRedo) {
        const redoFn = cmd.redo || cmd.execute;
        await redoFn();
      }
      
      setRedoStack(redoStack.slice(0, redoIndex));
      setUndoStack(prev => [...prev, ...commandsToRedo.reverse()]);
      const targetCmd = redoStack[redoIndex];
      setCurrent(await (targetCmd.redo || targetCmd.execute)());
    }
  }, [undoStack, redoStack]);

  const getHistory = useCallback(() => [...undoStack], [undoStack]);

  const batch = useCallback(async (
    commands: Array<Omit<KBCommand<T>, 'id' | 'timestamp'>>
  ) => {
    if (commands.length === 0) return;
    
    // Create batch command
    const batchCommand: Omit<KBCommand<T>, 'id' | 'timestamp'> = {
      type: 'batch',
      description: `Batch of ${commands.length} commands`,
      execute: async () => {
        let result: T = current;
        for (const cmd of commands) {
          result = await cmd.execute();
        }
        return result;
      },
      undo: async () => {
        let result: T = current;
        for (const cmd of [...commands].reverse()) {
          result = await cmd.undo();
        }
        return result;
      },
    };

    await execute(batchCommand);
  }, [current, execute]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state,
    execute,
    undo,
    redo,
    clear,
    jumpTo,
    getHistory,
    batch,
  };
}

// ============================================================================
// useKBStateHistory
// ============================================================================

export interface KBStateHistoryConfig {
  maxHistory?: number;
  debounceMs?: number;
  compareFn?: <T>(a: T, b: T) => boolean;
}

export function useKBStateHistory<T>(
  initialValue: T,
  config: KBStateHistoryConfig = {}
) {
  const {
    maxHistory = 50,
    debounceMs = 0,
    compareFn = (a, b) => JSON.stringify(a) === JSON.stringify(b),
  } = config;

  const [current, setCurrent] = useState<T>(initialValue);
  const [history, setHistory] = useState<T[]>([initialValue]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const push = useCallback((newValue: T | ((prev: T) => T)) => {
    const doPush = () => {
      setCurrent(prev => {
        const value = typeof newValue === 'function' 
          ? (newValue as (prev: T) => T)(prev) 
          : newValue;

        if (compareFn(prev, value)) return prev;

        setHistory(h => {
          const newHistory = [...h.slice(0, historyIndex + 1), value];
          return newHistory.slice(-maxHistory);
        });
        setHistoryIndex(i => Math.min(i + 1, maxHistory - 1));

        return value;
      });
    };

    if (debounceMs > 0) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(doPush, debounceMs);
    } else {
      doPush();
    }
  }, [historyIndex, maxHistory, debounceMs, compareFn]);

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(i => i - 1);
      setCurrent(history[historyIndex - 1]);
    }
  }, [historyIndex, history]);

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(i => i + 1);
      setCurrent(history[historyIndex + 1]);
    }
  }, [historyIndex, history]);

  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < history.length) {
      setHistoryIndex(index);
      setCurrent(history[index]);
    }
  }, [history]);

  const clear = useCallback(() => {
    setHistory([current]);
    setHistoryIndex(0);
  }, [current]);

  return {
    current,
    push,
    goBack,
    goForward,
    goTo,
    clear,
    canGoBack: historyIndex > 0,
    canGoForward: historyIndex < history.length - 1,
    historyLength: history.length,
    historyIndex,
    history,
  };
}

// ============================================================================
// useKBTransactional
// ============================================================================

export interface KBTransactionContext<T> {
  get: () => T;
  set: (value: T | ((prev: T) => T)) => void;
  commit: () => void;
  rollback: () => void;
}

export function useKBTransactional<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [pendingValue, setPendingValue] = useState<T | null>(null);
  const [isInTransaction, setIsInTransaction] = useState(false);

  const beginTransaction = useCallback((): KBTransactionContext<T> => {
    setPendingValue(value);
    setIsInTransaction(true);

    return {
      get: () => pendingValue ?? value,
      set: (newValue) => {
        setPendingValue(prev => {
          const current = prev ?? value;
          return typeof newValue === 'function'
            ? (newValue as (prev: T) => T)(current)
            : newValue;
        });
      },
      commit: () => {
        if (pendingValue !== null) {
          setValue(pendingValue);
        }
        setPendingValue(null);
        setIsInTransaction(false);
      },
      rollback: () => {
        setPendingValue(null);
        setIsInTransaction(false);
      },
    };
  }, [value, pendingValue]);

  const withTransaction = useCallback(async (
    fn: (ctx: KBTransactionContext<T>) => Promise<void> | void
  ) => {
    const ctx = beginTransaction();
    try {
      await fn(ctx);
      ctx.commit();
    } catch {
      ctx.rollback();
      throw new Error('Transaction failed');
    }
  }, [beginTransaction]);

  return {
    value: pendingValue ?? value,
    committedValue: value,
    isInTransaction,
    beginTransaction,
    withTransaction,
  };
}

// ============================================================================
// useKBCheckpoint
// ============================================================================

export function useKBCheckpoint<T>(initialValue: T) {
  const [current, setCurrent] = useState<T>(initialValue);
  const [checkpoints, setCheckpoints] = useState<Map<string, T>>(new Map());
  const autoCheckpointId = useRef(0);

  const createCheckpoint = useCallback((name?: string): string => {
    const id = name || `checkpoint_${autoCheckpointId.current++}`;
    setCheckpoints(prev => new Map(prev).set(id, current));
    return id;
  }, [current]);

  const restoreCheckpoint = useCallback((id: string): boolean => {
    const checkpoint = checkpoints.get(id);
    if (checkpoint !== undefined) {
      setCurrent(checkpoint);
      return true;
    }
    return false;
  }, [checkpoints]);

  const deleteCheckpoint = useCallback((id: string): boolean => {
    setCheckpoints(prev => {
      const next = new Map(prev);
      return next.delete(id) ? next : prev;
    });
    return checkpoints.has(id);
  }, [checkpoints]);

  const clearCheckpoints = useCallback(() => {
    setCheckpoints(new Map());
  }, []);

  const hasCheckpoint = useCallback((id: string): boolean => 
    checkpoints.has(id), [checkpoints]);

  const getCheckpoint = useCallback((id: string): T | undefined => 
    checkpoints.get(id), [checkpoints]);

  const listCheckpoints = useCallback((): string[] => 
    Array.from(checkpoints.keys()), [checkpoints]);

  return {
    current,
    setCurrent,
    createCheckpoint,
    restoreCheckpoint,
    deleteCheckpoint,
    clearCheckpoints,
    hasCheckpoint,
    getCheckpoint,
    listCheckpoints,
    checkpointCount: checkpoints.size,
  };
}

export default useKBUndoRedo;
