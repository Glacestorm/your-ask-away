import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface Customer360View {
  id: string;
  customer_id: string;
  name: string;
  
  // Demographics
  demographics: {
    company_name?: string;
    industry?: string;
    size?: string;
    location?: string;
    contact_info: Record<string, string>;
  };
  
  // Financial
  financial: {
    lifetime_value: number;
    monthly_revenue: number;
    payment_status: string;
    credit_score?: number;
    outstanding_balance: number;
  };
  
  // Engagement
  engagement: {
    health_score: number;
    last_interaction: string;
    interaction_frequency: number;
    preferred_channel: string;
    sentiment_trend: 'improving' | 'declining' | 'stable';
  };
  
  // Products
  products: Array<{
    name: string;
    status: string;
    start_date: string;
    value: number;
  }>;
  
  // Predictions
  predictions: {
    churn_probability: number;
    expansion_probability: number;
    next_best_action: string;
    predicted_ltv: number;
  };
  
  // Timeline
  recent_activities: Array<{
    type: string;
    description: string;
    date: string;
    outcome?: string;
  }>;
  
  // Risks & Opportunities
  alerts: Array<{
    type: 'risk' | 'opportunity';
    message: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface Customer360Summary {
  id: string;
  name: string;
  health_score: number;
  ltv: number;
  churn_risk: number;
  last_activity: string;
}

// === HOOK ===
export function useCustomer360IA() {
  const [customer, setCustomer] = useState<Customer360View | null>(null);
  const [customers, setCustomers] = useState<Customer360Summary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === GET CUSTOMER 360 ===
  const fetchCustomer360 = useCallback(async (customerId: string): Promise<Customer360View | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('customer-360-ia', {
        body: { action: 'get_customer_360', customerId }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.customer) {
        setCustomer(data.customer);
        return data.customer;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching customer data';
      setError(message);
      console.error('[useCustomer360IA] fetchCustomer360 error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === LIST CUSTOMERS ===
  const fetchCustomers = useCallback(async (filters?: {
    riskLevel?: string;
    healthScoreMin?: number;
    segment?: string;
  }): Promise<Customer360Summary[]> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('customer-360-ia', {
        body: { action: 'list_customers', filters }
      });

      if (fnError) throw fnError;

      if (data?.customers) {
        setCustomers(data.customers);
        return data.customers;
      }

      return [];
    } catch (err) {
      console.error('[useCustomer360IA] fetchCustomers error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === PREDICT CUSTOMER BEHAVIOR ===
  const predictBehavior = useCallback(async (customerId: string): Promise<{
    predictions: Customer360View['predictions'];
    confidence: number;
  } | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('customer-360-ia', {
        body: { action: 'predict_behavior', customerId }
      });

      if (fnError) throw fnError;

      return data?.prediction || null;
    } catch (err) {
      console.error('[useCustomer360IA] predictBehavior error:', err);
      return null;
    }
  }, []);

  // === GET NEXT BEST ACTIONS ===
  const getNextBestActions = useCallback(async (customerId: string): Promise<Array<{
    action: string;
    description: string;
    expected_impact: string;
    priority: number;
  }>> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('customer-360-ia', {
        body: { action: 'get_nba', customerId }
      });

      if (fnError) throw fnError;

      return data?.actions || [];
    } catch (err) {
      console.error('[useCustomer360IA] getNextBestActions error:', err);
      return [];
    }
  }, []);

  // === GENERATE INSIGHTS ===
  const generateInsights = useCallback(async (customerId: string): Promise<string[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('customer-360-ia', {
        body: { action: 'generate_insights', customerId }
      });

      if (fnError) throw fnError;

      return data?.insights || [];
    } catch (err) {
      console.error('[useCustomer360IA] generateInsights error:', err);
      return [];
    }
  }, []);

  // === COMPARE CUSTOMERS ===
  const compareCustomers = useCallback(async (customerIds: string[]): Promise<{
    comparison: Record<string, Record<string, number>>;
    highlights: string[];
  } | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('customer-360-ia', {
        body: { action: 'compare_customers', customerIds }
      });

      if (fnError) throw fnError;

      return data?.comparison || null;
    } catch (err) {
      console.error('[useCustomer360IA] compareCustomers error:', err);
      return null;
    }
  }, []);

  // === GET HEALTH COLOR ===
  const getHealthColor = useCallback((score: number): string => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  }, []);

  // === GET RISK COLOR ===
  const getRiskColor = useCallback((risk: number): string => {
    if (risk >= 0.7) return 'text-red-500';
    if (risk >= 0.4) return 'text-orange-500';
    if (risk >= 0.2) return 'text-yellow-500';
    return 'text-green-500';
  }, []);

  return {
    customer,
    customers,
    isLoading,
    error,
    fetchCustomer360,
    fetchCustomers,
    predictBehavior,
    getNextBestActions,
    generateInsights,
    compareCustomers,
    getHealthColor,
    getRiskColor,
  };
}

export default useCustomer360IA;
