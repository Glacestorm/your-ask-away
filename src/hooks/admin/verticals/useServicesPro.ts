import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===

// Legal
export interface ContractAnalysis {
  contract_id: string;
  clauses: Array<{
    clause_id: string;
    type: string;
    text: string;
    risk_level: 'low' | 'medium' | 'high';
    issues: string[];
    suggestions: string[];
  }>;
  overall_risk: number;
  missing_clauses: string[];
  compliance_status: Record<string, boolean>;
  summary: string;
}

export interface LegalPrecedent {
  case_id: string;
  title: string;
  court: string;
  date: string;
  relevance_score: number;
  summary: string;
  key_findings: string[];
  applicable_laws: string[];
}

export interface SmartContract {
  id: string;
  contract_type: string;
  parties: Array<{ name: string; role: string; wallet_address?: string }>;
  terms: Record<string, unknown>;
  status: 'draft' | 'pending_signatures' | 'active' | 'completed' | 'terminated';
  blockchain_address?: string;
  execution_conditions: Array<{ condition: string; met: boolean }>;
}

// Education
export interface AdaptiveLearningPath {
  student_id: string;
  course_id: string;
  current_level: number;
  mastery_scores: Record<string, number>;
  recommended_content: Array<{
    content_id: string;
    type: string;
    difficulty: number;
    estimated_time_minutes: number;
    reason: string;
  }>;
  knowledge_gaps: string[];
  predicted_completion_date: string;
}

export interface AITutorSession {
  session_id: string;
  student_id: string;
  topic: string;
  messages: Array<{ role: 'student' | 'tutor'; content: string; timestamp: string }>;
  understanding_score: number;
  areas_of_confusion: string[];
  recommended_exercises: string[];
}

export interface ProctorAnalysis {
  exam_id: string;
  student_id: string;
  violations: Array<{
    type: 'face_not_visible' | 'multiple_faces' | 'suspicious_movement' | 'audio_anomaly' | 'browser_switch';
    timestamp: string;
    severity: 'warning' | 'moderate' | 'severe';
    screenshot_url?: string;
  }>;
  integrity_score: number;
  recommended_action: string;
}

// Hospitality
export interface RevenuePricing {
  room_type: string;
  date: string;
  base_price: number;
  recommended_price: number;
  demand_score: number;
  competitor_prices: Array<{ hotel: string; price: number }>;
  events_impact: Array<{ event: string; price_impact: number }>;
  expected_occupancy: number;
}

export interface GuestExperience {
  guest_id: string;
  preferences: Record<string, unknown>;
  stay_history: Array<{
    hotel_id: string;
    check_in: string;
    check_out: string;
    satisfaction_score: number;
    feedback?: string;
  }>;
  personalization_recommendations: string[];
  loyalty_tier: string;
  lifetime_value: number;
}

export interface ReviewSentiment {
  review_id: string;
  platform: string;
  text: string;
  overall_sentiment: 'positive' | 'neutral' | 'negative';
  aspect_sentiments: Record<string, { sentiment: string; score: number }>;
  key_phrases: string[];
  suggested_response: string;
  priority: 'low' | 'medium' | 'high';
}

// Professional Services
export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relevance_score: number;
  related_articles: string[];
  last_updated: string;
  usage_count: number;
}

export interface ProjectProfitability {
  project_id: string;
  budget: number;
  actual_cost: number;
  revenue: number;
  margin: number;
  burn_rate: number;
  completion_percentage: number;
  at_risk: boolean;
  risk_factors: string[];
  forecast: {
    final_cost: number;
    final_margin: number;
    confidence: number;
  };
}

export interface ResourceAllocation {
  resources: Array<{
    resource_id: string;
    name: string;
    skills: string[];
    availability: number;
    current_projects: string[];
    utilization: number;
  }>;
  optimal_assignments: Array<{
    project_id: string;
    resource_id: string;
    allocation_percent: number;
    start_date: string;
    end_date: string;
    skill_match: number;
  }>;
  bottlenecks: string[];
}

// Government
export interface CitizenService {
  service_id: string;
  service_name: string;
  category: string;
  available_channels: string[];
  requirements: string[];
  estimated_time: string;
  satisfaction_score: number;
  digital_completion_rate: number;
}

