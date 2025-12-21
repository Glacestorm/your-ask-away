-- Create testimonials table for structured testimonials
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  author_name TEXT NOT NULL,
  author_role TEXT,
  author_avatar_url TEXT,
  quote TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  metrics JSONB DEFAULT '[]'::jsonb,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Public read access for testimonials (marketing content)
CREATE POLICY "Testimonials are publicly readable" 
ON public.testimonials 
FOR SELECT 
USING (is_active = true);

-- Create index for performance
CREATE INDEX idx_testimonials_sector ON public.testimonials(sector_id);
CREATE INDEX idx_testimonials_featured ON public.testimonials(is_featured) WHERE is_featured = true;

-- Add trigger for updated_at
CREATE TRIGGER update_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample testimonials
INSERT INTO public.testimonials (company_name, author_name, author_role, quote, rating, is_featured, metrics) VALUES
('Construcciones Martínez', 'Carlos Martínez', 'Director General', 'Obelixia nos ha permitido reducir el tiempo de gestión documental en un 60%. La automatización de procesos ha sido clave para nuestra expansión.', 5, true, '[{"label": "Ahorro tiempo", "value": "60%"}, {"label": "ROI", "value": "340%"}]'),
('Farmacia Central', 'Ana López', 'Directora Técnica', 'El cumplimiento normativo automatizado nos da tranquilidad. Ya no tenemos que preocuparnos por auditorías sorpresa.', 5, true, '[{"label": "Cumplimiento", "value": "100%"}, {"label": "Incidencias", "value": "-85%"}]'),
('Logística Express', 'Roberto Sanz', 'CEO', 'La visibilidad en tiempo real de nuestra flota ha transformado completamente nuestras operaciones. Los clientes están más satisfechos que nunca.', 5, true, '[{"label": "Eficiencia", "value": "+45%"}, {"label": "Satisfacción", "value": "98%"}]'),
('Grupo Educativo Norte', 'María García', 'Coordinadora Académica', 'La plataforma ha unificado todos nuestros centros. La comunicación con familias es ahora instantánea y efectiva.', 4, true, '[{"label": "Comunicación", "value": "+80%"}, {"label": "Gestión", "value": "-50%"}]');