import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings, FileText, Navigation, LayoutDashboard, Globe,
  Image, Mail, Flag, Search, Link2, History, Palette,
  Type, Phone, Users, Menu, PanelLeft, PanelBottom,
  Layers, Clock, Upload, FileImage, Video,
  Bell, FileOutput, ToggleLeft, TestTube, Tag, Map,
  ArrowLeft, Key, Webhook, Lock, Timer, RotateCcw,
  ChevronRight, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Import CMS Admin Components
import { SiteSettingsManager } from './SiteSettingsManager';
import { ThemeEditor } from './ThemeEditor';
import { PageBuilder } from './PageBuilder';
import { NavigationManager } from './NavigationManager';
import { DashboardConfigurator } from './DashboardConfigurator';
import { TranslationsManager } from './TranslationsManager';
import { MediaLibrary } from './MediaLibrary';
import { EmailTemplateEditor } from './EmailTemplateEditor';
import { FeatureFlagsManager } from './FeatureFlagsManager';
import { SEOManager } from './SEOManager';
import { IntegrationsHub } from './IntegrationsHub';
import { AuditDashboard } from './AuditDashboard';

interface SectionItem {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  badge?: string;
}

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  gradient: string;
  shadowColor: string;
  iconGlow: string;
  items: SectionItem[];
}

