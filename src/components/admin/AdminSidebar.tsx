import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TrendingUp, Activity, BarChart3, Package, Users, Target, CreditCard, Building2, Settings, Database, Mail, Palette, BookOpen, Map, ChevronRight, FileText, Briefcase, History, Bell, UserCog, CalendarDays, Home, User, AlertTriangle, LayoutDashboard, ClipboardCheck, ShoppingCart, Calculator, FileCode2, Shield, Fingerprint, Rocket, Bot, PieChart, Eye, Brain } from 'lucide-react';
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
              {(isCommercialDirector || isSuperAdmin || isCommercialManager) && (
              <>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('dora-compliance')}
                  isActive={isActive('dora-compliance')}
                  className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                  tooltip={!open ? {
                    children: 'DORA/NIS2',
                    className: "bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20"
                  } : undefined}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-red-500/50 group-hover:rotate-3">
                    <Shield className="h-5 w-5 text-white transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                  </div>
                  <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    DORA/NIS2
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('iso27001')}
                  isActive={isActive('iso27001')}
                  className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                  tooltip={!open ? {
                    children: 'ISO 27001',
                    className: "bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20"
                  } : undefined}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-blue-500/50 group-hover:rotate-3">
                    <Shield className="h-5 w-5 text-white transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                  </div>
                  <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    ISO 27001
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              </>
              )}
              {/* AMA - Autenticación Multifactor Adaptativa - visible para admin roles */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('adaptive-auth')}
                  isActive={isActive('adaptive-auth')}
                  className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                  tooltip={!open ? {
                    children: 'AMA',
                    className: "bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20"
                  } : undefined}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-cyan-500/50 group-hover:rotate-3">
                    <Fingerprint className="h-5 w-5 text-white transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                  </div>
                  <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    AMA
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* ML Explainability - SHAP/LIME */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('ml-explainability')}
                  isActive={isActive('ml-explainability')}
                  className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                  tooltip={!open ? {
                    children: 'SHAP/LIME',
                    className: "bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20"
                  } : undefined}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-violet-500/50 group-hover:rotate-3">
                    <Brain className="h-5 w-5 text-white transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                  </div>
                  <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    SHAP/LIME
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* CDP 360 - Customer Data Platform */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('cdp-360')}
                  isActive={isActive('cdp-360')}
                  className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                  tooltip={!open ? {
                    children: 'CDP 360°',
                    className: "bg-gradient-to-br from-teal-500/10 to-teal-500/5 border-teal-500/20"
                  } : undefined}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-teal-500/50 group-hover:rotate-3">
                    <Eye className="h-5 w-5 text-white transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                  </div>
                  <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    CDP 360°
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSectionChange('technical-docs')}
                  isActive={isActive('technical-docs')}
                  className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                  tooltip={!open ? {
                    children: 'Documentació',
                    className: "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20"
                  } : undefined}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-emerald-500/50 group-hover:rotate-3">
                    <FileCode2 className="h-5 w-5 text-white transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                  </div>
                  <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                    Documentació
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {(isCommercialDirector || isCommercialManager || isSuperAdmin) && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => onSectionChange('role-selector')}
                      isActive={isActive('role-selector')}
                      className="font-semibold py-3 rounded-xl transition-all hover:shadow-md group"
                      tooltip={!open ? {
                        children: 'Selector de Visió',
                        className: "bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20"
                      } : undefined}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-purple-500/50 group-hover:rotate-3">
                        <Activity className="h-5 w-5 text-white transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                      </div>
                      <span className={`text-sm leading-tight transition-all duration-300 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                        Selector de Visió
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => onSectionChange('administration')}
                      isActive={isActive('administration') || isActive('users') || isActive('products') || isActive('tpv-goals') || isActive('bulk-goals') || isActive('goals-progress') || isActive('cascade-goals') || isActive('concepts') || isActive('templates') || isActive('colors') || isActive('alerts') || isActive('notifications') || isActive('map-config') || isActive('tpv')}
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
                </>
              )}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Tauler button moved to dashboard cards */}

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
