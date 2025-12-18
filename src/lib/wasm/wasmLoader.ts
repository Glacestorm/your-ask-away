/**
 * WebAssembly Loader - Carga y gestiona módulos WASM para cálculos intensivos
 * 
 * Proporciona:
 * - Carga lazy de módulos WASM
 * - Detección de soporte del navegador
 * - Fallback automático a JavaScript
 * - Cache de módulos compilados
 */

export interface WasmModule {
  instance: WebAssembly.Instance;
  memory: WebAssembly.Memory;
  exports: Record<string, Function>;
}

interface WasmModuleCache {
  [key: string]: WasmModule | null;
}

// Cache de módulos WASM compilados
const moduleCache: WasmModuleCache = {};

// Verificar soporte de WebAssembly
export function isWasmSupported(): boolean {
  try {
    if (typeof WebAssembly === 'object' &&
        typeof WebAssembly.instantiate === 'function') {
      const module = new WebAssembly.Module(
        Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00)
      );
      if (module instanceof WebAssembly.Module) {
        return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
      }
    }
  } catch (e) {
    // WebAssembly no soportado
  }
  return false;
}

// Cargar módulo WASM desde URL
export async function loadWasmModule(
  wasmUrl: string,
  importObject?: WebAssembly.Imports
): Promise<WasmModule | null> {
  // Check cache first
  if (moduleCache[wasmUrl]) {
    return moduleCache[wasmUrl];
  }

  if (!isWasmSupported()) {
    console.warn('[WASM] WebAssembly not supported, using JS fallback');
    return null;
  }

  try {
    const response = await fetch(wasmUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch WASM module: ${response.statusText}`);
    }

    const wasmBytes = await response.arrayBuffer();
    
    // Create memory for the module
    const memory = new WebAssembly.Memory({ initial: 256, maximum: 512 });
    
    const defaultImports: WebAssembly.Imports = {
      env: {
        memory,
        abort: () => console.error('WASM abort called'),
        log: (value: number) => console.log('[WASM]', value),
        logf: (value: number) => console.log('[WASM Float]', value),
      },
      ...importObject
    };

    const { instance } = await WebAssembly.instantiate(wasmBytes, defaultImports);
    
    const module: WasmModule = {
      instance,
      memory,
      exports: instance.exports as Record<string, Function>
    };

    // Cache the compiled module
    moduleCache[wasmUrl] = module;
    
    console.log(`[WASM] Module loaded successfully: ${wasmUrl}`);
    return module;
  } catch (error) {
    console.error('[WASM] Failed to load module:', error);
    return null;
  }
}

// Cargar módulo WASM desde bytes
export async function loadWasmFromBytes(
  bytes: ArrayBuffer,
  cacheKey: string,
  importObject?: WebAssembly.Imports
): Promise<WasmModule | null> {
  if (moduleCache[cacheKey]) {
    return moduleCache[cacheKey];
  }

  if (!isWasmSupported()) {
    return null;
  }

  try {
    const memory = new WebAssembly.Memory({ initial: 256, maximum: 512 });
    
    const defaultImports: WebAssembly.Imports = {
      env: {
        memory,
        abort: () => console.error('WASM abort called'),
      },
      ...importObject
    };

    const { instance } = await WebAssembly.instantiate(bytes, defaultImports);
    
    const module: WasmModule = {
      instance,
      memory,
      exports: instance.exports as Record<string, Function>
    };

    moduleCache[cacheKey] = module;
    return module;
  } catch (error) {
    console.error('[WASM] Failed to load from bytes:', error);
    return null;
  }
}

// Limpiar cache
export function clearWasmCache(): void {
  Object.keys(moduleCache).forEach(key => {
    moduleCache[key] = null;
    delete moduleCache[key];
  });
}

// Obtener estadísticas del cache
export function getWasmCacheStats(): { modules: number; keys: string[] } {
  const keys = Object.keys(moduleCache).filter(k => moduleCache[k] !== null);
  return {
    modules: keys.length,
    keys
  };
}