export interface SmartCityMetrics {
  city_id: string;
  metrics: {
    air_quality_index: number;
    traffic_congestion: number;
    energy_consumption_mwh: number;
    water_usage_m3: number;
    waste_collection_efficiency: number;
    public_safety_index: number;
  };
  alerts: Array<{ type: string; severity: string; location: string; message: string }>;
  sensors_online: number;
  total_sensors: number;
}

export interface EmergencyResponse {
  incident_id: string;
  incident_type: string;
  location: { lat: number; lng: number; address: string };
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'dispatched' | 'on_scene' | 'resolved';
  resources_deployed: Array<{ type: string; unit_id: string; eta_minutes: number }>;
  ai_recommendations: string[];
  affected_population: number;
}

// Retail
export interface AgenticCommerce {
  agent_id: string;
  customer_id: string;
  preferences: Record<string, unknown>;
  budget: number;
  shopping_list: Array<{
    item: string;
    quantity: number;
    constraints: string[];
    found_products: Array<{ product_id: string; price: number; match_score: number }>;
  }>;
  autonomous_purchases: Array<{ product_id: string; price: number; purchased_at: string }>;
  savings_achieved: number;
}

export interface InventoryPrediction {
  product_id: string;
  current_stock: number;
  predicted_demand: Array<{ date: string; quantity: number; confidence: number }>;
  reorder_point: number;
  optimal_order_quantity: number;
  stockout_risk: number;
  overstock_risk: number;
  recommendations: string[];
}

export interface CustomerDNA {
  customer_id: string;
  segments: string[];
  purchase_behavior: {
    frequency: number;
    average_order_value: number;
    preferred_categories: string[];
    preferred_channels: string[];
    price_sensitivity: number;
  };
  churn_risk: number;
  lifetime_value: number;
  next_best_actions: Array<{ action: string; expected_impact: number; channel: string }>;
  lookalike_score: number;
}

