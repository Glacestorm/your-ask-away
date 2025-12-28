import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, ChevronDown,
  FileText, Receipt, Euro, Settings, LayoutGrid, BookOpen,
  Store, Palette, Code, GraduationCap, Languages, Briefcase,
  Activity, ClipboardList, Shield, Newspaper, HelpCircle, Sparkles,
  Leaf, Globe, Bot, Building2, HeartPulse, Headphones, Brain, Boxes, Cpu,
  Gauge, Bell, MonitorCheck, Zap, Users, TrendingUp, ShieldCheck, 
  AlertTriangle, LineChart, Key, Workflow, BarChart3, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ObelixiaTheme } from '@/hooks/useObelixiaAdminPreferences';

interface NavCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  items: NavItem[];
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface ObelixiaAdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  theme?: ObelixiaTheme;
}

const categories: NavCategory[] = [
  {
    id: 'comercial',
    label: 'Comercial',
    icon: FileText,
    color: 'blue',
    items: [
      { id: 'quotes', label: 'Presupuestos', icon: FileText },
      { id: 'service-quotes', label: 'Cotizaciones Servicio', icon: Receipt },
      { id: 'invoices', label: 'Facturas', icon: Receipt },
      { id: 'pricing', label: 'Precios', icon: Euro },
      { id: 'demo-requests', label: 'Solicitudes Demo', icon: ClipboardList },
      { id: 'crm-migration', label: 'CRM Migration', icon: Users },
    ]
  },
  {
    id: 'contenido',
    label: 'Contenido',
    icon: LayoutGrid,
    color: 'emerald',
    items: [
      { id: 'cms', label: 'CMS', icon: LayoutGrid },
      { id: 'news', label: 'Noticias', icon: Newspaper },
      { id: 'faq', label: 'FAQ', icon: HelpCircle },
      { id: 'content', label: 'Contenidos', icon: Settings },
    ]
  },
  {
    id: 'documentacion',
    label: 'Documentación',
    icon: BookOpen,
    color: 'purple',
    items: [
      { id: 'reports', label: 'Reportes', icon: ClipboardList },
      { id: 'system-help', label: 'Ayuda Sistema', icon: HelpCircle },
    ]
  },
  {
    id: 'productos',
    label: 'Productos',
    icon: Store,
    color: 'amber',
    items: [
      { id: 'appstore', label: 'App Store', icon: Store },
      { id: 'module-studio', label: 'Module Studio', icon: Boxes },
      { id: 'whitelabel', label: 'White Label', icon: Palette },
      { id: 'verticals', label: 'Verticales', icon: Briefcase },
      { id: 'marketplace', label: 'Marketplace', icon: Store },
    ]
  },
  {
    id: 'academia',
    label: 'Academia',
    icon: GraduationCap,
    color: 'teal',
    items: [
      { id: 'academia', label: 'Academia', icon: GraduationCap },
      { id: 'translations', label: 'Traducciones', icon: Languages },
    ]
  },
  {
    id: 'sistema',
    label: 'Sistema',
    icon: Shield,
    color: 'slate',
    items: [
      { id: 'api', label: 'API', icon: Code },
      { id: 'security', label: 'Seguridad', icon: Shield },
      { id: 'ai-local', label: 'IA Local', icon: Cpu },
      { id: 'system-health', label: 'System Health', icon: Activity },
      { id: 'error-dashboard', label: 'Errors Dashboard', icon: AlertTriangle },
    ]
  },
  {
    id: 'operaciones',
    label: 'Operaciones',
    icon: Gauge,
    color: 'cyan',
    items: [
      { id: 'module-dashboard', label: 'Dashboard Módulos', icon: Gauge },
      { id: 'module-notifications', label: 'Notificaciones', icon: Bell },
      { id: 'module-monitoring', label: 'Monitoreo', icon: MonitorCheck },
      { id: 'module-performance', label: 'Performance', icon: Zap },
      { id: 'metrics-explorer', label: 'Metrics Explorer', icon: BarChart3 },
      { id: 'automation-engine', label: 'Automation Engine', icon: Workflow },
    ]
  },
  {
    id: 'estrategia',
    label: 'Estrategia & Datos',
    icon: Brain,
    color: 'rose',
    items: [
      { id: 'esg', label: 'ESG & Sostenibilidad', icon: Leaf },
      { id: 'market-intelligence', label: 'Market Intelligence', icon: Globe },
      { id: 'ai-agents-specific', label: 'Agentes IA', icon: Bot },
      { id: 'enterprise-dashboard', label: 'Enterprise', icon: Building2 },
      { id: 'cs-metrics', label: 'CS Metrics', icon: HeartPulse },
      { id: 'remote-support', label: 'Soporte Remoto', icon: Headphones },
      { id: 'rfm-dashboard', label: 'RFM Analysis', icon: Target },
      { id: 'predictive-analytics', label: 'Predictive Analytics', icon: TrendingUp },
    ]
  },
  {
    id: 'compliance',
    label: 'Compliance & ML',
    icon: ShieldCheck,
    color: 'indigo',
    items: [
      { id: 'iso27001', label: 'ISO 27001', icon: ShieldCheck },
      { id: 'dora-compliance', label: 'DORA Compliance', icon: Shield },
      { id: 'adaptive-auth', label: 'Adaptive Auth', icon: Key },
      { id: 'advanced-ml', label: 'Advanced ML', icon: Brain },
      { id: 'licenses', label: 'Licencias Enterprise', icon: Key },
    ]
  }
];

