-- =============================================
-- FASE 0: Tablas para ObelixIA Academia
-- =============================================

-- 1. TRAINING_COURSES: Cursos principales
CREATE TABLE public.training_courses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_key TEXT NOT NULL UNIQUE,
    title JSONB NOT NULL DEFAULT '{"es": "", "en": ""}',
    slug TEXT NOT NULL UNIQUE,
    description JSONB DEFAULT '{"es": "", "en": ""}',
    short_description JSONB DEFAULT '{"es": "", "en": ""}',
    thumbnail_url TEXT,
    preview_video_url TEXT,
    instructor_id UUID REFERENCES public.profiles(id),
    instructor_name TEXT,
    instructor_avatar TEXT,
    instructor_bio JSONB DEFAULT '{}',
    category TEXT NOT NULL DEFAULT 'general',
    subcategory TEXT,
    level TEXT NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    duration_hours NUMERIC(5,1) DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    base_price NUMERIC(10,2) DEFAULT 0,
    sale_price NUMERIC(10,2),
    currency TEXT DEFAULT 'EUR',
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    is_free BOOLEAN DEFAULT false,
    requires_certification BOOLEAN DEFAULT false,
    certification_passing_score INTEGER DEFAULT 70,
    language TEXT DEFAULT 'es',
    tags TEXT[] DEFAULT '{}',
    learning_objectives JSONB DEFAULT '[]',
    requirements JSONB DEFAULT '[]',
    target_audience JSONB DEFAULT '[]',
    rating_average NUMERIC(2,1) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    enrollment_count INTEGER DEFAULT 0,
    completion_rate NUMERIC(5,2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    seo_title TEXT,
    seo_description TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TRAINING_MODULES: Módulos/secciones de cada curso
CREATE TABLE public.training_modules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
    module_key TEXT NOT NULL,
    title JSONB NOT NULL DEFAULT '{"es": "", "en": ""}',
    description JSONB DEFAULT '{"es": "", "en": ""}',
    sort_order INTEGER DEFAULT 0,
    is_preview BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT true,
    unlock_after_days INTEGER DEFAULT 0,
    duration_minutes INTEGER DEFAULT 0,
    lesson_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(course_id, module_key)
);

-- 3. TRAINING_CONTENT: Contenido multimedia (lecciones)
CREATE TABLE public.training_content (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('video', 'pdf', 'audio', 'image', 'text', 'quiz', 'assignment', 'download', 'embed', 'avatar_video')),
    title JSONB NOT NULL DEFAULT '{"es": "", "en": ""}',
    description JSONB DEFAULT '{"es": "", "en": ""}',
    content_url TEXT,
    external_url TEXT,
    thumbnail_url TEXT,
    duration_seconds INTEGER DEFAULT 0,
    file_size_bytes BIGINT DEFAULT 0,
    file_type TEXT,
    transcript JSONB DEFAULT '{}',
    captions JSONB DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    is_preview BOOLEAN DEFAULT false,
    is_downloadable BOOLEAN DEFAULT false,
    is_required BOOLEAN DEFAULT true,
    quiz_data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TRAINING_ENROLLMENTS: Inscripciones de usuarios
CREATE TABLE public.training_enrollments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled', 'paused')),
    enrollment_type TEXT DEFAULT 'purchase' CHECK (enrollment_type IN ('purchase', 'gift', 'promo', 'free', 'subscription', 'bundle')),
    price_paid NUMERIC(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'EUR',
    payment_id TEXT,
    promo_code TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    progress_percentage NUMERIC(5,2) DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    certificate_issued BOOLEAN DEFAULT false,
    certificate_id UUID,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, course_id)
);

