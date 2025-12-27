import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle2, XCircle, AlertCircle, Search, 
  Package, Code, FileCode2, BarChart3, Filter,
  ChevronDown, ChevronUp, RefreshCw, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mapeo de module_key a archivos de código existentes
const IMPLEMENTED_MODULES: Record<string, { files: string[]; status: 'full' | 'partial' | 'placeholder' }> = {
  // Core CRM
  'crm-companies': { files: ['CompaniesManager.tsx', 'CompanyForm.tsx'], status: 'full' },
  'crm-contacts': { files: ['ContactsManager.tsx'], status: 'full' },
  'crm-visits': { files: ['VisitsManager.tsx', 'VisitSheetForm.tsx'], status: 'full' },
  'crm-opportunities': { files: ['OpportunitiesManager.tsx', 'KanbanPage.tsx'], status: 'full' },
  'crm-tasks': { files: ['TasksManager.tsx'], status: 'full' },
  'crm-calendar': { files: ['Calendar.tsx', 'CalendarWidget.tsx'], status: 'full' },
  
  // Accounting
  'accounting-invoices': { files: ['InvoicesManager.tsx'], status: 'full' },
  'accounting-expenses': { files: ['ExpensesManager.tsx'], status: 'full' },
  'accounting-reports': { files: ['AccountingReports.tsx'], status: 'partial' },
  'accounting-treasury': { files: ['TreasuryManager.tsx'], status: 'partial' },
  
  // AI Modules
  'ai-assistant': { files: ['IntelligentAssistant.tsx', 'AIAssistantPanel.tsx'], status: 'full' },
  'ai-predictions': { files: ['PredictionsPanel.tsx', 'AnalyticsPredictions.tsx'], status: 'full' },
  'ai-sentiment': { files: ['SentimentAnalysis.tsx', 'SentimentPage.tsx'], status: 'full' },
  'ai-agents': { files: ['AIAgentsPage.tsx', 'AutonomousAgentManager.tsx'], status: 'full' },
  'ai-recommendations': { files: ['RecommendationsEngine.tsx'], status: 'partial' },
  
  // Analytics
  'analytics-dashboard': { files: ['AnalyticsDashboard.tsx', 'AdminDashboard.tsx'], status: 'full' },
  'analytics-reports': { files: ['ReportsManager.tsx'], status: 'full' },
  'analytics-kpis': { files: ['KPIsDashboard.tsx'], status: 'full' },
  'analytics-predictions': { files: ['PredictionsPanel.tsx'], status: 'full' },
  
  // ESG
  'esg-carbon': { files: ['CarbonFootprintPanel.tsx'], status: 'full' },
  'esg-sustainability': { files: ['ESGSustainabilityPage.tsx'], status: 'full' },
  'esg-compliance': { files: ['ESGCompliancePanel.tsx'], status: 'partial' },
  
  // Automation
  'automation-workflows': { files: ['WorkflowBuilder.tsx', 'AutomationEnginePage.tsx'], status: 'full' },
  'automation-rules': { files: ['RulesManager.tsx'], status: 'partial' },
  'automation-triggers': { files: ['TriggersManager.tsx'], status: 'partial' },
  
  // Maps
  'gis-maps': { files: ['Map3D.tsx', 'MapView.tsx', 'GISPage.tsx'], status: 'full' },
  'gis-routes': { files: ['RouteOptimizer.tsx'], status: 'partial' },
  'gis-territories': { files: ['TerritoryManager.tsx'], status: 'partial' },
  
  // Integrations
  'integration-email': { files: ['EmailIntegration.tsx'], status: 'partial' },
  'integration-calendar': { files: ['CalendarIntegration.tsx'], status: 'partial' },
  'integration-whatsapp': { files: ['WhatsAppIntegration.tsx'], status: 'partial' },
  
  // Documents
  'docs-manager': { files: ['DocumentManager.tsx', 'DocsPage.tsx'], status: 'full' },
  'docs-templates': { files: ['TemplatesManager.tsx'], status: 'partial' },
  
  // Support
  'support-tickets': { files: ['SupportTicketsManager.tsx'], status: 'full' },
  'support-knowledge': { files: ['KnowledgeBase.tsx'], status: 'partial' },
  
  // Revenue
  'revenue-forecasting': { files: ['RevenueForecast.tsx', 'RevenuePage.tsx'], status: 'full' },
  'revenue-pipeline': { files: ['PipelineManager.tsx'], status: 'partial' },
  
  // Compliance
  'compliance-gdpr': { files: ['GDPRCompliance.tsx', 'CompliancePage.tsx'], status: 'full' },
  'compliance-audit': { files: ['AuditManager.tsx'], status: 'partial' },
};

interface AppModule {
  id: string;
  module_key: string;
  module_name: string;
  description: string | null;
  category: string;
  sector: string | null;
  version: string | null;
  base_price: number | null;
  is_core: boolean | null;
}

interface CoverageStats {
  total: number;
  implemented: number;
  partial: number;
  notImplemented: number;
  coveragePercent: number;
}

