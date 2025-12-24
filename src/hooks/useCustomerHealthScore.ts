import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KBStatus, KBError, createKBError, parseError, collectTelemetry } from './core';

export interface HealthScoreDimension {
  name: string;
  score: number;
  weight: number;
  trend: 'improving' | 'stable' | 'declining';
  indicators: HealthIndicator[];
}

export interface HealthIndicator {
  name: string;
  value: number;
  benchmark: number;
  status: 'good' | 'warning' | 'critical';
  description: string;
}

export interface CustomerHealthScore {
  companyId: string;
  companyName: string;
  overallScore: number;
  previousScore: number;
  trend: 'improving' | 'stable' | 'declining';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  dimensions: HealthScoreDimension[];
  predictedChurnProbability: number;
  nextBestActions: RecommendedAction[];
  lastUpdated: string;
}

export interface RecommendedAction {
  id: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  category: 'engagement' | 'support' | 'product' | 'relationship' | 'financial';
  automatable: boolean;
}

export interface HealthScoreConfig {
  dimensions: {
    engagement: number;
    adoption: number;
    support: number;
    financial: number;
    relationship: number;
    sentiment: number;
  };
  thresholds: {
    critical: number;
    warning: number;
    healthy: number;
  };
}

const DEFAULT_CONFIG: HealthScoreConfig = {
  dimensions: {
    engagement: 0.20,
    adoption: 0.20,
    support: 0.15,
    financial: 0.20,
    relationship: 0.15,
    sentiment: 0.10
  },
  thresholds: {
    critical: 30,
    warning: 50,
    healthy: 70
  }
};

export type CustomerHealthScoreError = KBError;

