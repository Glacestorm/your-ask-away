import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, X, Sparkles, Building, Rocket, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  icon: React.ElementType;
  features: { name: string; included: boolean }[];
  cta: string;
  popular?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    price: '49€',
    period: '/usuario/mes',
    description: 'Ideal para pequeñas empresas que empiezan',
    icon: Rocket,
    features: [
      { name: 'Hasta 5 usuarios', included: true },
      { name: 'CRM básico', included: true },
      { name: 'Gestión de visitas', included: true },
      { name: 'Dashboard básico', included: true },
      { name: 'Soporte por email', included: true },
      { name: 'Integraciones básicas', included: true },
      { name: 'Motor BPMN', included: false },
      { name: 'Process Mining', included: false },
      { name: 'App Builder', included: false },
      { name: 'API completa', included: false },
    ],
    cta: 'Empezar Gratis',
  },
  {
    name: 'Professional',
    price: '99€',
    period: '/usuario/mes',
    description: 'Para empresas en crecimiento',
    icon: Building,
    popular: true,
    features: [
      { name: 'Hasta 50 usuarios', included: true },
      { name: 'CRM completo', included: true },
      { name: 'Gestión de visitas avanzada', included: true },
      { name: 'Dashboards personalizables', included: true },
      { name: 'Soporte prioritario', included: true },
      { name: 'Integraciones avanzadas', included: true },
      { name: 'Motor BPMN', included: true },
      { name: 'Process Mining básico', included: true },
      { name: 'App Builder', included: false },
      { name: 'API completa', included: true },
    ],
    cta: 'Solicitar Demo',
  },
  {
    name: 'Enterprise',
    price: 'Personalizado',
    period: '',
    description: 'Para grandes organizaciones',
    icon: Crown,
    features: [
      { name: 'Usuarios ilimitados', included: true },
      { name: 'CRM completo + IA', included: true },
      { name: 'Gestión de visitas + IA', included: true },
      { name: 'Dashboards con IA', included: true },
      { name: 'Soporte 24/7 dedicado', included: true },
      { name: 'Integraciones personalizadas', included: true },
      { name: 'Motor BPMN avanzado', included: true },
      { name: 'Process Mining completo', included: true },
      { name: 'App Builder completo', included: true },
      { name: 'API + SDK completo', included: true },
    ],
    cta: 'Contactar Ventas',
  },
];

const Precios: React.FC = () => {
  const { trackPageView, trackCTAClick } = useMarketingAnalytics();

  useEffect(() => {
    trackPageView('precios');
  }, [trackPageView]);

  const handleCTAClick = (tierName: string) => {
    trackCTAClick(`pricing_${tierName.toLowerCase()}`, 'pricing_page');
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
            PRECIOS TRANSPARENTES
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Planes para Cada Necesidad
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Elige el plan que mejor se adapte a tu empresa. Sin costes ocultos,
            sin compromisos a largo plazo.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`h-full flex flex-col relative ${
                tier.popular 
                  ? 'border-emerald-500 bg-slate-800/80' 
                  : 'border-slate-700 bg-slate-800/50'
              }`}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Más Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                    tier.popular ? 'bg-emerald-500/30' : 'bg-slate-700'
                  }`}>
                    <tier.icon className={`w-7 h-7 ${
                      tier.popular ? 'text-emerald-400' : 'text-slate-300'
                    }`} />
                  </div>
                  <CardTitle className="text-2xl text-white">{tier.name}</CardTitle>
                  <CardDescription className="text-slate-400">{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">{tier.price}</span>
                    <span className="text-slate-400">{tier.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature.name} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-slate-600 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-slate-300' : 'text-slate-500'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link to="/demo" className="w-full" onClick={() => handleCTAClick(tier.name)}>
                    <Button 
                      className={`w-full ${
                        tier.popular 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}
                    >
                      {tier.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-400 mb-4">
            ¿Necesitas un plan personalizado? ¿Tienes dudas sobre qué plan elegir?
          </p>
          <Link to="/contact">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
              Hablar con Ventas
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Precios;
