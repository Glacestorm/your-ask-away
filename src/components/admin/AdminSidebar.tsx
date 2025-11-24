import { useState } from 'react';
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    metrics: true,
    tpv: false,
    management: false,
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
        {/* Dashboard Principal */}
        <SidebarGroup>
          <SidebarMenu className="space-y-2">
            {(isCommercialDirector || isSuperAdmin || isCommercialManager) && (
              <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => onSectionChange('director')}
                    isActive={isActive('director')}
                    className="font-semibold py-3 rounded-xl transition-all hover:shadow-md"
                    tooltip={!open ? {
                      children: t('adminSidebar.commercialDirector'),
                      className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                    } : undefined}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl">
                      <TrendingUp className="h-5 w-5 text-primary-foreground" />
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
                  className="font-semibold py-3 rounded-xl transition-all hover:shadow-md"
                  tooltip={!open ? {
                    children: t('adminSidebar.officeDirector'),
                    className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                  } : undefined}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl">
                    <Building2 className="h-5 w-5 text-primary-foreground" />
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
                  className="font-semibold py-3 rounded-xl transition-all hover:shadow-md"
                  tooltip={!open ? {
                    children: t('adminSidebar.commercialManager'),
                    className: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                  } : undefined}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl">
                    <Briefcase className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    {t('adminSidebar.commercialManager')}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        {/* Métricas y Análisis */}
        {open ? (
          <Collapsible open={openGroups.metrics} onOpenChange={() => toggleGroup('metrics')}>
            <SidebarGroup className="mt-4">
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-accent/50 rounded-xl p-3 transition-all duration-300 flex items-center gap-2 text-sm font-medium">
                  <BarChart3 className="h-4 w-4 transition-transform duration-200" />
                  <span className="flex-1 transition-all duration-300">{t('admin.metrics')}</span>
                  <ChevronRight className={`h-4 w-4 transition-all duration-300 ${openGroups.metrics ? 'rotate-90' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent className="transition-all duration-300 data-[state=open]:animate-slide-in data-[state=closed]:animate-slide-out">
                <SidebarGroupContent className="mt-2">
                  <SidebarMenu className="space-y-1">
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        onClick={() => onSectionChange('health')} 
                        isActive={isActive('health')}
                        className="rounded-lg hover:bg-accent/50 transition-all"
                       >
                         <Activity className="h-4 w-4 transition-transform duration-200" />
                         <span className="text-sm transition-all duration-300">{t('health.title')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        onClick={() => onSectionChange('visits')} 
                        isActive={isActive('visits')}
                        className="rounded-lg hover:bg-accent/50 transition-all"
                       >
                         <BarChart3 className="h-4 w-4 transition-transform duration-200" />
                         <span className="text-sm transition-all duration-300">{t('sidebar.visits')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        onClick={() => onSectionChange('products-metrics')} 
                        isActive={isActive('products-metrics')}
                        className="rounded-lg hover:bg-accent/50 transition-all"
                       >
                         <Package className="h-4 w-4 transition-transform duration-200" />
                         <span className="text-sm transition-all duration-300">{t('admin.products')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        onClick={() => onSectionChange('gestores')} 
                        isActive={isActive('gestores')}
                        className="rounded-lg hover:bg-accent/50 transition-all"
                       >
                         <Users className="h-4 w-4 transition-transform duration-200" />
                         <span className="text-sm transition-all duration-300">{t('map.managers')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        onClick={() => onSectionChange('vinculacion')} 
                        isActive={isActive('vinculacion')}
                        className="rounded-lg hover:bg-accent/50 transition-all"
                       >
                         <Target className="h-4 w-4 transition-transform duration-200" />
                         <span className="text-sm transition-all duration-300">{t('tabs.vinculacion')}</span>
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
                 className="rounded-xl hover:shadow-md transition-all duration-300"
               >
                 <Activity className="h-5 w-5 transition-transform duration-200 hover:scale-110" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => onSectionChange('visits')} 
                  isActive={isActive('visits')} 
                 tooltip={t('sidebar.visits')}
                 className="rounded-xl hover:shadow-md transition-all duration-300"
               >
                 <BarChart3 className="h-5 w-5 transition-transform duration-200 hover:scale-110" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => onSectionChange('products-metrics')} 
                  isActive={isActive('products-metrics')} 
                 tooltip={t('admin.products')}
                 className="rounded-xl hover:shadow-md transition-all duration-300"
               >
                 <Package className="h-5 w-5 transition-transform duration-200 hover:scale-110" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => onSectionChange('gestores')} 
                  isActive={isActive('gestores')} 
                 tooltip={t('map.managers')}
                 className="rounded-xl hover:shadow-md transition-all duration-300"
               >
                 <Users className="h-5 w-5 transition-transform duration-200 hover:scale-110" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => onSectionChange('vinculacion')} 
                  isActive={isActive('vinculacion')} 
                 tooltip={t('tabs.vinculacion')}
                 className="rounded-xl hover:shadow-md transition-all duration-300"
               >
                 <Target className="h-5 w-5 transition-transform duration-200 hover:scale-110" />
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
                <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md p-2 transition-all duration-300">
                  <CreditCard className="h-4 w-4 mr-2 transition-transform duration-200" />
                  <span className="flex-1 transition-all duration-300">TPV</span>
                  <ChevronRight className={`h-4 w-4 transition-all duration-300 ${openGroups.tpv ? 'rotate-90' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent className="transition-all duration-300 data-[state=open]:animate-slide-in data-[state=closed]:animate-slide-out">
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('tpv')} isActive={isActive('tpv')}>
                        <CreditCard className="h-4 w-4 transition-transform duration-200" />
                        <span className="transition-all duration-300">{t('tpv.title')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('tpv-goals')} isActive={isActive('tpv-goals')}>
                        <Target className="h-4 w-4 transition-transform duration-200" />
                        <span className="transition-all duration-300">{t('tpv.goals')}</span>
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
                <SidebarMenuButton onClick={() => onSectionChange('tpv')} isActive={isActive('tpv')} tooltip={t('tpv.title')}>
                  <CreditCard className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('tpv-goals')} isActive={isActive('tpv-goals')} tooltip={t('tpv.goals')}>
                  <Target className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Gestión de Datos */}
        {open ? (
          <Collapsible open={openGroups.management} onOpenChange={() => toggleGroup('management')}>
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md p-2 transition-all duration-300">
                  <Building2 className="h-4 w-4 mr-2 transition-transform duration-200" />
                  <span className="flex-1 transition-all duration-300">{t('admin.dataManagement')}</span>
                  <ChevronRight className={`h-4 w-4 transition-all duration-300 ${openGroups.management ? 'rotate-90' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent className="transition-all duration-300 data-[state=open]:animate-slide-in data-[state=closed]:animate-slide-out">
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('companies')} isActive={isActive('companies')}>
                        <Building2 className="h-4 w-4 transition-transform duration-200" />
                        <span className="transition-all duration-300">{t('admin.companies')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('products')} isActive={isActive('products')}>
                        <Package className="h-4 w-4 transition-transform duration-200" />
                        <span className="transition-all duration-300">{t('productForm.title')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('users')} isActive={isActive('users')}>
                        <Users className="h-4 w-4 transition-transform duration-200" />
                        <span className="transition-all duration-300">{t('admin.users')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('import-history')} isActive={isActive('import-history')}>
                        <History className="h-4 w-4 transition-transform duration-200" />
                        <span className="transition-all duration-300">Historial de Importaciones</span>
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
                <SidebarMenuButton onClick={() => onSectionChange('companies')} isActive={isActive('companies')} tooltip={t('admin.companies')}>
                  <Building2 className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('products')} isActive={isActive('products')} tooltip={t('productForm.title')}>
                  <Package className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('users')} isActive={isActive('users')} tooltip={t('admin.users')}>
                  <Users className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('import-history')} isActive={isActive('import-history')} tooltip="Historial de Importaciones">
                  <History className="h-5 w-5" />
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
                <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md p-2 transition-all duration-300">
                  <Settings className="h-4 w-4 mr-2 transition-transform duration-200" />
                  <span className="flex-1 transition-all duration-300">{t('admin.configuration')}</span>
                  <ChevronRight className={`h-4 w-4 transition-all duration-300 ${openGroups.config ? 'rotate-90' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent className="transition-all duration-300 data-[state=open]:animate-slide-in data-[state=closed]:animate-slide-out">
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('templates')} isActive={isActive('templates')}>
                        <Mail className="h-4 w-4 transition-transform duration-200" />
                        <span className="transition-all duration-300">{t('admin.emailTemplates')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('colors')} isActive={isActive('colors')}>
                        <Palette className="h-4 w-4 transition-transform duration-200" />
                        <span className="transition-all duration-300">{t('admin.statusColors')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('concepts')} isActive={isActive('concepts')}>
                        <BookOpen className="h-4 w-4 transition-transform duration-200" />
                        <span className="transition-all duration-300">{t('admin.concepts')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('map-config')} isActive={isActive('map-config')}>
                        <Map className="h-4 w-4 transition-transform duration-200" />
                        <span className="transition-all duration-300">{t('map.layers')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('audit')} isActive={isActive('audit')}>
                        <Database className="h-4 w-4 transition-transform duration-200" />
                        <span className="transition-all duration-300">{t('admin.auditLogs')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {(isCommercialManager || isSuperAdmin) && (
                      <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => onSectionChange('commercial-manager-audit')} isActive={isActive('commercial-manager-audit')}>
                          <FileText className="h-4 w-4 transition-transform duration-200" />
                          <span className="transition-all duration-300">{t('adminSidebar.commercialManagerAudit')}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ) : (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('templates')} isActive={isActive('templates')} tooltip={t('admin.emailTemplates')}>
                  <Mail className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('colors')} isActive={isActive('colors')} tooltip={t('admin.statusColors')}>
                  <Palette className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('concepts')} isActive={isActive('concepts')} tooltip={t('admin.concepts')}>
                  <BookOpen className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('map-config')} isActive={isActive('map-config')} tooltip={t('map.layers')}>
                  <Map className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('audit')} isActive={isActive('audit')} tooltip={t('admin.auditLogs')}>
                  <Database className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              {(isCommercialManager || isSuperAdmin) && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => onSectionChange('commercial-manager-audit')} isActive={isActive('commercial-manager-audit')} tooltip={t('adminSidebar.commercialManagerAudit')}>
                    <FileText className="h-5 w-5" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
