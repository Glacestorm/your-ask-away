/**
 * ObelixIA Accounting Sidebar - Phase 14
 * Professional Enterprise Sidebar with 3D Effects & Financial Aesthetic
 */

import { useState } from 'react';
import { 
  LayoutDashboard, 
  FolderTree, 
  FileText, 
  Users, 
  Building2,
  PieChart,
  Receipt,
  Bot,
  TrendingUp,
  Shield,
  Globe,
  GitMerge,
  Landmark,
  Calculator,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Plug,
  Workflow,
  FileArchive,
  Network,
  Sparkles,
  Cpu,
  LineChart,
  Zap,
  Scale,
  PiggyBank,
  AlertTriangle,
  Leaf,
  Settings,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ObelixiaAccountingHelpButton } from './ObelixiaAccountingHelpButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ObelixiaAccountingSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface ModuleItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface ModuleGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  glowColor: string;
  modules: ModuleItem[];
}

const coreModules: ModuleItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'chart', label: 'Plan Contable', icon: FolderTree },
  { id: 'entries', label: 'Asientos', icon: FileText },
  { id: 'partners', label: 'Socios', icon: Users },
  { id: 'banking', label: 'Bancos', icon: Building2 },
  { id: 'reports', label: 'Reportes', icon: PieChart },
  { id: 'fiscal', label: 'Fiscal', icon: Receipt },
];

const moduleGroups: ModuleGroup[] = [
  {
    id: 'ai',
    label: 'Módulos IA',
    icon: Bot,
    color: 'from-blue-500 to-cyan-500',
    glowColor: 'shadow-blue-500/30',
    modules: [
      { id: 'ai-agent', label: 'Agente Autónomo', icon: Bot, badge: 'PRO', badgeColor: 'bg-blue-500' },
      { id: 'forecasting', label: 'Previsión Financiera', icon: TrendingUp },
      { id: 'compliance', label: 'Compliance', icon: Shield },
      { id: 'multicurrency', label: 'Multi-Divisa', icon: Globe },
      { id: 'reconciliation', label: 'Conciliación IA', icon: GitMerge },
      { id: 'treasury', label: 'Tesorería', icon: Landmark },
      { id: 'tax-planning', label: 'Planificación Fiscal', icon: Calculator },
      { id: 'analytics', label: 'Analytics Ejecutivo', icon: BarChart3 },
    ]
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    icon: Network,
    color: 'from-purple-500 to-pink-500',
    glowColor: 'shadow-purple-500/30',
    modules: [
      { id: 'integrations-hub', label: 'Hub Integraciones', icon: Plug },
      { id: 'workflow', label: 'Workflow', icon: Workflow },
      { id: 'documents', label: 'Documentos', icon: FileArchive },
      { id: 'intercompany', label: 'Intercompañía', icon: Network },
    ]
  },
  {
    id: 'advanced-ai',
    label: 'IA Avanzada',
    icon: Sparkles,
    color: 'from-emerald-500 to-teal-500',
    glowColor: 'shadow-emerald-500/30',
    modules: [
      { id: 'advanced-copilot', label: 'Copilot Pro', icon: Sparkles, badge: 'NEW', badgeColor: 'bg-emerald-500' },
      { id: 'ai-orchestrator', label: 'Orquestador', icon: Cpu },
      { id: 'smart-analytics', label: 'Smart Analytics', icon: LineChart },
      { id: 'realtime-insights', label: 'Insights RT', icon: Zap },
    ]
  },
  {
    id: 'regulatory',
    label: 'Regulatorio & ESG',
    icon: Scale,
    color: 'from-amber-500 to-orange-500',
    glowColor: 'shadow-amber-500/30',
    modules: [
      { id: 'regulatory-reporting', label: 'Reporting', icon: Scale },
      { id: 'budgeting', label: 'Presupuestos', icon: PiggyBank },
      { id: 'risk-management', label: 'Riesgos', icon: AlertTriangle },
      { id: 'esg-reporting', label: 'ESG', icon: Leaf, badge: 'ESG', badgeColor: 'bg-green-500' },
    ]
  },
];

