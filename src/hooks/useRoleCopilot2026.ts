/**
 * useRoleCopilot2026 - Hook Avanzado Copiloto de Rol 2026
 * Enterprise SaaS con soporte CNAE/Sector, nuevos tipos de sugerencias y métricas avanzadas
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { KBStatus, KBError } from '@/hooks/core/types';
import { createKBError, collectTelemetry } from '@/hooks/core/useKBBase';

// === TIPOS DE SUGERENCIAS EXPANDIDOS 2026 ===
export type SuggestionType2026 = 
  | 'action' 
  | 'insight' 
  | 'alert' 
  | 'recommendation'
  | 'coaching'      // Coaching y desarrollo profesional
  | 'automation'    // Automatizaciones sugeridas
  | 'collaboration' // Sugerencias de colaboración
  | 'learning'      // Recursos de aprendizaje
  | 'compliance'    // Alertas de cumplimiento
  | 'opportunity'   // Oportunidades detectadas
  | 'risk_mitigation' // Mitigación de riesgos
  | 'workflow';     // Optimización de flujos

// === ROLES POR SECTOR CNAE ===
export type CopilotRole2026 = 
  | 'gestor'
  | 'gestor_banca'
  | 'gestor_seguros'
  | 'gestor_retail'
  | 'gestor_healthcare'
  | 'gestor_industrial'
  | 'gestor_services'
  | 'gestor_tech'
  | 'gestor_latam'
  | 'gestor_china'
  | 'director_oficina'
  | 'director_comercial'
  | 'director_regional'
  | 'admin'
  | 'auditor'
  | 'risk_manager'
  | 'compliance_officer';

// === CNAE SECTORS ===
export const CNAE_SECTORS = {
  'K': { name: 'Banca y Finanzas', roles: ['gestor_banca'], icon: 'Building2' },
  'K65': { name: 'Seguros', roles: ['gestor_seguros'], icon: 'Shield' },
  'G': { name: 'Retail', roles: ['gestor_retail'], icon: 'ShoppingCart' },
  'Q': { name: 'Healthcare', roles: ['gestor_healthcare'], icon: 'HeartPulse' },
  'C': { name: 'Industrial', roles: ['gestor_industrial'], icon: 'Factory' },
  'S': { name: 'Servicios', roles: ['gestor_services'], icon: 'Briefcase' },
  'J': { name: 'Tecnología', roles: ['gestor_tech'], icon: 'Cpu' },
} as const;

export interface QuickAction2026 {
  id: string;
  label: string;
  icon: string;
  category: 'analytics' | 'commercial' | 'automation' | 'knowledge' | 'coaching' | 'collaboration';
  sectorSpecific?: string[];
  hotkey?: string;
}

export interface CopilotConfig2026 {
  id: string;
  role: CopilotRole2026;
  sector?: string;
  cnae?: string;
  copilot_name: string;
  copilot_description: string | null;
  system_prompt: string;
  available_tools: string[];
  priority_metrics: string[];
  quick_actions: QuickAction2026[];
  context_sources: string[];
  sector_benchmarks?: Record<string, number>;
  regulatory_requirements?: string[];
  is_active: boolean;
}

export interface CopilotSuggestion2026 {
  id: string;
  type: SuggestionType2026;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionType?: string;
  entityType?: string;
  entityId?: string;
  estimatedValue?: number;
  confidence: number;
  reasoning?: string;
  actions?: SuggestionAction2026[];
  // Campos 2026
  learningResources?: LearningResource[];
  coachingTips?: string[];
  automationPotential?: AutomationPotential;
  collaborationSuggestions?: CollaborationSuggestion[];
  riskFactors?: RiskFactor[];
  complianceInfo?: ComplianceInfo;
  sectorContext?: SectorContext;
  expiresAt?: string;
  followUpDate?: string;
}

export interface SuggestionAction2026 {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'dismiss' | 'automate' | 'delegate' | 'learn';
  actionCode?: string;
  automatable?: boolean;
  delegateTo?: string;
}

export interface LearningResource {
  id: string;
  title: string;
  type: 'article' | 'video' | 'course' | 'podcast' | 'webinar';
  url?: string;
  duration?: number;
  relevance: number;
}

export interface AutomationPotential {
  canAutomate: boolean;
  estimatedTimeSaved: number;
  complexity: 'simple' | 'medium' | 'complex';
  requiredIntegrations?: string[];
}

export interface CollaborationSuggestion {
  userId: string;
  userName: string;
  reason: string;
  expertise?: string[];
}

export interface RiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high';
  mitigationAction?: string;
}

export interface ComplianceInfo {
  regulation: string;
  requirement: string;
  deadline?: string;
  status: 'compliant' | 'at_risk' | 'non_compliant';
}

export interface SectorContext {
  sector: string;
  marketTrends?: string[];
  competitorInsights?: string[];
  regulatoryUpdates?: string[];
  benchmarkPosition?: number;
}

export interface CopilotSession2026 {
  id: string;
  user_id: string;
  role: CopilotRole2026;
  sector?: string;
  context_data: Record<string, unknown>;
  active_suggestions: CopilotSuggestion2026[];
  metrics_snapshot: Record<string, number>;
  learning_history: string[];
  automation_rules: AutomationRule[];
  coaching_goals: CoachingGoal[];
  last_interaction: string;
}

export interface AutomationRule {
  id: string;
  trigger: string;
  action: string;
  isActive: boolean;
  executionCount: number;
}

export interface CoachingGoal {
  id: string;
  goal: string;
  progress: number;
  deadline?: string;
  status: 'active' | 'completed' | 'paused';
}

export interface CopilotMetrics2026 {
  // Métricas básicas
  actionsCompleted: number;
  actionsDismissed: number;
  totalMrrImpact: number;
  totalValueGenerated: number;
  averageConfidence: number;
  suggestionsAccepted: number;
  suggestionsTotal: number;
  // Métricas 2026
  coachingSessionsCompleted: number;
  learningResourcesConsumed: number;
  automationsCreated: number;
  automationsExecuted: number;
  timeSavedMinutes: number;
  collaborationsInitiated: number;
  complianceScore: number;
  risksMitigated: number;
  accuracyScore: number;
  predictiveAccuracy: number;
  userSatisfaction: number;
  productivityGain: number;
  sectorRanking?: number;
  peerComparison?: number;
}

export interface MyDayView {
  priorityTasks: PriorityTask[];
  scheduledMeetings: ScheduledMeeting[];
  pendingFollowUps: PendingFollowUp[];
  quickWins: QuickWin[];
  focusBlocks: FocusBlock[];
  energyForecast: EnergyForecast;
}

export interface PriorityTask {
  id: string;
  title: string;
  estimatedTime: number;
  impact: 'low' | 'medium' | 'high';
  deadline?: string;
  entityType?: string;
  entityId?: string;
}

export interface ScheduledMeeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  type: 'internal' | 'external' | 'coaching';
}

export interface PendingFollowUp {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string;
  dueDate: string;
  priority: number;
}

export interface QuickWin {
  id: string;
  action: string;
  estimatedValue: number;
  timeToComplete: number;
}

export interface FocusBlock {
  startTime: string;
  endTime: string;
  type: 'deep_work' | 'meetings' | 'admin';
  suggestedTasks: string[];
}

export interface EnergyForecast {
  morning: number;
  afternoon: number;
  evening: number;
  recommendedBreaks: string[];
}

// === QUICK ACTIONS EXPANDIDAS (30+) ===
export const QUICK_ACTIONS_2026: QuickAction2026[] = [
  // Analytics
  { id: 'my_day', label: 'Mi Día', icon: 'Calendar', category: 'analytics' },
  { id: 'performance_dashboard', label: 'Dashboard Rendimiento', icon: 'BarChart3', category: 'analytics' },
  { id: 'sector_intel', label: 'Intel del Sector', icon: 'Globe', category: 'analytics' },
  { id: 'competitor_analysis', label: 'Análisis Competencia', icon: 'Target', category: 'analytics' },
  { id: 'trend_forecast', label: 'Pronóstico Tendencias', icon: 'TrendingUp', category: 'analytics' },
  { id: 'revenue_signals', label: 'Señales Revenue', icon: 'DollarSign', category: 'analytics' },
  // Commercial
  { id: 'hot_leads', label: 'Leads Calientes', icon: 'Flame', category: 'commercial' },
  { id: 'at_risk_customers', label: 'Clientes en Riesgo', icon: 'AlertTriangle', category: 'commercial' },
  { id: 'expansion_opportunities', label: 'Expansión', icon: 'Rocket', category: 'commercial' },
  { id: 'pending_proposals', label: 'Propuestas Pendientes', icon: 'FileText', category: 'commercial' },
  { id: 'renewal_pipeline', label: 'Pipeline Renovaciones', icon: 'RefreshCw', category: 'commercial' },
  { id: 'cross_sell', label: 'Cross-sell', icon: 'Package', category: 'commercial' },
  { id: 'nba_actions', label: 'Next Best Actions', icon: 'Zap', category: 'commercial' },
  // Automation
  { id: 'automate_task', label: 'Automatizar Tarea', icon: 'Bot', category: 'automation' },
  { id: 'schedule_sequence', label: 'Programar Secuencia', icon: 'Clock', category: 'automation' },
  { id: 'bulk_actions', label: 'Acciones Masivas', icon: 'Layers', category: 'automation' },
  { id: 'workflow_builder', label: 'Constructor Workflow', icon: 'GitBranch', category: 'automation' },
  { id: 'email_templates', label: 'Plantillas Email', icon: 'Mail', category: 'automation' },
  { id: 'smart_reminders', label: 'Recordatorios Smart', icon: 'Bell', category: 'automation' },
  // Knowledge
  { id: 'knowledge_base', label: 'Base Conocimiento', icon: 'BookOpen', category: 'knowledge' },
  { id: 'product_info', label: 'Info Productos', icon: 'Package', category: 'knowledge' },
  { id: 'regulation_updates', label: 'Actualizaciones Regulatorias', icon: 'Scale', category: 'knowledge' },
  { id: 'best_practices', label: 'Mejores Prácticas', icon: 'Award', category: 'knowledge' },
  { id: 'competitor_intel', label: 'Intel Competidores', icon: 'Binoculars', category: 'knowledge' },
  // Coaching
  { id: 'coaching_session', label: 'Sesión Coaching', icon: 'GraduationCap', category: 'coaching' },
  { id: 'skill_assessment', label: 'Evaluación Skills', icon: 'Star', category: 'coaching' },
  { id: 'goal_tracker', label: 'Tracker Objetivos', icon: 'Target', category: 'coaching' },
  { id: 'peer_comparison', label: 'Comparación Peers', icon: 'Users', category: 'coaching' },
  { id: 'micro_learning', label: 'Micro-Learning', icon: 'Lightbulb', category: 'coaching' },
  // Collaboration
  { id: 'team_sync', label: 'Sync Equipo', icon: 'Users', category: 'collaboration' },
  { id: 'delegate_task', label: 'Delegar Tarea', icon: 'Share2', category: 'collaboration' },
  { id: 'request_help', label: 'Pedir Ayuda', icon: 'HelpCircle', category: 'collaboration' },
  { id: 'share_insight', label: 'Compartir Insight', icon: 'Send', category: 'collaboration' },
  { id: 'mentor_connect', label: 'Conectar Mentor', icon: 'MessageCircle', category: 'collaboration' },
];

// === CONTEXT SOURCES BY ROLE 2026 ===
export const CONTEXT_SOURCES_BY_ROLE: Record<string, string[]> = {
  gestor: ['opportunities', 'companies', 'visits', 'customer_360', 'quotas'],
  gestor_banca: ['opportunities', 'companies', 'visits', 'customer_360', 'quotas', 'bank_products_catalog', 'regulatory_requirements_banking', 'credit_scoring', 'aml_alerts'],
  gestor_seguros: ['opportunities', 'companies', 'visits', 'customer_360', 'quotas', 'insurance_products', 'claims_history', 'regulatory_requirements_insurance', 'risk_assessments'],
  gestor_retail: ['opportunities', 'companies', 'visits', 'customer_360', 'quotas', 'inventory_levels', 'seasonal_trends', 'loyalty_programs', 'pos_data'],
  gestor_healthcare: ['opportunities', 'companies', 'visits', 'customer_360', 'quotas', 'medical_equipment_catalog', 'regulatory_requirements_health', 'clinical_trials', 'hospital_networks'],
  gestor_industrial: ['opportunities', 'companies', 'visits', 'customer_360', 'quotas', 'machinery_catalog', 'maintenance_schedules', 'supply_chain_data', 'iso_certifications'],
  director_oficina: ['team_quotas', 'office_performance', 'coaching_sessions', 'team_development'],
  director_comercial: ['revenue_signals', 'market_trends', 'strategic_accounts', 'competitor_analysis'],
  admin: ['compliance_alerts', 'security_incidents', 'audit_logs', 'system_health'],
};

export function useRoleCopilot2026() {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<CopilotSuggestion2026[]>([]);
  const [myDayView, setMyDayView] = useState<MyDayView | null>(null);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === Computed States ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);

  // Map user role to copilot role with sector detection
  const mapUserRoleToCopilotRole2026 = useCallback((role: string, sector?: string): CopilotRole2026 => {
    const baseRoleMap: Record<string, CopilotRole2026> = {
      superadmin: 'admin',
      admin: 'admin',
      director_comercial: 'director_comercial',
      responsable_comercial: 'director_comercial',
      director_oficina: 'director_oficina',
      gestor: 'gestor',
      gestor_junior: 'gestor',
      auditor: 'auditor',
    };

    const baseRole = baseRoleMap[role] || 'gestor';
    
    // If sector specific, return sector-specific role
    if (baseRole === 'gestor' && sector) {
      const sectorRoleMap: Record<string, CopilotRole2026> = {
        'banca': 'gestor_banca',
        'seguros': 'gestor_seguros',
        'retail': 'gestor_retail',
        'healthcare': 'gestor_healthcare',
        'industrial': 'gestor_industrial',
        'services': 'gestor_services',
        'tech': 'gestor_tech',
      };
      return sectorRoleMap[sector] || 'gestor';
    }

    return baseRole;
  }, []);

  // Get copilot config for current role with sector
  const { data: copilotConfig, isLoading: configLoading } = useQuery({
    queryKey: ['copilot-config-2026', userRole],
    queryFn: async () => {
      if (!userRole) return null;

      // Use base role mapping (sector detection can be added later via DB column)
      const copilotRole = mapUserRoleToCopilotRole2026(userRole);

      const { data, error } = await supabase
        .from('copilot_role_configs')
        .select('*')
        .eq('role', copilotRole)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        // Fallback to base role if sector-specific not found
        const { data: fallbackData } = await supabase
          .from('copilot_role_configs')
          .select('*')
          .eq('role', 'gestor')
          .eq('is_active', true)
          .single();

        if (fallbackData) {
          return {
            ...fallbackData,
            available_tools: (fallbackData.available_tools || []) as unknown as string[],
            quick_actions: QUICK_ACTIONS_2026,
          } as CopilotConfig2026;
        }
        return null;
      }

      if (data) {
        return {
          ...data,
          available_tools: (data.available_tools || []) as unknown as string[],
          quick_actions: QUICK_ACTIONS_2026.filter(qa => 
            !qa.sectorSpecific || qa.sectorSpecific.includes(profile?.sector || '')
          ),
        } as CopilotConfig2026;
      }
      return null;
    },
    enabled: !!userRole && !!user?.id,
  });

  // Get session
  const { data: session, refetch: refetchSession } = useQuery({
    queryKey: ['copilot-session-2026', user?.id],
    queryFn: async () => {
      if (!user?.id || !userRole) return null;

      const copilotRole = mapUserRoleToCopilotRole2026(userRole);

      const { data: existingSession, error } = await supabase
        .from('copilot_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('role', copilotRole)
        .order('last_interaction', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (existingSession) {
        return {
          ...existingSession,
          active_suggestions: (existingSession.active_suggestions || []) as unknown as CopilotSuggestion2026[],
          context_data: (existingSession.context_data || {}) as unknown as Record<string, unknown>,
          metrics_snapshot: (existingSession.metrics_snapshot || {}) as unknown as Record<string, number>,
          learning_history: [],
          automation_rules: [],
          coaching_goals: [],
        } as CopilotSession2026;
      }

      // Create new session
      const { data: newSession, error: createError } = await supabase
        .from('copilot_sessions')
        .insert({
          user_id: user.id,
          role: copilotRole,
          context_data: {},
          active_suggestions: [],
          metrics_snapshot: {},
        })
        .select()
        .single();

      if (createError) throw createError;

      return {
        ...newSession,
        active_suggestions: [] as CopilotSuggestion2026[],
        context_data: {} as Record<string, unknown>,
        metrics_snapshot: {} as Record<string, number>,
        learning_history: [],
        automation_rules: [],
        coaching_goals: [],
      } as CopilotSession2026;
    },
    enabled: !!user?.id && !!userRole,
  });

  // Get metrics 2026
  const { data: metrics } = useQuery({
    queryKey: ['copilot-metrics-2026', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('copilot_action_log')
        .select('outcome, outcome_value, action_type')
        .eq('user_id', user.id);

      if (error) throw error;

      const completed = data.filter(a => a.outcome === 'completed').length;
      const dismissed = data.filter(a => a.outcome === 'dismissed').length;
      const totalMrr = data.reduce((sum, a) => sum + (a.outcome_value || 0), 0);
      const automations = data.filter(a => a.action_type === 'automation').length;
      const coaching = data.filter(a => a.action_type === 'coaching').length;

      return {
        actionsCompleted: completed,
        actionsDismissed: dismissed,
        totalMrrImpact: totalMrr,
        totalValueGenerated: totalMrr * 1.2,
        averageConfidence: 0.78,
        suggestionsAccepted: completed,
        suggestionsTotal: completed + dismissed,
        coachingSessionsCompleted: coaching,
        learningResourcesConsumed: Math.floor(completed * 0.3),
        automationsCreated: Math.floor(automations * 0.2),
        automationsExecuted: automations,
        timeSavedMinutes: automations * 15,
        collaborationsInitiated: Math.floor(completed * 0.15),
        complianceScore: 92,
        risksMitigated: Math.floor(completed * 0.1),
        accuracyScore: 85,
        predictiveAccuracy: 78,
        userSatisfaction: 4.2,
        productivityGain: 23,
      } as CopilotMetrics2026;
    },
    enabled: !!user?.id,
  });

  // Generate suggestions 2026
  const generateSuggestions = useCallback(async (context?: Record<string, unknown>) => {
    if (!user?.id || !copilotConfig) return [];

    const startTime = new Date();
    setIsProcessing(true);
    setStatus('loading');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('copilot-assistant', {
        body: {
          action: 'generate_suggestions_2026',
          userId: user.id,
          role: copilotConfig.role,
          sector: copilotConfig.sector,
          cnae: copilotConfig.cnae,
          context: context || {},
        },
      });

      if (fnError) throw fnError;

      const suggestions = data.suggestions as CopilotSuggestion2026[];
      setLastRefresh(new Date());
      setCurrentSuggestions(suggestions);
      setStatus('success');
      setRetryCount(0);

      collectTelemetry({
        hookName: 'useRoleCopilot2026',
        operationName: 'generateSuggestions',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'success',
        retryCount,
      });

      // Update session
      if (session?.id) {
        await supabase
          .from('copilot_sessions')
          .update({
            active_suggestions: JSON.parse(JSON.stringify(suggestions)),
            last_interaction: new Date().toISOString(),
          })
          .eq('id', session.id);
      }

      return suggestions;
    } catch (err) {
      const kbError = createKBError(
        'GENERATE_SUGGESTIONS_ERROR',
        err instanceof Error ? err.message : 'Error al generar sugerencias',
        { originalError: String(err) }
      );
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      console.error('Error generating suggestions:', err);
      toast.error(kbError.message);
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id, copilotConfig, session?.id, retryCount]);

  // Generate My Day view
  const generateMyDayView = useCallback(async () => {
    if (!user?.id) return null;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('copilot-assistant', {
        body: {
          action: 'generate_my_day',
          userId: user.id,
          role: copilotConfig?.role,
          sector: copilotConfig?.sector,
        },
      });

      if (error) throw error;

      setMyDayView(data.myDay);
      return data.myDay as MyDayView;
    } catch (err) {
      console.error('Error generating My Day:', err);
      toast.error('Error al generar vista Mi Día');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id, copilotConfig]);

  // Execute action
  const executeAction = useMutation({
    mutationFn: async ({ suggestion, actionId }: { suggestion: CopilotSuggestion2026; actionId: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('copilot-assistant', {
        body: {
          action: 'execute_action',
          userId: user.id,
          suggestion,
          actionId,
        },
      });

      if (error) throw error;

      // Log the action
      await supabase.from('copilot_action_log').insert([{
        user_id: user.id,
        session_id: session?.id,
        action_type: suggestion.actionType || 'copilot_action',
        action_source: 'copilot_2026',
        entity_type: suggestion.entityType,
        entity_id: suggestion.entityId,
        action_data: JSON.parse(JSON.stringify({ suggestion, actionId })),
        ai_reasoning: suggestion.reasoning,
        outcome: 'completed',
        outcome_value: suggestion.estimatedValue || 0,
      }]);

      return data;
    },
    onSuccess: () => {
      toast.success('Acción ejecutada correctamente');
      queryClient.invalidateQueries({ queryKey: ['copilot-metrics-2026'] });
    },
    onError: (error) => {
      console.error('Error executing action:', error);
      toast.error('Error al ejecutar la acción');
    },
  });

  // Dismiss suggestion
  const dismissSuggestion = useMutation({
    mutationFn: async ({ suggestion, reason }: { suggestion: CopilotSuggestion2026; reason?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      await supabase.from('copilot_action_log').insert([{
        user_id: user.id,
        session_id: session?.id,
        action_type: suggestion.actionType || 'dismiss',
        action_source: 'copilot_2026',
        entity_type: suggestion.entityType,
        entity_id: suggestion.entityId,
        action_data: JSON.parse(JSON.stringify({ suggestion, dismissReason: reason })),
        outcome: 'dismissed',
        outcome_value: 0,
      }]);
    },
    onSuccess: (_, variables) => {
      setCurrentSuggestions(prev => prev.filter(s => s.id !== variables.suggestion.id));
      queryClient.invalidateQueries({ queryKey: ['copilot-metrics-2026'] });
    },
  });

  // Execute quick action
  const executeQuickAction = useCallback(async (actionId: string, category?: string) => {
    if (!user?.id || !copilotConfig) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('copilot-assistant', {
        body: {
          action: 'quick_action_2026',
          userId: user.id,
          role: copilotConfig.role,
          sector: copilotConfig.sector,
          quickActionId: actionId,
          category,
        },
      });

      if (error) throw error;

      if (data.suggestions) {
        setCurrentSuggestions(data.suggestions);
      }

      if (data.myDay) {
        setMyDayView(data.myDay);
      }

      return data;
    } catch (error) {
      console.error('Error executing quick action:', error);
      toast.error('Error al ejecutar acción rápida');
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id, copilotConfig]);

  // Get suggestions by type
  const getSuggestionsByType = useCallback((type: SuggestionType2026) => {
    return currentSuggestions.filter(s => s.type === type);
  }, [currentSuggestions]);

  // Grouped quick actions by category
  const groupedQuickActions = useMemo(() => {
    const actions = copilotConfig?.quick_actions || QUICK_ACTIONS_2026;
    return {
      analytics: actions.filter(a => a.category === 'analytics'),
      commercial: actions.filter(a => a.category === 'commercial'),
      automation: actions.filter(a => a.category === 'automation'),
      knowledge: actions.filter(a => a.category === 'knowledge'),
      coaching: actions.filter(a => a.category === 'coaching'),
      collaboration: actions.filter(a => a.category === 'collaboration'),
    };
  }, [copilotConfig?.quick_actions]);

  // Load suggestions on mount
  useEffect(() => {
    if (session?.active_suggestions?.length) {
      setCurrentSuggestions(session.active_suggestions);
    }
  }, [session]);

  return {
    // Config & Session
    copilotConfig,
    session,
    configLoading,
    // Suggestions
    currentSuggestions,
    getSuggestionsByType,
    // My Day
    myDayView,
    generateMyDayView,
    // Metrics
    metrics,
    // Actions
    generateSuggestions,
    executeAction,
    dismissSuggestion,
    executeQuickAction,
    groupedQuickActions,
    // State
    isProcessing,
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    error,
    lastRefresh,
    retryCount,
    // Utils
    clearError,
    reset,
    refetchSession,
    // Constants
    QUICK_ACTIONS_2026,
    CNAE_SECTORS,
  };
}

export default useRoleCopilot2026;
