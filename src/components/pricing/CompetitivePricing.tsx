import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  X, 
  Star, 
  Zap, 
  Crown, 
  Building2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Shield,
  Users,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';

type BillingCycle = 'monthly' | 'annual' | 'perpetual';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  monthlyPrice: number;
  annualPrice: number;
  perpetualPrice: number;
  badge?: {
    text: string;
    variant: 'popular' | 'value' | 'enterprise';
  };
  features: {
    name: string;
    included: boolean;
    highlight?: boolean;
  }[];
  cta: string;
  highlighted?: boolean;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Ideal para autónomos y pequeñas empresas',
    icon: <Zap className="w-6 h-6" />,
    monthlyPrice: 29,
    annualPrice: 290,
    perpetualPrice: 990,
    features: [
      { name: 'Hasta 3 usuarios', included: true },
      { name: '1 empresa', included: true },
      { name: 'CRM básico', included: true },
      { name: 'Dashboard analítico', included: true },
      { name: 'Soporte por email', included: true },
      { name: 'Exportación básica', included: true },
      { name: 'Automatizaciones', included: false },
      { name: 'API Access', included: false },
      { name: 'Multi-sector', included: false },
      { name: 'Compliance avanzado', included: false },
    ],
    cta: 'Comenzar Gratis',
  },
  {
    id: 'essential',
    name: 'Essential',
    description: 'Para equipos en crecimiento',
    icon: <Star className="w-6 h-6" />,
    monthlyPrice: 79,
    annualPrice: 790,
    perpetualPrice: 2490,
    badge: { text: 'Mejor Precio', variant: 'value' },
    features: [
      { name: 'Hasta 10 usuarios', included: true },
      { name: '3 empresas', included: true },
      { name: 'CRM completo', included: true, highlight: true },
      { name: 'Dashboard avanzado', included: true },
      { name: 'Soporte prioritario', included: true },
      { name: 'Exportación avanzada', included: true },
      { name: 'Automatizaciones básicas', included: true, highlight: true },
      { name: 'API Access', included: true },
      { name: 'Multi-sector (3)', included: false },
      { name: 'Compliance avanzado', included: false },
    ],
    cta: 'Elegir Essential',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para empresas que escalan',
    icon: <Crown className="w-6 h-6" />,
    monthlyPrice: 149,
    annualPrice: 1490,
    perpetualPrice: 4990,
    badge: { text: 'Más Vendido', variant: 'popular' },
    highlighted: true,
    features: [
      { name: 'Hasta 50 usuarios', included: true, highlight: true },
      { name: '10 empresas', included: true },
      { name: 'CRM + ERP completo', included: true, highlight: true },
      { name: 'Business Intelligence', included: true },
      { name: 'Soporte 24/7', included: true, highlight: true },
      { name: 'Exportación ilimitada', included: true },
      { name: 'Automatizaciones avanzadas', included: true, highlight: true },
      { name: 'API ilimitada', included: true },
      { name: 'Multi-sector (8)', included: true, highlight: true },
      { name: 'Compliance básico', included: true },
    ],
    cta: 'Elegir Pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Solución corporativa a medida',
    icon: <Building2 className="w-6 h-6" />,
    monthlyPrice: 499,
    annualPrice: 4990,
    perpetualPrice: 14990,
    badge: { text: 'Todo Incluido', variant: 'enterprise' },
    features: [
      { name: 'Usuarios ilimitados', included: true, highlight: true },
      { name: 'Empresas ilimitadas', included: true, highlight: true },
      { name: 'Suite completa', included: true, highlight: true },
      { name: 'BI + Revenue Intelligence', included: true, highlight: true },
      { name: 'Account Manager dedicado', included: true, highlight: true },
      { name: 'Integraciones custom', included: true },
      { name: 'BPMN + Workflows', included: true, highlight: true },
      { name: 'API + Webhooks', included: true },
      { name: 'Todos los sectores + CNAE', included: true, highlight: true },
      { name: 'Compliance total (GDPR, PCI-DSS)', included: true, highlight: true },
    ],
    cta: 'Contactar Ventas',
  },
];

const BillingToggle: React.FC<{
  value: BillingCycle;
  onChange: (value: BillingCycle) => void;
}> = ({ value, onChange }) => {
  const options: { value: BillingCycle; label: string; discount?: string }[] = [
    { value: 'monthly', label: 'Mensual' },
    { value: 'annual', label: 'Anual', discount: '-17%' },
    { value: 'perpetual', label: 'Perpetua', discount: '-30%' },
  ];

  return (
    <div className="inline-flex items-center gap-1 p-1.5 bg-slate-800/50 rounded-full border border-slate-700/50">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
            value === option.value
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              : "text-slate-400 hover:text-white"
          )}
        >
          <span className="flex items-center gap-2">
            {option.label}
            {option.discount && value === option.value && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                {option.discount}
              </Badge>
            )}
          </span>
        </button>
      ))}
    </div>
  );
};

