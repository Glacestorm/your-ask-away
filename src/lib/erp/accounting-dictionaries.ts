/**
 * ERP Accounting Multi-Country Dictionaries
 * Nombres de grupos contables y etiquetas por país
 */

// Nombres de grupos contables por país (grupos 1-9 del PGC)
export const ACCOUNT_GROUP_NAMES: Record<string, Record<string, string>> = {
  ES: {
    '1': 'Financiación Básica',
    '2': 'Inmovilizado',
    '3': 'Existencias',
    '4': 'Acreedores y Deudores',
    '5': 'Cuentas Financieras',
    '6': 'Compras y Gastos',
    '7': 'Ventas e Ingresos',
    '8': 'Gastos en Patrimonio Neto',
    '9': 'Ingresos en Patrimonio Neto'
  },
  AD: {
    '1': 'Finançament Bàsic',
    '2': 'Immobilitzat',
    '3': 'Existències',
    '4': 'Creditors i Deutors',
    '5': 'Comptes Financers',
    '6': 'Compres i Despeses',
    '7': 'Vendes i Ingressos',
    '8': 'Despeses en Patrimoni Net',
    '9': 'Ingressos en Patrimoni Net'
  },
  MX: {
    '1': 'Activo',
    '2': 'Pasivo',
    '3': 'Capital Contable',
    '4': 'Ingresos',
    '5': 'Costos y Gastos',
    '6': 'Cuentas de Orden',
    '7': 'Cuentas de Cierre',
    '8': 'Otros Resultados Integrales',
    '9': 'Cuentas de Consolidación'
  },
  CO: {
    '1': 'Activo',
    '2': 'Pasivo',
    '3': 'Patrimonio',
    '4': 'Ingresos',
    '5': 'Gastos',
    '6': 'Costos de Ventas',
    '7': 'Costos de Producción',
    '8': 'Cuentas de Orden Deudoras',
    '9': 'Cuentas de Orden Acreedoras'
  },
  AR: {
    '1': 'Activo',
    '2': 'Pasivo',
    '3': 'Patrimonio Neto',
    '4': 'Resultados',
    '5': 'Ingresos',
    '6': 'Egresos',
    '7': 'Cuentas de Orden',
    '8': 'Cuentas de Movimiento',
    '9': 'Cuentas Especiales'
  },
  CL: {
    '1': 'Activo',
    '2': 'Pasivo',
    '3': 'Patrimonio',
    '4': 'Resultado',
    '5': 'Ingresos de Explotación',
    '6': 'Costos de Explotación',
    '7': 'Gastos de Administración',
    '8': 'Otros Ingresos y Gastos',
    '9': 'Cuentas de Orden'
  }
};

// Tipos de cuenta con traducciones
export const ACCOUNT_TYPE_LABELS: Record<string, Record<string, string>> = {
  ES: {
    asset: 'Activo',
    liability: 'Pasivo',
    equity: 'Patrimonio Neto',
    income: 'Ingreso',
    expense: 'Gasto'
  },
  AD: {
    asset: 'Actiu',
    liability: 'Passiu',
    equity: 'Patrimoni Net',
    income: 'Ingrés',
    expense: 'Despesa'
  },
  MX: {
    asset: 'Activo',
    liability: 'Pasivo',
    equity: 'Capital',
    income: 'Ingreso',
    expense: 'Gasto'
  },
  CO: {
    asset: 'Activo',
    liability: 'Pasivo',
    equity: 'Patrimonio',
    income: 'Ingreso',
    expense: 'Gasto'
  },
  AR: {
    asset: 'Activo',
    liability: 'Pasivo',
    equity: 'Patrimonio Neto',
    income: 'Ingreso',
    expense: 'Egreso'
  },
  CL: {
    asset: 'Activo',
    liability: 'Pasivo',
    equity: 'Patrimonio',
    income: 'Ingreso',
    expense: 'Gasto'
  }
};

// Colores por tipo de cuenta
export const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  asset: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  liability: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  equity: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  income: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  expense: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
};

// Estados de asiento
export const ENTRY_STATUS_LABELS: Record<string, Record<string, string>> = {
  ES: {
    draft: 'Borrador',
    posted: 'Contabilizado',
    cancelled: 'Anulado'
  },
  AD: {
    draft: 'Esborrany',
    posted: 'Comptabilitzat',
    cancelled: 'Anul·lat'
  },
  MX: {
    draft: 'Borrador',
    posted: 'Contabilizado',
    cancelled: 'Cancelado'
  },
  CO: {
    draft: 'Borrador',
    posted: 'Contabilizado',
    cancelled: 'Anulado'
  },
  AR: {
    draft: 'Borrador',
    posted: 'Contabilizado',
    cancelled: 'Anulado'
  },
  CL: {
    draft: 'Borrador',
    posted: 'Contabilizado',
    cancelled: 'Anulado'
  }
};

