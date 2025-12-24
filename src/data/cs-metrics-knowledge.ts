/**
 * CS Metrics Knowledge Base
 * Base de conocimiento completa con todas las métricas de Customer Success
 */

import { CSMetricDefinition } from '@/types/cs-metrics';

export const CS_METRICS_KNOWLEDGE: CSMetricDefinition[] = [
  // ============================================
  // MÉTRICAS DE PERCEPCIÓN
  // ============================================
  {
    id: 'nps',
    name: 'Net Promoter Score',
    shortName: 'NPS',
    category: 'perception',
    description: 'Mide la probabilidad de que los clientes recomienden tu producto o servicio. Escala de 0-10 donde 0-6 son Detractores, 7-8 Pasivos y 9-10 Promotores.',
    formula: '%Promotores - %Detractores',
    formulaExplanation: 'Resta el porcentaje de clientes que puntuaron 0-6 (detractores) del porcentaje que puntuó 9-10 (promotores). El rango resultante es de -100 a +100.',
    unit: 'score',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 0, average: 30, good: 50, excellent: 70 },
      ecommerce: { low: -10, average: 20, good: 40, excellent: 60 },
      fintech: { low: 10, average: 35, good: 55, excellent: 75 },
      general: { low: 0, average: 30, good: 50, excellent: 70 },
    },
    interpretation: {
      ranges: [
        { min: -100, max: -1, label: 'Crítico', color: 'hsl(0 84% 60%)', recommendation: 'Urgente: Identificar causas de insatisfacción y crear plan de acción inmediato' },
        { min: 0, max: 29, label: 'Necesita mejora', color: 'hsl(38 92% 50%)', recommendation: 'Analizar feedback de detractores y priorizar mejoras en producto/servicio' },
        { min: 30, max: 49, label: 'Bueno', color: 'hsl(48 96% 53%)', recommendation: 'Mantener el impulso, enfocarse en convertir pasivos a promotores' },
        { min: 50, max: 69, label: 'Excelente', color: 'hsl(142 76% 36%)', recommendation: 'Aprovechar promotores para referrals y testimonios' },
        { min: 70, max: 100, label: 'World Class', color: 'hsl(142 76% 26%)', recommendation: 'Documentar best practices y escalar el modelo' },
      ],
    },
    correlations: [
      { metricId: 'churn_rate', strength: 'strong', direction: 'negative', description: 'Mayor NPS correlaciona con menor churn' },
      { metricId: 'clv', strength: 'strong', direction: 'positive', description: 'Promotores tienen mayor lifetime value' },
      { metricId: 'nrr', strength: 'moderate', direction: 'positive', description: 'Clientes satisfechos expanden más' },
    ],
    useCases: [
      'Medir satisfacción general del cliente',
      'Predecir crecimiento orgánico',
      'Identificar embajadores de marca',
      'Benchmark competitivo',
    ],
    examples: [
      {
        scenario: 'Empresa SaaS con 100 respuestas',
        values: { promoters: 45, passives: 35, detractors: 20 },
        result: 25,
        interpretation: 'NPS de 25: Bueno pero hay espacio para mejora. El 20% de detractores requiere atención.',
      },
    ],
    tags: ['satisfacción', 'lealtad', 'recomendación', 'percepción', 'encuesta'],
    priority: 'critical',
    isAdvanced2025: false,
  },
  {
    id: 'csat',
    name: 'Customer Satisfaction Score',
    shortName: 'CSAT',
    category: 'perception',
    description: 'Mide la satisfacción del cliente con una interacción, producto o servicio específico. Generalmente en escala 1-5 o 1-7.',
    formula: '(Respuestas satisfechas / Total respuestas) × 100',
    formulaExplanation: 'Porcentaje de respuestas que puntuaron 4 o 5 (en escala 1-5) dividido por el total de respuestas.',
    unit: 'percentage',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 60, average: 75, good: 85, excellent: 92 },
      ecommerce: { low: 70, average: 80, good: 88, excellent: 95 },
      fintech: { low: 65, average: 78, good: 86, excellent: 93 },
      general: { low: 65, average: 78, good: 85, excellent: 92 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 59, label: 'Crítico', color: 'hsl(0 84% 60%)', recommendation: 'Revisar proceso de servicio al cliente urgentemente' },
        { min: 60, max: 74, label: 'Por debajo del promedio', color: 'hsl(38 92% 50%)', recommendation: 'Identificar puntos de fricción en el customer journey' },
        { min: 75, max: 84, label: 'Promedio', color: 'hsl(48 96% 53%)', recommendation: 'Implementar mejoras incrementales basadas en feedback' },
        { min: 85, max: 91, label: 'Bueno', color: 'hsl(142 76% 36%)', recommendation: 'Mantener consistencia y buscar oportunidades de deleite' },
        { min: 92, max: 100, label: 'Excelente', color: 'hsl(142 76% 26%)', recommendation: 'Documentar y replicar las mejores prácticas' },
      ],
    },
    correlations: [
      { metricId: 'nps', strength: 'strong', direction: 'positive', description: 'Alta satisfacción transaccional impulsa NPS' },
      { metricId: 'retention_rate', strength: 'moderate', direction: 'positive', description: 'Clientes satisfechos renuevan más' },
    ],
    useCases: [
      'Evaluar interacciones de soporte',
      'Medir satisfacción post-compra',
      'Evaluar onboarding',
      'Feedback de nuevas features',
    ],
    examples: [
      {
        scenario: 'Encuesta post-soporte: 150 respuestas',
        values: { satisfied: 120, neutral: 20, unsatisfied: 10 },
        result: 80,
        interpretation: 'CSAT de 80%: Buen resultado, pero hay un 7% insatisfecho que necesita follow-up.',
      },
    ],
    tags: ['satisfacción', 'transaccional', 'soporte', 'interacción'],
    priority: 'high',
    isAdvanced2025: false,
  },
  {
    id: 'ces',
    name: 'Customer Effort Score',
    shortName: 'CES',
    category: 'perception',
    description: 'Mide el esfuerzo que el cliente tuvo que hacer para resolver un problema o completar una tarea. Menor esfuerzo = mayor lealtad.',
    formula: 'Σ Puntuaciones / N respuestas',
    formulaExplanation: 'Promedio de puntuaciones en escala 1-7, donde 1 es muy difícil y 7 es muy fácil.',
    unit: 'score',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 4.0, average: 5.0, good: 5.8, excellent: 6.5 },
      ecommerce: { low: 4.5, average: 5.5, good: 6.2, excellent: 6.8 },
      general: { low: 4.2, average: 5.2, good: 6.0, excellent: 6.5 },
    },
    interpretation: {
      ranges: [
        { min: 1, max: 3.9, label: 'Alto esfuerzo', color: 'hsl(0 84% 60%)', recommendation: 'Simplificar procesos y reducir fricciones urgentemente' },
        { min: 4, max: 4.9, label: 'Esfuerzo moderado', color: 'hsl(38 92% 50%)', recommendation: 'Identificar y eliminar pasos innecesarios' },
        { min: 5, max: 5.7, label: 'Bajo esfuerzo', color: 'hsl(48 96% 53%)', recommendation: 'Optimizar touchpoints de mayor fricción' },
        { min: 5.8, max: 6.4, label: 'Muy bajo esfuerzo', color: 'hsl(142 76% 36%)', recommendation: 'Mantener y documentar las mejores prácticas' },
        { min: 6.5, max: 7, label: 'Sin esfuerzo', color: 'hsl(142 76% 26%)', recommendation: 'Experiencia excepcional, usar como benchmark interno' },
      ],
    },
    correlations: [
      { metricId: 'churn_rate', strength: 'strong', direction: 'negative', description: 'Menor esfuerzo = menor churn' },
      { metricId: 'csat', strength: 'moderate', direction: 'positive', description: 'Baja fricción mejora satisfacción' },
    ],
    useCases: [
      'Evaluar usabilidad de producto',
      'Medir eficiencia de soporte',
      'Optimizar procesos de autoservicio',
      'Identificar fricciones en onboarding',
    ],
    examples: [
      {
        scenario: 'Flujo de onboarding',
        values: { total_score: 520, responses: 100 },
        result: 5.2,
        interpretation: 'CES de 5.2: Promedio aceptable, pero hay margen para simplificar el proceso.',
      },
    ],
    tags: ['esfuerzo', 'fricción', 'usabilidad', 'experiencia'],
    priority: 'high',
    isAdvanced2025: false,
  },

  // ============================================
  // MÉTRICAS DE RETENCIÓN
  // ============================================
  {
    id: 'churn_rate',
    name: 'Tasa de Churn',
    shortName: 'Churn',
    category: 'retention',
    description: 'Porcentaje de clientes o ingresos perdidos en un período. Métrica crítica para negocios de suscripción.',
    formula: '(Clientes perdidos / Clientes inicio período) × 100',
    formulaExplanation: 'Divide los clientes que cancelaron entre los clientes activos al inicio del período.',
    unit: 'percentage',
    higherIsBetter: false,
    benchmarks: {
      saas: { low: 2, average: 5, good: 3, excellent: 1 },
      ecommerce: { low: 5, average: 8, good: 4, excellent: 2 },
      fintech: { low: 3, average: 6, good: 4, excellent: 2 },
      general: { low: 3, average: 5, good: 3, excellent: 1.5 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 2, label: 'Excelente', color: 'hsl(142 76% 26%)', recommendation: 'Mantener estrategias actuales, documentar best practices' },
        { min: 2.1, max: 4, label: 'Bueno', color: 'hsl(142 76% 36%)', recommendation: 'Analizar cohortes para identificar patrones' },
        { min: 4.1, max: 6, label: 'Promedio', color: 'hsl(48 96% 53%)', recommendation: 'Implementar programa de early warning' },
        { min: 6.1, max: 10, label: 'Preocupante', color: 'hsl(38 92% 50%)', recommendation: 'Activar programa de retención urgente' },
        { min: 10.1, max: 100, label: 'Crítico', color: 'hsl(0 84% 60%)', recommendation: 'Crisis: revisar producto, pricing y servicio' },
      ],
    },
    correlations: [
      { metricId: 'nps', strength: 'strong', direction: 'negative', description: 'Bajo NPS predice alto churn' },
      { metricId: 'health_score', strength: 'strong', direction: 'negative', description: 'Health score bajo indica riesgo de churn' },
      { metricId: 'time_to_value', strength: 'moderate', direction: 'positive', description: 'Mayor tiempo al valor = mayor churn' },
    ],
    useCases: [
      'Medir salud del negocio',
      'Calcular LTV y CAC payback',
      'Identificar segmentos en riesgo',
      'Evaluar impacto de cambios de pricing',
    ],
    examples: [
      {
        scenario: 'SaaS B2B mensual',
        values: { customers_start: 1000, customers_lost: 30 },
        result: 3,
        interpretation: 'Churn de 3% mensual: Por encima del benchmark SaaS. Necesita análisis de causas.',
      },
    ],
    tags: ['retención', 'cancelación', 'pérdida', 'suscripción'],
    priority: 'critical',
    isAdvanced2025: false,
  },
  {
    id: 'retention_rate',
    name: 'Tasa de Retención',
    shortName: 'Retention',
    category: 'retention',
    description: 'Porcentaje de clientes que permanecen activos en un período. Complemento del churn rate.',
    formula: '((Clientes fin - Nuevos clientes) / Clientes inicio) × 100',
    formulaExplanation: 'Calcula qué porcentaje de clientes iniciales siguen activos, excluyendo nuevas adquisiciones.',
    unit: 'percentage',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 85, average: 90, good: 95, excellent: 98 },
      ecommerce: { low: 30, average: 45, good: 55, excellent: 70 },
      fintech: { low: 88, average: 92, good: 96, excellent: 98 },
      general: { low: 80, average: 88, good: 93, excellent: 97 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 84, label: 'Crítico', color: 'hsl(0 84% 60%)', recommendation: 'Implementar programa de retención urgente' },
        { min: 85, max: 89, label: 'Por debajo del promedio', color: 'hsl(38 92% 50%)', recommendation: 'Analizar causas de abandono por segmento' },
        { min: 90, max: 94, label: 'Promedio', color: 'hsl(48 96% 53%)', recommendation: 'Optimizar onboarding y engagement' },
        { min: 95, max: 97, label: 'Bueno', color: 'hsl(142 76% 36%)', recommendation: 'Mantener y escalar estrategias actuales' },
        { min: 98, max: 100, label: 'Excelente', color: 'hsl(142 76% 26%)', recommendation: 'Best in class - documentar y compartir' },
      ],
    },
    correlations: [
      { metricId: 'churn_rate', strength: 'strong', direction: 'negative', description: 'Inverso matemático del churn' },
      { metricId: 'clv', strength: 'strong', direction: 'positive', description: 'Mayor retención = mayor CLV' },
    ],
    useCases: [
      'Calcular valor a largo plazo',
      'Evaluar salud del negocio',
      'Comparar cohortes',
      'Proyectar ingresos futuros',
    ],
    examples: [
      {
        scenario: 'Cohorte Q1',
        values: { customers_start: 500, customers_end: 600, new_customers: 150 },
        result: 90,
        interpretation: 'Retención del 90%: Promedio para SaaS. 50 clientes perdidos de 500.',
      },
    ],
    tags: ['retención', 'permanencia', 'fidelidad'],
    priority: 'critical',
    isAdvanced2025: false,
  },
  {
    id: 'nrr',
    name: 'Net Revenue Retention',
    shortName: 'NRR',
    category: 'retention',
    description: 'Retención de ingresos netos considerando expansiones, contracciones y churn. >100% indica crecimiento sin nuevos clientes.',
    formula: '(Ingresos fin de existentes / Ingresos inicio) × 100',
    formulaExplanation: 'Mide cuánto crecen o decrecen los ingresos de la base existente de clientes.',
    unit: 'percentage',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 90, average: 100, good: 110, excellent: 130 },
      fintech: { low: 92, average: 102, good: 115, excellent: 125 },
      general: { low: 88, average: 98, good: 108, excellent: 120 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 89, label: 'Contracción neta', color: 'hsl(0 84% 60%)', recommendation: 'Urgente: Reducir churn y activar upselling' },
        { min: 90, max: 99, label: 'Estancado', color: 'hsl(38 92% 50%)', recommendation: 'Aumentar adoption para habilitar expansion' },
        { min: 100, max: 109, label: 'Crecimiento moderado', color: 'hsl(48 96% 53%)', recommendation: 'Buena base, optimizar programas de expansión' },
        { min: 110, max: 129, label: 'Crecimiento fuerte', color: 'hsl(142 76% 36%)', recommendation: 'Excelente, escalar estrategias de upsell' },
        { min: 130, max: 200, label: 'Hipercrecimiento', color: 'hsl(142 76% 26%)', recommendation: 'Modelo de negocio excepcional - documentar' },
      ],
    },
    correlations: [
      { metricId: 'churn_rate', strength: 'strong', direction: 'negative', description: 'Churn reduce NRR directamente' },
      { metricId: 'expansion_rate', strength: 'strong', direction: 'positive', description: 'Expansión impulsa NRR' },
      { metricId: 'nps', strength: 'moderate', direction: 'positive', description: 'Clientes satisfechos expanden más' },
    ],
    useCases: [
      'Evaluar eficiencia de land & expand',
      'Predictor de crecimiento sostenible',
      'Métrica clave para inversores',
      'Benchmark competitivo SaaS',
    ],
    examples: [
      {
        scenario: 'SaaS con upselling activo',
        values: { revenue_start: 100000, revenue_end_existing: 115000 },
        result: 115,
        interpretation: 'NRR de 115%: Excelente. La base existente creció 15% sin nuevos clientes.',
      },
    ],
    tags: ['ingresos', 'expansión', 'retención', 'crecimiento'],
    priority: 'critical',
    isAdvanced2025: false,
  },
  {
    id: 'grr',
    name: 'Gross Revenue Retention',
    shortName: 'GRR',
    category: 'retention',
    description: 'Retención de ingresos brutos sin considerar expansiones. Mide solo las pérdidas por churn y contracción.',
    formula: '(Ingresos fin - Churn - Contracción) / Ingresos inicio × 100',
    formulaExplanation: 'Calcula qué porcentaje de ingresos iniciales se mantienen, sin considerar upsells.',
    unit: 'percentage',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 80, average: 88, good: 92, excellent: 97 },
      fintech: { low: 82, average: 90, good: 94, excellent: 98 },
      general: { low: 78, average: 86, good: 90, excellent: 95 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 79, label: 'Crítico', color: 'hsl(0 84% 60%)', recommendation: 'Pérdidas insostenibles, revisar producto y pricing' },
        { min: 80, max: 87, label: 'Por debajo del promedio', color: 'hsl(38 92% 50%)', recommendation: 'Activar programas de retención' },
        { min: 88, max: 91, label: 'Promedio', color: 'hsl(48 96% 53%)', recommendation: 'Identificar y mitigar causas de contracción' },
        { min: 92, max: 96, label: 'Bueno', color: 'hsl(142 76% 36%)', recommendation: 'Sólida retención, optimizar marginalmente' },
        { min: 97, max: 100, label: 'Excelente', color: 'hsl(142 76% 26%)', recommendation: 'Best in class, modelo muy sticky' },
      ],
    },
    correlations: [
      { metricId: 'nrr', strength: 'strong', direction: 'positive', description: 'GRR es el piso del NRR' },
      { metricId: 'churn_rate', strength: 'strong', direction: 'negative', description: 'Churn reduce GRR directamente' },
    ],
    useCases: [
      'Medir leakage de base existente',
      'Separar retención de expansión',
      'Evaluar stickiness del producto',
      'Análisis de unit economics',
    ],
    examples: [
      {
        scenario: 'SaaS enterprise',
        values: { revenue_start: 100000, churn: 3000, contraction: 2000 },
        result: 95,
        interpretation: 'GRR de 95%: Excelente retención bruta, solo 5% de pérdidas.',
      },
    ],
    tags: ['ingresos', 'retención', 'pérdida', 'contracción'],
    priority: 'high',
    isAdvanced2025: true,
  },

  // ============================================
  // MÉTRICAS DE VALOR
  // ============================================
  {
    id: 'clv',
    name: 'Customer Lifetime Value',
    shortName: 'CLV/LTV',
    category: 'value',
    description: 'Valor total que un cliente genera durante toda su relación con la empresa. Fundamental para decisiones de inversión en adquisición.',
    formula: '(Ingreso promedio mensual × Duración promedio meses) - CAC',
    formulaExplanation: 'Multiplica el ingreso recurrente por la duración esperada y resta el costo de adquisición.',
    unit: 'currency',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 1000, average: 5000, good: 15000, excellent: 50000 },
      ecommerce: { low: 100, average: 300, good: 800, excellent: 2000 },
      fintech: { low: 2000, average: 8000, good: 25000, excellent: 80000 },
      general: { low: 500, average: 3000, good: 10000, excellent: 30000 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 999, label: 'Bajo', color: 'hsl(38 92% 50%)', recommendation: 'Aumentar retención o ticket promedio' },
        { min: 1000, max: 4999, label: 'Promedio', color: 'hsl(48 96% 53%)', recommendation: 'Optimizar monetización y engagement' },
        { min: 5000, max: 14999, label: 'Bueno', color: 'hsl(142 76% 36%)', recommendation: 'Buscar oportunidades de upselling' },
        { min: 15000, max: 49999, label: 'Excelente', color: 'hsl(142 76% 26%)', recommendation: 'Invertir más en adquisición' },
        { min: 50000, max: 1000000, label: 'Enterprise', color: 'hsl(262 83% 58%)', recommendation: 'Modelo de alto valor, proteger cuentas' },
      ],
    },
    correlations: [
      { metricId: 'cac', strength: 'strong', direction: 'negative', description: 'CLV:CAC ratio determina viabilidad' },
      { metricId: 'retention_rate', strength: 'strong', direction: 'positive', description: 'Mayor retención = mayor CLV' },
      { metricId: 'nps', strength: 'moderate', direction: 'positive', description: 'Promotores tienen mayor CLV' },
    ],
    useCases: [
      'Calcular presupuesto de adquisición',
      'Segmentar clientes por valor',
      'Priorizar esfuerzos de retención',
      'Valoración de empresa',
    ],
    examples: [
      {
        scenario: 'SaaS con suscripción mensual',
        values: { monthly_revenue: 200, duration_months: 36, cac: 400 },
        result: 6800,
        interpretation: 'CLV de €6,800: Con CAC de €400, el ratio es 17:1. Excelente.',
      },
    ],
    tags: ['valor', 'lifetime', 'monetización', 'cliente'],
    priority: 'critical',
    isAdvanced2025: false,
  },
  {
    id: 'cac',
    name: 'Customer Acquisition Cost',
    shortName: 'CAC',
    category: 'value',
    description: 'Costo promedio de adquirir un nuevo cliente. Incluye marketing, ventas y otros costos de adquisición.',
    formula: 'Costos totales de adquisición / Nuevos clientes',
    formulaExplanation: 'Divide todos los gastos de marketing y ventas entre el número de nuevos clientes adquiridos.',
    unit: 'currency',
    higherIsBetter: false,
    benchmarks: {
      saas: { low: 100, average: 400, good: 200, excellent: 100 },
      ecommerce: { low: 20, average: 50, good: 30, excellent: 15 },
      fintech: { low: 200, average: 600, good: 300, excellent: 150 },
      general: { low: 100, average: 300, good: 150, excellent: 75 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 99, label: 'Muy eficiente', color: 'hsl(142 76% 26%)', recommendation: 'Excelente, considerar escalar inversión' },
        { min: 100, max: 299, label: 'Eficiente', color: 'hsl(142 76% 36%)', recommendation: 'Buen balance, mantener' },
        { min: 300, max: 499, label: 'Promedio', color: 'hsl(48 96% 53%)', recommendation: 'Optimizar canales de adquisición' },
        { min: 500, max: 999, label: 'Alto', color: 'hsl(38 92% 50%)', recommendation: 'Revisar eficiencia de marketing' },
        { min: 1000, max: 100000, label: 'Muy alto', color: 'hsl(0 84% 60%)', recommendation: 'Urgente: reevaluar modelo de adquisición' },
      ],
    },
    correlations: [
      { metricId: 'clv', strength: 'strong', direction: 'negative', description: 'CAC reduce margen de CLV' },
      { metricId: 'payback_period', strength: 'strong', direction: 'positive', description: 'Mayor CAC = mayor payback' },
    ],
    useCases: [
      'Calcular ROI de marketing',
      'Optimizar canales de adquisición',
      'Presupuestar growth',
      'Evaluar eficiencia comercial',
    ],
    examples: [
      {
        scenario: 'Campaña digital Q1',
        values: { marketing_cost: 50000, sales_cost: 30000, new_customers: 200 },
        result: 400,
        interpretation: 'CAC de €400: Promedio para SaaS. Verificar que CLV sea >€1,200.',
      },
    ],
    tags: ['adquisición', 'costo', 'marketing', 'ventas'],
    priority: 'critical',
    isAdvanced2025: false,
  },
  {
    id: 'arr',
    name: 'Annual Recurring Revenue',
    shortName: 'ARR',
    category: 'value',
    description: 'Ingresos recurrentes anualizados. Métrica fundamental para valoración de empresas SaaS.',
    formula: 'MRR × 12',
    formulaExplanation: 'Multiplica los ingresos recurrentes mensuales por 12 meses.',
    unit: 'currency',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 100000, average: 1000000, good: 5000000, excellent: 20000000 },
      general: { low: 50000, average: 500000, good: 2000000, excellent: 10000000 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 99999, label: 'Early Stage', color: 'hsl(48 96% 53%)', recommendation: 'Enfocarse en product-market fit' },
        { min: 100000, max: 999999, label: 'Seed/Series A', color: 'hsl(142 76% 36%)', recommendation: 'Optimizar go-to-market' },
        { min: 1000000, max: 9999999, label: 'Growth Stage', color: 'hsl(142 76% 26%)', recommendation: 'Escalar operaciones' },
        { min: 10000000, max: 100000000, label: 'Scale-up', color: 'hsl(262 83% 58%)', recommendation: 'Preparar para IPO/exit' },
        { min: 100000001, max: 10000000000, label: 'Enterprise', color: 'hsl(280 83% 50%)', recommendation: 'Diversificar y globalizar' },
      ],
    },
    correlations: [
      { metricId: 'nrr', strength: 'strong', direction: 'positive', description: 'NRR >100% acelera ARR' },
      { metricId: 'churn_rate', strength: 'strong', direction: 'negative', description: 'Churn reduce ARR' },
    ],
    useCases: [
      'Valoración de empresa',
      'Métricas para inversores',
      'Planificación financiera',
      'Benchmark de crecimiento',
    ],
    examples: [
      {
        scenario: 'SaaS en crecimiento',
        values: { mrr: 150000 },
        result: 1800000,
        interpretation: 'ARR de €1.8M: Series A típica. Meta: €5M para Series B.',
      },
    ],
    tags: ['ingresos', 'recurrente', 'anual', 'saas'],
    priority: 'critical',
    isAdvanced2025: false,
  },
  {
    id: 'roi',
    name: 'Return on Investment',
    shortName: 'ROI',
    category: 'value',
    description: 'Retorno sobre la inversión expresado como porcentaje. Mide la rentabilidad de una inversión.',
    formula: '((Beneficio - Inversión) / Inversión) × 100',
    formulaExplanation: 'Calcula el porcentaje de ganancia o pérdida sobre la inversión inicial.',
    unit: 'percentage',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 50, average: 150, good: 300, excellent: 500 },
      general: { low: 20, average: 100, good: 200, excellent: 400 },
    },
    interpretation: {
      ranges: [
        { min: -100, max: 0, label: 'Pérdida', color: 'hsl(0 84% 60%)', recommendation: 'Reevaluar inversión urgentemente' },
        { min: 1, max: 49, label: 'Bajo', color: 'hsl(38 92% 50%)', recommendation: 'Considerar alternativas de inversión' },
        { min: 50, max: 149, label: 'Moderado', color: 'hsl(48 96% 53%)', recommendation: 'Aceptable, buscar optimizaciones' },
        { min: 150, max: 299, label: 'Bueno', color: 'hsl(142 76% 36%)', recommendation: 'Rentable, considerar escalar' },
        { min: 300, max: 10000, label: 'Excelente', color: 'hsl(142 76% 26%)', recommendation: 'Muy rentable, maximizar inversión' },
      ],
    },
    correlations: [
      { metricId: 'cac', strength: 'moderate', direction: 'negative', description: 'Menor CAC mejora ROI' },
      { metricId: 'clv', strength: 'moderate', direction: 'positive', description: 'Mayor CLV mejora ROI' },
    ],
    useCases: [
      'Evaluar campañas de marketing',
      'Justificar inversiones',
      'Comparar iniciativas',
      'Reporting a stakeholders',
    ],
    examples: [
      {
        scenario: 'Campaña de expansión',
        values: { benefit: 50000, investment: 15000 },
        result: 233,
        interpretation: 'ROI de 233%: Excelente retorno. Por cada €1 invertido se obtienen €2.33.',
      },
    ],
    tags: ['retorno', 'inversión', 'rentabilidad'],
    priority: 'high',
    isAdvanced2025: false,
  },

  // ============================================
  // MÉTRICAS AVANZADAS 2025
  // ============================================
  {
    id: 'quick_ratio',
    name: 'Quick Ratio SaaS',
    shortName: 'Quick Ratio',
    category: 'growth',
    description: 'Ratio de eficiencia de crecimiento. Compara nuevos ingresos y expansión contra pérdidas por churn y contracción.',
    formula: '(Nuevo MRR + Expansión MRR) / (Churn MRR + Contracción MRR)',
    formulaExplanation: 'Ratio entre ingresos ganados y perdidos. >4 indica crecimiento muy eficiente.',
    unit: 'ratio',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 1, average: 2, good: 4, excellent: 8 },
      general: { low: 1, average: 2, good: 3.5, excellent: 6 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 0.99, label: 'Contracción', color: 'hsl(0 84% 60%)', recommendation: 'Estás perdiendo más de lo que ganas. Urgente.' },
        { min: 1, max: 1.99, label: 'Estancado', color: 'hsl(38 92% 50%)', recommendation: 'Crecimiento mínimo, aumentar adquisición' },
        { min: 2, max: 3.99, label: 'Crecimiento', color: 'hsl(48 96% 53%)', recommendation: 'Buen crecimiento, optimizar retención' },
        { min: 4, max: 7.99, label: 'Crecimiento eficiente', color: 'hsl(142 76% 36%)', recommendation: 'Excelente eficiencia, escalar' },
        { min: 8, max: 100, label: 'Hipercrecimiento', color: 'hsl(142 76% 26%)', recommendation: 'Modelo muy eficiente, máxima inversión' },
      ],
    },
    correlations: [
      { metricId: 'nrr', strength: 'strong', direction: 'positive', description: 'Alto NRR impulsa Quick Ratio' },
      { metricId: 'churn_rate', strength: 'strong', direction: 'negative', description: 'Churn reduce Quick Ratio' },
    ],
    useCases: [
      'Evaluar eficiencia de crecimiento',
      'Métrica para inversores',
      'Comparar períodos',
      'Decisiones de inversión en growth',
    ],
    examples: [
      {
        scenario: 'Mes típico de SaaS',
        values: { new_mrr: 10000, expansion_mrr: 5000, churn_mrr: 2000, contraction_mrr: 1000 },
        result: 5,
        interpretation: 'Quick Ratio de 5: Por cada €1 perdido, ganas €5. Muy eficiente.',
      },
    ],
    tags: ['crecimiento', 'eficiencia', 'saas', 'ratio'],
    priority: 'high',
    isAdvanced2025: true,
  },
  {
    id: 'time_to_value',
    name: 'Time to Value',
    shortName: 'TTV',
    category: 'engagement',
    description: 'Tiempo que tarda un cliente desde la compra hasta obtener el primer valor del producto. Crítico para retención.',
    formula: 'Fecha primer valor - Fecha inicio',
    formulaExplanation: 'Mide en días/semanas el tiempo desde signup hasta el "aha moment".',
    unit: 'days',
    higherIsBetter: false,
    benchmarks: {
      saas: { low: 30, average: 14, good: 7, excellent: 2 },
      ecommerce: { low: 3, average: 1, good: 0.5, excellent: 0.1 },
      general: { low: 21, average: 10, good: 5, excellent: 2 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 2, label: 'Inmediato', color: 'hsl(142 76% 26%)', recommendation: 'Excelente onboarding, mantener' },
        { min: 3, max: 7, label: 'Rápido', color: 'hsl(142 76% 36%)', recommendation: 'Buen TTV, optimizar marginalmente' },
        { min: 8, max: 14, label: 'Promedio', color: 'hsl(48 96% 53%)', recommendation: 'Simplificar onboarding y guías' },
        { min: 15, max: 30, label: 'Lento', color: 'hsl(38 92% 50%)', recommendation: 'Revisar UX y proceso de activación' },
        { min: 31, max: 365, label: 'Muy lento', color: 'hsl(0 84% 60%)', recommendation: 'Urgente: rediseñar experiencia inicial' },
      ],
    },
    correlations: [
      { metricId: 'churn_rate', strength: 'strong', direction: 'positive', description: 'Mayor TTV = mayor churn' },
      { metricId: 'retention_rate', strength: 'strong', direction: 'negative', description: 'Mayor TTV = menor retención' },
    ],
    useCases: [
      'Optimizar onboarding',
      'Reducir churn temprano',
      'Evaluar complejidad de producto',
      'Priorizar features de activación',
    ],
    examples: [
      {
        scenario: 'Herramienta de analytics',
        values: { signup_date: 1, first_value_date: 8 },
        result: 7,
        interpretation: 'TTV de 7 días: Aceptable pero hay espacio para mejorar con mejor onboarding.',
      },
    ],
    tags: ['onboarding', 'activación', 'valor', 'tiempo'],
    priority: 'high',
    isAdvanced2025: true,
  },
  {
    id: 'feature_adoption_rate',
    name: 'Feature Adoption Rate',
    shortName: 'FAR',
    category: 'engagement',
    description: 'Porcentaje de usuarios que adoptan features clave del producto. Indicador de engagement y stickiness.',
    formula: '(Usuarios usando feature / Total usuarios activos) × 100',
    formulaExplanation: 'Mide qué porcentaje de tu base activa usa funcionalidades específicas.',
    unit: 'percentage',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 20, average: 40, good: 60, excellent: 80 },
      general: { low: 15, average: 35, good: 55, excellent: 75 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 19, label: 'Bajo', color: 'hsl(0 84% 60%)', recommendation: 'Feature no descubierta o no útil' },
        { min: 20, max: 39, label: 'Por debajo del promedio', color: 'hsl(38 92% 50%)', recommendation: 'Mejorar discoverability y educación' },
        { min: 40, max: 59, label: 'Promedio', color: 'hsl(48 96% 53%)', recommendation: 'Crear campañas de adopción' },
        { min: 60, max: 79, label: 'Bueno', color: 'hsl(142 76% 36%)', recommendation: 'Feature valiosa, mantener y mejorar' },
        { min: 80, max: 100, label: 'Excelente', color: 'hsl(142 76% 26%)', recommendation: 'Feature core, proteger experiencia' },
      ],
    },
    correlations: [
      { metricId: 'health_score', strength: 'strong', direction: 'positive', description: 'Mayor adopción = mejor health' },
      { metricId: 'churn_rate', strength: 'moderate', direction: 'negative', description: 'Mayor adopción = menor churn' },
    ],
    useCases: [
      'Evaluar éxito de nuevas features',
      'Priorizar desarrollo',
      'Identificar features infrautilizadas',
      'Segmentar usuarios por comportamiento',
    ],
    examples: [
      {
        scenario: 'Dashboard de analytics',
        values: { users_using_feature: 3500, total_active_users: 5000 },
        result: 70,
        interpretation: 'FAR de 70%: Buena adopción. El 30% restante necesita educación.',
      },
    ],
    tags: ['adopción', 'engagement', 'features', 'uso'],
    priority: 'high',
    isAdvanced2025: true,
  },
  {
    id: 'expansion_rate',
    name: 'Expansion Rate',
    shortName: 'Expansion',
    category: 'growth',
    description: 'Tasa de crecimiento de ingresos desde clientes existentes mediante upselling y cross-selling.',
    formula: '(Ingresos adicionales de existentes / Ingresos inicio) × 100',
    formulaExplanation: 'Mide cuánto crecen los ingresos de la base existente por expansión.',
    unit: 'percentage',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 5, average: 15, good: 25, excellent: 40 },
      general: { low: 3, average: 10, good: 20, excellent: 35 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 4, label: 'Mínimo', color: 'hsl(38 92% 50%)', recommendation: 'Desarrollar programas de upselling' },
        { min: 5, max: 14, label: 'Promedio', color: 'hsl(48 96% 53%)', recommendation: 'Identificar oportunidades de expansión' },
        { min: 15, max: 24, label: 'Bueno', color: 'hsl(142 76% 36%)', recommendation: 'Buen modelo de land & expand' },
        { min: 25, max: 39, label: 'Excelente', color: 'hsl(142 76% 26%)', recommendation: 'Modelo de expansión muy efectivo' },
        { min: 40, max: 100, label: 'Excepcional', color: 'hsl(262 83% 58%)', recommendation: 'Best in class, documentar y escalar' },
      ],
    },
    correlations: [
      { metricId: 'nrr', strength: 'strong', direction: 'positive', description: 'Expansión impulsa NRR' },
      { metricId: 'nps', strength: 'moderate', direction: 'positive', description: 'Clientes satisfechos expanden más' },
    ],
    useCases: [
      'Evaluar estrategia de upselling',
      'Medir eficacia de CS',
      'Calcular NRR',
      'Identificar expansión por segmento',
    ],
    examples: [
      {
        scenario: 'Q1 con campaña de upsell',
        values: { expansion_revenue: 25000, starting_revenue: 100000 },
        result: 25,
        interpretation: 'Expansion Rate de 25%: Excelente. La base existente creció 25%.',
      },
    ],
    tags: ['expansión', 'upselling', 'crecimiento', 'ingresos'],
    priority: 'high',
    isAdvanced2025: true,
  },
  {
    id: 'payback_period',
    name: 'CAC Payback Period',
    shortName: 'Payback',
    category: 'value',
    description: 'Tiempo en meses para recuperar el costo de adquisición de un cliente.',
    formula: 'CAC / (ARPU × Margen bruto)',
    formulaExplanation: 'Divide el CAC entre el ingreso mensual neto por cliente.',
    unit: 'months',
    higherIsBetter: false,
    benchmarks: {
      saas: { low: 18, average: 12, good: 8, excellent: 4 },
      general: { low: 24, average: 15, good: 10, excellent: 6 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 4, label: 'Muy rápido', color: 'hsl(142 76% 26%)', recommendation: 'Excelente, máxima inversión en adquisición' },
        { min: 5, max: 8, label: 'Rápido', color: 'hsl(142 76% 36%)', recommendation: 'Buen payback, escalar canales eficientes' },
        { min: 9, max: 12, label: 'Promedio', color: 'hsl(48 96% 53%)', recommendation: 'Aceptable, optimizar CAC o retención' },
        { min: 13, max: 18, label: 'Lento', color: 'hsl(38 92% 50%)', recommendation: 'Revisar eficiencia de adquisición' },
        { min: 19, max: 60, label: 'Muy lento', color: 'hsl(0 84% 60%)', recommendation: 'Insostenible, reducir CAC urgentemente' },
      ],
    },
    correlations: [
      { metricId: 'cac', strength: 'strong', direction: 'positive', description: 'Mayor CAC = mayor payback' },
      { metricId: 'clv', strength: 'moderate', direction: 'negative', description: 'Mayor CLV puede compensar payback largo' },
    ],
    useCases: [
      'Planificar cash flow',
      'Evaluar modelo de adquisición',
      'Decidir inversión en growth',
      'Benchmark de eficiencia',
    ],
    examples: [
      {
        scenario: 'SaaS con suscripción mensual',
        values: { cac: 600, arpu: 100, gross_margin: 0.75 },
        result: 8,
        interpretation: 'Payback de 8 meses: Buen payback para SaaS. Rentable desde mes 9.',
      },
    ],
    tags: ['payback', 'cac', 'rentabilidad', 'tiempo'],
    priority: 'high',
    isAdvanced2025: true,
  },
  {
    id: 'health_score',
    name: 'Customer Health Score',
    shortName: 'Health Score',
    category: 'health',
    description: 'Score compuesto que combina múltiples señales para predecir riesgo de churn y oportunidades de expansión.',
    formula: 'Σ(Peso × Señal) / Total pesos',
    formulaExplanation: 'Combina NPS, engagement, uso, soporte y otros indicadores en un score 0-100.',
    unit: 'score',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 40, average: 60, good: 75, excellent: 90 },
      general: { low: 35, average: 55, good: 70, excellent: 85 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 39, label: 'Crítico', color: 'hsl(0 84% 60%)', recommendation: 'Alto riesgo de churn. Intervención inmediata.' },
        { min: 40, max: 59, label: 'En riesgo', color: 'hsl(38 92% 50%)', recommendation: 'Monitorear de cerca, activar playbook de retención' },
        { min: 60, max: 74, label: 'Neutral', color: 'hsl(48 96% 53%)', recommendation: 'Estable pero hay oportunidad de mejora' },
        { min: 75, max: 89, label: 'Saludable', color: 'hsl(142 76% 36%)', recommendation: 'Buen cliente, buscar oportunidades de expansión' },
        { min: 90, max: 100, label: 'Champion', color: 'hsl(142 76% 26%)', recommendation: 'Candidato para advocacy y referrals' },
      ],
    },
    correlations: [
      { metricId: 'churn_rate', strength: 'strong', direction: 'negative', description: 'Health bajo predice churn' },
      { metricId: 'nrr', strength: 'strong', direction: 'positive', description: 'Health alto habilita expansión' },
      { metricId: 'nps', strength: 'strong', direction: 'positive', description: 'NPS es componente del health' },
    ],
    useCases: [
      'Priorizar cuentas en riesgo',
      'Identificar candidatos de expansión',
      'Segmentar portfolio de clientes',
      'Automatizar playbooks de CS',
    ],
    examples: [
      {
        scenario: 'Cliente enterprise',
        values: { nps: 60, engagement: 80, usage: 70, support_tickets: 20, expansion: 50 },
        result: 72,
        interpretation: 'Health Score de 72: Saludable. Bajo riesgo de churn, potencial de expansión.',
      },
    ],
    tags: ['salud', 'riesgo', 'predicción', 'compuesto'],
    priority: 'critical',
    isAdvanced2025: true,
  },
];

