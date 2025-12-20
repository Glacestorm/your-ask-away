-- Pricing Tiers table
CREATE TABLE public.pricing_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  billing_period TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'annual')),
  max_users INTEGER,
  max_companies INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pricing Addons table  
CREATE TABLE public.pricing_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  addon_type TEXT NOT NULL DEFAULT 'feature' CHECK (addon_type IN ('feature', 'users', 'storage', 'support')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Industry Packs table
CREATE TABLE public.industry_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  industry_key TEXT NOT NULL UNIQUE,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  included_modules TEXT[] DEFAULT '{}',
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_packs ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Anyone can view active pricing tiers" ON public.pricing_tiers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active pricing addons" ON public.pricing_addons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active industry packs" ON public.industry_packs
  FOR SELECT USING (is_active = true);

-- Admin management policies (using user_roles table)
CREATE POLICY "Admins can manage pricing tiers" ON public.pricing_tiers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can manage pricing addons" ON public.pricing_addons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can manage industry packs" ON public.industry_packs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Insert initial pricing tiers
INSERT INTO public.pricing_tiers (name, description, base_price, billing_period, max_users, max_companies, features, sort_order) VALUES
('Starter', 'Para pequeñas empresas que comienzan', 49.00, 'monthly', 5, 1, '["Dashboard básico", "Gestión de clientes", "Reportes mensuales", "Soporte por email"]', 1),
('Professional', 'Para empresas en crecimiento', 149.00, 'monthly', 25, 5, '["Todo de Starter", "Analytics avanzado", "Integraciones API", "Workflows automatizados", "Soporte prioritario"]', 2),
('Enterprise', 'Para grandes organizaciones', 499.00, 'monthly', NULL, NULL, '["Todo de Professional", "Usuarios ilimitados", "SSO/SAML", "SLA garantizado", "Gerente de cuenta dedicado", "Personalización completa"]', 3);

-- Insert initial addons
INSERT INTO public.pricing_addons (name, description, price, addon_type) VALUES
('Pack 10 usuarios adicionales', 'Añade 10 usuarios a tu plan', 29.00, 'users'),
('Almacenamiento extra 100GB', 'Almacenamiento adicional para documentos', 19.00, 'storage'),
('Soporte 24/7', 'Acceso a soporte técnico las 24 horas', 99.00, 'support'),
('Módulo IA Avanzado', 'Capacidades de IA para predicciones y automatización', 79.00, 'feature');

-- Insert initial industry packs  
INSERT INTO public.industry_packs (name, description, industry_key, base_price, included_modules, features) VALUES
('Pack Banca', 'Solución completa para entidades bancarias', 'banking', 299.00, ARRAY['compliance', 'risk', 'audit'], '["Cumplimiento CNBV", "Gestión de riesgos", "Reportes regulatorios", "PLD/FT"]'),
('Pack Seguros', 'Gestión integral para aseguradoras', 'insurance', 249.00, ARRAY['claims', 'policies', 'compliance'], '["Gestión de pólizas", "Tramitación de siniestros", "Cumplimiento CNSF"]'),
('Pack Fintech', 'Para empresas de tecnología financiera', 'fintech', 199.00, ARRAY['compliance', 'api', 'analytics'], '["APIs financieras", "Cumplimiento regulatorio", "Analytics en tiempo real"]');

-- Create updated_at triggers
CREATE TRIGGER update_pricing_tiers_updated_at
  BEFORE UPDATE ON public.pricing_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_addons_updated_at
  BEFORE UPDATE ON public.pricing_addons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_industry_packs_updated_at
  BEFORE UPDATE ON public.industry_packs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();