export function useCustomerHealthScore() {
  const [healthScores, setHealthScores] = useState<CustomerHealthScore[]>([]);
  
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
    setHealthScores([]);
  }, []);

  const calculateHealthScore = useCallback(async (companyId: string, config: HealthScoreConfig = DEFAULT_CONFIG): Promise<CustomerHealthScore | null> => {
    const startTime = new Date();
    setStatus('loading');
    setError(null);

    try {
      // Fetch company data
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      // Fetch adoption score
      const { data: adoptionScore } = await supabase
        .from('adoption_scores')
        .select('*')
        .eq('company_id', companyId)
        .single();

      // Fetch recent support tickets
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentTickets } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('company_id', companyId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Fetch renewal info
      const { data: renewalOpportunity } = await supabase
        .from('renewal_opportunities')
        .select('*')
        .eq('company_id', companyId)
        .order('renewal_date', { ascending: true })
        .limit(1)
        .single();

      // Calculate dimensions
      const dimensions: HealthScoreDimension[] = [];

      // 1. Engagement Dimension
      const engagementScore = calculateEngagementScore(adoptionScore);
      dimensions.push({
        name: 'Engagement',
        score: engagementScore.score,
        weight: config.dimensions.engagement,
        trend: engagementScore.trend,
        indicators: engagementScore.indicators
      });

      // 2. Adoption Dimension
      const adoptionDimension = calculateAdoptionDimension(adoptionScore);
      dimensions.push({
        name: 'Adoption',
        score: adoptionDimension.score,
        weight: config.dimensions.adoption,
        trend: adoptionDimension.trend,
        indicators: adoptionDimension.indicators
      });

      // 3. Support Dimension
      const supportDimension = calculateSupportDimension(recentTickets || []);
      dimensions.push({
        name: 'Support',
        score: supportDimension.score,
        weight: config.dimensions.support,
        trend: supportDimension.trend,
        indicators: supportDimension.indicators
      });

      // 4. Financial Dimension
      const financialDimension = calculateFinancialDimension(company, renewalOpportunity);
      dimensions.push({
        name: 'Financial',
        score: financialDimension.score,
        weight: config.dimensions.financial,
        trend: financialDimension.trend,
        indicators: financialDimension.indicators
      });

      // 5. Relationship Dimension
      const relationshipDimension = calculateRelationshipDimension(company);
      dimensions.push({
        name: 'Relationship',
        score: relationshipDimension.score,
        weight: config.dimensions.relationship,
        trend: relationshipDimension.trend,
        indicators: relationshipDimension.indicators
      });

      // 6. Sentiment Dimension
      const sentimentDimension = calculateSentimentDimension(company, recentTickets || []);
      dimensions.push({
        name: 'Sentiment',
        score: sentimentDimension.score,
        weight: config.dimensions.sentiment,
        trend: sentimentDimension.trend,
        indicators: sentimentDimension.indicators
      });

      // Calculate overall score
      const overallScore = dimensions.reduce((sum, dim) => sum + (dim.score * dim.weight), 0);
      
      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (overallScore < config.thresholds.critical) riskLevel = 'critical';
      else if (overallScore < config.thresholds.warning) riskLevel = 'high';
      else if (overallScore < config.thresholds.healthy) riskLevel = 'medium';
      else riskLevel = 'low';

      // Calculate trend
      const previousScore = adoptionScore?.overall_score || 50;
      const scoreDiff = overallScore - previousScore;
      const trend: 'improving' | 'stable' | 'declining' = 
        scoreDiff > 5 ? 'improving' : scoreDiff < -5 ? 'declining' : 'stable';

      // Generate recommended actions
      const nextBestActions = generateRecommendedActions(dimensions, riskLevel);

      // Calculate churn probability
      const predictedChurnProbability = calculateChurnProbability(overallScore, dimensions);

      const healthScore: CustomerHealthScore = {
        companyId: company.id,
        companyName: company.name,
        overallScore: Math.round(overallScore),
        previousScore: Math.round(previousScore),
        trend,
        riskLevel,
        dimensions,
        predictedChurnProbability,
        nextBestActions,
        lastUpdated: new Date().toISOString()
      };

      setStatus('success');
      setLastRefresh(new Date());
      setLastSuccess(new Date());
      
      collectTelemetry({
        hookName: 'useCustomerHealthScore',
        operationName: 'calculateHealthScore',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'success',
        retryCount: 0
      });

      return healthScore;
    } catch (err) {
      const kbError = createKBError('CALCULATE_HEALTH_SCORE_ERROR', parseError(err).message, { originalError: err });
      setError(kbError);
      setStatus('error');
      
      collectTelemetry({
        hookName: 'useCustomerHealthScore',
        operationName: 'calculateHealthScore',
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        status: 'error',
        error: kbError,
        retryCount
      });
      
      console.error('Health score calculation error:', err);
      return null;
    }
  }, [retryCount]);

  const calculateBulkHealthScores = useCallback(async (companyIds: string[]): Promise<CustomerHealthScore[]> => {
    setStatus('loading');
    const scores: CustomerHealthScore[] = [];

    for (const companyId of companyIds) {
      const score = await calculateHealthScore(companyId);
      if (score) scores.push(score);
    }

    setHealthScores(scores);
    setLastRefresh(new Date());
    setLastSuccess(new Date());
    setStatus('success');
    return scores;
  }, [calculateHealthScore]);

  const getHealthScoreColor = useCallback((score: number): string => {
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    if (score >= 30) return 'text-orange-500';
    return 'text-red-500';
  }, []);

  const getRiskLevelColor = useCallback((riskLevel: string): string => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  return {
    calculateHealthScore,
    calculateBulkHealthScores,
    healthScores,
    data: healthScores,
    // === KB 2.0 RETURN ===
    status,
    isIdle,
    isLoading,
    isSuccess,
    isError,
    error,
    lastRefresh,
    lastSuccess,
    retryCount,
    clearError,
    reset,
    getHealthScoreColor,
    getRiskLevelColor
  };
}

// Helper functions
function calculateEngagementScore(adoptionScore: any): { score: number; trend: 'improving' | 'stable' | 'declining'; indicators: HealthIndicator[] } {
  const engagementValue = adoptionScore?.engagement_score || 50;
  const trend = adoptionScore?.trend === 'up' ? 'improving' : adoptionScore?.trend === 'down' ? 'declining' : 'stable';

  return {
    score: engagementValue,
    trend,
    indicators: [
      {
        name: 'Login Frequency',
        value: engagementValue,
        benchmark: 70,
        status: engagementValue >= 70 ? 'good' : engagementValue >= 50 ? 'warning' : 'critical',
        description: 'Frequency of user logins in the last 30 days'
      },
      {
        name: 'Feature Usage',
        value: adoptionScore?.depth_score || 50,
        benchmark: 60,
        status: (adoptionScore?.depth_score || 50) >= 60 ? 'good' : 'warning',
        description: 'Depth of feature adoption'
      }
    ]
  };
}

