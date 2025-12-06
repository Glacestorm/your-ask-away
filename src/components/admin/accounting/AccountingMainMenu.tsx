import { useState } from 'react';
import { ChevronDown, ChevronRight, Home, Building2, FileInput, FileOutput, Database, Shield, Users, FileText, BarChart3, PieChart, TrendingUp, Calculator, Landmark, ClipboardList, Target, LineChart, Scale, BookOpen, FileCheck, Search, Briefcase, Wallet, Activity, DollarSign, Gauge, Award, FileBarChart, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface MenuCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  items: MenuItem[];
}

interface AccountingMainMenuProps {
  onNavigate: (section: string) => void;
  currentSection?: string;
}

const menuCategories: MenuCategory[] = [
  {
    id: 'datos-generales',
    title: 'DATOS GENERALES',
    icon: <Database className="h-5 w-5" />,
    gradientFrom: 'from-slate-100 dark:from-slate-900/50',
    gradientTo: 'to-slate-50 dark:to-slate-800/30',
    accentColor: 'text-slate-700 dark:text-slate-300 border-slate-400 dark:border-slate-600',
    items: [
      { id: 'inicio', label: 'Inicio Aplicación', icon: <Home className="h-4 w-4" /> },
      { id: 'empresas', label: 'Empresas', icon: <Building2 className="h-4 w-4" /> },
      { id: 'introduccion-datos', label: 'Introducción Datos', icon: <FileInput className="h-4 w-4" /> },
      { id: 'importacion-datos', label: 'Importación de Datos', icon: <FileOutput className="h-4 w-4" /> },
      { id: 'exportacion-datos', label: 'Exportación de Datos', icon: <FileOutput className="h-4 w-4" /> },
      { id: 'copia-seguridad', label: 'Copia de Seguridad', icon: <Shield className="h-4 w-4" /> },
      { id: 'consolidacion', label: 'Consolidación Empresas', icon: <Users className="h-4 w-4" /> },
    ]
  },
  {
    id: 'balances',
    title: 'BALANCES',
    icon: <Scale className="h-5 w-5" />,
    gradientFrom: 'from-blue-100 dark:from-blue-950/50',
    gradientTo: 'to-blue-50 dark:to-blue-900/30',
    accentColor: 'text-blue-700 dark:text-blue-400 border-blue-400 dark:border-blue-600',
    items: [
      { id: 'balance-situacion', label: 'Balance de Situación', icon: <FileText className="h-4 w-4" /> },
      { id: 'estado-perdidas-ganancias', label: 'Est.de Pérd.y Gananc.', icon: <BarChart3 className="h-4 w-4" /> },
      { id: 'activo-disponible', label: 'Activo Disp.y Realiz.', icon: <Wallet className="h-4 w-4" /> },
      { id: 'activo-no-corriente', label: 'Activo No Corriente', icon: <Landmark className="h-4 w-4" /> },
      { id: 'activo-funcional', label: 'Activo Funcional', icon: <Briefcase className="h-4 w-4" /> },
      { id: 'exigible', label: 'Exigible a corto y largo', icon: <ClipboardList className="h-4 w-4" /> },
      { id: 'fondos-propios', label: 'Fondos Propios', icon: <DollarSign className="h-4 w-4" /> },
      { id: 'resultados-explotacion', label: 'Resultados Explotación', icon: <Activity className="h-4 w-4" /> },
      { id: 'resultados-financieros', label: 'Resultados Financieros', icon: <TrendingUp className="h-4 w-4" /> },
    ]
  },
  {
    id: 'financiera',
    title: 'FINANCIERA',
    icon: <TrendingUp className="h-5 w-5" />,
    gradientFrom: 'from-emerald-100 dark:from-emerald-950/50',
    gradientTo: 'to-emerald-50 dark:to-emerald-900/30',
    accentColor: 'text-emerald-700 dark:text-emerald-400 border-emerald-400 dark:border-emerald-600',
    items: [
      { id: 'masas-patrimoniales', label: 'Bal. Masas Patrimoniales', icon: <Layers className="h-4 w-4" /> },
      { id: 'cuadro-analitico', label: 'Cuadro Analítico P.y G.', icon: <PieChart className="h-4 w-4" /> },
      { id: 'resumen-analitico', label: 'Resumen Analítico en %.', icon: <BarChart3 className="h-4 w-4" /> },
      { id: 'flujo-caja', label: 'Análisis Flujo de Caja', icon: <Activity className="h-4 w-4" /> },
      { id: 'valor-anadido', label: 'Análisis Valor Añadido', icon: <TrendingUp className="h-4 w-4" /> },
      { id: 'cuadro-financiacion', label: 'Cuadro de Financiación', icon: <FileText className="h-4 w-4" /> },
      { id: 'ebit-ebitda', label: 'Análisis EBIT y EBITDA', icon: <Calculator className="h-4 w-4" /> },
      { id: 'capital-circulante', label: 'Análisis Cap.Circulante', icon: <Gauge className="h-4 w-4" /> },
      { id: 'situacion-largo-plazo', label: 'Anál.Situac.Fin.Lgo.Pzo.', icon: <LineChart className="h-4 w-4" /> },
      { id: 'flujos-tesoreria', label: 'Flujos de Tesorería', icon: <Wallet className="h-4 w-4" /> },
      { id: 'nof', label: 'Nec.Oper.de Fondos', icon: <Target className="h-4 w-4" /> },
      { id: 'cuadro-mando', label: 'Cuadro de Mando Finan.', icon: <Gauge className="h-4 w-4" /> },
      { id: 'indice-z', label: 'Análisis Índice "Z"', icon: <Search className="h-4 w-4" /> },
    ]
  },
  {
    id: 'ratios',
    title: 'RATIOS',
    icon: <PieChart className="h-5 w-5" />,
    gradientFrom: 'from-cyan-100 dark:from-cyan-950/50',
    gradientTo: 'to-cyan-50 dark:to-cyan-900/30',
    accentColor: 'text-cyan-700 dark:text-cyan-400 border-cyan-400 dark:border-cyan-600',
    items: [
      { id: 'ratios-liquidez', label: 'Ratios de Liquidez', icon: <Wallet className="h-4 w-4" /> },
      { id: 'ratios-endeudamiento', label: 'Ratios Endeudamiento', icon: <Scale className="h-4 w-4" /> },
      { id: 'ratios-sectoriales', label: 'Ratios Sectoriales', icon: <BarChart3 className="h-4 w-4" /> },
      { id: 'simulador-sectorial', label: 'Simulador Otros Sector.', icon: <Calculator className="h-4 w-4" /> },
      { id: 'piramide-ratios', label: 'Pirámide de Ratios Fin.', icon: <TrendingUp className="h-4 w-4" /> },
      { id: 'piramide-dupont', label: 'Pirámide Dupont', icon: <Target className="h-4 w-4" /> },
      { id: 'analisis-bancario', label: 'Análisis Bancario', icon: <Landmark className="h-4 w-4" /> },
    ]
  },
  {
    id: 'rentabilidad',
    title: 'RENTABILIDAD',
    icon: <Award className="h-5 w-5" />,
    gradientFrom: 'from-teal-100 dark:from-teal-950/50',
    gradientTo: 'to-teal-50 dark:to-teal-900/30',
    accentColor: 'text-teal-700 dark:text-teal-400 border-teal-400 dark:border-teal-600',
    items: [
      { id: 'rentabilidad-economica', label: 'Anál.Rentab.Económica', icon: <TrendingUp className="h-4 w-4" /> },
      { id: 'umbral-rentabilidad', label: 'Umbral de Rentabilidad', icon: <Target className="h-4 w-4" /> },
      { id: 'apalancamiento', label: 'Apalancam.Financiero', icon: <Scale className="h-4 w-4" /> },
      { id: 'fondo-maniobra', label: 'Fondo de Maniobra', icon: <Wallet className="h-4 w-4" /> },
      { id: 'autofinanciacion', label: 'Capac.Autofinanciación', icon: <DollarSign className="h-4 w-4" /> },
      { id: 'periodos-maduracion', label: 'Periodos Maduración', icon: <Activity className="h-4 w-4" /> },
      { id: 'capacidad-crecimiento', label: 'Capacidad Crecimiento', icon: <LineChart className="h-4 w-4" /> },
      { id: 'nivel-endeudamiento', label: 'Nivel Endeudamiento', icon: <BarChart3 className="h-4 w-4" /> },
      { id: 'estados-financieros', label: 'Anál.Estad.Financieros', icon: <FileText className="h-4 w-4" /> },
      { id: 'resumen-financiero', label: 'Resumen Financiero', icon: <ClipboardList className="h-4 w-4" /> },
    ]
  },
  {
    id: 'valoraciones',
    title: 'VALORACIONES',
    icon: <Calculator className="h-5 w-5" />,
    gradientFrom: 'from-amber-100 dark:from-amber-950/50',
    gradientTo: 'to-amber-50 dark:to-amber-900/30',
    accentColor: 'text-amber-700 dark:text-amber-400 border-amber-500 dark:border-amber-600',
    items: [
      { id: 'activo-neto', label: 'Mét.: Activo Neto real', icon: <Wallet className="h-4 w-4" /> },
      { id: 'valor-substancial', label: 'Mét.: Valor Substancial', icon: <DollarSign className="h-4 w-4" /> },
      { id: 'multiplos', label: 'Método de los Múltiplos', icon: <Calculator className="h-4 w-4" /> },
      { id: 'flujos-descontados', label: 'Mét.: Flujos Descontados', icon: <Activity className="h-4 w-4" /> },
      { id: 'proyecciones', label: 'Proyecciones Financieras', icon: <LineChart className="h-4 w-4" /> },
      { id: 'proyecto-inversion', label: 'Proyecto de Inversión', icon: <Target className="h-4 w-4" /> },
    ]
  },
  {
    id: 'auditoria',
    title: 'AUDITORÍA',
    icon: <FileCheck className="h-5 w-5" />,
    gradientFrom: 'from-zinc-100 dark:from-zinc-900/50',
    gradientTo: 'to-zinc-50 dark:to-zinc-800/30',
    accentColor: 'text-zinc-700 dark:text-zinc-300 border-zinc-400 dark:border-zinc-600',
    items: [
      { id: 'desv-balance', label: '% y Desv. Bal.Situación', icon: <FileText className="h-4 w-4" /> },
      { id: 'desv-resultados', label: '% y Desv. Cta.Resultad.', icon: <BarChart3 className="h-4 w-4" /> },
      { id: 'audit-fondo-maniobra', label: 'Audit.Fondo Maniobra', icon: <Wallet className="h-4 w-4" /> },
      { id: 'audit-acid-test', label: 'Audit.del Acid Test', icon: <Activity className="h-4 w-4" /> },
      { id: 'audit-disponibilidad', label: 'Audit. Disponib.Ordinaria', icon: <DollarSign className="h-4 w-4" /> },
      { id: 'audit-cobro', label: 'Audit.Pzos.Medio Cobro', icon: <Target className="h-4 w-4" /> },
      { id: 'audit-pago', label: 'Audit.Pzos.Medio Pago', icon: <ClipboardList className="h-4 w-4" /> },
      { id: 'audit-rotacion', label: 'Audit.Rotac.Existencias', icon: <TrendingUp className="h-4 w-4" /> },
      { id: 'audit-apalancamiento', label: 'Audit. del Apalancam.', icon: <Scale className="h-4 w-4" /> },
      { id: 'audit-fondos-propios', label: 'Audit. Fondos Propios', icon: <Landmark className="h-4 w-4" /> },
      { id: 'audit-endeudamiento', label: 'Audit.del Endeudamiento', icon: <BarChart3 className="h-4 w-4" /> },
    ]
  },
  {
    id: 'cuentas-anuales',
    title: 'CUENTAS ANUALES',
    icon: <BookOpen className="h-5 w-5" />,
    gradientFrom: 'from-indigo-100 dark:from-indigo-950/50',
    gradientTo: 'to-indigo-50 dark:to-indigo-900/30',
    accentColor: 'text-indigo-700 dark:text-indigo-400 border-indigo-400 dark:border-indigo-600',
    items: [
      { id: 'ca-balance', label: 'Balance de Situación', icon: <FileText className="h-4 w-4" /> },
      { id: 'ca-perdidas-ganancias', label: 'Est.de Pérd.y Gananc.', icon: <BarChart3 className="h-4 w-4" /> },
      { id: 'ca-flujos-efectivo', label: 'Est.de los Flujos Efectivo', icon: <Activity className="h-4 w-4" /> },
      { id: 'ca-cambios-patrimonio', label: 'Est.Cambios Pat.Neto', icon: <TrendingUp className="h-4 w-4" /> },
      { id: 'ca-gastos-ingresos', label: 'Est.Gtos e Ing.reconoc.', icon: <DollarSign className="h-4 w-4" /> },
    ]
  },
  {
    id: 'informes',
    title: 'INFORMES',
    icon: <FileBarChart className="h-5 w-5" />,
    gradientFrom: 'from-sky-100 dark:from-sky-950/50',
    gradientTo: 'to-sky-50 dark:to-sky-900/30',
    accentColor: 'text-sky-700 dark:text-sky-400 border-sky-400 dark:border-sky-600',
    items: [
      { id: 'bateria-informes', label: 'Batería de Informes', icon: <FileText className="h-4 w-4" /> },
    ]
  },
  {
    id: 'estudios',
    title: 'ESTUDIOS',
    icon: <Search className="h-5 w-5" />,
    gradientFrom: 'from-stone-100 dark:from-stone-900/50',
    gradientTo: 'to-stone-50 dark:to-stone-800/30',
    accentColor: 'text-stone-700 dark:text-stone-300 border-stone-400 dark:border-stone-600',
    items: [
      { id: 'estudio-sectorial', label: 'Estudio Sectorial', icon: <PieChart className="h-4 w-4" /> },
      { id: 'estudio-financiero', label: 'Estudio Anál.Financiero', icon: <LineChart className="h-4 w-4" /> },
      { id: 'comentarios-gestion', label: 'Comentarios de Gestión', icon: <ClipboardList className="h-4 w-4" /> },
    ]
  },
  {
    id: 'valor-acciones',
    title: 'VALOR ACCIONES',
    icon: <TrendingUp className="h-5 w-5" />,
    gradientFrom: 'from-green-100 dark:from-green-950/50',
    gradientTo: 'to-green-50 dark:to-green-900/30',
    accentColor: 'text-green-700 dark:text-green-400 border-green-400 dark:border-green-600',
    items: [
      { id: 'eva', label: 'Creación de Valor.EVA', icon: <Award className="h-4 w-4" /> },
      { id: 'per', label: 'Análisis del PER', icon: <BarChart3 className="h-4 w-4" /> },
      { id: 'capitalizacion', label: 'Valores Capitalización', icon: <DollarSign className="h-4 w-4" /> },
    ]
  },
];

