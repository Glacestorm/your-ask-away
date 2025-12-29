/**
 * ObelixIA Fixed Assets Hook
 * Fase 15 - Enterprise SaaS 2025-2026
 * 
 * Gestión de activos fijos con depreciación automática,
 * control de inventario y valorización
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface FixedAsset {
  id: string;
  code: string;
  name: string;
  description: string;
  category: AssetCategory;
  subcategory?: string;
  location: string;
  department?: string;
  responsiblePerson?: string;
  
  // Información financiera
  acquisitionDate: string;
  acquisitionCost: number;
  residualValue: number;
  usefulLifeMonths: number;
  depreciationMethod: 'straight_line' | 'declining_balance' | 'units_of_production' | 'sum_of_years';
  depreciationRate?: number;
  
  // Estado actual
  currentValue: number;
  accumulatedDepreciation: number;
  monthlyDepreciation: number;
  remainingLifeMonths: number;
  status: 'active' | 'fully_depreciated' | 'disposed' | 'impaired' | 'under_maintenance';
  
  // Cuentas contables
  assetAccountId: string;
  assetAccountCode: string;
  depreciationExpenseAccountId: string;
  depreciationExpenseAccountCode: string;
  accumulatedDepreciationAccountId: string;
  accumulatedDepreciationAccountCode: string;
  
  // Información adicional
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  warrantyExpiration?: string;
  insurancePolicy?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  
  // Auditoría
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastDepreciationDate?: string;
}

export type AssetCategory = 
  | 'buildings'
  | 'machinery'
  | 'vehicles'
  | 'furniture'
  | 'equipment'
  | 'computers'
  | 'software'
  | 'leasehold_improvements'
  | 'land'
  | 'other';

export interface AssetDepreciationSchedule {
  assetId: string;
  schedule: Array<{
    period: string;
    month: number;
    year: number;
    openingValue: number;
    depreciation: number;
    closingValue: number;
    accumulatedDepreciation: number;
  }>;
  totalDepreciation: number;
  fullyDepreciatedDate: string;
}

export interface AssetDisposal {
  id: string;
  assetId: string;
  disposalDate: string;
  disposalType: 'sale' | 'scrapping' | 'donation' | 'trade_in' | 'theft_loss';
  salePrice?: number;
  buyerInfo?: string;
  bookValueAtDisposal: number;
  gainLoss: number;
  reason: string;
  approvedBy?: string;
  journalEntryId?: string;
  status: 'pending' | 'approved' | 'completed';
  createdAt: string;
}

export interface AssetImpairment {
  id: string;
  assetId: string;
  impairmentDate: string;
  previousValue: number;
  impairmentAmount: number;
  newValue: number;
  reason: string;
  recoverableAmount?: number;
  journalEntryId?: string;
  createdAt: string;
}

export interface AssetRevaluation {
  id: string;
  assetId: string;
  revaluationDate: string;
  previousValue: number;
  newValue: number;
  revaluationSurplus: number;
  basis: string;
  appraiserId?: string;
  journalEntryId?: string;
  createdAt: string;
}

export interface AssetMaintenanceRecord {
  id: string;
  assetId: string;
  maintenanceDate: string;
  type: 'preventive' | 'corrective' | 'upgrade';
  description: string;
  cost: number;
  performedBy: string;
  nextScheduledDate?: string;
  notes?: string;
  createdAt: string;
}

export interface AssetStats {
  totalAssets: number;
  totalValue: number;
  totalAccumulatedDepreciation: number;
  netBookValue: number;
  activeAssets: number;
  fullyDepreciatedAssets: number;
  monthlyDepreciationTotal: number;
  assetsByCategory: Record<AssetCategory, { count: number; value: number }>;
  upcomingMaintenance: number;
  assetsNearEndOfLife: number;
}

// === HOOK ===
export function useObelixiaFixedAssets() {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);
  const [depreciationSchedule, setDepreciationSchedule] = useState<AssetDepreciationSchedule | null>(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState<AssetMaintenanceRecord[]>([]);
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // === OBTENER ACTIVOS ===
  const fetchAssets = useCallback(async (filters?: {
    category?: AssetCategory;
    status?: string;
    location?: string;
  }) => {
    setIsLoading(true);
    try {
      // Datos de demostración
      const demoAssets: FixedAsset[] = [
        {
          id: 'asset-001',
          code: 'EQ-001',
          name: 'Servidor HP ProLiant DL380',
          description: 'Servidor principal de producción',
          category: 'computers',
          location: 'Oficina Central - Sala Servidores',
          department: 'IT',
          responsiblePerson: 'Carlos Martínez',
          acquisitionDate: '2022-06-15',
          acquisitionCost: 12500,
          residualValue: 500,
          usefulLifeMonths: 60,
          depreciationMethod: 'straight_line',
          currentValue: 7500,
          accumulatedDepreciation: 5000,
          monthlyDepreciation: 200,
          remainingLifeMonths: 30,
          status: 'active',
          assetAccountId: 'acc-computer',
          assetAccountCode: '217',
          depreciationExpenseAccountId: 'acc-dep-exp',
          depreciationExpenseAccountCode: '681',
          accumulatedDepreciationAccountId: 'acc-accum-dep',
          accumulatedDepreciationAccountCode: '281',
          serialNumber: 'HP-DL380-2022-001',
          manufacturer: 'HP',
          model: 'ProLiant DL380 Gen10',
          warrantyExpiration: '2025-06-15',
          lastMaintenanceDate: '2024-11-20',
          nextMaintenanceDate: '2025-02-20',
          createdAt: '2022-06-15T00:00:00Z',
          updatedAt: new Date().toISOString(),
          lastDepreciationDate: '2024-12-31'
        },
        {
          id: 'asset-002',
          code: 'VH-001',
          name: 'Vehículo Ford Transit',
          description: 'Furgoneta de reparto',
          category: 'vehicles',
          location: 'Almacén - Parking',
          department: 'Logística',
          responsiblePerson: 'Juan García',
          acquisitionDate: '2021-03-10',
          acquisitionCost: 28000,
          residualValue: 5000,
          usefulLifeMonths: 96,
          depreciationMethod: 'straight_line',
          currentValue: 19250,
          accumulatedDepreciation: 8750,
          monthlyDepreciation: 239.58,
          remainingLifeMonths: 60,
          status: 'active',
          assetAccountId: 'acc-vehicles',
          assetAccountCode: '218',
          depreciationExpenseAccountId: 'acc-dep-exp',
          depreciationExpenseAccountCode: '681',
          accumulatedDepreciationAccountId: 'acc-accum-dep-veh',
          accumulatedDepreciationAccountCode: '282',
          serialNumber: 'WF0XXXGCDXKA12345',
          manufacturer: 'Ford',
          model: 'Transit Custom',
          insurancePolicy: 'POL-2024-001234',
          lastMaintenanceDate: '2024-10-15',
          nextMaintenanceDate: '2025-04-15',
          createdAt: '2021-03-10T00:00:00Z',
          updatedAt: new Date().toISOString(),
          lastDepreciationDate: '2024-12-31'
        },
        {
          id: 'asset-003',
          code: 'MB-001',
          name: 'Mobiliario Oficina Planta 2',
          description: 'Conjunto de mesas, sillas y armarios',
          category: 'furniture',
          location: 'Oficina Central - Planta 2',
          department: 'Administración',
          acquisitionDate: '2020-01-15',
          acquisitionCost: 15000,
          residualValue: 0,
          usefulLifeMonths: 120,
          depreciationMethod: 'straight_line',
          currentValue: 7500,
          accumulatedDepreciation: 7500,
          monthlyDepreciation: 125,
          remainingLifeMonths: 60,
          status: 'active',
          assetAccountId: 'acc-furniture',
          assetAccountCode: '216',
          depreciationExpenseAccountId: 'acc-dep-exp',
          depreciationExpenseAccountCode: '681',
          accumulatedDepreciationAccountId: 'acc-accum-dep-fur',
          accumulatedDepreciationAccountCode: '286',
          createdAt: '2020-01-15T00:00:00Z',
          updatedAt: new Date().toISOString(),
          lastDepreciationDate: '2024-12-31'
        },
        {
          id: 'asset-004',
          code: 'SW-001',
          name: 'Licencia Microsoft 365 Enterprise',
          description: 'Licencia perpetua para 50 usuarios',
          category: 'software',
          location: 'N/A',
          department: 'IT',
          acquisitionDate: '2023-01-01',
          acquisitionCost: 8500,
          residualValue: 0,
          usefulLifeMonths: 36,
          depreciationMethod: 'straight_line',
          currentValue: 2833.33,
          accumulatedDepreciation: 5666.67,
          monthlyDepreciation: 236.11,
          remainingLifeMonths: 12,
          status: 'active',
          assetAccountId: 'acc-software',
          assetAccountCode: '206',
          depreciationExpenseAccountId: 'acc-amort-exp',
          depreciationExpenseAccountCode: '680',
          accumulatedDepreciationAccountId: 'acc-accum-amort',
          accumulatedDepreciationAccountCode: '280',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: new Date().toISOString(),
          lastDepreciationDate: '2024-12-31'
        },
        {
          id: 'asset-005',
          code: 'MQ-001',
          name: 'Máquina CNC Haas VF-2',
          description: 'Centro de mecanizado vertical',
          category: 'machinery',
          location: 'Planta de Producción - Zona 3',
          department: 'Producción',
          responsiblePerson: 'Pedro López',
          acquisitionDate: '2019-08-20',
          acquisitionCost: 85000,
          residualValue: 10000,
          usefulLifeMonths: 180,
          depreciationMethod: 'straight_line',
          currentValue: 57916.67,
          accumulatedDepreciation: 27083.33,
          monthlyDepreciation: 416.67,
          remainingLifeMonths: 115,
          status: 'active',
          assetAccountId: 'acc-machinery',
          assetAccountCode: '213',
          depreciationExpenseAccountId: 'acc-dep-exp',
          depreciationExpenseAccountCode: '681',
          accumulatedDepreciationAccountId: 'acc-accum-dep-maq',
          accumulatedDepreciationAccountCode: '283',
          serialNumber: 'HAAS-VF2-2019-0584',
          manufacturer: 'Haas',
          model: 'VF-2',
          lastMaintenanceDate: '2024-12-01',
          nextMaintenanceDate: '2025-03-01',
          createdAt: '2019-08-20T00:00:00Z',
          updatedAt: new Date().toISOString(),
          lastDepreciationDate: '2024-12-31'
        },
        {
          id: 'asset-006',
          code: 'EQ-002',
          name: 'Impresora Xerox VersaLink',
          description: 'Impresora multifunción departamental',
          category: 'equipment',
          location: 'Oficina Central - Planta 1',
          department: 'Administración',
          acquisitionDate: '2018-05-10',
          acquisitionCost: 3500,
          residualValue: 0,
          usefulLifeMonths: 60,
          depreciationMethod: 'straight_line',
          currentValue: 0,
          accumulatedDepreciation: 3500,
          monthlyDepreciation: 0,
          remainingLifeMonths: 0,
          status: 'fully_depreciated',
          assetAccountId: 'acc-equipment',
          assetAccountCode: '215',
          depreciationExpenseAccountId: 'acc-dep-exp',
          depreciationExpenseAccountCode: '681',
          accumulatedDepreciationAccountId: 'acc-accum-dep-eq',
          accumulatedDepreciationAccountCode: '285',
          serialNumber: 'XEROX-VL-2018-0234',
          manufacturer: 'Xerox',
          model: 'VersaLink C7025',
          createdAt: '2018-05-10T00:00:00Z',
          updatedAt: new Date().toISOString(),
          lastDepreciationDate: '2023-05-10'
        }
      ];

      setAssets(demoAssets);
      return demoAssets;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === CALCULAR CALENDARIO DE DEPRECIACIÓN ===
  const calculateDepreciationSchedule = useCallback(async (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return null;

    const schedule: AssetDepreciationSchedule['schedule'] = [];
    const monthlyDep = (asset.acquisitionCost - asset.residualValue) / asset.usefulLifeMonths;
    
    let openingValue = asset.acquisitionCost;
    let accumulatedDep = 0;
    const startDate = new Date(asset.acquisitionDate);

    for (let i = 0; i < asset.usefulLifeMonths; i++) {
      const currentDate = new Date(startDate);
      currentDate.setMonth(currentDate.getMonth() + i);
      
      const depreciation = i === asset.usefulLifeMonths - 1 
        ? openingValue - asset.residualValue 
        : monthlyDep;
      
      accumulatedDep += depreciation;
      const closingValue = openingValue - depreciation;

      schedule.push({
        period: currentDate.toISOString().slice(0, 7),
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        openingValue: Math.round(openingValue * 100) / 100,
        depreciation: Math.round(depreciation * 100) / 100,
        closingValue: Math.round(closingValue * 100) / 100,
        accumulatedDepreciation: Math.round(accumulatedDep * 100) / 100
      });

      openingValue = closingValue;
    }

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + asset.usefulLifeMonths);

    const depSchedule: AssetDepreciationSchedule = {
      assetId,
      schedule,
      totalDepreciation: asset.acquisitionCost - asset.residualValue,
      fullyDepreciatedDate: endDate.toISOString()
    };

    setDepreciationSchedule(depSchedule);
    return depSchedule;
  }, [assets]);

  // === EJECUTAR DEPRECIACIÓN MENSUAL ===
  const runMonthlyDepreciation = useCallback(async (period: { year: number; month: number }) => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const activeAssets = assets.filter(a => a.status === 'active' && a.monthlyDepreciation > 0);
      const totalDepreciation = activeAssets.reduce((sum, a) => sum + a.monthlyDepreciation, 0);

      // Actualizar activos
      setAssets(prev => prev.map(asset => {
        if (asset.status !== 'active' || asset.monthlyDepreciation <= 0) return asset;

        const newAccumulatedDep = asset.accumulatedDepreciation + asset.monthlyDepreciation;
        const newCurrentValue = asset.acquisitionCost - newAccumulatedDep;
        const newRemainingLife = asset.remainingLifeMonths - 1;

        return {
          ...asset,
          accumulatedDepreciation: newAccumulatedDep,
          currentValue: Math.max(newCurrentValue, asset.residualValue),
          remainingLifeMonths: Math.max(newRemainingLife, 0),
          status: newRemainingLife <= 0 ? 'fully_depreciated' : asset.status,
          lastDepreciationDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }));

      toast.success(`Depreciación ejecutada: ${activeAssets.length} activos por €${totalDepreciation.toFixed(2)}`);
      return { assetsProcessed: activeAssets.length, totalDepreciation };
    } catch (err) {
      toast.error('Error al ejecutar depreciación');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [assets]);

  // === CREAR ACTIVO ===
  const createAsset = useCallback(async (assetData: Partial<FixedAsset>) => {
    setIsProcessing(true);
    try {
      const newAsset: FixedAsset = {
        id: `asset-${Date.now()}`,
        code: assetData.code || `NEW-${Date.now().toString().slice(-4)}`,
        name: assetData.name || '',
        description: assetData.description || '',
        category: assetData.category || 'other',
        location: assetData.location || '',
        acquisitionDate: assetData.acquisitionDate || new Date().toISOString().slice(0, 10),
        acquisitionCost: assetData.acquisitionCost || 0,
        residualValue: assetData.residualValue || 0,
        usefulLifeMonths: assetData.usefulLifeMonths || 60,
        depreciationMethod: assetData.depreciationMethod || 'straight_line',
        currentValue: assetData.acquisitionCost || 0,
        accumulatedDepreciation: 0,
        monthlyDepreciation: ((assetData.acquisitionCost || 0) - (assetData.residualValue || 0)) / (assetData.usefulLifeMonths || 60),
        remainingLifeMonths: assetData.usefulLifeMonths || 60,
        status: 'active',
        assetAccountId: assetData.assetAccountId || '',
        assetAccountCode: assetData.assetAccountCode || '',
        depreciationExpenseAccountId: assetData.depreciationExpenseAccountId || '',
        depreciationExpenseAccountCode: assetData.depreciationExpenseAccountCode || '',
        accumulatedDepreciationAccountId: assetData.accumulatedDepreciationAccountId || '',
        accumulatedDepreciationAccountCode: assetData.accumulatedDepreciationAccountCode || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setAssets(prev => [...prev, newAsset]);
      toast.success(`Activo "${newAsset.name}" creado correctamente`);
      return newAsset;
    } catch (err) {
      toast.error('Error al crear activo');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // === DISPONER ACTIVO ===
  const disposeAsset = useCallback(async (disposal: Omit<AssetDisposal, 'id' | 'createdAt' | 'bookValueAtDisposal' | 'gainLoss'>) => {
    setIsProcessing(true);
    try {
      const asset = assets.find(a => a.id === disposal.assetId);
      if (!asset) throw new Error('Activo no encontrado');

      const bookValue = asset.currentValue;
      const salePrice = disposal.salePrice || 0;
      const gainLoss = salePrice - bookValue;

      setAssets(prev => prev.map(a =>
        a.id === disposal.assetId
          ? { ...a, status: 'disposed' as const, updatedAt: new Date().toISOString() }
          : a
      ));

      toast.success(
        gainLoss >= 0
          ? `Activo dado de baja con ganancia de €${gainLoss.toFixed(2)}`
          : `Activo dado de baja con pérdida de €${Math.abs(gainLoss).toFixed(2)}`
      );

      return { bookValue, gainLoss };
    } catch (err) {
      toast.error('Error al dar de baja el activo');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [assets]);

  // === OBTENER ESTADÍSTICAS ===
  const fetchStats = useCallback(async () => {
    const assetsByCategory: Record<AssetCategory, { count: number; value: number }> = {
      buildings: { count: 0, value: 0 },
      machinery: { count: 0, value: 0 },
      vehicles: { count: 0, value: 0 },
      furniture: { count: 0, value: 0 },
      equipment: { count: 0, value: 0 },
      computers: { count: 0, value: 0 },
      software: { count: 0, value: 0 },
      leasehold_improvements: { count: 0, value: 0 },
      land: { count: 0, value: 0 },
      other: { count: 0, value: 0 }
    };

    let totalValue = 0;
    let totalAccumDep = 0;
    let monthlyDep = 0;
    let activeCount = 0;
    let fullyDepCount = 0;
    let nearEndOfLife = 0;

    assets.forEach(asset => {
      assetsByCategory[asset.category].count++;
      assetsByCategory[asset.category].value += asset.currentValue;
      totalValue += asset.acquisitionCost;
      totalAccumDep += asset.accumulatedDepreciation;
      monthlyDep += asset.monthlyDepreciation;
      
      if (asset.status === 'active') activeCount++;
      if (asset.status === 'fully_depreciated') fullyDepCount++;
      if (asset.remainingLifeMonths <= 6 && asset.status === 'active') nearEndOfLife++;
    });

    const demoStats: AssetStats = {
      totalAssets: assets.length,
      totalValue,
      totalAccumulatedDepreciation: totalAccumDep,
      netBookValue: totalValue - totalAccumDep,
      activeAssets: activeCount,
      fullyDepreciatedAssets: fullyDepCount,
      monthlyDepreciationTotal: monthlyDep,
      assetsByCategory,
      upcomingMaintenance: 3,
      assetsNearEndOfLife: nearEndOfLife
    };

    setStats(demoStats);
    return demoStats;
  }, [assets]);

  // === INICIALIZAR ===
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    if (assets.length > 0) {
      fetchStats();
    }
  }, [assets, fetchStats]);

  return {
    // Estado
    isLoading,
    isProcessing,
    assets,
    selectedAsset,
    depreciationSchedule,
    maintenanceRecords,
    stats,
    error,

    // Acciones CRUD
    fetchAssets,
    createAsset,
    setSelectedAsset,
    disposeAsset,

    // Depreciación
    calculateDepreciationSchedule,
    runMonthlyDepreciation,

    // Estadísticas
    fetchStats
  };
}

export default useObelixiaFixedAssets;