function calculateAdoptionDimension(adoptionScore: any): { score: number; trend: 'improving' | 'stable' | 'declining'; indicators: HealthIndicator[] } {
  const overall = adoptionScore?.overall_score || 50;
  const trend = adoptionScore?.trend === 'up' ? 'improving' : adoptionScore?.trend === 'down' ? 'declining' : 'stable';

  return {
    score: overall,
    trend,
    indicators: [
      {
        name: 'Feature Breadth',
        value: adoptionScore?.breadth_score || 50,
        benchmark: 65,
        status: (adoptionScore?.breadth_score || 50) >= 65 ? 'good' : 'warning',
        description: 'Percentage of features used'
      },
      {
        name: 'Activation Rate',
        value: adoptionScore?.activation_score || 50,
        benchmark: 80,
        status: (adoptionScore?.activation_score || 50) >= 80 ? 'good' : 'warning',
        description: 'Key activation milestones completed'
      },
      {
        name: 'Stickiness',
        value: adoptionScore?.stickiness_score || 50,
        benchmark: 60,
        status: (adoptionScore?.stickiness_score || 50) >= 60 ? 'good' : 'warning',
        description: 'DAU/MAU ratio'
      }
    ]
  };
}

function calculateSupportDimension(tickets: any[]): { score: number; trend: 'improving' | 'stable' | 'declining'; indicators: HealthIndicator[] } {
  const ticketCount = tickets.length;
  const criticalTickets = tickets.filter(t => t.priority === 'critical' || t.priority === 'high').length;
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  
  // Lower tickets = higher score
  const ticketScore = Math.max(0, 100 - (ticketCount * 10));
  const criticalScore = Math.max(0, 100 - (criticalTickets * 25));
  const resolutionScore = ticketCount > 0 ? ((ticketCount - openTickets) / ticketCount) * 100 : 100;

  const overallScore = (ticketScore * 0.3) + (criticalScore * 0.4) + (resolutionScore * 0.3);

  return {
    score: Math.round(overallScore),
    trend: ticketCount <= 2 ? 'improving' : ticketCount > 5 ? 'declining' : 'stable',
    indicators: [
      {
        name: 'Ticket Volume',
        value: ticketCount,
        benchmark: 3,
        status: ticketCount <= 3 ? 'good' : ticketCount <= 6 ? 'warning' : 'critical',
        description: 'Support tickets in last 30 days'
      },
      {
        name: 'Critical Issues',
        value: criticalTickets,
        benchmark: 0,
        status: criticalTickets === 0 ? 'good' : criticalTickets <= 2 ? 'warning' : 'critical',
        description: 'High priority unresolved issues'
      }
    ]
  };
}