// Mapping de secciones del menú a vistas reales del sistema
const sectionMappings: Record<string, string> = {
  'inicio': 'menu',
  'empresas': 'company-index',
  'introduccion-datos': 'data-entry',
  'importacion-datos': 'pdf-import',
  'exportacion-datos': 'reports',
  'consolidacion': 'consolidated',
  'balance-situacion': 'balance-sheet',
  'estado-perdidas-ganancias': 'income-statement',
  'flujo-caja': 'cash-flow',
  'valor-anadido': 'added-value',
  'ebit-ebitda': 'ebit-ebitda',
  'capital-circulante': 'working-capital',
  'situacion-largo-plazo': 'long-term',
  'flujos-tesoreria': 'treasury',
  'nof': 'nof',
  'indice-z': 'z-score',
  'ratios-liquidez': 'liquidity-ratios',
  'ratios-endeudamiento': 'debt-ratios',
  'ratios-sectoriales': 'sector-ratios',
  'simulador-sectorial': 'sector-simulator',
  'piramide-ratios': 'ratios-pyramid',
  'piramide-dupont': 'dupont',
  'analisis-bancario': 'bank-rating',
  'rentabilidad-economica': 'profitability',
  'ca-balance': 'balance-sheet',
  'ca-perdidas-ganancias': 'income-statement',
  'ca-flujos-efectivo': 'cash-flow-form',
  'ca-cambios-patrimonio': 'equity-changes',
  'bateria-informes': 'reports',
  'masas-patrimoniales': 'balance-analysis',
  'cuadro-analitico': 'analytical-pl',
  'cuadro-financiacion': 'financing',
  'cuadro-mando': 'economic-dashboard',
};

