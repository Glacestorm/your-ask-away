-- =====================================================
-- MAPA EMPRESARIAL DE ANDORRA - BASE DE DATOS COMPLETA
-- =====================================================

-- 1. Crear enum para roles de usuario
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'user');

-- 2. Tabla de roles de usuario (CRÍTICO: separada para seguridad)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Función de seguridad para verificar roles (previene recursión en RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Función auxiliar para verificar si es admin o superadmin
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('admin', 'superadmin')
  )
$$;

-- 5. Tabla de perfiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Asignar rol de usuario por defecto
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Tabla de colores de estado (para el mapa)
CREATE TABLE public.status_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status_name TEXT NOT NULL UNIQUE,
  color_hex TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.status_colors ENABLE ROW LEVEL SECURITY;

-- Insertar colores de estado por defecto
INSERT INTO public.status_colors (status_name, color_hex, description, display_order) VALUES
  ('prospecto', '#9CA3AF', 'Cliente potencial sin contactar', 1),
  ('contactado', '#3B82F6', 'Primer contacto realizado', 2),
  ('en_negociacion', '#F59E0B', 'En proceso de negociación', 3),
  ('cliente_activo', '#10B981', 'Cliente con productos activos', 4),
  ('pausado', '#F97316', 'Cliente temporalmente inactivo', 5),
  ('perdido', '#EF4444', 'Oportunidad perdida', 6);

-- 8. Tabla de productos
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10,2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Insertar productos de ejemplo
INSERT INTO public.products (name, description, category, price) VALUES
  ('Seguro Empresarial Básico', 'Cobertura básica para empresas', 'Seguros', 299.99),
  ('Seguro Empresarial Premium', 'Cobertura completa para empresas', 'Seguros', 599.99),
  ('Asesoría Fiscal', 'Asesoramiento fiscal y contable', 'Servicios', 450.00),
  ('Gestión de Nóminas', 'Gestión completa de nóminas', 'Servicios', 350.00),
  ('Consultoría Legal', 'Asesoramiento jurídico empresarial', 'Servicios', 500.00);

-- 9. Tabla principal de empresas
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  cnae TEXT,
  parroquia TEXT NOT NULL,
  oficina TEXT,
  status_id UUID REFERENCES public.status_colors(id),
  gestor_id UUID REFERENCES public.profiles(id),
  fecha_ultima_visita DATE,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Índices para mejorar rendimiento
CREATE INDEX idx_companies_status ON public.companies(status_id);
CREATE INDEX idx_companies_gestor ON public.companies(gestor_id);
CREATE INDEX idx_companies_parroquia ON public.companies(parroquia);
CREATE INDEX idx_companies_coordinates ON public.companies(longitude, latitude);

-- 10. Tabla de relación empresa-productos
CREATE TABLE public.company_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  contract_date DATE DEFAULT CURRENT_DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, product_id)
);

ALTER TABLE public.company_products ENABLE ROW LEVEL SECURITY;

-- 11. Tabla de visitas
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  gestor_id UUID REFERENCES public.profiles(id) NOT NULL,
  visit_date DATE NOT NULL,
  notes TEXT,
  result TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_visits_company ON public.visits(company_id);
CREATE INDEX idx_visits_date ON public.visits(visit_date DESC);

-- 12. Tabla de auditoría
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_date ON public.audit_logs(created_at DESC);

-- 13. Tabla de conceptos configurables
CREATE TABLE public.concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_type TEXT NOT NULL,
  concept_key TEXT NOT NULL,
  concept_value TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(concept_type, concept_key)
);

ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;

-- Insertar conceptos iniciales (parroquias de Andorra)
INSERT INTO public.concepts (concept_type, concept_key, concept_value) VALUES
  ('parroquia', 'andorra_la_vella', 'Andorra la Vella'),
  ('parroquia', 'escaldes_engordany', 'Escaldes-Engordany'),
  ('parroquia', 'encamp', 'Encamp'),
  ('parroquia', 'la_massana', 'La Massana'),
  ('parroquia', 'ordino', 'Ordino'),
  ('parroquia', 'canillo', 'Canillo'),
  ('parroquia', 'sant_julia_de_loria', 'Sant Julià de Lòria');

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Políticas para user_roles
CREATE POLICY "Superadmins pueden ver todos los roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins pueden gestionar roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'superadmin'));

-- Políticas para profiles
CREATE POLICY "Usuarios pueden ver su propio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins pueden ver todos los perfiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin_or_superadmin(auth.uid()));

-- Políticas para status_colors
CREATE POLICY "Todos pueden ver colores de estado"
  ON public.status_colors FOR SELECT
  USING (true);

CREATE POLICY "Solo admins pueden modificar colores"
  ON public.status_colors FOR ALL
  USING (public.is_admin_or_superadmin(auth.uid()));

-- Políticas para products
CREATE POLICY "Todos los usuarios autenticados pueden ver productos"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solo admins pueden gestionar productos"
  ON public.products FOR ALL
  USING (public.is_admin_or_superadmin(auth.uid()));

-- Políticas para companies
CREATE POLICY "Usuarios autenticados pueden ver empresas"
  ON public.companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins pueden gestionar todas las empresas"
  ON public.companies FOR ALL
  USING (public.is_admin_or_superadmin(auth.uid()));

-- Políticas para company_products
CREATE POLICY "Usuarios pueden ver productos de empresas"
  ON public.company_products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins pueden gestionar productos de empresas"
  ON public.company_products FOR ALL
  USING (public.is_admin_or_superadmin(auth.uid()));

-- Políticas para visits
CREATE POLICY "Usuarios pueden ver sus propias visitas"
  ON public.visits FOR SELECT
  USING (gestor_id = auth.uid() OR public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Usuarios pueden crear sus propias visitas"
  ON public.visits FOR INSERT
  WITH CHECK (gestor_id = auth.uid());

CREATE POLICY "Admins pueden gestionar todas las visitas"
  ON public.visits FOR ALL
  USING (public.is_admin_or_superadmin(auth.uid()));

-- Políticas para audit_logs
CREATE POLICY "Solo superadmins pueden ver auditoría"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'superadmin'));

-- Políticas para concepts
CREATE POLICY "Todos pueden ver conceptos activos"
  ON public.concepts FOR SELECT
  USING (active = true);

CREATE POLICY "Solo admins pueden gestionar conceptos"
  ON public.concepts FOR ALL
  USING (public.is_admin_or_superadmin(auth.uid()));

-- =====================================================
-- TRIGGERS PARA ACTUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_status_colors_updated_at
  BEFORE UPDATE ON public.status_colors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_concepts_updated_at
  BEFORE UPDATE ON public.concepts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INSERTAR DATOS DE PRUEBA
-- =====================================================

-- Nota: Las empresas de prueba se insertarán después de que se creen usuarios
-- para poder asignar gestores correctamente