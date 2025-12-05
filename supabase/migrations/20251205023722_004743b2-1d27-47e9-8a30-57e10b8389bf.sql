-- Create table for visit sheet audit history
CREATE TABLE public.visit_sheet_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_sheet_id uuid NOT NULL REFERENCES public.visit_sheets(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    changed_fields text[],
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visit_sheet_audit ENABLE ROW LEVEL SECURITY;

-- Directors can view audit history
CREATE POLICY "Directors can view visit sheet audit"
ON public.visit_sheet_audit
FOR SELECT
USING (
    has_role(auth.uid(), 'director_comercial'::app_role) OR
    has_role(auth.uid(), 'director_oficina'::app_role) OR
    has_role(auth.uid(), 'responsable_comercial'::app_role) OR
    has_role(auth.uid(), 'superadmin'::app_role)
);

-- System can insert audit records
CREATE POLICY "System can insert audit records"
ON public.visit_sheet_audit
FOR INSERT
WITH CHECK (true);

-- Create trigger function to log changes
CREATE OR REPLACE FUNCTION public.log_visit_sheet_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    changed_cols text[];
    col_name text;
    old_val text;
    new_val text;
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.visit_sheet_audit (visit_sheet_id, user_id, action, new_data, changed_fields)
        VALUES (NEW.id, auth.uid(), 'INSERT', to_jsonb(NEW), NULL);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Find changed columns
        changed_cols := ARRAY[]::text[];
        
        IF OLD.fecha IS DISTINCT FROM NEW.fecha THEN changed_cols := array_append(changed_cols, 'fecha'); END IF;
        IF OLD.hora IS DISTINCT FROM NEW.hora THEN changed_cols := array_append(changed_cols, 'hora'); END IF;
        IF OLD.duracion IS DISTINCT FROM NEW.duracion THEN changed_cols := array_append(changed_cols, 'duracion'); END IF;
        IF OLD.canal IS DISTINCT FROM NEW.canal THEN changed_cols := array_append(changed_cols, 'canal'); END IF;
        IF OLD.tipo_visita IS DISTINCT FROM NEW.tipo_visita THEN changed_cols := array_append(changed_cols, 'tipo_visita'); END IF;
        IF OLD.tipo_cliente IS DISTINCT FROM NEW.tipo_cliente THEN changed_cols := array_append(changed_cols, 'tipo_cliente'); END IF;
        IF OLD.persona_contacto IS DISTINCT FROM NEW.persona_contacto THEN changed_cols := array_append(changed_cols, 'persona_contacto'); END IF;
        IF OLD.cargo_contacto IS DISTINCT FROM NEW.cargo_contacto THEN changed_cols := array_append(changed_cols, 'cargo_contacto'); END IF;
        IF OLD.notas_gestor IS DISTINCT FROM NEW.notas_gestor THEN changed_cols := array_append(changed_cols, 'notas_gestor'); END IF;
        IF OLD.probabilidad_cierre IS DISTINCT FROM NEW.probabilidad_cierre THEN changed_cols := array_append(changed_cols, 'probabilidad_cierre'); END IF;
        IF OLD.potencial_anual_estimado IS DISTINCT FROM NEW.potencial_anual_estimado THEN changed_cols := array_append(changed_cols, 'potencial_anual_estimado'); END IF;
        IF OLD.proxima_cita IS DISTINCT FROM NEW.proxima_cita THEN changed_cols := array_append(changed_cols, 'proxima_cita'); END IF;
        IF OLD.proxima_llamada IS DISTINCT FROM NEW.proxima_llamada THEN changed_cols := array_append(changed_cols, 'proxima_llamada'); END IF;
        IF OLD.facturacion_anual IS DISTINCT FROM NEW.facturacion_anual THEN changed_cols := array_append(changed_cols, 'facturacion_anual'); END IF;
        IF OLD.diagnostico_inicial IS DISTINCT FROM NEW.diagnostico_inicial THEN changed_cols := array_append(changed_cols, 'diagnostico_inicial'); END IF;
        IF OLD.necesidades_detectadas IS DISTINCT FROM NEW.necesidades_detectadas THEN changed_cols := array_append(changed_cols, 'necesidades_detectadas'); END IF;
        IF OLD.propuesta_valor IS DISTINCT FROM NEW.propuesta_valor THEN changed_cols := array_append(changed_cols, 'propuesta_valor'); END IF;
        IF OLD.productos_servicios IS DISTINCT FROM NEW.productos_servicios THEN changed_cols := array_append(changed_cols, 'productos_servicios'); END IF;
        IF OLD.acciones_acordadas IS DISTINCT FROM NEW.acciones_acordadas THEN changed_cols := array_append(changed_cols, 'acciones_acordadas'); END IF;
        IF OLD.responsable_seguimiento IS DISTINCT FROM NEW.responsable_seguimiento THEN changed_cols := array_append(changed_cols, 'responsable_seguimiento'); END IF;
        
        IF array_length(changed_cols, 1) > 0 THEN
            INSERT INTO public.visit_sheet_audit (visit_sheet_id, user_id, action, old_data, new_data, changed_fields)
            VALUES (NEW.id, auth.uid(), 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), changed_cols);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.visit_sheet_audit (visit_sheet_id, user_id, action, old_data, changed_fields)
        VALUES (OLD.id, auth.uid(), 'DELETE', to_jsonb(OLD), NULL);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Create trigger
CREATE TRIGGER visit_sheet_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.visit_sheets
FOR EACH ROW EXECUTE FUNCTION public.log_visit_sheet_changes();

-- Create index for faster queries
CREATE INDEX idx_visit_sheet_audit_sheet_id ON public.visit_sheet_audit(visit_sheet_id);
CREATE INDEX idx_visit_sheet_audit_created_at ON public.visit_sheet_audit(created_at DESC);