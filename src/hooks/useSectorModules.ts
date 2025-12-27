import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SectorModule {
  id: string;
  module_key: string;
  module_name: string;
  description: string;
  category: string;
  base_price: number;
  module_icon: string;
  is_core: boolean;
  is_recommended: boolean;
  features?: string[];
}

export interface SectorPack {
  id: string;
  name: string;
  description: string;
  modules: SectorModule[];
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  features: string[];
}

export interface SectorModulesData {
  sectorId: string;
  sectorName: string;
  sectorKey: string;
  recommendedModules: SectorModule[];
  basicPack: SectorPack | null;
  advancedPack: SectorPack | null;
  loading: boolean;
  error: string | null;
}

// Mapeo de sectores a sus módulos recomendados
const SECTOR_MODULE_CONFIG: Record<string, {
  sectorName: string;
  sectorType: string;
  coreModules: string[];
  recommendedModules: string[];
  packDescription: string;
  color: string;
}> = {
  'banca': {
    sectorName: 'Banca',
    sectorType: 'banking',
    coreModules: ['core_crm', 'core_contacts', 'core_analytics'],
    recommendedModules: ['compliance_dora', 'risk_scoring', 'kyc_aml', 'loan_management', 'debt_collection', 'regulatory_reporting'],
    packDescription: 'Todo lo necesario para digitalizar tu entidad bancaria',
    color: 'emerald'
  },
  'seguros': {
    sectorName: 'Seguros',
    sectorType: 'insurance',
    coreModules: ['core_crm', 'core_contacts', 'core_analytics'],
    recommendedModules: ['policy_management', 'claims_management', 'risk_assessment', 'underwriting', 'agent_portal', 'compliance_solvency'],
    packDescription: 'Gestión integral para aseguradoras y corredurías',
    color: 'blue'
  },
  'retail': {
    sectorName: 'Retail',
    sectorType: 'retail',
    coreModules: ['core_crm', 'core_contacts', 'core_analytics'],
    recommendedModules: ['pos_integration', 'inventory_management', 'loyalty_program', 'omnichannel', 'customer_insights', 'promotions_engine'],
    packDescription: 'Solución omnicanal para retail moderno',
    color: 'orange'
  },
  'manufactura': {
    sectorName: 'Manufactura',
    sectorType: 'industry',
    coreModules: ['core_crm', 'core_contacts', 'core_analytics'],
    recommendedModules: ['supply_chain', 'production_planning', 'quality_control', 'maintenance_predictive', 'vendor_management', 'iot_integration'],
    packDescription: 'Control total de la cadena de producción',
    color: 'slate'
  },
  'salud': {
    sectorName: 'Salud',
    sectorType: 'health',
    coreModules: ['core_crm', 'core_contacts', 'core_analytics'],
    recommendedModules: ['patient_management', 'appointment_scheduling', 'medical_records', 'telemedicine', 'billing_medical', 'hipaa_compliance'],
    packDescription: 'Gestión sanitaria con cumplimiento normativo',
    color: 'rose'
  },
  'educacion': {
    sectorName: 'Educación',
    sectorType: 'education',
    coreModules: ['core_crm', 'core_contacts', 'core_analytics'],
    recommendedModules: ['student_management', 'course_catalog', 'enrollment_system', 'lms_integration', 'parent_portal', 'academic_analytics'],
    packDescription: 'Digitalización educativa integral',
    color: 'purple'
  },
  'ecommerce': {
    sectorName: 'Ecommerce',
    sectorType: 'retail',
    coreModules: ['core_crm', 'core_contacts', 'core_analytics'],
    recommendedModules: ['cart_abandonment', 'product_recommendations', 'marketplace_integration', 'order_management', 'shipping_tracking', 'reviews_ratings'],
    packDescription: 'Maximiza tus ventas online',
    color: 'cyan'
  },
  'agencias': {
    sectorName: 'Agencias',
    sectorType: 'professional',
    coreModules: ['core_crm', 'core_contacts', 'core_analytics'],
    recommendedModules: ['project_management', 'time_tracking', 'resource_planning', 'client_portal', 'proposal_builder', 'billing_retainers'],
    packDescription: 'Gestiona clientes y proyectos eficientemente',
    color: 'amber'
  },
  'suscripciones': {
    sectorName: 'Suscripciones',
    sectorType: 'technology',
    coreModules: ['core_crm', 'core_contacts', 'core_analytics'],
    recommendedModules: ['subscription_billing', 'churn_prediction', 'usage_analytics', 'dunning_management', 'customer_success', 'revenue_recognition'],
    packDescription: 'Optimiza tu modelo de negocio recurrente',
    color: 'violet'
  },
  'infoproductores': {
    sectorName: 'Infoproductores',
    sectorType: 'education',
    coreModules: ['core_crm', 'core_contacts', 'core_analytics'],
    recommendedModules: ['course_builder', 'membership_management', 'webinar_integration', 'affiliate_tracking', 'payment_processing', 'student_analytics'],
    packDescription: 'Todo para vender tus cursos y contenidos',
    color: 'pink'
  },
  'empresas': {
    sectorName: 'Empresas B2B',
    sectorType: 'professional',
    coreModules: ['core_crm', 'core_contacts', 'core_analytics'],
    recommendedModules: ['account_management', 'sales_pipeline', 'contract_management', 'territory_planning', 'partner_portal', 'revenue_forecasting'],
    packDescription: 'CRM enterprise para ventas B2B',
    color: 'indigo'
  }
};