-- 5. TRAINING_PROGRESS: Progreso por contenido/lección
CREATE TABLE public.training_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    enrollment_id UUID NOT NULL REFERENCES public.training_enrollments(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.training_content(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
    progress_percentage NUMERIC(5,2) DEFAULT 0,
    watch_time_seconds INTEGER DEFAULT 0,
    last_position_seconds INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    quiz_score NUMERIC(5,2),
    quiz_attempts INTEGER DEFAULT 0,
    notes TEXT,
    bookmarks JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(enrollment_id, content_id)
);

-- 6. TRAINING_CERTIFICATES: Certificados emitidos
CREATE TABLE public.training_certificates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    enrollment_id UUID NOT NULL REFERENCES public.training_enrollments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
    certificate_number TEXT NOT NULL UNIQUE,
    certificate_url TEXT,
    verification_code TEXT NOT NULL UNIQUE,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    score NUMERIC(5,2),
    grade TEXT,
    skills_acquired TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    is_valid BOOLEAN DEFAULT true,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TRAINING_REVIEWS: Reseñas y valoraciones
CREATE TABLE public.training_reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES public.training_enrollments(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT,
    pros TEXT[] DEFAULT '{}',
    cons TEXT[] DEFAULT '{}',
    is_verified_purchase BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    response_by_instructor TEXT,
    response_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, course_id)
);

-- 8. TRAINING_COURSE_KNOWLEDGE: Base de conocimiento para chatbot
CREATE TABLE public.training_course_knowledge (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
    content_id UUID REFERENCES public.training_content(id) ON DELETE SET NULL,
    chunk_index INTEGER DEFAULT 0,
    content_text TEXT NOT NULL,
    content_type TEXT DEFAULT 'lesson',
    embedding vector(1536),
    tokens_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_training_courses_category ON public.training_courses(category);
CREATE INDEX idx_training_courses_level ON public.training_courses(level);
CREATE INDEX idx_training_courses_published ON public.training_courses(is_published);
CREATE INDEX idx_training_courses_featured ON public.training_courses(is_featured);
CREATE INDEX idx_training_courses_slug ON public.training_courses(slug);

CREATE INDEX idx_training_modules_course ON public.training_modules(course_id);
CREATE INDEX idx_training_modules_order ON public.training_modules(course_id, sort_order);

CREATE INDEX idx_training_content_module ON public.training_content(module_id);
CREATE INDEX idx_training_content_type ON public.training_content(content_type);
CREATE INDEX idx_training_content_order ON public.training_content(module_id, sort_order);

CREATE INDEX idx_training_enrollments_user ON public.training_enrollments(user_id);
CREATE INDEX idx_training_enrollments_course ON public.training_enrollments(course_id);
CREATE INDEX idx_training_enrollments_status ON public.training_enrollments(status);

CREATE INDEX idx_training_progress_enrollment ON public.training_progress(enrollment_id);
CREATE INDEX idx_training_progress_content ON public.training_progress(content_id);

CREATE INDEX idx_training_certificates_user ON public.training_certificates(user_id);
CREATE INDEX idx_training_certificates_course ON public.training_certificates(course_id);
CREATE INDEX idx_training_certificates_verification ON public.training_certificates(verification_code);

CREATE INDEX idx_training_reviews_course ON public.training_reviews(course_id);
CREATE INDEX idx_training_reviews_rating ON public.training_reviews(course_id, rating);

CREATE INDEX idx_training_knowledge_course ON public.training_course_knowledge(course_id);
CREATE INDEX idx_training_knowledge_embedding ON public.training_course_knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_course_knowledge ENABLE ROW LEVEL SECURITY;

-- Courses: Público para ver publicados, admins para todo
CREATE POLICY "Anyone can view published courses" ON public.training_courses
    FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all courses" ON public.training_courses
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'superadmin'))
    );

-- Modules: Público para ver de cursos publicados
CREATE POLICY "Anyone can view modules of published courses" ON public.training_modules
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.training_courses c WHERE c.id = course_id AND c.is_published = true)
    );

CREATE POLICY "Admins can manage all modules" ON public.training_modules
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'superadmin'))
    );

-- Content: Preview público, resto requiere inscripción
CREATE POLICY "Anyone can view preview content" ON public.training_content
    FOR SELECT USING (is_preview = true);

CREATE POLICY "Enrolled users can view course content" ON public.training_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.training_enrollments e
            JOIN public.training_modules m ON m.course_id = e.course_id
            WHERE m.id = training_content.module_id
            AND e.user_id = auth.uid()
            AND e.status = 'active'
        )
    );

CREATE POLICY "Admins can manage all content" ON public.training_content
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'superadmin'))
    );