// === CATEGORÍAS ===
export const METRIC_CATEGORIES = {
  perception: {
    id: 'perception',
    name: 'Percepción del Cliente',
    description: 'Métricas que miden cómo los clientes perciben tu producto y servicio',
    icon: 'Heart',
    color: 'hsl(var(--chart-1))',
  },
  retention: {
    id: 'retention',
    name: 'Retención',
    description: 'Métricas que miden la capacidad de retener clientes e ingresos',
    icon: 'Users',
    color: 'hsl(var(--chart-2))',
  },
  value: {
    id: 'value',
    name: 'Valor',
    description: 'Métricas que miden el valor económico de los clientes',
    icon: 'DollarSign',
    color: 'hsl(var(--chart-3))',
  },
  engagement: {
    id: 'engagement',
    name: 'Engagement',
    description: 'Métricas que miden la adopción y uso del producto',
    icon: 'Activity',
    color: 'hsl(var(--chart-4))',
  },
  growth: {
    id: 'growth',
    name: 'Crecimiento',
    description: 'Métricas que miden la eficiencia del crecimiento',
    icon: 'TrendingUp',
    color: 'hsl(var(--chart-5))',
  },
  health: {
    id: 'health',
    name: 'Salud del Cliente',
    description: 'Métricas compuestas que predicen el estado general',
    icon: 'HeartPulse',
    color: 'hsl(var(--primary))',
  },
};

