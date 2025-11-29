-- Crear tabla para fichas de visita detalladas
CREATE TABLE public.visit_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES public.visits(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  gestor_id UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Datos de la visita
  fecha DATE NOT NULL,
  hora TIME,
  duracion INTEGER, -- en minutos
  canal TEXT CHECK (canal IN ('Presencial', 'Teléfono', 'Videollamada', 'Email')),
  tipo_visita TEXT CHECK (tipo_visita IN ('Primera visita', 'Seguimiento', 'Postventa', 'Renovación')),
  
  -- Datos del cliente (complementarios)
  tipo_cliente TEXT CHECK (tipo_cliente IN ('Particular', 'Empresa', 'Pyme', 'Gran Empresa')),
  persona_contacto TEXT,
  cargo_contacto TEXT,
  telefono_contacto TEXT,
  email_contacto TEXT,
  
  -- Diagnóstico inicial
  diagnostico_inicial JSONB DEFAULT '[]'::jsonb,
  
  -- Situación financiera empresa
  facturacion_anual NUMERIC,
  ebitda_estimado NUMERIC,
  endeudamiento_total NUMERIC,
  liquidez_disponible NUMERIC,
  tpv_volumen_mensual NUMERIC,
  
  -- Situación financiera particular
  ingresos_netos_mensuales NUMERIC,
  ahorro_inversion_disponible NUMERIC,
  endeudamiento_particular NUMERIC,
  situacion_laboral TEXT,
  
  -- Necesidades detectadas
  necesidades_detectadas JSONB DEFAULT '[]'::jsonb,
  
  -- Propuesta de valor
  propuesta_valor JSONB DEFAULT '[]'::jsonb,
  
  -- Productos y servicios
  productos_servicios JSONB DEFAULT '{}'::jsonb,
  
  -- Riesgos y cumplimiento
  riesgos_cumplimiento JSONB DEFAULT '{}'::jsonb,
  
  -- Resumen
  notas_gestor TEXT,
  
  -- Próximos pasos
  acciones_acordadas JSONB DEFAULT '[]'::jsonb,
  documentacion_pendiente TEXT,
  proxima_cita DATE,
  responsable_seguimiento UUID REFERENCES public.profiles(id),
  
  -- Evaluación
  potencial_anual_estimado NUMERIC,
  probabilidad_cierre INTEGER CHECK (probabilidad_cierre >= 0 AND probabilidad_cierre <= 100),
  nivel_vinculacion_recomendado TEXT CHECK (nivel_vinculacion_recomendado IN ('Bajo', 'Medio', 'Alto')),
  oportunidades_futuras TEXT,
  
  -- Seguimiento
  proxima_llamada DATE,
  revision_cartera DATE,
  renovaciones DATE,
  actualizacion_kyc DATE
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_visit_sheets_visit_id ON public.visit_sheets(visit_id);
CREATE INDEX idx_visit_sheets_company_id ON public.visit_sheets(company_id);
CREATE INDEX idx_visit_sheets_gestor_id ON public.visit_sheets(gestor_id);
CREATE INDEX idx_visit_sheets_fecha ON public.visit_sheets(fecha);

-- Trigger para updated_at
CREATE TRIGGER update_visit_sheets_updated_at
  BEFORE UPDATE ON public.visit_sheets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.visit_sheets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Todos pueden ver excepto auditores
CREATE POLICY "Non-auditors can view visit sheets"
  ON public.visit_sheets
  FOR SELECT
  TO authenticated
  USING (NOT has_role(auth.uid(), 'auditor'::app_role));

-- Gestores pueden crear fichas para sus visitas
CREATE POLICY "Gestors can create their visit sheets"
  ON public.visit_sheets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    gestor_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.visits 
      WHERE visits.id = visit_sheets.visit_id 
      AND visits.gestor_id = auth.uid()
    )
  );

-- Gestores pueden actualizar sus fichas
CREATE POLICY "Gestors can update their visit sheets"
  ON public.visit_sheets
  FOR UPDATE
  TO authenticated
  USING (gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()))
  WITH CHECK (gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()));

-- Admins pueden gestionar todas las fichas
CREATE POLICY "Admins can manage all visit sheets"
  ON public.visit_sheets
  FOR ALL
  TO authenticated
  USING (is_admin_or_superadmin(auth.uid()))
  WITH CHECK (is_admin_or_superadmin(auth.uid()));