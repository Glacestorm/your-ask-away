import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SectorModulesRequest {
  action: 'get_sector_modules' | 'get_pack_details';
  sectorKey: string;
  sectorType: string;
  sectorName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const body: SectorModulesRequest = await req.json();
    const { action, sectorKey, sectorType, sectorName } = body;

    console.log(`[sector-modules] Action: ${action}, Sector: ${sectorKey}`);

    if (action === 'get_sector_modules') {
      const systemPrompt = `Eres un experto en software empresarial y CRM. Genera módulos recomendados para el sector ${sectorName}.

CONTEXTO:
- Sector: ${sectorName}
- Tipo: ${sectorType}
- Necesitas generar módulos que sean relevantes y útiles para empresas de este sector

FORMATO JSON ESTRICTO:
{
  "modules": [
    {
      "id": "uuid único",
      "module_key": "snake_case_key",
      "module_name": "Nombre del Módulo",
      "description": "Descripción breve de qué hace el módulo",
      "category": "core|vertical|horizontal",
      "base_price": número entre 99 y 499,
      "module_icon": "nombre de icono lucide (Users, Shield, BarChart3, etc)",
      "is_core": boolean,
      "is_recommended": true,
      "features": ["feature 1", "feature 2", "feature 3"]
    }
  ],
  "packFeatures": {
    "basic": ["feature 1", "feature 2", "feature 3", "feature 4"],
    "advanced": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5"]
  }
}

REGLAS:
1. Genera exactamente 3 módulos core (CRM, Analytics, Automatización) con is_core: true
2. Genera 6 módulos específicos del sector con is_core: false
3. Los precios deben ser coherentes (core más baratos, especializados más caros)
4. Las features deben ser específicas y útiles
5. Los iconos deben ser válidos de Lucide React`;

      const userPrompt = `Genera 9 módulos para el sector ${sectorName} (${sectorType}). 
3 módulos core esenciales y 6 módulos específicos del sector que resuelvan problemas reales de este tipo de empresas.
Incluye también las características de los packs básico y avanzado.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 2500,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Rate limit exceeded' 
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      let result;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        result = null;
      }

      if (result?.modules) {
        return new Response(JSON.stringify({
          success: true,
          sectorKey,
          sectorName,
          modules: result.modules,
          packFeatures: result.packFeatures || {
            basic: ['Módulos core incluidos', 'Soporte técnico', 'Actualizaciones', 'Onboarding'],
            advanced: ['Todos los módulos', 'Soporte 24/7', 'Implementación dedicada', 'Formación', 'SLA']
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fallback con módulos predefinidos
      return new Response(JSON.stringify({
        success: true,
        sectorKey,
        sectorName,
        modules: getDefaultModules(sectorName, sectorType),
        packFeatures: {
          basic: ['Módulos core incluidos', 'Soporte técnico básico', 'Actualizaciones incluidas', 'Onboarding guiado'],
          advanced: ['Todos los módulos del sector', 'Soporte prioritario 24/7', 'Implementación dedicada', 'Formación incluida', 'SLA garantizado']
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: `Unknown action: ${action}`
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[sector-modules] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getDefaultModules(sectorName: string, sectorType: string) {
  const coreModules = [
    {
      id: crypto.randomUUID(),
      module_key: 'core_crm',
      module_name: 'CRM Core',
      description: 'Gestión central de clientes, contactos y oportunidades de venta',
      category: 'core',
      base_price: 299,
      module_icon: 'Users',
      is_core: true,
      is_recommended: true,
      features: ['Gestión de contactos', 'Pipeline de ventas', 'Historial de interacciones']
    },
    {
      id: crypto.randomUUID(),
      module_key: 'core_analytics',
      module_name: 'Analytics & Reporting',
      description: 'Dashboards personalizables y reportes avanzados con IA',
      category: 'core',
      base_price: 199,
      module_icon: 'BarChart3',
      is_core: true,
      is_recommended: true,
      features: ['Dashboards en tiempo real', 'Reportes automáticos', 'Predicciones con IA']
    },
    {
      id: crypto.randomUUID(),
      module_key: 'core_automation',
      module_name: 'Automatización',
      description: 'Workflows automatizados y reglas de negocio inteligentes',
      category: 'core',
      base_price: 249,
      module_icon: 'Zap',
      is_core: true,
      is_recommended: true,
      features: ['Workflows visuales', 'Triggers automáticos', 'Acciones en cadena']
    }
  ];

  const sectorModulesMap: Record<string, Array<{ key: string; name: string; desc: string; icon: string; price: number; features: string[] }>> = {
    'banking': [
      { key: 'compliance_dora', name: 'Compliance DORA', desc: 'Gestión de resiliencia operativa digital', icon: 'Shield', price: 399, features: ['Evaluación de riesgos', 'Reporting EBA', 'Auditoría continua'] },
      { key: 'risk_scoring', name: 'Risk Scoring IA', desc: 'Evaluación de riesgo crediticio con IA', icon: 'Brain', price: 449, features: ['Scoring automático', 'Modelos ML', 'Integración bureaus'] },
      { key: 'kyc_aml', name: 'KYC/AML', desc: 'Verificación de identidad y prevención de blanqueo', icon: 'UserCheck', price: 349, features: ['Verificación documental', 'Listas de sanciones', 'PEP screening'] },
      { key: 'loan_management', name: 'Gestión de Préstamos', desc: 'Ciclo completo de gestión de créditos', icon: 'Banknote', price: 299, features: ['Originación', 'Amortización', 'Seguimiento'] },
      { key: 'debt_collection', name: 'Gestión de Mora', desc: 'Recuperación inteligente de deuda', icon: 'AlertTriangle', price: 279, features: ['Segmentación', 'Automatización', 'Negociación'] },
      { key: 'regulatory_reporting', name: 'Reporting Regulatorio', desc: 'Informes automáticos para supervisores', icon: 'FileText', price: 329, features: ['COREP/FINREP', 'Automatización', 'Validación'] }
    ],
    'insurance': [
      { key: 'policy_management', name: 'Gestión de Pólizas', desc: 'Administración completa del ciclo de pólizas', icon: 'FileCheck', price: 349, features: ['Emisión', 'Renovaciones', 'Modificaciones'] },
      { key: 'claims_management', name: 'Gestión de Siniestros', desc: 'Workflow automatizado de claims', icon: 'ClipboardList', price: 399, features: ['Apertura digital', 'Tramitación', 'Liquidación'] },
      { key: 'risk_assessment', name: 'Evaluación de Riesgo', desc: 'Scoring y pricing dinámico', icon: 'Shield', price: 449, features: ['Scoring IA', 'Pricing dinámico', 'Suscripción automática'] },
      { key: 'underwriting', name: 'Underwriting', desc: 'Suscripción automatizada con IA', icon: 'Brain', price: 429, features: ['Reglas de negocio', 'Decisión automática', 'Excepciones'] },
      { key: 'agent_portal', name: 'Portal de Agentes', desc: 'Herramientas para la red comercial', icon: 'Users', price: 249, features: ['Cotizador', 'Comisiones', 'Cartera'] },
      { key: 'compliance_solvency', name: 'Solvencia II', desc: 'Compliance regulatorio de seguros', icon: 'Scale', price: 379, features: ['Cálculo SCR', 'Reporting', 'Gobernanza'] }
    ],
    'retail': [
      { key: 'pos_integration', name: 'Integración TPV', desc: 'Conexión con puntos de venta', icon: 'CreditCard', price: 249, features: ['Multi-TPV', 'Sincronización', 'Reporting'] },
      { key: 'inventory_management', name: 'Gestión de Inventario', desc: 'Control de stock multialmacén', icon: 'Package', price: 299, features: ['Stock en tiempo real', 'Reposición automática', 'Alertas'] },
      { key: 'loyalty_program', name: 'Programa de Fidelización', desc: 'Puntos, niveles y recompensas', icon: 'Award', price: 279, features: ['Sistema de puntos', 'Niveles VIP', 'Canjes'] },
      { key: 'omnichannel', name: 'Omnicanalidad', desc: 'Experiencia unificada en todos los canales', icon: 'Layers', price: 349, features: ['Click & Collect', 'Ship from Store', 'Unified cart'] },
      { key: 'customer_insights', name: 'Customer Insights', desc: 'Análisis de comportamiento de clientes', icon: 'TrendingUp', price: 329, features: ['Segmentación', 'RFM', 'Predicciones'] },
      { key: 'promotions_engine', name: 'Motor de Promociones', desc: 'Gestión avanzada de ofertas', icon: 'Tag', price: 259, features: ['Cupones', 'Descuentos', 'Campañas'] }
    ]
  };

  const defaultSectorModules = [
    { key: 'sector_module_1', name: `Módulo ${sectorName} 1`, desc: 'Funcionalidad especializada para el sector', icon: 'Package', price: 249, features: ['Feature 1', 'Feature 2', 'Feature 3'] },
    { key: 'sector_module_2', name: `Módulo ${sectorName} 2`, desc: 'Optimización de procesos del sector', icon: 'Settings', price: 299, features: ['Feature 1', 'Feature 2', 'Feature 3'] },
    { key: 'sector_module_3', name: `Módulo ${sectorName} 3`, desc: 'Cumplimiento normativo sectorial', icon: 'Shield', price: 349, features: ['Feature 1', 'Feature 2', 'Feature 3'] },
    { key: 'sector_module_4', name: `Módulo ${sectorName} 4`, desc: 'Automatización específica', icon: 'Zap', price: 279, features: ['Feature 1', 'Feature 2', 'Feature 3'] },
    { key: 'sector_module_5', name: `Módulo ${sectorName} 5`, desc: 'Analytics sectorial', icon: 'BarChart3', price: 329, features: ['Feature 1', 'Feature 2', 'Feature 3'] },
    { key: 'sector_module_6', name: `Módulo ${sectorName} 6`, desc: 'Portal de clientes', icon: 'Users', price: 259, features: ['Feature 1', 'Feature 2', 'Feature 3'] }
  ];

  const sectorSpecific = sectorModulesMap[sectorType] || defaultSectorModules;

  return [
    ...coreModules,
    ...sectorSpecific.map(m => ({
      id: crypto.randomUUID(),
      module_key: m.key,
      module_name: m.name,
      description: m.desc,
      category: 'vertical',
      base_price: m.price,
      module_icon: m.icon,
      is_core: false,
      is_recommended: true,
      features: m.features
    }))
  ];
}