export const ModuleCoverageAnalyzer: React.FC = () => {
  const [modules, setModules] = useState<AppModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'implemented' | 'partial' | 'not-implemented'>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_modules')
        .select('*')
        .order('category', { ascending: true })
        .order('module_name', { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModuleStatus = (moduleKey: string): 'full' | 'partial' | 'none' => {
    const impl = IMPLEMENTED_MODULES[moduleKey];
    if (!impl) return 'none';
    return impl.status === 'full' ? 'full' : 'partial';
  };

  const getModuleFiles = (moduleKey: string): string[] => {
    return IMPLEMENTED_MODULES[moduleKey]?.files || [];
  };

  // Calcular estadísticas
  const stats = useMemo((): CoverageStats => {
    const implemented = modules.filter(m => getModuleStatus(m.module_key) === 'full').length;
    const partial = modules.filter(m => getModuleStatus(m.module_key) === 'partial').length;
    const notImplemented = modules.filter(m => getModuleStatus(m.module_key) === 'none').length;
    
    return {
      total: modules.length,
      implemented,
      partial,
      notImplemented,
      coveragePercent: modules.length > 0 
        ? Math.round(((implemented + partial * 0.5) / modules.length) * 100) 
        : 0
    };
  }, [modules]);

  // Agrupar por categoría
  const modulesByCategory = useMemo(() => {
    const grouped: Record<string, AppModule[]> = {};
    
    modules
      .filter(m => {
        const matchesSearch = m.module_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             m.module_key.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
        const status = getModuleStatus(m.module_key);
        const matchesStatus = statusFilter === 'all' ||
                             (statusFilter === 'implemented' && status === 'full') ||
                             (statusFilter === 'partial' && status === 'partial') ||
                             (statusFilter === 'not-implemented' && status === 'none');
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .forEach(m => {
        if (!grouped[m.category]) grouped[m.category] = [];
        grouped[m.category].push(m);
      });

    return grouped;
  }, [modules, searchTerm, categoryFilter, statusFilter]);

  const categories = useMemo(() => 
    [...new Set(modules.map(m => m.category))].sort(),
    [modules]
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(Object.keys(modulesByCategory)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const getStatusBadge = (status: 'full' | 'partial' | 'none') => {
    switch (status) {
      case 'full':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Implementado
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Parcial
          </Badge>
        );
      case 'none':
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Sin código
          </Badge>
        );
    }
  };

  const getCategoryStats = (categoryModules: AppModule[]) => {
    const full = categoryModules.filter(m => getModuleStatus(m.module_key) === 'full').length;
    const partial = categoryModules.filter(m => getModuleStatus(m.module_key) === 'partial').length;
    const none = categoryModules.filter(m => getModuleStatus(m.module_key) === 'none').length;
    return { full, partial, none, total: categoryModules.length };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/40 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Análisis de Cobertura</h2>
            <p className="text-sm text-muted-foreground">
              Módulos en tienda vs código implementado
            </p>
          </div>
        </div>
        <Button onClick={fetchModules} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Tienda</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.implemented}</p>
                <p className="text-xs text-muted-foreground">Implementados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.partial}</p>
                <p className="text-xs text-muted-foreground">Parciales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.notImplemented}</p>
                <p className="text-xs text-muted-foreground">Sin Código</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Cobertura</span>
                <span className="text-lg font-bold">{stats.coveragePercent}%</span>
              </div>
              <Progress value={stats.coveragePercent} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar módulos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos los estados</option>
              <option value="implemented">✅ Implementados</option>
              <option value="partial">⚠️ Parciales</option>
              <option value="not-implemented">❌ Sin código</option>
            </select>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expandir todo
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Colapsar todo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules by Category */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {Object.entries(modulesByCategory).map(([category, categoryModules]) => {
            const catStats = getCategoryStats(categoryModules);
            const isExpanded = expandedCategories.has(category);
            
            return (
              <Card key={category}>
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                      <CardTitle className="text-lg">{category}</CardTitle>
                      <Badge variant="outline">{categoryModules.length} módulos</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/10 text-green-600">{catStats.full}</Badge>
                      <Badge className="bg-amber-500/10 text-amber-600">{catStats.partial}</Badge>
                      <Badge className="bg-red-500/10 text-red-600">{catStats.none}</Badge>
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categoryModules.map(module => {
                        const status = getModuleStatus(module.module_key);
                        const files = getModuleFiles(module.module_key);
                        
                        return (
                          <div 
                            key={module.id}
                            className={cn(
                              "p-3 rounded-lg border transition-colors",
                              status === 'full' && "border-green-500/20 bg-green-500/5",
                              status === 'partial' && "border-amber-500/20 bg-amber-500/5",
                              status === 'none' && "border-red-500/20 bg-red-500/5"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{module.module_name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{module.module_key}</p>
                              </div>
                              {getStatusBadge(status)}
                            </div>
                            
                            {files.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {files.slice(0, 2).map(file => (
                                  <Badge key={file} variant="outline" className="text-xs font-mono">
                                    <FileCode2 className="h-3 w-3 mr-1" />
                                    {file}
                                  </Badge>
                                ))}
                                {files.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{files.length - 2} más
                                  </Badge>
                                )}
                              </div>
                            )}
                            
                            {status === 'none' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full mt-2 text-xs"
                              >
                                <Sparkles className="h-3 w-3 mr-1" />
                                Generar código
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ModuleCoverageAnalyzer;
