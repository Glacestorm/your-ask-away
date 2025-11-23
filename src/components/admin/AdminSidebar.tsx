import { useState } from 'react';
import { TrendingUp, Activity, BarChart3, Package, Users, Target, CreditCard, Building2, Settings, Database, Mail, Palette, BookOpen, Map, ChevronRight, FileText } from 'lucide-react';
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
    <Sidebar className={`border-r transition-all duration-300 ${open ? 'w-64' : 'w-16'}`} collapsible="icon">
      <SidebarContent>
        {/* Dashboard Principal */}
        <SidebarGroup>
          <SidebarMenu>
            {(isCommercialDirector || isSuperAdmin || isCommercialManager) && (
              <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => onSectionChange('director')}
                    isActive={isActive('director')}
                    className="font-semibold"
                    tooltip={!open ? t('adminSidebar.commercialDirector') : undefined}
                  >
                    <TrendingUp className="h-5 w-5" />
                    <span>{t('adminSidebar.commercialDirector')}</span>
                  </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {(isOfficeDirector || isSuperAdmin || isCommercialManager) && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('office-director')}
                  isActive={isActive('office-director')}
                  className="font-semibold"
                  tooltip={!open ? t('adminSidebar.officeDirector') : undefined}
                >
                  <Building2 className="h-5 w-5" />
                  <span>{t('adminSidebar.officeDirector')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {(isCommercialManager || isSuperAdmin) && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('commercial-manager')}
                  isActive={isActive('commercial-manager')}
                  className="font-semibold"
                  tooltip={!open ? t('adminSidebar.commercialManager') : undefined}
                >
                  <TrendingUp className="h-5 w-5" />
                  <span>{t('adminSidebar.commercialManager')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        {/* Métricas y Análisis */}
        {open ? (
          <Collapsible open={openGroups.metrics} onOpenChange={() => toggleGroup('metrics')}>
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md p-2">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <span className="flex-1">{t('admin.metrics')}</span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${openGroups.metrics ? 'rotate-90' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('health')} isActive={isActive('health')}>
                        <Activity className="h-4 w-4" />
                        <span>{t('health.title')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('visits')} isActive={isActive('visits')}>
                        <BarChart3 className="h-4 w-4" />
                        <span>{t('sidebar.visits')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('products-metrics')} isActive={isActive('products-metrics')}>
                        <Package className="h-4 w-4" />
                        <span>{t('admin.products')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('gestores')} isActive={isActive('gestores')}>
                        <Users className="h-4 w-4" />
                        <span>{t('map.managers')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('vinculacion')} isActive={isActive('vinculacion')}>
                        <Target className="h-4 w-4" />
                        <span>{t('tabs.vinculacion')}</span>
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
                <SidebarMenuButton onClick={() => onSectionChange('health')} isActive={isActive('health')} tooltip={t('health.title')}>
                  <Activity className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('visits')} isActive={isActive('visits')} tooltip={t('sidebar.visits')}>
                  <BarChart3 className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('products-metrics')} isActive={isActive('products-metrics')} tooltip={t('admin.products')}>
                  <Package className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('gestores')} isActive={isActive('gestores')} tooltip={t('map.managers')}>
                  <Users className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('vinculacion')} isActive={isActive('vinculacion')} tooltip={t('tabs.vinculacion')}>
                  <Target className="h-5 w-5" />
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
                <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md p-2">
                  <CreditCard className="h-4 w-4 mr-2" />
                  <span className="flex-1">TPV</span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${openGroups.tpv ? 'rotate-90' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('tpv')} isActive={isActive('tpv')}>
                        <CreditCard className="h-4 w-4" />
                        <span>{t('tpv.title')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('tpv-goals')} isActive={isActive('tpv-goals')}>
                        <Target className="h-4 w-4" />
                        <span>{t('tpv.goals')}</span>
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
                <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md p-2">
                  <Building2 className="h-4 w-4 mr-2" />
                  <span className="flex-1">{t('admin.dataManagement')}</span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${openGroups.management ? 'rotate-90' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('companies')} isActive={isActive('companies')}>
                        <Building2 className="h-4 w-4" />
                        <span>{t('admin.companies')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('products')} isActive={isActive('products')}>
                        <Package className="h-4 w-4" />
                        <span>{t('productForm.title')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('users')} isActive={isActive('users')}>
                        <Users className="h-4 w-4" />
                        <span>{t('admin.users')}</span>
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
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Configuración */}
        {open ? (
          <Collapsible open={openGroups.config} onOpenChange={() => toggleGroup('config')}>
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md p-2">
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="flex-1">{t('admin.configuration')}</span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${openGroups.config ? 'rotate-90' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('templates')} isActive={isActive('templates')}>
                        <Mail className="h-4 w-4" />
                        <span>{t('admin.emailTemplates')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('colors')} isActive={isActive('colors')}>
                        <Palette className="h-4 w-4" />
                        <span>{t('admin.statusColors')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('concepts')} isActive={isActive('concepts')}>
                        <BookOpen className="h-4 w-4" />
                        <span>{t('admin.concepts')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('map-config')} isActive={isActive('map-config')}>
                        <Map className="h-4 w-4" />
                        <span>{t('map.layers')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('audit')} isActive={isActive('audit')}>
                        <Database className="h-4 w-4" />
                        <span>{t('admin.auditLogs')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {(isCommercialManager || isSuperAdmin) && (
                      <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => onSectionChange('commercial-manager-audit')} isActive={isActive('commercial-manager-audit')}>
                          <FileText className="h-4 w-4" />
                          <span>{t('adminSidebar.commercialManagerAudit')}</span>
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
