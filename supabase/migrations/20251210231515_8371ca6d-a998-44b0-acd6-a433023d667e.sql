-- Extender tabla de notificaciones para soportar más metadatos
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS source_system TEXT DEFAULT 'internal',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS action_label TEXT,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_status JSONB DEFAULT '{}';