// 3D Card Component with depth effect
const MenuItem3D = ({ 
  item, 
  isActive, 
  onClick,
  collapsed = false
}: { 
  item: ModuleItem; 
  isActive: boolean; 
  onClick: () => void;
  collapsed?: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const content = (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group",
        isActive 
          ? "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent text-primary shadow-lg shadow-primary/10" 
          : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
      )}
      style={{
        transform: isHovered && !isActive ? 'translateX(4px) translateZ(10px)' : 'translateX(0) translateZ(0)',
        perspective: '1000px',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* 3D Depth Layer */}
      <div className={cn(
        "absolute inset-0 rounded-xl transition-opacity duration-300",
        isActive 
          ? "opacity-100 bg-gradient-to-r from-primary/5 to-transparent" 
          : "opacity-0 group-hover:opacity-100 bg-gradient-to-r from-muted/30 to-transparent"
      )} style={{ transform: 'translateZ(-5px)' }} />
      
      {/* Active Indicator */}
      {isActive && (
        <motion.div 
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-r-full shadow-lg shadow-primary/50"
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Icon with 3D effect */}
      <div className={cn(
        "relative p-1.5 rounded-lg transition-all duration-300",
        isActive 
          ? "bg-primary/20 shadow-inner" 
          : "group-hover:bg-muted"
      )}>
        <item.icon className={cn(
          "h-4 w-4 transition-all duration-300",
          isActive ? "text-primary drop-shadow-sm" : "text-muted-foreground group-hover:text-foreground"
        )} />
        
        {/* Icon glow effect */}
        {isActive && (
          <div className="absolute inset-0 rounded-lg bg-primary/20 blur-md -z-10" />
        )}
      </div>

      {!collapsed && (
        <>
          <span className="flex-1 text-left truncate">{item.label}</span>
          
          {/* Badge */}
          {item.badge && (
            <span className={cn(
              "px-1.5 py-0.5 text-[10px] font-bold rounded-md text-white uppercase tracking-wide",
              item.badgeColor || "bg-primary"
            )}>
              {item.badge}
            </span>
          )}
        </>
      )}

      {/* Hover glow effect */}
      <motion.div 
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(var(--primary-rgb), 0.1) 0%, transparent 50%)',
        }}
      />
    </motion.button>
  );

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};

// Collapsible Group with 3D header
const CollapsibleGroup3D = ({
  group,
  activeTab,
  onTabChange,
  collapsed = false
}: {
  group: ModuleGroup;
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed?: boolean;
}) => {
  const hasActiveChild = group.modules.some(m => m.id === activeTab);
  const [isOpen, setIsOpen] = useState(hasActiveChild);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="mb-2">
      {/* Group Header */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 relative overflow-hidden group",
          hasActiveChild 
            ? `bg-gradient-to-r ${group.color} text-white shadow-lg ${group.glowColor}` 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
        )}
        style={{
          transform: isHovered ? 'translateZ(5px)' : 'translateZ(0)',
          perspective: '1000px',
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {/* Background gradient animation */}
        {hasActiveChild && (
          <motion.div 
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        )}

        <div className="flex items-center gap-2 z-10">
          <div className={cn(
            "p-1 rounded-lg transition-all duration-300",
            hasActiveChild ? "bg-white/20" : "bg-muted/50"
          )}>
            <group.icon className="h-3.5 w-3.5" />
          </div>
          {!collapsed && <span>{group.label}</span>}
        </div>

        {!collapsed && (
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </motion.div>
        )}
      </motion.button>

      {/* Group Content */}
      <AnimatePresence>
        {isOpen && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-2 pt-1 space-y-0.5">
              {group.modules.map((module) => (
                <MenuItem3D
                  key={module.id}
                  item={module}
                  isActive={activeTab === module.id}
                  onClick={() => onTabChange(module.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function ObelixiaAccountingSidebar({ 
  activeTab, 
  onTabChange 
}: ObelixiaAccountingSidebarProps) {
  return (
    <aside className="w-72 min-w-72 h-full border-r border-border/50 bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95 relative overflow-hidden flex flex-col">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
        <div className="absolute bottom-1/4 -right-10 w-36 h-36 bg-purple-500/5 rounded-full blur-2xl" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />
      </div>

      {/* Header */}
      <div className="p-4 border-b border-border/50 relative z-10">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Logo with 3D effect */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25 transform transition-transform group-hover:scale-105">
                <Calculator className="h-5 w-5 text-primary-foreground drop-shadow-sm" />
              </div>
              {/* Floating particles effect */}
              <motion.div 
                className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full"
                animate={{ 
                  y: [0, -4, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            
            <div>
              <h2 className="text-base font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                ObelixIA
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                Contabilidad Pro
              </p>
            </div>
          </motion.div>
          
          <ObelixiaAccountingHelpButton />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 relative z-10">
        {/* Core Modules Section */}
        <motion.div 
          className="mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="px-2 mb-2">
            <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
              Contabilidad
            </span>
          </div>
          <div className="space-y-0.5">
            {coreModules.map((module) => (
              <MenuItem3D
                key={module.id}
                item={module}
                isActive={activeTab === module.id}
                onClick={() => onTabChange(module.id)}
              />
            ))}
          </div>
        </motion.div>

        {/* Divider with gradient */}
        <div className="relative h-px my-4">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Module Groups */}
        <motion.div 
          className="space-y-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {moduleGroups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
            >
              <CollapsibleGroup3D
                group={group}
                activeTab={activeTab}
                onTabChange={onTabChange}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border/50 relative z-10 mt-auto">
        <div className="flex items-center justify-between">
          <motion.button
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
          >
            <Settings className="h-4 w-4" />
          </motion.button>
          
          <motion.button
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <HelpCircle className="h-4 w-4" />
          </motion.button>
          
          <motion.button
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <LogOut className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Version badge */}
        <div className="mt-3 text-center">
          <span className="text-[9px] text-muted-foreground/50 font-mono">
            v14.0 Enterprise Edition
          </span>
        </div>
      </div>
    </aside>
  );
}

export default ObelixiaAccountingSidebar;