const PricingCard: React.FC<{
  tier: PricingTier;
  billingCycle: BillingCycle;
  onSelect: (tierId: string) => void;
}> = ({ tier, billingCycle, onSelect }) => {
  const getPrice = () => {
    switch (billingCycle) {
      case 'monthly':
        return tier.monthlyPrice;
      case 'annual':
        return tier.annualPrice;
      case 'perpetual':
        return tier.perpetualPrice;
    }
  };

  const getOriginalPrice = () => {
    switch (billingCycle) {
      case 'annual':
        return tier.monthlyPrice * 12;
      case 'perpetual':
        return tier.annualPrice * 3;
      default:
        return null;
    }
  };

  const getPriceLabel = () => {
    switch (billingCycle) {
      case 'monthly':
        return '/mes';
      case 'annual':
        return '/año';
      case 'perpetual':
        return ' única';
    }
  };

  const originalPrice = getOriginalPrice();
  const currentPrice = getPrice();

  const getBadgeStyles = (variant: string) => {
    switch (variant) {
      case 'popular':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg shadow-orange-500/25';
      case 'value':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg shadow-green-500/25';
      case 'enterprise':
        return 'bg-gradient-to-r from-purple-500 to-violet-500 text-white border-0 shadow-lg shadow-purple-500/25';
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative flex flex-col rounded-3xl p-8 transition-all duration-300",
        tier.highlighted
          ? "bg-gradient-to-b from-primary/20 via-slate-800/80 to-slate-900/80 border-2 border-primary/50 shadow-2xl shadow-primary/20"
          : "bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50"
      )}
    >
      {/* Badge */}
      {tier.badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className={cn("px-4 py-1.5 text-sm font-semibold", getBadgeStyles(tier.badge.variant))}>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {tier.badge.text}
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className={cn(
          "inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4",
          tier.highlighted
            ? "bg-primary/20 text-primary"
            : "bg-slate-700/50 text-slate-300"
        )}>
          {tier.icon}
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
        <p className="text-sm text-slate-400">{tier.description}</p>
      </div>

      {/* Price */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          {originalPrice && billingCycle !== 'monthly' && (
            <span className="text-xl text-slate-500 line-through">
              €{originalPrice.toLocaleString()}
            </span>
          )}
          <div className="flex items-baseline">
            <span className="text-5xl font-bold text-white">€{currentPrice.toLocaleString()}</span>
            <span className="text-slate-400 ml-1">{getPriceLabel()}</span>
          </div>
        </div>
        {billingCycle !== 'monthly' && originalPrice && (
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
            Ahorras €{(originalPrice - currentPrice).toLocaleString()}
          </Badge>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8 flex-1">
        {tier.features.map((feature, index) => (
          <li 
            key={index}
            className={cn(
              "flex items-center gap-3 text-sm",
              feature.included ? "text-slate-300" : "text-slate-500"
            )}
          >
            {feature.included ? (
              <Check className={cn(
                "w-5 h-5 shrink-0",
                feature.highlight ? "text-primary" : "text-green-500"
              )} />
            ) : (
              <X className="w-5 h-5 text-slate-600 shrink-0" />
            )}
            <span className={feature.highlight ? "font-medium text-white" : ""}>
              {feature.name}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        onClick={() => onSelect(tier.id)}
        className={cn(
          "w-full h-12 rounded-xl font-semibold transition-all duration-300",
          tier.highlighted
            ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
            : "bg-slate-700 hover:bg-slate-600 text-white"
        )}
      >
        {tier.cta}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
};

const CompetitivePricing: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const { createCheckout } = useSubscription();

  const handleSelectTier = (tierId: string) => {
    if (tierId === 'enterprise') {
      window.location.href = 'mailto:comercial@obelixia.com?subject=Enterprise%20Quote';
    } else {
      // Map tier to subscription tier
      const tierMap: Record<string, 'core' | 'automation' | 'industry'> = {
        starter: 'core',
        essential: 'core',
        pro: 'automation',
      };
      createCheckout(tierMap[tierId] || 'core');
    }
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-6 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
            Planes y Precios
          </Badge>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Elige el plan perfecto para tu negocio
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Precios transparentes sin sorpresas. Todos los planes incluyen actualizaciones gratuitas y soporte técnico.
          </p>

          {/* Billing Toggle */}
          <BillingToggle value={billingCycle} onChange={setBillingCycle} />
        </motion.div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-16">
          {PRICING_TIERS.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              billingCycle={billingCycle}
              onSelect={handleSelectTier}
            />
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-400"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Garantía de devolución 30 días
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Activación inmediata
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            +500 empresas confían en nosotros
          </div>
        </motion.div>

        {/* FAQ Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-slate-400 mb-4">
            ¿Tienes preguntas sobre los planes?
          </p>
          <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
            Ver preguntas frecuentes
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CompetitivePricing;
