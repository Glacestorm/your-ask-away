/**
 * PRECIOS INTERNOS - SOLO USO INTERNO
 * Este fichero contiene los precios base de todos los módulos.
 * NO se muestran públicamente en la tienda.
 * Los precios se asignan a clientes mediante cotizaciones personalizadas.
 */

export interface ModulePricing {
  moduleKey: string;
  moduleName: string;
  basePrice: number; // Precio anual en EUR
  perpetualMultiplier: number; // Multiplicador para licencia perpetua (ej: 5x)
  monthlyDivisor: number; // Divisor para precio mensual (ej: 10)
  minDiscount: number; // Descuento mínimo permitido (%)
  maxDiscount: number; // Descuento máximo permitido (%)
  category: 'core' | 'horizontal' | 'vertical' | 'enterprise';
  notes?: string;
}

export const INTERNAL_MODULE_PRICING: ModulePricing[] = [
  // CORE MODULES
  {
    moduleKey: 'core',
    moduleName: 'Core CRM',
    basePrice: 39000,
    perpetualMultiplier: 5,
    monthlyDivisor: 10,
    minDiscount: 0,
    maxDiscount: 15,
    category: 'core',
    notes: 'Módulo base requerido'
  },
  
  // HORIZONTAL MODULES
  {
    moduleKey: 'visits',
    moduleName: 'Gestión de Visitas',
    basePrice: 24000,
    perpetualMultiplier: 5,
    monthlyDivisor: 10,
    minDiscount: 0,
    maxDiscount: 25,
    category: 'horizontal'
  },
  {
    moduleKey: 'accounting',
    moduleName: 'Contabilidad',
    basePrice: 49000,
    perpetualMultiplier: 5,
    monthlyDivisor: 10,
    minDiscount: 0,
    maxDiscount: 20,
    category: 'horizontal'
  },
  {
    moduleKey: 'goals',
    moduleName: 'Objetivos',
    basePrice: 19000,
    perpetualMultiplier: 5,
    monthlyDivisor: 10,
    minDiscount: 0,
    maxDiscount: 30,
    category: 'horizontal'
  },
  {
    moduleKey: 'documentation',
    moduleName: 'Documentación',
    basePrice: 15000,
    perpetualMultiplier: 5,
    monthlyDivisor: 10,
    minDiscount: 0,
    maxDiscount: 30,
    category: 'horizontal'
  },
  {
    moduleKey: 'notifications',
    moduleName: 'Notificaciones',
    basePrice: 12000,
    perpetualMultiplier: 5,
    monthlyDivisor: 10,
    minDiscount: 0,
    maxDiscount: 35,
    category: 'horizontal'
  },
  
  // ENTERPRISE / PREMIUM MODULES
  {
    moduleKey: 'banking_ai',
    moduleName: 'IA Bancaria Avanzada',
    basePrice: 149000,
    perpetualMultiplier: 5,
    monthlyDivisor: 10,
    minDiscount: 0,
    maxDiscount: 20,
    category: 'enterprise',
    notes: 'ML predictivo, scoring crediticio, detección fraude'
  },
  {
    moduleKey: 'compliance_pro',
    moduleName: 'Compliance Bancario Pro',
    basePrice: 119000,
    perpetualMultiplier: 5,
    monthlyDivisor: 10,
    minDiscount: 0,
    maxDiscount: 20,
    category: 'enterprise',
    notes: 'DORA, NIS2, PSD2, Basel III/IV, MiFID II'
  },
  {
    moduleKey: 'open_banking',
    moduleName: 'Open Banking API',
    basePrice: 79000,
    perpetualMultiplier: 5,
    monthlyDivisor: 10,
    minDiscount: 0,
    maxDiscount: 25,
    category: 'enterprise',
    notes: 'APIs FAPI, gestión consentimientos, TPP'
  },
];

// CNAE Base Pricing (internal reference)
export const CNAE_BASE_PRICING: Record<string, number> = {
  // Sector Financiero
  '6411': 85000,  // Banca central
  '6419': 75000,  // Otra intermediación monetaria
  '6420': 70000,  // Holdings
  '6430': 65000,  // Fondos de inversión
  '6491': 60000,  // Arrendamiento financiero
  '6492': 55000,  // Otras actividades crediticias
  '6499': 50000,  // Otros servicios financieros
  
  // Sector Seguros
  '6511': 65000,  // Seguros de vida
  '6512': 60000,  // Seguros no vida
  '6520': 55000,  // Reaseguros
  
  // Sector Industrial
  '1011': 35000,  // Procesado carne
  '1020': 35000,  // Procesado pescado
  '2511': 40000,  // Estructuras metálicas
  '2562': 38000,  // Ingeniería mecánica
  
  // Sector Comercio
  '4711': 25000,  // Comercio minorista
  '4719': 25000,  // Otro comercio minorista
  '4791': 30000,  // Comercio por internet
  
  // Sector Servicios
  '6201': 45000,  // Programación informática
  '6202': 42000,  // Consultoría informática
  '6311': 40000,  // Procesamiento de datos
  '7010': 50000,  // Sedes centrales
  '7022': 48000,  // Consultoría empresarial
  
  // Default para CNAEs no listados
  'default': 30000,
};

// Multiplicadores por tamaño de empresa (facturación)
export const TURNOVER_MULTIPLIERS: Record<string, number> = {
  'micro': 0.4,      // < 500K
  'small': 0.6,      // 500K - 1M
  'medium': 1.0,     // 1M - 10M
  'large': 1.5,      // 10M - 50M
  'enterprise': 2.0, // > 50M
};

// Descuentos por volumen (múltiples CNAEs)
export const VOLUME_DISCOUNTS: Record<number, number> = {
  1: 0,
  2: 5,
  3: 12,
  4: 18,
  5: 22,
  // 6+ = 25%
};

// Pack Enterprise completo
export const ENTERPRISE_PACK = {
  name: 'Pack Enterprise Completo',
  originalPrice: 1200000,
  discountedPrice: 880000,
  discountPercent: 27,
  includes: 'all_modules',
  licenseType: 'perpetual' as const,
  notes: 'Licencia perpetua, todos los módulos, soporte prioritario 24/7'
};

// Helper functions
export function getModulePricing(moduleKey: string): ModulePricing | undefined {
  return INTERNAL_MODULE_PRICING.find(m => m.moduleKey === moduleKey);
}

export function getCNAEBasePrice(cnaeCode: string): number {
  return CNAE_BASE_PRICING[cnaeCode] || CNAE_BASE_PRICING['default'];
}

export function getTurnoverMultiplier(turnover: number): number {
  if (turnover < 500000) return TURNOVER_MULTIPLIERS['micro'];
  if (turnover < 1000000) return TURNOVER_MULTIPLIERS['small'];
  if (turnover < 10000000) return TURNOVER_MULTIPLIERS['medium'];
  if (turnover < 50000000) return TURNOVER_MULTIPLIERS['large'];
  return TURNOVER_MULTIPLIERS['enterprise'];
}

export function getVolumeDiscount(cnaeCount: number): number {
  if (cnaeCount >= 6) return 25;
  return VOLUME_DISCOUNTS[cnaeCount] || 0;
}

export function calculateCustomPrice(
  basePrice: number,
  licenseType: 'annual' | 'perpetual' | 'monthly',
  discountPercent: number = 0
): number {
  let price = basePrice;
  
  if (licenseType === 'perpetual') {
    price = price * 5;
  } else if (licenseType === 'monthly') {
    price = price / 10;
  }
  
  if (discountPercent > 0) {
    price = price * (1 - discountPercent / 100);
  }
  
  return Math.round(price);
}
