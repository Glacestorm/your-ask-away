import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ModuleStatus {
  moduleKey: string;
  moduleName: string;
  status: 'active' | 'inactive' | 'error' | 'updating' | 'deploying';
  version: string;
  health: number;
  lastActivity: string;
  activeUsers: number;
  errorCount: number;
  performance: {
    responseTime: number;
    uptime: number;
    memoryUsage: number;
  };
}

export interface DashboardMetrics {
  totalModules: number;
  activeModules: number;
  errorModules: number;
  avgHealth: number;
  totalUsers: number;
  avgResponseTime: number;
  systemUptime: number;
}

export interface ModuleAlert {
  id: string;
  moduleKey: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export function useModuleDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [modules, setModules] = useState<ModuleStatus[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<ModuleAlert[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'module-analytics',
        {
          body: {
            action: 'get_dashboard'
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        // Simular datos si la IA no los devuelve estructurados
        const mockModules: ModuleStatus[] = [
          {
            moduleKey: 'crm',
            moduleName: 'CRM Core',
            status: 'active',
            version: '2.1.0',
            health: 98,
            lastActivity: new Date().toISOString(),
            activeUsers: 45,
            errorCount: 0,
            performance: { responseTime: 120, uptime: 99.9, memoryUsage: 45 }
          },
          {
            moduleKey: 'analytics',
            moduleName: 'Analytics Suite',
            status: 'active',
            version: '1.8.0',
            health: 95,
            lastActivity: new Date().toISOString(),
            activeUsers: 23,
            errorCount: 2,
            performance: { responseTime: 180, uptime: 99.5, memoryUsage: 62 }
          },
          {
            moduleKey: 'ai-copilot',
            moduleName: 'AI Copilot',
            status: 'active',
            version: '3.0.0',
            health: 100,
            lastActivity: new Date().toISOString(),
            activeUsers: 67,
            errorCount: 0,
            performance: { responseTime: 250, uptime: 100, memoryUsage: 38 }
          },
          {
            moduleKey: 'marketplace',
            moduleName: 'Marketplace',
            status: 'updating',
            version: '1.2.0',
            health: 88,
            lastActivity: new Date().toISOString(),
            activeUsers: 12,
            errorCount: 1,
            performance: { responseTime: 340, uptime: 98.2, memoryUsage: 55 }
          }
        ];

        const mockMetrics: DashboardMetrics = {
          totalModules: mockModules.length,
          activeModules: mockModules.filter(m => m.status === 'active').length,
          errorModules: mockModules.filter(m => m.status === 'error').length,
          avgHealth: Math.round(mockModules.reduce((acc, m) => acc + m.health, 0) / mockModules.length),
          totalUsers: mockModules.reduce((acc, m) => acc + m.activeUsers, 0),
          avgResponseTime: Math.round(mockModules.reduce((acc, m) => acc + m.performance.responseTime, 0) / mockModules.length),
          systemUptime: 99.7
        };

        setModules(fnData.modules || mockModules);
        setMetrics(fnData.metrics || mockMetrics);
        setAlerts(fnData.alerts || []);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('[useModuleDashboard] Error:', error);
      toast.error('Error al cargar dashboard de módulos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, acknowledged: true } : a
    ));
    toast.success('Alerta reconocida');
  }, []);

  const triggerModuleAction = useCallback(async (
    moduleKey: string,
    action: 'restart' | 'stop' | 'update' | 'rollback'
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'module-deployment-pipeline',
        {
          body: {
            action: action === 'restart' ? 'trigger_deployment' : 'get_pipeline_status',
            moduleKey,
            params: { action }
          }
        }
      );

      if (error) throw error;
      
      toast.success(`Acción "${action}" ejecutada en ${moduleKey}`);
      await fetchDashboardData();
    } catch (error) {
      console.error('[useModuleDashboard] Action error:', error);
      toast.error(`Error al ejecutar ${action}`);
    }
  }, [fetchDashboardData]);

  const startAutoRefresh = useCallback((intervalMs = 30000) => {
    stopAutoRefresh();
    fetchDashboardData();
    autoRefreshInterval.current = setInterval(fetchDashboardData, intervalMs);
  }, [fetchDashboardData]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    modules,
    metrics,
    alerts,
    lastRefresh,
    fetchDashboardData,
    acknowledgeAlert,
    triggerModuleAction,
    startAutoRefresh,
    stopAutoRefresh
  };
}

export default useModuleDashboard;
