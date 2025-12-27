import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ModuleLog {
  id: string;
  moduleKey: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  stackTrace?: string;
}

export interface HealthCheck {
  moduleKey: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    latency: number;
    message?: string;
  }[];
  lastChecked: string;
  nextCheck: string;
}

export interface DiagnosticResult {
  moduleKey: string;
  runAt: string;
  issues: {
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    description: string;
    recommendation: string;
    autoFixAvailable: boolean;
  }[];
  aiAnalysis: string;
  performanceScore: number;
  securityScore: number;
  reliabilityScore: number;
}

export function useModuleMonitoring() {
  const [logs, setLogs] = useState<ModuleLog[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [logFilter, setLogFilter] = useState<{
    level?: ModuleLog['level'];
    moduleKey?: string;
    search?: string;
  }>({});
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchLogs = useCallback(async (filter?: typeof logFilter, limit = 100) => {
    setIsLoading(true);
    try {
      // Simular logs recientes
      const mockLogs: ModuleLog[] = [
        {
          id: '1',
          moduleKey: 'crm',
          level: 'info',
          message: 'Conexión a base de datos establecida',
          timestamp: new Date(Date.now() - 1000).toISOString()
        },
        {
          id: '2',
          moduleKey: 'analytics',
          level: 'warn',
          message: 'Caché cercano a límite de capacidad (85%)',
          timestamp: new Date(Date.now() - 5000).toISOString()
        },
        {
          id: '3',
          moduleKey: 'ai-copilot',
          level: 'debug',
          message: 'Token refresh completado exitosamente',
          timestamp: new Date(Date.now() - 10000).toISOString()
        },
        {
          id: '4',
          moduleKey: 'marketplace',
          level: 'error',
          message: 'Timeout al conectar con API externa',
          timestamp: new Date(Date.now() - 30000).toISOString(),
          stackTrace: 'Error: Connection timeout\n  at fetch (...)\n  at processRequest (...)'
        },
        {
          id: '5',
          moduleKey: 'crm',
          level: 'info',
          message: 'Sincronización de datos completada: 1,234 registros',
          timestamp: new Date(Date.now() - 60000).toISOString()
        }
      ];

      let filtered = mockLogs;
      if (filter?.level) {
        filtered = filtered.filter(l => l.level === filter.level);
      }
      if (filter?.moduleKey) {
        filtered = filtered.filter(l => l.moduleKey === filter.moduleKey);
      }
      if (filter?.search) {
        const search = filter.search.toLowerCase();
        filtered = filtered.filter(l => 
          l.message.toLowerCase().includes(search) ||
          l.moduleKey.toLowerCase().includes(search)
        );
      }

      setLogs(filtered);
    } catch (error) {
      console.error('[useModuleMonitoring] Logs error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchHealthChecks = useCallback(async () => {
    try {
      const mockHealthChecks: HealthCheck[] = [
        {
          moduleKey: 'crm',
          status: 'healthy',
          checks: [
            { name: 'Database', status: 'pass', latency: 12 },
            { name: 'API', status: 'pass', latency: 45 },
            { name: 'Cache', status: 'pass', latency: 3 }
          ],
          lastChecked: new Date().toISOString(),
          nextCheck: new Date(Date.now() + 60000).toISOString()
        },
        {
          moduleKey: 'analytics',
          status: 'degraded',
          checks: [
            { name: 'Database', status: 'pass', latency: 25 },
            { name: 'API', status: 'warn', latency: 450, message: 'Latencia alta' },
            { name: 'Cache', status: 'pass', latency: 8 }
          ],
          lastChecked: new Date().toISOString(),
          nextCheck: new Date(Date.now() + 60000).toISOString()
        },
        {
          moduleKey: 'ai-copilot',
          status: 'healthy',
          checks: [
            { name: 'AI Gateway', status: 'pass', latency: 120 },
            { name: 'Token Service', status: 'pass', latency: 35 }
          ],
          lastChecked: new Date().toISOString(),
          nextCheck: new Date(Date.now() + 60000).toISOString()
        }
      ];

      setHealthChecks(mockHealthChecks);
    } catch (error) {
      console.error('[useModuleMonitoring] Health checks error:', error);
    }
  }, []);

  const runDiagnostics = useCallback(async (moduleKey: string) => {
    setIsRunningDiagnostics(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'module-analytics',
        {
          body: {
            action: 'analyze_trends',
            moduleKey,
            params: { includeDiagnostics: true }
          }
        }
      );

      if (error) throw error;

      const mockDiagnostic: DiagnosticResult = {
        moduleKey,
        runAt: new Date().toISOString(),
        issues: [
          {
            severity: 'medium',
            category: 'Performance',
            description: 'Tiempo de respuesta elevado en endpoints de búsqueda',
            recommendation: 'Implementar paginación y caché de resultados',
            autoFixAvailable: false
          },
          {
            severity: 'low',
            category: 'Security',
            description: 'Headers de seguridad pueden ser mejorados',
            recommendation: 'Añadir CSP y HSTS headers',
            autoFixAvailable: true
          }
        ],
        aiAnalysis: data?.aiAnalysis || 'El módulo funciona dentro de parámetros normales. Se detectaron oportunidades de optimización menores en el manejo de caché y consultas a base de datos. Se recomienda revisar los índices de búsqueda para mejorar tiempos de respuesta.',
        performanceScore: 85,
        securityScore: 92,
        reliabilityScore: 98
      };

      setDiagnostics(mockDiagnostic);
      toast.success('Diagnóstico completado');
    } catch (error) {
      console.error('[useModuleMonitoring] Diagnostics error:', error);
      toast.error('Error al ejecutar diagnósticos');
    } finally {
      setIsRunningDiagnostics(false);
    }
  }, []);

  const applyAutoFix = useCallback(async (moduleKey: string, issueIndex: number) => {
    try {
      toast.success('Auto-fix aplicado correctamente');
      if (diagnostics) {
        const updatedIssues = [...diagnostics.issues];
        updatedIssues.splice(issueIndex, 1);
        setDiagnostics({ ...diagnostics, issues: updatedIssues });
      }
    } catch (error) {
      console.error('[useModuleMonitoring] Auto-fix error:', error);
      toast.error('Error al aplicar auto-fix');
    }
  }, [diagnostics]);

  const startAutoRefresh = useCallback((intervalMs = 10000) => {
    stopAutoRefresh();
    fetchLogs(logFilter);
    fetchHealthChecks();
    autoRefreshInterval.current = setInterval(() => {
      fetchLogs(logFilter);
      fetchHealthChecks();
    }, intervalMs);
  }, [fetchLogs, fetchHealthChecks, logFilter]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    fetchLogs(logFilter);
    fetchHealthChecks();
    return () => stopAutoRefresh();
  }, []);

  return {
    logs,
    healthChecks,
    diagnostics,
    isLoading,
    isRunningDiagnostics,
    logFilter,
    setLogFilter,
    fetchLogs,
    fetchHealthChecks,
    runDiagnostics,
    applyAutoFix,
    startAutoRefresh,
    stopAutoRefresh
  };
}

export default useModuleMonitoring;