export function useSectorModules(sectorSlug: string) {
  const [data, setData] = useState<SectorModulesData>({
    sectorId: sectorSlug,
    sectorName: '',
    sectorKey: sectorSlug,
    recommendedModules: [],
    basicPack: null,
    advancedPack: null,
    loading: true,
    error: null
  });

  const fetchModules = useCallback(async () => {
    if (!sectorSlug || !SECTOR_MODULE_CONFIG[sectorSlug]) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Sector no encontrado'
      }));
      return;
    }

    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const config = SECTOR_MODULE_CONFIG[sectorSlug];

      // Llamar a la edge function para obtener módulos recomendados
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'sector-modules',
        {
          body: {
            action: 'get_sector_modules',
            sectorKey: sectorSlug,
            sectorType: config.sectorType,
            sectorName: config.sectorName
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        const modules = fnData.modules || [];
        const coreModules = modules.filter((m: SectorModule) => m.is_core);
        const sectorModules = modules.filter((m: SectorModule) => !m.is_core);

        // Calcular precios del pack básico
        const basicModules = [...coreModules, ...sectorModules.slice(0, 3)];
        const originalPrice = basicModules.reduce((sum: number, m: SectorModule) => sum + (m.base_price || 0), 0);
        const discountedPrice = Math.round(originalPrice * 0.75);

        const basicPack: SectorPack = {
          id: `pack-basic-${sectorSlug}`,
          name: `Pack Básico ${config.sectorName}`,
          description: config.packDescription,
          modules: basicModules,
          originalPrice,
          discountedPrice,
          discountPercentage: 25,
          features: fnData.packFeatures?.basic || [
            'Módulos core incluidos',
            'Soporte técnico',
            'Actualizaciones incluidas',
            'Onboarding guiado'
          ]
        };

        // Pack avanzado con todos los módulos
        const allModules = [...coreModules, ...sectorModules];
        const advOriginalPrice = allModules.reduce((sum: number, m: SectorModule) => sum + (m.base_price || 0), 0);
        const advDiscountedPrice = Math.round(advOriginalPrice * 0.65);

        const advancedPack: SectorPack = {
          id: `pack-advanced-${sectorSlug}`,
          name: `Pack Completo ${config.sectorName}`,
          description: `Solución integral ${config.sectorName} con todos los módulos especializados`,
          modules: allModules,
          originalPrice: advOriginalPrice,
          discountedPrice: advDiscountedPrice,
          discountPercentage: 35,
          features: fnData.packFeatures?.advanced || [
            'Todos los módulos del sector',
            'Soporte prioritario 24/7',
            'Implementación dedicada',
            'Formación incluida',
            'SLA garantizado'
          ]
        };

        setData({
          sectorId: sectorSlug,
          sectorName: config.sectorName,
          sectorKey: sectorSlug,
          recommendedModules: modules,
          basicPack,
          advancedPack,
          loading: false,
          error: null
        });
      } else {
        throw new Error(fnData?.error || 'Error al obtener módulos');
      }
    } catch (err) {
      console.error('[useSectorModules] Error:', err);
      
      // Fallback a datos locales si falla la API
      const config = SECTOR_MODULE_CONFIG[sectorSlug];
      const fallbackModules = generateFallbackModules(sectorSlug, config);
      
      setData({
        sectorId: sectorSlug,
        sectorName: config.sectorName,
        sectorKey: sectorSlug,
        recommendedModules: fallbackModules.modules,
        basicPack: fallbackModules.basicPack,
        advancedPack: fallbackModules.advancedPack,
        loading: false,
        error: null
      });
    }
  }, [sectorSlug]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  return {
    ...data,
    refetch: fetchModules,
    getSectorColor: () => SECTOR_MODULE_CONFIG[sectorSlug]?.color || 'blue'
  };
}

