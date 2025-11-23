-- Actualizar políticas de companies para que gestores solo vean sus empresas asignadas
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver empresas" ON companies;

CREATE POLICY "Gestores pueden ver sus empresas asignadas"
ON companies
FOR SELECT
TO authenticated
USING (
  gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid())
);

-- Actualizar políticas de visits para que gestores solo vean sus propias visitas
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias visitas" ON visits;

CREATE POLICY "Gestores pueden ver solo sus visitas"
ON visits
FOR SELECT
TO authenticated
USING (
  gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid())
);

-- Asegurar que gestores solo puedan crear visitas para sus propias empresas
DROP POLICY IF EXISTS "Usuarios pueden crear sus propias visitas" ON visits;

CREATE POLICY "Gestores pueden crear visitas para sus empresas"
ON visits
FOR INSERT
TO authenticated
WITH CHECK (
  gestor_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM companies 
    WHERE id = visits.company_id 
    AND gestor_id = auth.uid()
  )
);

-- Permitir que gestores actualicen sus propias visitas
CREATE POLICY "Gestores pueden actualizar sus visitas"
ON visits
FOR UPDATE
TO authenticated
USING (gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
WITH CHECK (gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()));

-- Asegurar que company_contacts solo sean visibles para el gestor de la empresa
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver contactos" ON company_contacts;

CREATE POLICY "Gestores pueden ver contactos de sus empresas"
ON company_contacts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies 
    WHERE companies.id = company_contacts.company_id 
    AND (companies.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
);

-- Asegurar que company_documents solo sean visibles para el gestor de la empresa
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver documentos" ON company_documents;

CREATE POLICY "Gestores pueden ver documentos de sus empresas"
ON company_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies 
    WHERE companies.id = company_documents.company_id 
    AND (companies.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
);

-- Asegurar que company_photos solo sean visibles para el gestor de la empresa
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver fotos" ON company_photos;

CREATE POLICY "Gestores pueden ver fotos de sus empresas"
ON company_photos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies 
    WHERE companies.id = company_photos.company_id 
    AND (companies.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
);

-- Permitir que gestores suban fotos solo a sus empresas
DROP POLICY IF EXISTS "Usuarios pueden subir fotos" ON company_photos;

CREATE POLICY "Gestores pueden subir fotos a sus empresas"
ON company_photos
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1 FROM companies 
    WHERE companies.id = company_photos.company_id 
    AND companies.gestor_id = auth.uid()
  )
);

-- Asegurar que company_products solo sean visibles para el gestor de la empresa
DROP POLICY IF EXISTS "Usuarios pueden ver productos de empresas" ON company_products;

CREATE POLICY "Gestores pueden ver productos de sus empresas"
ON company_products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies 
    WHERE companies.id = company_products.company_id 
    AND (companies.gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  )
);

-- Comentario de confirmación
COMMENT ON POLICY "Gestores pueden ver sus empresas asignadas" ON companies IS 
'Los gestores solo pueden ver las empresas que tienen asignadas. Admins y superadmins pueden ver todas.';

COMMENT ON POLICY "Gestores pueden ver solo sus visitas" ON visits IS 
'Los gestores solo pueden ver sus propias visitas. Admins y superadmins pueden ver todas.';