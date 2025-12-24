# Knowledge Base - Patrones de Implementación Enterprise SaaS 2025-2026

## Tabla de Contenidos

1. [Patrón de Hook Principal](#patrón-de-hook-principal)
2. [Patrón de Optimistic Updates](#patrón-de-optimistic-updates)
3. [Patrón de Error Handling con Discriminated Unions](#patrón-de-error-handling-con-discriminated-unions)
4. [Patrón de Request Deduplication](#patrón-de-request-deduplication)
5. [Patrón de Retry con Backoff Exponencial](#patrón-de-retry-con-backoff-exponencial)
6. [Patrón de Edge Function con IA](#patrón-de-edge-function-con-ia)
7. [Patrón de Componente UI](#patrón-de-componente-ui)

---

## Patrón de Hook Principal

### Estructura Estándar para Hooks Admin

Todos los hooks en `src/hooks/admin/` deben seguir este patrón:

```typescript
// src/hooks/admin/use{NombreModulo}.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES DE ERROR TIPADO ===
export interface ModuloError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ModuloItem {
  id: string;
  // Propiedades específicas del módulo
  created_at: string;
  updated_at: string;
}

export interface ModuloContext {
  entityId: string;
  entityName?: string;
  currentData: Record<string, unknown>;
}

// === HOOK ===
export function use{NombreModulo}() {
  // Estado obligatorio según KB
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ModuloItem[]>([]);
  const [error, setError] = useState<ModuloError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Ref para auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === CLEAR ERROR ===
  const clearError = useCallback(() => setError(null), []);

  // === FETCH DE DATOS ===
  const fetchData = useCallback(async (context?: ModuloContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        '{nombre-funcion}',
        { body: { action: 'get_data', context } }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        setData(fnData.data);
        setLastRefresh(new Date());
        return fnData.data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError({
        code: 'FETCH_ERROR',
        message,
        details: { originalError: err }
      });
      console.error(`[use{NombreModulo}] fetchData error:`, err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: ModuloContext, intervalMs = 60000) => {
    stopAutoRefresh();
    fetchData(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchData(context);
    }, intervalMs);
  }, [fetchData]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  // === RETURN ===
  return {
    // Estado
    isLoading,
    data,
    error,
    lastRefresh,
    // Acciones
    fetchData,
    clearError,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default use{NombreModulo};
```

### Checklist de Compliance KB

- [ ] `lastRefresh: Date | null` - Estado de última actualización
- [ ] `error: TypedError | null` - Error con interfaz tipada
- [ ] `clearError()` - Método para limpiar errores
- [ ] `startAutoRefresh(context, intervalMs)` - Iniciar auto-refresh
- [ ] `stopAutoRefresh()` - Detener auto-refresh
- [ ] `useEffect` cleanup para stopAutoRefresh

---

## Patrón de Optimistic Updates

### Descripción
Las actualizaciones optimistas mejoran la UX mostrando cambios inmediatamente antes de confirmar con el servidor.

### Implementación con TanStack Query

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface OptimisticContext<T> {
  previousData: T | undefined;
}

export function useOptimisticMutation<TData, TVariables>(
  queryKey: string[],
  mutationFn: (variables: TVariables) => Promise<TData>,
  updateFn: (old: TData | undefined, variables: TVariables) => TData
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables, OptimisticContext<TData>>({
    mutationFn,
    
    // Antes de la mutación: guardar estado anterior y actualizar optimísticamente
    onMutate: async (variables) => {
      // Cancelar queries en progreso para evitar sobrescritura
      await queryClient.cancelQueries({ queryKey });
      
      // Guardar snapshot del estado anterior
      const previousData = queryClient.getQueryData<TData>(queryKey);
      
      // Actualizar cache optimísticamente
      queryClient.setQueryData<TData>(queryKey, (old) => updateFn(old, variables));
      
      // Retornar contexto para rollback
      return { previousData };
    },
    
    // En caso de error: revertir al estado anterior
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error(`Error: ${err.message}`);
    },
    
    // Siempre: invalidar para sincronizar con servidor
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    
    // En éxito: notificar al usuario
    onSuccess: () => {
      toast.success('Cambios guardados');
    },
  });
}
```

### Ejemplo de Uso

```typescript
// En un componente
const updateTask = useOptimisticMutation(
  ['tasks', projectId],
  (task: Task) => api.updateTask(task),
  (old, newTask) => old?.map(t => t.id === newTask.id ? newTask : t) ?? []
);

// Llamar
updateTask.mutate({ id: '123', status: 'completed' });
```

---

## Patrón de Error Handling con Discriminated Unions

### Descripción
Uso de uniones discriminadas para manejar estados de forma type-safe.

### Implementación

```typescript
// === TIPOS BASE ===
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  recoverable: boolean;
}

// === DISCRIMINATED UNION PARA RESULTADO ASYNC ===
export type AsyncResult<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T; timestamp: Date }
  | { status: 'error'; error: AppError };

// === HOOK HELPER ===
export function useAsyncResult<T>() {
  const [result, setResult] = useState<AsyncResult<T>>({ status: 'idle' });

  const execute = useCallback(async (fn: () => Promise<T>) => {
    setResult({ status: 'loading' });
    
    try {
      const data = await fn();
      setResult({ 
        status: 'success', 
        data, 
        timestamp: new Date() 
      });
      return data;
    } catch (err) {
      const error: AppError = {
        code: err instanceof Error ? err.name : 'UNKNOWN_ERROR',
        message: err instanceof Error ? err.message : 'Error desconocido',
        timestamp: new Date(),
        recoverable: true,
      };
      setResult({ status: 'error', error });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setResult({ status: 'idle' });
  }, []);

  return { result, execute, reset };
}
```

### Uso en Componentes

```typescript
function DataDisplay<T>({ result }: { result: AsyncResult<T> }) {
  switch (result.status) {
    case 'idle':
      return <Placeholder />;
    case 'loading':
      return <Skeleton />;
    case 'success':
      return <DataView data={result.data} />;
    case 'error':
      return <ErrorDisplay error={result.error} />;
  }
}
```

### Beneficios
- Type-safety completo en runtime
- Exhaustive checking con switch
- Estados claramente definidos
- No hay estados "imposibles"

---

## Patrón de Request Deduplication

### Descripción
Evita requests duplicados cuando múltiples componentes solicitan los mismos datos simultáneamente.

### Implementación

```typescript
// src/lib/requestDeduplication.ts

type PendingRequest = Promise<unknown>;
const pendingRequests = new Map<string, PendingRequest>();

/**
 * Ejecuta una función async, deduplicando requests con la misma key
 * Si ya hay un request en progreso con la misma key, retorna esa promesa
 */
export async function deduplicatedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Si ya hay un request pendiente con esta key, retornarlo
  const existing = pendingRequests.get(key);
  if (existing) {
    console.log(`[Dedup] Reutilizando request existente: ${key}`);
    return existing as Promise<T>;
  }

  // Crear nueva promesa y registrarla
  const promise = fetchFn().finally(() => {
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, promise);
  console.log(`[Dedup] Nuevo request registrado: ${key}`);
  
  return promise;
}

/**
 * Genera una key única para un request basado en URL y params
 */
export function createRequestKey(
  endpoint: string, 
  params?: Record<string, unknown>
): string {
  const sortedParams = params 
    ? JSON.stringify(Object.entries(params).sort())
    : '';
  return `${endpoint}:${sortedParams}`;
}

/**
 * Limpia todas las requests pendientes (útil en cleanup)
 */
export function clearPendingRequests(): void {
  pendingRequests.clear();
}

/**
 * Obtiene el número de requests pendientes (útil para debugging)
 */
export function getPendingRequestsCount(): number {
  return pendingRequests.size;
}
```

### Uso en Hooks

```typescript
const fetchCompanyData = useCallback(async (companyId: string) => {
  const key = createRequestKey('company-data', { companyId });
  
  return deduplicatedFetch(key, async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();
    
    if (error) throw error;
    return data;
  });
}, []);
```

---

## Patrón de Retry con Backoff Exponencial

### Descripción
Reintentos automáticos con incremento exponencial del tiempo de espera para manejar errores transitorios.

### Implementación

```typescript
// src/lib/retryWithBackoff.ts

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error, nextDelayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'retryableErrors'>> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Ejecuta una función con reintentos y backoff exponencial
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;
  let currentDelay = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Verificar si el error es retriable
      if (config.retryableErrors?.length) {
        const isRetryable = config.retryableErrors.some(
          code => lastError.message.includes(code) || lastError.name === code
        );
        if (!isRetryable) throw lastError;
      }

      // No reintentar en el último intento
      if (attempt === config.maxAttempts) {
        throw lastError;
      }

      // Calcular delay con jitter para evitar thundering herd
      const jitter = Math.random() * 0.3 * currentDelay;
      const delayWithJitter = currentDelay + jitter;
      
      // Callback de notificación
      config.onRetry?.(attempt, lastError, delayWithJitter);
      
      console.log(
        `[Retry] Intento ${attempt}/${config.maxAttempts} fallido. ` +
        `Reintentando en ${Math.round(delayWithJitter)}ms...`
      );

      // Esperar antes del próximo intento
      await new Promise(resolve => setTimeout(resolve, delayWithJitter));

      // Incrementar delay para el próximo intento
      currentDelay = Math.min(
        currentDelay * config.backoffMultiplier,
        config.maxDelayMs
      );
    }
  }

  throw lastError!;
}

/**
 * Wrapper para operaciones de Supabase con retry automático
 */
export async function withSupabaseRetry<T>(
  operation: () => Promise<{ data: T | null; error: Error | null }>
): Promise<T> {
  return withRetry(async () => {
    const { data, error } = await operation();
    if (error) throw error;
    if (!data) throw new Error('No data returned');
    return data;
  }, {
    maxAttempts: 3,
    initialDelayMs: 500,
    retryableErrors: ['PGRST', 'FetchError', 'NetworkError'],
  });
}
```

### Ejemplo de Uso

```typescript
// Con opciones personalizadas
const data = await withRetry(
  () => fetchCriticalData(),
  {
    maxAttempts: 5,
    initialDelayMs: 2000,
    onRetry: (attempt, error, delay) => {
      toast.warning(`Reintentando... (${attempt}/5)`);
      console.log(`Error: ${error.message}, próximo intento en ${delay}ms`);
    },
  }
);

// Para operaciones Supabase
const company = await withSupabaseRetry(() =>
  supabase.from('companies').select('*').eq('id', companyId).single()
);
```

---

## Patrón de Edge Function con IA

### Estructura Estándar

```typescript
// supabase/functions/{nombre-funcion}/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FunctionRequest {
  action: 'get_data' | 'analyze' | 'predict' | 'generate';
  context?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

serve(async (req) => {
  // === CORS ===
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === VALIDATE API KEY ===
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { action, context, params } = await req.json() as FunctionRequest;

    // === DYNAMIC PROMPT SELECTION ===
    const { systemPrompt, userPrompt } = buildPrompts(action, context, params);

    console.log(`[{nombre-funcion}] Processing action: ${action}`);

    // === AI CALL ===
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    // === ERROR HANDLING ===
    if (!response.ok) {
      return handleAIError(response.status, corsHeaders);
    }

    // === PARSE & RETURN ===
    const data = await response.json();
    const result = parseAIResponse(data);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[{nombre-funcion}] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// === HELPER FUNCTIONS ===
function buildPrompts(action: string, context?: unknown, params?: unknown) {
  // Implementar según acción
  return { systemPrompt: '', userPrompt: '' };
}

function handleAIError(status: number, headers: Record<string, string>) {
  const errors: Record<number, { error: string; message: string }> = {
    429: { error: 'Rate limit exceeded', message: 'Demasiadas solicitudes' },
    402: { error: 'Payment required', message: 'Créditos insuficientes' },
  };
  
  const errorInfo = errors[status] || { error: 'AI error', message: 'Error de IA' };
  
  return new Response(JSON.stringify(errorInfo), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

function parseAIResponse(data: unknown): unknown {
  const content = (data as any)?.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content in AI response');
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { rawContent: content };
  } catch {
    return { rawContent: content, parseError: true };
  }
}
```

---

## Patrón de Componente UI

### Estructura Estándar para Paneles Admin

```typescript
// src/components/admin/{nombre-modulo}/{NombreModulo}Panel.tsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Sparkles, Activity, AlertTriangle, Maximize2, Minimize2 } from 'lucide-react';
import { use{NombreModulo} } from '@/hooks/admin/use{NombreModulo}';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface {NombreModulo}PanelProps {
  context: ModuloContext | null;
  onDataUpdate?: (data: unknown) => void;
  className?: string;
}

export function {NombreModulo}Panel({ 
  context, 
  onDataUpdate,
  className 
}: {NombreModulo}PanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('main');

  const {
    isLoading,
    data,
    error,
    lastRefresh,
    fetchData,
    startAutoRefresh,
    stopAutoRefresh
  } = use{NombreModulo}();

  // === AUTO-REFRESH EN MOUNT ===
  useEffect(() => {
    if (context) {
      startAutoRefresh(context, 90000);
    } else {
      stopAutoRefresh();
    }
    return () => stopAutoRefresh();
  }, [context?.entityId, startAutoRefresh, stopAutoRefresh]);

  // === HANDLERS ===
  const handleRefresh = useCallback(async () => {
    if (context) {
      await fetchData(context);
      onDataUpdate?.(data);
    }
  }, [context, fetchData, data, onDataUpdate]);

  // === ESTADO INACTIVO ===
  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Activity className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Selecciona una entidad para activar el módulo
          </p>
        </CardContent>
      </Card>
    );
  }

  // === RENDER PRINCIPAL ===
  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded && "fixed inset-4 z-50 shadow-2xl",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">{NombreModulo}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Sincronizando...'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded && "h-[calc(100%-80px)]")}>
        {error ? (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {error.message}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-3">
              <TabsTrigger value="main">Principal</TabsTrigger>
              <TabsTrigger value="analysis">Análisis</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="main">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[300px]"}>
                {/* Contenido del tab */}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Patrón de Testing para Hooks

### Descripción
Patrón estándar para testing de hooks admin usando Vitest y Testing Library.

### Implementación

```typescript
// src/hooks/admin/__tests__/useModuleName.test.ts

import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useModuleName } from '../useModuleName';

// Mock de Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { 
      invoke: vi.fn().mockResolvedValue({ 
        data: { success: true, data: [] }, 
        error: null 
      }) 
    },
    from: vi.fn(() => ({ 
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

describe('useModuleName', () => {
  beforeEach(() => { 
    vi.clearAllMocks(); 
  });
  
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useModuleName());
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.lastRefresh).toBeNull();
  });

  it('should fetch data successfully', async () => {
    const mockData = [{ id: '1', name: 'Test' }];
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: { success: true, data: mockData },
      error: null,
    });

    const { result } = renderHook(() => useModuleName());
    
    await act(async () => {
      await result.current.fetchData();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.lastRefresh).toBeInstanceOf(Date);
    });
  });

  it('should handle errors correctly', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: new Error('API Error'),
    });

    const { result } = renderHook(() => useModuleName());
    
    await act(async () => {
      await result.current.fetchData();
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.code).toBe('FETCH_ERROR');
    });
  });

  it('should clear error when clearError is called', async () => {
    const { result } = renderHook(() => useModuleName());
    
    // Simulate error state
    await act(async () => {
      result.current.fetchData(); // Will fail with mock
    });

    await act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
```

### Testing de Edge Functions

```typescript
// supabase/functions/tests/{nombre-funcion}.test.ts

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/testing/asserts.ts";

const BASE_URL = "http://localhost:54321/functions/v1";

Deno.test("function-name - should handle OPTIONS request", async () => {
  const response = await fetch(`${BASE_URL}/function-name`, {
    method: "OPTIONS",
  });
  
  assertEquals(response.status, 200);
  assertExists(response.headers.get("Access-Control-Allow-Origin"));
});

Deno.test("function-name - should return success for valid action", async () => {
  const response = await fetch(`${BASE_URL}/function-name`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": "Bearer test-token"
    },
    body: JSON.stringify({ action: "get_data" }),
  });
  
  assertEquals(response.status, 200);
  
  const data = await response.json();
  assertEquals(data.success, true);
  assertExists(data.data);
  assertExists(data.timestamp);
});

Deno.test("function-name - should handle invalid action", async () => {
  const response = await fetch(`${BASE_URL}/function-name`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": "Bearer test-token"
    },
    body: JSON.stringify({ action: "invalid_action" }),
  });
  
  assertEquals(response.status, 500);
  
  const data = await response.json();
  assertEquals(data.success, false);
  assertExists(data.error);
});

Deno.test("function-name - should handle rate limiting gracefully", async () => {
  // Test 429 response handling
  const response = await fetch(`${BASE_URL}/function-name`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "X-Test-Rate-Limit": "true" // Header to trigger rate limit in test mode
    },
    body: JSON.stringify({ action: "get_data" }),
  });
  
  if (response.status === 429) {
    const data = await response.json();
    assertExists(data.error);
    assertExists(data.message);
  }
});
```

---

## Patrón de Observabilidad y Logging

### Descripción
Uso del ObservabilityManager para instrumentación de hooks y componentes.

### Implementación en Hooks

```typescript
// src/hooks/admin/useModuleName.ts

import { observability } from '@/lib/observability';

export function useModuleName() {
  const fetchData = useCallback(async (context?: ModuloContext) => {
    // Iniciar span de observabilidad
    const spanId = observability.startSpan('module.fetchData', {
      kind: 'client',
      attributes: { 
        'module.name': 'ModuleName',
        'context.entityId': context?.entityId 
      }
    });
    
    setIsLoading(true);
    setError(null);

    try {
      const startTime = performance.now();
      
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'function-name',
        { body: { action: 'get_data', context } }
      );

      const duration = performance.now() - startTime;
      
      // Registrar métricas
      observability.recordHistogram('module.fetch.duration', duration, { 
        module: 'module_name',
        success: String(!fnError)
      });

      if (fnError) {
        observability.addSpanEvent(spanId, 'error', { 
          message: fnError.message,
          code: fnError.code
        });
        throw fnError;
      }

      if (fnData?.success && fnData?.data) {
        observability.recordCounter('module.fetch.success', 1, { 
          module: 'module_name' 
        });
        observability.endSpan(spanId, 'ok');
        
        setData(fnData.data);
        setLastRefresh(new Date());
        return fnData.data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      observability.recordCounter('module.fetch.error', 1, { 
        module: 'module_name',
        error_type: err instanceof Error ? err.name : 'unknown'
      });
      observability.endSpan(spanId, 'error');
      
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError({
        code: 'FETCH_ERROR',
        message,
        details: { originalError: err }
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { /* ... */ };
}
```

### Métricas Estándar por Módulo

```typescript
// Contadores - eventos discretos
observability.recordCounter('module.action.count', 1, { 
  module: 'business_intelligence', 
  action: 'fetch' 
});

observability.recordCounter('module.error.count', 1, { 
  module: 'support', 
  error_code: 'NETWORK_ERROR' 
});

// Histogramas - distribuciones de valores
observability.recordHistogram('module.action.duration', durationMs, { 
  module: 'business_intelligence',
  action: 'analyze'
});

observability.recordHistogram('module.data.size', dataLength, { 
  module: 'reports' 
});

// Gauges - valores puntuales
observability.recordGauge('module.active_sessions', count, { 
  module: 'support' 
});

observability.recordGauge('module.queue_size', queueLength, { 
  module: 'ai_tasks' 
});
```

### Instrumentación de Componentes

```typescript
// src/components/admin/ModulePanel.tsx

import { useObservability } from '@/hooks/useObservability';

export function ModulePanel({ context }: ModulePanelProps) {
  const { traceFunction, recordEvent, log } = useObservability({
    componentName: 'ModulePanel',
    trackMounts: true,
    trackRenders: true,
  });

  const handleAction = traceFunction('handleAction', async (actionType: string) => {
    recordEvent('action_started', { actionType });
    
    try {
      await performAction(actionType);
      recordEvent('action_completed', { actionType, success: true });
    } catch (error) {
      log('error', 'Action failed', { actionType, error });
      recordEvent('action_failed', { actionType, error: String(error) });
    }
  });

  return (
    <Card>
      <Button onClick={() => handleAction('analyze')}>
        Analizar
      </Button>
    </Card>
  );
}
```

---

## Patrones de Estado Avanzados (Opcional)

### Descripción
Patrones opcionales para módulos con estado complejo. Usar solo cuando los hooks básicos son insuficientes.

### Patrón de Store Modular con Zustand

```typescript
// src/stores/moduleStore.ts
// NOTA: Requiere instalar zustand: npm install zustand

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface ModuleError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface ModuleData {
  id: string;
  name: string;
  // ... otras propiedades
}

interface ModuleSlice {
  // Estado
  data: ModuleData[];
  isLoading: boolean;
  error: ModuleError | null;
  lastRefresh: Date | null;
  
  // Acciones
  fetchData: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useModuleStore = create<ModuleSlice>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        data: [],
        isLoading: false,
        error: null,
        lastRefresh: null,

        // Acciones
        fetchData: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const { data, error } = await supabase.functions.invoke('module-fn', {
              body: { action: 'get_data' }
            });
            
            if (error) throw error;
            
            set({ 
              data: data.data, 
              isLoading: false,
              lastRefresh: new Date()
            });
          } catch (err) {
            set({ 
              error: {
                code: 'FETCH_ERROR',
                message: err instanceof Error ? err.message : 'Error desconocido',
                details: { originalError: err }
              },
              isLoading: false 
            });
          }
        },

        clearError: () => set({ error: null }),
        
        reset: () => set({ 
          data: [], 
          isLoading: false, 
          error: null, 
          lastRefresh: null 
        }),
      }),
      { 
        name: 'module-storage',
        partialize: (state) => ({ data: state.data }) // Solo persistir data
      }
    ),
    { name: 'ModuleStore' }
  )
);
```

### Patrón de Contexto Optimizado

```typescript
// src/contexts/ModuleContext.tsx

import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react';

// Tipos
interface ModuleState {
  data: ModuleData[];
  isLoading: boolean;
  error: ModuleError | null;
  lastRefresh: Date | null;
}

type ModuleAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: ModuleData[] }
  | { type: 'FETCH_ERROR'; payload: ModuleError }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

// Estado inicial
const initialState: ModuleState = {
  data: [],
  isLoading: false,
  error: null,
  lastRefresh: null,
};

// Reducer
function moduleReducer(state: ModuleState, action: ModuleAction): ModuleState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      return { 
        ...state, 
        data: action.payload, 
        isLoading: false,
        lastRefresh: new Date()
      };
    case 'FETCH_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// Contexto
interface ModuleContextValue extends ModuleState {
  fetchData: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const ModuleContext = createContext<ModuleContextValue | null>(null);

// Provider
export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(moduleReducer, initialState);

  const fetchData = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    
    try {
      const { data, error } = await supabase.functions.invoke('module-fn', {
        body: { action: 'get_data' }
      });
      
      if (error) throw error;
      dispatch({ type: 'FETCH_SUCCESS', payload: data.data });
    } catch (err) {
      dispatch({ 
        type: 'FETCH_ERROR', 
        payload: {
          code: 'FETCH_ERROR',
          message: err instanceof Error ? err.message : 'Error desconocido'
        }
      });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Memoizar para evitar re-renders innecesarios
  const contextValue = useMemo<ModuleContextValue>(() => ({
    ...state,
    fetchData,
    clearError,
    reset,
  }), [state, fetchData, clearError, reset]);

  return (
    <ModuleContext.Provider value={contextValue}>
      {children}
    </ModuleContext.Provider>
  );
}

// Hook de consumo
export function useModuleContext() {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModuleContext must be used within ModuleProvider');
  }
  return context;
}
```

### Cuándo Usar Cada Patrón

| Patrón | Cuándo Usar | Complejidad |
|--------|-------------|-------------|
| Hook Básico (KB) | Mayoría de casos, estado local | Baja |
| Zustand Store | Estado compartido entre componentes no relacionados | Media |
| Context + Reducer | Estado compartido en árbol de componentes | Media |
| TanStack Query | Datos del servidor con cache automático | Media-Alta |

---

## Patrones AI-First (RAG y Multi-Agent)

### Patrón de RAG con Embeddings

Para módulos que requieran búsqueda semántica avanzada con Retrieval-Augmented Generation.

```typescript
// src/hooks/admin/useRAGModule.ts

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// === INTERFACES ===
export interface RAGError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface DocumentChunk {
  id: string;
  content: string;
  embedding?: number[];
  metadata: {
    source: string;
    page?: number;
    section?: string;
  };
  similarity_score?: number;
}

export interface RAGContext {
  query: string;
  topK: number;
  relevanceThreshold: number;
  filters?: Record<string, unknown>;
}

export interface RAGResponse {
  chunks: DocumentChunk[];
  generatedAnswer: string;
  sources: string[];
  confidence: number;
}

// === HOOK ===
export function useRAGModule(collectionName: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<RAGError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [results, setResults] = useState<RAGResponse | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Búsqueda semántica con generación de respuesta
  const search = useCallback(async (context: RAGContext): Promise<RAGResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('rag-search', {
        body: {
          action: 'semantic_search',
          collection: collectionName,
          query: context.query,
          topK: context.topK || 5,
          threshold: context.relevanceThreshold || 0.7,
          filters: context.filters
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setResults(data.data);
        setLastRefresh(new Date());
        return data.data;
      }

      throw new Error('Invalid RAG response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en búsqueda RAG';
      setError({ code: 'RAG_SEARCH_ERROR', message });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [collectionName]);

  // Indexar documento
  const indexDocument = useCallback(async (
    content: string,
    metadata: DocumentChunk['metadata']
  ): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('rag-search', {
        body: {
          action: 'index_document',
          collection: collectionName,
          content,
          metadata
        }
      });

      if (fnError) throw fnError;
      return data?.success || false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error indexando documento';
      setError({ code: 'RAG_INDEX_ERROR', message });
      return false;
    }
  }, [collectionName]);

  return {
    isLoading,
    error,
    lastRefresh,
    results,
    search,
    indexDocument,
    clearError,
  };
}
```

### Patrón de Multi-Agent Orchestration

Para workflows complejos que requieren coordinación de múltiples agentes IA especializados.

```typescript
// src/hooks/admin/useMultiAgentOrchestrator.ts

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// === INTERFACES ===
export interface AgentTask {
  id: string;
  agentType: 'analyzer' | 'generator' | 'validator' | 'coordinator' | 'executor';
  name: string;
  input: unknown;
  output?: unknown;
  dependsOn?: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface AgentConfig {
  agentType: AgentTask['agentType'];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt: string;
}

export interface OrchestrationPlan {
  id: string;
  name: string;
  agents: AgentConfig[];
  tasks: Omit<AgentTask, 'status' | 'output'>[];
  executionOrder: string[][]; // Grupos de tareas paralelas
}

export interface OrchestrationResult {
  planId: string;
  status: 'completed' | 'partial' | 'failed';
  tasks: AgentTask[];
  finalOutput: unknown;
  totalDuration: number;
  tokensUsed: number;
}

export interface OrchestratorError {
  code: string;
  message: string;
  failedTasks?: string[];
}

// === HOOK ===
export function useMultiAgentOrchestrator() {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<OrchestratorError | null>(null);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [progress, setProgress] = useState(0);
  const abortController = useRef<AbortController | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Ejecutar plan de orquestación
  const executePlan = useCallback(async (
    plan: OrchestrationPlan
  ): Promise<OrchestrationResult | null> => {
    setIsRunning(true);
    setError(null);
    setProgress(0);
    abortController.current = new AbortController();

    const startTime = Date.now();
    const executedTasks: AgentTask[] = [];

    try {
      for (let groupIndex = 0; groupIndex < plan.executionOrder.length; groupIndex++) {
        const taskGroup = plan.executionOrder[groupIndex];
        
        // Ejecutar tareas del grupo en paralelo
        const groupPromises = taskGroup.map(async (taskId) => {
          const taskDef = plan.tasks.find(t => t.id === taskId);
          if (!taskDef) throw new Error(`Task ${taskId} not found`);

          const task: AgentTask = {
            ...taskDef,
            status: 'running',
            startedAt: new Date()
          };
          
          setTasks(prev => [...prev.filter(t => t.id !== taskId), task]);

          const { data, error: fnError } = await supabase.functions.invoke('multi-agent', {
            body: {
              action: 'execute_task',
              task: taskDef,
              agentConfig: plan.agents.find(a => a.agentType === taskDef.agentType),
              previousOutputs: executedTasks.reduce((acc, t) => {
                acc[t.id] = t.output;
                return acc;
              }, {} as Record<string, unknown>)
            }
          });

          if (fnError) throw fnError;

          const completedTask: AgentTask = {
            ...task,
            status: 'completed',
            output: data.output,
            completedAt: new Date()
          };

          executedTasks.push(completedTask);
          return completedTask;
        });

        await Promise.all(groupPromises);
        setProgress(((groupIndex + 1) / plan.executionOrder.length) * 100);
      }

      const result: OrchestrationResult = {
        planId: plan.id,
        status: 'completed',
        tasks: executedTasks,
        finalOutput: executedTasks[executedTasks.length - 1]?.output,
        totalDuration: Date.now() - startTime,
        tokensUsed: 0 // Se puede calcular sumando todos los tasks
      };

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en orquestación';
      setError({
        code: 'ORCHESTRATION_ERROR',
        message,
        failedTasks: executedTasks.filter(t => t.status === 'failed').map(t => t.id)
      });
      return null;
    } finally {
      setIsRunning(false);
      abortController.current = null;
    }
  }, []);

  // Abortar ejecución
  const abort = useCallback(() => {
    abortController.current?.abort();
    setIsRunning(false);
  }, []);

  return {
    isRunning,
    error,
    tasks,
    progress,
    executePlan,
    abort,
    clearError,
  };
}
```

### Edge Function para RAG

```typescript
// supabase/functions/rag-search/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RAGRequest {
  action: 'semantic_search' | 'index_document';
  collection: string;
  query?: string;
  content?: string;
  topK?: number;
  threshold?: number;
  metadata?: Record<string, unknown>;
  filters?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const { action, collection, query, content, topK, threshold, metadata, filters } = 
      await req.json() as RAGRequest;

    console.log(`[RAG] Action: ${action}, Collection: ${collection}`);

    if (action === 'semantic_search' && query) {
      // 1. Generar embedding de la query
      const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Generate a semantic search embedding representation for the following query. Return only the key concepts.' },
            { role: 'user', content: query }
          ],
          temperature: 0.1,
        }),
      });

      if (!embeddingResponse.ok) throw new Error('Failed to generate embedding');

      // 2. Buscar chunks similares (simulado - en producción usar pgvector)
      // 3. Generar respuesta con contexto
      const contextResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'system', 
              content: `You are a RAG assistant. Answer based on the retrieved context. 
              If the context doesn't contain relevant information, say so.
              Format: JSON with {answer, sources, confidence}`
            },
            { role: 'user', content: `Query: ${query}\n\nContext: [Retrieved documents would go here]` }
          ],
          temperature: 0.3,
        }),
      });

      const result = await contextResponse.json();
      
      return new Response(JSON.stringify({
        success: true,
        data: {
          chunks: [],
          generatedAnswer: result.choices?.[0]?.message?.content || '',
          sources: [],
          confidence: 0.85
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'index_document' && content) {
      // Indexar documento con embeddings
      console.log(`[RAG] Indexing document for collection: ${collection}`);
      
      return new Response(JSON.stringify({
        success: true,
        data: { indexed: true, chunkCount: 1 }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Invalid action: ${action}`);
  } catch (error) {
    console.error('[RAG] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

## Event-Driven Architecture

### Patrón Event Sourcing Lite

Para auditoría completa, replay de estados y trazabilidad de cambios.

```typescript
// src/hooks/admin/useEventSourcing.ts

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// === INTERFACES ===
export interface DomainEvent<T = unknown> {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: T;
  metadata: {
    userId: string;
    correlationId: string;
    causationId?: string;
    timestamp: Date;
    version: number;
  };
}

export interface EventStore {
  appendEvent: <T>(event: Omit<DomainEvent<T>, 'id' | 'metadata'> & { metadata: Partial<DomainEvent['metadata']> }) => Promise<DomainEvent<T>>;
  getEventStream: (aggregateType: string, aggregateId: string) => Promise<DomainEvent[]>;
  replayEvents: <TState>(aggregateId: string, reducer: (state: TState, event: DomainEvent) => TState, initialState: TState) => Promise<TState>;
  getEventsByType: (eventType: string, since?: Date) => Promise<DomainEvent[]>;
}

export interface EventSourcingError {
  code: string;
  message: string;
  eventId?: string;
}

// === HOOK ===
export function useEventSourcing(aggregateType: string): EventStore & {
  isLoading: boolean;
  error: EventSourcingError | null;
  clearError: () => void;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<EventSourcingError | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const appendEvent = useCallback(async <T>(
    event: Omit<DomainEvent<T>, 'id' | 'metadata'> & { metadata: Partial<DomainEvent['metadata']> }
  ): Promise<DomainEvent<T>> => {
    const fullEvent: DomainEvent<T> = {
      ...event,
      id: crypto.randomUUID(),
      metadata: {
        userId: event.metadata.userId || 'system',
        correlationId: event.metadata.correlationId || crypto.randomUUID(),
        causationId: event.metadata.causationId,
        timestamp: new Date(),
        version: event.metadata.version || 1,
      }
    };

    const { error: insertError } = await supabase
      .from('domain_events')
      .insert({
        id: fullEvent.id,
        event_type: fullEvent.eventType,
        aggregate_type: fullEvent.aggregateType,
        aggregate_id: fullEvent.aggregateId,
        payload: fullEvent.payload,
        metadata: fullEvent.metadata,
        created_at: fullEvent.metadata.timestamp.toISOString()
      });

    if (insertError) {
      setError({ code: 'EVENT_APPEND_ERROR', message: insertError.message });
      throw insertError;
    }

    console.log(`[EventSourcing] Event appended: ${fullEvent.eventType}`);
    return fullEvent;
  }, []);

  const getEventStream = useCallback(async (
    aggType: string,
    aggregateId: string
  ): Promise<DomainEvent[]> => {
    setIsLoading(true);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('domain_events')
        .select('*')
        .eq('aggregate_type', aggType)
        .eq('aggregate_id', aggregateId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      return (data || []).map(row => ({
        id: row.id,
        eventType: row.event_type,
        aggregateType: row.aggregate_type,
        aggregateId: row.aggregate_id,
        payload: row.payload,
        metadata: row.metadata
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const replayEvents = useCallback(async <TState>(
    aggregateId: string,
    reducer: (state: TState, event: DomainEvent) => TState,
    initialState: TState
  ): Promise<TState> => {
    const events = await getEventStream(aggregateType, aggregateId);
    return events.reduce(reducer, initialState);
  }, [aggregateType, getEventStream]);

  const getEventsByType = useCallback(async (
    eventType: string,
    since?: Date
  ): Promise<DomainEvent[]> => {
    let query = supabase
      .from('domain_events')
      .select('*')
      .eq('event_type', eventType)
      .order('created_at', { ascending: true });

    if (since) {
      query = query.gte('created_at', since.toISOString());
    }

    const { data, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    return (data || []).map(row => ({
      id: row.id,
      eventType: row.event_type,
      aggregateType: row.aggregate_type,
      aggregateId: row.aggregate_id,
      payload: row.payload,
      metadata: row.metadata
    }));
  }, []);

  return {
    isLoading,
    error,
    clearError,
    appendEvent,
    getEventStream,
    replayEvents,
    getEventsByType,
  };
}
```

### Patrón CQRS Lite

Separación de comandos (escritura) y queries (lectura) para mejor escalabilidad.

```typescript
// src/hooks/admin/useCQRS.ts

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// === INTERFACES ===
export interface Command<T = unknown> {
  type: string;
  payload: T;
  metadata?: {
    userId?: string;
    correlationId?: string;
  };
}

export interface Query<T = unknown> {
  type: string;
  filters?: T;
  pagination?: {
    page: number;
    pageSize: number;
  };
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export interface CommandResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  eventId?: string;
}

export interface QueryResult<T = unknown> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CQRSError {
  code: string;
  message: string;
  command?: string;
  query?: string;
}

// === COMMAND HANDLERS (Registro) ===
type CommandHandler<TPayload, TResult> = (payload: TPayload) => Promise<TResult>;
const commandHandlers = new Map<string, CommandHandler<unknown, unknown>>();

export function registerCommandHandler<TPayload, TResult>(
  commandType: string,
  handler: CommandHandler<TPayload, TResult>
): void {
  commandHandlers.set(commandType, handler as CommandHandler<unknown, unknown>);
}

// === QUERY HANDLERS (Registro) ===
type QueryHandler<TFilters, TResult> = (query: Query<TFilters>) => Promise<QueryResult<TResult>>;
const queryHandlers = new Map<string, QueryHandler<unknown, unknown>>();

export function registerQueryHandler<TFilters, TResult>(
  queryType: string,
  handler: QueryHandler<TFilters, TResult>
): void {
  queryHandlers.set(queryType, handler as QueryHandler<unknown, unknown>);
}

// === HOOK ===
export function useCQRS(domain: string) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [error, setError] = useState<CQRSError | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Ejecutar comando (write side)
  const executeCommand = useCallback(async <TPayload, TResult>(
    command: Command<TPayload>
  ): Promise<CommandResult<TResult>> => {
    setIsExecuting(true);
    setError(null);

    try {
      const handler = commandHandlers.get(command.type);
      
      if (handler) {
        const result = await handler(command.payload);
        return { success: true, data: result as TResult };
      }

      // Fallback: ejecutar via edge function
      const { data, error: fnError } = await supabase.functions.invoke('cqrs-handler', {
        body: {
          type: 'command',
          domain,
          command
        }
      });

      if (fnError) throw fnError;
      return data as CommandResult<TResult>;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error ejecutando comando';
      setError({ code: 'COMMAND_ERROR', message, command: command.type });
      return { success: false, error: message };
    } finally {
      setIsExecuting(false);
    }
  }, [domain]);

  // Ejecutar query (read side)
  const executeQuery = useCallback(async <TFilters, TResult>(
    query: Query<TFilters>
  ): Promise<QueryResult<TResult> | null> => {
    setIsQuerying(true);
    setError(null);

    try {
      const handler = queryHandlers.get(query.type);
      
      if (handler) {
        return await handler(query) as QueryResult<TResult>;
      }

      // Fallback: ejecutar via edge function
      const { data, error: fnError } = await supabase.functions.invoke('cqrs-handler', {
        body: {
          type: 'query',
          domain,
          query
        }
      });

      if (fnError) throw fnError;
      return data as QueryResult<TResult>;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error ejecutando query';
      setError({ code: 'QUERY_ERROR', message, query: query.type });
      return null;
    } finally {
      setIsQuerying(false);
    }
  }, [domain]);

  return {
    isExecuting,
    isQuerying,
    error,
    executeCommand,
    executeQuery,
    clearError,
  };
}
```

---

## Patrones de Resiliencia Enterprise

### Patrón Circuit Breaker

Protección contra cascadas de fallos en servicios externos.

```typescript
// src/lib/circuitBreaker.ts

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Número de fallos para abrir
  resetTimeoutMs: number;        // Tiempo antes de probar half-open
  halfOpenRequests: number;      // Requests permitidos en half-open
  monitoringWindow: number;      // Ventana de tiempo para contar fallos (ms)
}

export interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  lastStateChange: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  halfOpenRequests: 3,
  monitoringWindow: 60000,
};

class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;
  private halfOpenAttempts: number = 0;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      lastStateChange: Date.now(),
    };
  }

  async execute<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
    // Check if we should transition from OPEN to HALF_OPEN
    if (this.state.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - (this.state.lastFailureTime || 0);
      if (timeSinceLastFailure >= this.config.resetTimeoutMs) {
        this.transitionTo('HALF_OPEN');
      } else {
        console.log('[CircuitBreaker] Circuit is OPEN, using fallback');
        if (fallback) return fallback();
        throw new Error('Circuit is OPEN');
      }
    }

    // Check half-open limit
    if (this.state.state === 'HALF_OPEN') {
      if (this.halfOpenAttempts >= this.config.halfOpenRequests) {
        console.log('[CircuitBreaker] HALF_OPEN limit reached');
        if (fallback) return fallback();
        throw new Error('Circuit HALF_OPEN limit reached');
      }
      this.halfOpenAttempts++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback) return fallback();
      throw error;
    }
  }

  private onSuccess(): void {
    this.state.successes++;
    
    if (this.state.state === 'HALF_OPEN') {
      // Si todos los half-open requests fueron exitosos, cerrar
      if (this.state.successes >= this.config.halfOpenRequests) {
        this.transitionTo('CLOSED');
      }
    } else if (this.state.state === 'CLOSED') {
      // Reset failure count on success in closed state
      this.state.failures = 0;
    }
  }

  private onFailure(): void {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();

    if (this.state.state === 'HALF_OPEN') {
      // Un fallo en half-open abre el circuito
      this.transitionTo('OPEN');
    } else if (this.state.state === 'CLOSED') {
      if (this.state.failures >= this.config.failureThreshold) {
        this.transitionTo('OPEN');
      }
    }
  }

  private transitionTo(newState: CircuitState): void {
    console.log(`[CircuitBreaker] ${this.state.state} -> ${newState}`);
    this.state.state = newState;
    this.state.lastStateChange = Date.now();
    
    if (newState === 'CLOSED') {
      this.state.failures = 0;
      this.state.successes = 0;
    } else if (newState === 'HALF_OPEN') {
      this.halfOpenAttempts = 0;
      this.state.successes = 0;
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }
}

// Registro global de circuit breakers por servicio
const circuitBreakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
  if (!circuitBreakers.has(serviceName)) {
    circuitBreakers.set(serviceName, new CircuitBreaker(config));
  }
  return circuitBreakers.get(serviceName)!;
}

// Hook para React
export function useCircuitBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>) {
  const breaker = getCircuitBreaker(serviceName, config);
  
  return {
    execute: breaker.execute.bind(breaker),
    getState: breaker.getState.bind(breaker),
  };
}
```

### Patrón Bulkhead

Aislamiento de recursos para prevenir que fallos en un servicio afecten a otros.

```typescript
// src/lib/bulkhead.ts

export interface BulkheadConfig {
  maxConcurrent: number;    // Máximo de ejecuciones concurrentes
  maxQueue: number;         // Máximo en cola de espera
  timeoutMs: number;        // Timeout por ejecución
  name: string;             // Nombre para logging
}

interface QueuedTask<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  enqueuedAt: number;
}

const DEFAULT_CONFIG: BulkheadConfig = {
  maxConcurrent: 10,
  maxQueue: 50,
  timeoutMs: 30000,
  name: 'default',
};

class Bulkhead {
  private config: BulkheadConfig;
  private running: number = 0;
  private queue: QueuedTask<unknown>[] = [];
  private metrics = {
    totalExecuted: 0,
    totalRejected: 0,
    totalTimedOut: 0,
    currentQueue: 0,
    currentRunning: 0,
  };

  constructor(config: Partial<BulkheadConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if we can execute immediately
    if (this.running < this.config.maxConcurrent) {
      return this.runTask(fn);
    }

    // Check if queue is full
    if (this.queue.length >= this.config.maxQueue) {
      this.metrics.totalRejected++;
      console.warn(`[Bulkhead:${this.config.name}] Queue full, rejecting`);
      throw new Error(`Bulkhead queue full for ${this.config.name}`);
    }

    // Add to queue
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
        enqueuedAt: Date.now(),
      });
      this.metrics.currentQueue = this.queue.length;
      console.log(`[Bulkhead:${this.config.name}] Queued. Queue size: ${this.queue.length}`);
    });
  }

  private async runTask<T>(fn: () => Promise<T>): Promise<T> {
    this.running++;
    this.metrics.currentRunning = this.running;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        this.metrics.totalTimedOut++;
        reject(new Error(`Bulkhead timeout for ${this.config.name}`));
      }, this.config.timeoutMs);
    });

    try {
      const result = await Promise.race([fn(), timeoutPromise]);
      this.metrics.totalExecuted++;
      return result;
    } finally {
      this.running--;
      this.metrics.currentRunning = this.running;
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (this.queue.length === 0 || this.running >= this.config.maxConcurrent) {
      return;
    }

    const task = this.queue.shift()!;
    this.metrics.currentQueue = this.queue.length;

    // Check if task timed out while in queue
    const waitTime = Date.now() - task.enqueuedAt;
    if (waitTime > this.config.timeoutMs) {
      task.reject(new Error(`Bulkhead queue timeout for ${this.config.name}`));
      this.processQueue();
      return;
    }

    this.runTask(task.fn)
      .then(task.resolve)
      .catch(task.reject);
  }

  getMetrics() {
    return { ...this.metrics };
  }
}

// Registro global de bulkheads
const bulkheads = new Map<string, Bulkhead>();

export function getBulkhead(name: string, config?: Partial<BulkheadConfig>): Bulkhead {
  if (!bulkheads.has(name)) {
    bulkheads.set(name, new Bulkhead({ ...config, name }));
  }
  return bulkheads.get(name)!;
}

// Hook para React
export function useBulkhead(name: string, config?: Partial<BulkheadConfig>) {
  const bulkhead = getBulkhead(name, config);
  
  return {
    execute: bulkhead.execute.bind(bulkhead),
    getMetrics: bulkhead.getMetrics.bind(bulkhead),
  };
}
```

---

## Feature Flags con ML

### Patrón de Feature Flags Inteligentes

Feature flags que aprenden del comportamiento del usuario para optimizar la experiencia.

```typescript
// src/hooks/admin/useIntelligentFeatureFlags.ts

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// === INTERFACES ===
export interface TargetingRule {
  attribute: string;         // e.g., 'userSegment', 'plan', 'country'
  operator: 'eq' | 'neq' | 'in' | 'nin' | 'gt' | 'lt' | 'contains';
  value: unknown;
}

export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  defaultValue: boolean;
  enabled: boolean;
  targetingRules: TargetingRule[];
  rolloutPercentage: number;    // 0-100
  mlOptimization?: {
    enabled: boolean;
    metric: 'engagement' | 'conversion' | 'retention' | 'revenue';
    minSampleSize: number;
    confidenceThreshold: number;
  };
  variants?: {
    key: string;
    weight: number;
    config: Record<string, unknown>;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserContext {
  userId: string;
  attributes: Record<string, unknown>;
  sessionId?: string;
}

export interface ExposureEvent {
  flagKey: string;
  variant: string;
  userId: string;
  timestamp: Date;
  context: UserContext;
}

export interface FeatureFlagError {
  code: string;
  message: string;
  flagKey?: string;
}

// === EVALUADOR DE FLAGS ===
function evaluateFlag(flag: FeatureFlag, context: UserContext): { enabled: boolean; variant?: string } {
  // 1. Check if flag is globally disabled
  if (!flag.enabled) {
    return { enabled: flag.defaultValue };
  }

  // 2. Evaluate targeting rules
  const matchesRules = flag.targetingRules.every(rule => {
    const attrValue = context.attributes[rule.attribute];
    
    switch (rule.operator) {
      case 'eq': return attrValue === rule.value;
      case 'neq': return attrValue !== rule.value;
      case 'in': return Array.isArray(rule.value) && rule.value.includes(attrValue);
      case 'nin': return Array.isArray(rule.value) && !rule.value.includes(attrValue);
      case 'gt': return typeof attrValue === 'number' && attrValue > (rule.value as number);
      case 'lt': return typeof attrValue === 'number' && attrValue < (rule.value as number);
      case 'contains': return typeof attrValue === 'string' && attrValue.includes(rule.value as string);
      default: return false;
    }
  });

  if (!matchesRules) {
    return { enabled: flag.defaultValue };
  }

  // 3. Apply rollout percentage (deterministic based on userId)
  const hash = simpleHash(`${flag.key}-${context.userId}`);
  const bucket = hash % 100;
  
  if (bucket >= flag.rolloutPercentage) {
    return { enabled: flag.defaultValue };
  }

  // 4. Select variant if exists
  if (flag.variants && flag.variants.length > 0) {
    const variantBucket = hash % 100;
    let cumulative = 0;
    
    for (const variant of flag.variants) {
      cumulative += variant.weight;
      if (variantBucket < cumulative) {
        return { enabled: true, variant: variant.key };
      }
    }
  }

  return { enabled: true };
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// === HOOK ===
export function useIntelligentFeatureFlags() {
  const [flags, setFlags] = useState<Map<string, FeatureFlag>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FeatureFlagError | null>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Cargar flags
  const loadFlags = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('enabled', true);

      if (fetchError) throw fetchError;

      const flagMap = new Map<string, FeatureFlag>();
      (data || []).forEach(row => {
        flagMap.set(row.key, {
          key: row.key,
          name: row.name,
          description: row.description,
          defaultValue: row.default_value,
          enabled: row.enabled,
          targetingRules: row.targeting_rules || [],
          rolloutPercentage: row.rollout_percentage || 100,
          mlOptimization: row.ml_optimization,
          variants: row.variants,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        });
      });

      setFlags(flagMap);
    } catch (err) {
      setError({
        code: 'LOAD_FLAGS_ERROR',
        message: err instanceof Error ? err.message : 'Error loading flags'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Evaluar flag
  const isEnabled = useCallback((flagKey: string, context?: UserContext): boolean => {
    const ctx = context || userContext;
    if (!ctx) {
      console.warn('[FeatureFlags] No user context provided');
      return false;
    }

    const flag = flags.get(flagKey);
    if (!flag) {
      console.warn(`[FeatureFlags] Flag ${flagKey} not found`);
      return false;
    }

    const result = evaluateFlag(flag, ctx);
    return result.enabled;
  }, [flags, userContext]);

  // Obtener variante
  const getVariant = useCallback((flagKey: string, context?: UserContext): string | null => {
    const ctx = context || userContext;
    if (!ctx) return null;

    const flag = flags.get(flagKey);
    if (!flag) return null;

    const result = evaluateFlag(flag, ctx);
    return result.variant || null;
  }, [flags, userContext]);

  // Trackear exposición
  const trackExposure = useCallback(async (flagKey: string, variant?: string): Promise<void> => {
    if (!userContext) return;

    const exposure: ExposureEvent = {
      flagKey,
      variant: variant || 'control',
      userId: userContext.userId,
      timestamp: new Date(),
      context: userContext,
    };

    await supabase.from('feature_flag_exposures').insert({
      flag_key: exposure.flagKey,
      variant: exposure.variant,
      user_id: exposure.userId,
      context: exposure.context,
      created_at: exposure.timestamp.toISOString(),
    });
  }, [userContext]);

  // Obtener variante óptima (ML-driven)
  const getOptimalVariant = useCallback(async (flagKey: string): Promise<string | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('feature-flag-ml', {
        body: {
          action: 'get_optimal_variant',
          flagKey,
          userId: userContext?.userId
        }
      });

      if (fnError) throw fnError;
      return data?.variant || null;
    } catch (err) {
      console.error('[FeatureFlags] ML optimization error:', err);
      return null;
    }
  }, [userContext]);

  // Cargar flags al montar
  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  return {
    isLoading,
    error,
    flags: Array.from(flags.values()),
    isEnabled,
    getVariant,
    trackExposure,
    getOptimalVariant,
    setUserContext,
    loadFlags,
    clearError,
  };
}
```

---

## Internacionalización (i18n) Avanzada

### Estructura Obligatoria para Módulos

Todos los nuevos módulos DEBEN incluir traducciones siguiendo esta estructura:

```typescript
// src/locales/es.ts (estructura base)
export default {
  // === NAMESPACE DEL MÓDULO ===
  'moduleName': {
    // Títulos y encabezados
    'title': 'Título del Módulo',
    'subtitle': 'Descripción breve',
    
    // Secciones
    'sections': {
      'overview': 'Resumen',
      'details': 'Detalles',
      'settings': 'Configuración',
    },
    
    // Acciones
    'actions': {
      'create': 'Crear',
      'edit': 'Editar',
      'delete': 'Eliminar',
      'save': 'Guardar',
      'cancel': 'Cancelar',
      'refresh': 'Actualizar',
    },
    
    // Estados
    'states': {
      'loading': 'Cargando...',
      'empty': 'No hay datos disponibles',
      'error': 'Ha ocurrido un error',
      'success': 'Operación exitosa',
    },
    
    // Errores tipados (mapear a códigos de error del hook)
    'errors': {
      'FETCH_ERROR': 'Error al cargar los datos',
      'CREATE_ERROR': 'Error al crear el registro',
      'UPDATE_ERROR': 'Error al actualizar',
      'DELETE_ERROR': 'Error al eliminar',
      'VALIDATION_ERROR': 'Datos inválidos',
      'NETWORK_ERROR': 'Error de conexión',
      'UNAUTHORIZED': 'No autorizado',
    },
    
    // Confirmaciones
    'confirmations': {
      'delete': '¿Estás seguro de eliminar este elemento?',
      'discard': '¿Descartar cambios sin guardar?',
    },
    
    // Tooltips y ayudas
    'help': {
      'field1': 'Explicación del campo 1',
      'field2': 'Explicación del campo 2',
    },
  },
};
```

### Patrón de Lazy Loading de Locales

```typescript
// src/hooks/useModuleTranslations.ts

import { useState, useEffect, useCallback } from 'react';

type Locale = 'es' | 'en' | 'ca' | 'fr';

interface TranslationModule {
  [key: string]: string | TranslationModule;
}

const loadedLocales = new Map<string, TranslationModule>();

export function useModuleTranslations(moduleId: string, locale: Locale = 'es') {
  const [translations, setTranslations] = useState<TranslationModule>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTranslations = useCallback(async () => {
    const cacheKey = `${moduleId}-${locale}`;
    
    if (loadedLocales.has(cacheKey)) {
      setTranslations(loadedLocales.get(cacheKey)!);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Dynamic import con fallback
      const module = await import(`@/locales/${locale}/${moduleId}.ts`)
        .catch(() => import(`@/locales/es/${moduleId}.ts`)); // Fallback a español
      
      const trans = module.default || module;
      loadedLocales.set(cacheKey, trans);
      setTranslations(trans);
    } catch (err) {
      setError(`Failed to load translations for ${moduleId}`);
      console.error(`[i18n] Error loading ${moduleId} for ${locale}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [moduleId, locale]);

  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);

  // Helper para acceder a traducciones anidadas
  const t = useCallback((key: string, fallback?: string): string => {
    const keys = key.split('.');
    let value: unknown = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return fallback || key;
      }
    }
    
    return typeof value === 'string' ? value : fallback || key;
  }, [translations]);

  return { t, translations, isLoading, error };
}
```

### Patrón de Detección Automática de Idioma

```typescript
// src/lib/languageDetection.ts

