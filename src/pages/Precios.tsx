import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Sparkles, 
  Layers, 
  Workflow, 
  Building2,
  Zap,
  Shield,
  Users,
  Settings,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';
import { useSubscription, SUBSCRIPTION_TIERS } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Separator } from '@/components/ui/separator';

interface PricingLayer {
  key: 'core' | 'automation' | 'industry';
  name: string;
  tagline: string;
  price: number;
  period: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
  features: string[];
  notIncluded?: string[];
  cta: string;
  popular?: boolean;
  badge?: string;
}

const pricingLayers: PricingLayer[] = [
  {
    key: 'core',
    name: 'Core',
    tagline: 'CRM/ERP Base',
    price: 49,
    period: '/usuario/mes',
    description: 'Para entrar. Todo lo esencial para gestionar tu negocio.',
    icon: Layers,
    color: 'text-blue-400',
    bgGradient: 'from-blue-500/20 to-blue-600/10',
    features: [
      'CRM completo',
      'ERP básico',
      'Dashboard de reporting',
      'Gestión de clientes',
      'Hasta 5 usuarios',
      '1 empresa',
      'Soporte por email',
    ],
    notIncluded: [
      'Motor BPMN',
      'Customer Journeys',
      'CDP',
      'Packs sectoriales',
    ],
    cta: 'Empezar con Core',
  },
  {
    key: 'automation',
    name: 'Automation',
    tagline: 'Donde está el margen',
    price: 149,
    period: '/usuario/mes',
    description: 'BPMN + Customer Journeys + CDP lite. El verdadero diferenciador.',
    icon: Workflow,
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-emerald-600/10',
    features: [
      'Todo de Core incluido',
      'Motor BPMN completo',
      'Customer Journeys',
      'CDP Lite (segmentación)',
      'Workflows automatizados',
      'Integraciones API',
      'Analytics avanzado',
      'Process Mining básico',
      'Hasta 25 usuarios',
      '5 empresas',
      'Soporte prioritario',
    ],
    notIncluded: [
      'Packs sectoriales',
      'Cumplimiento regulatorio',
      'Setup personalizado',
    ],
    cta: 'Escalar con Automation',
    popular: true,
    badge: 'Recomendado',
  },
  {
    key: 'industry',
    name: 'Industry Pack',
    tagline: 'Ticket alto + Setup',
    price: 499,
    period: '/usuario/mes',
    description: 'Verticales sectoriales: Banca, Seguros, Fintech. Con partners.',
    icon: Building2,
    color: 'text-amber-400',
    bgGradient: 'from-amber-500/20 to-amber-600/10',
    features: [
      'Todo de Automation incluido',
      'Pack Banca completo',
      'Pack Seguros completo', 
      'Pack Fintech completo',
      'Cumplimiento regulatorio (DORA, NIS2)',
      'Gestión de riesgos',
      'Reportes para auditores',
      'Setup personalizado',
      'Process Mining completo',
      'App Builder',
      'SLA garantizado',
      'Manager de cuenta dedicado',
      'Usuarios ilimitados',
      'Empresas ilimitadas',
      'Soporte 24/7',
    ],
    cta: 'Contactar Ventas',
    badge: 'Enterprise',
  },
];

const addOns = [
  { name: 'Pack 10 usuarios adicionales', price: 29, icon: Users },
  { name: 'Almacenamiento extra 100GB', price: 19, icon: Settings },
  { name: 'Soporte 24/7', price: 99, icon: Shield },
  { name: 'Módulo IA Avanzado', price: 79, icon: Zap },
];

const competitors = [
  { name: 'Odoo', range: '25-90€/usuario/mes' },
  { name: 'Dynamics 365', range: '60-135€/usuario/mes' },
  { name: 'Salesforce', range: '25-330€/usuario/mes' },
  { name: 'Holded', range: '5-45€/usuario/mes' },
  { name: 'Pipedrive', range: '15-99€/usuario/mes' },
];

