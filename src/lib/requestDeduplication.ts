/**
 * Request Deduplication Utility
 * 
 * Evita requests duplicados cuando múltiples componentes
 * solicitan los mismos datos simultáneamente.
 * 
 * @module requestDeduplication
 */

type PendingRequest = Promise<unknown>;
const pendingRequests = new Map<string, PendingRequest>();

/**
 * Ejecuta una función async, deduplicando requests con la misma key.
 * Si ya hay un request en progreso con la misma key, retorna esa promesa.
 * 
 * @param key - Identificador único del request
 * @param fetchFn - Función que ejecuta el request
 * @returns Promesa con el resultado
 * 
 * @example
 * ```typescript
 * const data = await deduplicatedFetch(
 *   'company-123',
 *   () => fetchCompany('123')
 * );
 * ```
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
 * Genera una key única para un request basado en endpoint y params.
 * 
 * @param endpoint - Nombre del endpoint o tabla
 * @param params - Parámetros del request
 * @returns Key única para deduplicación
 * 
 * @example
 * ```typescript
 * const key = createRequestKey('companies', { id: '123' });
 * // Resultado: "companies:{\"id\":\"123\"}"
 * ```
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
 * Limpia todas las requests pendientes.
 * Útil para cleanup en tests o al desmontar la app.
 */
export function clearPendingRequests(): void {
  pendingRequests.clear();
}

/**
 * Obtiene el número de requests pendientes.
 * Útil para debugging y monitoreo.
 */
export function getPendingRequestsCount(): number {
  return pendingRequests.size;
}

/**
 * Verifica si hay un request pendiente para una key.
 * 
 * @param key - Key a verificar
 * @returns true si hay un request pendiente
 */
export function hasPendingRequest(key: string): boolean {
  return pendingRequests.has(key);
}