const sections: Section[] = [
  {
    id: 'site-settings',
    title: 'Configuración del Sitio',
    icon: Settings,
    gradient: 'from-blue-600 via-blue-500 to-cyan-400',
    shadowColor: 'shadow-blue-500/30',
    iconGlow: 'shadow-[0_0_30px_rgba(59,130,246,0.5)]',
    items: [
      { id: 'general', label: 'General', icon: Settings, description: 'Nombre, logo, favicon' },
      { id: 'theme', label: 'Colores y Tema', icon: Palette, description: 'Personalización visual' },
      { id: 'typography', label: 'Tipografías', icon: Type, description: 'Fuentes del sistema' },
      { id: 'contact', label: 'Contacto y Social', icon: Phone, description: 'Información de contacto' },
    ]
  },
  {
    id: 'pages-content',
    title: 'Páginas y Contenido',
    icon: FileText,
    gradient: 'from-emerald-600 via-emerald-500 to-teal-400',
    shadowColor: 'shadow-emerald-500/30',
    iconGlow: 'shadow-[0_0_30px_rgba(16,185,129,0.5)]',
    items: [
      { id: 'pages', label: 'Páginas Dinámicas', icon: FileText, description: 'Constructor de páginas' },
      { id: 'blocks', label: 'Bloques Reutilizables', icon: Layers, description: 'Componentes compartidos' },
      { id: 'versions', label: 'Versiones e Historial', icon: Clock, description: 'Control de versiones' },
    ]
  },
  {
    id: 'navigation',
    title: 'Navegación',
    icon: Navigation,
    gradient: 'from-violet-600 via-purple-500 to-fuchsia-400',
    shadowColor: 'shadow-purple-500/30',
    iconGlow: 'shadow-[0_0_30px_rgba(139,92,246,0.5)]',
    items: [
      { id: 'main-menu', label: 'Menú Principal', icon: Menu, description: 'Navegación superior' },
      { id: 'sidebar', label: 'Sidebar', icon: PanelLeft, description: 'Menú lateral' },
      { id: 'footer', label: 'Footer', icon: PanelBottom, description: 'Navegación inferior' },
    ]
  },
  {
    id: 'dashboards',
    title: 'Dashboards',
    icon: LayoutDashboard,
    gradient: 'from-amber-500 via-orange-500 to-yellow-400',
    shadowColor: 'shadow-amber-500/30',
    iconGlow: 'shadow-[0_0_30px_rgba(245,158,11,0.5)]',
    items: [
      { id: 'layouts', label: 'Layouts por Rol', icon: Users, description: 'Configuración por perfil' },
      { id: 'widgets', label: 'Widgets Disponibles', icon: LayoutDashboard, description: 'Componentes de dashboard' },
    ]
  },
  {
    id: 'translations',
    title: 'Traducciones',
    icon: Globe,
    gradient: 'from-cyan-500 via-sky-500 to-blue-400',
    shadowColor: 'shadow-cyan-500/30',
    iconGlow: 'shadow-[0_0_30px_rgba(6,182,212,0.5)]',
    items: [
      { id: 'editor', label: 'Editor de Textos', icon: FileText, description: 'Gestionar traducciones' },
      { id: 'progress', label: 'Progreso por Idioma', icon: Globe, description: 'Estado de traducción' },
      { id: 'import-export', label: 'Import/Export', icon: Upload, description: 'Importar y exportar' },
    ]
  },
  {
    id: 'media',
    title: 'Biblioteca de Medios',
    icon: Image,
    gradient: 'from-pink-500 via-rose-500 to-red-400',
    shadowColor: 'shadow-pink-500/30',
    iconGlow: 'shadow-[0_0_30px_rgba(236,72,153,0.5)]',
    items: [
      { id: 'images', label: 'Imágenes', icon: FileImage, description: 'Galería de imágenes' },
      { id: 'documents', label: 'Documentos', icon: FileText, description: 'PDFs y documentos' },
      { id: 'videos', label: 'Videos', icon: Video, description: 'Contenido multimedia' },
    ]
  },
  {
    id: 'templates',
    title: 'Plantillas',
    icon: Mail,
    gradient: 'from-orange-500 via-amber-500 to-yellow-400',
    shadowColor: 'shadow-orange-500/30',
    iconGlow: 'shadow-[0_0_30px_rgba(249,115,22,0.5)]',
    items: [
      { id: 'emails', label: 'Emails', icon: Mail, description: 'Plantillas de correo' },
      { id: 'notifications', label: 'Notificaciones', icon: Bell, description: 'Alertas del sistema' },
      { id: 'pdfs', label: 'PDFs', icon: FileOutput, description: 'Documentos generados' },
    ]
  },
  {
    id: 'feature-flags',
    title: 'Feature Flags',
    icon: Flag,
    gradient: 'from-red-600 via-rose-500 to-pink-400',
    shadowColor: 'shadow-red-500/30',
    iconGlow: 'shadow-[0_0_30px_rgba(239,68,68,0.5)]',
    items: [
      { id: 'active', label: 'Funciones Activas', icon: ToggleLeft, description: 'Features habilitadas' },
      { id: 'ab-tests', label: 'A/B Tests', icon: TestTube, description: 'Experimentos activos', badge: 'Beta' },
    ]
  },
  {
    id: 'seo',
    title: 'SEO',
    icon: Search,
    gradient: 'from-teal-500 via-emerald-500 to-green-400',
    shadowColor: 'shadow-teal-500/30',
    iconGlow: 'shadow-[0_0_30px_rgba(20,184,166,0.5)]',
    items: [
      { id: 'meta-tags', label: 'Meta Tags', icon: Tag, description: 'Metadatos de páginas' },
      { id: 'sitemap', label: 'Sitemap', icon: Map, description: 'Mapa del sitio' },
      { id: 'redirects', label: 'Redirects', icon: ArrowLeft, description: 'Redirecciones URL' },
    ]
  },
  {
    id: 'integrations',
    title: 'Integraciones',
    icon: Link2,
    gradient: 'from-indigo-600 via-violet-500 to-purple-400',
    shadowColor: 'shadow-indigo-500/30',
    iconGlow: 'shadow-[0_0_30px_rgba(99,102,241,0.5)]',
    items: [
      { id: 'api-keys', label: 'API Keys', icon: Key, description: 'Claves de API' },
      { id: 'webhooks', label: 'Webhooks', icon: Webhook, description: 'Endpoints externos' },
      { id: 'oauth', label: 'OAuth', icon: Lock, description: 'Autenticación terceros' },
    ]
  },
  {
    id: 'audit',
    title: 'Auditoría',
    icon: History,
    gradient: 'from-slate-500 via-gray-500 to-zinc-400',
    shadowColor: 'shadow-slate-500/30',
    iconGlow: 'shadow-[0_0_30px_rgba(100,116,139,0.5)]',
    items: [
      { id: 'timeline', label: 'Timeline', icon: Timer, description: 'Historial de cambios' },
      { id: 'restore', label: 'Restaurar Versiones', icon: RotateCcw, description: 'Recuperar cambios' },
    ]
  },
];

