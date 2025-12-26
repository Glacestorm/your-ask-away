import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { 
  Search, Shield, LayoutGrid, FileText, BarChart3, Users, 
  Activity, Settings, Store, Code, Palette, GraduationCap,
  Languages, Briefcase, Gauge, Receipt, Euro, BookOpen,
  Newspaper, HelpCircle, Package, Layers, Rocket, Eye,
  Bell, Database, Trophy, ClipboardCheck, Building2, Zap,
  ShoppingCart, Headphones, MessageSquare, Bot, Map,
  Leaf, Globe, HeartPulse
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchItem {
  id: string;
  label: string;
  description: string;
  panel: 'admin' | 'obelixia';
  path: string;
  icon: React.ElementType;
  keywords: string[];
}

const searchItems: SearchItem[] = [
  // ObelixIA Admin Items
  { id: 'quotes', label: 'Presupuestos', description: 'Gestión de presupuestos', panel: 'obelixia', path: '/obelixia-admin?tab=quotes', icon: FileText, keywords: ['presupuesto', 'cotizacion', 'quote'] },
  { id: 'invoices', label: 'Facturas', description: 'Gestión de facturas', panel: 'obelixia', path: '/obelixia-admin?tab=invoices', icon: Receipt, keywords: ['factura', 'invoice', 'cobro'] },
  { id: 'pricing', label: 'Precios', description: 'Gestión de precios y módulos', panel: 'obelixia', path: '/obelixia-admin?tab=pricing', icon: Euro, keywords: ['precio', 'tarifa', 'pricing', 'modulo'] },
  { id: 'content', label: 'Contenidos', description: 'Gestión de contenidos', panel: 'obelixia', path: '/obelixia-admin?tab=content', icon: Settings, keywords: ['contenido', 'content', 'cms'] },
  { id: 'cms', label: 'CMS', description: 'Sistema de gestión de contenidos', panel: 'obelixia', path: '/obelixia-admin?tab=cms', icon: LayoutGrid, keywords: ['cms', 'contenido', 'paginas'] },
  { id: 'docs', label: 'Documentación', description: 'Generadores de documentación', panel: 'obelixia', path: '/obelixia-admin?tab=docs', icon: BookOpen, keywords: ['documentacion', 'docs', 'tecnico'] },
  { id: 'reports', label: 'Reportes', description: 'Consolidación de reportes y análisis', panel: 'obelixia', path: '/obelixia-admin?tab=reports', icon: BarChart3, keywords: ['reporte', 'report', 'analisis', 'informe'] },
  { id: 'appstore', label: 'App Store', description: 'Gestión de módulos', panel: 'obelixia', path: '/obelixia-admin?tab=appstore', icon: Store, keywords: ['app', 'store', 'modulo', 'aplicacion'] },
  { id: 'whitelabel', label: 'White Label', description: 'Configuración marca blanca', panel: 'obelixia', path: '/obelixia-admin?tab=whitelabel', icon: Palette, keywords: ['whitelabel', 'marca', 'branding', 'tema'] },
  { id: 'api', label: 'API', description: 'Documentación API', panel: 'obelixia', path: '/obelixia-admin?tab=api', icon: Code, keywords: ['api', 'documentacion', 'endpoint', 'rest'] },
  { id: 'academia', label: 'Academia', description: 'Gestión de cursos', panel: 'obelixia', path: '/obelixia-admin?tab=academia', icon: GraduationCap, keywords: ['academia', 'curso', 'formacion', 'training'] },
  { id: 'translations', label: 'Traducciones', description: 'Gestión de idiomas', panel: 'obelixia', path: '/obelixia-admin?tab=translations', icon: Languages, keywords: ['traduccion', 'idioma', 'language', 'i18n'] },
  { id: 'verticals', label: 'Verticales', description: 'Packs verticales y sectores', panel: 'obelixia', path: '/obelixia-admin?tab=verticals', icon: Briefcase, keywords: ['vertical', 'sector', 'pack', 'industria'] },
  { id: 'webvitals', label: 'Web Vitals', description: 'Métricas de rendimiento', panel: 'obelixia', path: '/obelixia-admin?tab=web-vitals', icon: Gauge, keywords: ['web', 'vitals', 'rendimiento', 'performance', 'core'] },
  { id: 'news', label: 'Noticias', description: 'Gestión de noticias', panel: 'obelixia', path: '/obelixia-admin?tab=news', icon: Newspaper, keywords: ['noticia', 'news', 'anuncio'] },
  { id: 'faq', label: 'FAQ', description: 'Preguntas frecuentes', panel: 'obelixia', path: '/obelixia-admin?tab=faq', icon: HelpCircle, keywords: ['faq', 'pregunta', 'ayuda', 'soporte'] },
  { id: 'security', label: 'Seguridad', description: 'Configuración de seguridad', panel: 'obelixia', path: '/obelixia-admin?tab=security', icon: Shield, keywords: ['seguridad', 'security', 'acceso', 'permisos'] },
  // Estrategia & Datos - Nuevos módulos
  { id: 'esg', label: 'ESG & Sostenibilidad', description: 'Métricas ESG y sostenibilidad', panel: 'obelixia', path: '/obelixia-admin?tab=esg', icon: Leaf, keywords: ['esg', 'sostenibilidad', 'carbono', 'ambiental', 'social', 'governance'] },
  { id: 'market-intel', label: 'Market Intelligence', description: 'Análisis de mercado y competencia', panel: 'obelixia', path: '/obelixia-admin?tab=market-intelligence', icon: Globe, keywords: ['market', 'mercado', 'competencia', 'tendencias', 'intelligence'] },
  { id: 'ai-agents-specific', label: 'Agentes IA Específicos', description: 'Agentes autónomos y copilot', panel: 'obelixia', path: '/obelixia-admin?tab=ai-agents-specific', icon: Bot, keywords: ['agentes', 'ia', 'ai', 'autonomo', 'copilot', 'voz'] },
  { id: 'enterprise-dash', label: 'Enterprise Dashboard', description: 'Visión ejecutiva enterprise', panel: 'obelixia', path: '/obelixia-admin?tab=enterprise-dashboard', icon: Building2, keywords: ['enterprise', 'ejecutivo', 'dashboard', 'vision'] },
  { id: 'cs-metrics-hub', label: 'CS Metrics Hub', description: 'Centro de métricas Customer Success', panel: 'obelixia', path: '/obelixia-admin?tab=cs-metrics', icon: HeartPulse, keywords: ['cs', 'customer', 'success', 'metricas', 'hub'] },
  { id: 'remote-support-obelixia', label: 'Soporte Remoto', description: 'Sistema de soporte remoto IA', panel: 'obelixia', path: '/obelixia-admin?tab=remote-support', icon: Headphones, keywords: ['soporte', 'remoto', 'ayuda', 'asistencia', 'ia'] },
  
  // Admin Panel Items
  { id: 'director', label: 'Director Comercial', description: 'Dashboard director comercial', panel: 'admin', path: '/admin?section=director', icon: Trophy, keywords: ['director', 'comercial', 'dashboard', 'vision'] },
  { id: 'office-director', label: 'Director de Oficina', description: 'Dashboard director oficina', panel: 'admin', path: '/admin?section=office-director', icon: Building2, keywords: ['oficina', 'director', 'sucursal'] },
  { id: 'commercial-manager', label: 'Jefe Comercial', description: 'Dashboard jefe comercial', panel: 'admin', path: '/admin?section=commercial-manager', icon: Activity, keywords: ['jefe', 'comercial', 'manager'] },
  { id: 'gestor-dashboard', label: 'Gestor', description: 'Dashboard gestor', panel: 'admin', path: '/admin?section=gestor-dashboard', icon: Users, keywords: ['gestor', 'vendedor', 'agente'] },
  { id: 'audit', label: 'Auditoría', description: 'Panel de auditoría', panel: 'admin', path: '/admin?section=audit', icon: ClipboardCheck, keywords: ['auditoria', 'audit', 'control', 'revision'] },
  { id: 'map', label: 'Mapa', description: 'Vista de mapa', panel: 'admin', path: '/admin?section=map', icon: Map, keywords: ['mapa', 'map', 'ubicacion', 'geo'] },
  { id: 'pipeline', label: 'Pipeline', description: 'Embudo de ventas', panel: 'admin', path: '/admin?section=pipeline', icon: Zap, keywords: ['pipeline', 'embudo', 'ventas', 'oportunidad'] },
  { id: 'companies', label: 'Empresas', description: 'Gestión de empresas', panel: 'admin', path: '/admin?section=companies', icon: Building2, keywords: ['empresa', 'company', 'cliente', 'organizacion'] },
  { id: 'products', label: 'Productos', description: 'Gestión de productos', panel: 'admin', path: '/admin?section=products', icon: Package, keywords: ['producto', 'product', 'catalogo'] },
  { id: 'users', label: 'Usuarios', description: 'Gestión de usuarios', panel: 'admin', path: '/admin?section=users', icon: Users, keywords: ['usuario', 'user', 'empleado', 'acceso'] },
  { id: 'tpv', label: 'TPV', description: 'Terminales punto de venta', panel: 'admin', path: '/admin?section=tpv', icon: ShoppingCart, keywords: ['tpv', 'terminal', 'punto', 'venta', 'pos'] },
  { id: 'alerts', label: 'Alertas', description: 'Configuración de alertas', panel: 'admin', path: '/admin?section=alerts', icon: Bell, keywords: ['alerta', 'alert', 'notificacion', 'aviso'] },
  { id: 'health', label: 'Estado del Sistema', description: 'Monitor de salud', panel: 'admin', path: '/admin?section=health', icon: Activity, keywords: ['sistema', 'health', 'monitor', 'estado'] },
  { id: 'internal-assistant', label: 'Asistente IA', description: 'Chat asistente interno', panel: 'admin', path: '/admin?section=internal-assistant', icon: Bot, keywords: ['asistente', 'ia', 'ai', 'chat', 'bot'] },
  { id: 'customer-360', label: 'Customer 360', description: 'Vista 360 del cliente', panel: 'admin', path: '/admin?section=customer-360', icon: Eye, keywords: ['customer', 'cliente', '360', 'vista'] },
  { id: 'rfm-analysis', label: 'Análisis RFM', description: 'Segmentación RFM', panel: 'admin', path: '/admin?section=rfm-analysis', icon: BarChart3, keywords: ['rfm', 'segmentacion', 'recencia', 'frecuencia'] },
  { id: 'dora-compliance', label: 'DORA Compliance', description: 'Cumplimiento DORA', panel: 'admin', path: '/admin?section=dora-compliance', icon: Shield, keywords: ['dora', 'compliance', 'regulacion', 'cumplimiento'] },
  { id: 'realtime-chat', label: 'Chat en Tiempo Real', description: 'Sistema de chat', panel: 'admin', path: '/admin?section=realtime-chat', icon: MessageSquare, keywords: ['chat', 'tiempo', 'real', 'mensaje', 'comunicacion'] },
];

interface AdminGlobalSearchProps {
  className?: string;
}

export function AdminGlobalSearch({ className }: AdminGlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const filteredItems = useMemo(() => {
    if (!search) return searchItems;
    const searchLower = search.toLowerCase();
    return searchItems.filter(item => 
      item.label.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower) ||
      item.keywords.some(k => k.includes(searchLower))
    );
  }, [search]);

  const obelixiaItems = filteredItems.filter(i => i.panel === 'obelixia');
  const adminItems = filteredItems.filter(i => i.panel === 'admin');

  const handleSelect = useCallback((item: SearchItem) => {
    setOpen(false);
    setSearch('');
    navigate(item.path);
  }, [navigate]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={cn(
          "gap-2 h-9 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all min-w-[200px] justify-start",
          className
        )}
      >
        <Search className="h-4 w-4" />
        <span className="text-sm">Buscar secciones...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-600 bg-slate-700 px-1.5 font-mono text-[10px] font-medium text-slate-400">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Buscar en Admin y ObelixIA..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          
          {obelixiaItems.length > 0 && (
            <CommandGroup heading="ObelixIA Admin">
              {obelixiaItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    value={item.label}
                    onSelect={() => handleSelect(item)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-500/20 to-emerald-500/20">
                        <Icon className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <Shield className="h-3.5 w-3.5 text-emerald-500/50" />
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
          
          {obelixiaItems.length > 0 && adminItems.length > 0 && <CommandSeparator />}
          
          {adminItems.length > 0 && (
            <CommandGroup heading="Panel Operativo">
              {adminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.id}
                    value={item.label}
                    onSelect={() => handleSelect(item)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <LayoutGrid className="h-3.5 w-3.5 text-primary/50" />
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

export default AdminGlobalSearch;
