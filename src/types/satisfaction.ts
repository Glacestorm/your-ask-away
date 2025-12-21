// Tipos para el sistema de satisfacción NPS/CSAT/CES

export type SurveyType = 'nps' | 'csat' | 'ces';
export type SurveyStatus = 'draft' | 'active' | 'paused' | 'completed';
export type SurveyTrigger = 'manual' | 'post_visit' | 'post_ticket' | 'milestone' | 'periodic' | 'post_onboarding';
export type SentimentType = 'positive' | 'neutral' | 'negative' | 'mixed';

export interface SatisfactionSurvey {
  id: string;
  name: string;
  survey_type: SurveyType;
  description?: string;
  question_text: string;
  follow_up_question?: string;
  is_active: boolean;
  trigger_type: SurveyTrigger;
  trigger_config: Record<string, unknown>;
  delay_hours: number;
  target_segment?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SurveyCampaign {
  id: string;
  survey_id: string;
  name: string;
  status: SurveyStatus;
  target_companies: string[];
  target_segments: string[];
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  total_sent: number;
  total_responses: number;
  response_rate: number;
  avg_score?: number;
  channel: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  survey?: SatisfactionSurvey;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  campaign_id?: string;
  company_id?: string;
  contact_id?: string;
  respondent_name?: string;
  respondent_email?: string;
  score: number;
  feedback_text?: string;
  sentiment?: SentimentType;
  sentiment_score?: number;
  trigger_context: Record<string, unknown>;
  product_id?: string;
  gestor_id?: string;
  channel: string;
  responded_at: string;
  created_at: string;
  survey?: SatisfactionSurvey;
  company?: {
    id: string;
    name: string;
  };
}

export interface SentimentAnalysis {
  id: string;
  company_id?: string;
  source_type: string;
  source_id?: string;
  content_analyzed: string;
  sentiment: SentimentType;
  sentiment_score: number;
  confidence: number;
  key_phrases: string[];
  emotions: {
    joy?: number;
    trust?: number;
    fear?: number;
    surprise?: number;
    sadness?: number;
    disgust?: number;
    anger?: number;
    anticipation?: number;
  };
  topics: string[];
  action_required: boolean;
  alert_sent: boolean;
  analyzed_by: string;
  gestor_id?: string;
  created_at: string;
}

export interface NPSMetrics {
  id: string;
  period_start: string;
  period_end: string;
  period_type: string;
  company_id?: string;
  segment?: string;
  gestor_id?: string;
  product_id?: string;
  total_responses: number;
  promoters: number;
  passives: number;
  detractors: number;
  nps_score?: number;
  avg_csat?: number;
  avg_ces?: number;
  avg_sentiment?: number;
  trend_vs_previous?: number;
  created_at: string;
  updated_at: string;
}

export interface SatisfactionAlert {
  id: string;
  name: string;
  alert_type: string;
  threshold_value?: number;
  condition_type: string;
  notify_gestor: boolean;
  notify_manager: boolean;
  auto_create_task: boolean;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SatisfactionAlertHistory {
  id: string;
  alert_id: string;
  company_id?: string;
  trigger_value?: number;
  trigger_context: Record<string, unknown>;
  task_created_id?: string;
  notified_users: string[];
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  alert?: SatisfactionAlert;
  company?: {
    id: string;
    name: string;
  };
}

// Helpers para NPS
export function getNPSCategory(score: number): 'promoter' | 'passive' | 'detractor' {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

export function getNPSCategoryColor(category: 'promoter' | 'passive' | 'detractor'): string {
  switch (category) {
    case 'promoter': return 'text-green-600';
    case 'passive': return 'text-yellow-600';
    case 'detractor': return 'text-red-600';
  }
}

export function getNPSScoreColor(nps: number): string {
  if (nps >= 50) return 'text-green-600';
  if (nps >= 0) return 'text-yellow-600';
  return 'text-red-600';
}

export function getSentimentColor(sentiment: SentimentType): string {
  switch (sentiment) {
    case 'positive': return 'text-green-600';
    case 'neutral': return 'text-gray-600';
    case 'negative': return 'text-red-600';
    case 'mixed': return 'text-orange-600';
  }
}

export function getSentimentIcon(sentiment: SentimentType): string {
  switch (sentiment) {
    case 'positive': return '😊';
    case 'neutral': return '😐';
    case 'negative': return '😞';
    case 'mixed': return '🤔';
  }
}

export function getCSATLabel(score: number): string {
  if (score >= 5) return 'Muy satisfecho';
  if (score >= 4) return 'Satisfecho';
  if (score >= 3) return 'Neutral';
  if (score >= 2) return 'Insatisfecho';
  return 'Muy insatisfecho';
}

export function getCESLabel(score: number): string {
  if (score >= 5) return 'Muy fácil';
  if (score >= 4) return 'Fácil';
  if (score >= 3) return 'Neutral';
  if (score >= 2) return 'Difícil';
  return 'Muy difícil';
}