export type SupportedLocale = 'es' | 'en' | 'ca' | 'fr';

const SUPPORTED_LOCALES: SupportedLocale[] = ['es', 'en', 'ca', 'fr'];
const DEFAULT_LOCALE: SupportedLocale = 'es';

export function detectUserLocale(): SupportedLocale {
  // 1. Check localStorage preference
  const stored = localStorage.getItem('preferred_locale');
  if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
    return stored as SupportedLocale;
  }

  // 2. Check URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const urlLocale = urlParams.get('lang');
  if (urlLocale && SUPPORTED_LOCALES.includes(urlLocale as SupportedLocale)) {
    return urlLocale as SupportedLocale;
  }

  // 3. Check browser preferences
  const browserLangs = navigator.languages || [navigator.language];
  for (const lang of browserLangs) {
    const shortLang = lang.split('-')[0].toLowerCase() as SupportedLocale;
    if (SUPPORTED_LOCALES.includes(shortLang)) {
      return shortLang;
    }
  }

  // 4. Default
  return DEFAULT_LOCALE;
}

export function setUserLocale(locale: SupportedLocale): void {
  localStorage.setItem('preferred_locale', locale);
  // Opcional: recargar página o emitir evento
  window.dispatchEvent(new CustomEvent('localeChange', { detail: locale }));
}

