# KB 2.5 - Knowledge Base Pattern Documentation

## Overview

KB 2.5 is an enterprise-grade hook pattern system for React applications, designed for 2025-2026+. It provides a robust foundation for managing asynchronous operations with built-in resilience, observability, and performance features.

## Core Features

### 1. State Machine

Every KB hook follows a strict state machine:

```typescript
type KBStatus = 'idle' | 'loading' | 'success' | 'error' | 'retrying' | 'cancelled';
```

**States:**
- `idle`: Initial state, no operation in progress
- `loading`: Operation is executing
- `success`: Operation completed successfully
- `error`: Operation failed after all retries
- `retrying`: Operation failed, attempting retry
- `cancelled`: Operation was cancelled by user

### 2. Typed Errors

All errors are standardized:

```typescript
interface KBError {
  code: string;           // Error code (e.g., 'NETWORK_ERROR')
  message: string;        // Human-readable message
  details?: Record<string, unknown>;  // Additional context
  timestamp: Date;        // When the error occurred
  retryable: boolean;     // Can this operation be retried?
  originalError?: unknown; // Original error object
}
```

**Built-in Error Codes:**
- `NETWORK_ERROR` - Network connectivity issues
- `TIMEOUT` - Request timeout
- `CANCELLED` - User cancelled operation
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Permission denied
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed
- `RATE_LIMIT` - Too many requests
- `SERVER_ERROR` - Server-side error
- `CIRCUIT_OPEN` - Circuit breaker is open
- `STREAM_ERROR` - Streaming error
- `MAX_RECONNECTS` - Max reconnection attempts reached

### 3. Retry Logic

Automatic retry with exponential backoff:

```typescript
interface KBRetryConfig {
  maxRetries: number;      // Default: 3
  baseDelayMs: number;     // Default: 1000
  maxDelayMs: number;      // Default: 30000
  backoffMultiplier: number; // Default: 2
  retryableErrors?: string[]; // Codes that trigger retry
}
```

### 4. Circuit Breaker (KB 2.5)

Prevents overwhelming failing services:

```typescript
interface KBCircuitBreakerConfig {
  failureThreshold: number;  // Failures before opening (default: 5)
  resetTimeoutMs: number;    // Time before half-open (default: 30000)
  successThreshold: number;  // Successes to close (default: 2)
  enabled: boolean;          // Enable/disable feature
}
```

**States:**
- `CLOSED`: Normal operation, requests flow through
- `OPEN`: Service unhealthy, requests fail immediately
- `HALF_OPEN`: Testing if service recovered

### 5. SSE/Streaming (KB 2.5)

Built-in support for Server-Sent Events:

```typescript
const { data, chunks, status, start, stop } = useKBStream<string>({
  hookName: 'useAIChat',
  onChunk: (chunk) => console.log('Received:', chunk),
  onComplete: (data) => console.log('Complete:', data),
});

// Start streaming
await start('/api/chat', { message: 'Hello' });
```

### 6. Smart Cache (KB 2.5)

Intelligent caching with stale-while-revalidate:

```typescript
import { getWithSWR, invalidateCacheEntry } from '@/lib/kbCache';

const result = await getWithSWR(
  'user-profile',
  () => fetchProfile(),
  { staleTime: 5 * 60 * 1000 }
);

if (result.isStale) {
  // Data is stale but returned immediately
  // Fresh data will be fetched in background
}
```

### 7. OpenTelemetry Telemetry (KB 2.5)

Distributed tracing support:

```typescript
import { startSpan, endSpan, trace } from '@/lib/kbTelemetry';

// Manual span management
const span = startSpan('fetchUserData');
try {
  const data = await fetchUser();
  endSpan(span.spanId, 'OK');
} catch (error) {
  endSpan(span.spanId, 'ERROR');
}

// Automatic tracing
const result = await trace('fetchUserData', () => fetchUser());
```

## Usage Examples

### Basic Query Hook