-- Enrollments: Usuario ve las suyas, admins todas
CREATE POLICY "Users can view own enrollments" ON public.training_enrollments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own enrollments" ON public.training_enrollments
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own enrollments" ON public.training_enrollments
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all enrollments" ON public.training_enrollments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'superadmin'))
    );

-- Progress: Usuario ve el suyo
CREATE POLICY "Users can manage own progress" ON public.training_progress
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.training_enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid())
    );

CREATE POLICY "Admins can view all progress" ON public.training_progress
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'superadmin'))
    );

-- Certificates: Público para verificar, usuario ve los suyos
CREATE POLICY "Anyone can verify certificates" ON public.training_certificates
    FOR SELECT USING (is_valid = true);

CREATE POLICY "Users can view own certificates" ON public.training_certificates
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage certificates" ON public.training_certificates
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'superadmin'))
    );

-- Reviews: Público para ver aprobadas, usuario gestiona las suyas
CREATE POLICY "Anyone can view approved reviews" ON public.training_reviews
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can manage own reviews" ON public.training_reviews
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all reviews" ON public.training_reviews
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'superadmin'))
    );

-- Knowledge: Solo admins y edge functions
CREATE POLICY "Admins can manage course knowledge" ON public.training_course_knowledge
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'superadmin'))
    );

-- =============================================
-- TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION public.update_training_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_training_courses_timestamp
    BEFORE UPDATE ON public.training_courses
    FOR EACH ROW EXECUTE FUNCTION public.update_training_timestamp();

CREATE TRIGGER update_training_modules_timestamp
    BEFORE UPDATE ON public.training_modules
    FOR EACH ROW EXECUTE FUNCTION public.update_training_timestamp();

CREATE TRIGGER update_training_content_timestamp
    BEFORE UPDATE ON public.training_content
    FOR EACH ROW EXECUTE FUNCTION public.update_training_timestamp();

CREATE TRIGGER update_training_enrollments_timestamp
    BEFORE UPDATE ON public.training_enrollments
    FOR EACH ROW EXECUTE FUNCTION public.update_training_timestamp();

CREATE TRIGGER update_training_progress_timestamp
    BEFORE UPDATE ON public.training_progress
    FOR EACH ROW EXECUTE FUNCTION public.update_training_timestamp();

CREATE TRIGGER update_training_reviews_timestamp
    BEFORE UPDATE ON public.training_reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_training_timestamp();

-- =============================================
-- FUNCIÓN PARA ACTUALIZAR ESTADÍSTICAS DEL CURSO
-- =============================================
CREATE OR REPLACE FUNCTION public.update_course_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_course_id UUID;
    v_avg_rating NUMERIC;
    v_rating_count INTEGER;
    v_enrollment_count INTEGER;
BEGIN
    -- Determinar course_id según la tabla
    IF TG_TABLE_NAME = 'training_reviews' THEN
        v_course_id := COALESCE(NEW.course_id, OLD.course_id);
    ELSIF TG_TABLE_NAME = 'training_enrollments' THEN
        v_course_id := COALESCE(NEW.course_id, OLD.course_id);
    END IF;

    IF v_course_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Calcular estadísticas
    SELECT AVG(rating)::NUMERIC(2,1), COUNT(*) 
    INTO v_avg_rating, v_rating_count
    FROM public.training_reviews 
    WHERE course_id = v_course_id AND is_approved = true;

    SELECT COUNT(*) INTO v_enrollment_count
    FROM public.training_enrollments 
    WHERE course_id = v_course_id AND status IN ('active', 'completed');

    -- Actualizar curso
    UPDATE public.training_courses SET
        rating_average = COALESCE(v_avg_rating, 0),
        rating_count = COALESCE(v_rating_count, 0),
        enrollment_count = COALESCE(v_enrollment_count, 0),
        updated_at = now()
    WHERE id = v_course_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_course_stats_on_review
    AFTER INSERT OR UPDATE OR DELETE ON public.training_reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_course_stats();

CREATE TRIGGER trigger_update_course_stats_on_enrollment
    AFTER INSERT OR UPDATE OR DELETE ON public.training_enrollments
    FOR EACH ROW EXECUTE FUNCTION public.update_course_stats();