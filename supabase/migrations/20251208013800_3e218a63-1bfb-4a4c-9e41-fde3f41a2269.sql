-- ================================================
-- MIGRACIÓN: Nuevas funcionalidades para Fichas de Visita y Objetivos
-- ================================================

-- 1. FIRMA DIGITAL: Agregar campo para almacenar firma base64
ALTER TABLE public.visit_sheets 
ADD COLUMN IF NOT EXISTS firma_digital TEXT,
ADD COLUMN IF NOT EXISTS firma_fecha TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS firma_nombre_firmante TEXT;

-- 2. FOTOS ADJUNTAS: Crear tabla para fotos de fichas de visita
CREATE TABLE IF NOT EXISTS public.visit_sheet_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_sheet_id UUID NOT NULL REFERENCES public.visit_sheets(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_caption TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visit_sheet_photos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para fotos de fichas de visita
CREATE POLICY "Users can view visit sheet photos" 
ON public.visit_sheet_photos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.visit_sheets vs 
    WHERE vs.id = visit_sheet_id 
    AND (vs.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()) 
      OR has_role(auth.uid(), 'director_comercial')
      OR has_role(auth.uid(), 'director_oficina')
      OR has_role(auth.uid(), 'responsable_comercial'))
  )
);

CREATE POLICY "Users can insert their own visit sheet photos" 
ON public.visit_sheet_photos 
FOR INSERT 
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own visit sheet photos" 
ON public.visit_sheet_photos 
FOR DELETE 
USING (uploaded_by = auth.uid() OR is_admin_or_superadmin(auth.uid())
  OR has_role(auth.uid(), 'director_comercial')
  OR has_role(auth.uid(), 'responsable_comercial'));

-- 3. TEMPLATES PERSONALIZABLES: Crear tabla para plantillas de fichas
CREATE TABLE IF NOT EXISTS public.visit_sheet_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.visit_sheet_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para templates
CREATE POLICY "Authenticated users can view templates" 
ON public.visit_sheet_templates 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND active = true);

CREATE POLICY "Admin users can manage templates" 
ON public.visit_sheet_templates 
FOR ALL 
USING (
  is_admin_or_superadmin(auth.uid())
  OR has_role(auth.uid(), 'director_comercial')
  OR has_role(auth.uid(), 'responsable_comercial')
);

-- Agregar campo template_id a visit_sheets
ALTER TABLE public.visit_sheets 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.visit_sheet_templates(id);

-- 4. OBJETIVOS EN CASCADA: Agregar campos para jerarquía de objetivos
ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS parent_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS goal_level TEXT DEFAULT 'individual' CHECK (goal_level IN ('empresa', 'oficina', 'individual')),
ADD COLUMN IF NOT EXISTS office TEXT,
ADD COLUMN IF NOT EXISTS weight NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS contributes_to_parent BOOLEAN DEFAULT true;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_visit_sheet_photos_visit_sheet_id ON public.visit_sheet_photos(visit_sheet_id);
CREATE INDEX IF NOT EXISTS idx_visit_sheet_templates_active ON public.visit_sheet_templates(active);
CREATE INDEX IF NOT EXISTS idx_goals_parent_goal_id ON public.goals(parent_goal_id);
CREATE INDEX IF NOT EXISTS idx_goals_goal_level ON public.goals(goal_level);
CREATE INDEX IF NOT EXISTS idx_goals_office ON public.goals(office);

-- Crear bucket de storage para fotos de visitas
INSERT INTO storage.buckets (id, name, public)
VALUES ('visit-sheet-photos', 'visit-sheet-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para fotos de visitas
CREATE POLICY "Authenticated users can upload visit photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'visit-sheet-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view visit photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'visit-sheet-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own visit photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'visit-sheet-photos' AND auth.uid()::text = (storage.foldername(name))[1]);