const Precios: React.FC = () => {
  const navigate = useNavigate();
  const { trackPageView, trackCTAClick } = useMarketingAnalytics();
  const { user } = useAuth();
  const { subscribed, tier, loading, createCheckout, openCustomerPortal } = useSubscription();

  useEffect(() => {
    trackPageView('precios');
  }, [trackPageView]);

  const handleCTAClick = async (layerKey: 'core' | 'automation' | 'industry') => {
    trackCTAClick(`pricing_${layerKey}`, 'pricing_page');
    
    if (!user) {
      navigate('/auth?redirect=/precios');
      return;
    }

    if (layerKey === 'industry') {
      // Enterprise tier - contact sales
      navigate('/contact?plan=industry');
      return;
    }

    await createCheckout(layerKey);
  };

  const handleManageSubscription = async () => {
    await openCustomerPortal();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-16">
        <Link to="/store" className="inline-flex items-center text-slate-400 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Store
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            ESTRATEGIA DE 3 CAPAS
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Crece con Margen
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            3 capas de producto diseñadas para maximizar tu margen en España y EU.
            Competitivo con Odoo, Dynamics 365, Salesforce.
          </p>
        </motion.div>

        {/* Subscription Status */}
        {user && subscribed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 max-w-md mx-auto"
          >
            <Card className="border-emerald-500/50 bg-emerald-500/10">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5 text-emerald-400" />
                  <div>
                    <p className="text-white font-medium">
                      Plan {SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS]?.name || tier}
                    </p>
                    <p className="text-sm text-slate-400">Suscripción activa</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleManageSubscription}
                  className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/20"
                >
                  Gestionar
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 3 Layers */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {pricingLayers.map((layer, index) => {
            const isCurrentPlan = subscribed && tier === layer.key;
            
            return (
              <motion.div
                key={layer.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`h-full flex flex-col relative overflow-hidden ${
                  layer.popular 
                    ? 'border-emerald-500 bg-slate-800/80' 
                    : isCurrentPlan
                    ? 'border-emerald-400 bg-slate-800/60'
                    : 'border-slate-700 bg-slate-800/50'
                }`}>
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${layer.bgGradient} opacity-50`} />
                  
                  {/* Badge */}
                  {(layer.badge || isCurrentPlan) && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className={`${
                        isCurrentPlan 
                          ? 'bg-emerald-500 text-white' 
                          : layer.popular 
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}>
                        {isCurrentPlan ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Tu Plan
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 mr-1" />
                            {layer.badge}
                          </>
                        )}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="relative text-center pt-8">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center bg-gradient-to-br ${layer.bgGradient}`}>
                      <layer.icon className={`w-8 h-8 ${layer.color}`} />
                    </div>
                    <p className={`text-sm font-medium ${layer.color} mb-1`}>{layer.tagline}</p>
                    <CardTitle className="text-2xl text-white">{layer.name}</CardTitle>
                    <CardDescription className="text-slate-400">{layer.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-white">{layer.price}€</span>
                      <span className="text-slate-400">{layer.period}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="relative flex-1">
                    <ul className="space-y-2">
                      {layer.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${layer.color}`} />
                          <span className="text-sm text-slate-300">{feature}</span>
                        </li>
                      ))}
                      {layer.notIncluded?.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <X className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-600" />
                          <span className="text-sm text-slate-500">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="relative">
                    <Button 
                      className={`w-full ${
                        isCurrentPlan
                          ? 'bg-slate-600 hover:bg-slate-500 cursor-default'
                          : layer.popular 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}
                      onClick={() => !isCurrentPlan && handleCTAClick(layer.key)}
                      disabled={isCurrentPlan || loading}
                    >
                      {isCurrentPlan ? 'Plan Actual' : layer.cta}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Add-ons Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Add-ons Opcionales</h2>
            <p className="text-slate-400">Amplía tu plan con funcionalidades adicionales</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {addOns.map((addon) => (
              <Card key={addon.name} className="border-slate-700 bg-slate-800/30">
                <CardContent className="p-4 text-center">
                  <addon.icon className="h-6 w-6 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-white mb-1">{addon.name}</p>
                  <p className="text-lg font-bold text-emerald-400">{addon.price}€<span className="text-xs text-slate-400">/mes</span></p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        <Separator className="max-w-4xl mx-auto bg-slate-700 mb-16" />

        {/* Competitor Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Comparativa de Mercado</h2>
            <p className="text-slate-400">Posicionamiento competitivo en España y EU</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {competitors.map((comp) => (
              <Card key={comp.name} className="border-slate-700 bg-slate-800/30">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-slate-400 mb-1">{comp.name}</p>
                  <p className="text-sm font-medium text-white">{comp.range}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-slate-500 mt-4">
            ObelixIA: 49-499€/usuario/mes — Competitivo en valor, no en precio bajo
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <p className="text-slate-400 mb-4">
            ¿Necesitas un plan personalizado? ¿Dudas sobre cuál elegir?
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/contact">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                Hablar con Ventas
              </Button>
            </Link>
            <Link to="/demo">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Solicitar Demo
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Precios;
