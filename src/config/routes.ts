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
const CaseStudies = lazy(() => import('@/pages/resources/CaseStudies'));
const TrendsDashboard = lazy(() => import('@/pages/resources/TrendsDashboard'));

// Sectors
const SectorLanding = lazy(() => import('@/pages/sectors/SectorLanding'));
const BancaLanding = lazy(() => import('@/pages/sectors/BancaLanding'));
const SegurosLanding = lazy(() => import('@/pages/sectors/SegurosLanding'));
const RetailLanding = lazy(() => import('@/pages/sectors/RetailLanding'));
const ManufacturaLanding = lazy(() => import('@/pages/sectors/ManufacturaLanding'));

// Marketing
const ComparativasCRM = lazy(() => import('@/pages/comparativas/ComparativasCRM'));
const Seguridad = lazy(() => import('@/pages/Seguridad'));
const Precios = lazy(() => import('@/pages/Precios'));
const DemoInteractiva = lazy(() => import('@/pages/DemoInteractiva'));
const LowCodePage = lazy(() => import('@/pages/LowCodePage'));
const CDPDashboard = lazy(() => import('@/pages/CDPDashboard'));

// Marketplace & Developer
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const MarketplaceAppDetail = lazy(() => import('@/pages/MarketplaceAppDetail'));
const PartnerPortal = lazy(() => import('@/pages/PartnerPortal'));
const DeveloperPortal = lazy(() => import('@/pages/DeveloperPortal'));

// Subscription
const SubscriptionSuccess = lazy(() => import('@/pages/subscription/Success'));

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
  // Store - StoreLanding tiene su propio navbar integrado, usa 'none'
  { path: '/store', component: StoreLanding, layout: 'none', priority: 'high', meta: { title: 'Store' } },
  { path: '/store/modules', component: StoreModules, layout: 'public', priority: 'high', meta: { title: 'Módulos' } },
  { path: '/store/modules/:moduleKey', component: StoreModuleDetail, layout: 'public', priority: 'high' },
  { path: '/store/deployment', component: StoreDeployment, layout: 'public', priority: 'high' },
  { path: '/store/checkout', component: StoreCheckout, layout: 'public', priority: 'high' },
  { path: '/store/success', component: CheckoutSuccess, layout: 'public', priority: 'high' },
  
  // Sectors
  { path: '/sectores', component: SectorLanding, layout: 'public', priority: 'high', meta: { title: 'Sectores' } },
  { path: '/sectores/banca', component: BancaLanding, layout: 'public', priority: 'high', meta: { title: 'Banca' } },
  { path: '/sectores/seguros', component: SegurosLanding, layout: 'public', priority: 'high', meta: { title: 'Seguros' } },
  { path: '/sectores/retail', component: RetailLanding, layout: 'public', priority: 'high', meta: { title: 'Retail' } },
  { path: '/sectores/manufactura', component: ManufacturaLanding, layout: 'public', priority: 'high', meta: { title: 'Manufactura' } },
  
  // Marketing
  { path: '/comparativas', component: ComparativasCRM, layout: 'public', priority: 'high', meta: { title: 'Comparativas CRM' } },
  { path: '/seguridad', component: Seguridad, layout: 'public', priority: 'high', meta: { title: 'Seguridad' } },
  { path: '/precios', component: Precios, layout: 'public', priority: 'high', meta: { title: 'Precios' } },
  { path: '/demo', component: DemoInteractiva, layout: 'public', priority: 'high', meta: { title: 'Demo' } },
  { path: '/demo-request', component: DemoInteractiva, layout: 'public', priority: 'high' },
  
  // Marketplace & Developer Portal
  { path: '/marketplace', component: Marketplace, layout: 'public', priority: 'high', meta: { title: 'Marketplace' } },
  { path: '/marketplace/:appKey', component: MarketplaceAppDetail, layout: 'public', priority: 'high' },
  { path: '/developers', component: DeveloperPortal, layout: 'public', priority: 'medium', meta: { title: 'Portal de Desarrolladores' } },
  { path: '/partner-portal', component: PartnerPortal, layout: 'public', priority: 'medium', meta: { title: 'Portal de Partners' } },
  
  // Features
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
  { path: '/cases', component: CaseStudies, layout: 'public', priority: 'low', meta: { title: 'Casos de Éxito' } },
  { path: '/trends', component: TrendsDashboard, layout: 'none', priority: 'medium', meta: { title: 'Tendencias del Sector' } },
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
];

// ============================================
// RUTAS ADMIN (Requieren roles especiales)
// ============================================
export const adminRoutes: RouteConfig[] = [
  { path: '/admin', component: Admin, layout: 'none', priority: 'medium', delay: 50, meta: { title: 'Admin', requiresAuth: true, roles: ['admin', 'superadmin'] } },
  { path: '/obelixia-admin', component: ObelixiaTeamAdmin, layout: 'dashboard', priority: 'medium', delay: 50, meta: { title: 'Obelixia Admin', requiresAuth: true, roles: ['superadmin'] } },
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
];