function calculateFinancialDimension(company: any, renewal: any): { score: number; trend: 'improving' | 'stable' | 'declining'; indicators: HealthIndicator[] } {
  const mrr = company?.mrr || 0;
  const renewalProbability = renewal?.probability || 70;
  const daysToRenewal = renewal?.renewal_date 
    ? Math.ceil((new Date(renewal.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 365;

  const financialHealth = renewalProbability;
  const urgencyScore = daysToRenewal > 90 ? 100 : daysToRenewal > 30 ? 70 : daysToRenewal > 7 ? 40 : 20;

  return {
    score: Math.round((financialHealth * 0.6) + (urgencyScore * 0.4)),
    trend: renewalProbability >= 70 ? 'stable' : 'declining',
    indicators: [
      {
        name: 'Renewal Probability',
        value: renewalProbability,
        benchmark: 80,
        status: renewalProbability >= 80 ? 'good' : renewalProbability >= 60 ? 'warning' : 'critical',
        description: 'Likelihood of renewal'
      },
      {
        name: 'Days to Renewal',
        value: daysToRenewal,
        benchmark: 90,
        status: daysToRenewal > 60 ? 'good' : daysToRenewal > 30 ? 'warning' : 'critical',
        description: 'Days until contract renewal'
      },
      {
        name: 'MRR Value',
        value: mrr,
        benchmark: 1000,
        status: mrr >= 1000 ? 'good' : 'warning',
        description: 'Monthly recurring revenue'
      }
    ]
  };
}

function calculateRelationshipDimension(company: any): { score: number; trend: 'improving' | 'stable' | 'declining'; indicators: HealthIndicator[] } {
  const lastContact = company?.last_contact_date 
    ? Math.ceil((Date.now() - new Date(company.last_contact_date).getTime()) / (1000 * 60 * 60 * 24))
    : 30;
  
  const contactScore = lastContact <= 7 ? 100 : lastContact <= 14 ? 80 : lastContact <= 30 ? 60 : 30;
  const hasChampion = company?.decision_makers?.length > 0;
  const championScore = hasChampion ? 80 : 40;

  return {
    score: Math.round((contactScore * 0.6) + (championScore * 0.4)),
    trend: lastContact <= 14 ? 'improving' : lastContact > 30 ? 'declining' : 'stable',
    indicators: [
      {
        name: 'Days Since Contact',
        value: lastContact,
        benchmark: 14,
        status: lastContact <= 14 ? 'good' : lastContact <= 30 ? 'warning' : 'critical',
        description: 'Days since last meaningful contact'
      },
      {
        name: 'Champion Identified',
        value: hasChampion ? 100 : 0,
        benchmark: 100,
        status: hasChampion ? 'good' : 'warning',
        description: 'Internal champion at customer'
      }
    ]
  };
}

function calculateSentimentDimension(company: any, tickets: any[]): { score: number; trend: 'improving' | 'stable' | 'declining'; indicators: HealthIndicator[] } {
  const npsScore = company?.nps_score ?? 50;
  const negativeTickets = tickets.filter(t => t.sentiment_score && t.sentiment_score < -0.3).length;
  
  // NPS is -100 to 100, normalize to 0-100
  const normalizedNps = ((npsScore + 100) / 200) * 100;
  const sentimentPenalty = negativeTickets * 15;

  return {
    score: Math.max(0, Math.round(normalizedNps - sentimentPenalty)),
    trend: npsScore >= 50 ? 'stable' : 'declining',
    indicators: [
      {
        name: 'NPS Score',
        value: npsScore,
        benchmark: 50,
        status: npsScore >= 50 ? 'good' : npsScore >= 0 ? 'warning' : 'critical',
        description: 'Net Promoter Score'
      },
      {
        name: 'Negative Interactions',
        value: negativeTickets,
        benchmark: 0,
        status: negativeTickets === 0 ? 'good' : negativeTickets <= 2 ? 'warning' : 'critical',
        description: 'Tickets with negative sentiment'
      }
    ]
  };
}

function generateRecommendedActions(dimensions: HealthScoreDimension[], riskLevel: string): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  // Find lowest scoring dimensions
  const sortedDimensions = [...dimensions].sort((a, b) => a.score - b.score);
  
  sortedDimensions.slice(0, 3).forEach((dim, index) => {
    if (dim.score < 60) {
      const action = getActionForDimension(dim.name, dim.score, index);
      if (action) actions.push(action);
    }
  });

  // Add urgent action if critical risk
  if (riskLevel === 'critical') {
    actions.unshift({
      id: 'urgent-exec-call',
      priority: 'high',
      action: 'Schedule immediate executive check-in call',
      impact: 'Direct intervention to prevent churn',
      effort: 'medium',
      category: 'relationship',
      automatable: false
    });
  }

  return actions.slice(0, 5);
}

function getActionForDimension(dimensionName: string, score: number, priority: number): RecommendedAction | null {
  const actionMap: Record<string, RecommendedAction> = {
    'Engagement': {
      id: 'boost-engagement',
      priority: priority === 0 ? 'high' : 'medium',
      action: 'Launch personalized re-engagement campaign',
      impact: 'Increase login frequency by 40%',
      effort: 'low',
      category: 'engagement',
      automatable: true
    },
    'Adoption': {
      id: 'adoption-training',
      priority: priority === 0 ? 'high' : 'medium',
      action: 'Schedule product training session on underutilized features',
      impact: 'Unlock additional value from product',
      effort: 'medium',
      category: 'product',
      automatable: false
    },
    'Support': {
      id: 'support-review',
      priority: 'high',
      action: 'Conduct support experience review meeting',
      impact: 'Resolve ongoing issues and improve satisfaction',
      effort: 'medium',
      category: 'support',
      automatable: false
    },
    'Financial': {
      id: 'renewal-discussion',
      priority: 'high',
      action: 'Initiate early renewal discussion with special offer',
      impact: 'Secure renewal commitment',
      effort: 'medium',
      category: 'financial',
      automatable: false
    },
    'Relationship': {
      id: 'relationship-build',
      priority: priority === 0 ? 'high' : 'medium',
      action: 'Schedule QBR or check-in meeting',
      impact: 'Strengthen relationship and gather feedback',
      effort: 'medium',
      category: 'relationship',
      automatable: true
    },
    'Sentiment': {
      id: 'sentiment-recovery',
      priority: 'high',
      action: 'Launch sentiment recovery playbook',
      impact: 'Address concerns and improve perception',
      effort: 'high',
      category: 'relationship',
      automatable: false
    }
  };

  return actionMap[dimensionName] || null;
}

function calculateChurnProbability(overallScore: number, dimensions: HealthScoreDimension[]): number {
  // Base probability from overall score
  let baseProbability = Math.max(0, 100 - overallScore);
  
  // Increase probability if multiple dimensions are critical
  const criticalDimensions = dimensions.filter(d => d.score < 30).length;
  const warningDimensions = dimensions.filter(d => d.score >= 30 && d.score < 50).length;
  
  baseProbability += criticalDimensions * 10;
  baseProbability += warningDimensions * 5;
  
  // Cap at 95%
  return Math.min(95, Math.round(baseProbability));
}
