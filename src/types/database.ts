export type AppRole = 'superadmin' | 'admin' | 'user';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  cargo: string | null;
  oficina: string | null;
  gestor_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface StatusColor {
  id: string;
  status_name: string;
  color_hex: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  cnae: string | null;
  parroquia: string;
  oficina: string | null;
  status_id: string | null;
  gestor_id: string | null;
  fecha_ultima_visita: string | null;
  observaciones: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  employees: number | null;
  turnover: number | null;
  sector: string | null;
  tax_id: string | null;
  registration_number: string | null;
  legal_form: string | null;
  pl_banco: number | null;
  beneficios: number | null;
  vinculacion_entidad_1: number | null;
  vinculacion_entidad_2: number | null;
  vinculacion_entidad_3: number | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyWithDetails extends Company {
  status?: StatusColor;
  gestor?: Profile;
  products?: Product[];
}

export interface CompanyProduct {
  id: string;
  company_id: string;
  product_id: string;
  contract_date: string;
  active: boolean;
  created_at: string;
}

export interface Visit {
  id: string;
  company_id: string;
  gestor_id: string;
  visit_date: string;
  notes: string | null;
  result: string | null;
  productos_ofrecidos: string[] | null;
  porcentaje_vinculacion: number | null;
  pactos_realizados: string | null;
  created_at: string;
}

export interface Concept {
  id: string;
  concept_type: string;
  concept_key: string;
  concept_value: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: any | null;
  new_data: any | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  action: string;
  record_id: string | null;
  user_id: string | null;
  old_data: any;
  new_data: any;
  created_at: string | null;
}

export interface CompanyContact {
  id: string;
  company_id: string;
  contact_name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyDocument {
  id: string;
  company_id: string;
  document_name: string;
  document_type: string | null;
  document_url: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyPhoto {
  id: string;
  company_id: string;
  photo_url: string;
  uploaded_by: string | null;
  uploaded_at: string;
  notes: string | null;
  created_at: string;
}

export interface MapFilters {
  statusIds: string[];
  gestorIds: string[];
  parroquias: string[];
  cnaes: string[];
  sectors: string[];
  productIds: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  } | null;
  searchTerm: string;
  vinculacionRange: {
    min: number;
    max: number;
  };
  vinculacionEntidad1Range?: {
    min: number;
    max: number;
  };
  vinculacionEntidad2Range?: {
    min: number;
    max: number;
  };
  vinculacionEntidad3Range?: {
    min: number;
    max: number;
  };
  facturacionRange: {
    min: number;
    max: number;
  };
  plBancoRange: {
    min: number;
    max: number;
  };
  beneficiosRange: {
    min: number;
    max: number;
  };
}

export type MapColorMode = 'status' | 'vinculacion' | 'facturacion' | 'pl_banco' | 'beneficios' | 'visitas';