export function AccountingMainMenu({ onNavigate, currentSection }: AccountingMainMenuProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['datos-generales', 'balances']);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleItemClick = (itemId: string) => {
    // Usar el mapping si existe, sino usar el ID directamente
    const targetSection = sectionMappings[itemId] || itemId;
    onNavigate(targetSection);
  };

  return (
    <div className="w-full min-h-[650px] bg-gradient-to-br from-background via-muted/20 to-background rounded-2xl border border-border/30 shadow-lg overflow-hidden">
      {/* Header con diseño moderno */}
      <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b border-border/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="relative text-center">
          <Badge variant="outline" className="mb-3 px-4 py-1 text-xs font-medium bg-background/80 backdrop-blur-sm">
            Mòdul de Comptabilitat
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Organigrama Comptable Corporate / Empreses
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Selecciona una opció per accedir a les funcionalitats del sistema
          </p>
        </div>
      </div>

      {/* Menu Grid */}
      <ScrollArea className="h-[520px] p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {menuCategories.map((category) => {
            const isExpanded = expandedCategories.includes(category.id);
            
            return (
              <div 
                key={category.id} 
                className={cn(
                  "flex flex-col rounded-xl overflow-hidden transition-all duration-300",
                  "border border-border/40 shadow-sm hover:shadow-md",
                  isExpanded && "ring-1 ring-primary/20"
                )}
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3.5 font-semibold text-sm transition-all",
                    "bg-gradient-to-r",
                    category.gradientFrom,
                    category.gradientTo,
                    "hover:brightness-105 group"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn("p-1.5 rounded-lg bg-background/60 backdrop-blur-sm", category.accentColor)}>
                      {category.icon}
                    </div>
                    <span className={cn("font-bold text-xs tracking-wide", category.accentColor.split(' ')[0])}>
                      {category.title}
                    </span>
                  </div>
                  <div className={cn(
                    "p-1 rounded-full transition-transform duration-200",
                    category.accentColor.split(' ')[0],
                    isExpanded && "rotate-180"
                  )}>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                {/* Category Items */}
                <div className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                )}>
                  <div className="p-2 space-y-1 bg-muted/30">
                    {category.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={cn(
                          "w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all",
                          "bg-background/70 hover:bg-background border border-transparent",
                          "hover:border-primary/30 hover:shadow-sm hover:translate-x-0.5",
                          currentSection === item.id && "bg-primary/10 border-primary/40 text-primary font-semibold"
                        )}
                      >
                        <span className={cn(
                          "flex-shrink-0 opacity-60",
                          currentSection === item.id && "opacity-100 text-primary"
                        )}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border/30 bg-muted/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs text-muted-foreground font-medium">
              Sistema Actiu
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            VERSIÓ: EMPRESES EN GENERAL
          </Badge>
        </div>
      </div>
    </div>
  );
}

export { menuCategories };
