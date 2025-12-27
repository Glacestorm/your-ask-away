/**
 * Configuración centralizada de navegación
 * Define todos los menús y enlaces de la aplicación
 */

import {
  Home,
  Package,
  Boxes,
  DollarSign,
  Building2,
  Users,
  Handshake,
  Briefcase,
  BookOpen,
  Code,
  FileText,
  Award,
  Shield,
  Scale,
  Cookie,
  FileCheck,
  MessageSquare,
  Store,
  Rocket,
  Cpu,
  BarChart3,
  Globe,
  Landmark,
  ShieldCheck,
  ShoppingBag,
  Factory,
  LayoutDashboard,
  Map,
  Settings,
  LogOut,
  Heart,
  GraduationCap,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';

// ============================================
// TIPOS
// ============================================

export interface NavItem {
  id: string;
  label: string;
  labelKey?: string; // Para i18n
  href: string;
  icon?: LucideIcon;
  description?: string;
  descriptionKey?: string; // Para i18n
  badge?: string;
  external?: boolean;
  children?: NavItem[];
}

export interface NavGroup {
  id: string;
  title: string;
  titleKey?: string;
  items: NavItem[];
}

// ============================================
// NAVEGACIÓN HEADER (Solo 4 dropdowns principales)
// ============================================

export const headerNavigation: NavItem[] = [
  {
    id: 'productos',
    label: 'Productos',
    labelKey: 'nav.products',
    href: '/store',
    icon: Package,
    children: [
      {
        id: 'modules',
        label: 'Módulos',
        labelKey: 'nav.modules',
        href: '/store/modules',
        icon: Package,
        description: 'Explora todos los módulos',
        descriptionKey: 'nav.modules.desc',
      },
      {
        id: 'bundles',
        label: 'Packs',
        labelKey: 'nav.bundles',
        href: '/store#bundles',
        icon: Boxes,
        description: 'Soluciones completas',
        descriptionKey: 'nav.bundles.desc',
      },
      {
        id: 'pricing',
        label: 'Precios',
        labelKey: 'nav.pricing',
        href: '/precios',
        icon: DollarSign,
        description: 'Planes y tarifas',
        descriptionKey: 'nav.pricing.desc',
      },
      {
        id: 'paquetes',
        label: 'Paquetes CRM/ERP',
        labelKey: 'nav.packages',
        href: '/paquetes',
        icon: Boxes,
        description: 'Solo CRM, Solo ERP o Suite Completa',
        descriptionKey: 'nav.packages.desc',
        badge: 'Nuevo',
      },
      {
        id: 'demo',
        label: 'Demo',
        labelKey: 'nav.demo',
        href: '/demo',
        icon: Rocket,
        description: 'Prueba interactiva',
        descriptionKey: 'nav.demo.desc',
      },
      {
        id: 'deployment',
        label: 'Despliegue',
        labelKey: 'nav.deployment',
        href: '/store/deployment',
        icon: Globe,
        description: 'Opciones de instalación',
        descriptionKey: 'nav.deployment.desc',
      },
    ],
  },
  {
    id: 'soluciones',
    label: 'Soluciones',
    labelKey: 'nav.solutions',
    href: '/sectores',
    icon: Globe,
    children: [
      {
        id: 'empresas',
        label: 'Empresas',
        labelKey: 'nav.enterprise',
        href: '/sectores/empresas',
        icon: Building2,
        description: 'Soluciones enterprise a medida',
        descriptionKey: 'nav.enterprise.desc',
        badge: 'Nuevo',
      },
      {
        id: 'banca',
        label: 'Banca',
        labelKey: 'nav.banking',
        href: '/sectores/banca',
        icon: Landmark,
        description: 'CRM bancario con cumplimiento normativo',
        descriptionKey: 'nav.banking.desc',
      },
      {
        id: 'seguros',
        label: 'Seguros',
        labelKey: 'nav.insurance',
        href: '/sectores/seguros',
        icon: ShieldCheck,
        description: 'Gestión integral de pólizas',
        descriptionKey: 'nav.insurance.desc',
      },
      {
        id: 'retail',
        label: 'Retail',
        labelKey: 'nav.retail',
        href: '/sectores/retail',
        icon: ShoppingBag,
        description: 'Omnicanalidad y experiencia cliente',
        descriptionKey: 'nav.retail.desc',
      },
      {
        id: 'manufactura',
        label: 'Manufactura',
        labelKey: 'nav.manufacturing',
        href: '/sectores/manufactura',
        icon: Factory,
        description: 'Producción y cadena de suministro',
        descriptionKey: 'nav.manufacturing.desc',
      },
      {
        id: 'salud',
        label: 'Salud',
        labelKey: 'nav.health',
        href: '/sectores/salud',
        icon: Heart,
        description: 'Gestión de pacientes y citas',
        descriptionKey: 'nav.health.desc',
      },
      {
        id: 'educacion',
        label: 'Educación',
        labelKey: 'nav.education',
        href: '/sectores/educacion',
        icon: GraduationCap,
        description: 'Instituciones educativas',
        descriptionKey: 'nav.education.desc',
      },
      {
        id: 'ecommerce',
        label: 'Ecommerce',
        labelKey: 'nav.ecommerce',
        href: '/sectores/ecommerce',
        icon: Globe,
        description: 'Ventas online y marketplaces',
        descriptionKey: 'nav.ecommerce.desc',
      },
      {
        id: 'agencias',
        label: 'Agencias',
        labelKey: 'nav.agencies',
        href: '/sectores/agencias',
        icon: Briefcase,
        description: 'Gestión de clientes y proyectos',
        descriptionKey: 'nav.agencies.desc',
      },
      {
        id: 'suscripciones',
        label: 'Suscripciones',
        labelKey: 'nav.subscriptions',
        href: '/sectores/suscripciones',
        icon: CreditCard,
        description: 'Modelos de negocio recurrentes',
        descriptionKey: 'nav.subscriptions.desc',
      },
      {
        id: 'infoproductores',
        label: 'Infoproductores',
        labelKey: 'nav.infoproducers',
        href: '/sectores/infoproductores',
        icon: Users,
        description: 'Creadores de contenido',
        descriptionKey: 'nav.infoproducers.desc',
      },
    ],
  },
  {
    id: 'plataforma',
    label: 'Plataforma',
    labelKey: 'nav.platform',
    href: '/marketplace',
    icon: Cpu,
    children: [
      { id: 'marketplace', label: 'Marketplace', labelKey: 'nav.marketplace', href: '/marketplace', icon: Store, badge: 'Nuevo' },
      { id: 'lowcode', label: 'Low Code', href: '/lowcode', icon: Code },
      { id: 'cdp', label: 'CDP Analytics', labelKey: 'nav.cdp', href: '/cdp', icon: BarChart3 },
      { id: 'chat', label: 'Chat IA', labelKey: 'nav.chat', href: '/chat', icon: MessageSquare, badge: 'IA' },
    ],
  },
  {
    id: 'desarrolladores',
    label: 'Desarrolladores',
    labelKey: 'nav.developers',
    href: '/developers',
    icon: Code,
    children: [
      { id: 'docs', label: 'Documentación', labelKey: 'nav.documentation', href: '/docs', icon: BookOpen },
      { id: 'api', label: 'API Reference', labelKey: 'nav.api', href: '/api', icon: Code },
      { id: 'developer-portal', label: 'Portal Dev', labelKey: 'nav.devportal', href: '/developers', icon: Rocket },
    ],
  },
];

// Mantener mainNavigation como alias para compatibilidad
export const mainNavigation = headerNavigation;

// ============================================
// NAVEGACIÓN FOOTER
// ============================================

export const footerNavigation: NavGroup[] = [
  {
    id: 'productos',
    title: 'Productos',
    titleKey: 'footer.products',
    items: [
      { id: 'modules', label: 'Módulos', href: '/store/modules', icon: Package },
      { id: 'bundles', label: 'Packs', href: '/store#bundles', icon: Boxes },
      { id: 'paquetes', label: 'Paquetes CRM/ERP', href: '/paquetes', icon: Boxes },
      { id: 'precios', label: 'Precios', href: '/precios', icon: DollarSign },
      { id: 'marketplace', label: 'Marketplace', href: '/marketplace', icon: Store },
      { id: 'chat', label: 'Chat IA', href: '/chat', icon: MessageSquare },
    ],
  },
  {
    id: 'soluciones',
    title: 'Soluciones',
    titleKey: 'footer.solutions',
    items: [
      { id: 'banca', label: 'Banca', href: '/sectores/banca', icon: Landmark },
      { id: 'seguros', label: 'Seguros', href: '/sectores/seguros', icon: ShieldCheck },
      { id: 'retail', label: 'Retail', href: '/sectores/retail', icon: ShoppingBag },
      { id: 'manufactura', label: 'Manufactura', href: '/sectores/manufactura', icon: Factory },
      { id: 'salud', label: 'Salud', href: '/sectores/salud', icon: Heart },
      { id: 'educacion', label: 'Educación', href: '/sectores/educacion', icon: GraduationCap },
      { id: 'ecommerce', label: 'Ecommerce', href: '/sectores/ecommerce', icon: Globe },
      { id: 'agencias', label: 'Agencias', href: '/sectores/agencias', icon: Briefcase },
      { id: 'suscripciones', label: 'Suscripciones', href: '/sectores/suscripciones', icon: CreditCard },
      { id: 'infoproductores', label: 'Infoproductores', href: '/sectores/infoproductores', icon: Users },
    ],
  },
  {
    id: 'desarrolladores',
    title: 'Desarrolladores',
    titleKey: 'footer.developers',
    items: [
      { id: 'docs', label: 'Documentación', href: '/docs', icon: BookOpen },
      { id: 'api', label: 'API Reference', href: '/api', icon: Code },
      { id: 'developers', label: 'Portal Dev', labelKey: 'footer.devPortal', href: '/developers', icon: Rocket },
      { id: 'partners', label: 'Portal Partners', labelKey: 'footer.partnerPortal', href: '/partner-portal', icon: Handshake },
    ],
  },
  {
    id: 'empresa',
    title: 'Empresa',
    titleKey: 'footer.company',
    items: [
      { id: 'about', label: 'Sobre Nosotros', href: '/about', icon: Building2 },
      { id: 'contact', label: 'Contacto', href: '/contact', icon: Users },
      { id: 'partners', label: 'Partners', href: '/partners', icon: Handshake },
      { id: 'careers', label: 'Carreras', href: '/careers', icon: Briefcase },
      { id: 'blog', label: 'Blog', href: '/blog', icon: FileText },
    ],
  },
  {
    id: 'recursos',
    title: 'Recursos',
    titleKey: 'footer.resources',
    items: [
      { id: 'cases', label: 'Casos de Éxito', href: '/cases', icon: Award },
      { id: 'comparativas', label: 'Comparativas', href: '/comparativas', icon: BarChart3 },
      { id: 'demo', label: 'Demo', href: '/demo', icon: Rocket },
      { id: 'security', label: 'Seguridad', href: '/seguridad', icon: Shield },
    ],
  },
  {
    id: 'legal',
    title: 'Legal',
    titleKey: 'footer.legal',
    items: [
      { id: 'terms', label: 'Términos de Servicio', href: '/terms', icon: Scale },
      { id: 'privacy', label: 'Política de Privacidad', href: '/privacy', icon: Shield },
      { id: 'cookies', label: 'Cookies', href: '/cookies', icon: Cookie },
      { id: 'gdpr', label: 'GDPR', href: '/gdpr', icon: FileCheck },
    ],
  },
];

// ============================================
// NAVEGACIÓN USUARIO (Dashboard)
// ============================================

export const userNavigation: NavItem[] = [
  { id: 'home', label: 'Inicio', href: '/home', icon: Home },
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { id: 'map', label: 'Mapa', href: '/admin?section=map', icon: Map },
  { id: 'profile', label: 'Perfil', href: '/profile', icon: Users },
];

export const adminNavigation: NavItem[] = [
  { id: 'admin', label: 'Administración', href: '/admin', icon: Settings },
  { id: 'obelixia-admin', label: 'Obelixia Admin', href: '/obelixia-admin', icon: Shield },
];

// ============================================
// ACCIONES RÁPIDAS
// ============================================

export const quickActions: NavItem[] = [
  { id: 'demo', label: 'Solicitar Demo', labelKey: 'quickActions.demo', href: '/demo', icon: Rocket },
  { id: 'contact', label: 'Contacto', labelKey: 'quickActions.contact', href: '/contact', icon: Users },
  { id: 'chat', label: 'Chat IA', labelKey: 'quickActions.chat', href: '/chat', icon: MessageSquare },
];


// ============================================
// HELPERS
// ============================================

/**
 * Obtiene un item de navegación por su ID
 */
export function getNavItemById(id: string): NavItem | undefined {
  const searchInItems = (items: NavItem[]): NavItem | undefined => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = searchInItems(item.children);
        if (found) return found;
      }
    }
    return undefined;
  };
  
  return searchInItems(mainNavigation);
}

/**
 * Obtiene todos los items de navegación como array plano
 */
export function getFlatNavItems(): NavItem[] {
  const flatten = (items: NavItem[]): NavItem[] => {
    return items.reduce<NavItem[]>((acc, item) => {
      acc.push(item);
      if (item.children) {
        acc.push(...flatten(item.children));
      }
      return acc;
    }, []);
  };
  
  return flatten(mainNavigation);
}

/**
 * Verifica si una ruta está activa
 */
export function isRouteActive(currentPath: string, href: string): boolean {
  if (href === '#') return false;
  if (href === '/') return currentPath === '/';
  return currentPath.startsWith(href);
}
