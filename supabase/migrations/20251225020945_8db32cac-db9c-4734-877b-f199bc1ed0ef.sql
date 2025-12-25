-- =============================================
-- ACADEMIA TABLES - Fase 6 Complete
-- =============================================

-- 1. Tabla de Cursos
CREATE TABLE public.academia_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  level TEXT NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  duration_hours INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  instructor_id UUID REFERENCES public.profiles(id),
  instructor_name TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  prerequisites TEXT[] DEFAULT '{}',
  learning_objectives TEXT[] DEFAULT '{}',
  total_lessons INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Módulos de Curso
CREATE TABLE public.academia_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.academia_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Lecciones
CREATE TABLE public.academia_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.academia_modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.academia_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  duration_minutes INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  lesson_type TEXT DEFAULT 'video' CHECK (lesson_type IN ('video', 'text', 'quiz', 'assignment', 'interactive')),
  is_preview BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  resources JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Inscripciones
CREATE TABLE public.academia_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.academia_courses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  progress_percentage INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  certificate_issued BOOLEAN DEFAULT false,
  certificate_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- 5. Progreso de Lecciones
CREATE TABLE public.academia_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.academia_lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.academia_courses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- 6. Reseñas de Cursos
CREATE TABLE public.academia_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.academia_courses(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- 7. Certificados
CREATE TABLE public.academia_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.academia_courses(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.academia_enrollments(id),
  certificate_code TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now(),
  pdf_url TEXT,
  verification_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Comunidad - Posts
CREATE TABLE public.academia_community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.academia_courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'discussion' CHECK (post_type IN ('discussion', 'question', 'resource', 'announcement')),
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  is_solved BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Comunidad - Comentarios
CREATE TABLE public.academia_community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.academia_community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.academia_community_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_solution BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Likes de la comunidad
CREATE TABLE public.academia_community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.academia_community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.academia_community_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id),
  CHECK (post_id IS NOT NULL OR comment_id IS NOT NULL)
);

-- 11. Notificaciones Academia
CREATE TABLE public.academia_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('course_update', 'new_lesson', 'certificate', 'community_reply', 'achievement', 'reminder', 'announcement')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  course_id UUID REFERENCES public.academia_courses(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Logros/Achievements
CREATE TABLE public.academia_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  badge_url TEXT,
  points INTEGER DEFAULT 0,
  criteria JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Logros de Usuario
CREATE TABLE public.academia_user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.academia_achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, achievement_id)
);

-- Índices
CREATE INDEX idx_academia_courses_category ON public.academia_courses(category);
CREATE INDEX idx_academia_courses_level ON public.academia_courses(level);
CREATE INDEX idx_academia_courses_published ON public.academia_courses(is_published);
CREATE INDEX idx_academia_enrollments_user ON public.academia_enrollments(user_id);
CREATE INDEX idx_academia_enrollments_course ON public.academia_enrollments(course_id);
CREATE INDEX idx_academia_lesson_progress_user ON public.academia_lesson_progress(user_id);
CREATE INDEX idx_academia_community_posts_course ON public.academia_community_posts(course_id);
CREATE INDEX idx_academia_notifications_user ON public.academia_notifications(user_id);
CREATE INDEX idx_academia_notifications_unread ON public.academia_notifications(user_id, is_read) WHERE is_read = false;

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_academia_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_academia_courses_timestamp BEFORE UPDATE ON public.academia_courses FOR EACH ROW EXECUTE FUNCTION update_academia_timestamp();
CREATE TRIGGER update_academia_modules_timestamp BEFORE UPDATE ON public.academia_modules FOR EACH ROW EXECUTE FUNCTION update_academia_timestamp();
CREATE TRIGGER update_academia_lessons_timestamp BEFORE UPDATE ON public.academia_lessons FOR EACH ROW EXECUTE FUNCTION update_academia_timestamp();
CREATE TRIGGER update_academia_enrollments_timestamp BEFORE UPDATE ON public.academia_enrollments FOR EACH ROW EXECUTE FUNCTION update_academia_timestamp();
CREATE TRIGGER update_academia_lesson_progress_timestamp BEFORE UPDATE ON public.academia_lesson_progress FOR EACH ROW EXECUTE FUNCTION update_academia_timestamp();
CREATE TRIGGER update_academia_reviews_timestamp BEFORE UPDATE ON public.academia_reviews FOR EACH ROW EXECUTE FUNCTION update_academia_timestamp();
CREATE TRIGGER update_academia_community_posts_timestamp BEFORE UPDATE ON public.academia_community_posts FOR EACH ROW EXECUTE FUNCTION update_academia_timestamp();
CREATE TRIGGER update_academia_community_comments_timestamp BEFORE UPDATE ON public.academia_community_comments FOR EACH ROW EXECUTE FUNCTION update_academia_timestamp();