// Colores de estado
export const ENTRY_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  posted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
};

// Nombres de diarios por país
export const JOURNAL_TYPE_LABELS: Record<string, Record<string, string>> = {
  ES: {
    sales: 'Ventas',
    purchases: 'Compras',
    bank: 'Banco',
    cash: 'Caja',
    general: 'Varios',
    opening: 'Apertura',
    closing: 'Cierre'
  },
  AD: {
    sales: 'Vendes',
    purchases: 'Compres',
    bank: 'Banc',
    cash: 'Caixa',
    general: 'Diversos',
    opening: 'Obertura',
    closing: 'Tancament'
  },
  MX: {
    sales: 'Ventas',
    purchases: 'Compras',
    bank: 'Bancos',
    cash: 'Caja',
    general: 'Diario General',
    opening: 'Apertura',
    closing: 'Cierre'
  },
  CO: {
    sales: 'Ventas',
    purchases: 'Compras',
    bank: 'Bancos',
    cash: 'Caja',
    general: 'General',
    opening: 'Apertura',
    closing: 'Cierre'
  },
  AR: {
    sales: 'Ventas',
    purchases: 'Compras',
    bank: 'Bancos',
    cash: 'Caja',
    general: 'Diario General',
    opening: 'Apertura',
    closing: 'Cierre'
  },
  CL: {
    sales: 'Ventas',
    purchases: 'Compras',
    bank: 'Bancos',
    cash: 'Caja',
    general: 'Libro Diario',
    opening: 'Apertura',
    closing: 'Cierre'
  }
};

// Función helper para obtener el grupo de una cuenta
export function getAccountGroup(accountCode: string): string {
  return accountCode.charAt(0);
}

// Función helper para determinar el tipo de cuenta por grupo
export function getAccountTypeByGroup(group: string): string {
  switch (group) {
    case '1':
    case '2':
    case '3':
    case '5':
      return 'asset';
    case '4':
      return 'liability'; // Acreedores/Deudores - depende del subgrupo
    case '6':
      return 'expense';
    case '7':
      return 'income';
    case '8':
      return 'expense'; // Gastos en PN
    case '9':
      return 'income'; // Ingresos en PN
    default:
      return 'asset';
  }
}

// Obtener nombre de grupo para un país
export function getGroupName(group: string, countryCode: string): string {
  const countryGroups = ACCOUNT_GROUP_NAMES[countryCode] || ACCOUNT_GROUP_NAMES.ES;
  return countryGroups[group] || `Grupo ${group}`;
}

// Obtener label de tipo de cuenta
export function getAccountTypeLabel(type: string, countryCode: string): string {
  const countryLabels = ACCOUNT_TYPE_LABELS[countryCode] || ACCOUNT_TYPE_LABELS.ES;
  return countryLabels[type] || type;
}

// Obtener label de estado de asiento
export function getEntryStatusLabel(status: string, countryCode: string): string {
  const countryLabels = ENTRY_STATUS_LABELS[countryCode] || ENTRY_STATUS_LABELS.ES;
  return countryLabels[status] || status;
}

// Obtener label de tipo de diario
export function getJournalTypeLabel(type: string, countryCode: string): string {
  const countryLabels = JOURNAL_TYPE_LABELS[countryCode] || JOURNAL_TYPE_LABELS.ES;
  return countryLabels[type] || type;
}

// Monedas por país
export const COUNTRY_CURRENCIES: Record<string, { code: string; symbol: string; name: string }> = {
  ES: { code: 'EUR', symbol: '€', name: 'Euro' },
  AD: { code: 'EUR', symbol: '€', name: 'Euro' },
  MX: { code: 'MXN', symbol: '$', name: 'Peso Mexicano' },
  CO: { code: 'COP', symbol: '$', name: 'Peso Colombiano' },
  AR: { code: 'ARS', symbol: '$', name: 'Peso Argentino' },
  CL: { code: 'CLP', symbol: '$', name: 'Peso Chileno' }
};

// Obtener moneda por país
export function getCountryCurrency(countryCode: string) {
  return COUNTRY_CURRENCIES[countryCode] || COUNTRY_CURRENCIES.ES;
}
