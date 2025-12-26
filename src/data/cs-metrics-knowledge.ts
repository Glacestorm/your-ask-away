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

  // ============================================
  // MÉTRICAS REVOLUCIONARIAS 2026+
  // ============================================
  {
    id: 'value_realization_score',
    name: 'Value Realization Score',
    shortName: 'VRS',
    category: 'health',
    description: 'Mide qué porcentaje del valor prometido durante la venta ha sido efectivamente entregado y percibido por el cliente.',
    formula: '(Valor entregado / Valor prometido) × 100',
    formulaExplanation: 'Compara los outcomes alcanzados contra las expectativas establecidas en el proceso de venta.',
    unit: 'percentage',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 50, average: 70, good: 85, excellent: 95 },
      fintech: { low: 55, average: 75, good: 88, excellent: 96 },
      general: { low: 45, average: 65, good: 80, excellent: 92 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 49, label: 'Gap crítico', color: 'hsl(0 84% 60%)', recommendation: 'Revisar expectativas de venta vs realidad del producto' },
        { min: 50, max: 69, label: 'Subentregando', color: 'hsl(38 92% 50%)', recommendation: 'Identificar gaps y crear plan de realización de valor' },
        { min: 70, max: 84, label: 'Buena entrega', color: 'hsl(48 96% 53%)', recommendation: 'Optimizar últimas áreas de valor no capturado' },
        { min: 85, max: 94, label: 'Excelente', color: 'hsl(142 76% 36%)', recommendation: 'Documentar y replicar el proceso de entrega' },
        { min: 95, max: 100, label: 'Value Champion', color: 'hsl(142 76% 26%)', recommendation: 'Usar como caso de éxito, buscar expansion' },
      ],
    },
    correlations: [
      { metricId: 'nrr', strength: 'strong', direction: 'positive', description: 'Alto VRS habilita expansion' },
      { metricId: 'nps', strength: 'strong', direction: 'positive', description: 'Clientes con valor realizado son promotores' },
      { metricId: 'churn_rate', strength: 'strong', direction: 'negative', description: 'Bajo VRS predice churn' },
    ],
    useCases: [
      'Medir efectividad del onboarding',
      'Identificar gaps de expectativas',
      'Priorizar mejoras de producto',
      'Justificar renovaciones',
    ],
    examples: [
      {
        scenario: 'Cliente enterprise post-implementación',
        values: { promised_savings: 100000, actual_savings: 85000 },
        result: 85,
        interpretation: 'VRS de 85%: Buena entrega de valor, 15% de gap a cerrar.',
      },
    ],
    tags: ['valor', 'outcomes', 'entrega', 'expectativas', '2026'],
    priority: 'critical',
    isAdvanced2025: true,
  },
  {
    id: 'outcome_achievement_rate',
    name: 'Outcome Achievement Rate',
    shortName: 'OAR',
    category: 'engagement',
    description: 'Porcentaje de objetivos de negocio definidos que el cliente ha logrado usando el producto.',
    formula: '(Objetivos logrados / Objetivos definidos) × 100',
    formulaExplanation: 'Mide el éxito del cliente en alcanzar sus metas de negocio específicas.',
    unit: 'percentage',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 40, average: 60, good: 75, excellent: 90 },
      general: { low: 35, average: 55, good: 70, excellent: 85 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 39, label: 'Fracasando', color: 'hsl(0 84% 60%)', recommendation: 'Revisar objetivos y crear plan de éxito inmediato' },
        { min: 40, max: 59, label: 'Bajo rendimiento', color: 'hsl(38 92% 50%)', recommendation: 'Identificar bloqueadores y ajustar expectativas' },
        { min: 60, max: 74, label: 'En camino', color: 'hsl(48 96% 53%)', recommendation: 'Acelerar con recursos adicionales de CS' },
        { min: 75, max: 89, label: 'Exitoso', color: 'hsl(142 76% 36%)', recommendation: 'Documentar y expandir a nuevos objetivos' },
        { min: 90, max: 100, label: 'Excepcional', color: 'hsl(142 76% 26%)', recommendation: 'Caso de estudio, candidato para advocacy' },
      ],
    },
    correlations: [
      { metricId: 'value_realization_score', strength: 'strong', direction: 'positive', description: 'OAR impulsa VRS' },
      { metricId: 'retention_rate', strength: 'strong', direction: 'positive', description: 'Clientes exitosos renuevan' },
    ],
    useCases: [
      'Medir éxito del cliente',
      'Priorizar intervenciones de CS',
      'Justificar renovaciones',
      'Identificar best practices',
    ],
    examples: [
      {
        scenario: 'Success plan con 5 objetivos',
        values: { goals_achieved: 4, goals_defined: 5 },
        result: 80,
        interpretation: 'OAR de 80%: Exitoso. 4 de 5 objetivos cumplidos.',
      },
    ],
    tags: ['outcomes', 'objetivos', 'éxito', 'metas', '2026'],
    priority: 'high',
    isAdvanced2025: true,
  },
  {
    id: 'customer_momentum_score',
    name: 'Customer Momentum Score',
    shortName: 'Momentum',
    category: 'engagement',
    description: 'Velocidad de progreso del cliente en su journey de adopción. Mide aceleración vs estancamiento.',
    formula: '(Adopción actual - Adopción anterior) / Tiempo × Factor de peso',
    formulaExplanation: 'Calcula la derivada de la curva de adopción para detectar momentum positivo o negativo.',
    unit: 'score',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 20, average: 50, good: 70, excellent: 90 },
      general: { low: 15, average: 45, good: 65, excellent: 85 },
    },
    interpretation: {
      ranges: [
        { min: -100, max: 0, label: 'Retroceso', color: 'hsl(0 84% 60%)', recommendation: 'Urgente: Cliente perdiendo engagement' },
        { min: 1, max: 30, label: 'Estancado', color: 'hsl(38 92% 50%)', recommendation: 'Reactivar con nuevos casos de uso' },
        { min: 31, max: 60, label: 'Progresando', color: 'hsl(48 96% 53%)', recommendation: 'Mantener ritmo, identificar oportunidades' },
        { min: 61, max: 85, label: 'Acelerando', color: 'hsl(142 76% 36%)', recommendation: 'Capitalizar momentum con expansion' },
        { min: 86, max: 100, label: 'Hipercrecimiento', color: 'hsl(142 76% 26%)', recommendation: 'Documentar, replicar en otras cuentas' },
      ],
    },
    correlations: [
      { metricId: 'feature_adoption_rate', strength: 'strong', direction: 'positive', description: 'Mayor adopción = mayor momentum' },
      { metricId: 'expansion_rate', strength: 'moderate', direction: 'positive', description: 'Momentum alto habilita expansion' },
    ],
    useCases: [
      'Detectar cuentas estancadas',
      'Identificar momentos de expansion',
      'Priorizar recursos de CS',
      'Predecir renovaciones',
    ],
    examples: [
      {
        scenario: 'Cliente en mes 6',
        values: { adoption_current: 75, adoption_previous: 45, months: 3 },
        result: 78,
        interpretation: 'Momentum de 78: Acelerando. El cliente está adoptando rápidamente.',
      },
    ],
    tags: ['momentum', 'velocidad', 'adopción', 'progreso', '2026'],
    priority: 'high',
    isAdvanced2025: true,
  },
  {
    id: 'revenue_intelligence_index',
    name: 'Revenue Intelligence Index',
    shortName: 'RII',
    category: 'value',
    description: 'Índice compuesto que predice potencial de revenue basado en comportamiento, engagement y señales de mercado.',
    formula: 'AI Model(engagement, usage, sentiment, market_signals)',
    formulaExplanation: 'Modelo de ML que combina múltiples señales para predecir potencial de ingresos.',
    unit: 'score',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 30, average: 55, good: 75, excellent: 90 },
      fintech: { low: 35, average: 60, good: 78, excellent: 92 },
      general: { low: 25, average: 50, good: 70, excellent: 88 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 29, label: 'Bajo potencial', color: 'hsl(38 92% 50%)', recommendation: 'Enfocarse en retención básica' },
        { min: 30, max: 54, label: 'Potencial moderado', color: 'hsl(48 96% 53%)', recommendation: 'Desarrollar relación antes de expansion' },
        { min: 55, max: 74, label: 'Alto potencial', color: 'hsl(142 76% 36%)', recommendation: 'Activar playbooks de upselling' },
        { min: 75, max: 89, label: 'Muy alto potencial', color: 'hsl(142 76% 26%)', recommendation: 'Prioridad máxima para expansion' },
        { min: 90, max: 100, label: 'Revenue champion', color: 'hsl(262 83% 58%)', recommendation: 'Involucrar ejecutivos, deal strategy' },
      ],
    },
    correlations: [
      { metricId: 'expansion_rate', strength: 'strong', direction: 'positive', description: 'RII predice expansion' },
      { metricId: 'nrr', strength: 'strong', direction: 'positive', description: 'Alto RII impulsa NRR' },
    ],
    useCases: [
      'Priorizar cuentas para expansion',
      'Forecast de revenue',
      'Asignar recursos de ventas',
      'Identificar oportunidades ocultas',
    ],
    examples: [
      {
        scenario: 'Cuenta enterprise activa',
        values: { engagement: 85, usage: 90, sentiment: 78, market_fit: 82 },
        result: 84,
        interpretation: 'RII de 84: Muy alto potencial de expansion.',
      },
    ],
    tags: ['revenue', 'inteligencia', 'predicción', 'AI', '2026'],
    priority: 'critical',
    isAdvanced2025: true,
  },
  {
    id: 'product_qualified_accounts',
    name: 'Product Qualified Accounts',
    shortName: 'PQA',
    category: 'growth',
    description: 'Cuentas que califican para expansion basándose en su uso del producto (Product-Led Growth).',
    formula: '(Cuentas que cumplen criterios PLG / Total cuentas activas) × 100',
    formulaExplanation: 'Identifica cuentas con uso que indica readiness para expansion o upgrade.',
    unit: 'percentage',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 10, average: 25, good: 40, excellent: 60 },
      general: { low: 8, average: 20, good: 35, excellent: 55 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 9, label: 'Bajo PLG', color: 'hsl(38 92% 50%)', recommendation: 'Revisar criterios de PQA o activación' },
        { min: 10, max: 24, label: 'PLG inicial', color: 'hsl(48 96% 53%)', recommendation: 'Optimizar journey de adopción' },
        { min: 25, max: 39, label: 'PLG maduro', color: 'hsl(142 76% 36%)', recommendation: 'Escalar procesos de conversión PQA' },
        { min: 40, max: 59, label: 'PLG avanzado', color: 'hsl(142 76% 26%)', recommendation: 'Modelo PLG excelente, automatizar' },
        { min: 60, max: 100, label: 'PLG líder', color: 'hsl(262 83% 58%)', recommendation: 'Best in class, documentar y evangelizar' },
      ],
    },
    correlations: [
      { metricId: 'expansion_rate', strength: 'strong', direction: 'positive', description: 'PQAs convierten a expansion' },
      { metricId: 'feature_adoption_rate', strength: 'strong', direction: 'positive', description: 'Alta adopción genera PQAs' },
    ],
    useCases: [
      'Identificar candidatos de upsell',
      'Medir efectividad de PLG',
      'Priorizar outreach de ventas',
      'Automatizar expansion',
    ],
    examples: [
      {
        scenario: 'Base de 1000 cuentas activas',
        values: { pqa_accounts: 320, total_accounts: 1000 },
        result: 32,
        interpretation: 'PQA de 32%: PLG maduro. 320 cuentas listas para expansion.',
      },
    ],
    tags: ['PLG', 'producto', 'calificación', 'expansion', '2026'],
    priority: 'high',
    isAdvanced2025: true,
  },
  {
    id: 'digital_engagement_score',
    name: 'Digital Engagement Score',
    shortName: 'DES',
    category: 'engagement',
    description: 'Score compuesto de engagement digital: app, emails, comunidad, recursos, eventos virtuales.',
    formula: 'Σ(Peso_canal × Engagement_canal) / Total pesos',
    formulaExplanation: 'Combina engagement de múltiples canales digitales en un score unificado.',
    unit: 'score',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 25, average: 50, good: 70, excellent: 85 },
      general: { low: 20, average: 45, good: 65, excellent: 80 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 24, label: 'Desconectado', color: 'hsl(0 84% 60%)', recommendation: 'Reactivar con campañas multicanal' },
        { min: 25, max: 49, label: 'Engagement básico', color: 'hsl(38 92% 50%)', recommendation: 'Aumentar touchpoints y contenido' },
        { min: 50, max: 69, label: 'Activo', color: 'hsl(48 96% 53%)', recommendation: 'Profundizar en canales preferidos' },
        { min: 70, max: 84, label: 'Muy engageado', color: 'hsl(142 76% 36%)', recommendation: 'Excelente, capitalizar para advocacy' },
        { min: 85, max: 100, label: 'Digital champion', color: 'hsl(142 76% 26%)', recommendation: 'Invitar a programas de beta y comunidad' },
      ],
    },
    correlations: [
      { metricId: 'health_score', strength: 'strong', direction: 'positive', description: 'DES es componente del health' },
      { metricId: 'churn_rate', strength: 'moderate', direction: 'negative', description: 'Mayor DES = menor churn' },
    ],
    useCases: [
      'Medir engagement multicanal',
      'Identificar clientes silenciosos',
      'Optimizar mix de canales',
      'Predecir riesgo temprano',
    ],
    examples: [
      {
        scenario: 'Cliente B2B SaaS',
        values: { app_usage: 80, email_opens: 65, community: 45, resources: 70 },
        result: 68,
        interpretation: 'DES de 68: Activo. Buena presencia digital, potencial de mejora en comunidad.',
      },
    ],
    tags: ['engagement', 'digital', 'multicanal', 'actividad', '2026'],
    priority: 'high',
    isAdvanced2025: true,
  },
  {
    id: 'advocacy_score',
    name: 'Advocacy Score',
    shortName: 'Advocacy',
    category: 'perception',
    description: 'Probabilidad calculada de que un cliente recomiende activamente y participe en programas de advocacy.',
    formula: 'AI Model(NPS, engagement, referrals, testimonials, case_studies)',
    formulaExplanation: 'Predice propensión a advocacy basándose en comportamiento histórico y señales.',
    unit: 'score',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 20, average: 45, good: 65, excellent: 85 },
      general: { low: 15, average: 40, good: 60, excellent: 80 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 19, label: 'No advocate', color: 'hsl(38 92% 50%)', recommendation: 'Mejorar experiencia antes de pedir advocacy' },
        { min: 20, max: 44, label: 'Potencial', color: 'hsl(48 96% 53%)', recommendation: 'Desarrollar relación y valor primero' },
        { min: 45, max: 64, label: 'Dispuesto', color: 'hsl(142 76% 36%)', recommendation: 'Activar con requests específicas' },
        { min: 65, max: 84, label: 'Advocate activo', color: 'hsl(142 76% 26%)', recommendation: 'Incluir en programas VIP' },
        { min: 85, max: 100, label: 'Super advocate', color: 'hsl(262 83% 58%)', recommendation: 'Embajador de marca, co-marketing' },
      ],
    },
    correlations: [
      { metricId: 'nps', strength: 'strong', direction: 'positive', description: 'NPS alto predice advocacy' },
      { metricId: 'value_realization_score', strength: 'strong', direction: 'positive', description: 'Alto VRS habilita advocacy' },
    ],
    useCases: [
      'Identificar embajadores',
      'Priorizar programa de referrals',
      'Seleccionar para case studies',
      'Medir word-of-mouth potential',
    ],
    examples: [
      {
        scenario: 'Cliente promotor con 2 años',
        values: { nps: 9, referrals: 3, testimonials: 2, engagement: 85 },
        result: 78,
        interpretation: 'Advocacy de 78: Advocate activo. Candidato para programas VIP.',
      },
    ],
    tags: ['advocacy', 'referrals', 'embajadores', 'recomendación', '2026'],
    priority: 'high',
    isAdvanced2025: true,
  },
  {
    id: 'customer_maturity_index',
    name: 'Customer Maturity Index',
    shortName: 'CMI',
    category: 'engagement',
    description: 'Nivel de sofisticación del cliente en el uso del producto: desde novato hasta experto.',
    formula: 'Evaluación multidimensional de uso, features, best practices',
    formulaExplanation: 'Clasifica clientes en stages de madurez basándose en patrones de uso avanzado.',
    unit: 'score',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 20, average: 45, good: 65, excellent: 85 },
      general: { low: 15, average: 40, good: 60, excellent: 80 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 25, label: 'Novice', color: 'hsl(38 92% 50%)', recommendation: 'Enfocarse en onboarding y basics' },
        { min: 26, max: 50, label: 'Intermediate', color: 'hsl(48 96% 53%)', recommendation: 'Introducir features avanzadas' },
        { min: 51, max: 75, label: 'Advanced', color: 'hsl(142 76% 36%)', recommendation: 'Optimización y best practices' },
        { min: 76, max: 90, label: 'Expert', color: 'hsl(142 76% 26%)', recommendation: 'Involucrar en beta y feedback' },
        { min: 91, max: 100, label: 'Master', color: 'hsl(262 83% 58%)', recommendation: 'Invitar como advisor/contributor' },
      ],
    },
    correlations: [
      { metricId: 'feature_adoption_rate', strength: 'strong', direction: 'positive', description: 'Alta adopción = alta madurez' },
      { metricId: 'expansion_rate', strength: 'moderate', direction: 'positive', description: 'Clientes maduros expanden más' },
    ],
    useCases: [
      'Segmentar por nivel de uso',
      'Personalizar comunicaciones',
      'Identificar power users',
      'Diseñar programas de certificación',
    ],
    examples: [
      {
        scenario: 'Cliente con 18 meses de uso',
        values: { features_used: 85, best_practices: 70, integrations: 80, automations: 65 },
        result: 75,
        interpretation: 'CMI de 75: Advanced. Listo para optimización y features avanzadas.',
      },
    ],
    tags: ['madurez', 'sofisticación', 'expertise', 'stages', '2026'],
    priority: 'medium',
    isAdvanced2025: true,
  },
  {
    id: 'risk_adjusted_nrr',
    name: 'Risk-Adjusted NRR',
    shortName: 'RA-NRR',
    category: 'retention',
    description: 'NRR ajustado por probabilidad de churn para una visión más realista del revenue futuro.',
    formula: 'NRR × (1 - Probabilidad de Churn)',
    formulaExplanation: 'Descuenta el NRR por el riesgo de pérdida de cada cuenta.',
    unit: 'percentage',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 75, average: 90, good: 100, excellent: 115 },
      general: { low: 70, average: 85, good: 95, excellent: 110 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 74, label: 'Alto riesgo', color: 'hsl(0 84% 60%)', recommendation: 'Revenue muy expuesto a churn' },
        { min: 75, max: 89, label: 'Riesgo moderado', color: 'hsl(38 92% 50%)', recommendation: 'Reducir concentración de riesgo' },
        { min: 90, max: 99, label: 'Bajo riesgo', color: 'hsl(48 96% 53%)', recommendation: 'Buen balance riesgo/retorno' },
        { min: 100, max: 114, label: 'Saludable', color: 'hsl(142 76% 36%)', recommendation: 'Crecimiento seguro' },
        { min: 115, max: 200, label: 'Excelente', color: 'hsl(142 76% 26%)', recommendation: 'Base muy sólida para crecer' },
      ],
    },
    correlations: [
      { metricId: 'nrr', strength: 'strong', direction: 'positive', description: 'RA-NRR deriva del NRR' },
      { metricId: 'churn_rate', strength: 'strong', direction: 'negative', description: 'Churn reduce RA-NRR' },
    ],
    useCases: [
      'Forecast realista de revenue',
      'Valoración de empresa',
      'Priorizar retención',
      'Comunicación a inversores',
    ],
    examples: [
      {
        scenario: 'SaaS con NRR 115% y 5% churn risk',
        values: { nrr: 115, churn_probability: 0.05 },
        result: 109.25,
        interpretation: 'RA-NRR de 109%: Crecimiento real ajustado por riesgo.',
      },
    ],
    tags: ['NRR', 'riesgo', 'ajustado', 'forecast', '2026'],
    priority: 'high',
    isAdvanced2025: true,
  },
  {
    id: 'cost_to_serve',
    name: 'Cost to Serve',
    shortName: 'CTS',
    category: 'value',
    description: 'Costo operativo total de servir a un cliente, incluyendo soporte, CS, infraestructura.',
    formula: 'Costos operativos totales / Número de clientes',
    formulaExplanation: 'Suma todos los costos de servicio y divide entre la base de clientes.',
    unit: 'currency',
    higherIsBetter: false,
    benchmarks: {
      saas: { low: 50, average: 150, good: 80, excellent: 30 },
      general: { low: 100, average: 250, good: 120, excellent: 50 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 30, label: 'Muy eficiente', color: 'hsl(142 76% 26%)', recommendation: 'Excelente eficiencia operativa' },
        { min: 31, max: 80, label: 'Eficiente', color: 'hsl(142 76% 36%)', recommendation: 'Buen costo de servicio' },
        { min: 81, max: 150, label: 'Promedio', color: 'hsl(48 96% 53%)', recommendation: 'Buscar eficiencias operativas' },
        { min: 151, max: 300, label: 'Alto', color: 'hsl(38 92% 50%)', recommendation: 'Automatizar y optimizar procesos' },
        { min: 301, max: 10000, label: 'Muy alto', color: 'hsl(0 84% 60%)', recommendation: 'Urgente: revisar modelo operativo' },
      ],
    },
    correlations: [
      { metricId: 'clv', strength: 'moderate', direction: 'negative', description: 'CTS reduce margen de CLV' },
      { metricId: 'health_score', strength: 'weak', direction: 'positive', description: 'Mejor servicio puede aumentar costos' },
    ],
    useCases: [
      'Optimizar operaciones de CS',
      'Pricing por segmento',
      'Identificar cuentas no rentables',
      'Automatización de servicio',
    ],
    examples: [
      {
        scenario: 'Operación de CS mensual',
        values: { total_costs: 150000, customer_count: 1000 },
        result: 150,
        interpretation: 'CTS de €150: Promedio. Oportunidad de optimización.',
      },
    ],
    tags: ['costo', 'servicio', 'operativo', 'eficiencia', '2026'],
    priority: 'medium',
    isAdvanced2025: true,
  },
  {
    id: 'logo_revenue_retention_gap',
    name: 'Logo vs Revenue Retention Gap',
    shortName: 'LRR Gap',
    category: 'retention',
    description: 'Diferencia entre retención de logos y retención de revenue. Detecta concentración de revenue.',
    formula: 'GRR(logos) - GRR(revenue)',
    formulaExplanation: 'Si el gap es negativo, pierdes más logos que revenue (cuentas pequeñas churning).',
    unit: 'percentage',
    higherIsBetter: false,
    benchmarks: {
      saas: { low: -15, average: -5, good: 0, excellent: 5 },
      general: { low: -20, average: -8, good: -2, excellent: 3 },
    },
    interpretation: {
      ranges: [
        { min: -50, max: -15, label: 'Alta concentración', color: 'hsl(0 84% 60%)', recommendation: 'Riesgo: pocas cuentas grandes dominan revenue' },
        { min: -14, max: -5, label: 'Concentración moderada', color: 'hsl(38 92% 50%)', recommendation: 'Diversificar base de revenue' },
        { min: -4, max: 0, label: 'Equilibrado', color: 'hsl(48 96% 53%)', recommendation: 'Buen balance, mantener' },
        { min: 1, max: 10, label: 'Saludable', color: 'hsl(142 76% 36%)', recommendation: 'Base diversificada de revenue' },
        { min: 11, max: 50, label: 'Muy diversificado', color: 'hsl(142 76% 26%)', recommendation: 'Excelente distribución' },
      ],
    },
    correlations: [
      { metricId: 'grr', strength: 'strong', direction: 'positive', description: 'Componente del cálculo' },
      { metricId: 'churn_rate', strength: 'moderate', direction: 'negative', description: 'Churn afecta ambas métricas' },
    ],
    useCases: [
      'Evaluar riesgo de concentración',
      'Estrategia de segmentación',
      'Decisiones de pricing',
      'Alertas de riesgo sistémico',
    ],
    examples: [
      {
        scenario: 'Base con clientes heterogéneos',
        values: { logo_grr: 92, revenue_grr: 95 },
        result: -3,
        interpretation: 'Gap de -3%: Equilibrado. Cuentas pequeñas churning más, pero impacto bajo.',
      },
    ],
    tags: ['concentración', 'logos', 'revenue', 'riesgo', '2026'],
    priority: 'medium',
    isAdvanced2025: true,
  },
  {
    id: 'ai_health_score',
    name: 'AI-Powered Health Score 2.0',
    shortName: 'AI Health',
    category: 'health',
    description: 'Health Score de nueva generación con ML que auto-ajusta pesos y detecta anomalías en tiempo real.',
    formula: 'Deep Learning Model con 50+ features',
    formulaExplanation: 'Modelo de ML entrenado con datos históricos que predice health con alta precisión.',
    unit: 'score',
    higherIsBetter: true,
    benchmarks: {
      saas: { low: 35, average: 55, good: 75, excellent: 90 },
      general: { low: 30, average: 50, good: 70, excellent: 88 },
    },
    interpretation: {
      ranges: [
        { min: 0, max: 34, label: 'Crítico', color: 'hsl(0 84% 60%)', recommendation: 'Alto riesgo predicho por IA. Intervención urgente.' },
        { min: 35, max: 54, label: 'En riesgo', color: 'hsl(38 92% 50%)', recommendation: 'IA detecta señales de deterioro' },
        { min: 55, max: 74, label: 'Estable', color: 'hsl(48 96% 53%)', recommendation: 'IA sugiere monitoreo activo' },
        { min: 75, max: 89, label: 'Saludable', color: 'hsl(142 76% 36%)', recommendation: 'IA predice buena retención' },
        { min: 90, max: 100, label: 'Champion', color: 'hsl(142 76% 26%)', recommendation: 'IA identifica alta propensión a expansion' },
      ],
    },
    correlations: [
      { metricId: 'churn_rate', strength: 'strong', direction: 'negative', description: 'AI Health predice churn con alta precisión' },
      { metricId: 'nrr', strength: 'strong', direction: 'positive', description: 'AI Health predice expansion' },
      { metricId: 'health_score', strength: 'strong', direction: 'positive', description: 'Evolución del Health Score tradicional' },
    ],
    useCases: [
      'Predicción de churn con IA',
      'Detección automática de anomalías',
      'Priorización inteligente de cuentas',
      'Early warning system',
    ],
    examples: [
      {
        scenario: 'Predicción IA para cliente enterprise',
        values: { engagement_features: 45, usage_features: 52, support_features: 48, sentiment_features: 50 },
        result: 82,
        interpretation: 'AI Health de 82: IA predice baja probabilidad de churn, alta de expansion.',
      },
    ],
    tags: ['AI', 'ML', 'predicción', 'health', '2026'],
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
