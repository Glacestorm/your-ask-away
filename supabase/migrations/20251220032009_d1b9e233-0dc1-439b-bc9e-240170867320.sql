-- Add Stripe integration columns to pricing_tiers
ALTER TABLE public.pricing_tiers 
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS tier_key TEXT UNIQUE;

-- Update pricing_tiers to reflect the 3 strategic layers
UPDATE public.pricing_tiers SET 
  name = 'Core',
  description = 'CRM/ERP base + reporting. Para entrar.',
  base_price = 49.00,
  max_users = 5,
  max_companies = 1,
  tier_key = 'core',
  stripe_product_id = 'prod_TdXhOLUpMcefUE',
  stripe_price_id = 'price_1SgGbv4BQ21V0AcNsCQtyHIW'
WHERE sort_order = 1;

UPDATE public.pricing_tiers SET 
  name = 'Automation',
  description = 'BPMN + Customer Journeys + CDP lite. Donde está el margen.',
  base_price = 149.00,
  max_users = 25,
  max_companies = 5,
  tier_key = 'automation',
  stripe_product_id = 'prod_TdXhglG1w6Q2ur',
  stripe_price_id = 'price_1SgGc84BQ21V0AcNt1vodklJ'
WHERE sort_order = 2;

UPDATE public.pricing_tiers SET 
  name = 'Industry Pack',
  description = 'Verticales sectoriales: Banca, Seguros, Fintech. Ticket alto + setup.',
  base_price = 499.00,
  max_users = NULL,
  max_companies = NULL,
  tier_key = 'industry',
  stripe_product_id = 'prod_TdXhBkK3ElHpjy',
  stripe_price_id = 'price_1SgGcI4BQ21V0AcNtxvqwd6B'
WHERE sort_order = 3;

-- Create user_subscriptions table to track subscription status
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_key TEXT NOT NULL,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role / admins can manage subscriptions
CREATE POLICY "Admins can manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'superadmin')
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();