-- Tabla para historial de chat del tutor (sin FK a lessons)
CREATE TABLE IF NOT EXISTS public.training_chat_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    course_id UUID NOT NULL,
    lesson_id UUID,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_training_chat_history_user_course ON public.training_chat_history(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_training_chat_history_created ON public.training_chat_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.training_chat_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own chat history" ON public.training_chat_history;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.training_chat_history;

-- Usuarios solo ven su propio historial
CREATE POLICY "Users can view own chat history"
ON public.training_chat_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
ON public.training_chat_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);