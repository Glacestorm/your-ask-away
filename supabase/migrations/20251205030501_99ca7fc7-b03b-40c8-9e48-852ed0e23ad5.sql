-- Add validation workflow fields to visit_sheets table
ALTER TABLE public.visit_sheets 
ADD COLUMN IF NOT EXISTS productos_actuales jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS productos_ofrecidos jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS resultado_oferta text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS validation_status text DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS validated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS validation_notes text;

-- Add constraint for resultado_oferta values
ALTER TABLE public.visit_sheets 
ADD CONSTRAINT check_resultado_oferta 
CHECK (resultado_oferta IS NULL OR resultado_oferta IN ('pendiente', 'aceptado', 'rechazado', 'parcial'));

-- Add constraint for validation_status values
ALTER TABLE public.visit_sheets 
ADD CONSTRAINT check_validation_status 
CHECK (validation_status IN ('draft', 'pending_validation', 'approved', 'rejected'));

-- Create index for validation queries
CREATE INDEX IF NOT EXISTS idx_visit_sheets_validation_status ON public.visit_sheets(validation_status);
CREATE INDEX IF NOT EXISTS idx_visit_sheets_validated_by ON public.visit_sheets(validated_by);