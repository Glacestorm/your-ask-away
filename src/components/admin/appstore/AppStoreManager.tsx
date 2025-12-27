import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Store, Package, Download, Check, Search, Plus, Sparkles, 
  Building2, Shield, BarChart3, Loader2, RefreshCw, Trash2,
  Eye, Settings, FileCode2, Database, Puzzle, Star, Rocket
} from 'lucide-react';
import { ModuleCatalog } from './ModuleCatalog';
import { InstalledModules } from './InstalledModules';
import { CNAEModuleGenerator } from './CNAEModuleGenerator';
import { GeneratedModules } from './GeneratedModules';
import { ModuleDetails } from './ModuleDetails';
import { ModulePublisherPanel } from './ModulePublisherPanel';
import { ModulePublishStatusDashboard } from './ModulePublishStatusDashboard';

export interface AppModule {
  id: string;
  module_key: string;
  module_name: string;
  description: string | null;
  category: string;
  sector: string | null;
  version: string | null;
  base_price: number | null;
  is_core: boolean | null;
  is_required: boolean | null;
  features: any;
  dependencies: string[] | null;
  module_icon: string | null;
  documentation_url: string | null;
  screenshots: any;
  changelog: any;
  min_core_version: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface InstalledModule {
  id: string;
  module_id: string;
  organization_id: string;
  is_active: boolean | null;
  installed_at: string | null;
  installed_by: string | null;
  license_type: string | null;
  license_key: string | null;
  valid_until: string | null;
  settings: any;
  created_at: string | null;
  updated_at: string | null;
  module?: AppModule;
}

export interface GeneratedModule {
  id: string;
  cnae_code: string;
  module_key: string;
  module_name: string;
  sector: string | null;
  sector_name: string | null;
  description: string | null;
  components: any;
  regulations: any;
  kpis: any;
  accounting_ratios: any;
  visit_form_config: any;
  compliance_panel_config: any;
  ai_generated: boolean | null;
  generation_metadata: any;
  is_published: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const AppStoreManager: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('catalog');
  const [modules, setModules] = useState<AppModule[]>([]);
  const [installedModules, setInstalledModules] = useState<InstalledModule[]>([]);
  const [generatedModules, setGeneratedModules] = useState<GeneratedModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<AppModule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchModules(),
        fetchInstalledModules(),
        fetchGeneratedModules()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos del App Store');
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    const { data, error } = await supabase
      .from('app_modules')
      .select('*')
      .order('category', { ascending: true })
      .order('module_name', { ascending: true });

    if (error) throw error;
    setModules(data || []);
  };

  const fetchInstalledModules = async () => {
    const { data, error } = await supabase
      .from('installed_modules')
      .select(`
        *,
        module:app_modules(*)
      `)
      .order('installed_at', { ascending: false });

    if (error) throw error;
    setInstalledModules(data || []);
  };

  const fetchGeneratedModules = async () => {
    const { data, error } = await supabase
      .from('generated_modules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setGeneratedModules(data || []);
  };

  const installModule = async (moduleId: string) => {
    try {
      const { error } = await supabase
        .from('installed_modules')
        .insert([{
          module_id: moduleId,
          organization_id: '00000000-0000-0000-0000-000000000001',
          is_active: true,
          license_type: 'perpetual' as const
        }]);

      if (error) throw error;
      toast.success('Módulo instalado correctamente');
      await fetchInstalledModules();
    } catch (error: any) {
      console.error('Error installing module:', error);
      toast.error(error.message || 'Error al instalar el módulo');
    }
  };

  const uninstallModule = async (installationId: string) => {
    try {
      const { error } = await supabase
        .from('installed_modules')
        .delete()
        .eq('id', installationId);

      if (error) throw error;
      toast.success('Módulo desinstalado correctamente');
      await fetchInstalledModules();
    } catch (error: any) {
      console.error('Error uninstalling module:', error);
      toast.error(error.message || 'Error al desinstalar el módulo');
    }
  };

  const toggleModuleStatus = async (installationId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('installed_modules')
        .update({ is_active: !currentStatus })
        .eq('id', installationId);

      if (error) throw error;
      toast.success(currentStatus ? 'Módulo desactivado' : 'Módulo activado');
      await fetchInstalledModules();
    } catch (error: any) {
      console.error('Error toggling module status:', error);
      toast.error('Error al cambiar estado del módulo');
    }
  };

  const installedModuleIds = installedModules.map(im => im.module_id);

  const stats = {
    totalModules: modules.length,
    installedCount: installedModules.filter(m => m.is_active).length,
    generatedCount: generatedModules.length,
    coreModules: modules.filter(m => m.is_core).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">App Store</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona módulos y extensiones de la plataforma
            </p>
          </div>
        </div>
        <Button onClick={fetchAllData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalModules}</p>
              <p className="text-xs text-muted-foreground">Módulos Disponibles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.installedCount}</p>
              <p className="text-xs text-muted-foreground">Módulos Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.generatedCount}</p>
              <p className="text-xs text-muted-foreground">Módulos Generados IA</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.coreModules}</p>
              <p className="text-xs text-muted-foreground">Módulos Core</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Catálogo
          </TabsTrigger>
          <TabsTrigger value="installed" className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Instalados ({stats.installedCount})
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estado
          </TabsTrigger>
          <TabsTrigger value="publish" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Publicar
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Generar CNAE
          </TabsTrigger>
          <TabsTrigger value="generated" className="flex items-center gap-2">
            <Puzzle className="h-4 w-4" />
            Generados ({stats.generatedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <ModuleCatalog
            modules={modules}
            installedModuleIds={installedModuleIds}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            onInstall={installModule}
            onViewDetails={setSelectedModule}
          />
        </TabsContent>

        <TabsContent value="installed" className="space-y-4">
          <InstalledModules
            installedModules={installedModules}
            loading={loading}
            onUninstall={uninstallModule}
            onToggleStatus={toggleModuleStatus}
            onViewDetails={(module) => setSelectedModule(module)}
          />
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <ModulePublishStatusDashboard />
        </TabsContent>

        <TabsContent value="publish" className="space-y-4">
          <ModulePublisherPanel />
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <CNAEModuleGenerator onModuleGenerated={fetchGeneratedModules} />
        </TabsContent>

        <TabsContent value="generated" className="space-y-4">
          <GeneratedModules
            modules={generatedModules}
            loading={loading}
            onRefresh={fetchGeneratedModules}
          />
        </TabsContent>
      </Tabs>

      {/* Module Details Modal */}
      {selectedModule && (
        <ModuleDetails
          module={selectedModule}
          isInstalled={installedModuleIds.includes(selectedModule.id)}
          onClose={() => setSelectedModule(null)}
          onInstall={() => installModule(selectedModule.id)}
        />
      )}
    </div>
  );
};

export default AppStoreManager;
