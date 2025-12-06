import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TrendingUp, Activity, BarChart3, Package, Users, Target, CreditCard, Building2, Settings, Database, Mail, Palette, BookOpen, Map, ChevronRight, FileText, Briefcase, History, Bell, UserCog, CalendarDays, Home, User, AlertTriangle, LayoutDashboard, ClipboardCheck, ShoppingCart, Calculator } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isCommercialDirector: boolean;
  isOfficeDirector: boolean;
  isCommercialManager: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isAuditor: boolean;
}

export function AdminSidebar({ 
  activeSection, 
  onSectionChange,
  isCommercialDirector,
  isOfficeDirector,
  isCommercialManager,
  isSuperAdmin,
  isAdmin,
  isAuditor
}: AdminSidebarProps) {
  // Check if user is a regular gestor (not admin, not director, not manager)
  const isRegularGestor = !isAdmin && !isSuperAdmin && !isCommercialDirector && !isOfficeDirector && !isCommercialManager;
  const { t } = useLanguage();
  const { open } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    metrics: true,
    tpv: false,
    management: false,
    auditor: false,
    config: false,
    administration: false,
  });

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const isActive = (section: string) => activeSection === section;

  return (
    <Sidebar 
      className={`
        border-r border-border/50 bg-gradient-to-b from-card to-accent/5 
        shadow-lg transition-all duration-500 ease-in-out
        ${open ? 'w-64' : 'w-20'}
      `} 
      collapsible="icon"
    >
      <SidebarContent className="py-4 px-2">
        {/* 1. Dashboards - Only show gestor dashboard for regular gestores */}
        {isRegularGestor ? (
          <SidebarGroup>
            <SidebarMenu className="space-y-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('gestor-dashboard')}
                  isActive={isActive('gestor-dashboard')}
                  className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                  tooltip={!open ? {
                    children: 'El Meu Dashboard',
                    className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                  } : undefined}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/50 group-hover:rotate-3">
                    <Users className="h-5 w-5 text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                  </div>
                  <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    El Meu Dashboard
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        ) : (
          <SidebarGroup>
            <SidebarMenu className="space-y-2">
              {(isCommercialDirector || isSuperAdmin || isCommercialManager) && (
              <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => onSectionChange('director')}
                    isActive={isActive('director')}
                    className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                    tooltip={!open ? {
                      children: t('adminSidebar.commercialDirector'),
                      className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                    } : undefined}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/50 group-hover:rotate-3">
                      <TrendingUp className="h-5 w-5 text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                    </div>
                    <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                      {t('adminSidebar.commercialDirector')}
                    </span>
                  </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {(isOfficeDirector || isSuperAdmin || isCommercialManager) && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('office-director')}
                  isActive={isActive('office-director')}
                  className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                  tooltip={!open ? {
                    children: t('adminSidebar.officeDirector'),
                    className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                  } : undefined}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/50 group-hover:rotate-3">
                    <Building2 className="h-5 w-5 text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                  </div>
                  <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    {t('adminSidebar.officeDirector')}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {(isCommercialManager || isSuperAdmin) && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('commercial-manager')}
                  isActive={isActive('commercial-manager')}
                  className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                  tooltip={!open ? {
                    children: t('adminSidebar.commercialManager'),
                    className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                  } : undefined}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/50 group-hover:rotate-3">
                    <Briefcase className="h-5 w-5 text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                  </div>
                  <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    {t('adminSidebar.commercialManager')}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onSectionChange('gestor-dashboard')}
                isActive={isActive('gestor-dashboard')}
                className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                tooltip={!open ? {
                  children: 'Gestor',
                  className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                } : undefined}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/50 group-hover:rotate-3">
                  <Users className="h-5 w-5 text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                </div>
                <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                  Gestor
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('audit')}
                  isActive={isActive('audit')}
                  className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                  tooltip={!open ? {
                    children: 'Auditor',
                    className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                  } : undefined}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/50 group-hover:rotate-3">
                    <UserCog className="h-5 w-5 text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                  </div>
                  <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    Auditor
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {(isCommercialDirector || isCommercialManager) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => onSectionChange('administration')}
                    isActive={isActive('administration') || isActive('users') || isActive('products') || isActive('tpv-goals') || isActive('bulk-goals') || isActive('goals-progress') || isActive('concepts') || isActive('templates') || isActive('colors') || isActive('alerts') || isActive('notifications')}
                    className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                    tooltip={!open ? {
                      children: 'Admin',
                      className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                    } : undefined}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-slate-500/50 group-hover:rotate-3">
                      <Settings className="h-5 w-5 text-white transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                    </div>
                    <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                      Admin
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* 2. Navegación y Visualización - Available to all users except auditors */}
        <SidebarGroup className="mt-4">
          <SidebarMenu className="space-y-2">
            {(isCommercialManager || isCommercialDirector || isOfficeDirector || isSuperAdmin) && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('contracted-products')}
                  isActive={isActive('contracted-products')}
                  className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                  tooltip={!open ? {
                    children: 'Productos Contratados',
                    className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                  } : undefined}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-amber-500/50 group-hover:rotate-3">
                    <ShoppingCart className="h-5 w-5 text-white transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                  </div>
                  <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    Productos Contratados
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {(isCommercialDirector || isOfficeDirector || isSuperAdmin || isCommercialManager) && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('director-alerts')}
                  isActive={isActive('director-alerts')}
                  className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                  tooltip={!open ? {
                    children: 'Alertas de Objetivos',
                    className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                  } : undefined}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-amber-500/50 group-hover:rotate-3">
                    <AlertTriangle className="h-5 w-5 text-white transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                  </div>
                  <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    Alertas de Objetivos
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {(isCommercialDirector || isOfficeDirector || isSuperAdmin || isCommercialManager) && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('goals-kpi')}
                  isActive={isActive('goals-kpi')}
                  className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                  tooltip={!open ? {
                    children: 'Dashboard KPI',
                    className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                  } : undefined}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-purple-500/50 group-hover:rotate-3">
                    <LayoutDashboard className="h-5 w-5 text-white transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                  </div>
                  <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    Dashboard KPI
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {(isCommercialDirector || isOfficeDirector || isSuperAdmin || isCommercialManager) && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('kpi-report-history')}
                  isActive={isActive('kpi-report-history')}
                  className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                  tooltip={!open ? {
                    children: 'Historial d\'Informes',
                    className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                  } : undefined}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-teal-500/50 group-hover:rotate-3">
                    <History className="h-5 w-5 text-white transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                  </div>
                  <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    Historial d'Informes
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {(isCommercialDirector || isOfficeDirector || isSuperAdmin || isCommercialManager) && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('alert-history')}
                  isActive={isActive('alert-history')}
                  className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                  tooltip={!open ? {
                    children: 'Historial de Alertas',
                    className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                  } : undefined}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-rose-500/50 group-hover:rotate-3">
                    <Bell className="h-5 w-5 text-white transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                  </div>
                  <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    Historial de Alertas
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {(isCommercialDirector || isOfficeDirector || isSuperAdmin || isCommercialManager) && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('gestor-comparison')}
                  isActive={isActive('gestor-comparison')}
                  className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                  tooltip={!open ? {
                    children: 'Comparativa Gestores',
                    className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                  } : undefined}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-emerald-500/50 group-hover:rotate-3">
                    <Users className="h-5 w-5 text-white transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                  </div>
                  <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    Comparativa Gestores
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/dashboard')}
                isActive={location.pathname === '/dashboard'}
                className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                tooltip={!open ? {
                  children: 'Tauler',
                  className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                } : undefined}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/50 group-hover:rotate-3">
                  <BarChart3 className="h-5 w-5 text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                </div>
                <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                  Tauler
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Métricas y Análisis - Hide from regular gestores */}
        {!isRegularGestor && open ? (
          <Collapsible open={openGroups.metrics} onOpenChange={() => toggleGroup('metrics')}>
            <SidebarGroup className="mt-4">
               <CollapsibleTrigger asChild>
                 <SidebarGroupLabel className="cursor-pointer hover:bg-accent/50 rounded-xl p-3 transition-all duration-300 flex items-center gap-2 text-sm font-medium group">
                   <BarChart3 className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                   <span className="flex-1 transition-all duration-300 group-hover:translate-x-1">{t('admin.metrics')}</span>
                   <ChevronRight className={`h-4 w-4 transition-all duration-300 group-hover:text-primary ${openGroups.metrics ? 'rotate-90' : ''}`} />
                 </SidebarGroupLabel>
               </CollapsibleTrigger>
              <CollapsibleContent className="transition-all duration-300 data-[state=open]:animate-slide-in data-[state=closed]:animate-slide-out">
                <SidebarGroupContent className="mt-2">
                  <SidebarMenu className="space-y-1">
                     <SidebarMenuItem>
                       <SidebarMenuButton 
                         onClick={() => onSectionChange('visits')} 
                         isActive={isActive('visits')}
                         className="rounded-lg hover:bg-accent/50 transition-all group"
                        >
                          <BarChart3 className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                          <span className="text-sm transition-all duration-300 group-hover:translate-x-1">{t('sidebar.visits')}</span>
                       </SidebarMenuButton>
                     </SidebarMenuItem>
                     <SidebarMenuItem>
                       <SidebarMenuButton 
                         onClick={() => onSectionChange('products-metrics')} 
                         isActive={isActive('products-metrics')}
                         className="rounded-lg hover:bg-accent/50 transition-all group"
                        >
                          <Package className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                          <span className="text-sm transition-all duration-300 group-hover:translate-x-1">{t('admin.products')}</span>
                       </SidebarMenuButton>
                     </SidebarMenuItem>
                     <SidebarMenuItem>
                       <SidebarMenuButton 
                         onClick={() => onSectionChange('gestores')} 
                         isActive={isActive('gestores')}
                         className="rounded-lg hover:bg-accent/50 transition-all group"
                        >
                          <Users className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                          <span className="text-sm transition-all duration-300 group-hover:translate-x-1">{t('map.managers')}</span>
                       </SidebarMenuButton>
                     </SidebarMenuItem>
                     <SidebarMenuItem>
                       <SidebarMenuButton 
                         onClick={() => onSectionChange('vinculacion')} 
                         isActive={isActive('vinculacion')}
                         className="rounded-lg hover:bg-accent/50 transition-all group"
                        >
                          <Target className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                          <span className="text-sm transition-all duration-300 group-hover:translate-x-1">{t('tabs.vinculacion')}</span>
                       </SidebarMenuButton>
                     </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ) : !isRegularGestor ? (
          <SidebarGroup className="mt-4">
            <SidebarMenu className="space-y-2">
               <SidebarMenuItem>
                 <SidebarMenuButton 
                   onClick={() => onSectionChange('visits')} 
                   isActive={isActive('visits')} 
                  tooltip={t('sidebar.visits')}
                  className="rounded-xl hover:shadow-md transition-all duration-300 group"
                >
                  <BarChart3 className="h-5 w-5 transition-all duration-300 group-hover:scale-125 group-hover:text-primary" />
                 </SidebarMenuButton>
               </SidebarMenuItem>
               <SidebarMenuItem>
                 <SidebarMenuButton 
                   onClick={() => onSectionChange('products-metrics')} 
                   isActive={isActive('products-metrics')} 
                  tooltip={t('admin.products')}
                  className="rounded-xl hover:shadow-md transition-all duration-300 group"
                >
                  <Package className="h-5 w-5 transition-all duration-300 group-hover:scale-125 group-hover:text-primary" />
                 </SidebarMenuButton>
               </SidebarMenuItem>
               <SidebarMenuItem>
                 <SidebarMenuButton 
                   onClick={() => onSectionChange('gestores')} 
                   isActive={isActive('gestores')} 
                  tooltip={t('map.managers')}
                  className="rounded-xl hover:shadow-md transition-all duration-300 group"
                >
                  <Users className="h-5 w-5 transition-all duration-300 group-hover:scale-125 group-hover:text-primary" />
                 </SidebarMenuButton>
               </SidebarMenuItem>
               <SidebarMenuItem>
                 <SidebarMenuButton 
                   onClick={() => onSectionChange('vinculacion')} 
                   isActive={isActive('vinculacion')} 
                  tooltip={t('tabs.vinculacion')}
                  className="rounded-xl hover:shadow-md transition-all duration-300 group"
                >
                  <Target className="h-5 w-5 transition-all duration-300 group-hover:scale-125 group-hover:text-primary" />
                 </SidebarMenuButton>
               </SidebarMenuItem>
             </SidebarMenu>
           </SidebarGroup>
         ) : null}

        {/* TPV Management - Hide from regular gestores */}
        {!isRegularGestor && (
          <>
            {open ? (
              <Collapsible open={openGroups.tpv} onOpenChange={() => toggleGroup('tpv')}>
                <SidebarGroup>
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md p-2 transition-all duration-300 group">
                      <CreditCard className="h-4 w-4 mr-2 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                      <span className="flex-1 transition-all duration-300 group-hover:translate-x-1">TPV</span>
                      <ChevronRight className={`h-4 w-4 transition-all duration-300 group-hover:text-primary ${openGroups.tpv ? 'rotate-90' : ''}`} />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="transition-all duration-300 data-[state=open]:animate-slide-in data-[state=closed]:animate-slide-out">
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton onClick={() => onSectionChange('tpv')} isActive={isActive('tpv')} className="group">
                            <CreditCard className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                            <span className="transition-all duration-300 group-hover:translate-x-1">{t('tpv.title')}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            ) : (
              <SidebarGroup>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onSectionChange('tpv')} isActive={isActive('tpv')} tooltip={t('tpv.title')} className="group">
                      <CreditCard className="h-5 w-5 transition-all duration-300 group-hover:scale-125 group-hover:text-primary" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            )}
          </>
        )}

        {/* Gestión de Datos - Hide from regular gestores */}
        {!isRegularGestor && (isSuperAdmin || isCommercialDirector || isCommercialManager) && (
          <>
            {open ? (
              <Collapsible open={openGroups.management} onOpenChange={() => toggleGroup('management')}>
                <SidebarGroup>
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md p-2 transition-all duration-300 group">
                      <Building2 className="h-4 w-4 mr-2 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                      <span className="flex-1 transition-all duration-300 group-hover:translate-x-1">{t('admin.dataManagement')}</span>
                      <ChevronRight className={`h-4 w-4 transition-all duration-300 group-hover:text-primary ${openGroups.management ? 'rotate-90' : ''}`} />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="transition-all duration-300 data-[state=open]:animate-slide-in data-[state=closed]:animate-slide-out">
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton onClick={() => onSectionChange('companies')} isActive={isActive('companies')} className="group">
                            <Building2 className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                            <span className="transition-all duration-300 group-hover:translate-x-1">{t('admin.companies')}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton onClick={() => onSectionChange('import-history')} isActive={isActive('import-history')} className="group">
                            <History className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                            <span className="transition-all duration-300 group-hover:translate-x-1">Historial de Importaciones</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            ) : (
              <SidebarGroup>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onSectionChange('companies')} isActive={isActive('companies')} tooltip={t('admin.companies')} className="group">
                      <Building2 className="h-5 w-5 transition-all duration-300 group-hover:scale-125 group-hover:text-primary" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onSectionChange('import-history')} isActive={isActive('import-history')} tooltip="Historial de Importaciones" className="group">
                      <History className="h-5 w-5 transition-all duration-300 group-hover:scale-125 group-hover:text-primary" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            )}
          </>
        )}

        {/* Configuración - Hide from regular gestores */}
        {!isRegularGestor && (isSuperAdmin || isCommercialDirector || isCommercialManager) && (
          <>
            {open ? (
              <Collapsible open={openGroups.config} onOpenChange={() => toggleGroup('config')}>
                <SidebarGroup>
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md p-2 transition-all duration-300 group">
                      <Settings className="h-4 w-4 mr-2 transition-all duration-300 group-hover:scale-110 group-hover:text-primary group-hover:rotate-90" />
                      <span className="flex-1 transition-all duration-300 group-hover:translate-x-1">{t('admin.configuration')}</span>
                      <ChevronRight className={`h-4 w-4 transition-all duration-300 group-hover:text-primary ${openGroups.config ? 'rotate-90' : ''}`} />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="transition-all duration-300 data-[state=open]:animate-slide-in data-[state=closed]:animate-slide-out">
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton onClick={() => onSectionChange('map-config')} isActive={isActive('map-config')} className="group">
                            <Map className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                            <span className="transition-all duration-300 group-hover:translate-x-1">{t('map.layers')}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            ) : (
              <SidebarGroup>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onSectionChange('map-config')} isActive={isActive('map-config')} tooltip={t('map.layers')} className="group">
                      <Map className="h-5 w-5 transition-all duration-300 group-hover:scale-125 group-hover:text-primary" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            )}
          </>
        )}


        {/* Navigation - Available to all users */}
        <SidebarGroup className="mt-auto pt-4 border-t border-border/50">
          <SidebarMenu className="space-y-2">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/home')}
                isActive={location.pathname === '/home'}
                className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                tooltip={!open ? {
                  children: 'Inicio',
                  className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                } : undefined}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/50 group-hover:rotate-3">
                  <Home className="h-5 w-5 text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                </div>
                <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                  Inicio
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/profile')}
                isActive={location.pathname === '/profile'}
                className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                tooltip={!open ? {
                  children: 'Mi Perfil',
                  className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                } : undefined}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/50 group-hover:rotate-3">
                  <User className="h-5 w-5 text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                </div>
                <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                  Mi Perfil
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
