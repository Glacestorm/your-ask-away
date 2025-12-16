-- Store Orders table
CREATE TABLE public.store_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE DEFAULT 'ORD-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  company_name TEXT,
  tax_id TEXT,
  country TEXT DEFAULT 'ES',
  billing_address TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  promo_code TEXT,
  license_type TEXT DEFAULT 'annual' CHECK (license_type IN ('annual', 'perpetual', 'monthly')),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Store Order Items table
CREATE TABLE public.store_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.app_modules(id),
  module_key TEXT NOT NULL,
  module_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  total_price DECIMAL(12,2) NOT NULL,
  license_duration_months INTEGER DEFAULT 12,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Store Cart table (persistent cart)
CREATE TABLE public.store_cart (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID,
  module_id UUID REFERENCES public.app_modules(id),
  module_key TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  license_type TEXT DEFAULT 'annual',
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, module_key)
);

-- Store Bundles table
CREATE TABLE public.store_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_key TEXT NOT NULL UNIQUE,
  bundle_name TEXT NOT NULL,
  description TEXT,
  module_keys TEXT[] NOT NULL,
  original_price DECIMAL(12,2) NOT NULL,
  bundle_price DECIMAL(12,2) NOT NULL,
  discount_percent DECIMAL(5,2) NOT NULL,
  badge TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Store Promotions table
CREATE TABLE public.store_promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(12,2) NOT NULL,
  min_order_amount DECIMAL(12,2),
  max_discount_amount DECIMAL(12,2),
  applicable_modules TEXT[],
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for store_orders (users see their own orders)
CREATE POLICY "Anyone can create orders" ON public.store_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view orders by email" ON public.store_orders FOR SELECT USING (true);
CREATE POLICY "Admins can update orders" ON public.store_orders FOR UPDATE USING (true);

-- RLS Policies for store_order_items
CREATE POLICY "Anyone can create order items" ON public.store_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view order items" ON public.store_order_items FOR SELECT USING (true);

-- RLS Policies for store_cart
CREATE POLICY "Anyone can manage cart" ON public.store_cart FOR ALL USING (true);

-- RLS Policies for store_bundles (public read)
CREATE POLICY "Anyone can view bundles" ON public.store_bundles FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage bundles" ON public.store_bundles FOR ALL USING (true);

-- RLS Policies for store_promotions
CREATE POLICY "Anyone can view active promotions" ON public.store_promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage promotions" ON public.store_promotions FOR ALL USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_store_orders_updated_at BEFORE UPDATE ON public.store_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_cart_updated_at BEFORE UPDATE ON public.store_cart
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_bundles_updated_at BEFORE UPDATE ON public.store_bundles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default bundles
INSERT INTO public.store_bundles (bundle_key, bundle_name, description, module_keys, original_price, bundle_price, discount_percent, badge, is_featured) VALUES
('starter', 'Pack Starter', 'Módulos esenciales para comenzar: Core + Documentación + Visitas', ARRAY['core', 'documentation', 'visits'], 180000, 120000, 33, 'Popular', true),
('banking_complete', 'Pack Banca Completo', 'Todos los módulos especializados en banca y finanzas', ARRAY['core', 'accounting', 'audit', 'banking_ai', 'compliance', 'risk_management'], 650000, 500000, 23, 'Recomendado', true),
('enterprise', 'Pack Enterprise', 'Licencia perpetua con todos los módulos incluidos', ARRAY['core', 'accounting', 'audit', 'banking_ai', 'compliance', 'risk_management', 'documentation', 'visits', 'goals', 'notifications', 'analytics', 'reports'], 1500000, 880000, 41, 'Mejor Valor', true);

-- Insert default promotions
INSERT INTO public.store_promotions (promo_code, description, discount_type, discount_value, min_order_amount) VALUES
('WELCOME10', 'Descuento de bienvenida del 10%', 'percentage', 10, 50000),
('ENTERPRISE50', 'Descuento especial para empresas', 'fixed', 50000, 300000);