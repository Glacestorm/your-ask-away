/**
 * useVerticalCopilot
 * Hook genérico para copilots de módulos verticales
 * Soporta cualquier industria con contexto especializado
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type VerticalType = 
  | 'agriculture' | 'education' | 'healthcare' | 'hospitality' | 'legal'
  | 'energy' | 'construction' | 'manufacturing' | 'logistics' 
  | 'real_estate' | 'retail' | 'ngo'
  | 'crypto' | 'ai_marketplace' | 'predictive_cashflow';

export interface VerticalMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    latency_ms?: number;
    action_type?: string;
  };
  feedback?: 'positive' | 'negative';
}

export interface VerticalQuickAction {
  id: string;
  icon: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
}

export interface VerticalContext {
  entityId?: string;
  entityType?: string;
  periodStart?: string;
  periodEnd?: string;
  additionalData?: Record<string, unknown>;
}

// Configuración por vertical
const VERTICAL_CONFIGS: Record<VerticalType, {
  name: string;
  systemPrompt: string;
  quickActions: VerticalQuickAction[];
}> = {
  agriculture: {
    name: 'Agricultura',
    systemPrompt: `Eres ObelixIA Agro, experto en contabilidad agrícola española.
Especialidades: PAC, eco-esquemas, contabilidad por campañas, IVA agrícola (REAG), 
costes por parcela/cultivo, amortización de activos biológicos, cooperativas agrarias.
Normativa: Plan General Contable adaptado a explotaciones agrarias, Ley 19/1995.`,
    quickActions: [
      { id: 'pac', icon: 'Receipt', title: 'Contabilizar PAC', description: 'Registrar ayudas PAC recibidas', prompt: '¿Cómo contabilizo las ayudas PAC de la campaña actual?', category: 'subvenciones' },
      { id: 'campaña', icon: 'Calendar', title: 'Cerrar Campaña', description: 'Proceso cierre campaña agrícola', prompt: 'Guíame para cerrar la campaña agrícola actual', category: 'cierre' },
      { id: 'iva-reag', icon: 'Calculator', title: 'IVA Agrícola', description: 'Régimen especial REAG', prompt: 'Explícame el régimen especial de IVA agrícola REAG', category: 'fiscal' },
      { id: 'costes', icon: 'BarChart3', title: 'Costes Parcela', description: 'Analítica por parcela', prompt: 'Analiza los costes por hectárea de mis parcelas', category: 'analítica' },
    ]
  },
  education: {
    name: 'Educación',
    systemPrompt: `Eres ObelixIA Edu, experto en contabilidad educativa española.
Especialidades: Matrículas y tasas, becas y ayudas, cuotas mensuales, actividades 
extraescolares, comedor escolar, fondos de investigación, subvenciones educativas.
Normativa: Plan contable entidades sin fines lucrativos, normativa educativa autonómica.`,
    quickActions: [
      { id: 'matriculas', icon: 'GraduationCap', title: 'Gestión Matrículas', description: 'Contabilizar matrículas curso', prompt: '¿Cómo gestiono contablemente las matrículas del nuevo curso?', category: 'ingresos' },
      { id: 'becas', icon: 'Gift', title: 'Becas y Ayudas', description: 'Registro de becas', prompt: 'Explícame cómo contabilizar las becas concedidas', category: 'ayudas' },
      { id: 'subvenciones', icon: 'Receipt', title: 'Subvenciones', description: 'Subvenciones educativas', prompt: 'Guíame en la contabilización de subvenciones educativas', category: 'ingresos' },
      { id: 'comedor', icon: 'Utensils', title: 'Servicio Comedor', description: 'Gestión contable comedor', prompt: 'Analiza la rentabilidad del servicio de comedor', category: 'servicios' },
    ]
  },
  healthcare: {
    name: 'Salud',
    systemPrompt: `Eres ObelixIA Health, experto en contabilidad sanitaria española.
Especialidades: Facturación a aseguradoras, copagos, servicios médicos, farmacia,
conciertos con Seguridad Social, costes por procedimiento/GRD, equipamiento médico.
Normativa: Plan contable sanitario, normativa SNS, facturación electrónica sanitaria.`,
    quickActions: [
      { id: 'aseguradoras', icon: 'Shield', title: 'Facturar Aseguradoras', description: 'Facturación a compañías', prompt: '¿Cómo gestiono la facturación a aseguradoras privadas?', category: 'facturación' },
      { id: 'grd', icon: 'Activity', title: 'Costes por GRD', description: 'Análisis por procedimiento', prompt: 'Analiza los costes por GRD de los procedimientos', category: 'analítica' },
      { id: 'farmacia', icon: 'Pill', title: 'Stock Farmacia', description: 'Gestión stock farmacéutico', prompt: 'Optimiza la gestión contable del stock de farmacia', category: 'inventario' },
      { id: 'equipos', icon: 'Stethoscope', title: 'Equipos Médicos', description: 'Amortización equipamiento', prompt: 'Calcula la amortización del equipamiento médico', category: 'activos' },
    ]
  },
  hospitality: {
    name: 'Hostelería',
    systemPrompt: `Eres ObelixIA Hospitality, experto en contabilidad hotelera española.
Especialidades: RevPAR, ADR, ocupación, F&B costing, USALI, gestión de propinas,
OTAs y comisiones, revenue management, cuentas de explotación hotelera.
Normativa: Plan contable sectorial hotelero, IVA turístico, tasas turísticas.`,
    quickActions: [
      { id: 'revpar', icon: 'TrendingUp', title: 'Análisis RevPAR', description: 'KPIs de rendimiento', prompt: 'Analiza el RevPAR y ADR del último trimestre', category: 'kpis' },
      { id: 'fb', icon: 'Utensils', title: 'F&B Costing', description: 'Costes alimentos y bebidas', prompt: 'Optimiza los costes de F&B y márgenes', category: 'costes' },
      { id: 'otas', icon: 'Globe', title: 'Comisiones OTAs', description: 'Gestión intermediarios', prompt: 'Analiza las comisiones de Booking, Expedia y otras OTAs', category: 'distribución' },
      { id: 'propinas', icon: 'Coins', title: 'Gestión Propinas', description: 'Contabilización propinas', prompt: '¿Cómo gestiono contablemente las propinas del personal?', category: 'personal' },
    ]
  },
  legal: {
    name: 'Legal',
    systemPrompt: `Eres ObelixIA Legal, experto en contabilidad de despachos de abogados.
Especialidades: Time tracking, facturación por asunto/cliente, provisiones de fondos,
cuentas de terceros, LEDES/UTBMS, suplidos, honorarios éxito, socios/asociados.
Normativa: Código deontológico abogacía, normativa colegial, blanqueo de capitales.`,
    quickActions: [
      { id: 'time', icon: 'Clock', title: 'Time Tracking', description: 'Imputación de horas', prompt: 'Analiza las horas facturables por asunto este mes', category: 'facturación' },
      { id: 'asuntos', icon: 'Briefcase', title: 'Rentabilidad Asunto', description: 'P&L por expediente', prompt: 'Calcula la rentabilidad del asunto seleccionado', category: 'analítica' },
      { id: 'provisiones', icon: 'Wallet', title: 'Provisiones Fondos', description: 'Gestión provisiones', prompt: 'Gestiona las provisiones de fondos pendientes', category: 'tesorería' },
      { id: 'ledes', icon: 'FileText', title: 'Facturación LEDES', description: 'Formato legal billing', prompt: 'Genera factura en formato LEDES para cliente corporativo', category: 'facturación' },
    ]
  },
  energy: {
    name: 'Energía',
    systemPrompt: `Eres ObelixIA Energy, experto en contabilidad del sector energético español.
Especialidades: Trading energético, certificados renovables, carbon credits, 
derechos de emisión, balance neto, PPAs, PVPC, peajes, huella de carbono.
Normativa: CNE, normativa mercado eléctrico, EU ETS, taxonomía verde.`,
    quickActions: [
      { id: 'carbon', icon: 'Leaf', title: 'Huella Carbono', description: 'Contabilidad emisiones', prompt: 'Calcula y contabiliza la huella de carbono', category: 'esg' },
      { id: 'renovables', icon: 'Sun', title: 'Certificados RECs', description: 'Garantías de origen', prompt: 'Gestiona los certificados de energía renovable', category: 'certificados' },
      { id: 'ppa', icon: 'FileContract', title: 'Contratos PPA', description: 'Acuerdos compra energía', prompt: 'Contabiliza un nuevo contrato PPA a largo plazo', category: 'contratos' },
      { id: 'trading', icon: 'BarChart3', title: 'Trading Energético', description: 'Operaciones mercado', prompt: 'Registra operaciones de trading en mercado spot', category: 'trading' },
    ]
  },
  construction: {
    name: 'Construcción',
    systemPrompt: `Eres ObelixIA Build, experto en contabilidad del sector construcción español.
Especialidades: Obras en curso, certificaciones, retenciones de garantía, 
UTEs, subcontratación, NIC 11/NIIF 15, avance de obra, presupuestos.
Normativa: PGC adaptado construcción, Ley Contratos Sector Público, garantías.`,
    quickActions: [
      { id: 'certificacion', icon: 'CheckSquare', title: 'Certificar Obra', description: 'Certificación mensual', prompt: 'Genera la certificación de obra del mes', category: 'certificaciones' },
      { id: 'retencion', icon: 'Lock', title: 'Retenciones Garantía', description: 'Control retenciones', prompt: 'Gestiona las retenciones de garantía pendientes', category: 'garantías' },
      { id: 'avance', icon: 'TrendingUp', title: 'Avance de Obra', description: 'Porcentaje completado', prompt: 'Calcula el porcentaje de avance y reconoce ingresos', category: 'ingresos' },
      { id: 'ute', icon: 'Users', title: 'Gestión UTE', description: 'Unión temporal empresas', prompt: 'Contabiliza operaciones de la UTE', category: 'consorcios' },
    ]
  },
  manufacturing: {
    name: 'Manufactura',
    systemPrompt: `Eres ObelixIA Manufacturing, experto en contabilidad industrial española.
Especialidades: ABC Costing, órdenes fabricación, WIP, costes estándar vs real,
MES integration, mantenimiento predictivo, CoQ, OEE financiero.
Normativa: PGC industrial, normativa ambiental, ISO 9001/14001 costes.`,
    quickActions: [
      { id: 'abc', icon: 'PieChart', title: 'ABC Costing', description: 'Costes por actividad', prompt: 'Implementa análisis ABC de costes de fabricación', category: 'costes' },
      { id: 'wip', icon: 'Package', title: 'Valoración WIP', description: 'Trabajo en curso', prompt: 'Valora el inventario de trabajo en curso (WIP)', category: 'inventario' },
      { id: 'varianzas', icon: 'GitBranch', title: 'Análisis Varianzas', description: 'Estándar vs Real', prompt: 'Analiza varianzas de coste estándar vs real', category: 'analítica' },
      { id: 'coq', icon: 'Award', title: 'Coste Calidad', description: 'Cost of Quality', prompt: 'Calcula el coste de calidad (CoQ) del período', category: 'calidad' },
    ]
  },
  logistics: {
    name: 'Logística',
    systemPrompt: `Eres ObelixIA Logistics, experto en contabilidad logística y transporte.
Especialidades: TCO flota, costes almacén, Incoterms, aduanas, last mile,
optimización rutas, fuel hedging, ESG transporte, huella carbono logística.
Normativa: PGC transporte, normativa aduanera, IVA intracomunitario.`,
    quickActions: [
      { id: 'tco', icon: 'Truck', title: 'TCO Flota', description: 'Coste total vehículos', prompt: 'Calcula el TCO de la flota de transporte', category: 'activos' },
      { id: 'almacen', icon: 'Warehouse', title: 'Costes Almacén', description: 'Operaciones warehouse', prompt: 'Analiza los costes de operaciones de almacén', category: 'costes' },
      { id: 'aduanas', icon: 'Globe', title: 'Gestión Aduanas', description: 'Import/Export', prompt: 'Gestiona la contabilidad de operaciones aduaneras', category: 'comercio' },
      { id: 'carbon', icon: 'Leaf', title: 'ESG Logística', description: 'Huella carbono rutas', prompt: 'Calcula la huella de carbono de las operaciones', category: 'esg' },
    ]
  },
  real_estate: {
    name: 'Inmobiliario',
    systemPrompt: `Eres ObelixIA Real Estate, experto en contabilidad inmobiliaria española.
Especialidades: Arrendamientos NIIF 16, comunidades propietarios, IRPF alquileres,
promoción inmobiliaria, SOCIMI, IBI/plusvalías, valoraciones, fondos inversión.
Normativa: PGC inmobiliario, LAU, Ley SOCIMIs, normativa catastral.`,
    quickActions: [
      { id: 'alquileres', icon: 'Home', title: 'Gestión Alquileres', description: 'Rentas y gastos', prompt: 'Gestiona la contabilidad de alquileres activos', category: 'arrendamientos' },
      { id: 'comunidad', icon: 'Building', title: 'Comunidad Propietarios', description: 'Cuotas y derramas', prompt: 'Contabiliza las cuotas de comunidad de propietarios', category: 'comunidades' },
      { id: 'irpf', icon: 'Calculator', title: 'IRPF Alquileres', description: 'Retenciones y modelo', prompt: 'Calcula el IRPF de los rendimientos de alquiler', category: 'fiscal' },
      { id: 'promocion', icon: 'HardHat', title: 'Promoción', description: 'Desarrollo inmobiliario', prompt: 'Gestiona la contabilidad de promoción inmobiliaria', category: 'desarrollo' },
    ]
  },
  retail: {
    name: 'Retail',
    systemPrompt: `Eres ObelixIA Retail, experto en contabilidad del comercio minorista.
Especialidades: Omnicanalidad, pricing dinámico, inventario predictivo, BNPL,
loyalty programs, shrinkage, POS integration, marketplace fees.
Normativa: PGC comercio, LOPD, normativa consumidores, IVA minorista.`,
    quickActions: [
      { id: 'omni', icon: 'Store', title: 'P&L Omnicanal', description: 'Rentabilidad por canal', prompt: 'Analiza la rentabilidad por canal de venta', category: 'analítica' },
      { id: 'inventory', icon: 'Package', title: 'Inventario IA', description: 'Predicción stock', prompt: 'Optimiza el inventario con predicciones de demanda', category: 'inventario' },
      { id: 'loyalty', icon: 'Heart', title: 'Programa Fidelidad', description: 'Contabilidad puntos', prompt: 'Contabiliza las obligaciones del programa de fidelidad', category: 'clientes' },
      { id: 'marketplace', icon: 'Globe', title: 'Marketplaces', description: 'Comisiones plataformas', prompt: 'Gestiona comisiones de Amazon, eBay y otros', category: 'canales' },
    ]
  },
  ngo: {
    name: 'ONG/Fundaciones',
    systemPrompt: `Eres ObelixIA NGO, experto en contabilidad del tercer sector español.
Especialidades: Fund Accounting, grants management, SROI, ratio programas,
compliance Ley Fundaciones, donor CRM, transparencia, memoria económica.
Normativa: PGC entidades sin fines lucrativos, Ley 49/2002, protectorado.`,
    quickActions: [
      { id: 'fondos', icon: 'Wallet', title: 'Fund Accounting', description: 'Contabilidad por fondos', prompt: 'Gestiona la contabilidad segregada por fondos', category: 'fondos' },
      { id: 'grants', icon: 'Gift', title: 'Gestión Grants', description: 'Subvenciones y ayudas', prompt: 'Administra grants y justificaciones económicas', category: 'subvenciones' },
      { id: 'sroi', icon: 'Target', title: 'Cálculo SROI', description: 'Retorno social inversión', prompt: 'Calcula el SROI de los programas activos', category: 'impacto' },
      { id: 'memoria', icon: 'FileText', title: 'Memoria Económica', description: 'Informe anual', prompt: 'Genera la memoria económica para el protectorado', category: 'reporting' },
    ]
  },
  crypto: {
    name: 'Crypto/Web3',
    systemPrompt: `Eres ObelixIA Crypto, experto en contabilidad de activos digitales.
Especialidades: Tributación cripto, DeFi accounting, NFTs, staking rewards,
airdrops, DAO treasury, tokenomics, on-chain analytics, MiCA compliance.
Normativa: AEAT cripto, MiCA, FASB/IASB digital assets, blanqueo capitales.`,
    quickActions: [
      { id: 'portfolio', icon: 'Coins', title: 'Portfolio Crypto', description: 'Valoración cartera', prompt: 'Valora y contabiliza el portfolio de criptomonedas', category: 'activos' },
      { id: 'defi', icon: 'Layers', title: 'DeFi Accounting', description: 'Protocolos descentralizados', prompt: 'Contabiliza operaciones DeFi: staking, lending, farming', category: 'defi' },
      { id: 'nft', icon: 'Image', title: 'NFTs', description: 'Activos digitales únicos', prompt: 'Gestiona la contabilidad de NFTs: compra, venta, royalties', category: 'nfts' },
      { id: 'impuestos', icon: 'Calculator', title: 'Fiscalidad Crypto', description: 'Modelo 721, ganancias', prompt: 'Prepara la declaración fiscal de criptomonedas', category: 'fiscal' },
    ]
  },
  ai_marketplace: {
    name: 'AI Agent Marketplace',
    systemPrompt: `Eres ObelixIA Marketplace, experto en economía de agentes de IA.
Especialidades: Suscripciones AI, usage-based billing, API credits, 
model fine-tuning costs, compute costs, AI agent licensing, MLOps costs.
Framework: Costeo de inferencia, amortización modelos, ROI de automatización.`,
    quickActions: [
      { id: 'agents', icon: 'Bot', title: 'Coste Agentes', description: 'TCO por agente IA', prompt: 'Calcula el coste total por agente de IA desplegado', category: 'costes' },
      { id: 'usage', icon: 'Activity', title: 'Usage Billing', description: 'Facturación por uso', prompt: 'Gestiona la facturación basada en uso de APIs', category: 'ingresos' },
      { id: 'roi', icon: 'TrendingUp', title: 'ROI Automatización', description: 'Retorno de IA', prompt: 'Calcula el ROI de la automatización con IA', category: 'analítica' },
      { id: 'credits', icon: 'Zap', title: 'API Credits', description: 'Gestión de créditos', prompt: 'Contabiliza la compra y consumo de créditos API', category: 'consumo' },
    ]
  },
  predictive_cashflow: {
    name: 'Predictive Cashflow',
    systemPrompt: `Eres ObelixIA Cashflow, especialista en predicción y optimización de tesorería.
Especialidades: ML forecasting, escenarios what-if, cash pooling, 
working capital optimization, FX hedging, supply chain finance.
Tecnología: Modelos predictivos, simulación Monte Carlo, stress testing.`,
    quickActions: [
      { id: 'forecast', icon: 'TrendingUp', title: 'Forecast 90 días', description: 'Predicción tesorería', prompt: 'Genera predicción de cashflow para los próximos 90 días', category: 'predicción' },
      { id: 'scenarios', icon: 'GitBranch', title: 'Escenarios What-If', description: 'Simulaciones', prompt: 'Simula escenarios de tesorería: optimista, base, pesimista', category: 'simulación' },
      { id: 'optimize', icon: 'Zap', title: 'Optimizar WC', description: 'Working capital', prompt: 'Optimiza el working capital con recomendaciones IA', category: 'optimización' },
      { id: 'stress', icon: 'AlertTriangle', title: 'Stress Test', description: 'Pruebas de estrés', prompt: 'Ejecuta stress test de liquidez', category: 'riesgo' },
    ]
  }
};

export function useVerticalCopilot(verticalType: VerticalType) {
  const [messages, setMessages] = useState<VerticalMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<VerticalContext>({});
  
  const config = VERTICAL_CONFIGS[verticalType];
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (message: string): Promise<string | null> => {
    if (!message.trim() || isLoading) return null;

    setIsLoading(true);
    setError(null);

    const userMessage: VerticalMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-vertical-copilot',
        {
          body: {
            action: 'chat',
            verticalType,
            message,
            systemPrompt: config.systemPrompt,
            conversationHistory,
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.response) {
        const assistantMessage: VerticalMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          metadata: data.metadata
        };

        setMessages(prev => [...prev, assistantMessage]);
        return data.response;
      }

      throw new Error('Respuesta inválida del copilot');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast.error('Error al enviar mensaje');
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, verticalType, config.systemPrompt, context]);

  const executeQuickAction = useCallback(async (action: VerticalQuickAction) => {
    return sendMessage(action.prompt);
  }, [sendMessage]);

  const provideFeedback = useCallback((messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, feedback } : m
    ));
    toast.success('Gracias por tu feedback');
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const cancelRequest = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    config,
    quickActions: config.quickActions,
    sendMessage,
    executeQuickAction,
    provideFeedback,
    clearChat,
    cancelRequest,
    setContext
  };
}

export { VERTICAL_CONFIGS };
