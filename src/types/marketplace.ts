// Marketplace & Partner Program Types - Phase 8

export type PartnerTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type PartnerStatus = 'pending' | 'approved' | 'active' | 'suspended' | 'rejected';
export type PartnerUserRole = 'owner' | 'admin' | 'member' | 'developer';

export type AppCategory = 'erp' | 'crm' | 'fiscal' | 'banking' | 'logistics' | 'analytics' | 'productivity' | 'communication' | 'security' | 'other';
export type AppStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'published' | 'rejected' | 'deprecated';
export type PriceType = 'free' | 'one_time' | 'subscription';
export type BillingPeriod = 'monthly' | 'yearly';

export type CertificationLevel = 'basic' | 'certified' | 'premium' | 'enterprise';
export type IntegrationCategory = 'erp' | 'crm' | 'fiscal' | 'banking' | 'payments' | 'logistics' | 'communication' | 'analytics';

export interface PartnerCompany {
  id: string;
  company_name: string;
  legal_name: string | null;
  tax_id: string | null;
  contact_email: string;
  contact_phone: string | null;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  partner_tier: PartnerTier;
  status: PartnerStatus;
  joined_at: string | null;
  approved_by: string | null;
  revenue_share_percent: number;
  contract_signed_at: string | null;
  contract_expires_at: string | null;
  total_revenue: number;
  total_installations: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PartnerUser {
  id: string;
  partner_company_id: string;
  user_id: string;
  role: PartnerUserRole;
  is_primary_contact: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartnerApplication {
  id: string;
  partner_company_id: string;
  app_name: string;
  app_key: string;
  short_description: string | null;
  description: string | null;
  category: AppCategory;
  subcategory: string | null;
  icon_url: string | null;
  banner_url: string | null;
  screenshots: string[];
  video_url: string | null;
  version: string;
  changelog: Array<{ version: string; date: string; changes: string[] }>;
  status: AppStatus;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  rejection_reason: string | null;
  price_type: PriceType;
  price_amount: number;
  price_currency: string;
  billing_period: BillingPeriod | null;
  trial_days: number;
  install_count: number;
  rating_average: number;
  rating_count: number;
  is_featured: boolean;
  is_premium: boolean;
  is_certified: boolean;
  documentation_url: string | null;
  support_url: string | null;
  privacy_policy_url: string | null;
  terms_url: string | null;
  webhook_url: string | null;
  api_scopes: string[];
  min_plan: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  partner_company?: PartnerCompany;
}

export interface MarketplaceReview {
  id: string;
  application_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  review_text: string | null;
  pros: string | null;
  cons: string | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  response_text: string | null;
  response_by: string | null;
  response_at: string | null;
  status: 'pending' | 'published' | 'hidden' | 'flagged';
  created_at: string;
  updated_at: string;
}

export interface MarketplaceInstallation {
  id: string;
  application_id: string | null;
  organization_id: string;
  installed_by: string;
  is_active: boolean;
  license_key: string | null;
  license_type: string | null;
  expires_at: string | null;
  last_used_at: string | null;
  usage_count: number;
  config: Record<string, unknown>;
  uninstalled_at: string | null;
  uninstall_reason: string | null;
  created_at: string;
  updated_at: string;
  application?: PartnerApplication;
}

export interface PartnerRevenueTransaction {
  id: string;
  partner_company_id: string | null;
  application_id: string | null;
  installation_id: string | null;
  organization_id: string | null;
  transaction_type: 'sale' | 'subscription' | 'renewal' | 'refund' | 'chargeback';
  gross_amount: number;
  platform_fee: number;
  partner_amount: number;
  currency: string;
  status: 'pending' | 'processed' | 'paid' | 'failed' | 'cancelled';
  payment_method: string | null;
  external_transaction_id: string | null;
  invoice_url: string | null;
  paid_at: string | null;
  period_start: string | null;
  period_end: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DeveloperApiKey {
  id: string;
  partner_company_id: string;
  user_id: string;
  key_name: string;
  api_key_hash: string;
  key_prefix: string;
  environment: 'sandbox' | 'production';
  scopes: string[];
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  allowed_origins: string[];
  allowed_ips: string[];
  is_active: boolean;
  last_used_at: string | null;
  total_requests: number;
  expires_at: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  created_at: string;
}

export interface PluginPermission {
  id: string;
  application_id: string;
  permission_key: string;
  permission_name: string;
  description: string | null;
  category: string | null;
  is_required: boolean;
  is_sensitive: boolean;
  requires_approval: boolean;
  created_at: string;
}

export interface PartnerWebhook {
  id: string;
  partner_company_id: string;
  webhook_name: string;
  webhook_url: string;
  events: string[];
  secret_hash: string;
  is_active: boolean;
  last_triggered_at: string | null;
  last_response_code: number | null;
  last_response_body: string | null;
  success_count: number;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

export interface PremiumIntegration {
  id: string;
  integration_name: string;
  integration_key: string;
  provider: string;
  category: IntegrationCategory;
  description: string | null;
  features: string[];
  logo_url: string | null;
  documentation_url: string | null;
  setup_guide_url: string | null;
  partner_company_id: string | null;
  certification_level: CertificationLevel;
  certified_at: string | null;
  certified_by: string | null;
  certification_expires_at: string | null;
  is_active: boolean;
  is_featured: boolean;
  install_count: number;
  config_schema: Record<string, unknown>;
  required_secrets: string[];
  supported_regions: string[];
  pricing_info: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// SDK Permission Scopes
export const PERMISSION_SCOPES = {
  // Read permissions
  'read:basic': 'Información básica del usuario',
  'read:companies': 'Leer datos de empresas',
  'read:contacts': 'Leer contactos',
  'read:opportunities': 'Leer oportunidades',
  'read:financials': 'Leer datos financieros',
  'read:visits': 'Leer visitas comerciales',
  'read:analytics': 'Leer analytics y métricas',
  
  // Write permissions
  'write:companies': 'Modificar empresas',
  'write:contacts': 'Modificar contactos',
  'write:opportunities': 'Modificar oportunidades',
  'write:visits': 'Crear y modificar visitas',
  
  // Admin permissions
  'admin:settings': 'Modificar configuración',
  'admin:users': 'Gestionar usuarios',
  
  // Premium permissions
  'ai:analysis': 'Usar análisis IA',
  'ai:predictions': 'Usar predicciones IA',
  'ai:recommendations': 'Obtener recomendaciones IA',
} as const;

export type PermissionScope = keyof typeof PERMISSION_SCOPES;

// Partner Tier Configuration
export const PARTNER_TIERS: Record<PartnerTier, {
  name: string;
  revenueShare: number;
  minRevenue: number;
  minApps: number;
  minRating: number;
  benefits: string[];
}> = {
  bronze: {
    name: 'Bronze',
    revenueShare: 15,
    minRevenue: 0,
    minApps: 0,
    minRating: 0,
    benefits: ['Acceso al SDK', 'Documentación', 'Soporte básico'],
  },
  silver: {
    name: 'Silver',
    revenueShare: 20,
    minRevenue: 10000,
    minApps: 2,
    minRating: 3.5,
    benefits: ['Todo de Bronze', 'Soporte prioritario', 'Beta features', 'Co-marketing'],
  },
  gold: {
    name: 'Gold',
    revenueShare: 25,
    minRevenue: 50000,
    minApps: 5,
    minRating: 4.0,
    benefits: ['Todo de Silver', 'Account manager', 'Featured placement', 'Eventos exclusivos'],
  },
  platinum: {
    name: 'Platinum',
    revenueShare: 30,
    minRevenue: 100000,
    minApps: 10,
    minRating: 4.5,
    benefits: ['Todo de Gold', 'Acceso API premium', 'Certificación oficial', 'Revenue garantizado'],
  },
};

// App Category Labels
export const APP_CATEGORY_LABELS: Record<AppCategory, string> = {
  erp: 'ERP',
  crm: 'CRM',
  fiscal: 'Fiscal',
  banking: 'Banca',
  logistics: 'Logística',
  analytics: 'Analytics',
  productivity: 'Productividad',
  communication: 'Comunicación',
  security: 'Seguridad',
  other: 'Otros',
};

// Integration Category Labels
export const INTEGRATION_CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  erp: 'ERP',
  crm: 'CRM',
  fiscal: 'Fiscal',
  banking: 'Banca',
  payments: 'Pagos',
  logistics: 'Logística',
  communication: 'Comunicación',
  analytics: 'Analytics',
};
