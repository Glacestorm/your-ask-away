import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from './core';

// === KB 2.0 ERROR TYPE ===
export type CustomerConsentsError = KBError;

export type ConsentType = 'marketing' | 'email' | 'sms' | 'whatsapp' | 'phone' | 'analytics';
export type ConsentStatus = 'granted' | 'denied' | 'pending' | 'withdrawn';

export interface CustomerConsent {
  id: string;
  company_id?: string;
  contact_id?: string;
  consent_type: ConsentType;
  status: ConsentStatus;
  granted_at?: string;
  expires_at?: string;
  withdrawn_at?: string;
  source?: string;
  ip_address?: string;
  user_agent?: string;
  legal_basis?: string;
  version: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ConsentSummary {
  marketing: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  phone: boolean;
  analytics: boolean;
}

export function useCustomerConsents(companyId: string | null) {
  const queryClient = useQueryClient();

  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastSuccess, setLastSuccess] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoadingState = status === 'loading';
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

  const { data: consents = [], isLoading, refetch } = useQuery({
    queryKey: ['customer-consents', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const startTime = Date.now();
      setStatus('loading');
      
      try {
        const { data, error: fetchError } = await supabase
          .from('customer_consents')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        
        setStatus('success');
        setLastRefresh(new Date());
        setLastSuccess(new Date());
        setRetryCount(0);
        collectTelemetry('useCustomerConsents', 'fetchConsents', 'success', Date.now() - startTime);
        
        return data as unknown as CustomerConsent[];
      } catch (err) {
        const kbError = createKBError('FETCH_CONSENTS_ERROR', parseError(err).message, { originalError: String(err) });
        setError(kbError);
        setStatus('error');
        setRetryCount(prev => prev + 1);
        collectTelemetry('useCustomerConsents', 'fetchConsents', 'error', Date.now() - startTime, kbError);
        throw err;
      }
    },
    enabled: !!companyId,
  });

  const consentSummary: ConsentSummary = {
    marketing: consents.some(c => c.consent_type === 'marketing' && c.status === 'granted'),
    email: consents.some(c => c.consent_type === 'email' && c.status === 'granted'),
    sms: consents.some(c => c.consent_type === 'sms' && c.status === 'granted'),
    whatsapp: consents.some(c => c.consent_type === 'whatsapp' && c.status === 'granted'),
    phone: consents.some(c => c.consent_type === 'phone' && c.status === 'granted'),
    analytics: consents.some(c => c.consent_type === 'analytics' && c.status === 'granted'),
  };

  const grantConsent = useMutation({
    mutationFn: async ({
      companyId,
      contactId,
      consentType,
      source = 'manual',
      legalBasis = 'consent',
      expiresAt,
    }: {
      companyId: string;
      contactId?: string;
      consentType: ConsentType;
      source?: string;
      legalBasis?: string;
      expiresAt?: string;
    }) => {
      const { data: existing } = await supabase
        .from('customer_consents')
        .select('id')
        .eq('company_id', companyId)
        .eq('consent_type', consentType)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('customer_consents')
          .update({
            status: 'granted',
            granted_at: new Date().toISOString(),
            withdrawn_at: null,
            source,
            legal_basis: legalBasis,
            expires_at: expiresAt,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('customer_consents')
        .insert({
          company_id: companyId,
          contact_id: contactId,
          consent_type: consentType,
          status: 'granted',
          granted_at: new Date().toISOString(),
          source,
          legal_basis: legalBasis,
          expires_at: expiresAt,
          version: '1.0',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-consents', companyId] });
      toast.success('Consentimiento otorgado');
    },
    onError: (err: any) => {
      toast.error('Error: ' + err.message);
    },
  });

  const withdrawConsent = useMutation({
    mutationFn: async ({
      consentId,
      reason,
    }: {
      consentId: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase
        .from('customer_consents')
        .update({
          status: 'withdrawn',
          withdrawn_at: new Date().toISOString(),
          metadata: { withdrawal_reason: reason },
        })
        .eq('id', consentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-consents', companyId] });
      toast.success('Consentimiento retirado');
    },
  });

  const bulkUpdateConsents = useMutation({
    mutationFn: async ({
      companyId,
      consents: consentUpdates,
      source = 'bulk_update',
    }: {
      companyId: string;
      consents: Partial<Record<ConsentType, boolean>>;
      source?: string;
    }) => {
      const updates = Object.entries(consentUpdates).map(([type, granted]) => ({
        companyId,
        consentType: type as ConsentType,
        status: granted ? 'granted' : 'withdrawn',
        source,
      }));

      for (const update of updates) {
        if (update.status === 'granted') {
          await grantConsent.mutateAsync({
            companyId: update.companyId,
            consentType: update.consentType,
            source: update.source,
          });
        } else {
          const existing = consents.find(
            c => c.consent_type === update.consentType && c.status === 'granted'
          );
          if (existing) {
            await withdrawConsent.mutateAsync({ consentId: existing.id });
          }
        }
      }
    },
    onSuccess: () => {
      toast.success('Preferencias actualizadas');
    },
  });

  const canContact = (channel: ConsentType): boolean => {
    const consent = consents.find(
      c => c.consent_type === channel && c.status === 'granted'
    );
    if (!consent) return false;
    if (consent.expires_at && new Date(consent.expires_at) < new Date()) return false;
    return true;
  };

  return {
    consents,
    consentSummary,
    isLoading: isLoading || isLoadingState,
    grantConsent: grantConsent.mutate,
    withdrawConsent: withdrawConsent.mutate,
    bulkUpdateConsents: bulkUpdateConsents.mutate,
    canContact,
    isUpdating: grantConsent.isPending || withdrawConsent.isPending,
    refetch,
    // === KB 2.0 RETURN ===
    status,
    isIdle,
    isSuccess,
    isError,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset,
  };
}
