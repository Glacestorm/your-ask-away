/**
 * WebAssembly Module Index
 * 
 * Exporta todas las funcionalidades de WASM para cálculos financieros intensivos
 */

// Loader utilities
export {
  isWasmSupported,
  loadWasmModule,
  loadWasmFromBytes,
  clearWasmCache,
  getWasmCacheStats
} from './wasmLoader';

export type { WasmModule } from './wasmLoader';

// Financial calculations
export {
  initFinancialWasm,
  calculateZScoreOriginal,
  calculateZScorePrivate,
  calculateZScoreServices,
  calculateZmijewskiScore,
  runMonteCarloSimulation,
  calculateDCF,
  calculateAllRatios,
  calculateProbabilityOfDefault,
  calculateECL,
  getWasmStatus,
  benchmarkCalculations
} from './financialCalculations';

export type { FinancialRatios } from './financialCalculations';
