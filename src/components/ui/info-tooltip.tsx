import { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  title?: string;
  description: string;
  formula?: string;
  benchmark?: string;
  tip?: string;
  children?: ReactNode;
  icon?: 'info' | 'help';
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  iconClassName?: string;
}

export function InfoTooltip({
  title,
  description,
  formula,
  benchmark,
  tip,
  children,
  icon = 'info',
  side = 'top',
  className,
  iconClassName
}: InfoTooltipProps) {
  const Icon = icon === 'info' ? Info : HelpCircle;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <button type="button" className={cn("inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors", iconClassName)}>
              <Icon className="h-4 w-4" />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent side={side} className={cn("max-w-xs p-3 space-y-2", className)}>
          {title && <p className="font-semibold text-sm">{title}</p>}
          <p className="text-xs text-muted-foreground">{description}</p>
          {formula && (
            <div className="bg-muted/50 p-2 rounded text-xs font-mono">
              <span className="text-muted-foreground">Fórmula: </span>
              {formula}
            </div>
          )}
          {benchmark && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Benchmark:</span>
              <span className="font-medium text-primary">{benchmark}</span>
            </div>
          )}
          {tip && (
            <p className="text-xs text-blue-600 dark:text-blue-400 border-l-2 border-blue-500 pl-2">
              💡 {tip}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Presets for common financial terms
export const FINANCIAL_TOOLTIPS = {
  currentRatio: {
    title: 'Ratio de Liquidez',
    description: 'Mide la capacidad de la empresa para pagar sus deudas a corto plazo con sus activos corrientes.',
    formula: 'Activo Corriente / Pasivo Corriente',
    benchmark: '> 1.5',
    tip: 'Un ratio < 1 indica posibles problemas de liquidez.'
  },
  debtRatio: {
    title: 'Ratio de Endeudamiento',
    description: 'Indica la proporción de deuda respecto a los fondos propios.',
    formula: 'Deuda Total / Patrimonio Neto',
    benchmark: '< 0.6',
    tip: 'Ratios altos implican mayor riesgo financiero.'
  },
  roa: {
    title: 'ROA (Return on Assets)',
    description: 'Rentabilidad generada por cada euro invertido en activos.',
    formula: '(Beneficio Neto / Activo Total) × 100',
    benchmark: '> 5%',
    tip: 'Compara con empresas del mismo sector.'
  },
  roe: {
    title: 'ROE (Return on Equity)',
    description: 'Rentabilidad generada sobre los fondos propios.',
    formula: '(Beneficio Neto / Patrimonio Neto) × 100',
    benchmark: '> 10%',
    tip: 'Un ROE alto puede indicar buen uso del capital.'
  },
  operatingMargin: {
    title: 'Margen Operativo',
    description: 'Porcentaje de beneficio operativo sobre las ventas.',
    formula: '(EBIT / Ingresos) × 100',
    benchmark: '> 8%',
    tip: 'Indica eficiencia operativa del negocio.'
  },
  npv: {
    title: 'VAN (Valor Actual Neto)',
    description: 'Valor presente de los flujos de caja futuros menos la inversión inicial.',
    formula: 'Σ [FCt / (1+r)^t] - Inversión Inicial',
    benchmark: '> 0',
    tip: 'VAN positivo indica proyecto rentable.'
  },
  irr: {
    title: 'TIR (Tasa Interna de Retorno)',
    description: 'Tasa de descuento que hace el VAN igual a cero.',
    formula: 'Tasa donde VAN = 0',
    benchmark: '> Coste de Capital',
    tip: 'Compara con tu coste de financiación.'
  },
  payback: {
    title: 'Periodo de Recuperación',
    description: 'Tiempo necesario para recuperar la inversión inicial.',
    formula: 'Inversión / Flujo de Caja Anual',
    benchmark: '< 3-5 años',
    tip: 'Menor payback = menor riesgo.'
  },
  breakeven: {
    title: 'Punto de Equilibrio',
    description: 'Nivel de ventas donde los ingresos igualan a los costes.',
    formula: 'Costes Fijos / (Precio - Coste Variable Unitario)',
    benchmark: 'Año 2-3',
    tip: 'Alcanzar el breakeven rápido es clave.'
  }
};

export const DAFO_TOOLTIPS = {
  strengths: {
    title: 'Fortalezas',
    description: 'Factores internos positivos que dan ventaja competitiva a la empresa.',
    tip: 'Identifica recursos únicos, capacidades y ventajas sobre competidores.'
  },
  weaknesses: {
    title: 'Debilidades',
    description: 'Factores internos negativos que limitan el rendimiento.',
    tip: 'Sé honesto: reconocer debilidades es el primer paso para superarlas.'
  },
  opportunities: {
    title: 'Oportunidades',
    description: 'Factores externos que pueden aprovecharse para crecer.',
    tip: 'Busca tendencias de mercado, cambios regulatorios favorables, nichos desatendidos.'
  },
  threats: {
    title: 'Amenazas',
    description: 'Factores externos que pueden perjudicar al negocio.',
    tip: 'Analiza competidores, cambios tecnológicos, factores económicos adversos.'
  }
};

export const BUSINESS_PLAN_TOOLTIPS = {
  ideaNegocio: {
    title: 'Idea de Negocio',
    description: 'Claridad, diferenciación y propuesta de valor del proyecto.',
    tip: 'Define qué problema resuelves y por qué eres diferente.'
  },
  equipoPromotor: {
    title: 'Equipo Promotor',
    description: 'Experiencia, complementariedad y compromiso del equipo fundador.',
    tip: 'Los inversores invierten primero en personas, luego en ideas.'
  },
  analisisMercado: {
    title: 'Análisis de Mercado',
    description: 'Tamaño del mercado, segmentación y análisis de competencia.',
    tip: 'Usa datos reales y fuentes verificables.'
  },
  estrategiaComercial: {
    title: 'Estrategia Comercial',
    description: 'Plan de marketing, pricing y canales de distribución.',
    tip: 'Define cómo vas a llegar a tus clientes.'
  },
  planOperaciones: {
    title: 'Plan de Operaciones',
    description: 'Procesos, proveedores, tecnología y escalabilidad.',
    tip: 'Detalla cómo vas a producir y entregar tu producto/servicio.'
  },
  organizacion: {
    title: 'Organización y RRHH',
    description: 'Estructura organizativa, perfiles clave y plan de contratación.',
    tip: 'Define roles claros y plan de crecimiento del equipo.'
  },
  planFinanciero: {
    title: 'Plan Económico-Financiero',
    description: 'Proyecciones financieras a 3-5 años con hipótesis justificadas.',
    tip: 'Sé conservador en ingresos y realista en costes.'
  },
  viabilidad: {
    title: 'Viabilidad del Proyecto',
    description: 'Análisis de rentabilidad, punto de equilibrio y necesidades de financiación.',
    tip: 'Demuestra que el negocio es sostenible a largo plazo.'
  },
  aspectosLegales: {
    title: 'Aspectos Legales',
    description: 'Forma jurídica, licencias, protección IP y cumplimiento normativo.',
    tip: 'Anticipa requisitos legales antes de lanzar.'
  },
  presentacion: {
    title: 'Presentación y Documentación',
    description: 'Claridad, profesionalidad y coherencia del documento.',
    tip: 'Un buen Business Plan comunica confianza y credibilidad.'
  }
};