-- RLS
ALTER TABLE public.academia_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academia_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academia_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academia_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academia_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academia_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academia_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academia_community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academia_community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academia_community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academia_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academia_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academia_user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies: Cursos (públicos para lectura)
CREATE POLICY "Courses are viewable by everyone" ON public.academia_courses FOR SELECT USING (is_published = true);
CREATE POLICY "Instructors can manage their courses" ON public.academia_courses FOR ALL USING (auth.uid() = instructor_id);
CREATE POLICY "Admins can manage all courses" ON public.academia_courses FOR ALL USING (is_admin_or_superadmin(auth.uid()));

-- Policies: Módulos y Lecciones (visibles si curso publicado)
CREATE POLICY "Modules viewable for published courses" ON public.academia_modules FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.academia_courses WHERE id = course_id AND is_published = true)
);
CREATE POLICY "Lessons viewable for published courses" ON public.academia_lessons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.academia_courses WHERE id = course_id AND is_published = true)
);

-- Policies: Inscripciones (usuario ve las suyas)
CREATE POLICY "Users view own enrollments" ON public.academia_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can enroll" ON public.academia_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own enrollments" ON public.academia_enrollments FOR UPDATE USING (auth.uid() = user_id);

-- Policies: Progreso (usuario ve el suyo)
CREATE POLICY "Users view own progress" ON public.academia_lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON public.academia_lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users modify own progress" ON public.academia_lesson_progress FOR UPDATE USING (auth.uid() = user_id);

-- Policies: Reviews
CREATE POLICY "Reviews are public" ON public.academia_reviews FOR SELECT USING (true);
CREATE POLICY "Users can write reviews" ON public.academia_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.academia_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews" ON public.academia_reviews FOR DELETE USING (auth.uid() = user_id);

-- Policies: Certificados
CREATE POLICY "Users view own certificates" ON public.academia_certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Certificates verifiable by code" ON public.academia_certificates FOR SELECT USING (certificate_code IS NOT NULL);

-- Policies: Comunidad
CREATE POLICY "Community posts are public" ON public.academia_community_posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON public.academia_community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own posts" ON public.academia_community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own posts" ON public.academia_community_posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Comments are public" ON public.academia_community_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON public.academia_community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own comments" ON public.academia_community_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.academia_community_comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can like" ON public.academia_community_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view likes" ON public.academia_community_likes FOR SELECT USING (true);
CREATE POLICY "Users remove own likes" ON public.academia_community_likes FOR DELETE USING (auth.uid() = user_id);

-- Policies: Notificaciones
CREATE POLICY "Users view own notifications" ON public.academia_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.academia_notifications FOR UPDATE USING (auth.uid() = user_id);

-- Policies: Achievements
CREATE POLICY "Achievements are public" ON public.academia_achievements FOR SELECT USING (is_active = true);
CREATE POLICY "Users view own achievements" ON public.academia_user_achievements FOR SELECT USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.academia_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.academia_community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.academia_community_comments;