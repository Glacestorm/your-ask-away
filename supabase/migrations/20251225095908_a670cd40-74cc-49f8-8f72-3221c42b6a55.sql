-- Tabla para almacenar datos de estado emocional del estudiante
CREATE TABLE public.academia_emotional_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES public.academia_courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.academia_lessons(id) ON DELETE SET NULL,
    session_id UUID NOT NULL,
    emotional_state TEXT NOT NULL DEFAULT 'neutral',
    confidence_score NUMERIC(5,4) DEFAULT 0.5,
    engagement_level NUMERIC(5,4) DEFAULT 0.5,
    frustration_indicators JSONB DEFAULT '{}',
    attention_metrics JSONB DEFAULT '{}',
    interaction_patterns JSONB DEFAULT '{}',
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para sesiones de voz AI
CREATE TABLE public.academia_voice_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES public.academia_courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.academia_lessons(id) ON DELETE SET NULL,
    session_type TEXT NOT NULL DEFAULT 'voice_tutor',
    status TEXT NOT NULL DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE,
    total_duration_seconds INTEGER DEFAULT 0,
    messages_count INTEGER DEFAULT 0,
    emotional_summary JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para rendimiento
CREATE INDEX idx_emotional_analytics_user ON public.academia_emotional_analytics(user_id);
CREATE INDEX idx_emotional_analytics_session ON public.academia_emotional_analytics(session_id);
CREATE INDEX idx_emotional_analytics_course ON public.academia_emotional_analytics(course_id);
CREATE INDEX idx_voice_sessions_user ON public.academia_voice_sessions(user_id);
CREATE INDEX idx_voice_sessions_course ON public.academia_voice_sessions(course_id);

-- Enable RLS
ALTER TABLE public.academia_emotional_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academia_voice_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para emotional analytics
CREATE POLICY "Users can view their own emotional analytics"
ON public.academia_emotional_analytics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emotional analytics"
ON public.academia_emotional_analytics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para voice sessions
CREATE POLICY "Users can view their own voice sessions"
ON public.academia_voice_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice sessions"
ON public.academia_voice_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice sessions"
ON public.academia_voice_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Enable realtime for voice sessions (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.academia_voice_sessions;