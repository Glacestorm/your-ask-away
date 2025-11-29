import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TrendingUp, Activity, BarChart3, Package, Users, Target, CreditCard, Building2, Settings, Database, Mail, Palette, BookOpen, Map, ChevronRight, FileText, Briefcase, History } from 'lucide-react';
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
}

export function AdminSidebar({ 
  activeSection, 
  onSectionChange,
  isCommercialDirector,
  isOfficeDirector,
  isCommercialManager,
  isSuperAdmin
}: AdminSidebarProps) {
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
        {/* 1. Dashboards Principales */}
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
                  children: t('adminSidebar.gestor'),
                  className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                } : undefined}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/50 group-hover:rotate-3">
                  <Users className="h-5 w-5 text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                </div>
                <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                  {t('adminSidebar.gestor')}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* 2. Navegación y Visualización */}
        <SidebarGroup className="mt-4">
          <SidebarMenu className="space-y-2">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onSectionChange('map')}
                isActive={isActive('map')}
                className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                tooltip={!open ? {
                  children: 'Mapa',
                  className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                } : undefined}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/50 group-hover:rotate-3">
                  <Map className="h-5 w-5 text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                </div>
                <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                  Mapa
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
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

        {/* Métricas y Análisis */}
        {open ? (
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
                         onClick={() => onSectionChange('health')} 
                         isActive={isActive('health')}
                         className="rounded-lg hover:bg-accent/50 transition-all group"
                        >
                          <Activity className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                          <span className="text-sm transition-all duration-300 group-hover:translate-x-1">{t('health.title')}</span>
                       </SidebarMenuButton>
                     </SidebarMenuItem>
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
        ) : (
          <SidebarGroup className="mt-4">
            <SidebarMenu className="space-y-2">
               <SidebarMenuItem>
                 <SidebarMenuButton 
                   onClick={() => onSectionChange('health')} 
                   isActive={isActive('health')} 
                  tooltip={t('health.title')}
                  className="rounded-xl hover:shadow-md transition-all duration-300 group"
                >
                  <Activity className="h-5 w-5 transition-all duration-300 group-hover:scale-125 group-hover:text-primary" />
                 </SidebarMenuButton>
               </SidebarMenuItem>
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
        )}

        {/* TPV */}
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
                     <SidebarMenuItem>
                       <SidebarMenuButton onClick={() => onSectionChange('tpv-goals')} isActive={isActive('tpv-goals')} className="group">
                         <Target className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                         <span className="transition-all duration-300 group-hover:translate-x-1">{t('tpv.goals')}</span>
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
               <SidebarMenuItem>
                 <SidebarMenuButton onClick={() => onSectionChange('tpv-goals')} isActive={isActive('tpv-goals')} tooltip={t('tpv.goals')} className="group">
                   <Target className="h-5 w-5 transition-all duration-300 group-hover:scale-125 group-hover:text-primary" />
                 </SidebarMenuButton>
               </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Auditor */}
        {open ? (
          <Collapsible open={openGroups.auditor} onOpenChange={() => toggleGroup('auditor')}>
            <SidebarGroup>
               <CollapsibleTrigger asChild>
                 <SidebarGroupLabel className="cursor-pointer hover:bg-accent/50 rounded-xl p-3 transition-all duration-300 flex items-center gap-2 text-sm font-medium group">
                   <FileText className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                   <span className="flex-1 transition-all duration-300 group-hover:translate-x-1">Auditor</span>
                   <ChevronRight className={`h-4 w-4 transition-all duration-300 group-hover:text-primary ${openGroups.auditor ? 'rotate-90' : ''}`} />
                 </SidebarGroupLabel>
               </CollapsibleTrigger>
              <CollapsibleContent className="transition-all duration-300 data-[state=open]:animate-slide-in data-[state=closed]:animate-slide-out">
                <SidebarGroupContent className="mt-2">
                  <SidebarMenu className="space-y-1">
                     <SidebarMenuItem>
                       <SidebarMenuButton 
                         onClick={() => onSectionChange('audit')} 
                         isActive={isActive('audit')}
                         className="rounded-lg hover:bg-accent/50 transition-all group"
                        >
                          <Database className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                          <span className="text-sm transition-all duration-300 group-hover:translate-x-1">{t('admin.auditLogs')}</span>
                       </SidebarMenuButton>
                     </SidebarMenuItem>
                    {(isCommercialManager || isSuperAdmin) && (
                       <SidebarMenuItem>
                         <SidebarMenuButton 
                           onClick={() => onSectionChange('commercial-manager-audit')} 
                           isActive={isActive('commercial-manager-audit')}
                           className="rounded-lg hover:bg-accent/50 transition-all group"
                          >
                            <FileText className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                            <span className="text-sm transition-all duration-300 group-hover:translate-x-1">{t('adminSidebar.commercialManagerAudit')}</span>
                         </SidebarMenuButton>
                       </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ) : (
          <SidebarGroup className="mt-4">
            <SidebarMenu className="space-y-2">
               <SidebarMenuItem>
                 <SidebarMenuButton 
                   onClick={() => onSectionChange('audit')} 
                   isActive={isActive('audit')} 
                  tooltip={t('admin.auditLogs')}
                  className="rounded-xl hover:shadow-md transition-all duration-300 group"
                >
                  <Database className="h-5 w-5 transition-all duration-300 group-hover:scale-125 group-hover:text-primary" />
                 </SidebarMenuButton>
               </SidebarMenuItem>
              {(isCommercialManager || isSuperAdmin) && (
                 <SidebarMenuItem>
                   <SidebarMenuButton 
                     onClick={() => onSectionChange('commercial-manager-audit')} 
                     isActive={isActive('commercial-manager-audit')} 
                    tooltip={t('adminSidebar.commercialManagerAudit')}
                    className="rounded-xl hover:shadow-md transition-all duration-300 group"
                  >
                    <FileText className="h-5 w-5 transition-all duration-300 group-hover:scale-125 group-hover:text-primary" />
                   </SidebarMenuButton>
                 </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Gestión de Datos */}
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
                       <SidebarMenuButton onClick={() => onSectionChange('products')} isActive={isActive('products')} className="group">
                         <Package className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                         <span className="transition-all duration-300 group-hover:translate-x-1">{t('productForm.title')}</span>
                       </SidebarMenuButton>
                     </SidebarMenuItem>
                     <SidebarMenuItem>
                       <SidebarMenuButton onClick={() => onSectionChange('users')} isActive={isActive('users')} className="group">
                         <Users className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                         <span className="transition-all duration-300 group-hover:translate-x-1">{t('admin.users')}</span>
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
                 <SidebarMenuButton onClick={() => onSectionChange('products')} isActive={isActive('products')} tooltip={t('productForm.title')} className="group">
                   <Package className="h-5 w-5 transition-all duration-300 group-hover:scale-125 group-hover:text-primary" />
                 </SidebarMenuButton>
               </SidebarMenuItem>
               <SidebarMenuItem>
                 <SidebarMenuButton onClick={() => onSectionChange('users')} isActive={isActive('users')} tooltip={t('admin.users')} className="group">
                   <Users className="h-5 w-5 transition-all duration-300 group-hover:scale-125 group-hover:text-primary" />
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

        {/* Configuración */}
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
                       <SidebarMenuButton onClick={() => onSectionChange('templates')} isActive={isActive('templates')} className="group">
                         <Mail className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                         <span className="transition-all duration-300 group-hover:translate-x-1">{t('admin.emailTemplates')}</span>
                       </SidebarMenuButton>
                     </SidebarMenuItem>
                     <SidebarMenuItem>
                       <SidebarMenuButton onClick={() => onSectionChange('colors')} isActive={isActive('colors')} className="group">
                         <Palette className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary group-hover:rotate-12" />
                         <span className="transition-all duration-300 group-hover:translate-x-1">{t('admin.statusColors')}</span>
                       </SidebarMenuButton>
                     </SidebarMenuItem>
                     <SidebarMenuItem>
                       <SidebarMenuButton onClick={() => onSectionChange('concepts')} isActive={isActive('concepts')} className="group">
                         <BookOpen className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                         <span className="transition-all duration-300 group-hover:translate-x-1">{t('admin.concepts')}</span>
                       </SidebarMenuButton>
                     </SidebarMenuItem>
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
                 <SidebarMenuButton onClick={() => onSectionChange('templates')} isActive={isActive('templates')} tooltip={t('admin.emailTemplates')} className="group">
                   <Mail className="h-5 w-5 transition-all duration-300 group-hover:scale-125 group-hover:text-primary" />
                 </SidebarMenuButton>
               </SidebarMenuItem>
               <SidebarMenuItem>
                 <SidebarMenuButton onClick={() => onSectionChange('colors')} isActive={isActive('colors')} tooltip={t('admin.statusColors')} className="group">
                   <Palette className="h-5 w-5 transition-all duration-300 group-hover:scale-125 group-hover:text-primary group-hover:rotate-12" />
                 </SidebarMenuButton>
               </SidebarMenuItem>
               <SidebarMenuItem>
                 <SidebarMenuButton onClick={() => onSectionChange('concepts')} isActive={isActive('concepts')} tooltip={t('admin.concepts')} className="group">
                   <BookOpen className="h-5 w-5 transition-all duration-300 group-hover:scale-125 group-hover:text-primary" />
                 </SidebarMenuButton>
               </SidebarMenuItem>
               <SidebarMenuItem>
                 <SidebarMenuButton onClick={() => onSectionChange('map-config')} isActive={isActive('map-config')} tooltip={t('map.layers')} className="group">
                   <Map className="h-5 w-5 transition-all duration-300 group-hover:scale-125 group-hover:text-primary" />
                 </SidebarMenuButton>
               </SidebarMenuItem>
             </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Administració */}
        <SidebarGroup className="mt-4">
          <SidebarMenu className="space-y-2">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onSectionChange('users')}
                isActive={isActive('users')}
                className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                tooltip={!open ? {
                  children: 'Administració',
                  className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                } : undefined}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/50 group-hover:rotate-6">
                  <Settings className="h-5 w-5 text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:rotate-90" />
                </div>
                <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                  Administració
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
