import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Trash2, Eye, Settings, Package, Check, X, 
  Loader2, Calendar, User, Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { InstalledModule, AppModule } from './AppStoreManager';

interface InstalledModulesProps {
  installedModules: InstalledModule[];
  loading: boolean;
  onUninstall: (installationId: string) => void;
  onToggleStatus: (installationId: string, currentStatus: boolean) => void;
  onViewDetails: (module: AppModule) => void;
}

export const InstalledModules: React.FC<InstalledModulesProps> = ({
  installedModules,
  loading,
  onUninstall,
  onToggleStatus,
  onViewDetails
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (installedModules.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium mb-2">No hay módulos instalados</h3>
        <p className="text-sm text-muted-foreground">
          Explora el catálogo para instalar módulos
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-4 pr-4">
        {installedModules.map(installation => {
          const module = installation.module as AppModule | undefined;
          if (!module) return null;

          return (
            <Card 
              key={installation.id}
              className={`transition-all ${
                installation.is_active 
                  ? 'border-green-500/30 bg-green-500/5' 
                  : 'border-muted bg-muted/20 opacity-75'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      installation.is_active 
                        ? 'bg-green-500/20 text-green-600' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {module.module_name}
                        {installation.is_active ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                            <Check className="h-3 w-3 mr-1" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            <X className="h-3 w-3 mr-1" />
                            Inactivo
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        v{module.version || '1.0.0'} • {module.module_key}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={installation.is_active || false}
                      onCheckedChange={() => onToggleStatus(installation.id, installation.is_active || false)}
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {module.description || 'Sin descripción'}
                </p>
                
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {installation.installed_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Instalado: {format(new Date(installation.installed_at), 'dd MMM yyyy', { locale: es })}
                    </div>
                  )}
                  {installation.license_type && (
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Licencia: {installation.license_type}
                    </div>
                  )}
                  {installation.valid_until && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Válido hasta: {format(new Date(installation.valid_until), 'dd MMM yyyy', { locale: es })}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onViewDetails(module)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Detalles
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    disabled
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Configurar
                  </Button>
                  {!module.is_required && (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => onUninstall(installation.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Desinstalar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
};
