-- Create generated_modules table for AI-generated sector-specific modules
CREATE TABLE public.generated_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cnae_code TEXT NOT NULL,
  module_key TEXT NOT NULL UNIQUE,
  module_name TEXT NOT NULL,
  sector TEXT NOT NULL,
  sector_name TEXT NOT NULL,
  description TEXT,
  components JSONB DEFAULT '[]'::jsonb,
  regulations JSONB DEFAULT '[]'::jsonb,
  kpis JSONB DEFAULT '[]'::jsonb,
  accounting_ratios JSONB DEFAULT '{}'::jsonb,
  visit_form_config JSONB DEFAULT '{}'::jsonb,
  compliance_panel_config JSONB DEFAULT '{}'::jsonb,
  ai_generated BOOLEAN DEFAULT true,
  generation_metadata JSONB DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_modules ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage generated modules"
ON public.generated_modules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('superadmin', 'admin', 'director_comercial')
  )
);

CREATE POLICY "All authenticated users can view published modules"
ON public.generated_modules
FOR SELECT
USING (is_published = true AND auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_generated_modules_updated_at
BEFORE UPDATE ON public.generated_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();