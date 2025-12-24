/**
 * KB 2.5 - Streaming Hook Implementation
 * SSE/Streaming support for AI and real-time data
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  KBError,
  KBStreamConfig,
  KBStreamState,
  KBStreamReturn,
  KB_DEFAULT_STREAM_CONFIG,
  KB_ERROR_CODES,
} from './types';
import { createKBError, collectTelemetry } from './useKBBase';

interface UseKBStreamOptions<T> {
  hookName: string;
  operationName?: string;
  config?: Partial<KBStreamConfig>;
  onChunk?: (chunk: string) => void;
  onComplete?: (data: T) => void;
  onError?: (error: KBError) => void;
  parseComplete?: (chunks: string[]) => T;
}

export function useKBStream<T = string>(options: UseKBStreamOptions<T>): KBStreamReturn<T> {
  const {
    hookName,
    operationName = 'stream',
    config: customConfig,
    onChunk,
    onComplete,
    onError,
    parseComplete,
  } = options;

  const config: KBStreamConfig = {
    ...KB_DEFAULT_STREAM_CONFIG,
    ...customConfig,
  };

  // State
  const [state, setState] = useState<KBStreamState<T>>({
    data: null,
    chunks: [],
    totalChunks: 0,
    status: 'idle',
    error: null,
    progress: 0,
    reconnectAttempts: 0,
  });

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stop();
    };
  }, []);

  // Computed states
  const isIdle = state.status === 'idle';
  const isConnecting = state.status === 'connecting';
  const isStreaming = state.status === 'streaming';
  const isComplete = state.status === 'complete';
  const isError = state.status === 'error';

  // Stop streaming
  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    readerRef.current?.cancel();
    readerRef.current = null;
    
    if (isMountedRef.current && state.status === 'streaming') {
      setState(prev => ({
        ...prev,
        status: 'complete',
      }));
    }
  }, [state.status]);

  // Reset state
  const reset = useCallback(() => {
    stop();
    setState({
      data: null,
      chunks: [],
      totalChunks: 0,
      status: 'idle',
      error: null,
      progress: 0,
      reconnectAttempts: 0,
    });
  }, [stop]);

  // Parse SSE line
  const parseSSELine = useCallback((line: string): { type: string; data: string } | null => {
    if (!line || line.startsWith(':')) return null;
    
    if (line.startsWith('data: ')) {
      const data = line.slice(6).trim();
      return { type: 'data', data };
    }
    
    if (line.startsWith('event: ')) {
      const event = line.slice(7).trim();
      return { type: 'event', data: event };
    }
    
    return null;
  }, []);

  // Start streaming
  const start = useCallback(async (url: string, body?: unknown): Promise<void> => {
    const startTime = new Date();
    
    // Reset state
    setState(prev => ({
      ...prev,
      chunks: [],
      totalChunks: 0,
      status: 'connecting',
      error: null,
      progress: 0,
      data: null,
    }));

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(url, {
        method: body ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 429) {
          throw createKBError(KB_ERROR_CODES.RATE_LIMIT, 'Rate limit exceeded, please try again later.', {
            retryable: true,
            details: { status: response.status },
          });
        }
        if (response.status === 402) {
          throw createKBError(KB_ERROR_CODES.RATE_LIMIT, 'Payment required, please add funds.', {
            retryable: false,
            details: { status: response.status },
          });
        }
        throw createKBError(KB_ERROR_CODES.STREAM_ERROR, `Stream error: ${response.status}`, {
          retryable: response.status >= 500,
          details: { status: response.status },
        });
      }

      if (!response.body) {
        throw createKBError(KB_ERROR_CODES.STREAM_ERROR, 'No response body', { retryable: false });
      }

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';
      const allChunks: string[] = [];
      let streamDone = false;

      setState(prev => ({ ...prev, status: 'streaming' }));

      while (!streamDone) {
        const { done, value } = await reader.read();
        
        if (done) break;
        if (!isMountedRef.current) break;

        buffer += decoder.decode(value, { stream: true });

        // Process line-by-line
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.trim() === '' || line.startsWith(':')) continue;

          const parsed = parseSSELine(line);
          if (!parsed) continue;

          if (parsed.data === '[DONE]') {
            streamDone = true;
            break;
          }

          if (parsed.type === 'data') {
            let content = parsed.data;
            
            // Try to parse as JSON if configured
            if (config.parseJson) {
              try {
                const jsonData = JSON.parse(parsed.data);
                content = jsonData.choices?.[0]?.delta?.content || parsed.data;
              } catch {
                // Keep raw data if JSON parse fails
              }
            }

            if (content && content !== parsed.data) {
              allChunks.push(content);
              onChunk?.(content);

              setState(prev => ({
                ...prev,
                chunks: [...prev.chunks, content],
                totalChunks: prev.totalChunks + 1,
              }));
            }
          }
        }
      }

      // Final flush
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.trim() === '' || raw.startsWith(':')) continue;
          if (!raw.startsWith('data: ')) continue;
          
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              allChunks.push(content);
              onChunk?.(content);
            }
          } catch { /* ignore */ }
        }
      }

      // Complete
      if (isMountedRef.current) {
        const finalData = parseComplete 
          ? parseComplete(allChunks) 
          : allChunks.join('') as unknown as T;

        setState(prev => ({
          ...prev,
          status: 'complete',
          data: finalData,
          progress: 100,
        }));

        onComplete?.(finalData);

        collectTelemetry({
          hookName,
          operationName,
          startTime,
          endTime: new Date(),
          durationMs: Date.now() - startTime.getTime(),
          status: 'success',
          retryCount: 0,
          metadata: { totalChunks: allChunks.length },
        });
      }

    } catch (err) {
      if (!isMountedRef.current) return;

      if (err instanceof Error && err.name === 'AbortError') {
        setState(prev => ({ ...prev, status: 'complete' }));
        return;
      }

      const error = err instanceof Error && 'code' in err 
        ? err as unknown as KBError
        : createKBError(KB_ERROR_CODES.STREAM_ERROR, err instanceof Error ? err.message : 'Stream failed', {
            originalError: err,
            retryable: config.autoReconnect,
          });

      // Check for reconnection
      if (config.autoReconnect && state.reconnectAttempts < config.maxReconnects) {
        setState(prev => ({
          ...prev,
          status: 'reconnecting',
          reconnectAttempts: prev.reconnectAttempts + 1,
        }));

        const reconnectDelay = config.reconnectDelayMs * Math.pow(config.reconnectBackoff, state.reconnectAttempts);
        await new Promise(resolve => setTimeout(resolve, reconnectDelay));

        if (isMountedRef.current) {
          return start(url, body);
        }
        return;
      }

      setState(prev => ({
        ...prev,
        status: 'error',
        error,
      }));

      onError?.(error);

      collectTelemetry({
        hookName,
        operationName,
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'error',
        error,
        retryCount: state.reconnectAttempts,
      });
    }
  }, [config, hookName, operationName, onChunk, onComplete, onError, parseComplete, parseSSELine, state.reconnectAttempts]);

  return {
    // State
    data: state.data,
    chunks: state.chunks,
    status: state.status,
    error: state.error,
    progress: state.progress,
    
    // Computed
    isIdle,
    isConnecting,
    isStreaming,
    isComplete,
    isError,
    
    // Controls
    start,
    stop,
    reset,
  };
}

export default useKBStream;
