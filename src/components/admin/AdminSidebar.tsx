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
}

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
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
    <Sidebar className="border-r">
      <SidebarTrigger className="m-2" />
      
      <SidebarContent>
        {/* Dashboard Principal */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => onSectionChange('director')}
                isActive={isActive('director')}
                className="font-semibold"
              >
                <TrendingUp className="h-5 w-5" />
                {open && <span>Panel Director</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Métricas y Análisis */}
        <Collapsible open={openGroups.metrics} onOpenChange={() => toggleGroup('metrics')}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md p-2">
                <BarChart3 className="h-4 w-4 mr-2" />
                {open && (
                  <>
                    <span className="flex-1">Métricas</span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${openGroups.metrics ? 'rotate-90' : ''}`} />
                  </>
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onSectionChange('health')} isActive={isActive('health')}>
                      <Activity className="h-4 w-4" />
                      {open && <span>Sistema</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onSectionChange('visits')} isActive={isActive('visits')}>
                      <BarChart3 className="h-4 w-4" />
                      {open && <span>Visitas</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onSectionChange('products-metrics')} isActive={isActive('products-metrics')}>
                      <Package className="h-4 w-4" />
                      {open && <span>Productos</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onSectionChange('gestores')} isActive={isActive('gestores')}>
                      <Users className="h-4 w-4" />
                      {open && <span>Gestores</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onSectionChange('vinculacion')} isActive={isActive('vinculacion')}>
                      <Target className="h-4 w-4" />
                      {open && <span>Vinculación</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* TPV */}
        <Collapsible open={openGroups.tpv} onOpenChange={() => toggleGroup('tpv')}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md p-2">
                <CreditCard className="h-4 w-4 mr-2" />
                {open && (
                  <>
                    <span className="flex-1">TPV</span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${openGroups.tpv ? 'rotate-90' : ''}`} />
                  </>
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onSectionChange('tpv')} isActive={isActive('tpv')}>
                      <CreditCard className="h-4 w-4" />
                      {open && <span>Gestión TPV</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onSectionChange('tpv-goals')} isActive={isActive('tpv-goals')}>
                      <Target className="h-4 w-4" />
                      {open && <span>Objetivos TPV</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Gestión de Datos */}
        <Collapsible open={openGroups.management} onOpenChange={() => toggleGroup('management')}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md p-2">
                <Building2 className="h-4 w-4 mr-2" />
                {open && (
                  <>
                    <span className="flex-1">Gestión</span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${openGroups.management ? 'rotate-90' : ''}`} />
                  </>
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onSectionChange('companies')} isActive={isActive('companies')}>
                      <Building2 className="h-4 w-4" />
                      {open && <span>Empresas</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onSectionChange('products')} isActive={isActive('products')}>
                      <Package className="h-4 w-4" />
                      {open && <span>Catálogo</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onSectionChange('users')} isActive={isActive('users')}>
                      <Users className="h-4 w-4" />
                      {open && <span>Usuarios</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Configuración */}
        <Collapsible open={openGroups.config} onOpenChange={() => toggleGroup('config')}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md p-2">
                <Settings className="h-4 w-4 mr-2" />
                {open && (
                  <>
                    <span className="flex-1">Configuración</span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${openGroups.config ? 'rotate-90' : ''}`} />
                  </>
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onSectionChange('templates')} isActive={isActive('templates')}>
                      <Mail className="h-4 w-4" />
                      {open && <span>Emails</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onSectionChange('colors')} isActive={isActive('colors')}>
                      <Palette className="h-4 w-4" />
                      {open && <span>Estados</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onSectionChange('concepts')} isActive={isActive('concepts')}>
                      <BookOpen className="h-4 w-4" />
                      {open && <span>Conceptos</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onSectionChange('map-config')} isActive={isActive('map-config')}>
                      <Map className="h-4 w-4" />
                      {open && <span>Mapa</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => onSectionChange('audit')} isActive={isActive('audit')}>
                      <Database className="h-4 w-4" />
                      {open && <span>Auditoría</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
    </Sidebar>
  );
}