// === HOOK ===
export function useServicesPro() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === LEGAL ===
  const analyzeContract = useCallback(async (
    contractId: string,
    contractText: string
  ): Promise<ContractAnalysis | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('services-pro', {
        body: {
          action: 'analyze_contract',
          params: { contractId, contractText }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error analyzing contract:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const findLegalPrecedents = useCallback(async (
    query: string,
    jurisdiction?: string
  ): Promise<LegalPrecedent[]> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('services-pro', {
        body: {
          action: 'find_legal_precedents',
          params: { query, jurisdiction }
        }
      });

      if (fnError) throw fnError;
      return data?.data || [];
    } catch (err) {
      console.error('Error finding precedents:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateSmartContract = useCallback(async (
    contractType: string,
    parties: Array<{ name: string; role: string }>,
    terms: Record<string, unknown>
  ): Promise<SmartContract | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('services-pro', {
        body: {
          action: 'generate_smart_contract',
          params: { contractType, parties, terms }
        }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Contrato inteligente generado');
        return data.data;
      }
      return null;
    } catch (err) {
      toast.error('Error al generar contrato');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === EDUCATION ===
  const getAdaptivePath = useCallback(async (
    studentId: string,
    courseId: string
  ): Promise<AdaptiveLearningPath | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('services-pro', {
        body: {
          action: 'get_adaptive_path',
          params: { studentId, courseId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error getting path:', err);
      return null;
    }
  }, []);

  const startTutorSession = useCallback(async (
    studentId: string,
    topic: string
  ): Promise<AITutorSession | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('services-pro', {
        body: {
          action: 'start_tutor_session',
          params: { studentId, topic }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error starting session:', err);
      return null;
    }
  }, []);

  const getProctorAnalysis = useCallback(async (
    examId: string,
    studentId: string
  ): Promise<ProctorAnalysis | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('services-pro', {
        body: {
          action: 'get_proctor_analysis',
          params: { examId, studentId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error getting analysis:', err);
      return null;
    }
  }, []);

  // === HOSPITALITY ===
  const getRevenuePricing = useCallback(async (
    hotelId: string,
    dateRange: { start: string; end: string }
  ): Promise<RevenuePricing[]> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('services-pro', {
        body: {
          action: 'get_revenue_pricing',
          params: { hotelId, dateRange }
        }
      });

      if (fnError) throw fnError;
      return data?.data || [];
    } catch (err) {
      console.error('Error getting pricing:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getGuestExperience = useCallback(async (
    guestId: string
  ): Promise<GuestExperience | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('services-pro', {
        body: {
          action: 'get_guest_experience',
          params: { guestId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error getting guest data:', err);
      return null;
    }
  }, []);

  const analyzeReviewSentiment = useCallback(async (
    reviewId: string,
    reviewText: string
  ): Promise<ReviewSentiment | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('services-pro', {
        body: {
          action: 'analyze_review_sentiment',
          params: { reviewId, reviewText }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error analyzing review:', err);
      return null;
    }
  }, []);

  // === PROFESSIONAL SERVICES ===
  const searchKnowledge = useCallback(async (
    query: string,
    filters?: Record<string, unknown>
  ): Promise<KnowledgeArticle[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('services-pro', {
        body: {
          action: 'search_knowledge',
          params: { query, filters }
        }
      });

      if (fnError) throw fnError;
      return data?.data || [];
    } catch (err) {
      console.error('Error searching knowledge:', err);
      return [];
    }
  }, []);

  const getProjectProfitability = useCallback(async (
    projectId: string
  ): Promise<ProjectProfitability | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('services-pro', {
        body: {
          action: 'get_project_profitability',
          params: { projectId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error getting profitability:', err);
      return null;
    }
  }, []);

  const optimizeResources = useCallback(async (
    projectIds: string[]
  ): Promise<ResourceAllocation | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('services-pro', {
        body: {
          action: 'optimize_resources',
          params: { projectIds }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error optimizing:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GOVERNMENT ===
  const getCitizenServices = useCallback(async (
    category?: string
  ): Promise<CitizenService[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('services-pro', {
        body: {
          action: 'get_citizen_services',
          params: { category }
        }
      });

      if (fnError) throw fnError;
      return data?.data || [];
    } catch (err) {
      console.error('Error getting services:', err);
      return [];
    }
  }, []);

  const getSmartCityMetrics = useCallback(async (
    cityId: string
  ): Promise<SmartCityMetrics | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('services-pro', {
        body: {
          action: 'get_smart_city_metrics',
          params: { cityId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error getting metrics:', err);
      return null;
    }
  }, []);

  const getEmergencyResponse = useCallback(async (
    incidentId: string
  ): Promise<EmergencyResponse | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('services-pro', {
        body: {
          action: 'get_emergency_response',
          params: { incidentId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error getting response:', err);
      return null;
    }
  }, []);

  // === RETAIL ===
  const getAgenticCommerce = useCallback(async (
    customerId: string
  ): Promise<AgenticCommerce | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('services-pro', {
        body: {
          action: 'get_agentic_commerce',
          params: { customerId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error getting agentic data:', err);
      return null;
    }
  }, []);

  const getInventoryPrediction = useCallback(async (
    productId: string
  ): Promise<InventoryPrediction | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('services-pro', {
        body: {
          action: 'get_inventory_prediction',
          params: { productId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error getting prediction:', err);
      return null;
    }
  }, []);

  const getCustomerDNA = useCallback(async (
    customerId: string
  ): Promise<CustomerDNA | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('services-pro', {
        body: {
          action: 'get_customer_dna',
          params: { customerId }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error getting DNA:', err);
      return null;
    }
  }, []);

  return {
    isLoading,
    error,
    // Legal
    analyzeContract,
    findLegalPrecedents,
    generateSmartContract,
    // Education
    getAdaptivePath,
    startTutorSession,
    getProctorAnalysis,
    // Hospitality
    getRevenuePricing,
    getGuestExperience,
    analyzeReviewSentiment,
    // Professional Services
    searchKnowledge,
    getProjectProfitability,
    optimizeResources,
    // Government
    getCitizenServices,
    getSmartCityMetrics,
    getEmergencyResponse,
    // Retail
    getAgenticCommerce,
    getInventoryPrediction,
    getCustomerDNA,
  };
}

export default useServicesPro;
