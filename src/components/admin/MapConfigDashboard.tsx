import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Map, 
  Navigation, 
  Search, 
  Database, 
  Wrench, 
  Building2, 
  Route, 
  MapPin,
  Layers,
  Palette,
  Globe,
  Compass,
  Target,
  Box,
  ImageIcon,
  Code2,
  Ruler,
  Clock,
  Truck,
  MapPinned,
  SatelliteIcon,
  Mountain,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { MapTooltipConfig } from './MapTooltipConfig';
import { useNavigate } from 'react-router-dom';

interface MapToolCard {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'maps' | 'navigation' | 'search' | 'data' | 'tools';
  color: string;
  action?: () => void;
  external?: boolean;
  implemented?: boolean;
}

export function MapConfigDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const mapTools: MapToolCard[] = [
    // Maps category
    {
      id: 'map-standard',
      name: 'Mapa Estándar',
      description: 'Vista de calles y carreteras',
      icon: <Map className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: true,
      action: () => navigate('/admin?section=map')
    },
    {
      id: 'map-satellite',
      name: 'Vista Satélite',
      description: 'Imágenes satelitales de alta resolución',
      icon: <SatelliteIcon className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: true,
      action: () => navigate('/admin?section=map')
    },
    {
      id: 'map-3d',
      name: 'Mapa 3D Edificios',
      description: 'Visualización 3D con edificios en altura',
      icon: <Building2 className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: true,
      action: () => navigate('/map-3d')
    },
    {
      id: 'map-terrain',
      name: 'Mapa Terreno',
      description: 'Relieve y elevación del terreno',
      icon: <Mountain className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: false
    },
    {
      id: 'map-dark',
      name: 'Modo Oscuro',
      description: 'Estilo optimizado para visión nocturna',
      icon: <Globe className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: true,
      action: () => navigate('/admin?section=map')
    },
    {
      id: 'custom-styles',
      name: 'Estilos Personalizados',
      description: 'Paletas de colores y temas',
      icon: <Palette className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: true
    },
    {
      id: 'layers-config',
      name: 'Capas del Mapa',
      description: 'Gestión de capas y overlays',
      icon: <Layers className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: true
    },
    {
      id: 'markers',
      name: 'Marcadores',
      description: 'Estilos de chinchetas y clusters',
      icon: <MapPin className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: true
    },

    // Navigation category
    {
      id: 'directions',
      name: 'Direcciones',
      description: 'Rutas punto a punto optimizadas',
      icon: <Route className="h-5 w-5" />,
      category: 'navigation',
      color: 'bg-blue-500',
      implemented: true,
      action: () => navigate('/admin?section=map')
    },
    {
      id: 'isochrones',
      name: 'Isócronas',
      description: 'Áreas de alcance por tiempo/distancia',
      icon: <Clock className="h-5 w-5" />,
      category: 'navigation',
      color: 'bg-blue-500',
      implemented: false
    },
    {
      id: 'optimization',
      name: 'Optimización de Rutas',
      description: 'Multi-parada con orden óptimo',
      icon: <Truck className="h-5 w-5" />,
      category: 'navigation',
      color: 'bg-blue-500',
      implemented: true
    },
    {
      id: 'matrix',
      name: 'Matriz de Tiempos',
      description: 'Tiempos entre múltiples puntos',
      icon: <Target className="h-5 w-5" />,
      category: 'navigation',
      color: 'bg-blue-500',
      implemented: false
    },

    // Search category
    {
      id: 'geocoding',
      name: 'Geocodificación',
      description: 'Direcciones a coordenadas',
      icon: <MapPinned className="h-5 w-5" />,
      category: 'search',
      color: 'bg-orange-500',
      implemented: true,
      action: () => navigate('/admin?section=geocoding')
    },
    {
      id: 'reverse-geocoding',
      name: 'Geocodificación Inversa',
      description: 'Coordenadas a direcciones',
      icon: <Compass className="h-5 w-5" />,
      category: 'search',
      color: 'bg-orange-500',
      implemented: true
    },
    {
      id: 'search-box',
      name: 'Buscador de Lugares',
      description: 'Autocompletado de direcciones',
      icon: <Search className="h-5 w-5" />,
      category: 'search',
      color: 'bg-orange-500',
      implemented: true,
      action: () => navigate('/admin?section=map')
    },

    // Data category
    {
      id: 'companies-layer',
      name: 'Capa de Empresas',
      description: 'Visualización de cartera de clientes',
      icon: <Database className="h-5 w-5" />,
      category: 'data',
      color: 'bg-slate-500',
      implemented: true,
      action: () => navigate('/admin?section=map')
    },
    {
      id: 'heatmaps',
      name: 'Mapas de Calor',
      description: 'Densidad de empresas por zona',
      icon: <Box className="h-5 w-5" />,
      category: 'data',
      color: 'bg-slate-500',
      implemented: false
    },
    {
      id: 'clustering',
      name: 'Clusters Dinámicos',
      description: 'Agrupación automática de marcadores',
      icon: <Target className="h-5 w-5" />,
      category: 'data',
      color: 'bg-slate-500',
      implemented: true
    },

    // Tools category
    {
      id: 'tooltip-config',
      name: 'Configurar Tooltips',
      description: 'Campos visibles al hover',
      icon: <Wrench className="h-5 w-5" />,
      category: 'tools',
      color: 'bg-purple-500',
      implemented: true
    },
    {
      id: 'measure',
      name: 'Medir Distancias',
      description: 'Herramienta de medición',
      icon: <Ruler className="h-5 w-5" />,
      category: 'tools',
      color: 'bg-purple-500',
      implemented: false
    },
    {
      id: 'export-image',
      name: 'Exportar Imagen',
      description: 'Capturar mapa como imagen',
      icon: <ImageIcon className="h-5 w-5" />,
      category: 'tools',
      color: 'bg-purple-500',
      implemented: false
    },
    {
      id: 'mapbox-docs',
      name: 'Documentación Mapbox',
      description: 'Recursos para desarrolladores',
      icon: <Code2 className="h-5 w-5" />,
      category: 'tools',
      color: 'bg-purple-500',
      external: true,
      action: () => window.open('https://docs.mapbox.com/', '_blank')
    }
  ];

  const categories = [
    { id: 'maps', name: 'Mapas', description: 'Estilos y vistas de mapa', color: 'bg-emerald-500', textColor: 'text-emerald-500' },
    { id: 'navigation', name: 'Navegación', description: 'Rutas y direcciones', color: 'bg-blue-500', textColor: 'text-blue-500' },
    { id: 'search', name: 'Búsqueda', description: 'Geocodificación y lugares', color: 'bg-orange-500', textColor: 'text-orange-500' },
    { id: 'data', name: 'Datos', description: 'Capas y visualización', color: 'bg-slate-500', textColor: 'text-slate-500' },
    { id: 'tools', name: 'Herramientas', description: 'Utilidades y configuración', color: 'bg-purple-500', textColor: 'text-purple-500' }
  ];

  const getCategoryTools = (categoryId: string) => 
    mapTools.filter(tool => tool.category === categoryId);

  const ToolCard = ({ tool }: { tool: MapToolCard }) => (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-2 ${
        tool.implemented 
          ? 'hover:border-primary/50' 
          : 'opacity-60 hover:opacity-80'
      }`}
      onClick={tool.action}
    >
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`h-10 w-10 rounded-lg ${tool.color} flex items-center justify-center text-white flex-shrink-0`}>
          {tool.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm truncate">{tool.name}</h4>
            {tool.external && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
          <div className="mt-2">
            {tool.implemented ? (
              <Badge variant="default" className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                Implementado
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">
                Próximamente
              </Badge>
            )}
          </div>
        </div>
        {tool.action && (
          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-6 w-6 text-primary" />
            Centro de Configuración de Mapas
          </CardTitle>
          <CardDescription>
            Todas las herramientas y APIs de mapas disponibles en ObelixIA
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 h-auto">
          <TabsTrigger value="overview" className="text-xs py-2">
            <Globe className="h-4 w-4 mr-1" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="maps" className="text-xs py-2">
            <Map className="h-4 w-4 mr-1" />
            Mapas
          </TabsTrigger>
          <TabsTrigger value="navigation" className="text-xs py-2">
            <Navigation className="h-4 w-4 mr-1" />
            Navegación
          </TabsTrigger>
          <TabsTrigger value="search" className="text-xs py-2">
            <Search className="h-4 w-4 mr-1" />
            Búsqueda
          </TabsTrigger>
          <TabsTrigger value="data" className="text-xs py-2">
            <Database className="h-4 w-4 mr-1" />
            Datos
          </TabsTrigger>
          <TabsTrigger value="tooltip" className="text-xs py-2">
            <Wrench className="h-4 w-4 mr-1" />
            Tooltips
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick access buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-2 border-emerald-500/30 hover:bg-emerald-500/10"
              onClick={() => navigate('/admin?section=map')}
            >
              <Map className="h-6 w-6 text-emerald-500" />
              <span className="text-sm">Abrir Mapa</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-2 border-blue-500/30 hover:bg-blue-500/10"
              onClick={() => navigate('/map-3d')}
            >
              <Building2 className="h-6 w-6 text-blue-500" />
              <span className="text-sm">Mapa 3D</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-2 border-orange-500/30 hover:bg-orange-500/10"
              onClick={() => navigate('/admin?section=geocoding')}
            >
              <MapPinned className="h-6 w-6 text-orange-500" />
              <span className="text-sm">Geocodificación</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-2 border-purple-500/30 hover:bg-purple-500/10"
              onClick={() => setActiveTab('tooltip')}
            >
              <Wrench className="h-6 w-6 text-purple-500" />
              <span className="text-sm">Config. Tooltips</span>
            </Button>
          </div>

          {/* Categories overview */}
          {categories.map(category => (
            <div key={category.id} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-2 rounded-full ${category.color}`} />
                <div>
                  <h3 className={`text-lg font-semibold ${category.textColor}`}>
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pl-5">
                {getCategoryTools(category.id).map(tool => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="maps">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getCategoryTools('maps').map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="navigation">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getCategoryTools('navigation').map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="search">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getCategoryTools('search').map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="data">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getCategoryTools('data').map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tooltip">
          <MapTooltipConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}
