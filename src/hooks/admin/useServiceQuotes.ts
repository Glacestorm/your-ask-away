/**
 * Hook for managing service quotes (presupuestos)
 * Handles CRUD operations, status management, and client approval workflow
 * 
 * KB 2.0 Pattern
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError } from '@/hooks/core/types';
import { createKBError, parseError, collectTelemetry } from '@/hooks/core/useKBBase';

// Re-export for backwards compat
export type QuotesError = KBError;

// === TYPES ===
export type ServiceType =
  | 'remote_support'
  | 'installation'
  | 'configuration'
  | 'training'
  | 'maintenance'
  | 'upgrade'
  | 'migration'
  | 'custom';

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export interface ServiceQuote {
  id: string;
  quote_number: string;
  installation_id: string;
  service_type: ServiceType;
  service_title: string;
  service_description?: string;
  estimated_duration_minutes: number;
  estimated_actions: unknown[];
  hourly_rate?: number;
  fixed_price?: number;
  discount_percentage: number;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_price: number;
  currency: string;
  terms_and_conditions?: string;
  valid_until: string;
  payment_terms?: string;
  status: QuoteStatus;
  sent_at?: string;
  viewed_at?: string;
  client_decision_at?: string;
  client_notes?: string;
  client_signature_data?: string;
  client_accepted_terms: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceQuoteItem {
  id: string;
  quote_id: string;
  item_order: number;
  item_type: 'service' | 'product' | 'license' | 'discount' | 'other';
  description: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_price: number;
  notes?: string;
  created_at: string;
}

export interface QuoteHistoryEntry {
  id: string;
  quote_id: string;
  previous_status?: string;
  new_status: string;
  changed_by?: string;
  change_reason?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface CreateQuoteParams {
  installationId: string;
  serviceType: ServiceType;
  serviceTitle: string;
  serviceDescription?: string;
  estimatedDurationMinutes: number;
  estimatedActions?: Array<{ action: string; estimatedMinutes: number; riskLevel?: string }>;
  hourlyRate?: number;
  fixedPrice?: number;
  discountPercentage?: number;
  taxRate?: number;
  validDays?: number;
  termsAndConditions?: string;
  paymentTerms?: string;
}

export function useServiceQuotes(installationId?: string) {
  const [quotes, setQuotes] = useState<ServiceQuote[]>([]);
  const [currentQuote, setCurrentQuote] = useState<ServiceQuote | null>(null);
  const [quoteItems, setQuoteItems] = useState<ServiceQuoteItem[]>([]);
  const [quoteHistory, setQuoteHistory] = useState<QuoteHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  // === KB 2.0 METHODS ===
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);
  
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setRetryCount(0);
  }, []);
  
  // Auto-refresh refs
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch quotes for an installation
  const fetchQuotes = useCallback(async (targetInstallationId?: string) => {
    const instId = targetInstallationId || installationId;
    if (!instId) return;

    setLoading(true);
    setError(null);
    setStatus('loading');
    const startTime = Date.now();
    
    try {
      const { data, error: fetchError } = await supabase
        .from('service_quotes')
        .select('*')
        .eq('installation_id', instId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setQuotes((data || []) as unknown as ServiceQuote[]);
      setStatus('success');
      setLastSuccess(new Date());
      setLastRefresh(new Date());
      setRetryCount(0);
      collectTelemetry('useServiceQuotes', 'fetchQuotes', 'success', Date.now() - startTime);
    } catch (err) {
      const parsedErr = parseError(err);
      const kbError = createKBError('FETCH_ERROR', parsedErr.message, { details: { installationId: instId } });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useServiceQuotes', 'fetchQuotes', 'error', Date.now() - startTime, kbError);
      console.error('Error fetching quotes:', err);
      toast.error('Error al cargar presupuestos');
    } finally {
      setLoading(false);
    }
  }, [installationId]);

  // Auto-refresh methods
  const startAutoRefresh = useCallback((targetInstallationId?: string, intervalMs = 60000) => {
    stopAutoRefresh();
    const instId = targetInstallationId || installationId;
    if (!instId) return;
    
    fetchQuotes(instId);
    autoRefreshInterval.current = setInterval(() => {
      fetchQuotes(instId);
    }, intervalMs);
  }, [fetchQuotes, installationId]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  // Fetch a specific quote with items and history
  const fetchQuote = useCallback(async (quoteId: string) => {
    setLoading(true);
    setError(null);
    setStatus('loading');
    const startTime = Date.now();
    
    try {
      // Fetch quote
      const { data: quoteData, error: quoteError } = await supabase
        .from('service_quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;
      setCurrentQuote(quoteData as unknown as ServiceQuote);

      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from('service_quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('item_order', { ascending: true });

      if (itemsError) throw itemsError;
      setQuoteItems(itemsData as ServiceQuoteItem[]);

      // Fetch history
      const { data: historyData, error: historyError } = await supabase
        .from('service_quote_history')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;
      setQuoteHistory((historyData || []) as unknown as QuoteHistoryEntry[]);

      setStatus('success');
      setLastSuccess(new Date());
      setLastRefresh(new Date());
      setRetryCount(0);
      collectTelemetry('useServiceQuotes', 'fetchQuote', 'success', Date.now() - startTime);
      return quoteData as ServiceQuote;
    } catch (err) {
      const parsedErr = parseError(err);
      const kbError = createKBError('FETCH_QUOTE_ERROR', parsedErr.message, { details: { quoteId } });
      setError(kbError);
      setStatus('error');
      setRetryCount(prev => prev + 1);
      collectTelemetry('useServiceQuotes', 'fetchQuote', 'error', Date.now() - startTime, kbError);
      console.error('Error fetching quote:', err);
      toast.error('Error al cargar presupuesto');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new quote
  const createQuote = useCallback(async (params: CreateQuoteParams): Promise<ServiceQuote | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuario no autenticado');

      // Calculate totals
      const subtotal = params.fixedPrice || (params.hourlyRate || 0) * (params.estimatedDurationMinutes / 60);
      const discountAmount = subtotal * ((params.discountPercentage || 0) / 100);
      const subtotalAfterDiscount = subtotal - discountAmount;
      const taxRate = params.taxRate ?? 21;
      const taxAmount = subtotalAfterDiscount * (taxRate / 100);
      const totalPrice = subtotalAfterDiscount + taxAmount;

      // Calculate valid_until
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + (params.validDays || 30));

      const insertData = {
        installation_id: params.installationId,
        service_type: params.serviceType,
        service_title: params.serviceTitle,
        service_description: params.serviceDescription,
        estimated_duration_minutes: params.estimatedDurationMinutes,
        estimated_actions: params.estimatedActions || [],
        hourly_rate: params.hourlyRate,
        fixed_price: params.fixedPrice,
        discount_percentage: params.discountPercentage || 0,
        subtotal: subtotalAfterDiscount,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_price: totalPrice,
        currency: 'EUR',
        valid_until: validUntil.toISOString(),
        terms_and_conditions: params.termsAndConditions,
        payment_terms: params.paymentTerms,
        status: 'draft',
        created_by: userData.user.id,
      };

      const { data, error: insertError } = await supabase
        .from('service_quotes')
        .insert(insertData as any)
        .select()
        .single();

      if (insertError) throw insertError;

      const newQuote = data as unknown as ServiceQuote;
      setQuotes(prev => [newQuote, ...prev]);
      toast.success('Presupuesto creado correctamente');
      return newQuote;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error creating quote:', err);
      setError(createKBError('CREATE_ERROR', message));
      toast.error('Error al crear presupuesto');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add item to quote
  const addQuoteItem = useCallback(async (
    quoteId: string,
    item: Omit<ServiceQuoteItem, 'id' | 'quote_id' | 'created_at'>
  ): Promise<ServiceQuoteItem | null> => {
    try {
      const totalPrice = item.quantity * item.unit_price * (1 - (item.discount_percentage || 0) / 100);

      const { data, error: insertError } = await supabase
        .from('service_quote_items')
        .insert({
          quote_id: quoteId,
          ...item,
          total_price: totalPrice,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newItem = data as ServiceQuoteItem;
      setQuoteItems(prev => [...prev, newItem]);

      // Recalculate quote totals
      await recalculateQuoteTotals(quoteId);

      return newItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error adding quote item:', err);
      setError(createKBError('ADD_ITEM_ERROR', message, { details: { quoteId } }));
      toast.error('Error al añadir línea');
      return null;
    }
  }, []);

  // Remove item from quote
  const removeQuoteItem = useCallback(async (itemId: string, quoteId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('service_quote_items')
        .delete()
        .eq('id', itemId);

      if (deleteError) throw deleteError;

      setQuoteItems(prev => prev.filter(i => i.id !== itemId));
      await recalculateQuoteTotals(quoteId);
      toast.success('Línea eliminada');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error removing quote item:', err);
      setError(createKBError('REMOVE_ITEM_ERROR', message, { details: { itemId, quoteId } }));
      toast.error('Error al eliminar línea');
    }
  }, []);

  // Recalculate quote totals based on items
  const recalculateQuoteTotals = useCallback(async (quoteId: string) => {
    try {
      const { data, error: rpcError } = await supabase.rpc('calculate_quote_totals', {
        p_quote_id: quoteId,
      });

      if (rpcError) throw rpcError;

      if (data && data[0]) {
        const { subtotal, tax_amount, total } = data[0];
        
        await supabase
          .from('service_quotes')
          .update({
            subtotal,
            tax_amount,
            total_price: total,
          })
          .eq('id', quoteId);

        // Update local state
        setCurrentQuote(prev => prev ? {
          ...prev,
          subtotal,
          tax_amount,
          total_price: total,
        } : null);
      }
    } catch (err) {
      console.error('Error recalculating totals:', err);
    }
  }, []);

  // Update quote status
  const updateQuoteStatus = useCallback(async (
    quoteId: string,
    newStatus: QuoteStatus,
    reason?: string
  ) => {
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      
      if (newStatus === 'sent') {
        updateData.sent_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('service_quotes')
        .update(updateData)
        .eq('id', quoteId);

      if (updateError) throw updateError;

      // Update local state
      setQuotes(prev => prev.map(q => 
        q.id === quoteId ? { ...q, status: newStatus, ...updateData } : q
      ));
      setCurrentQuote(prev => 
        prev?.id === quoteId ? { ...prev, status: newStatus, ...updateData } : prev
      );

      toast.success(`Estado actualizado a: ${getStatusLabel(newStatus)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error updating status:', err);
      setError(createKBError('UPDATE_STATUS_ERROR', message, { details: { quoteId, newStatus } }));
      toast.error('Error al actualizar estado');
    }
  }, []);

  // Send quote to client
  const sendQuote = useCallback(async (quoteId: string) => {
    return updateQuoteStatus(quoteId, 'sent');
  }, [updateQuoteStatus]);

  // Cancel quote
  const cancelQuote = useCallback(async (quoteId: string, reason?: string) => {
    return updateQuoteStatus(quoteId, 'cancelled', reason);
  }, [updateQuoteStatus]);

  // Get quote statistics
  const getQuoteStats = useCallback(() => {
    const stats = {
      total: quotes.length,
      draft: 0,
      sent: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
      cancelled: 0,
      totalValue: 0,
      acceptedValue: 0,
      conversionRate: 0,
    };

    quotes.forEach(q => {
      stats[q.status as keyof typeof stats]++;
      stats.totalValue += q.total_price;
      if (q.status === 'accepted') {
        stats.acceptedValue += q.total_price;
      }
    });

    const responded = stats.accepted + stats.rejected;
    stats.conversionRate = responded > 0 ? (stats.accepted / responded) * 100 : 0;

    return stats;
  }, [quotes]);

  return {
    // State
    quotes,
    currentQuote,
    quoteItems,
    quoteHistory,
    loading,
    error,
    lastRefresh,
    // Actions
    fetchQuotes,
    fetchQuote,
    createQuote,
    addQuoteItem,
    removeQuoteItem,
    updateQuoteStatus,
    sendQuote,
    cancelQuote,
    getQuoteStats,
    clearError,
    // Auto-refresh
    startAutoRefresh,
    stopAutoRefresh,
  };
}

// Helper to get status label in Spanish
function getStatusLabel(status: QuoteStatus): string {
  const labels: Record<QuoteStatus, string> = {
    draft: 'Borrador',
    sent: 'Enviado',
    viewed: 'Visto',
    accepted: 'Aceptado',
    rejected: 'Rechazado',
    expired: 'Expirado',
    cancelled: 'Cancelado',
  };
  return labels[status];
}

// Helper to get status color
export function getStatusColor(status: QuoteStatus): string {
  const colors: Record<QuoteStatus, string> = {
    draft: 'bg-muted text-muted-foreground',
    sent: 'bg-blue-500/20 text-blue-700',
    viewed: 'bg-purple-500/20 text-purple-700',
    accepted: 'bg-green-500/20 text-green-700',
    rejected: 'bg-red-500/20 text-red-700',
    expired: 'bg-orange-500/20 text-orange-700',
    cancelled: 'bg-gray-500/20 text-gray-700',
  };
  return colors[status];
}

// Helper to get service type label
export function getServiceTypeLabel(type: ServiceType): string {
  const labels: Record<ServiceType, string> = {
    remote_support: 'Soporte Remoto',
    installation: 'Instalación',
    configuration: 'Configuración',
    training: 'Formación',
    maintenance: 'Mantenimiento',
    upgrade: 'Actualización',
    migration: 'Migración',
    custom: 'Personalizado',
  };
  return labels[type];
}
