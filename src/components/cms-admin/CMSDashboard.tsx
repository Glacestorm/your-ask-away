import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Settings, FileText, Navigation, LayoutDashboard, Globe,
  Image, Mail, Flag, Search, Link2, History, Palette,
  Type, Phone, Users, Menu, PanelLeft, PanelBottom,
  Layers, Clock, Upload, Download, FileImage, Video,
  Bell, FileOutput, ToggleLeft, TestTube, Tag, Map,
  ArrowLeft, Key, Webhook, Lock, Timer, RotateCcw,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

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
  color: string;
  items: SectionItem[];
}

const sections: Section[] = [
  {
    id: 'site-settings',
    title: 'Configuración del Sitio',
    icon: Settings,
    color: 'blue',
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
    color: 'emerald',
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
    color: 'purple',
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
    color: 'amber',
    items: [
      { id: 'layouts', label: 'Layouts por Rol', icon: Users, description: 'Configuración por perfil' },
      { id: 'widgets', label: 'Widgets Disponibles', icon: LayoutDashboard, description: 'Componentes de dashboard' },
    ]
  },
  {
    id: 'translations',
    title: 'Traducciones',
    icon: Globe,
    color: 'cyan',
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
    color: 'pink',
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
    color: 'orange',
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
    color: 'red',
    items: [
      { id: 'active', label: 'Funciones Activas', icon: ToggleLeft, description: 'Features habilitadas' },
      { id: 'ab-tests', label: 'A/B Tests', icon: TestTube, description: 'Experimentos activos', badge: 'Beta' },
    ]
  },
  {
    id: 'seo',
    title: 'SEO',
    icon: Search,
    color: 'teal',
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
    color: 'indigo',
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
    color: 'slate',
    items: [
      { id: 'timeline', label: 'Timeline', icon: Timer, description: 'Historial de cambios' },
      { id: 'restore', label: 'Restaurar Versiones', icon: RotateCcw, description: 'Recuperar cambios' },
    ]
  },
];

const colorClasses: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  blue: { bg: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'bg-blue-500/20 text-blue-400' },
  emerald: { bg: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: 'bg-emerald-500/20 text-emerald-400' },
  purple: { bg: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-500/30', text: 'text-purple-400', icon: 'bg-purple-500/20 text-purple-400' },
  amber: { bg: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'bg-amber-500/20 text-amber-400' },
  cyan: { bg: 'from-cyan-500/10 to-cyan-500/5', border: 'border-cyan-500/30', text: 'text-cyan-400', icon: 'bg-cyan-500/20 text-cyan-400' },
  pink: { bg: 'from-pink-500/10 to-pink-500/5', border: 'border-pink-500/30', text: 'text-pink-400', icon: 'bg-pink-500/20 text-pink-400' },
  orange: { bg: 'from-orange-500/10 to-orange-500/5', border: 'border-orange-500/30', text: 'text-orange-400', icon: 'bg-orange-500/20 text-orange-400' },
  red: { bg: 'from-red-500/10 to-red-500/5', border: 'border-red-500/30', text: 'text-red-400', icon: 'bg-red-500/20 text-red-400' },
  teal: { bg: 'from-teal-500/10 to-teal-500/5', border: 'border-teal-500/30', text: 'text-teal-400', icon: 'bg-teal-500/20 text-teal-400' },
  indigo: { bg: 'from-indigo-500/10 to-indigo-500/5', border: 'border-indigo-500/30', text: 'text-indigo-400', icon: 'bg-indigo-500/20 text-indigo-400' },
  slate: { bg: 'from-slate-500/10 to-slate-500/5', border: 'border-slate-500/30', text: 'text-slate-400', icon: 'bg-slate-500/20 text-slate-400' },
};

export const CMSDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeSubSection, setActiveSubSection] = useState<string | null>(null);

  const handleSectionClick = (sectionId: string, itemId: string) => {
    setActiveSection(sectionId);
    setActiveSubSection(itemId);
  };

  const handleBack = () => {
    setActiveSection(null);
    setActiveSubSection(null);
  };

  // Render active component based on selection
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

  // If a section is active, show the component
  if (activeSection && activeSubSection) {
    const section = sections.find(s => s.id === activeSection);
    const item = section?.items.find(i => i.id === activeSubSection);
    const colors = colorClasses[section?.color || 'blue'];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard CMS
          </Button>
          <div className="flex items-center gap-2 text-slate-500">
            <ChevronRight className="w-4 h-4" />
            <span className={colors.text}>{section?.title}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{item?.label}</span>
          </div>
        </div>
        
        {renderActiveComponent()}
      </div>
    );
  }

  // Main dashboard grid
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500">
              <Settings className="w-5 h-5 text-white" />
            </div>
            Dashboard CMS
          </h2>
          <p className="text-slate-400 mt-1">Gestión completa del contenido y configuración del sitio</p>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sections.map((section, sectionIndex) => {
          const colors = colorClasses[section.color];
          const SectionIcon = section.icon;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.05 }}
            >
              <Card className={`bg-gradient-to-br ${colors.bg} ${colors.border} border-2 hover:shadow-lg transition-all`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colors.icon}`}>
                      <SectionIcon className="w-5 h-5" />
                    </div>
                    <CardTitle className={`text-lg ${colors.text}`}>{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {section.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <Button
                        key={item.id}
                        variant="ghost"
                        className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-white/5"
                        onClick={() => handleSectionClick(section.id, item.id)}
                      >
                        <ItemIcon className="w-4 h-4 mr-3 text-slate-400" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-200">{item.label}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs py-0">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{item.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CMSDashboard;
