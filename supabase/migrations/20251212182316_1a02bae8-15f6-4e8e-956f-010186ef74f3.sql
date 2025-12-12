
-- Sales Quotas table for tracking targets per gestor/period
CREATE TABLE public.sales_quotas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gestor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL DEFAULT 'monthly' CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_value NUMERIC NOT NULL DEFAULT 0,
  actual_value NUMERIC NOT NULL DEFAULT 0,
  target_visits INTEGER DEFAULT 0,
  actual_visits INTEGER DEFAULT 0,
  target_new_clients INTEGER DEFAULT 0,
  actual_new_clients INTEGER DEFAULT 0,
  target_products_sold INTEGER DEFAULT 0,
  actual_products_sold INTEGER DEFAULT 0,
  achievement_percentage NUMERIC GENERATED ALWAYS AS (
    CASE WHEN target_value > 0 THEN ROUND((actual_value / target_value) * 100, 2) ELSE 0 END
  ) STORED,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sales Achievements for gamification
CREATE TABLE public.sales_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gestor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  badge_icon TEXT,
  badge_color TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  quota_id UUID REFERENCES public.sales_quotas(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pipeline Snapshots for velocity tracking
CREATE TABLE public.pipeline_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  gestor_id UUID REFERENCES public.profiles(id),
  office TEXT,
  total_opportunities INTEGER DEFAULT 0,
  total_value NUMERIC DEFAULT 0,
  by_stage JSONB DEFAULT '{}'::jsonb,
  avg_deal_age_days NUMERIC DEFAULT 0,
  avg_deal_value NUMERIC DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  velocity_score NUMERIC DEFAULT 0,
  health_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Revenue Signals for autonomous AI detection
CREATE TABLE public.revenue_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('opportunity', 'risk', 'trend', 'anomaly', 'recommendation')),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  gestor_id UUID REFERENCES public.profiles(id),
  office TEXT,
  confidence_score NUMERIC DEFAULT 0,
  potential_value NUMERIC DEFAULT 0,
  recommended_action TEXT,
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  is_actioned BOOLEAN DEFAULT false,
  actioned_at TIMESTAMP WITH TIME ZONE,
  actioned_by UUID REFERENCES public.profiles(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sales Leaderboard (materialized view concept stored as table for real-time updates)
CREATE TABLE public.sales_leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gestor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL DEFAULT 'monthly',
  period_start DATE NOT NULL,
  rank_position INTEGER NOT NULL,
  total_points INTEGER DEFAULT 0,
  total_value NUMERIC DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  total_deals_won INTEGER DEFAULT 0,
  achievements_count INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]'::jsonb,
  previous_rank INTEGER,
  rank_change INTEGER DEFAULT 0,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(gestor_id, period_type, period_start)
);

-- AI Task Queue for autonomous agent
CREATE TABLE public.ai_task_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_type TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  target_gestor_id UUID REFERENCES public.profiles(id),
  target_entity_type TEXT,
  target_entity_id UUID,
  task_title TEXT NOT NULL,
  task_description TEXT,
  suggested_action TEXT,
  ai_reasoning TEXT,
  estimated_value NUMERIC DEFAULT 0,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed', 'expired')),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES public.profiles(id),
  result_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_task_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales_quotas
CREATE POLICY "Admins can manage all quotas" ON public.sales_quotas FOR ALL USING (is_admin_or_superadmin(auth.uid()));
CREATE POLICY "Directors can view all quotas" ON public.sales_quotas FOR SELECT USING (
  has_role(auth.uid(), 'director_comercial') OR 
  has_role(auth.uid(), 'director_oficina') OR 
  has_role(auth.uid(), 'responsable_comercial')
);
CREATE POLICY "Gestors can view own quotas" ON public.sales_quotas FOR SELECT USING (gestor_id = auth.uid());

-- RLS Policies for sales_achievements
CREATE POLICY "Everyone can view achievements" ON public.sales_achievements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can insert achievements" ON public.sales_achievements FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage achievements" ON public.sales_achievements FOR ALL USING (is_admin_or_superadmin(auth.uid()));

-- RLS Policies for pipeline_snapshots
CREATE POLICY "Admins can manage snapshots" ON public.pipeline_snapshots FOR ALL USING (is_admin_or_superadmin(auth.uid()));
CREATE POLICY "Users can view snapshots" ON public.pipeline_snapshots FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can insert snapshots" ON public.pipeline_snapshots FOR INSERT WITH CHECK (true);

-- RLS Policies for revenue_signals
CREATE POLICY "Admins can manage signals" ON public.revenue_signals FOR ALL USING (is_admin_or_superadmin(auth.uid()));
CREATE POLICY "Users can view relevant signals" ON public.revenue_signals FOR SELECT USING (
  gestor_id = auth.uid() OR 
  is_admin_or_superadmin(auth.uid()) OR
  has_role(auth.uid(), 'director_comercial') OR
  has_role(auth.uid(), 'director_oficina')
);
CREATE POLICY "Users can update own signals" ON public.revenue_signals FOR UPDATE USING (
  gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid())
);

-- RLS Policies for sales_leaderboard
CREATE POLICY "Everyone can view leaderboard" ON public.sales_leaderboard FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage leaderboard" ON public.sales_leaderboard FOR ALL USING (is_admin_or_superadmin(auth.uid()));
CREATE POLICY "System can insert leaderboard" ON public.sales_leaderboard FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update leaderboard" ON public.sales_leaderboard FOR UPDATE USING (true);

-- RLS Policies for ai_task_queue
CREATE POLICY "Admins can manage all tasks" ON public.ai_task_queue FOR ALL USING (is_admin_or_superadmin(auth.uid()));
CREATE POLICY "Users can view own tasks" ON public.ai_task_queue FOR SELECT USING (
  target_gestor_id = auth.uid() OR 
  is_admin_or_superadmin(auth.uid()) OR
  has_role(auth.uid(), 'director_comercial')
);
CREATE POLICY "Users can update own tasks" ON public.ai_task_queue FOR UPDATE USING (
  target_gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid())
);

-- Indexes for performance
CREATE INDEX idx_sales_quotas_gestor_period ON public.sales_quotas(gestor_id, period_start);
CREATE INDEX idx_sales_achievements_gestor ON public.sales_achievements(gestor_id, unlocked_at DESC);
CREATE INDEX idx_pipeline_snapshots_date ON public.pipeline_snapshots(snapshot_date DESC);
CREATE INDEX idx_revenue_signals_gestor ON public.revenue_signals(gestor_id, created_at DESC);
CREATE INDEX idx_revenue_signals_unread ON public.revenue_signals(gestor_id, is_read) WHERE is_read = false;
CREATE INDEX idx_ai_task_queue_pending ON public.ai_task_queue(target_gestor_id, status, priority DESC) WHERE status = 'pending';

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.revenue_signals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_task_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_leaderboard;
