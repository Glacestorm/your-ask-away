import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Menu, LogOut, Settings, BarChart3, UserCircle, Mountain, Layers, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export interface MapBaseLayers {
  roads: boolean;
  labels: boolean;
  markers: boolean;
}

interface MapHeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  mapStyle: 'default' | 'satellite' | 'terrain';
  view3D: boolean;
  onMapStyleChange: (style: 'default' | 'satellite' | 'terrain') => void;
  onView3DChange: (enabled: boolean) => void;
  baseLayers: MapBaseLayers;
  onBaseLayersChange: (layers: MapBaseLayers) => void;
}

export function MapHeader({ 
  onToggleSidebar, 
  sidebarOpen,
  mapStyle,
  view3D,
  onMapStyleChange,
  onView3DChange,
  baseLayers,
  onBaseLayersChange
}: MapHeaderProps) {
  const { user, signOut, userRole, isAdmin } = useAuth();
  const navigate = useNavigate();

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <MapPin className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold">Mapa Empresarial</h1>
            <p className="text-xs text-muted-foreground">Andorra</p>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-2 border-l pl-4 ml-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs min-w-[100px] justify-between"
              >
                {mapStyle === 'default' && 'Mapa'}
                {mapStyle === 'satellite' && 'Satélite'}
                {mapStyle === 'terrain' && 'Terreno'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40 z-50 bg-card">
              <div className="p-1">
                <Button
                  variant={mapStyle === 'default' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onMapStyleChange('default')}
                  className="w-full justify-start h-8 text-xs"
                >
                  Mapa
                </Button>
                <Button
                  variant={mapStyle === 'satellite' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onMapStyleChange('satellite')}
                  className="w-full justify-start h-8 text-xs"
                >
                  Satélite
                </Button>
                <Button
                  variant={mapStyle === 'terrain' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onMapStyleChange('terrain')}
                  className="w-full justify-start h-8 text-xs"
                >
                  Terreno
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant={view3D ? 'default' : 'outline'}
            size="sm"
            onClick={() => onView3DChange(!view3D)}
            className="h-7 text-xs"
          >
            <Mountain className="mr-1 h-3 w-3" />
            Vista 3D
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
              >
                <Layers className="mr-1 h-3 w-3" />
                Capas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-50 bg-card">
              <div className="p-3 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="markers"
                    checked={baseLayers.markers}
                    onCheckedChange={(checked) =>
                      onBaseLayersChange({ ...baseLayers, markers: !!checked })
                    }
                  />
                  <Label htmlFor="markers" className="text-sm font-medium cursor-pointer">
                    📍 Marcadores de empresas
                  </Label>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Opciones de visualización
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="labels"
                      checked={baseLayers.labels}
                      onCheckedChange={(checked) =>
                        onBaseLayersChange({ ...baseLayers, labels: !!checked })
                      }
                    />
                    <Label htmlFor="labels" className="text-sm font-normal cursor-pointer">
                      Etiquetas de lugares
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="roads"
                      checked={baseLayers.roads}
                      onCheckedChange={(checked) =>
                        onBaseLayersChange({ ...baseLayers, roads: !!checked })
                      }
                    />
                    <Label htmlFor="roads" className="text-sm font-normal cursor-pointer">
                      Carreteras destacadas
                    </Label>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isAdmin && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="hidden sm:flex"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="hidden sm:flex"
            >
              <Settings className="mr-2 h-4 w-4" />
              Administración
            </Button>
          </>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground">
                  Rol: {userRole || 'usuario'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <UserCircle className="mr-2 h-4 w-4" />
              Mi Perfil
            </DropdownMenuItem>
            
            {isAdmin && (
              <>
                <DropdownMenuItem 
                  onClick={() => navigate('/dashboard')}
                  className="sm:hidden"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => navigate('/admin')}
                  className="sm:hidden"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Administración
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="sm:hidden" />
              </>
            )}
            
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
