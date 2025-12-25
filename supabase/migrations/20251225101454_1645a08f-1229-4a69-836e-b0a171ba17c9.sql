-- =============================================
-- FASE 2: Learning Path Adaptativo, Quiz Inteligente, Gamificación
-- =============================================

-- Tabla para quizzes de lecciones
CREATE TABLE public.academia_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.academia_lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.academia_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quiz_type TEXT NOT NULL DEFAULT 'standard', -- standard, adaptive, assessment
  difficulty_level TEXT DEFAULT 'medium', -- easy, medium, hard, adaptive
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  max_attempts INTEGER,
  shuffle_questions BOOLEAN DEFAULT true,
  show_correct_answers BOOLEAN DEFAULT true,
  is_required BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para preguntas de quiz
CREATE TABLE public.academia_quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.academia_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice', -- multiple_choice, true_false, short_answer, matching
  difficulty_level INTEGER DEFAULT 2, -- 1-5 scale
  points INTEGER DEFAULT 1,
  explanation TEXT,
  hint TEXT,
  options JSONB, -- [{text, isCorrect, feedback}]
  correct_answer TEXT,
  tags TEXT[],
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para intentos de quiz
CREATE TABLE public.academia_quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_id UUID NOT NULL REFERENCES public.academia_quizzes(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  total_points INTEGER,
  percentage NUMERIC(5,2),
  passed BOOLEAN,
  time_spent_seconds INTEGER,
  answers JSONB, -- [{questionId, answer, isCorrect, points}]
  adaptive_data JSONB, -- datos del algoritmo adaptativo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para learning paths
CREATE TABLE public.academia_learning_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.academia_courses(id) ON DELETE CASCADE,
  path_type TEXT DEFAULT 'standard', -- standard, accelerated, remedial, custom
  recommended_sequence JSONB, -- [{lessonId, reason, priority, estimatedTime}]
  current_position INTEGER DEFAULT 0,
  adaptations_made JSONB[], -- historial de adaptaciones
  performance_metrics JSONB, -- {avgScore, completionRate, timePerLesson}
  ai_recommendations JSONB, -- recomendaciones de IA
  last_analyzed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para sistema de puntos de gamificación
CREATE TABLE public.academia_user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_points INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  weekly_points INTEGER DEFAULT 0,
  monthly_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabla para transacciones de puntos
CREATE TABLE public.academia_point_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- earned, spent, bonus, penalty
  source TEXT NOT NULL, -- quiz_completion, lesson_complete, streak_bonus, achievement
  source_id UUID,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para leaderboards
CREATE TABLE public.academia_leaderboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.academia_courses(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL, -- weekly, monthly, all_time
  period_start DATE,
  period_end DATE,
  total_points INTEGER DEFAULT 0,
  rank INTEGER,
  lessons_completed INTEGER DEFAULT 0,
  quizzes_passed INTEGER DEFAULT 0,
  average_score NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.academia_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academia_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academia_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academia_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academia_user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academia_point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academia_leaderboards ENABLE ROW LEVEL SECURITY;

-- Políticas para quizzes (lectura pública para quizzes publicados)
CREATE POLICY "Anyone can view published quizzes" ON public.academia_quizzes
  FOR SELECT USING (is_published = true);

CREATE POLICY "Authenticated users can view all quizzes" ON public.academia_quizzes
  FOR SELECT TO authenticated USING (true);

-- Políticas para preguntas de quiz
CREATE POLICY "Anyone can view quiz questions" ON public.academia_quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.academia_quizzes 
      WHERE id = quiz_id AND is_published = true
    )
  );

-- Políticas para intentos de quiz
CREATE POLICY "Users can view own quiz attempts" ON public.academia_quiz_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quiz attempts" ON public.academia_quiz_attempts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz attempts" ON public.academia_quiz_attempts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Políticas para learning paths
CREATE POLICY "Users can view own learning paths" ON public.academia_learning_paths
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own learning paths" ON public.academia_learning_paths
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning paths" ON public.academia_learning_paths
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Políticas para puntos
CREATE POLICY "Users can view own points" ON public.academia_user_points
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own points" ON public.academia_user_points
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Políticas para transacciones de puntos
CREATE POLICY "Users can view own transactions" ON public.academia_point_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON public.academia_point_transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Políticas para leaderboards (lectura pública)
CREATE POLICY "Anyone can view leaderboards" ON public.academia_leaderboards
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own leaderboard entries" ON public.academia_leaderboards
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_quiz_attempts_user ON public.academia_quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz ON public.academia_quiz_attempts(quiz_id);
CREATE INDEX idx_learning_paths_user_course ON public.academia_learning_paths(user_id, course_id);
CREATE INDEX idx_point_transactions_user ON public.academia_point_transactions(user_id);
CREATE INDEX idx_leaderboards_period ON public.academia_leaderboards(period_type, period_start);
CREATE INDEX idx_leaderboards_course ON public.academia_leaderboards(course_id);

-- Función para actualizar puntos del usuario
CREATE OR REPLACE FUNCTION public.update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.academia_user_points (user_id, total_points, experience_points)
  VALUES (NEW.user_id, NEW.points, NEW.points)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    total_points = academia_user_points.total_points + NEW.points,
    experience_points = academia_user_points.experience_points + NEW.points,
    weekly_points = academia_user_points.weekly_points + NEW.points,
    monthly_points = academia_user_points.monthly_points + NEW.points,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para actualizar puntos automáticamente
CREATE TRIGGER trigger_update_user_points
  AFTER INSERT ON public.academia_point_transactions
  FOR EACH ROW
  WHEN (NEW.transaction_type = 'earned' OR NEW.transaction_type = 'bonus')
  EXECUTE FUNCTION public.update_user_points();

-- Función para calcular nivel basado en XP
CREATE OR REPLACE FUNCTION public.calculate_user_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Fórmula: nivel = floor(sqrt(xp / 100)) + 1
  RETURN GREATEST(1, FLOOR(SQRT(xp::NUMERIC / 100)) + 1)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;