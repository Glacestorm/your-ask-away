-- Add gestor and office targeting to alerts
ALTER TABLE public.alerts 
ADD COLUMN target_type text DEFAULT 'global' CHECK (target_type IN ('global', 'office', 'gestor')),
ADD COLUMN target_office text,
ADD COLUMN target_gestor_id uuid REFERENCES public.profiles(id);

-- Add index for faster lookups
CREATE INDEX idx_alerts_target_type ON public.alerts(target_type);
CREATE INDEX idx_alerts_target_office ON public.alerts(target_office);
CREATE INDEX idx_alerts_target_gestor ON public.alerts(target_gestor_id);