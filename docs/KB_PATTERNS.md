# KB 3.0 - Knowledge Base Pattern Documentation

Enterprise-grade React hook patterns para aplicaciones 2025-2026+.

## Versiones

| Versión | Features |
|---------|----------|
| KB 2.0 | State Machine, Typed Errors, Retry, Telemetry |
| KB 2.5 | + Circuit Breaker, SSE/Streaming, Smart Cache, OpenTelemetry |
| KB 3.0 | + Suspense-First, Bulkhead Pattern, Query Deduplication |

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

### 3. Circuit Breaker (KB 2.5)

Prevents overwhelming failing services:

```typescript
const hook = useKBBase({
  hookName: 'myHook',
  circuitBreakerConfig: {
    enabled: true,
    failureThreshold: 3,
    resetTimeoutMs: 60000,
  },
});

// Access circuit state
console.log(hook.circuitState); // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
hook.resetCircuit(); // Manual reset
```

### 4. SSE/Streaming (KB 2.5)

Built-in support for Server-Sent Events:

```typescript
const { data, chunks, status, start, stop } = useKBStream<string>({
  hookName: 'useAIChat',
  onChunk: (chunk) => console.log('Received:', chunk),
  onComplete: (data) => console.log('Complete:', data),
});

await start('/api/chat', { message: 'Hello' });
```

---

## KB 3.0 Features

### 5. Suspense-First Design (KB 3.0)

Native React Suspense integration:

```typescript
import { useKBSuspenseQuery, preloadResource } from '@/hooks/core';

// Component using Suspense
function UserProfile({ userId }: { userId: string }) {
  // This will suspend until data is ready
  const { data, refresh } = useKBSuspenseQuery({
    key: `user:${userId}`,
    fetcher: () => fetchUser(userId),
  });

  return <div>{data.name}</div>;
}

// Parent with Suspense boundary
function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <ErrorBoundary fallback={<Error />}>
        <UserProfile userId="123" />
      </ErrorBoundary>
    </Suspense>
  );
}

// Preload for faster navigation
preloadResource('user:123', () => fetchUser('123'));
```

#### Dynamic Resources

```typescript
import { useKBResource } from '@/hooks/core';

const userResource = useKBResource({
  key: (id) => `user:${id}`,
  fetcher: (id) => fetchUser(id),
});

// Preload before navigation
userResource.preload('123');

// In component (inside Suspense)
const data = userResource.read('123');
```

### 6. Bulkhead Pattern (KB 3.0)

Resource isolation and concurrency limiting:

```typescript
import { useKBBulkhead, getBulkheadStats } from '@/hooks/core';

// Create isolated execution pools
const { execute, status, poolState, queuePosition } = useKBBulkhead({
  poolName: 'external-api',
  config: {
    maxConcurrent: 3,     // Max 3 concurrent requests
    maxQueueSize: 50,     // Max 50 queued requests
    queueTimeoutMs: 30000, // 30s queue timeout
    executionTimeoutMs: 60000, // 60s execution timeout
  },
  fn: async (params) => await callExternalAPI(params),
  priority: 5, // Higher = more priority
});

// Execute with automatic queueing
const result = await execute({ id: '123' });

// Monitor pool state
console.log(poolState.activeCount);   // Currently executing
console.log(poolState.queuedCount);   // Waiting in queue
console.log(queuePosition);           // Your position in queue (if queued)

// Get all pools stats
const allStats = getBulkheadStats();
```

#### Utility Functions

```typescript
import { executeWithBulkhead, withBulkhead } from '@/hooks/core';

// One-off execution
const data = await executeWithBulkhead('api-pool', fetchData, {
  priority: 10,
  timeoutMs: 5000,
});

// Decorator pattern
const limitedFetch = withBulkhead('api-pool', fetchData, { priority: 5 });
const result = await limitedFetch();
```

### 7. Query Deduplication (KB 3.0)

Automatic deduplication of concurrent identical queries:

