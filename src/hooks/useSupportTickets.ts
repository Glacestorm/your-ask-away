import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SupportTicket {
  id: string;
  ticket_number: string;
  company_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  created_by: string | null;
  assigned_to: string | null;
  category: 'technical' | 'billing' | 'product' | 'complaint' | 'feature_request' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'waiting_internal' | 'resolved' | 'closed';
  subject: string;
  description: string | null;
  source: 'portal' | 'email' | 'phone' | 'chat' | 'internal';
  sla_policy_id: string | null;
  sla_response_due: string | null;
  sla_resolution_due: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  satisfaction_rating: number | null;
  satisfaction_feedback: string | null;
  health_impact: number;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  company?: { id: string; name: string };
  assignee?: { id: string; full_name: string };
}

export interface TicketResponse {
  id: string;
  ticket_id: string;
  author_id: string | null;
  author_type: 'agent' | 'customer' | 'system' | 'ai';
  content: string;
  is_internal: boolean;
  attachments: any[];
  ai_suggested: boolean;
  created_at: string;
  author?: { id: string; full_name: string };
}

export interface SLAPolicy {
  id: string;
  name: string;
  description: string | null;
  priority: string;
  first_response_hours: number;
  resolution_hours: number;
  business_hours_only: boolean;
  escalation_enabled: boolean;
  escalation_hours: number;
  is_default: boolean;
  is_active: boolean;
}

export interface TicketFilters {
  status?: string[];
  priority?: string[];
  category?: string[];
  assignedTo?: string;
  companyId?: string;
}

export function useSupportTickets(filters?: TicketFilters) {
  const queryClient = useQueryClient();

  // Fetch tickets
  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ['support-tickets', filters],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters?.priority?.length) {
        query = query.in('priority', filters.priority);
      }
      if (filters?.category?.length) {
        query = query.in('category', filters.category);
      }
      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }
      if (filters?.companyId) {
        query = query.eq('company_id', filters.companyId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data as unknown as SupportTicket[];
    }
  });

  // Fetch SLA policies
  const { data: slaPolicies = [] } = useQuery({
    queryKey: ['sla-policies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sla_policies')
        .select('*')
        .eq('is_active', true)
        .order('priority');
      
      if (error) throw error;
      return data as SLAPolicy[];
    }
  });

  // Fetch ticket responses
  const fetchTicketResponses = async (ticketId: string): Promise<TicketResponse[]> => {
    const { data, error } = await supabase
      .from('ticket_responses')
      .select(`
        *,
        profiles:author_id (id, full_name)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data.map(r => ({
      ...r,
      author: r.profiles
    })) as TicketResponse[];
  };

  // Create ticket
  const createTicketMutation = useMutation({
    mutationFn: async (ticket: Partial<SupportTicket>) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Get SLA policy based on priority
      const slaPolicy = slaPolicies.find(p => p.priority === ticket.priority) 
        || slaPolicies.find(p => p.is_default);

      const now = new Date();
      const slaResponseDue = slaPolicy 
        ? new Date(now.getTime() + slaPolicy.first_response_hours * 60 * 60 * 1000)
        : null;
      const slaResolutionDue = slaPolicy
        ? new Date(now.getTime() + slaPolicy.resolution_hours * 60 * 60 * 1000)
        : null;

      const insertData = {
        subject: ticket.subject || '',
        category: ticket.category || 'other',
        priority: ticket.priority,
        description: ticket.description,
        company_id: ticket.company_id,
        contact_name: ticket.contact_name,
        contact_email: ticket.contact_email,
        created_by: user?.id,
        sla_policy_id: slaPolicy?.id,
        sla_response_due: slaResponseDue?.toISOString(),
        sla_resolution_due: slaResolutionDue?.toISOString()
      };

      const { data, error } = await supabase
        .from('support_tickets')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket creado correctamente');
    },
    onError: (error) => {
      toast.error(`Error al crear ticket: ${error.message}`);
    }
  });

  // Update ticket
  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SupportTicket> & { id: string }) => {
      const updateData: any = { ...updates };
      
      // Handle status changes
      if (updates.status === 'resolved' && !updates.resolved_at) {
        updateData.resolved_at = new Date().toISOString();
      }
      if (updates.status === 'closed' && !updates.closed_at) {
        updateData.closed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket actualizado');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  // Add response
  const addResponseMutation = useMutation({
    mutationFn: async ({ 
      ticketId, 
      content, 
      isInternal = false,
      aiSuggested = false
    }: { 
      ticketId: string; 
      content: string; 
      isInternal?: boolean;
      aiSuggested?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('ticket_responses')
        .insert({
          ticket_id: ticketId,
          author_id: user?.id,
          author_type: 'agent',
          content,
          is_internal: isInternal,
          ai_suggested: aiSuggested
        })
        .select()
        .single();

      if (error) throw error;

      // Update first response time if this is the first response
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('first_response_at')
        .eq('id', ticketId)
        .single();

      if (ticket && !ticket.first_response_at && !isInternal) {
        await supabase
          .from('support_tickets')
          .update({ first_response_at: new Date().toISOString() })
          .eq('id', ticketId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Respuesta añadida');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  // Assign ticket
  const assignTicketMutation = useMutation({
    mutationFn: async ({ ticketId, userId }: { ticketId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({ assigned_to: userId, status: 'in_progress' })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket asignado');
    }
  });

  // Get ticket stats
  const { data: ticketStats } = useQuery({
    queryKey: ['ticket-stats'],
    queryFn: async () => {
      const now = new Date();
      
      const { data: allTickets } = await supabase
        .from('support_tickets')
        .select('status, priority, sla_response_due, sla_resolution_due, first_response_at, resolved_at');

      if (!allTickets) return null;

      const open = allTickets.filter(t => t.status === 'open').length;
      const inProgress = allTickets.filter(t => t.status === 'in_progress').length;
      const resolved = allTickets.filter(t => t.status === 'resolved').length;
      
      const slaBreaches = allTickets.filter(t => {
        if (t.status === 'closed' || t.status === 'resolved') return false;
        const responseDue = t.sla_response_due ? new Date(t.sla_response_due) : null;
        const resolutionDue = t.sla_resolution_due ? new Date(t.sla_resolution_due) : null;
        
        if (responseDue && !t.first_response_at && now > responseDue) return true;
        if (resolutionDue && !t.resolved_at && now > resolutionDue) return true;
        return false;
      }).length;

      const urgent = allTickets.filter(t => t.priority === 'urgent' && !['resolved', 'closed'].includes(t.status)).length;

      return { open, inProgress, resolved, slaBreaches, urgent, total: allTickets.length };
    }
  });

  return {
    tickets,
    slaPolicies,
    ticketStats,
    isLoading,
    refetch,
    fetchTicketResponses,
    createTicket: createTicketMutation.mutateAsync,
    updateTicket: updateTicketMutation.mutateAsync,
    addResponse: addResponseMutation.mutateAsync,
    assignTicket: assignTicketMutation.mutateAsync,
    isCreating: createTicketMutation.isPending,
    isUpdating: updateTicketMutation.isPending
  };
}

export default useSupportTickets;
