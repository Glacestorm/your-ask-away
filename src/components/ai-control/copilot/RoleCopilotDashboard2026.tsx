/**
 * RoleCopilotDashboard2026 - Dashboard Renovado del Copiloto de Rol
 * Con tabs: Mi Día, Coaching, Sector Intel, Automatizaciones, Learning Hub, Collaboration
 * + Selector de rol para Superadmin
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sparkles, 
  Calendar, 
  GraduationCap, 
  Globe, 
  Zap, 
  BookOpen, 
  Users,
  RefreshCw,
  Maximize2,
  Minimize2,
  Brain,
  Target,
  TrendingUp,
  Activity,
  UserCog,
  Building2,
  Shield,
  ShoppingCart,
  HeartPulse,
  Factory,
  Briefcase,
  Cpu
} from 'lucide-react';
import { useRoleCopilot2026, CopilotRole2026, CNAE_SECTORS } from '@/hooks/useRoleCopilot2026';
import { CopilotMyDayView } from './CopilotMyDayView';
import { CopilotCoachingPanel } from './CopilotCoachingPanel';
import { CopilotSectorIntel } from './CopilotSectorIntel';
import { CopilotAutomationsPanel } from './CopilotAutomationsPanel';
import { CopilotLearningHub } from './CopilotLearningHub';
import { CopilotCollaborationPanel } from './CopilotCollaborationPanel';
import { CopilotSuggestionCard } from './CopilotSuggestionCard';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';

// Definición de todos los roles disponibles para el selector
const ALL_ROLES: { value: CopilotRole2026; label: string; icon: React.ReactNode; sector?: string; category?: string }[] = [
  // Gestores por Sector
  { value: 'gestor', label: 'Gestor General', icon: <Briefcase className="h-4 w-4" />, category: 'Gestores' },
  { value: 'gestor_banca', label: 'Gestor Banca', icon: <Building2 className="h-4 w-4" />, sector: 'K', category: 'Gestores' },
  { value: 'gestor_seguros', label: 'Gestor Seguros', icon: <Shield className="h-4 w-4" />, sector: 'K65', category: 'Gestores' },
  { value: 'gestor_retail', label: 'Gestor Retail', icon: <ShoppingCart className="h-4 w-4" />, sector: 'G', category: 'Gestores' },
  { value: 'gestor_healthcare', label: 'Gestor Healthcare', icon: <HeartPulse className="h-4 w-4" />, sector: 'Q', category: 'Gestores' },
  { value: 'gestor_industrial', label: 'Gestor Industrial', icon: <Factory className="h-4 w-4" />, sector: 'C', category: 'Gestores' },
  { value: 'gestor_services', label: 'Gestor Servicios', icon: <Briefcase className="h-4 w-4" />, sector: 'S', category: 'Gestores' },
  { value: 'gestor_tech', label: 'Gestor Tech', icon: <Cpu className="h-4 w-4" />, sector: 'J', category: 'Gestores' },
  // Directores Generales
  { value: 'director_oficina', label: 'Director de Oficina', icon: <Building2 className="h-4 w-4" />, category: 'Directores' },
  { value: 'director_comercial', label: 'Director Comercial', icon: <TrendingUp className="h-4 w-4" />, category: 'Directores' },
  { value: 'director_regional', label: 'Director Regional', icon: <Globe className="h-4 w-4" />, category: 'Directores' },
  // Departamento de Créditos (Sector Bancario K)
  { value: 'director_creditos', label: 'Director de Créditos', icon: <Building2 className="h-4 w-4" />, sector: 'K', category: 'Dpto. Créditos' },
  { value: 'subdirector_creditos', label: 'Subdirector de Créditos', icon: <Building2 className="h-4 w-4" />, sector: 'K', category: 'Dpto. Créditos' },
  { value: 'analista_creditos_senior', label: 'Analista Créditos Sr.', icon: <Target className="h-4 w-4" />, sector: 'K', category: 'Dpto. Créditos' },
  { value: 'analista_creditos', label: 'Analista de Créditos', icon: <Target className="h-4 w-4" />, sector: 'K', category: 'Dpto. Créditos' },
  { value: 'gestor_creditos', label: 'Gestor de Créditos', icon: <Briefcase className="h-4 w-4" />, sector: 'K', category: 'Dpto. Créditos' },
  // Departamento de Morosidad/Recobro (Sector Bancario K)
  { value: 'director_morosidad', label: 'Director de Morosidad', icon: <Shield className="h-4 w-4" />, sector: 'K', category: 'Dpto. Morosidad' },
  { value: 'subdirector_morosidad', label: 'Subdirector Morosidad', icon: <Shield className="h-4 w-4" />, sector: 'K', category: 'Dpto. Morosidad' },
  { value: 'analista_morosidad_senior', label: 'Analista Morosidad Sr.', icon: <Target className="h-4 w-4" />, sector: 'K', category: 'Dpto. Morosidad' },
  { value: 'analista_morosidad', label: 'Analista de Morosidad', icon: <Target className="h-4 w-4" />, sector: 'K', category: 'Dpto. Morosidad' },
  { value: 'gestor_recobro', label: 'Gestor de Recobro', icon: <Briefcase className="h-4 w-4" />, sector: 'K', category: 'Dpto. Morosidad' },
  { value: 'negociador_deuda', label: 'Negociador de Deuda', icon: <Users className="h-4 w-4" />, sector: 'K', category: 'Dpto. Morosidad' },
  // Departamento de Riesgos (Multi-sector)
  { value: 'director_riesgos', label: 'Director de Riesgos', icon: <Target className="h-4 w-4" />, category: 'Dpto. Riesgos' },
  { value: 'subdirector_riesgos', label: 'Subdirector Riesgos', icon: <Target className="h-4 w-4" />, category: 'Dpto. Riesgos' },
  { value: 'analista_riesgos_senior', label: 'Analista Riesgos Sr.', icon: <Activity className="h-4 w-4" />, category: 'Dpto. Riesgos' },
  { value: 'analista_riesgos', label: 'Analista de Riesgos', icon: <Activity className="h-4 w-4" />, category: 'Dpto. Riesgos' },
  // Customer Success
  { value: 'customer_success', label: 'Customer Success', icon: <Users className="h-4 w-4" />, category: 'Customer Success' },
  { value: 'customer_success_manager', label: 'CS Manager', icon: <Users className="h-4 w-4" />, category: 'Customer Success' },
  { value: 'onboarding_specialist', label: 'Onboarding Specialist', icon: <Sparkles className="h-4 w-4" />, category: 'Customer Success' },
  // Administración y Compliance
  { value: 'admin', label: 'Administrador', icon: <UserCog className="h-4 w-4" />, category: 'Admin' },
  { value: 'auditor', label: 'Auditor', icon: <Shield className="h-4 w-4" />, category: 'Admin' },
  { value: 'risk_manager', label: 'Risk Manager', icon: <Target className="h-4 w-4" />, category: 'Admin' },
  { value: 'compliance_officer', label: 'Compliance Officer', icon: <Shield className="h-4 w-4" />, category: 'Admin' },
];

interface RoleCopilotDashboard2026Props {
  className?: string;
}

export function RoleCopilotDashboard2026({ className }: RoleCopilotDashboard2026Props) {
  const [activeTab, setActiveTab] = useState('my-day');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { userRole, isSuperAdmin } = useAuth();

  const {
    currentSuggestions,
    copilotConfig,
    session,
    metrics,
    myDayView,
    isLoading,
    generateSuggestions,
    executeAction,
    dismissSuggestion,
    simulatedRole,
    setSimulatedRole,
    effectiveRole,
  } = useRoleCopilot2026();

  const handleRoleChange = (role: string) => {
    setSimulatedRole(role as CopilotRole2026);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await generateSuggestions();
    setIsRefreshing(false);
  };

  // Filtrar sugerencias por tipo para cada tab
  const coachingSuggestions = currentSuggestions.filter(s => 
    s.type === 'coaching' || s.type === 'learning'
  );
  const automationSuggestions = currentSuggestions.filter(s => 
    s.type === 'automation' || s.type === 'workflow'
  );
  const collaborationSuggestions = currentSuggestions.filter(s => 
    s.type === 'collaboration'
  );

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {copilotConfig?.copilot_name || 'Copiloto Inteligente 2026'}
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                  v2026
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {session ? `Sesión activa` : 'Sincronizando...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Role Selector for SuperAdmin */}
            {isSuperAdmin && (
              <div className="hidden lg:flex items-center gap-2 mr-2">
                <UserCog className="h-4 w-4 text-muted-foreground" />
                <Select 
                  value={effectiveRole || undefined}
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value} className="text-xs">
                        <div className="flex items-center gap-2">
                          {role.icon}
                          <span>{role.label}</span>
                          {role.sector && (
                            <Badge variant="outline" className="text-[10px] ml-1">
                              {role.sector}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {simulatedRole && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSimulatedRole(null)}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Reset
                  </Button>
                )}
              </div>
            )}
            
            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-3 mr-4">
              <div className="text-center px-3 py-1 rounded-lg bg-background/50">
                <div className="text-lg font-bold text-primary">{currentSuggestions.length}</div>
                <div className="text-[10px] text-muted-foreground">Sugerencias</div>
              </div>
              <div className="text-center px-3 py-1 rounded-lg bg-background/50">
                <div className="text-lg font-bold text-green-500">
                  {metrics?.suggestionsAccepted || 0}
                </div>
                <div className="text-[10px] text-muted-foreground">Aceptadas</div>
              </div>
              <div className="text-center px-3 py-1 rounded-lg bg-background/50">
                <div className="text-lg font-bold text-amber-500">
                  {metrics?.timeSavedMinutes || 0}m
                </div>
                <div className="text-[10px] text-muted-foreground">Ahorro</div>
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-6 mb-3 h-auto p-1">
            <TabsTrigger value="my-day" className="text-xs py-2 flex flex-col gap-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Mi Día</span>
            </TabsTrigger>
            <TabsTrigger value="coaching" className="text-xs py-2 flex flex-col gap-1">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Coaching</span>
            </TabsTrigger>
            <TabsTrigger value="sector-intel" className="text-xs py-2 flex flex-col gap-1">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Sector</span>
            </TabsTrigger>
            <TabsTrigger value="automations" className="text-xs py-2 flex flex-col gap-1">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Auto</span>
            </TabsTrigger>
            <TabsTrigger value="learning" className="text-xs py-2 flex flex-col gap-1">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Learning</span>
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="text-xs py-2 flex flex-col gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Collab</span>
            </TabsTrigger>
          </TabsList>

          <div className={cn("flex-1 overflow-hidden", isExpanded ? "h-[calc(100vh-200px)]" : "")}>
            <TabsContent value="my-day" className="mt-0 h-full">
              <CopilotMyDayView 
                myDayView={myDayView} 
                isLoading={isLoading} 
              />
            </TabsContent>

            <TabsContent value="coaching" className="mt-0 h-full">
              <CopilotCoachingPanel 
                metrics={metrics}
              />
            </TabsContent>

            <TabsContent value="sector-intel" className="mt-0 h-full">
              <CopilotSectorIntel 
                sector={copilotConfig?.sector}
                cnae={copilotConfig?.cnae}
              />
            </TabsContent>

            <TabsContent value="automations" className="mt-0 h-full">
              <CopilotAutomationsPanel 
                metrics={metrics}
              />
            </TabsContent>

            <TabsContent value="learning" className="mt-0 h-full">
              <CopilotLearningHub 
                config={copilotConfig}
              />
            </TabsContent>

            <TabsContent value="collaboration" className="mt-0 h-full">
              <CopilotCollaborationPanel 
                suggestions={collaborationSuggestions}
                onExecuteAction={(suggestion, actionId) => executeAction.mutate({ suggestion, actionId })}
              />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default RoleCopilotDashboard2026;