// === PREGUNTAS FRECUENTES ===
export const QUICK_QUESTIONS = [
  { id: 'q1', question: '¿Qué es el NPS y cómo se calcula?', category: 'explain' },
  { id: 'q2', question: '¿Cuál es un buen NRR para SaaS?', category: 'benchmark' },
  { id: 'q3', question: '¿Cómo puedo reducir mi churn rate?', category: 'recommend' },
  { id: 'q4', question: 'Calcula mi CLV con estos datos', category: 'calculate' },
  { id: 'q5', question: '¿Qué métricas debo priorizar?', category: 'recommend' },
  { id: 'q6', question: '¿Cómo interpreto un Quick Ratio de 3?', category: 'explain' },
  { id: 'q7', question: '¿Qué relación hay entre NPS y churn?', category: 'compare' },
  { id: 'q8', question: '¿Cómo calculo el Health Score?', category: 'calculate' },
];

// === HELPERS ===
export const getMetricById = (id: string): CSMetricDefinition | undefined => {
  return CS_METRICS_KNOWLEDGE.find(m => m.id === id);
};

export const getMetricsByCategory = (category: string): CSMetricDefinition[] => {
  return CS_METRICS_KNOWLEDGE.filter(m => m.category === category);
};

export const getAdvancedMetrics2025 = (): CSMetricDefinition[] => {
  return CS_METRICS_KNOWLEDGE.filter(m => m.isAdvanced2025);
};

export const getCoreMetrics = (): CSMetricDefinition[] => {
  return CS_METRICS_KNOWLEDGE.filter(m => !m.isAdvanced2025);
};

export const searchMetrics = (query: string): CSMetricDefinition[] => {
  const lowerQuery = query.toLowerCase();
  return CS_METRICS_KNOWLEDGE.filter(m => 
    m.name.toLowerCase().includes(lowerQuery) ||
    m.shortName.toLowerCase().includes(lowerQuery) ||
    m.description.toLowerCase().includes(lowerQuery) ||
    m.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};
