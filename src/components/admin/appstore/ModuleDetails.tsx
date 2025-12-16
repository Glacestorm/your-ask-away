import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Package, Download, Check, Star, Shield, Zap, 
  ExternalLink, Calendar, FileCode2, Building2
} from 'lucide-react';
import type { AppModule } from './AppStoreManager';

interface ModuleDetailsProps {
  module: AppModule;
  isInstalled: boolean;
  onClose: () => void;
  onInstall: () => void;
}

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'core': return 'Core';
    case 'horizontal': return 'Horizontal';
    case 'vertical': return 'Vertical';
    case 'security': return 'Seguridad';
    default: return category;
  }
};

const getSectorLabel = (sector: string | null) => {
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
    professional_services: 'Servicios Profesionales',
    agriculture: 'Agricultura'
  };
  return sectorLabels[sector] || sector;
};

export const ModuleDetails: React.FC<ModuleDetailsProps> = ({
  module,
  isInstalled,
  onClose,
  onInstall
}) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                {module.module_name}
                {module.is_core && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                    <Star className="h-3 w-3 mr-1" />
                    Core
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="mt-1">
                <span className="font-mono text-xs">{module.module_key}</span>
                <span className="mx-2">•</span>
                <span>v{module.version || '1.0.0'}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-4 pr-4">
            {/* Status and Category */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={
                module.category === 'core' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                module.category === 'horizontal' ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' :
                module.category === 'vertical' ? 'bg-purple-500/10 text-purple-600 border-purple-500/30' :
                'bg-red-500/10 text-red-600 border-red-500/30'
              }>
                {getCategoryLabel(module.category)}
              </Badge>
              {module.sector && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                  <Building2 className="h-3 w-3 mr-1" />
                  {getSectorLabel(module.sector)}
                </Badge>
              )}
              {isInstalled && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                  <Check className="h-3 w-3 mr-1" />
                  Instalado
                </Badge>
              )}
            </div>

            {/* Description */}
            <div>
              <h4 className="font-medium mb-2">Descripción</h4>
              <p className="text-sm text-muted-foreground">
                {module.description || 'Sin descripción disponible'}
              </p>
            </div>

            {/* Features */}
            {module.features && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Funcionalidades
                </h4>
                <ul className="space-y-1">
                  {(module.features as string[]).map((feature: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dependencies */}
            {module.dependencies && module.dependencies.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileCode2 className="h-4 w-4" />
                  Dependencias
                </h4>
                <div className="flex flex-wrap gap-1">
                  {module.dependencies.map((dep, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Info */}
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              {module.min_core_version && (
                <div>
                  <p className="text-muted-foreground">Versión mínima core</p>
                  <p className="font-medium">{module.min_core_version}</p>
                </div>
              )}
              {module.base_price !== null && (
                <div>
                  <p className="text-muted-foreground">Precio base</p>
                  <p className="font-medium text-primary">
                    {module.base_price > 0 ? `€${module.base_price.toLocaleString()}/año` : 'Incluido'}
                  </p>
                </div>
              )}
              {module.created_at && (
                <div>
                  <p className="text-muted-foreground">Creado</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(module.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              {module.updated_at && (
                <div>
                  <p className="text-muted-foreground">Actualizado</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(module.updated_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Documentation Link */}
            {module.documentation_url && (
              <Button variant="outline" asChild className="w-full">
                <a href={module.documentation_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver documentación
                </a>
              </Button>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          {!isInstalled && !module.is_required && (
            <Button onClick={onInstall}>
              <Download className="h-4 w-4 mr-2" />
              Instalar módulo
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
