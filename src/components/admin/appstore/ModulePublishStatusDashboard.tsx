/**
 * ModulePublishStatusDashboard - Dashboard de estado de publicación de módulos
 * Muestra qué módulos tienen código actualizado pero no han sido publicados
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Search,
  ArrowUp,
  GitBranch,
  Package,
  Rocket,
  AlertTriangle,
  Filter,
  ChevronRight,
  History,
  TrendingUp
} from 'lucide-react';

interface ModulePublishStatus {
  id: string;
  moduleKey: string;
  moduleName: string;
  category: string;
  currentVersion: string;
  lastPublishedAt: string | null;
  codeUpdatedAt: string | null;
  status: 'published' | 'pending' | 'outdated' | 'never_published';
  daysSincePublish: number | null;
  changeCount: number;
  pendingChanges: string[];
}

interface DashboardStats {
  total: number;
  published: number;
  pending: number;
  outdated: number;
  neverPublished: number;
  publishedPercentage: number;
}

export function ModulePublishStatusDashboard() {
  const [modules, setModules] = useState<ModulePublishStatus[]>([]);
  const [filteredModules, setFilteredModules] = useState<ModulePublishStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    published: 0,
    pending: 0,
    outdated: 0,
    neverPublished: 0,
    publishedPercentage: 0
  });

  const fetchModuleStatuses = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all modules
      const { data: appModules, error: modulesError } = await supabase
        .from('app_modules')
        .select('*')
        .order('module_name', { ascending: true });

      if (modulesError) throw modulesError;

      // Fetch version history
      const { data: versions, error: versionsError } = await supabase
        .from('module_versions')
        .select('*')
        .eq('is_latest', true);

      if (versionsError) throw versionsError;

      // Fetch change history
      const { data: changes, error: changesError } = await supabase
        .from('module_change_history')
        .select('*')
        .order('changed_at', { ascending: false });

      if (changesError) throw changesError;

      // Calculate status for each module
      const statusList: ModulePublishStatus[] = (appModules || []).map(module => {
        const latestVersion = versions?.find(v => v.module_key === module.module_key);
        const moduleChanges = changes?.filter(c => c.module_key === module.module_key) || [];
        
        const lastPublishedAt = latestVersion?.created_at || module.updated_at;
        const codeUpdatedAt = module.updated_at;
        
        // Determine status
        let status: ModulePublishStatus['status'] = 'published';
        let daysSincePublish: number | null = null;
        
        if (!latestVersion && !module.version) {
          status = 'never_published';
        } else if (lastPublishedAt) {
          const publishDate = new Date(lastPublishedAt);
          const now = new Date();
          daysSincePublish = Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Check if there are changes after last publish
          const changesAfterPublish = moduleChanges.filter(c => 
            new Date(c.created_at) > publishDate
          );
          
          if (changesAfterPublish.length > 0) {
            status = 'pending';
          } else if (daysSincePublish > 30) {
            status = 'outdated';
          }
        }

        // Get pending changes descriptions
        const pendingChanges = moduleChanges
          .slice(0, 5)
          .map(c => c.changelog || c.change_type);

        return {
          id: module.id,
          moduleKey: module.module_key,
          moduleName: module.module_name,
          category: module.category || 'core',
          currentVersion: module.version || '1.0.0',
          lastPublishedAt,
          codeUpdatedAt,
          status,
          daysSincePublish,
          changeCount: moduleChanges.length,
          pendingChanges
        };
      });

      setModules(statusList);
      setFilteredModules(statusList);

      // Calculate stats
      const published = statusList.filter(m => m.status === 'published').length;
      const pending = statusList.filter(m => m.status === 'pending').length;
      const outdated = statusList.filter(m => m.status === 'outdated').length;
      const neverPublished = statusList.filter(m => m.status === 'never_published').length;

      setStats({
        total: statusList.length,
        published,
        pending,
        outdated,
        neverPublished,
        publishedPercentage: statusList.length > 0 
          ? Math.round((published / statusList.length) * 100) 
          : 0
      });

    } catch (error) {
      console.error('[ModulePublishStatusDashboard] Error:', error);
      toast.error('Error al cargar estado de módulos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModuleStatuses();
  }, [fetchModuleStatuses]);

  // Filter modules
  useEffect(() => {
    let filtered = modules;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.moduleName.toLowerCase().includes(term) ||
        m.moduleKey.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === statusFilter);
    }

    setFilteredModules(filtered);
  }, [modules, searchTerm, statusFilter]);

  const getStatusBadge = (status: ModulePublishStatus['status']) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Publicado</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pendiente</Badge>;
      case 'outdated':
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">Desactualizado</Badge>;
      case 'never_published':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Sin publicar</Badge>;
    }
  };

  const getStatusIcon = (status: ModulePublishStatus['status']) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'outdated':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'never_published':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const pendingModules = modules.filter(m => m.status === 'pending' || m.status === 'never_published');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <GitBranch className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Estado de Publicación</h2>
            <p className="text-sm text-muted-foreground">
              Módulos con cambios pendientes de publicar
            </p>
          </div>
        </div>
        <Button onClick={fetchModuleStatuses} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter('all')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer hover:border-green-500/50 transition-colors",
            statusFilter === 'published' && "border-green-500"
          )} 
          onClick={() => setStatusFilter(statusFilter === 'published' ? 'all' : 'published')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Publicados</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{stats.published}</p>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer hover:border-amber-500/50 transition-colors",
            statusFilter === 'pending' && "border-amber-500"
          )}
          onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Pendientes</span>
            </div>
            <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer hover:border-orange-500/50 transition-colors",
            statusFilter === 'outdated' && "border-orange-500"
          )}
          onClick={() => setStatusFilter(statusFilter === 'outdated' ? 'all' : 'outdated')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Desactualizados</span>
            </div>
            <p className="text-2xl font-bold text-orange-500">{stats.outdated}</p>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer hover:border-red-500/50 transition-colors",
            statusFilter === 'never_published' && "border-red-500"
          )}
          onClick={() => setStatusFilter(statusFilter === 'never_published' ? 'all' : 'never_published')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Sin publicar</span>
            </div>
            <p className="text-2xl font-bold text-red-500">{stats.neverPublished}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progreso de publicación</span>
            <span className="text-sm text-muted-foreground">{stats.publishedPercentage}%</span>
          </div>
          <Progress value={stats.publishedPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {stats.published} de {stats.total} módulos están actualizados en la tienda
          </p>
        </CardContent>
      </Card>

      {/* Pending Modules Alert */}
      {pendingModules.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {pendingModules.length} módulos requieren publicación
            </CardTitle>
            <CardDescription>
              Estos módulos tienen cambios de código que no han sido publicados en la tienda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pendingModules.slice(0, 10).map(m => (
                <Badge key={m.id} variant="outline" className="bg-background">
                  {m.moduleName}
                </Badge>
              ))}
              {pendingModules.length > 10 && (
                <Badge variant="secondary">+{pendingModules.length - 10} más</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar módulo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant={statusFilter !== 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          <Filter className="h-4 w-4 mr-2" />
          {statusFilter === 'all' ? 'Todos' : statusFilter}
        </Button>
      </div>

      {/* Module List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lista de Módulos ({filteredModules.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredModules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron módulos
              </div>
            ) : (
              <div className="space-y-2">
                {filteredModules.map((module) => (
                  <div
                    key={module.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-muted/50",
                      module.status === 'pending' && "border-amber-500/30 bg-amber-500/5",
                      module.status === 'never_published' && "border-red-500/30 bg-red-500/5"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(module.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{module.moduleName}</p>
                          <Badge variant="outline" className="text-xs">
                            v{module.currentVersion}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate">{module.moduleKey}</span>
                          <span>•</span>
                          <span>{module.category}</span>
                          {module.lastPublishedAt && (
                            <>
                              <span>•</span>
                              <span>
                                Publicado {formatDistanceToNow(new Date(module.lastPublishedAt), { 
                                  locale: es, 
                                  addSuffix: true 
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {module.changeCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <History className="h-3 w-3 mr-1" />
                          {module.changeCount}
                        </Badge>
                      )}
                      {getStatusBadge(module.status)}
                      {(module.status === 'pending' || module.status === 'never_published') && (
                        <Button size="sm" variant="ghost" className="h-7">
                          <Rocket className="h-3 w-3 mr-1" />
                          Publicar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default ModulePublishStatusDashboard;
