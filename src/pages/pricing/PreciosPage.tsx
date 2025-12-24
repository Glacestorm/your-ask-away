import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Check, 
  X, 
  Sparkles, 
  Zap, 
  Shield, 
  Users, 
  Building2,
  Crown,
  ArrowRight,
  HelpCircle,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSEOMeta, structuredDataGenerators } from '@/hooks/useSEOMeta';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  perpetualPrice: number;
  features: { name: string; included: boolean; highlight?: boolean }[];
  popular?: boolean;
  enterprise?: boolean;
  badge?: string;
  icon: React.ReactNode;
}

const plans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfecto para empezar',
    monthlyPrice: 49,
    annualPrice: 39,
    perpetualPrice: 990,
    icon: <Zap className="h-6 w-6" />,
    badge: 'Básico',
    features: [
      { name: '5 usuarios incluidos', included: true },
      { name: 'CRM básico', included: true },
      { name: 'Facturación electrónica', included: true },
      { name: 'Soporte por email', included: true },
      { name: '1GB almacenamiento', included: true },
      { name: 'ERP completo', included: false },
      { name: 'Business Intelligence', included: false },
      { name: 'IA Avanzada', included: false },
      { name: 'API acceso', included: false },
      { name: 'Soporte 24/7', included: false },
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Para equipos en crecimiento',
    monthlyPrice: 149,
    annualPrice: 119,
    perpetualPrice: 2990,
    icon: <Star className="h-6 w-6" />,
    popular: true,
    badge: 'Más Popular',
    features: [
      { name: '25 usuarios incluidos', included: true, highlight: true },
      { name: 'CRM completo', included: true },
      { name: 'ERP empresarial', included: true, highlight: true },
      { name: 'Facturación + Contabilidad', included: true },
      { name: 'Business Intelligence', included: true, highlight: true },
      { name: '50GB almacenamiento', included: true },
      { name: 'Soporte prioritario', included: true },
      { name: 'Integraciones básicas', included: true },
      { name: 'IA Avanzada', included: false },
      { name: 'API enterprise', included: false },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Solución completa',
    monthlyPrice: 299,
    annualPrice: 239,
    perpetualPrice: 5990,
    icon: <Shield className="h-6 w-6" />,
    badge: 'Mejor Valor',
    features: [
      { name: '100 usuarios incluidos', included: true, highlight: true },
      { name: 'Suite completa CRM+ERP', included: true },
      { name: 'IA Avanzada', included: true, highlight: true },
      { name: 'Compliance Suite (GDPR)', included: true, highlight: true },
      { name: 'GIS Territorial', included: true },
      { name: '200GB almacenamiento', included: true },
      { name: 'API full access', included: true },
      { name: 'Soporte 24/7', included: true },
      { name: 'SSO & MFA', included: true },
      { name: 'Onboarding dedicado', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para grandes organizaciones',
    monthlyPrice: 0,
    annualPrice: 0,
    perpetualPrice: 0,
    icon: <Crown className="h-6 w-6" />,
    enterprise: true,
    badge: 'Personalizado',
    features: [
      { name: 'Usuarios ilimitados', included: true, highlight: true },
      { name: 'Todas las funcionalidades', included: true },
      { name: 'Implementación personalizada', included: true, highlight: true },
      { name: 'Almacenamiento ilimitado', included: true },
      { name: 'SLA 99.99%', included: true, highlight: true },
      { name: 'Account Manager dedicado', included: true },
      { name: 'Auditoría blockchain', included: true },
      { name: 'Integración white-label', included: true },
      { name: 'Formación ilimitada', included: true },
      { name: 'Desarrollo a medida', included: true },
    ],
  },
];

const faqs = [
  {
    question: '¿Puedo cambiar de plan en cualquier momento?',
    answer: 'Sí, puedes actualizar o reducir tu plan en cualquier momento. Los cambios se aplicarán en el siguiente ciclo de facturación. Si actualizas, pagarás la diferencia prorrateada.',
  },
  {
    question: '¿Hay compromiso de permanencia?',
    answer: 'No, no hay ningún compromiso de permanencia. Puedes cancelar tu suscripción en cualquier momento. Si eliges facturación anual, tendrás acceso hasta el final del período pagado.',
  },
  {
    question: '¿Qué incluye la licencia perpetua?',
    answer: 'La licencia perpetua te da acceso permanente al software en la versión adquirida. Incluye 1 año de actualizaciones y soporte. Después puedes renovar el mantenimiento anualmente al 20% del precio original.',
  },
  {
    question: '¿Cómo funciona la prueba gratuita?',
    answer: 'Ofrecemos 14 días de prueba gratuita en todos los planes con acceso completo a todas las funcionalidades. No se requiere tarjeta de crédito para empezar.',
  },
  {
    question: '¿Los precios incluyen IVA?',
    answer: 'Los precios mostrados no incluyen IVA. El IVA se calculará según tu país de residencia fiscal al momento de la compra.',
  },
  {
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos tarjetas de crédito/débito (Visa, Mastercard, American Express), PayPal, transferencia bancaria y domiciliación SEPA para facturación recurrente.',
  },
];

export default function PreciosPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual' | 'perpetual'>('annual');
  const [isAnnual, setIsAnnual] = useState(true);

  useSEOMeta({
    title: 'Precios y Planes - Software CRM y ERP',
    description: 'Planes flexibles de CRM y ERP para empresas de todos los tamaños. Desde 39€/mes. Sin permanencia, prueba gratis 14 días.',
    keywords: 'precios CRM, planes ERP, software empresarial precios, CRM español precio',
    structuredData: structuredDataGenerators.product({
      name: 'ObelixCRM',
      description: 'Software CRM y ERP empresarial',
      price: 39,
      currency: 'EUR',
    }),
  });

  const getPrice = (plan: PricingPlan) => {
    if (plan.enterprise) return 'Contactar';
    switch (billingCycle) {
      case 'monthly': return plan.monthlyPrice;
      case 'annual': return plan.annualPrice;
      case 'perpetual': return plan.perpetualPrice;
    }
  };

  const getOriginalPrice = (plan: PricingPlan) => {
    if (billingCycle === 'annual') return plan.monthlyPrice;
    return null;
  };

  const getSavings = (plan: PricingPlan) => {
    if (plan.enterprise || billingCycle !== 'annual') return null;
    const savings = ((plan.monthlyPrice - plan.annualPrice) / plan.monthlyPrice) * 100;
    return Math.round(savings);
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="h-3 w-3 mr-1" />
            Prueba gratis 14 días
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            Planes simples, precios transparentes
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tu negocio. Sin sorpresas, sin letra pequeña.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as typeof billingCycle)}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="monthly">Mensual</TabsTrigger>
              <TabsTrigger value="annual" className="relative">
                Anual
                <Badge className="absolute -top-3 -right-2 text-xs bg-green-500">-20%</Badge>
              </TabsTrigger>
              <TabsTrigger value="perpetual">Perpetuo</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative h-full flex flex-col ${
                plan.popular ? 'border-primary shadow-lg scale-105 z-10' : ''
              }`}>
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${
                    plan.popular ? 'bg-primary' : 'bg-muted'
                  } text-${plan.popular ? 'primary-foreground' : 'foreground'} px-3 py-1 rounded-full text-xs font-medium`}>
                    {plan.badge}
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                    plan.popular ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {plan.icon}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-center mb-6">
                    {plan.enterprise ? (
                      <div className="text-3xl font-bold">Personalizado</div>
                    ) : (
                      <>
                        {getOriginalPrice(plan) && (
                          <div className="text-lg text-muted-foreground line-through">
                            {getOriginalPrice(plan)}€
                          </div>
                        )}
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-4xl font-bold">{getPrice(plan)}</span>
                          <span className="text-muted-foreground">
                            €{billingCycle === 'perpetual' ? '' : '/mes'}
                          </span>
                        </div>
                        {getSavings(plan) && (
                          <Badge variant="secondary" className="mt-2 bg-green-500/10 text-green-600">
                            Ahorras {getSavings(plan)}%
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className={`h-5 w-5 shrink-0 ${
                            feature.highlight ? 'text-primary' : 'text-green-500'
                          }`} />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground/50 shrink-0" />
                        )}
                        <span className={`text-sm ${
                          feature.included 
                            ? feature.highlight ? 'font-medium' : ''
                            : 'text-muted-foreground/50'
                        }`}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                    asChild
                  >
                    <Link to={plan.enterprise ? '/contacto' : '/demo'}>
                      {plan.enterprise ? 'Contactar Ventas' : 'Empezar Prueba Gratis'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Comparativa de Funcionalidades</h2>
          <Card>
            <CardContent className="overflow-x-auto pt-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Funcionalidad</th>
                    {plans.map((plan) => (
                      <th key={plan.id} className="text-center py-3 px-4 font-medium">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Usuarios', values: ['5', '25', '100', 'Ilimitado'] },
                    { name: 'Almacenamiento', values: ['1GB', '50GB', '200GB', 'Ilimitado'] },
                    { name: 'CRM', values: ['Básico', 'Completo', 'Completo', 'Completo'] },
                    { name: 'ERP', values: [false, true, true, true] },
                    { name: 'Facturación', values: [true, true, true, true] },
                    { name: 'Contabilidad', values: [false, true, true, true] },
                    { name: 'BI / Analytics', values: [false, 'Básico', 'Avanzado', 'Enterprise'] },
                    { name: 'IA', values: [false, false, true, true] },
                    { name: 'GIS Territorial', values: [false, false, true, true] },
                    { name: 'Compliance', values: [false, false, true, true] },
                    { name: 'API', values: [false, 'Limitada', 'Full', 'Full + Custom'] },
                    { name: 'Soporte', values: ['Email', 'Prioritario', '24/7', 'Dedicado'] },
                  ].map((row, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{row.name}</td>
                      {row.values.map((value, j) => (
                        <td key={j} className="text-center py-3 px-4">
                          {typeof value === 'boolean' ? (
                            value ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />
                            )
                          ) : (
                            <span>{value}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6" />
            Preguntas Frecuentes
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Card className="bg-primary text-primary-foreground p-8 max-w-2xl mx-auto">
            <CardContent className="space-y-4">
              <h3 className="text-2xl font-bold">¿Necesitas ayuda para elegir?</h3>
              <p className="opacity-90">
                Nuestro equipo te ayuda a encontrar la solución perfecta para tu negocio.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Button variant="secondary" size="lg" asChild>
                  <Link to="/demo">Agendar Demo</Link>
                </Button>
                <Button variant="outline" size="lg" className="bg-transparent border-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                  <Link to="/store/calculator">Usar Calculadora</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
