import { useState } from 'react';
import { ChevronDown, ChevronRight, Home, Building2, FileInput, FileOutput, Database, Shield, Users, FileText, BarChart3, PieChart, TrendingUp, Calculator, Landmark, ClipboardList, Target, LineChart, Scale, BookOpen, FileCheck, Search, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MenuCategory {
  id: string;
  title: string;
  color: string;
  bgColor: string;
  items: { id: string; label: string; icon?: React.ReactNode }[];
}

interface AccountingMainMenuProps {
  onNavigate: (section: string) => void;
  currentSection?: string;
}

const menuCategories: MenuCategory[] = [
  {
    id: 'datos-generales',
    title: 'DATOS GENERALES',
    color: 'hsl(45, 100%, 50%)',
    bgColor: 'hsl(45, 100%, 20%)',
    items: [
      { id: 'inicio', label: 'Inicio Aplicación' },
      { id: 'empresas', label: 'Empresas' },
      { id: 'introduccion-datos', label: 'Introducción Datos' },
      { id: 'importacion-datos', label: 'Importación de Datos' },
      { id: 'exportacion-datos', label: 'Exportación de Datos' },
      { id: 'copia-seguridad', label: 'Copia de Seguridad' },
      { id: 'consolidacion', label: 'Consolidación Empresas' },
    ]
  },
  {
    id: 'balances',
    title: 'BALANCES',
    color: 'hsl(45, 100%, 50%)',
    bgColor: 'hsl(45, 100%, 20%)',
    items: [
      { id: 'balance-situacion', label: 'Balance de Situación' },
      { id: 'estado-perdidas-ganancias', label: 'Est.de Pérd.y Gananc.' },
      { id: 'activo-disponible', label: 'Activo Disp.y Realiz.' },
      { id: 'activo-no-corriente', label: 'Activo No Corriente' },
      { id: 'activo-funcional', label: 'Activo Funcional' },
      { id: 'exigible', label: 'Exigible a corto y largo' },
      { id: 'fondos-propios', label: 'Fondos Propios' },
      { id: 'resultados-explotacion', label: 'Resultados Explotación' },
      { id: 'resultados-financieros', label: 'Resultados Financieros' },
    ]
  },
  {
    id: 'financiera',
    title: 'FINANCIERA',
    color: 'hsl(45, 100%, 50%)',
    bgColor: 'hsl(45, 100%, 20%)',
    items: [
      { id: 'masas-patrimoniales', label: 'Bal. Masas Patrimoniales' },
      { id: 'cuadro-analitico', label: 'Cuadro Analítico P.y G.' },
      { id: 'resumen-analitico', label: 'Resumen Analítico en %.' },
      { id: 'flujo-caja', label: 'Análisis Flujo de Caja' },
      { id: 'valor-anadido', label: 'Análisis Valor Añadido' },
      { id: 'cuadro-financiacion', label: 'Cuadro de Financiación' },
      { id: 'ebit-ebitda', label: 'Análisis EBIT y EBITDA' },
      { id: 'capital-circulante', label: 'Análisis Cap.Circulante' },
      { id: 'situacion-largo-plazo', label: 'Anál.Situac.Fin.Lgo.Pzo.' },
      { id: 'flujos-tesoreria', label: 'Flujos de Tesorería' },
      { id: 'nof', label: 'Nec.Oper.de Fondos' },
      { id: 'cuadro-mando', label: 'Cuadro de Mando Finan.' },
      { id: 'indice-z', label: 'Análisis Índice "Z"' },
    ]
  },
  {
    id: 'ratios',
    title: 'RATIOS',
    color: 'hsl(120, 60%, 50%)',
    bgColor: 'hsl(120, 60%, 20%)',
    items: [
      { id: 'ratios-liquidez', label: 'Ratios de Liquidez' },
      { id: 'ratios-endeudamiento', label: 'Ratios Endeudamiento' },
      { id: 'ratios-sectoriales', label: 'Ratios Sectoriales' },
      { id: 'simulador-sectorial', label: 'Simulador Otros Sector.' },
      { id: 'piramide-ratios', label: 'Pirámide de Ratios Fin.' },
      { id: 'piramide-dupont', label: 'Pirámide Dupont' },
      { id: 'analisis-bancario', label: 'Análisis Bancario' },
    ]
  },
  {
    id: 'rentabilidad',
    title: 'RENTABILIDAD',
    color: 'hsl(300, 60%, 50%)',
    bgColor: 'hsl(300, 60%, 20%)',
    items: [
      { id: 'rentabilidad-economica', label: 'Anál.Rentab.Económica' },
      { id: 'umbral-rentabilidad', label: 'Umbral de Rentabilidad' },
      { id: 'apalancamiento', label: 'Apalancam.Financiero' },
      { id: 'fondo-maniobra', label: 'Fondo de Maniobra' },
      { id: 'autofinanciacion', label: 'Capac.Autofinanciación' },
      { id: 'periodos-maduracion', label: 'Periodos Maduración' },
      { id: 'capacidad-crecimiento', label: 'Capacidad Crecimiento' },
      { id: 'nivel-endeudamiento', label: 'Nivel Endeudamiento' },
      { id: 'estados-financieros', label: 'Anál.Estad.Financieros' },
      { id: 'resumen-financiero', label: 'Resumen Financiero' },
    ]
  },
  {
    id: 'valoraciones',
    title: 'VALORACIONES',
    color: 'hsl(50, 50%, 40%)',
    bgColor: 'hsl(50, 50%, 15%)',
    items: [
      { id: 'activo-neto', label: 'Mét.: Activo Neto real' },
      { id: 'valor-substancial', label: 'Mét.: Valor Substancial' },
      { id: 'multiplos', label: 'Método de los Múltiplos' },
      { id: 'flujos-descontados', label: 'Mét.: Flujos Descontados' },
      { id: 'proyecciones', label: 'Proyecciones Financieras' },
      { id: 'proyecto-inversion', label: 'Proyecto de Inversión' },
    ]
  },
  {
    id: 'auditoria',
    title: 'AUDITORÍA',
    color: 'hsl(60, 30%, 50%)',
    bgColor: 'hsl(60, 30%, 20%)',
    items: [
      { id: 'desv-balance', label: '% y Desv. Bal.Situación' },
      { id: 'desv-resultados', label: '% y Desv. Cta.Resultad.' },
      { id: 'audit-fondo-maniobra', label: 'Audit.Fondo Maniobra' },
      { id: 'audit-acid-test', label: 'Audit.del Acid Test' },
      { id: 'audit-disponibilidad', label: 'Audit. Disponib.Ordinaria' },
      { id: 'audit-cobro', label: 'Audit.Pzos.Medio Cobro' },
      { id: 'audit-pago', label: 'Audit.Pzos.Medio Pago' },
      { id: 'audit-rotacion', label: 'Audit.Rotac.Existencias' },
      { id: 'audit-apalancamiento', label: 'Audit. del Apalancam.' },
      { id: 'audit-fondos-propios', label: 'Audit. Fondos Propios' },
      { id: 'audit-endeudamiento', label: 'Audit.del Endeudamiento' },
    ]
  },
  {
    id: 'cuentas-anuales',
    title: 'CUENTAS ANUALES',
    color: 'hsl(210, 60%, 50%)',
    bgColor: 'hsl(210, 60%, 20%)',
    items: [
      { id: 'ca-balance', label: 'Balance de Situación' },
      { id: 'ca-perdidas-ganancias', label: 'Est.de Pérd.y Gananc.' },
      { id: 'ca-flujos-efectivo', label: 'Est.de los Flujos Efectivo' },
      { id: 'ca-cambios-patrimonio', label: 'Est.Cambios Pat.Neto' },
      { id: 'ca-gastos-ingresos', label: 'Est.Gtos e Ing.reconoc.' },
    ]
  },
  {
    id: 'informes',
    title: 'INFORMES',
    color: 'hsl(0, 60%, 50%)',
    bgColor: 'hsl(0, 60%, 20%)',
    items: [
      { id: 'bateria-informes', label: 'Batería de Informes' },
    ]
  },
  {
    id: 'estudios',
    title: 'ESTUDIOS',
    color: 'hsl(0, 40%, 60%)',
    bgColor: 'hsl(0, 40%, 25%)',
    items: [
      { id: 'estudio-sectorial', label: 'Estudio Sectorial' },
      { id: 'estudio-financiero', label: 'Estudio Anál.Financiero' },
      { id: 'comentarios-gestion', label: 'Comentarios de Gestión' },
    ]
  },
  {
    id: 'valor-acciones',
    title: 'VALOR ACCIONES',
    color: 'hsl(0, 30%, 50%)',
    bgColor: 'hsl(0, 30%, 20%)',
    items: [
      { id: 'eva', label: 'Creación de Valor.EVA' },
      { id: 'per', label: 'Análisis del PER' },
      { id: 'capitalizacion', label: 'Valores Capitalización' },
    ]
  },
];

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
    onNavigate(itemId);
  };

  return (
    <div className="w-full min-h-[600px] bg-gradient-to-br from-background via-muted/30 to-background rounded-xl border border-border/50 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          ORGANIGRAMA DE "FINANCIAL SYSTEM"
        </h1>
        <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>

      {/* Menu Grid */}
      <ScrollArea className="h-[500px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {menuCategories.map((category) => {
            const isExpanded = expandedCategories.includes(category.id);
            
            return (
              <div key={category.id} className="flex flex-col">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-t-lg font-semibold text-sm transition-all",
                    "hover:brightness-110 border-2"
                  )}
                  style={{
                    backgroundColor: category.bgColor,
                    borderColor: category.color,
                    color: category.color,
                  }}
                >
                  <span>{category.title}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {/* Category Items */}
                {isExpanded && (
                  <div 
                    className="flex flex-col gap-1 p-2 rounded-b-lg border-2 border-t-0"
                    style={{
                      borderColor: category.color,
                      backgroundColor: `${category.bgColor}80`,
                    }}
                  >
                    {category.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={cn(
                          "text-left px-3 py-2 rounded-md text-xs font-medium transition-all",
                          "hover:brightness-125 border",
                          currentSection === item.id && "ring-2 ring-offset-1 ring-white/50"
                        )}
                        style={{
                          backgroundColor: category.bgColor,
                          borderColor: category.color,
                          color: category.color,
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground font-medium">
          VERSIÓ: EMPRESES EN GENERAL
        </p>
      </div>
    </div>
  );
}

export { menuCategories };