export function getLocaleDisplayName(locale: SupportedLocale): string {
  const names: Record<SupportedLocale, string> = {
    es: 'Español',
    en: 'English',
    ca: 'Català',
    fr: 'Français',
  };
  return names[locale];
}
```

### Integración con Lovable AI para Traducciones

```typescript
// supabase/functions/translate-module/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslationRequest {
  sourceLocale: string;
  targetLocale: string;
  translations: Record<string, string>;
  context?: string; // Contexto del módulo para mejor traducción
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const { sourceLocale, targetLocale, translations, context } = 
      await req.json() as TranslationRequest;

    console.log(`[Translate] ${sourceLocale} -> ${targetLocale}, ${Object.keys(translations).length} keys`);

    const prompt = `Translate the following UI strings from ${sourceLocale} to ${targetLocale}.
Context: ${context || 'Enterprise SaaS application'}

Rules:
- Keep the same JSON structure
- Preserve placeholders like {name}, {{value}}, %s
- Use formal/professional tone
- Keep technical terms when appropriate
- Return ONLY valid JSON

Source strings:
${JSON.stringify(translations, null, 2)}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a professional translator for enterprise software. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const translated = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return new Response(JSON.stringify({
      success: true,
      translations: translated,
      sourceLocale,
      targetLocale,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Translate] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

## Compliance Check Automatizado

### Script de Validación de Patrones KB

```typescript
// scripts/validate-kb-compliance.ts

