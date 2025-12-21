-- Add pricing_tier and certifications fields to sectors table
ALTER TABLE public.sectors 
ADD COLUMN IF NOT EXISTS pricing_tier TEXT DEFAULT 'professional' CHECK (pricing_tier IN ('basic', 'professional', 'enterprise'));

ALTER TABLE public.sectors 
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.sectors.pricing_tier IS 'Pricing tier for sector: basic, professional, or enterprise';
COMMENT ON COLUMN public.sectors.certifications IS 'Array of certifications like ISO, GDPR, SOC2 with name, icon, and description';

-- Update existing sectors with default certifications based on their type
UPDATE public.sectors 
SET certifications = '[
  {"name": "ISO 27001", "icon": "Shield", "description": "Seguridad de la información"},
  {"name": "GDPR", "icon": "Lock", "description": "Protección de datos EU"}
]'::jsonb
WHERE certifications = '[]'::jsonb OR certifications IS NULL;