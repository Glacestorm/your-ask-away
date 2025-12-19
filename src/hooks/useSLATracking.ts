import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SLAViolation, ViolationType } from '@/types/bpmn';
import { useToast } from '@/hooks/use-toast';

interface UseSLATrackingOptions {
  instanceId?: string;
  processDefinitionId?: string;
  unresolvedOnly?: boolean;
  violationType?: ViolationType;
}

export function useSLATracking(options: UseSLATrackingOptions = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { instanceId, processDefinitionId, unresolvedOnly = false, violationType } = options;

  // Fetch violations
  const violationsQuery = useQuery({
    queryKey: ['sla-violations', instanceId, processDefinitionId, unresolvedOnly, violationType],
    queryFn: async () => {
      let query = supabase
        .from('process_sla_violations')
        .select('*')
        .order('created_at', { ascending: false });

      if (instanceId) {
        query = query.eq('instance_id', instanceId);
      }
      if (processDefinitionId) {
        query = query.eq('process_definition_id', processDefinitionId);
      }
      if (unresolvedOnly) {
        query = query.is('resolved_at', null);
      }
      if (violationType) {
        query = query.eq('violation_type', violationType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SLAViolation[];
    },
  });

  // Create violation
  const createViolationMutation = useMutation({
    mutationFn: async (violation: Omit<SLAViolation, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('process_sla_violations')
        .insert({
          instance_id: violation.instance_id,
          process_definition_id: violation.process_definition_id,
          node_id: violation.node_id,
          node_name: violation.node_name,
          violation_type: violation.violation_type,
          expected_duration: violation.expected_duration,
          actual_duration: violation.actual_duration,
          exceeded_by: violation.exceeded_by,
          exceeded_percentage: violation.exceeded_percentage,
          escalated_to: violation.escalated_to,
          escalation_level: violation.escalation_level,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SLAViolation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-violations'] });
    },
  });

  // Acknowledge violation
  const acknowledgeMutation = useMutation({
    mutationFn: async (violationId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('process_sla_violations')
        .update({
          acknowledged_by: userData.user?.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', violationId)
        .select()
        .single();

      if (error) throw error;
      return data as SLAViolation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-violations'] });
      toast({
        title: 'Violación reconocida',
        description: 'Has reconocido la violación de SLA.',
      });
    },
  });

  // Resolve violation
  const resolveMutation = useMutation({
    mutationFn: async ({ violationId, notes }: { violationId: string; notes?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('process_sla_violations')
        .update({
          resolved_by: userData.user?.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes,
        })
        .eq('id', violationId)
        .select()
        .single();

      if (error) throw error;
      return data as SLAViolation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-violations'] });
      toast({
        title: 'Violación resuelta',
        description: 'La violación de SLA ha sido marcada como resuelta.',
      });
    },
  });

  // Escalate violation
  const escalateMutation = useMutation({
    mutationFn: async ({ violationId, escalateTo }: { violationId: string; escalateTo: string[] }) => {
      const violation = violationsQuery.data?.find(v => v.id === violationId);
      
      const { data, error } = await supabase
        .from('process_sla_violations')
        .update({
          escalated_to: escalateTo,
          escalation_level: (violation?.escalation_level || 1) + 1,
          notification_sent: true,
          notification_sent_at: new Date().toISOString(),
        })
        .eq('id', violationId)
        .select()
        .single();

      if (error) throw error;
      return data as SLAViolation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-violations'] });
      toast({
        title: 'Escalamiento enviado',
        description: 'La violación ha sido escalada a los responsables.',
      });
    },
  });

  // Get SLA compliance stats
  const complianceStatsQuery = useQuery({
    queryKey: ['sla-compliance-stats', processDefinitionId],
    queryFn: async () => {
      const { data: instances, error: instancesError } = await supabase
        .from('bpmn_process_instances')
        .select('sla_status')
        .eq(processDefinitionId ? 'process_definition_id' : 'id', processDefinitionId || '');

      if (instancesError && instancesError.code !== 'PGRST116') throw instancesError;

      const allInstances = instances || [];
      const total = allInstances.length;
      const onTrack = allInstances.filter(i => i.sla_status === 'on_track').length;
      const atRisk = allInstances.filter(i => i.sla_status === 'at_risk').length;
      const breached = allInstances.filter(i => i.sla_status === 'breached').length;

      return {
        total,
        onTrack,
        atRisk,
        breached,
        complianceRate: total > 0 ? ((onTrack / total) * 100) : 100,
        atRiskRate: total > 0 ? ((atRisk / total) * 100) : 0,
        breachRate: total > 0 ? ((breached / total) * 100) : 0,
      };
    },
    enabled: false,
  });

  // Subscribe to realtime SLA violations
  const subscribeToViolations = (callback: (violation: SLAViolation) => void) => {
    const channel = supabase
      .channel('sla-violations-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'process_sla_violations',
        },
        (payload) => {
          callback(payload.new as SLAViolation);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    // Data
    violations: violationsQuery.data || [],
    isLoading: violationsQuery.isLoading,
    error: violationsQuery.error,
    refetch: violationsQuery.refetch,

    // Actions
    createViolation: createViolationMutation.mutateAsync,
    acknowledgeViolation: acknowledgeMutation.mutateAsync,
    resolveViolation: resolveMutation.mutateAsync,
    escalateViolation: escalateMutation.mutateAsync,

    // Stats
    complianceStats: complianceStatsQuery.data,
    fetchComplianceStats: complianceStatsQuery.refetch,

    // States
    isAcknowledging: acknowledgeMutation.isPending,
    isResolving: resolveMutation.isPending,
    isEscalating: escalateMutation.isPending,

    // Realtime
    subscribeToViolations,
  };
}