// Generador de fallback para cuando la API no está disponible
function generateFallbackModules(sectorSlug: string, config: typeof SECTOR_MODULE_CONFIG[string]) {
  const coreModules: SectorModule[] = [
    {
      id: 'core-crm',
      module_key: 'core_crm',
      module_name: 'CRM Core',
      description: 'Gestión central de clientes y oportunidades',
      category: 'core',
      base_price: 299,
      module_icon: 'Users',
      is_core: true,
      is_recommended: true,
      features: ['Gestión de contactos', 'Pipeline de ventas', 'Actividades']
    },
    {
      id: 'core-analytics',
      module_key: 'core_analytics',
      module_name: 'Analytics',
      description: 'Dashboards y reportes avanzados',
      category: 'core',
      base_price: 199,
      module_icon: 'BarChart3',
      is_core: true,
      is_recommended: true,
      features: ['Dashboards personalizables', 'Reportes automáticos', 'KPIs']
    },
    {
      id: 'core-automation',
      module_key: 'core_automation',
      module_name: 'Automatización',
      description: 'Workflows y automatizaciones inteligentes',
      category: 'core',
      base_price: 249,
      module_icon: 'Zap',
      is_core: true,
      is_recommended: true,
      features: ['Workflows automatizados', 'Triggers', 'Acciones masivas']
    }
  ];

  const sectorSpecificModules: SectorModule[] = config.recommendedModules.map((key, index) => ({
    id: `module-${key}`,
    module_key: key,
    module_name: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    description: `Módulo especializado para ${config.sectorName}`,
    category: 'vertical',
    base_price: 149 + (index * 50),
    module_icon: 'Package',
    is_core: false,
    is_recommended: true,
    features: ['Funcionalidad especializada', 'Integración nativa', 'Soporte incluido']
  }));

  const allModules = [...coreModules, ...sectorSpecificModules];
  const basicModules = [...coreModules, ...sectorSpecificModules.slice(0, 3)];
  
  const originalPrice = basicModules.reduce((sum, m) => sum + m.base_price, 0);
  const advOriginalPrice = allModules.reduce((sum, m) => sum + m.base_price, 0);

  return {
    modules: allModules,
    basicPack: {
      id: `pack-basic-${sectorSlug}`,
      name: `Pack Básico ${config.sectorName}`,
      description: config.packDescription,
      modules: basicModules,
      originalPrice,
      discountedPrice: Math.round(originalPrice * 0.75),
      discountPercentage: 25,
      features: ['Módulos core incluidos', 'Soporte técnico', 'Actualizaciones incluidas', 'Onboarding guiado']
    },
    advancedPack: {
      id: `pack-advanced-${sectorSlug}`,
      name: `Pack Completo ${config.sectorName}`,
      description: `Solución integral ${config.sectorName}`,
      modules: allModules,
      originalPrice: advOriginalPrice,
      discountedPrice: Math.round(advOriginalPrice * 0.65),
      discountPercentage: 35,
      features: ['Todos los módulos del sector', 'Soporte prioritario 24/7', 'Implementación dedicada', 'Formación incluida']
    }
  };
}

export default useSectorModules;