```typescript
import { useKBQueryDedup, prefetchQuery, invalidateQueries } from '@/hooks/core';

function UserList() {
  const { 
    data, 
    isLoading, 
    isFetching, // True during background refetch
    isStale,    // True if data is stale
    refetch,
    invalidate,
  } = useKBQueryDedup({
    key: 'users',
    fetcher: () => fetchUsers(),
    staleTime: 5 * 60 * 1000,      // 5 minutes
    refetchInterval: 30000,         // Auto-refetch every 30s
    refetchOnWindowFocus: true,    // Refetch when tab gains focus
  });

  return (
    <div>
      {isLoading && <Spinner />}
      {data?.map(user => <User key={user.id} {...user} />)}
      {isFetching && !isLoading && <RefreshIndicator />}
    </div>
  );
}

// Prefetch for navigation
await prefetchQuery('users', fetchUsers);

// Invalidate queries by prefix
invalidateQueries('user*'); // Invalidates 'users', 'user:123', etc.
```

#### Query Data Manipulation

```typescript
import { getQueryData, setQueryData } from '@/hooks/core';

// Optimistic update
const currentData = getQueryData<User[]>('users');
setQueryData('users', [...currentData, newUser]);

// Query will automatically refetch if stale
```

---

## Usage Patterns

### Combined KB 3.0 Pattern

```typescript
// High-priority API with Bulkhead + Deduplication
function useCriticalData(id: string) {
  const bulkhead = useKBBulkhead({
    poolName: 'critical',
    config: { maxConcurrent: 2, maxQueueSize: 10 },
    fn: (id) => fetchCriticalData(id),
    priority: 10,
  });

  const query = useKBQueryDedup({
    key: `critical:${id}`,
    fetcher: () => bulkhead.execute(id),
    staleTime: 60000,
  });

  return query;
}
```

### Suspense + Bulkhead

```typescript
function ExpensiveComponent({ id }: { id: string }) {
  const resource = useKBResource({
    key: (id) => `expensive:${id}`,
    fetcher: async (id) => {
      // Uses bulkhead for rate limiting
      return executeWithBulkhead('expensive-pool', () => 
        fetchExpensiveData(id)
      );
    },
  });

  const data = resource.read(id); // Suspends
  return <Display data={data} />;
}
```

---

## File Structure

```
src/
├── hooks/core/
│   ├── index.ts           # All exports
│   ├── types.ts           # Type definitions (KB 3.0)
│   ├── useKBBase.ts       # Base hook + Circuit Breaker
│   ├── useKBQuery.ts      # Query hook
│   ├── useKBMutation.ts   # Mutation hook
│   ├── useKBStream.ts     # Streaming hook (KB 2.5)
│   ├── useKBSuspense.ts   # Suspense hooks (KB 3.0)
│   ├── useKBBulkhead.ts   # Bulkhead pattern (KB 3.0)
│   └── useKBQueryDedup.ts # Query deduplication (KB 3.0)
├── lib/
│   ├── kbTelemetry.ts     # OpenTelemetry utilities
│   └── kbCache.ts         # Smart cache layer
```

---

## Best Practices

### KB 3.0 Specific

1. **Use Suspense for data fetching**
   - Cleaner components without loading states
   - Better streaming SSR support

2. **Configure Bulkheads per resource type**
   - Separate pools for different API endpoints
   - Prevent cascade failures

3. **Enable Query Deduplication**
   - Reduces redundant network requests
   - Automatic background refetching

4. **Set appropriate priorities**
   - Critical operations get higher priority
   - Background syncs get lower priority

5. **Monitor pool states**
   - Use `getBulkheadStats()` for observability
   - Alert on high queue sizes

---

## Migration Guide

### From KB 2.5 to KB 3.0

KB 3.0 is fully backward compatible. New features are opt-in:

```typescript
// KB 2.5 - Works unchanged
const { data, isLoading } = useKBQuery({ ... });

// KB 3.0 - Optional Suspense
const { data } = useKBSuspenseQuery({ ... }); // Requires Suspense boundary

// KB 3.0 - Optional Bulkhead
const { execute } = useKBBulkhead({ ... });

// KB 3.0 - Optional Deduplication
const { data, isFetching } = useKBQueryDedup({ ... });
```

---

## Version History

- **KB 3.0** (Current)
  - Suspense-First Design
  - Bulkhead Pattern
  - Query Deduplication
  - Resource preloading
  - Priority-based queueing

- **KB 2.5**
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
