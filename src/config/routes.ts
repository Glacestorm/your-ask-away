/**
 * Configuración centralizada de rutas de la aplicación
 * Organizada por dominio para facilitar mantenimiento
 */

import { lazy } from 'react';

// Lazy load de páginas
const Auth = lazy(() => import('@/pages/Auth'));
const Home = lazy(() => import('@/pages/Home'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Admin = lazy(() => import('@/pages/Admin'));
const Profile = lazy(() => import('@/pages/Profile'));
const Map3D = lazy(() => import('@/pages/Map3D'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const ObelixiaTeamAdmin = lazy(() => import('@/pages/ObelixiaTeamAdmin'));
const Chat = lazy(() => import('@/pages/Chat'));

// Academia
const AcademiaLanding = lazy(() => import('@/pages/academia/AcademiaLanding'));
const CourseCatalog = lazy(() => import('@/pages/academia/CourseCatalog'));
const CourseDetail = lazy(() => import('@/pages/academia/CourseDetail'));
const LearningPlayer = lazy(() => import('@/pages/academia/LearningPlayer'));
const AcademiaProfile = lazy(() => import('@/pages/academia/AcademiaProfile'));
const CertificateVerification = lazy(() => import('@/pages/academia/CertificateVerification'));
const AcademiaAnalytics = lazy(() => import('@/pages/academia/AcademiaAnalytics'));
const CourseManagement = lazy(() => import('@/pages/academia/CourseManagement'));
const AcademiaNotifications = lazy(() => import('@/pages/academia/AcademiaNotifications'));
const AcademiaCommunity = lazy(() => import('@/pages/academia/AcademiaCommunity'));
const AcademiaDemo = lazy(() => import('@/pages/AcademiaDemo'));

// Store
const StoreLanding = lazy(() => import('@/pages/store/StoreLanding'));
const StoreModules = lazy(() => import('@/pages/store/StoreModules'));
const StoreModuleDetail = lazy(() => import('@/pages/store/StoreModuleDetail'));
const StoreDeployment = lazy(() => import('@/pages/store/StoreDeployment'));
const StoreCheckout = lazy(() => import('@/pages/store/StoreCheckout'));
const CheckoutSuccess = lazy(() => import('@/pages/store/CheckoutSuccess'));

// Legal
const TermsOfService = lazy(() => import('@/pages/legal/TermsOfService'));
const PrivacyPolicy = lazy(() => import('@/pages/legal/PrivacyPolicy'));
const CookiesPolicy = lazy(() => import('@/pages/legal/CookiesPolicy'));
const GDPR = lazy(() => import('@/pages/legal/GDPR'));

// Company
const About = lazy(() => import('@/pages/company/About'));
const Contact = lazy(() => import('@/pages/company/Contact'));
const Partners = lazy(() => import('@/pages/company/Partners'));
const Careers = lazy(() => import('@/pages/company/Careers'));

// Resources
const Documentation = lazy(() => import('@/pages/resources/Documentation'));
const APIReference = lazy(() => import('@/pages/resources/APIReference'));
const Blog = lazy(() => import('@/pages/resources/Blog'));
const NewsDetail = lazy(() => import('@/pages/news/NewsDetail'));
const CaseStudies = lazy(() => import('@/pages/resources/CaseStudies'));
const CasosDeExito = lazy(() => import('@/pages/casos-de-exito/index'));
const TrendsDashboard = lazy(() => import('@/pages/resources/TrendsDashboard'));

// Sectors
const SectorLanding = lazy(() => import('@/pages/sectors/SectorLanding'));
const SectorDetail = lazy(() => import('@/pages/sectors/SectorDetail'));
const BancaLanding = lazy(() => import('@/pages/sectors/BancaLanding'));
const SegurosLanding = lazy(() => import('@/pages/sectors/SegurosLanding'));
const RetailLanding = lazy(() => import('@/pages/sectors/RetailLanding'));
const ManufacturaLanding = lazy(() => import('@/pages/sectors/ManufacturaLanding'));
const EcommerceLanding = lazy(() => import('@/pages/sectors/EcommerceLanding'));
const InfoproductoresLanding = lazy(() => import('@/pages/sectors/InfoproductoresLanding'));
const AgenciasLanding = lazy(() => import('@/pages/sectors/AgenciasLanding'));
const SuscripcionesLanding = lazy(() => import('@/pages/sectors/SuscripcionesLanding'));
const EducacionLanding = lazy(() => import('@/pages/sectors/EducacionLanding'));
const SaludLanding = lazy(() => import('@/pages/sectors/SaludLanding'));
const EmpresasLanding = lazy(() => import('@/pages/sectors/EmpresasLanding'));

// Marketing
const PreciosPage = lazy(() => import('@/pages/pricing/PreciosPage'));
const PackagesComparisonPage = lazy(() => import('@/pages/pricing/PackagesComparisonPage'));
const ComparativasCRM = lazy(() => import('@/pages/comparativas/ComparativasCRM'));
const ComparativasPage = lazy(() => import('@/pages/comparativas/index'));
const CaseStudyDetail = lazy(() => import('@/pages/casos-de-exito/[slug]'));
const Seguridad = lazy(() => import('@/pages/Seguridad'));
const DemoInteractiva = lazy(() => import('@/pages/DemoInteractiva'));
const LowCodePage = lazy(() => import('@/pages/LowCodePage'));
const CDPDashboard = lazy(() => import('@/pages/CDPDashboard'));

// Marketplace & Developer
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const MarketplaceAppDetail = lazy(() => import('@/pages/MarketplaceAppDetail'));
const PartnerPortal = lazy(() => import('@/pages/PartnerPortal'));
const DeveloperPortal = lazy(() => import('@/pages/DeveloperPortal'));
const MarketplaceAdmin = lazy(() => import('@/pages/admin/MarketplaceAdmin'));

// Subscription
const SubscriptionSuccess = lazy(() => import('@/pages/subscription/Success'));

// CRM
const KanbanPage = lazy(() => import('@/pages/crm/KanbanPage'));
const OmnichannelPage = lazy(() => import('@/pages/crm/OmnichannelPage'));
const SentimentPage = lazy(() => import('@/pages/crm/SentimentPage'));
const SLADashboardPage = lazy(() => import('@/pages/crm/SLADashboardPage'));
const AutomationPage = lazy(() => import('@/pages/crm/AutomationPage'));

// Fase 3: Diferenciadores
const CompliancePage = lazy(() => import('@/pages/compliance/CompliancePage'));
const ERPPage = lazy(() => import('@/pages/erp/ERPPage'));
const RevenuePage = lazy(() => import('@/pages/revenue/RevenuePage'));
const GISPage = lazy(() => import('@/pages/gis/GISPage'));
const DocsPage = lazy(() => import('@/pages/docs/DocsPage'));

// Strategic Planning & Financial Viability
const StrategicPlanningPage = lazy(() => import('@/pages/strategic-planning/index'));
const FinancialViabilityPage = lazy(() => import('@/pages/financial-viability/index'));

// Admin - Service Quotes & Remote Support
const ServiceQuotesPage = lazy(() => import('@/pages/admin/ServiceQuotesPage'));
const RemoteSupportPage = lazy(() => import('@/pages/admin/RemoteSupportPage'));
const EnterpriseDashboardPage = lazy(() => import('@/pages/admin/EnterpriseDashboardPage'));
const CSMetricsPage = lazy(() => import('@/pages/admin/CSMetricsPage'));
const AcademiaAdminPage = lazy(() => import('@/pages/admin/AcademiaAdminPage'));
const ESGSustainabilityPage = lazy(() => import('@/pages/admin/ESGSustainabilityPage'));
const AIAgentsPage = lazy(() => import('@/pages/admin/AIAgentsPage'));
const MarketIntelligencePage = lazy(() => import('@/pages/admin/MarketIntelligencePage'));
const CRMMigrationPage = lazy(() => import('@/pages/admin/CRMMigrationPage'));
const DemoRequestsPage = lazy(() => import('@/pages/admin/DemoRequestsPage'));
const ModuleStudioPage = lazy(() => import('@/pages/admin/ModuleStudioPage'));
const ModuleStudioHubPage = lazy(() => import('@/pages/admin/module-studio/ModuleStudioHubPage'));
const ModuleDevelopmentPage = lazy(() => import('@/pages/admin/module-studio/ModuleDevelopmentPage'));
const ModuleOperationsPage = lazy(() => import('@/pages/admin/module-studio/ModuleOperationsPage'));
const ModuleAnalyticsPage = lazy(() => import('@/pages/admin/module-studio/ModuleAnalyticsPage'));
const ModuleGovernancePage = lazy(() => import('@/pages/admin/module-studio/ModuleGovernancePage'));
const ModuleEcosystemPage = lazy(() => import('@/pages/admin/module-studio/ModuleEcosystemPage'));
const AutomationEnginePage = lazy(() => import('@/pages/admin/AutomationEnginePage'));
const AILocalPage = lazy(() => import('@/pages/admin/AILocalPage'));
const LicenseManagementPage = lazy(() => import('@/pages/admin/LicenseManagementPage'));

// Settings
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));

// Tipos
export type RouteLayout = 'public' | 'dashboard' | 'minimal' | 'none';
export type RoutePriority = 'high' | 'medium' | 'low';

export interface RouteConfig {
  path: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  layout: RouteLayout;
  priority: RoutePriority;
  delay?: number;
  meta?: {
    title?: string;
    description?: string;
    requiresAuth?: boolean;
    roles?: string[];
  };
}

// ============================================
// RUTAS PÚBLICAS (Store, Landing, Marketing)
// ============================================
export const publicRoutes: RouteConfig[] = [
  // Store - Usando layout 'public' unificado con StoreNavbar
  { path: '/store', component: StoreLanding, layout: 'public', priority: 'high', meta: { title: 'Store' } },
  { path: '/store/modules', component: StoreModules, layout: 'public', priority: 'high', meta: { title: 'Módulos' } },
  { path: '/store/modules/:moduleKey', component: StoreModuleDetail, layout: 'public', priority: 'high' },
  { path: '/store/deployment', component: StoreDeployment, layout: 'public', priority: 'high' },
  { path: '/store/checkout', component: StoreCheckout, layout: 'public', priority: 'high' },
  { path: '/store/success', component: CheckoutSuccess, layout: 'public', priority: 'high' },
  
  // Academia - Layout público unificado
  { path: '/academia', component: AcademiaLanding, layout: 'public', priority: 'high', meta: { title: 'Academia ObelixIA' } },
  { path: '/academia/cursos', component: CourseCatalog, layout: 'public', priority: 'high', meta: { title: 'Cursos' } },
  { path: '/academia/curso/:courseId', component: CourseDetail, layout: 'public', priority: 'high', meta: { title: 'Curso' } },
  { path: '/academia/aprender/:courseId', component: LearningPlayer, layout: 'public', priority: 'high', meta: { title: 'Aprender', requiresAuth: true } },
  { path: '/academia/mi-perfil', component: AcademiaProfile, layout: 'public', priority: 'high', meta: { title: 'Mi Perfil Académico', requiresAuth: true } },
  { path: '/academia/verificar/:code', component: CertificateVerification, layout: 'public', priority: 'medium', meta: { title: 'Verificar Certificado' } },
  { path: '/academia/verificar', component: CertificateVerification, layout: 'public', priority: 'medium', meta: { title: 'Verificar Certificado' } },
  { path: '/verify-certificate', component: CertificateVerification, layout: 'public', priority: 'medium', meta: { title: 'Verificar Certificado' } },
  { path: '/academia/analytics', component: AcademiaAnalytics, layout: 'public', priority: 'high', meta: { title: 'Analytics Academia', requiresAuth: true } },
  { path: '/academia/gestion-cursos', component: CourseManagement, layout: 'public', priority: 'high', meta: { title: 'Gestión de Cursos', requiresAuth: true } },
  { path: '/academia/notificaciones', component: AcademiaNotifications, layout: 'public', priority: 'high', meta: { title: 'Notificaciones', requiresAuth: true } },
  { path: '/academia/comunidad', component: AcademiaCommunity, layout: 'public', priority: 'high', meta: { title: 'Comunidad', requiresAuth: true } },
  { path: '/academia/demo', component: AcademiaDemo, layout: 'public', priority: 'high', meta: { title: 'Academia Demo' } },
  
  // Sectors - Layout público unificado
  { path: '/sectores', component: SectorLanding, layout: 'public', priority: 'high', meta: { title: 'Sectores' } },
  { path: '/sectores/:slug', component: SectorDetail, layout: 'public', priority: 'high', meta: { title: 'Sector' } },
  { path: '/sectors/:slug', component: SectorDetail, layout: 'public', priority: 'high', meta: { title: 'Sector' } },
  { path: '/sectores/banca', component: BancaLanding, layout: 'public', priority: 'high', meta: { title: 'Banca' } },
  { path: '/sectores/seguros', component: SegurosLanding, layout: 'public', priority: 'high', meta: { title: 'Seguros' } },
  { path: '/sectores/retail', component: RetailLanding, layout: 'public', priority: 'high', meta: { title: 'Retail' } },
  { path: '/sectores/manufactura', component: ManufacturaLanding, layout: 'public', priority: 'high', meta: { title: 'Manufactura' } },
  { path: '/sectores/ecommerce', component: EcommerceLanding, layout: 'public', priority: 'high', meta: { title: 'E-Commerce' } },
  { path: '/sectores/infoproductores', component: InfoproductoresLanding, layout: 'public', priority: 'high', meta: { title: 'Infoproductores' } },
  { path: '/sectores/agencias', component: AgenciasLanding, layout: 'public', priority: 'high', meta: { title: 'Agencias' } },
  { path: '/sectores/suscripciones', component: SuscripcionesLanding, layout: 'public', priority: 'high', meta: { title: 'Suscripciones' } },
  { path: '/sectores/educacion', component: EducacionLanding, layout: 'public', priority: 'high', meta: { title: 'Educación' } },
  { path: '/sectores/salud', component: SaludLanding, layout: 'public', priority: 'high', meta: { title: 'Salud' } },
  { path: '/sectores/empresas', component: EmpresasLanding, layout: 'public', priority: 'high', meta: { title: 'Empresas B2B' } },
  
  // Marketing - Layout público unificado
  { path: '/comparativas', component: ComparativasCRM, layout: 'public', priority: 'high', meta: { title: 'Comparativas CRM' } },
  { path: '/seguridad', component: Seguridad, layout: 'public', priority: 'high', meta: { title: 'Seguridad' } },
  { path: '/precios', component: PreciosPage, layout: 'public', priority: 'high', meta: { title: 'Planes y Precios' } },
  { path: '/paquetes', component: PackagesComparisonPage, layout: 'public', priority: 'high', meta: { title: 'Comparativa de Paquetes CRM/ERP' } },
  { path: '/demo', component: DemoInteractiva, layout: 'public', priority: 'high', meta: { title: 'Demo' } },
  
  // Marketplace & Developer Portal - Layout público unificado
  { path: '/marketplace', component: Marketplace, layout: 'public', priority: 'high', meta: { title: 'Marketplace' } },
  { path: '/marketplace/:appKey', component: MarketplaceAppDetail, layout: 'public', priority: 'high' },
  { path: '/developers', component: DeveloperPortal, layout: 'public', priority: 'medium', meta: { title: 'Portal de Desarrolladores' } },
  { path: '/partner-portal', component: PartnerPortal, layout: 'public', priority: 'medium', meta: { title: 'Portal de Partners' } },
  
  // Features - Layout público unificado
  { path: '/lowcode', component: LowCodePage, layout: 'public', priority: 'medium', meta: { title: 'Low Code' } },
  { path: '/cdp', component: CDPDashboard, layout: 'public', priority: 'medium', meta: { title: 'CDP Dashboard' } },
  { path: '/chat', component: Chat, layout: 'public', priority: 'high', meta: { title: 'Chat IA' } },
];

// ============================================
// RUTAS COMPANY (Sobre nosotros, Contacto...)
// ============================================
export const companyRoutes: RouteConfig[] = [
  { path: '/about', component: About, layout: 'public', priority: 'low', meta: { title: 'Sobre Nosotros' } },
  { path: '/contact', component: Contact, layout: 'public', priority: 'low', meta: { title: 'Contacto' } },
  { path: '/partners', component: Partners, layout: 'public', priority: 'low', meta: { title: 'Partners' } },
  { path: '/careers', component: Careers, layout: 'public', priority: 'low', meta: { title: 'Carreras' } },
];

// ============================================
// RUTAS RECURSOS (Docs, API, Blog)
// ============================================
export const resourceRoutes: RouteConfig[] = [
  { path: '/docs', component: Documentation, layout: 'public', priority: 'low', meta: { title: 'Documentación' } },
  { path: '/api', component: APIReference, layout: 'public', priority: 'low', meta: { title: 'API Reference' } },
  { path: '/blog', component: Blog, layout: 'public', priority: 'low', meta: { title: 'Blog' } },
  { path: '/news/:id', component: NewsDetail, layout: 'public', priority: 'high', meta: { title: 'News' } },
  { path: '/cases', component: CaseStudies, layout: 'public', priority: 'low', meta: { title: 'Casos de Éxito' } },
  { path: '/casos-de-exito', component: CasosDeExito, layout: 'public', priority: 'medium', meta: { title: 'Casos de Éxito' } },
  { path: '/casos-de-exito/:slug', component: CaseStudyDetail, layout: 'public', priority: 'medium', meta: { title: 'Caso de Éxito' } },
  { path: '/comparativas/sectores', component: ComparativasPage, layout: 'public', priority: 'medium', meta: { title: 'Comparar Sectores' } },
  { path: '/trends', component: TrendsDashboard, layout: 'public', priority: 'medium', meta: { title: 'Tendencias del Sector' } },
];

// ============================================
// RUTAS LEGALES
// ============================================
export const legalRoutes: RouteConfig[] = [
  { path: '/terms', component: TermsOfService, layout: 'public', priority: 'low', meta: { title: 'Términos de Servicio' } },
  { path: '/privacy', component: PrivacyPolicy, layout: 'public', priority: 'low', meta: { title: 'Política de Privacidad' } },
  { path: '/cookies', component: CookiesPolicy, layout: 'public', priority: 'low', meta: { title: 'Política de Cookies' } },
  { path: '/gdpr', component: GDPR, layout: 'public', priority: 'low', meta: { title: 'GDPR' } },
];

// ============================================
// RUTAS DASHBOARD (Requieren auth)
// ============================================
export const dashboardRoutes: RouteConfig[] = [
  { path: '/home', component: Home, layout: 'none', priority: 'high', meta: { title: 'Inicio', requiresAuth: true } },
  { path: '/dashboard', component: Dashboard, layout: 'none', priority: 'medium', delay: 50, meta: { title: 'Dashboard', requiresAuth: true } },
  { path: '/profile', component: Profile, layout: 'none', priority: 'low', delay: 100, meta: { title: 'Perfil', requiresAuth: true } },
  { path: '/map-3d', component: Map3D, layout: 'dashboard', priority: 'medium', meta: { title: 'Mapa 3D', requiresAuth: true } },
  // CRM
  { path: '/crm/kanban', component: KanbanPage, layout: 'none', priority: 'high', meta: { title: 'CRM Kanban', requiresAuth: true } },
  { path: '/crm/omnichannel', component: OmnichannelPage, layout: 'none', priority: 'high', meta: { title: 'Inbox Omnicanal', requiresAuth: true } },
  { path: '/crm/sentiment', component: SentimentPage, layout: 'none', priority: 'medium', meta: { title: 'Análisis de Sentimiento', requiresAuth: true } },
  { path: '/crm/sla', component: SLADashboardPage, layout: 'none', priority: 'medium', meta: { title: 'SLAs y Métricas', requiresAuth: true } },
  { path: '/crm/automation', component: AutomationPage, layout: 'none', priority: 'high', meta: { title: 'Automatización CRM', requiresAuth: true } },
  // Fase 3: Diferenciadores
  { path: '/compliance', component: CompliancePage, layout: 'none', priority: 'high', meta: { title: 'Compliance', requiresAuth: true } },
  { path: '/erp', component: ERPPage, layout: 'none', priority: 'high', meta: { title: 'ERP', requiresAuth: true } },
  { path: '/revenue', component: RevenuePage, layout: 'none', priority: 'high', meta: { title: 'Revenue Intelligence', requiresAuth: true } },
  { path: '/gis', component: GISPage, layout: 'none', priority: 'high', meta: { title: 'GIS Territorial', requiresAuth: true } },
  { path: '/docs-ai', component: DocsPage, layout: 'none', priority: 'medium', meta: { title: 'Documentación AI', requiresAuth: true } },
  // Strategic Planning & Financial Viability
  { path: '/strategic-planning', component: StrategicPlanningPage, layout: 'none', priority: 'high', meta: { title: 'Planificación Estratégica', requiresAuth: true } },
  { path: '/financial-viability', component: FinancialViabilityPage, layout: 'none', priority: 'high', meta: { title: 'Viabilidad Financiera', requiresAuth: true } },
];

// ============================================
// RUTAS ADMIN (Requieren roles especiales)
// ============================================
export const adminRoutes: RouteConfig[] = [
  { path: '/admin', component: Admin, layout: 'none', priority: 'medium', delay: 50, meta: { title: 'Admin', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/admin/service-quotes', component: ServiceQuotesPage, layout: 'none', priority: 'medium', meta: { title: 'Presupuestos de Servicio', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/admin/remote-support', component: RemoteSupportPage, layout: 'none', priority: 'medium', meta: { title: 'Soporte Remoto', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/admin/enterprise-dashboard', component: EnterpriseDashboardPage, layout: 'none', priority: 'high', meta: { title: 'Enterprise Dashboard', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/admin/cs-metrics', component: CSMetricsPage, layout: 'none', priority: 'high', meta: { title: 'CS Metrics Hub', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/admin/academia', component: AcademiaAdminPage, layout: 'none', priority: 'high', meta: { title: 'Academia Admin', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/admin/marketplace', component: MarketplaceAdmin, layout: 'none', priority: 'high', meta: { title: 'Marketplace Admin', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/admin/esg', component: ESGSustainabilityPage, layout: 'none', priority: 'high', meta: { title: 'ESG & Sostenibilidad', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/admin/ai-agents', component: AIAgentsPage, layout: 'none', priority: 'high', meta: { title: 'Agentes IA', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/admin/market-intelligence', component: MarketIntelligencePage, layout: 'none', priority: 'high', meta: { title: 'Market Intelligence', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/admin/crm-migration', component: CRMMigrationPage, layout: 'none', priority: 'high', meta: { title: 'Migración de CRM', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/admin/demo-requests', component: DemoRequestsPage, layout: 'none', priority: 'high', meta: { title: 'Solicitudes de Demo', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/obelixia-admin/module-studio', component: ModuleStudioHubPage, layout: 'none', priority: 'high', meta: { title: 'Module Studio Hub', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/obelixia-admin/module-studio/development', component: ModuleDevelopmentPage, layout: 'none', priority: 'high', meta: { title: 'Module Development', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/obelixia-admin/module-studio/operations', component: ModuleOperationsPage, layout: 'none', priority: 'high', meta: { title: 'Module Operations', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/obelixia-admin/module-studio/analytics', component: ModuleAnalyticsPage, layout: 'none', priority: 'high', meta: { title: 'Module Analytics', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/obelixia-admin/module-studio/governance', component: ModuleGovernancePage, layout: 'none', priority: 'high', meta: { title: 'Module Governance', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/obelixia-admin/module-studio/ecosystem', component: ModuleEcosystemPage, layout: 'none', priority: 'high', meta: { title: 'Module Ecosystem', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/obelixia-admin/automation-engine', component: AutomationEnginePage, layout: 'none', priority: 'high', meta: { title: 'Motor de Automatización', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/obelixia-admin/ai-local', component: AILocalPage, layout: 'none', priority: 'high', meta: { title: 'IA Local', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/obelixia-admin/licenses', component: LicenseManagementPage, layout: 'none', priority: 'high', meta: { title: 'Sistema de Licencias Enterprise', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/obelixia-admin', component: ObelixiaTeamAdmin, layout: 'none', priority: 'medium', delay: 50, meta: { title: 'Obelixia Admin', requiresAuth: true, roles: ['superadmin'] } },
];

// ============================================
// RUTAS DASHBOARD SETTINGS
// ============================================
export const settingsRoutes: RouteConfig[] = [
  { path: '/dashboard/settings', component: SettingsPage, layout: 'none', priority: 'medium', meta: { title: 'Configuración', requiresAuth: true } },
  { path: '/settings', component: SettingsPage, layout: 'none', priority: 'medium', meta: { title: 'Configuración', requiresAuth: true } },
];

// ============================================
// RUTAS ESPECIALES (Auth, Subscription...)
// ============================================
export const specialRoutes: RouteConfig[] = [
  { path: '/auth', component: Auth, layout: 'minimal', priority: 'high', meta: { title: 'Autenticación' } },
  { path: '/subscription/success', component: SubscriptionSuccess, layout: 'minimal', priority: 'high', meta: { title: 'Suscripción Exitosa' } },
];

// ============================================
// TODAS LAS RUTAS
// ============================================
export const allRoutes: RouteConfig[] = [
  ...publicRoutes,
  ...companyRoutes,
  ...resourceRoutes,
  ...legalRoutes,
  ...dashboardRoutes,
  ...adminRoutes,
  ...settingsRoutes,
  ...specialRoutes,
];

// Componente 404
export const notFoundRoute = {
  path: '*',
  component: NotFound,
  layout: 'minimal' as RouteLayout,
  priority: 'low' as RoutePriority,
};

// Redirects
export const redirects = [
  { from: '/', to: '/store' },
  { from: '/map', to: '/admin?section=map' },
  { from: '/resources/blog', to: '/blog' },
  { from: '/pricing', to: '/precios' },
  { from: '/demo-request', to: '/demo' },
  // Redirects de módulos movidos de /admin a /obelixia-admin
  { from: '/admin/academia', to: '/obelixia-admin?tab=academia' },
  { from: '/admin?section=translations', to: '/obelixia-admin?tab=translations' },
  { from: '/admin?section=web-vitals', to: '/obelixia-admin?tab=web-vitals' },
  { from: '/admin?section=vertical-packs', to: '/obelixia-admin?tab=verticals' },
  { from: '/admin?section=sectors-manager', to: '/obelixia-admin?tab=verticals' },
  { from: '/admin?section=analyzer', to: '/obelixia-admin?tab=docs' },
  { from: '/admin?section=app-store', to: '/obelixia-admin?tab=appstore' },
  { from: '/admin?section=whitelabel', to: '/obelixia-admin?tab=whitelabel' },
  { from: '/admin?section=api-docs', to: '/obelixia-admin?tab=api' },
];
