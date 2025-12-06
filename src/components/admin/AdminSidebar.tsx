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
                    isActive={isActive('administration') || isActive('users') || isActive('products') || isActive('tpv-goals') || isActive('bulk-goals') || isActive('goals-progress') || isActive('concepts') || isActive('templates') || isActive('colors') || isActive('alerts') || isActive('notifications') || isActive('map-config') || isActive('tpv')}
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

        {/* Gestores Metrics section moved to Admin panel */}

        {/* TPV Management moved to Admin panel */}

        {/* Gestión de Datos moved to Admin panel */}

        {/* Configuración moved to Admin panel */}


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
