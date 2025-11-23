import { useState } from 'react';
import { TrendingUp, Activity, BarChart3, Package, Users, Target, CreditCard, Building2, Settings, Database, Mail, Palette, BookOpen, Map, ChevronRight } from 'lucide-react';
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

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isCommercialDirector: boolean;
  isOfficeDirector: boolean;
  isSuperAdmin: boolean;
}

export function AdminSidebar({ 
  activeSection, 
  onSectionChange, 
  isCommercialDirector, 
  isOfficeDirector, 
  isSuperAdmin 
}: AdminSidebarProps) {
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
            {(isCommercialDirector || isSuperAdmin) && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('director')}
                  isActive={isActive('director')}
                  className="font-semibold"
                  tooltip={!open ? "Panel Director" : undefined}
                >
                  <TrendingUp className="h-5 w-5" />
                  <span>Panel Director</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {(isOfficeDirector || isSuperAdmin) && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('office-director')}
                  isActive={isActive('office-director')}
                  className="font-semibold"
                  tooltip={!open ? "Director Oficina" : undefined}
                >
                  <Building2 className="h-5 w-5" />
                  <span>Director Oficina</span>
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
                  <span className="flex-1">Métricas</span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${openGroups.metrics ? 'rotate-90' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('health')} isActive={isActive('health')}>
                        <Activity className="h-4 w-4" />
                        <span>Sistema</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('visits')} isActive={isActive('visits')}>
                        <BarChart3 className="h-4 w-4" />
                        <span>Visitas</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('products-metrics')} isActive={isActive('products-metrics')}>
                        <Package className="h-4 w-4" />
                        <span>Productos</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('gestores')} isActive={isActive('gestores')}>
                        <Users className="h-4 w-4" />
                        <span>Gestores</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('vinculacion')} isActive={isActive('vinculacion')}>
                        <Target className="h-4 w-4" />
                        <span>Vinculación</span>
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
                <SidebarMenuButton onClick={() => onSectionChange('health')} isActive={isActive('health')} tooltip="Sistema">
                  <Activity className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('visits')} isActive={isActive('visits')} tooltip="Visitas">
                  <BarChart3 className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('products-metrics')} isActive={isActive('products-metrics')} tooltip="Productos">
                  <Package className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('gestores')} isActive={isActive('gestores')} tooltip="Gestores">
                  <Users className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('vinculacion')} isActive={isActive('vinculacion')} tooltip="Vinculación">
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
                        <span>Gestión TPV</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('tpv-goals')} isActive={isActive('tpv-goals')}>
                        <Target className="h-4 w-4" />
                        <span>Objetivos TPV</span>
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
                <SidebarMenuButton onClick={() => onSectionChange('tpv')} isActive={isActive('tpv')} tooltip="Gestión TPV">
                  <CreditCard className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('tpv-goals')} isActive={isActive('tpv-goals')} tooltip="Objetivos TPV">
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
                  <span className="flex-1">Gestión</span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${openGroups.management ? 'rotate-90' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('companies')} isActive={isActive('companies')}>
                        <Building2 className="h-4 w-4" />
                        <span>Empresas</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('products')} isActive={isActive('products')}>
                        <Package className="h-4 w-4" />
                        <span>Catálogo</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('users')} isActive={isActive('users')}>
                        <Users className="h-4 w-4" />
                        <span>Usuarios</span>
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
                <SidebarMenuButton onClick={() => onSectionChange('companies')} isActive={isActive('companies')} tooltip="Empresas">
                  <Building2 className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('products')} isActive={isActive('products')} tooltip="Catálogo">
                  <Package className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('users')} isActive={isActive('users')} tooltip="Usuarios">
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
                  <span className="flex-1">Configuración</span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${openGroups.config ? 'rotate-90' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('templates')} isActive={isActive('templates')}>
                        <Mail className="h-4 w-4" />
                        <span>Emails</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('colors')} isActive={isActive('colors')}>
                        <Palette className="h-4 w-4" />
                        <span>Estados</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('concepts')} isActive={isActive('concepts')}>
                        <BookOpen className="h-4 w-4" />
                        <span>Conceptos</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('map-config')} isActive={isActive('map-config')}>
                        <Map className="h-4 w-4" />
                        <span>Mapa</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => onSectionChange('audit')} isActive={isActive('audit')}>
                        <Database className="h-4 w-4" />
                        <span>Auditoría</span>
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
                <SidebarMenuButton onClick={() => onSectionChange('templates')} isActive={isActive('templates')} tooltip="Emails">
                  <Mail className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('colors')} isActive={isActive('colors')} tooltip="Estados">
                  <Palette className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('concepts')} isActive={isActive('concepts')} tooltip="Conceptos">
                  <BookOpen className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('map-config')} isActive={isActive('map-config')} tooltip="Mapa">
                  <Map className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onSectionChange('audit')} isActive={isActive('audit')} tooltip="Auditoría">
                  <Database className="h-5 w-5" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
