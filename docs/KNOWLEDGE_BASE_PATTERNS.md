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

---

## Versionado

- **v1.0.0** (2025-06-23): Documentación inicial de patrones
- Basado en tendencias Enterprise SaaS 2025-2026
