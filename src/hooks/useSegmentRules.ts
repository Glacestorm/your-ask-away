import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SegmentCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in' | 'is_null' | 'is_not_null';
  value: any;
  dataType?: 'string' | 'number' | 'date' | 'boolean' | 'array';
}

export interface SegmentRule {
  id: string;
  name: string;
  description?: string;
  rule_type: 'static' | 'dynamic' | 'hybrid';
  conditions: SegmentCondition[];
  condition_logic: 'AND' | 'OR';
  refresh_frequency?: string;
  last_refreshed_at?: string;
  member_count: number;
  is_active: boolean;
  auto_enroll_journeys: string[];
  tags: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SegmentMember {
  id: string;
  segment_id: string;
  company_id: string;
  contact_id?: string;
  added_at: string;
  removed_at?: string;
  match_score?: number;
  is_active: boolean;
  metadata: Record<string, any>;
}

const SEGMENT_FIELD_OPTIONS = [
  { value: 'sector', label: 'Sector', dataType: 'string' },
  { value: 'parroquia', label: 'Parroquia', dataType: 'string' },
  { value: 'facturacion_anual', label: 'Facturación Anual', dataType: 'number' },
  { value: 'num_empleados', label: 'Número de Empleados', dataType: 'number' },
  { value: 'created_at', label: 'Fecha de Creación', dataType: 'date' },
  { value: 'last_visit_date', label: 'Última Visita', dataType: 'date' },
  { value: 'total_products', label: 'Total Productos', dataType: 'number' },
  { value: 'health_score', label: 'Health Score', dataType: 'number' },
  { value: 'churn_probability', label: 'Probabilidad Churn', dataType: 'number' },
  { value: 'rfm_score', label: 'RFM Score', dataType: 'number' },
  { value: 'segment', label: 'Segmento Actual', dataType: 'string' },
  { value: 'tier', label: 'Tier', dataType: 'string' },
];

export function useSegmentRules() {
  const queryClient = useQueryClient();

  const { data: segments = [], isLoading } = useQuery({
    queryKey: ['segment-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('segment_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as SegmentRule[];
    },
  });

  const createSegment = useMutation({
    mutationFn: async (segment: Omit<SegmentRule, 'id' | 'created_at' | 'updated_at' | 'member_count' | 'last_refreshed_at'>) => {
      const { data, error } = await supabase
        .from('segment_rules')
        .insert({
          name: segment.name,
          description: segment.description,
          rule_type: segment.rule_type,
          conditions: segment.conditions as unknown as any,
          condition_logic: segment.condition_logic,
          is_active: segment.is_active,
          auto_enroll_journeys: segment.auto_enroll_journeys,
          tags: segment.tags,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segment-rules'] });
      toast.success('Segmento creado');
    },
    onError: (error: any) => {
      toast.error('Error: ' + error.message);
    },
  });

  const updateSegment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SegmentRule> & { id: string }) => {
      const updateData: Record<string, any> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.rule_type !== undefined) updateData.rule_type = updates.rule_type;
      if (updates.conditions !== undefined) updateData.conditions = updates.conditions;
      if (updates.condition_logic !== undefined) updateData.condition_logic = updates.condition_logic;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.auto_enroll_journeys !== undefined) updateData.auto_enroll_journeys = updates.auto_enroll_journeys;
      if (updates.tags !== undefined) updateData.tags = updates.tags;

      const { data, error } = await supabase
        .from('segment_rules')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segment-rules'] });
      toast.success('Segmento actualizado');
    },
  });

  const deleteSegment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('segment_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segment-rules'] });
      toast.success('Segmento eliminado');
    },
  });

  const refreshSegment = useCallback(async (segmentId: string) => {
    try {
      // Get segment rules
      const { data: segment } = await supabase
        .from('segment_rules')
        .select('*')
        .eq('id', segmentId)
        .single();

      if (!segment) throw new Error('Segmento no encontrado');

      const conditions = segment.conditions as unknown as SegmentCondition[];
      
      // Simplified query - fetch all companies and filter
      const { data: allCompanies, error } = await supabase
        .from('companies')
        .select('id, sector, parroquia, facturacion_anual');
      
      if (error) throw error;

      // Filter companies based on conditions
      const matchingCompanies = (allCompanies || []).filter(company => {
        return conditions.every(condition => {
          const value = (company as any)[condition.field];
          switch (condition.operator) {
            case 'equals': return value === condition.value;
            case 'not_equals': return value !== condition.value;
            case 'greater_than': return value > condition.value;
            case 'less_than': return value < condition.value;
            case 'contains': return String(value || '').toLowerCase().includes(String(condition.value).toLowerCase());
            case 'is_null': return value === null || value === undefined;
            case 'is_not_null': return value !== null && value !== undefined;
            default: return true;
          }
        });
      });
      if (error) throw error;

      // Clear existing members
      await supabase
        .from('segment_members')
        .delete()
        .eq('segment_id', segmentId);

      // Add new members
      if (matchingCompanies && matchingCompanies.length > 0) {
        const members = matchingCompanies.map((company) => ({
          segment_id: segmentId,
          company_id: company.id,
          is_active: true,
          match_score: 100,
        }));

        await supabase.from('segment_members').insert(members);
      }

      // Update segment stats
      await supabase
        .from('segment_rules')
        .update({
          member_count: matchingCompanies?.length || 0,
          last_refreshed_at: new Date().toISOString(),
        })
        .eq('id', segmentId);

      queryClient.invalidateQueries({ queryKey: ['segment-rules'] });
      toast.success(`Segmento actualizado: ${matchingCompanies?.length || 0} miembros`);
      
      return matchingCompanies?.length || 0;
    } catch (error: any) {
      toast.error('Error al refrescar segmento: ' + error.message);
      throw error;
    }
  }, [queryClient]);

  return {
    segments,
    isLoading,
    createSegment: createSegment.mutate,
    updateSegment: updateSegment.mutate,
    deleteSegment: deleteSegment.mutate,
    refreshSegment,
    fieldOptions: SEGMENT_FIELD_OPTIONS,
    isCreating: createSegment.isPending,
  };
}

export function useSegmentMembers(segmentId: string | null) {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['segment-members', segmentId],
    queryFn: async () => {
      if (!segmentId) return [];
      
      const { data, error } = await supabase
        .from('segment_members')
        .select(`
          *,
          company:companies(id, name, sector, parroquia)
        `)
        .eq('segment_id', segmentId)
        .eq('is_active', true)
        .order('added_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as unknown as (SegmentMember & { company: any })[];
    },
    enabled: !!segmentId,
  });

  return { members, isLoading };
}
