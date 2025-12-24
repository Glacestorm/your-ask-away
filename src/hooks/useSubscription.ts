import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// === ERROR TIPADO KB ===
export interface SubscriptionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type SubscriptionTier = 'core' | 'automation' | 'industry' | null;

interface SubscriptionState {
  subscribed: boolean;
  tier: SubscriptionTier;
  productId: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
}

// Tier configuration with Stripe IDs
export const SUBSCRIPTION_TIERS = {
  core: {
    name: 'Core',
    price_id: 'price_1SgGbv4BQ21V0AcNsCQtyHIW',
    product_id: 'prod_TdXhOLUpMcefUE',
    price: 49,
    description: 'CRM/ERP base + reporting',
    features: [
      'Dashboard básico',
      'Gestión de clientes',
      'Reportes mensuales',
      'Soporte por email',
      'Hasta 5 usuarios',
      '1 empresa',
    ],
  },
  automation: {
    name: 'Automation',
    price_id: 'price_1SgGc84BQ21V0AcNt1vodklJ',
    product_id: 'prod_TdXhglG1w6Q2ur',
    price: 149,
    description: 'BPMN + Journeys + CDP lite',
    features: [
      'Todo de Core',
      'Motor BPMN completo',
      'Customer Journeys',
      'CDP Lite',
      'Workflows automatizados',
      'Integraciones API',
      'Soporte prioritario',
      'Hasta 25 usuarios',
      '5 empresas',
    ],
  },
  industry: {
    name: 'Industry Pack',
    price_id: 'price_1SgGcI4BQ21V0AcNtxvqwd6B',
    product_id: 'prod_TdXhBkK3ElHpjy',
    price: 499,
    description: 'Verticales sectoriales',
    features: [
      'Todo de Automation',
      'Pack Banca / Seguros / Fintech',
      'Cumplimiento regulatorio',
      'Gestión de riesgos',
      'Reportes auditores',
      'Setup personalizado',
      'SLA garantizado',
      'Manager dedicado',
      'Usuarios ilimitados',
      'Empresas ilimitadas',
    ],
  },
} as const;

export function useSubscription() {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    tier: null,
    productId: null,
    subscriptionEnd: null,
    loading: true,
  });
  // === ESTADO KB ===
  const [error, setError] = useState<SubscriptionError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  const checkSubscription = useCallback(async () => {
    if (!user || !session) {
      setState(prev => ({ ...prev, loading: false, subscribed: false, tier: null }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      setState({
        subscribed: data.subscribed,
        tier: data.tier as SubscriptionTier,
        productId: data.product_id,
        subscriptionEnd: data.subscription_end,
        loading: false,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user, session]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh every minute
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const createCheckout = async (tier: 'core' | 'automation' | 'industry') => {
    if (!user) {
      toast.error('Debes iniciar sesión para suscribirte');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { tier },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        return data.url;
      }
      
      throw new Error('No checkout URL received');
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error('Error al crear la sesión de pago: ' + (error.message || 'Error desconocido'));
      return null;
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        return data.url;
      }
      
      throw new Error('No portal URL received');
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast.error('Error al abrir el portal: ' + (error.message || 'Error desconocido'));
      return null;
    }
  };

  return {
    ...state,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    tiers: SUBSCRIPTION_TIERS,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError,
  };
}