/**
 * Script de validación de compliance con Knowledge Base
 * Ejecutar: npx ts-node scripts/validate-kb-compliance.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface ComplianceResult {
  file: string;
  passed: boolean;
  checks: {
    name: string;
    passed: boolean;
    message: string;
  }[];
}

interface ComplianceReport {
  timestamp: Date;
  totalFiles: number;
  compliant: number;
  nonCompliant: number;
  results: ComplianceResult[];
}

// === REGLAS DE COMPLIANCE PARA HOOKS ===
const HOOK_RULES = [
  {
    name: 'lastRefresh',
    pattern: /lastRefresh.*Date.*null/,
    message: 'Hook debe tener estado lastRefresh: Date | null',
  },
  {
    name: 'typedError',
    pattern: /error.*:\s*\w+Error\s*\|\s*null/,
    message: 'Hook debe usar error tipado (interface *Error), no string | null',
  },
  {
    name: 'clearError',
    pattern: /clearError.*=.*useCallback/,
    message: 'Hook debe implementar clearError con useCallback',
  },
  {
    name: 'cleanupEffect',
    pattern: /useEffect.*return.*=>/,
    message: 'Hook debe tener cleanup en useEffect',
  },
  {
    name: 'errorInterface',
    pattern: /interface\s+\w+Error\s*\{[\s\S]*code:\s*string/,
    message: 'Hook debe definir interfaz de error con code: string',
  },
];

// === REGLAS DE COMPLIANCE PARA EDGE FUNCTIONS ===
const EDGE_FUNCTION_RULES = [
  {
    name: 'corsHeaders',
    pattern: /corsHeaders\s*=\s*\{[\s\S]*Access-Control/,
    message: 'Edge function debe definir corsHeaders',
  },
  {
    name: 'optionsHandler',
    pattern: /if\s*\(\s*req\.method\s*===?\s*['"]OPTIONS['"]\s*\)/,
    message: 'Edge function debe manejar OPTIONS para CORS',
  },
  {
    name: 'errorHandling',
    pattern: /catch\s*\(\s*\w+\s*\)\s*\{[\s\S]*console\.error/,
    message: 'Edge function debe tener error handling con logging',
  },
  {
    name: 'rateLimitHandling',
    pattern: /429|rate.*limit/i,
    message: 'Edge function debe manejar rate limits (429)',
  },
];

// === VALIDACIÓN DE HOOKS ===
function validateHook(filePath: string): ComplianceResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const checks = HOOK_RULES.map(rule => ({
    name: rule.name,
    passed: rule.pattern.test(content),
    message: rule.message,
  }));

  return {
    file: filePath,
    passed: checks.every(c => c.passed),
    checks,
  };
}

// === VALIDACIÓN DE EDGE FUNCTIONS ===
function validateEdgeFunction(filePath: string): ComplianceResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const checks = EDGE_FUNCTION_RULES.map(rule => ({
    name: rule.name,
    passed: rule.pattern.test(content),
    message: rule.message,
  }));

  return {
    file: filePath,
    passed: checks.every(c => c.passed),
    checks,
  };
}

// === BUSCAR ARCHIVOS ===
function findFiles(dir: string, pattern: RegExp): string[] {
  const files: string[] = [];
  
  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && !entry.name.includes('node_modules')) {
        walk(fullPath);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// === GENERAR REPORTE ===
function generateReport(): ComplianceReport {
  const results: ComplianceResult[] = [];
  
  // Validar hooks
  const hookFiles = findFiles('src/hooks', /^use.*\.ts$/);
  for (const file of hookFiles) {
    results.push(validateHook(file));
  }
  
  // Validar edge functions
  const edgeFunctionDirs = fs.readdirSync('supabase/functions', { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => path.join('supabase/functions', d.name, 'index.ts'))
    .filter(f => fs.existsSync(f));
  
  for (const file of edgeFunctionDirs) {
    results.push(validateEdgeFunction(file));
  }
  
  const compliant = results.filter(r => r.passed).length;
  
  return {
    timestamp: new Date(),
    totalFiles: results.length,
    compliant,
    nonCompliant: results.length - compliant,
    results,
  };
}

// === OUTPUT ===
function printReport(report: ComplianceReport): void {
  console.log('\n========================================');
  console.log('  KNOWLEDGE BASE COMPLIANCE REPORT');
  console.log('========================================\n');
  console.log(`Timestamp: ${report.timestamp.toISOString()}`);
  console.log(`Total files: ${report.totalFiles}`);
  console.log(`✅ Compliant: ${report.compliant}`);
  console.log(`❌ Non-compliant: ${report.nonCompliant}`);
  console.log(`Compliance rate: ${((report.compliant / report.totalFiles) * 100).toFixed(1)}%`);
  
  console.log('\n--- NON-COMPLIANT FILES ---\n');
  
  for (const result of report.results.filter(r => !r.passed)) {
    console.log(`\n📁 ${result.file}`);
    for (const check of result.checks.filter(c => !c.passed)) {
      console.log(`   ❌ ${check.name}: ${check.message}`);
    }
  }
  
  console.log('\n========================================\n');
}

// === MAIN ===
const report = generateReport();
printReport(report);

// Guardar reporte JSON
fs.writeFileSync(
  'compliance-report.json',
  JSON.stringify(report, null, 2)
);

// Exit con error si hay non-compliant
if (report.nonCompliant > 0) {
  process.exit(1);
}
```

### Checklist de Compliance para Nuevos Módulos

| Check | Hooks | Edge Functions | Componentes |
|-------|-------|----------------|-------------|
| `lastRefresh: Date \| null` | ✅ Requerido | N/A | N/A |
| `error: TypedError \| null` | ✅ Requerido | N/A | Mostrar `error.message` |
| `clearError()` | ✅ Requerido | N/A | Botón/acción |
| Cleanup en useEffect | ✅ Requerido | N/A | N/A |
| CORS Headers | N/A | ✅ Requerido | N/A |
| OPTIONS handler | N/A | ✅ Requerido | N/A |
| Rate limit (429) | N/A | ✅ Requerido | Toast/mensaje |
| Error logging | ✅ console.error | ✅ console.error | N/A |
| i18n (4 idiomas) | N/A | N/A | ✅ Requerido |
| Responsive design | N/A | N/A | ✅ Requerido |

---

## Resumen de Patrones

| Patrón | Uso Principal | Archivo Referencia |
|--------|---------------|-------------------|
| Hook Principal | Todos los hooks admin | `src/hooks/admin/use*.ts` |
| Optimistic Updates | Mutaciones con UX inmediata | TanStack Query |
| Discriminated Unions | Type-safe async states | `src/lib/asyncResult.ts` |
| Request Deduplication | Evitar requests duplicados | `src/lib/requestDeduplication.ts` |
| Retry con Backoff | Errores transitorios | `src/lib/retryWithBackoff.ts` |
| Edge Function IA | Backend con Lovable AI | `supabase/functions/` |
| Componente UI | Paneles admin consistentes | `src/components/admin/` |
| Testing Hooks | Tests unitarios de hooks | `src/hooks/**/__tests__/` |
| Testing Edge Fns | Tests de funciones backend | `supabase/functions/tests/` |
| Observabilidad | Instrumentación y métricas | `src/lib/observability.ts` |
| Zustand Store | Estado global complejo | `src/stores/` |
| Context Optimizado | Estado compartido en árbol | `src/contexts/` |
| **RAG con Embeddings** | Búsqueda semántica IA | `src/hooks/admin/useRAGModule.ts` |
| **Multi-Agent** | Orquestación de agentes IA | `src/hooks/admin/useMultiAgentOrchestrator.ts` |
| **Event Sourcing** | Auditoría y replay | `src/hooks/admin/useEventSourcing.ts` |
| **CQRS Lite** | Separación lectura/escritura | `src/hooks/admin/useCQRS.ts` |
| **Circuit Breaker** | Resiliencia servicios | `src/lib/circuitBreaker.ts` |
| **Bulkhead** | Aislamiento de recursos | `src/lib/bulkhead.ts` |
| **Feature Flags ML** | Flags inteligentes | `src/hooks/admin/useIntelligentFeatureFlags.ts` |
| **i18n Avanzado** | Internacionalización | `src/hooks/useModuleTranslations.ts` |
| **Compliance Check** | Validación automática | `scripts/validate-kb-compliance.ts` |

---

## Versionado

- **v1.0.0** (2025-06-23): Documentación inicial de patrones
- **v1.1.0** (2025-06-24): Añadidos patrones de Testing, Observabilidad y Estado Avanzado
- **v2.0.0** (2025-06-24): **MAJOR** - Patrones Disruptivos 2025-2026:
  - Sección 8: Patrones AI-First (RAG, Multi-Agent Orchestration)
  - Sección 9: Event-Driven Architecture (Event Sourcing, CQRS)
  - Sección 10: Patrones de Resiliencia Enterprise (Circuit Breaker, Bulkhead)
  - Sección 11: Feature Flags con ML
  - Sección 12: Internacionalización Avanzada
  - Sección 13: Compliance Check Automatizado
- Basado en tendencias Enterprise SaaS 2025-2026
