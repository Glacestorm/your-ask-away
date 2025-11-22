export type AppRole = 'superadmin' | 'admin' | 'user';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
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

export interface MapFilters {
  statusIds: string[];
  gestorIds: string[];
  parroquias: string[];
  cnaes: string[];
  productIds: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  } | null;
  searchTerm: string;
}