const colorMap: Record<string, { bg: string; text: string; border: string; hover: string }> = {
  blue: { 
    bg: 'bg-blue-500/10', 
    text: 'text-blue-400', 
    border: 'border-blue-500/30',
    hover: 'hover:bg-blue-500/20'
  },
  emerald: { 
    bg: 'bg-emerald-500/10', 
    text: 'text-emerald-400', 
    border: 'border-emerald-500/30',
    hover: 'hover:bg-emerald-500/20'
  },
  purple: { 
    bg: 'bg-purple-500/10', 
    text: 'text-purple-400', 
    border: 'border-purple-500/30',
    hover: 'hover:bg-purple-500/20'
  },
  amber: { 
    bg: 'bg-amber-500/10', 
    text: 'text-amber-400', 
    border: 'border-amber-500/30',
    hover: 'hover:bg-amber-500/20'
  },
  teal: { 
    bg: 'bg-teal-500/10', 
    text: 'text-teal-400', 
    border: 'border-teal-500/30',
    hover: 'hover:bg-teal-500/20'
  },
  slate: { 
    bg: 'bg-slate-500/10', 
    text: 'text-slate-400', 
    border: 'border-slate-500/30',
    hover: 'hover:bg-slate-500/20'
  },
  rose: { 
    bg: 'bg-rose-500/10', 
    text: 'text-rose-400', 
    border: 'border-rose-500/30',
    hover: 'hover:bg-rose-500/20'
  },
  cyan: { 
    bg: 'bg-cyan-500/10', 
    text: 'text-cyan-400', 
    border: 'border-cyan-500/30',
    hover: 'hover:bg-cyan-500/20'
  },
  indigo: { 
    bg: 'bg-indigo-500/10', 
    text: 'text-indigo-400', 
    border: 'border-indigo-500/30',
    hover: 'hover:bg-indigo-500/20'
  }
};

