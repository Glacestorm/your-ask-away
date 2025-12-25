-- =====================================================
-- FASE 5: CERTIFICACIONES Y GAMIFICACIÓN
-- =====================================================

-- 1. Tabla de quizzes por módulo/lección
CREATE TABLE IF NOT EXISTS public.training_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.training_courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.training_modules(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.training_content(id) ON DELETE CASCADE,
  quiz_key TEXT NOT NULL,
  title JSONB DEFAULT '{"es": "Quiz", "en": "Quiz"}'::JSONB,
  description JSONB,
  questions JSONB NOT NULL DEFAULT '[]'::JSONB,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  max_attempts INTEGER DEFAULT 3,
  is_required_for_certificate BOOLEAN DEFAULT false,
  shuffle_questions BOOLEAN DEFAULT true,
  shuffle_options BOOLEAN DEFAULT true,
  show_correct_answers BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla de intentos de quiz
CREATE TABLE IF NOT EXISTS public.training_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.training_quizzes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  enrollment_id UUID REFERENCES public.training_enrollments(id) ON DELETE CASCADE,
  attempt_number INTEGER DEFAULT 1,
  answers JSONB DEFAULT '[]'::JSONB,
  score NUMERIC(5,2),
  passed BOOLEAN DEFAULT false,
  time_spent_seconds INTEGER,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla de badges/logros del estudiante
CREATE TABLE IF NOT EXISTS public.training_student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_key TEXT NOT NULL,
  badge_name JSONB DEFAULT '{}'::JSONB,
  badge_description JSONB DEFAULT '{}'::JSONB,
  badge_icon TEXT,
  badge_color TEXT DEFAULT 'primary',
  category TEXT DEFAULT 'achievement',
  points_awarded INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::JSONB,
  earned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

-- 4. Tabla de puntos de experiencia
CREATE TABLE IF NOT EXISTS public.training_student_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  xp_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  source_type TEXT,
  source_id UUID,
  description TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  earned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabla de ranking/leaderboard
CREATE TABLE IF NOT EXISTS public.training_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  courses_completed INTEGER DEFAULT 0,
  quizzes_passed INTEGER DEFAULT 0,
  certificates_earned INTEGER DEFAULT 0,
  badges_count INTEGER DEFAULT 0,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  rank_position INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.training_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_student_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_leaderboard ENABLE ROW LEVEL SECURITY;

-- Quizzes: todos pueden leer quizzes activos
CREATE POLICY "training_quizzes_read_active" ON public.training_quizzes
  FOR SELECT USING (is_active = true);

-- Quiz attempts: usuarios solo ven sus propios intentos
CREATE POLICY "training_quiz_attempts_user" ON public.training_quiz_attempts
  FOR ALL USING (auth.uid() = user_id);

-- Badges: usuarios ven sus propios badges, todos pueden ver badges de otros (público)
CREATE POLICY "training_badges_own" ON public.training_student_badges
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "training_badges_read_all" ON public.training_student_badges
  FOR SELECT USING (true);

-- XP: usuarios solo ven su propio XP
CREATE POLICY "training_xp_user" ON public.training_student_xp
  FOR ALL USING (auth.uid() = user_id);

-- Leaderboard: todos pueden ver el ranking
CREATE POLICY "training_leaderboard_read" ON public.training_leaderboard
  FOR SELECT USING (true);

CREATE POLICY "training_leaderboard_own" ON public.training_leaderboard
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "training_leaderboard_insert" ON public.training_leaderboard
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indices
CREATE INDEX IF NOT EXISTS idx_training_quizzes_course ON public.training_quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_training_quizzes_module ON public.training_quizzes(module_id);
CREATE INDEX IF NOT EXISTS idx_training_quiz_attempts_user ON public.training_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_training_quiz_attempts_quiz ON public.training_quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_training_badges_user ON public.training_student_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_training_xp_user ON public.training_student_xp(user_id);
CREATE INDEX IF NOT EXISTS idx_training_leaderboard_xp ON public.training_leaderboard(total_xp DESC);

-- Función para calcular el nivel basado en XP
CREATE OR REPLACE FUNCTION calculate_student_level(xp_points INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Niveles basados en XP: 0-99=1, 100-299=2, 300-599=3, etc.
  IF xp_points < 100 THEN RETURN 1;
  ELSIF xp_points < 300 THEN RETURN 2;
  ELSIF xp_points < 600 THEN RETURN 3;
  ELSIF xp_points < 1000 THEN RETURN 4;
  ELSIF xp_points < 1500 THEN RETURN 5;
  ELSIF xp_points < 2500 THEN RETURN 6;
  ELSIF xp_points < 4000 THEN RETURN 7;
  ELSIF xp_points < 6000 THEN RETURN 8;
  ELSIF xp_points < 9000 THEN RETURN 9;
  ELSE RETURN 10;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para actualizar leaderboard cuando se gana XP
CREATE OR REPLACE FUNCTION update_leaderboard_on_xp()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.training_leaderboard (user_id, total_xp, level, last_activity_at)
  VALUES (
    NEW.user_id,
    NEW.points,
    calculate_student_level(NEW.points),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = training_leaderboard.total_xp + NEW.points,
    level = calculate_student_level(training_leaderboard.total_xp + NEW.points),
    last_activity_at = now(),
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_leaderboard_on_xp
  AFTER INSERT ON public.training_student_xp
  FOR EACH ROW EXECUTE FUNCTION update_leaderboard_on_xp();

-- Función para actualizar contadores del leaderboard
CREATE OR REPLACE FUNCTION update_leaderboard_counters(
  p_user_id UUID,
  p_counter TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.training_leaderboard (user_id, last_activity_at)
  VALUES (p_user_id, now())
  ON CONFLICT (user_id) DO NOTHING;

  IF p_counter = 'courses_completed' THEN
    UPDATE public.training_leaderboard SET courses_completed = courses_completed + p_increment, updated_at = now() WHERE user_id = p_user_id;
  ELSIF p_counter = 'quizzes_passed' THEN
    UPDATE public.training_leaderboard SET quizzes_passed = quizzes_passed + p_increment, updated_at = now() WHERE user_id = p_user_id;
  ELSIF p_counter = 'certificates_earned' THEN
    UPDATE public.training_leaderboard SET certificates_earned = certificates_earned + p_increment, updated_at = now() WHERE user_id = p_user_id;
  ELSIF p_counter = 'badges_count' THEN
    UPDATE public.training_leaderboard SET badges_count = badges_count + p_increment, updated_at = now() WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;