export const CMSDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeSubSection, setActiveSubSection] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleSectionClick = (sectionId: string, itemId: string) => {
    setActiveSection(sectionId);
    setActiveSubSection(itemId);
  };

  const handleBack = () => {
    setActiveSection(null);
    setActiveSubSection(null);
  };

  const renderActiveComponent = () => {
    if (!activeSection || !activeSubSection) return null;

    const componentMap: Record<string, Record<string, React.ReactNode>> = {
      'site-settings': {
        'general': <SiteSettingsManager />,
        'theme': <ThemeEditor />,
        'typography': <SiteSettingsManager />,
        'contact': <SiteSettingsManager />,
      },
      'pages-content': {
        'pages': <PageBuilder />,
        'blocks': <PageBuilder />,
        'versions': <PageBuilder />,
      },
      'navigation': {
        'main-menu': <NavigationManager />,
        'sidebar': <NavigationManager />,
        'footer': <NavigationManager />,
      },
      'dashboards': {
        'layouts': <DashboardConfigurator />,
        'widgets': <DashboardConfigurator />,
      },
      'translations': {
        'editor': <TranslationsManager />,
        'progress': <TranslationsManager />,
        'import-export': <TranslationsManager />,
      },
      'media': {
        'images': <MediaLibrary />,
        'documents': <MediaLibrary />,
        'videos': <MediaLibrary />,
      },
      'templates': {
        'emails': <EmailTemplateEditor />,
        'notifications': <EmailTemplateEditor />,
        'pdfs': <EmailTemplateEditor />,
      },
      'feature-flags': {
        'active': <FeatureFlagsManager />,
        'ab-tests': <FeatureFlagsManager />,
      },
      'seo': {
        'meta-tags': <SEOManager />,
        'sitemap': <SEOManager />,
        'redirects': <SEOManager />,
      },
      'integrations': {
        'api-keys': <IntegrationsHub />,
        'webhooks': <IntegrationsHub />,
        'oauth': <IntegrationsHub />,
      },
      'audit': {
        'timeline': <AuditDashboard />,
        'restore': <AuditDashboard />,
      },
    };

    return componentMap[activeSection]?.[activeSubSection] || null;
  };

  if (activeSection && activeSubSection) {
    const section = sections.find(s => s.id === activeSection);
    const item = section?.items.find(i => i.id === activeSubSection);

    return (
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard CMS
          </Button>
          <div className="flex items-center gap-2 text-slate-500">
            <ChevronRight className="w-4 h-4" />
            <span className={`bg-gradient-to-r ${section?.gradient} bg-clip-text text-transparent font-semibold`}>
              {section?.title}
            </span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-medium">{item?.label}</span>
          </div>
        </div>
        
        {renderActiveComponent()}
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <motion.div 
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 border border-white/10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 animate-pulse" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/20 to-transparent rounded-full blur-3xl" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-5">
            {/* 3D Icon Container */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.1, rotateY: 15 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl blur-xl opacity-60" />
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-emerald-500 shadow-2xl shadow-blue-500/30 transform perspective-1000">
                <Settings className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
            </motion.div>
            
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                  Dashboard CMS
                </span>
              </h2>
              <p className="text-slate-400 mt-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Gestión completa del contenido y configuración del sitio
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Sistema Activo
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {sections.map((section, sectionIndex) => {
            const SectionIcon = section.icon;
            const isHovered = hoveredCard === section.id;

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: sectionIndex * 0.06,
                  type: "spring",
                  stiffness: 100
                }}
                onMouseEnter={() => setHoveredCard(section.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className="group"
              >
                {/* 3D Card Container */}
                <div 
                  className={`
                    relative rounded-2xl transition-all duration-500 ease-out
                    ${isHovered ? 'transform -translate-y-2 scale-[1.02]' : ''}
                  `}
                  style={{
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                  }}
                >
                  {/* Glow Effect */}
                  <div 
                    className={`
                      absolute -inset-1 bg-gradient-to-r ${section.gradient} rounded-2xl blur-xl opacity-0 
                      group-hover:opacity-40 transition-opacity duration-500
                    `}
                  />
                  
                  {/* Card */}
                  <Card 
                    className={`
                      relative overflow-hidden border-0 
                      bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90
                      backdrop-blur-xl shadow-xl ${section.shadowColor}
                      group-hover:shadow-2xl transition-all duration-500
                      before:absolute before:inset-0 before:rounded-2xl before:p-[1px]
                      before:bg-gradient-to-br before:${section.gradient} before:opacity-30
                      before:group-hover:opacity-60 before:transition-opacity
                    `}
                  >
                    {/* Glass overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                    
                    {/* Shine effect on hover */}
                    <div 
                      className={`
                        absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700
                        bg-gradient-to-r from-transparent via-white/5 to-transparent
                        transform -skew-x-12 -translate-x-full group-hover:translate-x-full
                        transition-transform duration-1000
                      `}
                    />

                    <CardHeader className="pb-4 relative z-10">
                      <div className="flex items-center gap-4">
                        {/* 3D Icon */}
                        <motion.div 
                          className="relative"
                          whileHover={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          <div className={`
                            absolute inset-0 bg-gradient-to-br ${section.gradient} rounded-xl blur-lg opacity-50
                            group-hover:opacity-80 transition-opacity
                          `} />
                          <div className={`
                            relative p-3 rounded-xl bg-gradient-to-br ${section.gradient}
                            shadow-lg ${section.iconGlow} group-hover:shadow-xl
                            transform transition-transform group-hover:scale-110
                          `}>
                            <SectionIcon className="w-6 h-6 text-white drop-shadow-md" />
                          </div>
                        </motion.div>
                        
                        <CardTitle className="text-lg font-bold">
                          <span className={`bg-gradient-to-r ${section.gradient} bg-clip-text text-transparent`}>
                            {section.title}
                          </span>
                        </CardTitle>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-1 relative z-10">
                      {section.items.map((item, itemIndex) => {
                        const ItemIcon = item.icon;
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: sectionIndex * 0.06 + itemIndex * 0.05 }}
                          >
                            <Button
                              variant="ghost"
                              className={`
                                w-full justify-start text-left h-auto py-3 px-4 
                                rounded-xl hover:bg-white/10 
                                border border-transparent hover:border-white/10
                                transition-all duration-300 group/item
                                hover:shadow-lg hover:shadow-black/20
                                transform hover:translate-x-1
                              `}
                              onClick={() => handleSectionClick(section.id, item.id)}
                            >
                              <div className={`
                                p-2 rounded-lg bg-slate-700/50 mr-4
                                group-hover/item:bg-gradient-to-br group-hover/item:${section.gradient}
                                transition-all duration-300
                              `}>
                                <ItemIcon className="w-4 h-4 text-slate-400 group-hover/item:text-white transition-colors" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-slate-200 group-hover/item:text-white transition-colors">
                                    {item.label}
                                  </span>
                                  {item.badge && (
                                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-2 py-0 border-0 shadow-lg shadow-amber-500/30">
                                      {item.badge}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 group-hover/item:text-slate-400 transition-colors truncate">
                                  {item.description}
                                </p>
                              </div>
                              <ChevronRight className={`
                                w-5 h-5 text-slate-600 group-hover/item:text-slate-300
                                transform transition-all duration-300
                                group-hover/item:translate-x-1
                              `} />
                            </Button>
                          </motion.div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CMSDashboard;