export const ObelixiaAdminSidebar: React.FC<ObelixiaAdminSidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed = false,
  onCollapsedChange,
  theme = 'dark'
}) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    categories.map(c => c.id) // All expanded by default
  );

  const isDark = theme === 'dark';

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const activeCategory = categories.find(cat => 
    cat.items.some(item => item.id === activeTab)
  );

  return (
    <TooltipProvider>
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 64 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          'relative flex flex-col h-full transition-colors duration-300',
          isDark 
            ? 'bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-800/95 border-slate-700/50'
            : 'bg-gradient-to-b from-white via-slate-50 to-white border-slate-200',
          'border-r backdrop-blur-xl'
        )}
      >
        {/* Header - Solo botón de colapso */}
        <div className={cn(
          'flex items-center justify-end px-3 py-3 border-b border-slate-700/50'
        )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapsedChange?.(!isCollapsed)}
            className={cn(
              "h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700/50",
              isDark ? "" : "hover:bg-slate-200"
            )}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-3">
          <nav className="space-y-2">
            {categories.map((category) => {
              const isExpanded = expandedCategories.includes(category.id);
              const colors = colorMap[category.color];
              const isCategoryActive = category.items.some(item => item.id === activeTab);
              const CategoryIcon = category.icon;

              return (
                <div key={category.id} className="space-y-1">
                  {/* Category header */}
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => !isCollapsed && toggleCategory(category.id)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
                          'text-left group',
                          colors.hover,
                          isCategoryActive && !isCollapsed && `${colors.bg} ${colors.border} border`,
                          isCollapsed && 'justify-center px-2'
                        )}
                      >
                        <div className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
                          isCategoryActive ? colors.bg : 'bg-slate-800/50',
                          'group-hover:scale-105'
                        )}>
                          <CategoryIcon className={cn('w-4 h-4', colors.text)} />
                        </div>
                        
                        {!isCollapsed && (
                          <>
                            <span className={cn(
                              'flex-1 text-sm font-medium transition-colors',
                              isCategoryActive ? colors.text : 'text-slate-300 group-hover:text-white'
                            )}>
                              {category.label}
                            </span>
                            <ChevronDown 
                              className={cn(
                                'w-4 h-4 text-slate-500 transition-transform duration-200',
                                isExpanded && 'rotate-180'
                              )} 
                            />
                          </>
                        )}
                      </button>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right" className="bg-slate-800 border-slate-700">
                        <p className="font-medium">{category.label}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>

                  {/* Category items */}
                  <AnimatePresence initial={false}>
                    {(isExpanded || isCollapsed) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className={cn('space-y-0.5', !isCollapsed && 'pl-4 ml-4 border-l border-slate-700/50')}>
                          {category.items.map((item) => {
                            const isActive = activeTab === item.id;
                            const ItemIcon = item.icon;

                            return (
                              <Tooltip key={item.id} delayDuration={0}>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => onTabChange(item.id)}
                                    className={cn(
                                      'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200',
                                      'text-left group',
                                      isActive 
                                        ? `${colors.bg} ${colors.text} font-medium`
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700/30',
                                      isCollapsed && 'justify-center px-2'
                                    )}
                                  >
                                    <ItemIcon className={cn(
                                      'w-4 h-4 transition-colors flex-shrink-0',
                                      isActive ? colors.text : 'text-slate-500 group-hover:text-slate-300'
                                    )} />
                                    
                                    {!isCollapsed && (
                                      <span className="text-sm truncate">{item.label}</span>
                                    )}
                                    
                                    {isActive && !isCollapsed && (
                                      <motion.div
                                        layoutId="activeIndicator"
                                        className={cn('w-1.5 h-1.5 rounded-full ml-auto', colors.bg.replace('/10', ''))}
                                        transition={{ duration: 0.2 }}
                                      />
                                    )}
                                  </button>
                                </TooltipTrigger>
                                {isCollapsed && (
                                  <TooltipContent side="right" className="bg-slate-800 border-slate-700">
                                    <p>{item.label}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className={cn(
          'px-3 py-3 border-t border-slate-700/50',
          isCollapsed && 'px-2'
        )}>
          <div className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-800/50',
            isCollapsed && 'justify-center'
          )}>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {!isCollapsed && (
              <span className="text-xs text-slate-400">Sistema activo</span>
            )}
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
};

export default ObelixiaAdminSidebar;
