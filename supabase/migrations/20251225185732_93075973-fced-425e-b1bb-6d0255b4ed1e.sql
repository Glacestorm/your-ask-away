-- =====================================================
-- FASE 1: AI Agents - Columnas y Tablas Faltantes
-- =====================================================

-- 1. Añadir columna status a copilot_predictions
ALTER TABLE public.copilot_predictions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Añadir columna acted_on_at a copilot_predictions
ALTER TABLE public.copilot_predictions 
ADD COLUMN IF NOT EXISTS acted_on_at TIMESTAMPTZ;

-- 3. Añadir columna prediction_data a copilot_predictions (para almacenar el objeto completo)
ALTER TABLE public.copilot_predictions 
ADD COLUMN IF NOT EXISTS prediction_data JSONB;

-- 4. Añadir columna context_snapshot a copilot_predictions
ALTER TABLE public.copilot_predictions 
ADD COLUMN IF NOT EXISTS context_snapshot JSONB;

-- 5. Crear tabla copilot_configurations
CREATE TABLE IF NOT EXISTS public.copilot_configurations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    learning_enabled BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}',
    enabled_features TEXT[] DEFAULT ARRAY['predictions', 'suggestions', 'automation'],
    notification_settings JSONB DEFAULT '{"push": true, "sound": true}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- 6. Crear tabla voice_sessions
CREATE TABLE IF NOT EXISTS public.voice_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    status TEXT DEFAULT 'active',
    session_type TEXT DEFAULT 'command',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    total_duration_seconds INTEGER DEFAULT 0,
    commands_count INTEGER DEFAULT 0,
    context_data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Añadir columnas faltantes a voice_commands existente
ALTER TABLE public.voice_commands 
ADD COLUMN IF NOT EXISTS command_text TEXT;

ALTER TABLE public.voice_commands 
ADD COLUMN IF NOT EXISTS parsed_command JSONB;

ALTER TABLE public.voice_commands 
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5,2);

-- Actualizar voice_commands.command_text desde transcript si está vacío
UPDATE public.voice_commands 
SET command_text = transcript 
WHERE command_text IS NULL AND transcript IS NOT NULL;

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE public.copilot_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

-- copilot_configurations policies
DROP POLICY IF EXISTS "Users can view their own copilot config" ON public.copilot_configurations;
CREATE POLICY "Users can view their own copilot config" 
ON public.copilot_configurations FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own copilot config" ON public.copilot_configurations;
CREATE POLICY "Users can insert their own copilot config" 
ON public.copilot_configurations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own copilot config" ON public.copilot_configurations;
CREATE POLICY "Users can update their own copilot config" 
ON public.copilot_configurations FOR UPDATE 
USING (auth.uid() = user_id);

-- voice_sessions policies
DROP POLICY IF EXISTS "Users can view their own voice sessions" ON public.voice_sessions;
CREATE POLICY "Users can view their own voice sessions" 
ON public.voice_sessions FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own voice sessions" ON public.voice_sessions;
CREATE POLICY "Users can insert their own voice sessions" 
ON public.voice_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own voice sessions" ON public.voice_sessions;
CREATE POLICY "Users can update their own voice sessions" 
ON public.voice_sessions FOR UPDATE 
USING (auth.uid() = user_id);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_copilot_configs_user ON public.copilot_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user ON public.voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_status ON public.voice_sessions(status);
CREATE INDEX IF NOT EXISTS idx_copilot_predictions_status ON public.copilot_predictions(status);

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_copilot_configurations_updated_at ON public.copilot_configurations;
CREATE TRIGGER update_copilot_configurations_updated_at
BEFORE UPDATE ON public.copilot_configurations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_sessions_updated_at ON public.voice_sessions;
CREATE TRIGGER update_voice_sessions_updated_at
BEFORE UPDATE ON public.voice_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();