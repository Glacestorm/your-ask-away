import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CNAERecommendationRequest {
  cnae_code: string;
  company_name?: string;
  company_size?: 'startup' | 'pyme' | 'gran_empresa';
  include_pricing?: boolean;
}

interface SectorMatch {
  sector_id: string;
  sector_name: string;
  sector_slug: string;
  compatibility_score: number;
  gradient_from: string;
  gradient_to: string;
  short_description: string;
  features: any[];
  ai_capabilities: any[];
  regulations: any[];
  modules_recommended: string[];
  case_studies: any[];
  pricing_tier?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { cnae_code, company_name, company_size, include_pricing }: CNAERecommendationRequest = await req.json();

    if (!cnae_code || cnae_code.length < 2) {
      return new Response(
        JSON.stringify({ error: 'cnae_code is required (minimum 2 digits)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all active sectors
    const { data: sectors, error: sectorsError } = await supabase
      .from('sectors')
      .select('*')
      .eq('is_active', true)
      .order('order_position', { ascending: true });

    if (sectorsError) throw sectorsError;

    // CNAE code mapping to sector categories
    const cnaeToSectorMap: Record<string, string[]> = {
      // Retail & eCommerce
      '47': ['retail-ecommerce'],
      '45': ['retail-ecommerce'],
      '46': ['retail-ecommerce'],
      // Banking & Finance
      '64': ['banca-finanzas'],
      '65': ['seguros'],
      '66': ['banca-finanzas', 'seguros'],
      // Healthcare
      '86': ['salud-clinicas'],
      '87': ['salud-clinicas'],
      '88': ['salud-clinicas'],
      // Construction
      '41': ['construccion-ingenieria'],
      '42': ['construccion-ingenieria'],
      '43': ['construccion-ingenieria'],
      '71': ['construccion-ingenieria'],
      // Manufacturing
      '10': ['fabricacion-industria'],
      '11': ['fabricacion-industria'],
      '13': ['fabricacion-industria'],
      '14': ['fabricacion-industria'],
      '15': ['fabricacion-industria'],
      '16': ['fabricacion-industria'],
      '17': ['fabricacion-industria'],
      '18': ['fabricacion-industria'],
      '19': ['fabricacion-industria'],
      '20': ['fabricacion-industria'],
      '21': ['fabricacion-industria'],
      '22': ['fabricacion-industria'],
      '23': ['fabricacion-industria'],
      '24': ['fabricacion-industria'],
      '25': ['fabricacion-industria'],
      '26': ['fabricacion-industria'],
      '27': ['fabricacion-industria'],
      '28': ['fabricacion-industria'],
      '29': ['fabricacion-industria'],
      '30': ['fabricacion-industria'],
      '31': ['fabricacion-industria'],
      '32': ['fabricacion-industria'],
      '33': ['fabricacion-industria'],
      // Logistics & Transport
      '49': ['logistica-distribucion'],
      '50': ['logistica-distribucion'],
      '51': ['logistica-distribucion'],
      '52': ['logistica-distribucion'],
      '53': ['logistica-distribucion'],
      // Hospitality
      '55': ['hosteleria-turismo'],
      '56': ['hosteleria-turismo'],
      '79': ['hosteleria-turismo'],
      // Education
      '85': ['educacion-formacion'],
    };

    // Find matching sectors based on CNAE code
    const cnaePrefix2 = cnae_code.substring(0, 2);
    const cnaePrefix3 = cnae_code.substring(0, 3);
    
    let matchedSlugs = cnaeToSectorMap[cnaePrefix2] || cnaeToSectorMap[cnaePrefix3] || [];
    
    // Also check sector's own cnae_codes field
    const sectorMatches: SectorMatch[] = [];
    
    for (const sector of sectors || []) {
      let score = 0;
      
      // Check if sector has this CNAE in its cnae_codes array
      if (sector.cnae_codes?.some((code: string) => 
        cnae_code.startsWith(code) || code.startsWith(cnae_code)
      )) {
        score = 95;
      } 
      // Check our predefined mapping
      else if (matchedSlugs.includes(sector.slug)) {
        score = 85;
      }
      // Partial match on first digit
      else if (sector.cnae_codes?.some((code: string) => 
        code.charAt(0) === cnae_code.charAt(0)
      )) {
        score = 50;
      }
      
      if (score > 0) {
        sectorMatches.push({
          sector_id: sector.id,
          sector_name: sector.name,
          sector_slug: sector.slug,
          compatibility_score: score,
          gradient_from: sector.gradient_from || '#3B82F6',
          gradient_to: sector.gradient_to || '#8B5CF6',
          short_description: sector.short_description,
          features: sector.features || [],
          ai_capabilities: sector.ai_capabilities || [],
          regulations: sector.regulations || [],
          modules_recommended: sector.modules_recommended || [],
          case_studies: sector.case_studies || [],
          pricing_tier: sector.pricing_tier
        });
      }
    }

    // Sort by compatibility score
    sectorMatches.sort((a, b) => b.compatibility_score - a.compatibility_score);

    // Get the primary recommendation
    const primarySector = sectorMatches[0] || null;
    const alternativeSectors = sectorMatches.slice(1, 3);

    // Generate AI insights
    const aiInsights = generateAIInsights(
      cnae_code,
      primarySector,
      alternativeSectors,
      company_size
    );

    // Generate regulation explanations
    const regulationDetails = primarySector?.regulations.map((reg: any) => ({
      ...reg,
      explanation: generateRegulationExplanation(reg, primarySector.sector_name),
      importance: getRegulationImportance(reg.code)
    })) || [];

    // Generate module recommendations with descriptions
    const moduleRecommendations = generateModuleRecommendations(
      primarySector?.modules_recommended || [],
      primarySector?.sector_name || '',
      company_size
    );

    // Log the search for analytics
    try {
      await supabase.from('cnae_search_analytics').insert({
        cnae_code,
        company_name,
        company_size,
        recommended_sector: primarySector?.sector_slug,
        compatibility_score: primarySector?.compatibility_score,
        searched_at: new Date().toISOString()
      });
    } catch (analyticsError) {
      console.warn('Failed to log analytics:', analyticsError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        cnae_code,
        analysis: {
          primary_sector: primarySector ? {
            ...primarySector,
            regulations: regulationDetails
          } : null,
          alternative_sectors: alternativeSectors,
          compatibility_summary: primarySector 
            ? `Tu código CNAE ${cnae_code} tiene ${primarySector.compatibility_score}% de compatibilidad con ${primarySector.sector_name}`
            : `No encontramos un sector específico para el CNAE ${cnae_code}`,
          module_recommendations: moduleRecommendations,
          ai_insights: aiInsights
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in ai-cnae-recommender:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateAIInsights(
  cnaeCode: string,
  primarySector: SectorMatch | null,
  alternatives: SectorMatch[],
  companySize?: string
): string[] {
  const insights: string[] = [];

  if (!primarySector) {
    insights.push(`El código CNAE ${cnaeCode} no tiene un sector específico mapeado. Te sugerimos contactar con nuestro equipo para una evaluación personalizada.`);
    return insights;
  }

  // Primary recommendation insight
  insights.push(
    `🎯 Para empresas con CNAE ${cnaeCode}, recomendamos nuestra solución de ${primarySector.sector_name} con ${primarySector.compatibility_score}% de compatibilidad.`
  );

  // AI capabilities insight
  if (primarySector.ai_capabilities.length > 0) {
    insights.push(
      `🤖 Incluye ${primarySector.ai_capabilities.length} capacidades de IA específicas para tu sector, como ${primarySector.ai_capabilities.slice(0, 2).map((c: any) => c.name).join(' y ')}.`
    );
  }

  // Regulatory insight
  if (primarySector.regulations.length > 0) {
    insights.push(
      `📋 Cumplimiento integrado con ${primarySector.regulations.length} normativas: ${primarySector.regulations.slice(0, 3).map((r: any) => r.code).join(', ')}.`
    );
  }

  // Company size specific insight
  if (companySize === 'startup') {
    insights.push(
      `🚀 Para startups recomendamos comenzar con los módulos core y escalar según crecimiento.`
    );
  } else if (companySize === 'gran_empresa') {
    insights.push(
      `🏢 Para grandes empresas incluimos soporte dedicado, SLAs premium y capacidad de personalización avanzada.`
    );
  }

  // Case study insight
  if (primarySector.case_studies.length > 0) {
    const cs = primarySector.case_studies[0];
    insights.push(
      `📈 Caso de éxito: ${cs.company} logró ${cs.result} con nuestra solución.`
    );
  }

  // Alternative sectors insight
  if (alternatives.length > 0) {
    insights.push(
      `💡 También podrías considerar: ${alternatives.map(a => a.sector_name).join(', ')}.`
    );
  }

  return insights;
}

function generateRegulationExplanation(regulation: any, sectorName: string): string {
  const explanations: Record<string, string> = {
    'GDPR': 'Reglamento General de Protección de Datos de la UE. Obligatorio para cualquier empresa que maneje datos de ciudadanos europeos.',
    'DORA': 'Digital Operational Resilience Act. Nueva normativa de ciberseguridad para entidades financieras en la UE.',
    'PSD2': 'Directiva de Servicios de Pago 2. Regula los servicios de pago electrónico y Open Banking.',
    'MiFID II': 'Directiva de Mercados de Instrumentos Financieros. Regula la prestación de servicios de inversión.',
    'Solvencia II': 'Marco regulatorio para empresas de seguros en la UE, enfocado en requisitos de capital y gestión de riesgos.',
    'LOPD-GDD': 'Ley Orgánica de Protección de Datos española, complemento del GDPR.',
    'ISO 27001': 'Estándar internacional para sistemas de gestión de seguridad de la información.',
    'SOC 2': 'Certificación de controles de seguridad, disponibilidad, integridad y confidencialidad.',
    'HIPAA': 'Regulación de protección de datos de salud (aplicable en servicios con clientes de EE.UU.).',
    'PCI-DSS': 'Estándar de seguridad para el manejo de tarjetas de pago.',
    'KYC': 'Know Your Customer. Procesos de identificación y verificación de clientes.',
    'AML': 'Anti-Money Laundering. Normativa contra el blanqueo de capitales.',
  };

  return explanations[regulation.code] || 
    `Normativa ${regulation.code} aplicable al sector de ${sectorName}. ${regulation.name || ''}`;
}

function getRegulationImportance(code: string): 'critical' | 'high' | 'medium' {
  const criticalRegs = ['GDPR', 'DORA', 'Solvencia II', 'PSD2', 'HIPAA', 'AML'];
  const highRegs = ['MiFID II', 'PCI-DSS', 'KYC', 'ISO 27001', 'SOC 2'];
  
  if (criticalRegs.includes(code)) return 'critical';
  if (highRegs.includes(code)) return 'high';
  return 'medium';
}

function generateModuleRecommendations(
  modules: string[],
  sectorName: string,
  companySize?: string
): Array<{ name: string; description: string; priority: 'core' | 'recommended' | 'optional' }> {
  const moduleDescriptions: Record<string, { description: string; priority: 'core' | 'recommended' | 'optional' }> = {
    'CRM': { description: 'Gestión de relaciones con clientes, pipeline de ventas y seguimiento de oportunidades.', priority: 'core' },
    'ERP': { description: 'Planificación de recursos empresariales integrada.', priority: 'core' },
    'Contabilidad': { description: 'Gestión contable y fiscal automatizada.', priority: 'core' },
    'RRHH': { description: 'Gestión de recursos humanos, nóminas y talento.', priority: 'recommended' },
    'Inventario': { description: 'Control de stock, almacenes y trazabilidad.', priority: 'recommended' },
    'Business Intelligence': { description: 'Dashboards y análisis de datos en tiempo real.', priority: 'recommended' },
    'Automatización': { description: 'Flujos de trabajo automatizados y RPA.', priority: 'recommended' },
    'Gestión Documental': { description: 'Organización, versionado y firma digital de documentos.', priority: 'optional' },
    'Portal Cliente': { description: 'Autoservicio para clientes con acceso 24/7.', priority: 'optional' },
    'Cumplimiento Normativo': { description: 'Gestión automática de compliance y auditorías.', priority: 'core' },
    'Gestión de Riesgos': { description: 'Identificación, evaluación y mitigación de riesgos.', priority: 'core' },
    'Reporting Regulatorio': { description: 'Generación automática de informes para reguladores.', priority: 'core' },
    'Gestión de Pólizas': { description: 'Administración completa del ciclo de vida de pólizas.', priority: 'core' },
    'Siniestros': { description: 'Gestión de reclamaciones y siniestros.', priority: 'core' },
    'Telemedicina': { description: 'Consultas virtuales y seguimiento remoto de pacientes.', priority: 'recommended' },
    'Historia Clínica': { description: 'Gestión de expedientes médicos digitales.', priority: 'core' },
    'Planificación Proyectos': { description: 'Gestión de obras y proyectos de construcción.', priority: 'core' },
    'Control Calidad': { description: 'Inspecciones, certificaciones y trazabilidad.', priority: 'recommended' },
    'MES': { description: 'Sistema de ejecución de manufactura.', priority: 'core' },
    'Mantenimiento': { description: 'Gestión predictiva de mantenimiento de equipos.', priority: 'recommended' },
    'TMS': { description: 'Sistema de gestión de transporte y flotas.', priority: 'core' },
    'WMS': { description: 'Sistema de gestión de almacenes.', priority: 'core' },
    'PMS': { description: 'Sistema de gestión hotelera.', priority: 'core' },
    'Reservas': { description: 'Motor de reservas y gestión de disponibilidad.', priority: 'core' },
    'LMS': { description: 'Sistema de gestión de aprendizaje.', priority: 'core' },
    'Matrículas': { description: 'Gestión de admisiones y matrículas.', priority: 'core' },
  };

  return modules.map(module => ({
    name: module,
    description: moduleDescriptions[module]?.description || `Módulo especializado para ${sectorName}.`,
    priority: moduleDescriptions[module]?.priority || 'recommended'
  }));
}
