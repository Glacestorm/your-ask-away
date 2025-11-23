-- Agregar política RLS para que usuarios puedan ver sus propios registros de auditoría
CREATE POLICY "Usuarios pueden ver sus propios registros de auditoría"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);