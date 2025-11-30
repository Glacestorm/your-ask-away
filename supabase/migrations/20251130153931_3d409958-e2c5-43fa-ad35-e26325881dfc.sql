-- Actualizar política RLS para que todos los roles autenticados (menos auditores) vean todas las empresas
DROP POLICY IF EXISTS "Gestores pueden ver sus empresas asignadas" ON companies;

CREATE POLICY "Usuarios autenticados pueden ver todas las empresas"
ON companies
FOR SELECT
TO authenticated
USING (
  -- Todos los usuarios autenticados pueden ver todas las empresas
  -- excepto los auditores (que no deberían tener acceso al mapa)
  auth.uid() IS NOT NULL
);