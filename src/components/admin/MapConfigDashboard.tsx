import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  ExternalLink,
  FileJson,
  Share2,
  Smartphone,
  FileText,
  Settings,
  Play,
  Pencil,
  Upload,
  Server,
  Grid3X3,
  Activity,
  Users,
  Car,
  Map as MapIcon,
  MessageCircle,
  Github,
  BookOpen
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
  externalUrl?: string;
  implemented?: boolean;
}

export function MapConfigDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const mapTools: MapToolCard[] = [
    // ===== MAPS CATEGORY =====
    {
      id: 'mapbox-gl-js',
      name: 'Mapbox GL JS',
      description: 'Impressive WebGL Map Rendering',
      icon: <Code2 className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: true,
      action: () => navigate('/admin?section=map')
    },
    {
      id: 'map-tiling-service',
      name: 'Mapbox Tiling Service',
      description: 'Custom Vector Tile Hosting',
      icon: <Grid3X3 className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: false,
      external: true,
      externalUrl: 'https://docs.mapbox.com/mapbox-tiling-service/guides/'
    },
    {
      id: 'style-specification',
      name: 'Style Specification',
      description: 'GL Vector Styling Syntax',
      icon: <Palette className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: true,
      external: true,
      externalUrl: 'https://docs.mapbox.com/mapbox-gl-js/style-spec/'
    },
    {
      id: 'vector-tiles-api',
      name: 'Vector Tiles API',
      description: 'Vector Data in small chunks',
      icon: <Layers className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: true,
      external: true,
      externalUrl: 'https://docs.mapbox.com/api/maps/vector-tiles/'
    },
    {
      id: 'raster-tiles-api',
      name: 'Raster Tiles API',
      description: 'Raster Images for web maps',
      icon: <ImageIcon className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: true,
      external: true,
      externalUrl: 'https://docs.mapbox.com/api/maps/raster-tiles/'
    },
    {
      id: 'static-images-api',
      name: 'Static Images API',
      description: 'Generate Customized Maps as Images',
      icon: <ImageIcon className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: false,
      external: true,
      externalUrl: 'https://docs.mapbox.com/api/maps/static-images/'
    },
    {
      id: 'static-tiles-api',
      name: 'Static Tiles API',
      description: 'Serve raster tiles from Studio styles',
      icon: <Grid3X3 className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: false,
      external: true,
      externalUrl: 'https://docs.mapbox.com/api/maps/static-tiles/'
    },
    {
      id: 'styles-api',
      name: 'Styles API',
      description: 'Get/set map styles, fonts, and images',
      icon: <Palette className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: true,
      external: true,
      externalUrl: 'https://docs.mapbox.com/api/maps/styles/'
    },
    {
      id: 'tilequery-api',
      name: 'TileQuery API',
      description: 'Retrieve feature data from vector tilesets',
      icon: <Search className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: false,
      external: true,
      externalUrl: 'https://docs.mapbox.com/api/maps/tilequery/'
    },
    {
      id: 'uploads-api',
      name: 'Uploads API',
      description: 'Transform geographic data into tilesets',
      icon: <Upload className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: false,
      external: true,
      externalUrl: 'https://docs.mapbox.com/api/maps/uploads/'
    },
    {
      id: 'datasets-api',
      name: 'Datasets API',
      description: 'Get/Set features in datasets',
      icon: <Database className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: true,
      external: true,
      externalUrl: 'https://docs.mapbox.com/api/maps/datasets/'
    },
    {
      id: 'fonts-api',
      name: 'Fonts API',
      description: 'Manage fonts used in mapbox styles',
      icon: <FileText className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: false,
      external: true,
      externalUrl: 'https://docs.mapbox.com/api/maps/fonts/'
    },
    {
      id: 'mapbox-studio',
      name: 'Mapbox Studio',
      description: 'Brilliant UI for Digital Map Design',
      icon: <Settings className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: false,
      external: true,
      externalUrl: 'https://studio.mapbox.com/',
      action: () => window.open('https://studio.mapbox.com/', '_blank')
    },
    {
      id: 'static-playground',
      name: 'Static Images Playground',
      description: 'Generate Customized Maps as Images',
      icon: <Play className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: false,
      external: true,
      externalUrl: 'https://docs.mapbox.com/playground/static/',
      action: () => window.open('https://docs.mapbox.com/playground/static/', '_blank')
    },
    {
      id: 'tilequery-playground',
      name: 'Tilequery Playground',
      description: 'Retrieve feature data from vector tilesets',
      icon: <Play className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: false,
      external: true,
      externalUrl: 'https://docs.mapbox.com/playground/tilequery/',
      action: () => window.open('https://docs.mapbox.com/playground/tilequery/', '_blank')
    },
    {
      id: 'maki-icons',
      name: 'Maki Icons',
      description: 'Icons used in Mapbox Core Styles',
      icon: <MapPin className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: true,
      external: true,
      externalUrl: 'https://labs.mapbox.com/maki-icons/',
      action: () => window.open('https://labs.mapbox.com/maki-icons/', '_blank')
    },
    {
      id: 'maki-editor',
      name: 'Maki Icon Editor',
      description: 'Edit icon sets for use in Mapbox map styles',
      icon: <Pencil className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: false,
      external: true,
      externalUrl: 'https://labs.mapbox.com/maki-icons/editor/',
      action: () => window.open('https://labs.mapbox.com/maki-icons/editor/', '_blank')
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
      id: 'map-terrain',
      name: 'Mapa Terreno',
      description: 'Relieve y elevación del terreno',
      icon: <Mountain className="h-5 w-5" />,
      category: 'maps',
      color: 'bg-emerald-500',
      implemented: false
    },

    // ===== NAVIGATION CATEGORY =====
    {
      id: 'directions-api',
      name: 'Directions API',
      description: 'Get directions between points',
      icon: <Route className="h-5 w-5" />,
      category: 'navigation',
      color: 'bg-blue-500',
      implemented: true,
      action: () => navigate('/admin?section=map')
    },
    {
      id: 'map-matching-api',
      name: 'Map Matching API',
      description: 'Snap fuzzy data to roads',
      icon: <Share2 className="h-5 w-5" />,
      category: 'navigation',
      color: 'bg-blue-500',
      implemented: false,
      external: true,
      externalUrl: 'https://docs.mapbox.com/api/navigation/map-matching/'
    },
    {
      id: 'isochrone-api',
      name: 'Isochrone API',
      description: 'Calculate Travel Time Areas',
      icon: <Clock className="h-5 w-5" />,
      category: 'navigation',
      color: 'bg-blue-500',
      implemented: false,
      external: true,
      externalUrl: 'https://docs.mapbox.com/api/navigation/isochrone/'
    },
    {
      id: 'optimization-api',
      name: 'Optimization API',
      description: 'Optimized routing for logistics fleets',
      icon: <Truck className="h-5 w-5" />,
      category: 'navigation',
      color: 'bg-blue-500',
      implemented: true
    },
    {
      id: 'matrix-api',
      name: 'Matrix API',
      description: 'Get travel times between many points',
      icon: <Target className="h-5 w-5" />,
      category: 'navigation',
      color: 'bg-blue-500',
      implemented: false,
      external: true,
      externalUrl: 'https://docs.mapbox.com/api/navigation/matrix/'
    },
    {
      id: 'directions-playground',
      name: 'Directions API Playground',
      description: 'Try out the directions API',
      icon: <Play className="h-5 w-5" />,
      category: 'navigation',
      color: 'bg-blue-500',
      implemented: false,
      external: true,
      externalUrl: 'https://docs.mapbox.com/playground/directions/',
      action: () => window.open('https://docs.mapbox.com/playground/directions/', '_blank')
    },
    {
      id: 'isochrone-playground',
      name: 'Isochrone API Playground',
      description: 'Calculate Travel Time Areas',
      icon: <Play className="h-5 w-5" />,
      category: 'navigation',
      color: 'bg-blue-500',
      implemented: false,
      external: true,
      externalUrl: 'https://docs.mapbox.com/api/navigation/matrix/',
      action: () => window.open('https://docs.mapbox.com/api/navigation/matrix/', '_blank')
    },

    // ===== SEARCH CATEGORY =====
    {
      id: 'geocoding-api',
      name: 'Geocoding API',
      description: 'Turn addresses into coordinates and vice versa',
      icon: <MapPinned className="h-5 w-5" />,
      category: 'search',
      color: 'bg-orange-500',
      implemented: true,
      action: () => navigate('/admin?section=geocoding')
    },
    {
      id: 'mapbox-search-js',
      name: 'Mapbox Search JS',
      description: 'Build address search into web apps',
      icon: <Code2 className="h-5 w-5" />,
      category: 'search',
      color: 'bg-orange-500',
      implemented: true,
      external: true,
      externalUrl: 'https://docs.mapbox.com/mapbox-search-js/'
    },
    {
      id: 'mapbox-gl-geocoder',
      name: 'Mapbox GL Geocoder',
      description: 'A geocoder control for Mapbox GL JS',
      icon: <Search className="h-5 w-5" />,
      category: 'search',
      color: 'bg-orange-500',
      implemented: true,
      external: true,
      externalUrl: 'https://github.com/mapbox/mapbox-gl-geocoder'
    },
    {
      id: 'address-autofill',
      name: 'Address Autofill',
      description: 'Autofill postal addresses',
      icon: <FileText className="h-5 w-5" />,
      category: 'search',
      color: 'bg-orange-500',
      implemented: true,
      external: true,
      externalUrl: 'https://docs.mapbox.com/mapbox-search-js/guides/autofill/'
    },
    {
      id: 'geocoding-playground',
      name: 'Geocoding Playground',
      description: 'Try out the geocoding API',
      icon: <Play className="h-5 w-5" />,
      category: 'search',
      color: 'bg-orange-500',
      implemented: false,
      external: true,
      externalUrl: 'https://docs.mapbox.com/search-playground/',
      action: () => window.open('https://docs.mapbox.com/search-playground/', '_blank')
    },

    // ===== DATA CATEGORY =====
    {
      id: 'tilesets',
      name: 'Tilesets',
      description: 'Ready to use vector, raster, and elevation data',
      icon: <Layers className="h-5 w-5" />,
      category: 'data',
      color: 'bg-slate-500',
      implemented: true,
      external: true,
      externalUrl: 'https://docs.mapbox.com/studio-manual/reference/tilesets/'
    },
    {
      id: 'mapbox-boundaries',
      name: 'Mapbox Boundaries',
      description: 'Global boundary polygons',
      icon: <Globe className="h-5 w-5" />,
      category: 'data',
      color: 'bg-slate-500',
      implemented: false,
      external: true,
      externalUrl: 'https://docs.mapbox.com/data/boundaries/'
    },
    {
      id: 'mapbox-movement',
      name: 'Mapbox Movement',
      description: 'Understand where and when people are moving',
      icon: <Users className="h-5 w-5" />,
      category: 'data',
      color: 'bg-slate-500',
      implemented: false,
      external: true,
      externalUrl: 'https://docs.mapbox.com/data/movement/'
    },
    {
      id: 'traffic-data',
      name: 'Traffic Data',
      description: 'Global Vehicle Traffic',
      icon: <Car className="h-5 w-5" />,
      category: 'data',
      color: 'bg-slate-500',
      implemented: false,
      external: true,
      externalUrl: 'https://docs.mapbox.com/data/traffic/'
    },
    {
      id: 'boundaries-explorer',
      name: 'Boundaries Explorer',
      description: 'Explore global boundary polygons',
      icon: <MapIcon className="h-5 w-5" />,
      category: 'data',
      color: 'bg-slate-500',
      implemented: false,
      external: true,
      externalUrl: 'https://demos.mapbox.com/boundaries-explorer/',
      action: () => window.open('https://demos.mapbox.com/boundaries-explorer/', '_blank')
    },
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
      icon: <Activity className="h-5 w-5" />,
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

    // ===== TOOLS & RESOURCES CATEGORY =====
    {
      id: 'geojson-io',
      name: 'geojson.io',
      description: 'Simple geojson creator and editor',
      icon: <FileJson className="h-5 w-5" />,
      category: 'tools',
      color: 'bg-purple-500',
      implemented: false,
      external: true,
      externalUrl: 'https://geojson.io/',
      action: () => window.open('https://geojson.io/', '_blank')
    },
    {
      id: 'turf-js',
      name: 'turf.js',
      description: 'Advanced geospatial analysis in JavaScript',
      icon: <Code2 className="h-5 w-5" />,
      category: 'tools',
      color: 'bg-purple-500',
      implemented: false,
      external: true,
      externalUrl: 'https://turfjs.org/',
      action: () => window.open('https://turfjs.org/', '_blank')
    },
    {
      id: 'mapbox-gl-draw',
      name: 'Mapbox GL Draw',
      description: 'Draw tools for Mapbox GL JS',
      icon: <Pencil className="h-5 w-5" />,
      category: 'tools',
      color: 'bg-purple-500',
      implemented: false,
      external: true,
      externalUrl: 'https://github.com/mapbox/mapbox-gl-draw',
      action: () => window.open('https://github.com/mapbox/mapbox-gl-draw', '_blank')
    },
    {
      id: 'mapbox-discord',
      name: 'MapboxDevs Discord',
      description: 'Chat, get help, find friends',
      icon: <MessageCircle className="h-5 w-5" />,
      category: 'tools',
      color: 'bg-purple-500',
      implemented: false,
      external: true,
      externalUrl: 'https://discord.gg/UshjQYyDFw',
      action: () => window.open('https://discord.gg/UshjQYyDFw', '_blank')
    },
    {
      id: 'contribute',
      name: 'Contribute',
      description: 'Contribute changes to base map data',
      icon: <Github className="h-5 w-5" />,
      category: 'tools',
      color: 'bg-purple-500',
      implemented: false,
      external: true,
      externalUrl: 'https://www.mapbox.com/contribute/',
      action: () => window.open('https://www.mapbox.com/contribute/', '_blank')
    },
    {
      id: 'tooltip-config',
      name: 'Configurar Tooltips',
      description: 'Campos visibles al hover',
      icon: <Wrench className="h-5 w-5" />,
      category: 'tools',
      color: 'bg-purple-500',
      implemented: true,
      action: () => setActiveTab('tooltip')
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
      icon: <BookOpen className="h-5 w-5" />,
      category: 'tools',
      color: 'bg-purple-500',
      external: true,
      externalUrl: 'https://docs.mapbox.com/',
      action: () => window.open('https://docs.mapbox.com/', '_blank')
    },
    {
      id: 'developer-cheatsheet',
      name: 'Developer Cheat Sheet',
      description: 'All Mapbox tools at a glance',
      icon: <BookOpen className="h-5 w-5" />,
      category: 'tools',
      color: 'bg-purple-500',
      external: true,
      externalUrl: 'https://labs.mapbox.com/developer-cheatsheet/',
      action: () => window.open('https://labs.mapbox.com/developer-cheatsheet/', '_blank')
    }
  ];

  const categories = [
    { id: 'maps', name: 'Maps', description: 'Add custom maps to web and mobile apps', color: 'bg-emerald-500', textColor: 'text-emerald-500' },
    { id: 'navigation', name: 'Navigation', description: 'Add turn-by-turn navigation, create optimized routes, and more', color: 'bg-blue-500', textColor: 'text-blue-500' },
    { id: 'search', name: 'Search', description: 'Turn coordinates into addresses or addresses into coordinates', color: 'bg-orange-500', textColor: 'text-orange-500' },
    { id: 'data', name: 'Data', description: 'Add location datasets to any map, platform, or intelligence solution', color: 'bg-slate-500', textColor: 'text-slate-500' },
    { id: 'tools', name: 'Tools & Resources', description: 'Helpful things for Mapbox Developers', color: 'bg-purple-500', textColor: 'text-purple-500' }
  ];

  const getCategoryTools = (categoryId: string) => 
    mapTools.filter(tool => tool.category === categoryId);

  const getImplementedCount = (categoryId: string) => {
    const tools = getCategoryTools(categoryId);
    return tools.filter(t => t.implemented).length;
  };

  const ToolCard = ({ tool }: { tool: MapToolCard }) => (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-2 ${
        tool.implemented 
          ? 'hover:border-primary/50' 
          : 'opacity-70 hover:opacity-90'
      }`}
      onClick={() => {
        if (tool.action) {
          tool.action();
        } else if (tool.externalUrl) {
          window.open(tool.externalUrl, '_blank');
        }
      }}
    >
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`h-10 w-10 rounded-lg ${tool.color} flex items-center justify-center text-white flex-shrink-0`}>
          {tool.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm truncate">{tool.name}</h4>
            {tool.external && <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tool.description}</p>
          <div className="mt-2">
            {tool.implemented ? (
              <Badge variant="default" className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                Implementado
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">
                {tool.external ? 'Externo' : 'Próximamente'}
              </Badge>
            )}
          </div>
        </div>
        {(tool.action || tool.externalUrl) && (
          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-6 w-6 text-primary" />
            Mapbox Developer Cheat Sheet
          </CardTitle>
          <CardDescription>
            Todas las herramientas y APIs de Mapbox integradas en ObelixIA - Hover para descripción, clic para acceder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <Badge 
                key={cat.id} 
                className={`${cat.color} text-white cursor-pointer`}
                onClick={() => setActiveTab(cat.id)}
              >
                {cat.name} ({getImplementedCount(cat.id)}/{getCategoryTools(cat.id).length})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7 h-auto">
          <TabsTrigger value="overview" className="text-xs py-2">
            <Globe className="h-4 w-4 mr-1" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="maps" className="text-xs py-2">
            <Map className="h-4 w-4 mr-1" />
            Maps
          </TabsTrigger>
          <TabsTrigger value="navigation" className="text-xs py-2">
            <Navigation className="h-4 w-4 mr-1" />
            Navigation
          </TabsTrigger>
          <TabsTrigger value="search" className="text-xs py-2">
            <Search className="h-4 w-4 mr-1" />
            Search
          </TabsTrigger>
          <TabsTrigger value="data" className="text-xs py-2">
            <Database className="h-4 w-4 mr-1" />
            Data
          </TabsTrigger>
          <TabsTrigger value="tools" className="text-xs py-2">
            <Wrench className="h-4 w-4 mr-1" />
            Tools
          </TabsTrigger>
          <TabsTrigger value="tooltip" className="text-xs py-2">
            <Settings className="h-4 w-4 mr-1" />
            Tooltips
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick access buttons */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 border-2 border-slate-500/30 hover:bg-slate-500/10"
              onClick={() => window.open('https://labs.mapbox.com/developer-cheatsheet/', '_blank')}
            >
              <ExternalLink className="h-6 w-6 text-slate-500" />
              <span className="text-sm">Cheat Sheet</span>
            </Button>
          </div>

          {/* Categories overview */}
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-8 pr-4">
              {categories.map(category => (
                <div key={category.id} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-2 rounded-full ${category.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-lg font-semibold ${category.textColor}`}>
                          {category.name}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {getImplementedCount(category.id)}/{getCategoryTools(category.id).length} implementados
                        </Badge>
                      </div>
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
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="maps">
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-emerald-500 flex items-center gap-2">
                <Map className="h-5 w-5" />
                Maps
              </CardTitle>
              <CardDescription>Add custom maps to web and mobile apps</CardDescription>
            </CardHeader>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {getCategoryTools('maps').map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="navigation">
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-500 flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Navigation
              </CardTitle>
              <CardDescription>Add turn-by-turn navigation, create optimized routes, and more</CardDescription>
            </CardHeader>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {getCategoryTools('navigation').map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="search">
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-orange-500 flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search
              </CardTitle>
              <CardDescription>Turn coordinates into addresses or addresses into coordinates</CardDescription>
            </CardHeader>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {getCategoryTools('search').map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="data">
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-500 flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data
              </CardTitle>
              <CardDescription>Add location datasets to any map, platform, or intelligence solution</CardDescription>
            </CardHeader>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {getCategoryTools('data').map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tools">
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-purple-500 flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Tools & Resources
              </CardTitle>
              <CardDescription>Helpful things for Mapbox Developers</CardDescription>
            </CardHeader>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {getCategoryTools('tools').map(tool => (
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