```typescript
import { useKBQuery } from '@/hooks/core';

function useUserProfile(userId: string) {
  return useKBQuery({
    hookName: 'useUserProfile',
    queryFn: () => supabase.from('profiles').select('*').eq('id', userId).single(),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    onError: (error) => toast.error(error.message),
  });
}
```

### Mutation with Optimistic Updates

```typescript
import { useKBMutation } from '@/hooks/core';

function useUpdateProfile() {
  return useKBMutation({
    hookName: 'useUpdateProfile',
    mutationFn: (data) => supabase.from('profiles').update(data).eq('id', data.id),
    onMutate: (data) => {
      // Optimistic update
      queryClient.setQueryData(['profile', data.id], data);
      return { previousData: queryClient.getQueryData(['profile', data.id]) };
    },
    onError: (error, data, context) => {
      // Rollback
      queryClient.setQueryData(['profile', data.id], context.previousData);
    },
  });
}
```

### Streaming AI Response

```typescript
import { useKBStream } from '@/hooks/core';

function useAIChat() {
  const stream = useKBStream<string>({
    hookName: 'useAIChat',
    onChunk: (chunk) => {
      // Update UI with each token
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: m.content + chunk } : m
          );
        }
        return [...prev, { role: 'assistant', content: chunk }];
      });
    },
  });

  const sendMessage = async (message: string) => {
    await stream.start(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
      { messages: [...messages, { role: 'user', content: message }] }
    );
  };

  return { ...stream, sendMessage };
}
```

### With Circuit Breaker

```typescript
import { useKBBase } from '@/hooks/core';

function useExternalAPI() {
  return useKBBase({
    hookName: 'useExternalAPI',
    circuitBreakerConfig: {
      enabled: true,
      failureThreshold: 3,
      resetTimeoutMs: 60000,
    },
    onError: (error) => {
      if (error.code === 'CIRCUIT_OPEN') {
        toast.error('Service temporarily unavailable. Please try again later.');
      }
    },
  });
}
```

## Migration from KB 2.0

KB 2.5 is fully backward compatible with KB 2.0. New features are opt-in:

### Enable Circuit Breaker

```typescript
// Before (KB 2.0)
const hook = useKBBase({ hookName: 'myHook' });

// After (KB 2.5)
const hook = useKBBase({
  hookName: 'myHook',
  circuitBreakerConfig: { enabled: true },
});
```

### Use Smart Cache

```typescript
// Import and use cache utilities
import { getWithSWR, setCacheEntry, getCacheEntry } from '@/lib/kbCache';
```

### Add Telemetry

```typescript
// Import and use telemetry
import { startSpan, endSpan, telemetryProvider, ConsoleExporter } from '@/lib/kbTelemetry';

// Add exporter in app initialization
telemetryProvider.addExporter(new ConsoleExporter());
telemetryProvider.startAutoExport(10000);
```

## Best Practices

1. **Always use hookName**: Helps with debugging and telemetry
2. **Handle all error codes**: Especially `CIRCUIT_OPEN` for circuit breaker
3. **Configure staleTime**: Reduce unnecessary network requests
4. **Use streaming for AI**: Better UX with token-by-token updates
5. **Enable telemetry in production**: Use BatchExporter for observability
6. **Configure circuit breaker thresholds**: Based on your SLA requirements

## File Structure

```
src/
├── hooks/core/
│   ├── index.ts           # Exports
│   ├── types.ts           # Type definitions
│   ├── useKBBase.ts       # Base hook with circuit breaker
│   ├── useKBQuery.ts      # Query hook
│   ├── useKBMutation.ts   # Mutation hook
│   └── useKBStream.ts     # Streaming hook
├── lib/
│   ├── kbTelemetry.ts     # OpenTelemetry utilities
│   └── kbCache.ts         # Smart cache layer
```

## Version History

- **KB 2.5** (Current)
  - Circuit Breaker Pattern
  - SSE/Streaming Support
  - OpenTelemetry Integration
  - Smart Cache Layer
  - Offline Support

- **KB 2.0**
  - State Machine
  - Typed Errors
  - Exponential Retry
  - Cancellation Support
  - Basic Telemetry
