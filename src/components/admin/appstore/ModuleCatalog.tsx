import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Download, Check, Eye, Package, Building2, 
  Shield, BarChart3, Loader2, Star, Zap
} from 'lucide-react';
import type { AppModule } from './AppStoreManager';

interface ModuleCatalogProps {
  modules: AppModule[];
  installedModuleIds: string[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  onInstall: (moduleId: string) => void;
  onViewDetails: (module: AppModule) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'core': return <Zap className="h-4 w-4" />;
    case 'horizontal': return <BarChart3 className="h-4 w-4" />;
    case 'vertical': return <Building2 className="h-4 w-4" />;
    case 'security': return <Shield className="h-4 w-4" />;
    default: return <Package className="h-4 w-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'core': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
    case 'horizontal': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
    case 'vertical': return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
    case 'security': return 'bg-red-500/10 text-red-600 border-red-500/30';
    default: return 'bg-gray-500/10 text-gray-600 border-gray-500/30';
  }
};

const getSectorBadge = (sector: string | null) => {
  if (!sector) return null;
  const sectorLabels: Record<string, string> = {
    banking: 'Banca',
    insurance: 'Seguros',
    retail: 'Retail',
    healthcare: 'Salud',
    manufacturing: 'Manufactura',
    hospitality: 'Hostelería',
    construction: 'Construcción',
    transport: 'Transporte',
    professional_services: 'Servicios Prof.',
    agriculture: 'Agricultura'
  };
  return sectorLabels[sector] || sector;
};

export const ModuleCatalog: React.FC<ModuleCatalogProps> = ({
  modules,
  installedModuleIds,
  loading,
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  onInstall,
  onViewDetails
}) => {
  const filteredModules = modules.filter(module => {
    const matchesSearch = 
      module.module_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.module_key.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || module.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(modules.map(m => m.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar módulos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat === 'core' ? 'Core' : 
                 cat === 'horizontal' ? 'Horizontal' : 
                 cat === 'vertical' ? 'Vertical' : 
                 cat === 'security' ? 'Seguridad' : cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Module Grid */}
      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
          {filteredModules.map(module => {
            const isInstalled = installedModuleIds.includes(module.id);
            
            return (
              <Card 
                key={module.id} 
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  isInstalled ? 'border-green-500/50 bg-green-500/5' : ''
                }`}
              >
                {module.is_core && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                      <Star className="h-3 w-3 mr-1" />
                      Core
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getCategoryColor(module.category)}`}>
                      {getCategoryIcon(module.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{module.module_name}</CardTitle>
                      <CardDescription className="text-xs">
                        v{module.version || '1.0.0'} • {module.module_key}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {module.description || 'Sin descripción disponible'}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className={getCategoryColor(module.category)}>
                      {module.category}
                    </Badge>
                    {module.sector && (
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                        {getSectorBadge(module.sector)}
                      </Badge>
                    )}
                  </div>
                  
                  {module.base_price !== null && module.base_price > 0 && (
                    <p className="text-sm font-semibold text-primary">
                      €{module.base_price.toLocaleString()}/año
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => onViewDetails(module)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detalles
                    </Button>
                    {isInstalled ? (
                      <Button size="sm" variant="secondary" disabled className="flex-1">
                        <Check className="h-4 w-4 mr-1" />
                        Instalado
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => onInstall(module.id)}
                        disabled={module.is_required}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Instalar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {filteredModules.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No se encontraron módulos con los filtros actuales</p>
        </div>
      )}
    </div>
  );
};
