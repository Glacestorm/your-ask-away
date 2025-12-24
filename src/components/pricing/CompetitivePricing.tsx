import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  Check,
  Clock,
  Crown,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';
import { useLanguage } from '@/contexts/LanguageContext';

type BillingCycle = 'monthly' | 'annual' | 'perpetual';

type BadgeVariant = 'popular' | 'value' | 'enterprise';

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
    variant: BadgeVariant;
  };
  features: {
    name: string;
    included: boolean;
    highlight?: boolean;
  }[];
  cta: string;
  highlighted?: boolean;
}

const buildPricingTiers = (t: (key: string) => string): PricingTier[] => [
  {
    id: 'starter',
    name: t('landing.pricing.tier.starter.name'),
    description: t('landing.pricing.tier.starter.desc'),
    icon: <Zap className="w-6 h-6" />,
    monthlyPrice: 29,
    annualPrice: 290,
    perpetualPrice: 990,
    features: [
      { name: t('landing.pricing.features.users3'), included: true },
      { name: t('landing.pricing.features.company1'), included: true },
      { name: t('landing.pricing.features.crmBasic'), included: true },
      { name: t('landing.pricing.features.dashboardAnalytics'), included: true },
      { name: t('landing.pricing.features.emailSupport'), included: true },
      { name: t('landing.pricing.features.exportBasic'), included: true },
      { name: t('landing.pricing.features.automations'), included: false },
      { name: t('landing.pricing.features.apiAccess'), included: false },
      { name: t('landing.pricing.features.multiSector'), included: false },
      { name: t('landing.pricing.features.complianceAdvanced'), included: false },
    ],
    cta: t('landing.pricing.tier.starter.cta'),
  },
  {
    id: 'essential',
    name: t('landing.pricing.tier.essential.name'),
    description: t('landing.pricing.tier.essential.desc'),
    icon: <Star className="w-6 h-6" />,
    monthlyPrice: 79,
    annualPrice: 790,
    perpetualPrice: 2490,
    badge: { text: t('landing.pricing.badge.value'), variant: 'value' },
    features: [
      { name: t('landing.pricing.features.users10'), included: true },
      { name: t('landing.pricing.features.companies3'), included: true },
      { name: t('landing.pricing.features.crmFull'), included: true, highlight: true },
      { name: t('landing.pricing.features.dashboardAdvanced'), included: true },
      { name: t('landing.pricing.features.supportPriority'), included: true },
      { name: t('landing.pricing.features.exportAdvanced'), included: true },
      { name: t('landing.pricing.features.automationsBasic'), included: true, highlight: true },
      { name: t('landing.pricing.features.apiAccess'), included: true },
      { name: t('landing.pricing.features.multiSector3'), included: false },
      { name: t('landing.pricing.features.complianceAdvanced'), included: false },
    ],
    cta: t('landing.pricing.tier.essential.cta'),
  },
  {
    id: 'pro',
    name: t('landing.pricing.tier.pro.name'),
    description: t('landing.pricing.tier.pro.desc'),
    icon: <Crown className="w-6 h-6" />,
    monthlyPrice: 149,
    annualPrice: 1490,
    perpetualPrice: 4990,
    badge: { text: t('landing.pricing.badge.popular'), variant: 'popular' },
    highlighted: true,
    features: [
      { name: t('landing.pricing.features.users50'), included: true, highlight: true },
      { name: t('landing.pricing.features.companies10'), included: true },
      { name: t('landing.pricing.features.crmErpFull'), included: true, highlight: true },
      { name: t('landing.pricing.features.businessIntelligence'), included: true },
      { name: t('landing.pricing.features.support247'), included: true, highlight: true },
      { name: t('landing.pricing.features.exportUnlimited'), included: true },
      { name: t('landing.pricing.features.automationsAdvanced'), included: true, highlight: true },
      { name: t('landing.pricing.features.apiUnlimited'), included: true },
      { name: t('landing.pricing.features.multiSector8'), included: true, highlight: true },
      { name: t('landing.pricing.features.complianceBasic'), included: true },
    ],
    cta: t('landing.pricing.tier.pro.cta'),
  },
  {
    id: 'enterprise',
    name: t('landing.pricing.tier.enterprise.name'),
    description: t('landing.pricing.tier.enterprise.desc'),
    icon: <Building2 className="w-6 h-6" />,
    monthlyPrice: 499,
    annualPrice: 4990,
    perpetualPrice: 14990,
    badge: { text: t('landing.pricing.badge.enterprise'), variant: 'enterprise' },
    features: [
      { name: t('landing.pricing.features.usersUnlimited'), included: true, highlight: true },
      { name: t('landing.pricing.features.companiesUnlimited'), included: true, highlight: true },
      { name: t('landing.pricing.features.suiteComplete'), included: true, highlight: true },
      { name: t('landing.pricing.features.biRevenue'), included: true, highlight: true },
      { name: t('landing.pricing.features.accountManager'), included: true, highlight: true },
      { name: t('landing.pricing.features.integrationsCustom'), included: true },
      { name: t('landing.pricing.features.bpmnWorkflows'), included: true, highlight: true },
      { name: t('landing.pricing.features.apiWebhooks'), included: true },
      { name: t('landing.pricing.features.allSectorsCnae'), included: true, highlight: true },
      { name: t('landing.pricing.features.complianceTotal'), included: true, highlight: true },
    ],
    cta: t('landing.pricing.tier.enterprise.cta'),
  },
];

const BillingToggle = ({
  value,
  onChange,
}: {
  value: BillingCycle;
  onChange: (value: BillingCycle) => void;
}) => {
  const { t } = useLanguage();

  const options: { value: BillingCycle; label: string; discount?: string }[] = [
    { value: 'monthly', label: t('landing.pricing.billing.monthly') },
    { value: 'annual', label: t('landing.pricing.billing.annual'), discount: '-17%' },
    { value: 'perpetual', label: t('landing.pricing.billing.perpetual'), discount: '-30%' },
  ];

  return (
    <div className="inline-flex items-center gap-1 p-1.5 bg-slate-800/50 rounded-full border border-slate-700/50">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300',
            value === option.value
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
              : 'text-slate-400 hover:text-white'
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

const PricingCard = ({
  tier,
  billingCycle,
  onSelect,
}: {
  tier: PricingTier;
  billingCycle: BillingCycle;
  onSelect: (tierId: string) => void;
}) => {
  const { t } = useLanguage();

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
        return t('landing.pricing.priceLabel.month');
      case 'annual':
        return t('landing.pricing.priceLabel.year');
      case 'perpetual':
        return t('landing.pricing.priceLabel.oneTime');
    }
  };

  const originalPrice = getOriginalPrice();
  const currentPrice = getPrice();

  const getBadgeStyles = (variant: BadgeVariant) => {
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
        'relative flex flex-col rounded-3xl p-8 transition-all duration-300',
        tier.highlighted
          ? 'bg-gradient-to-b from-primary/20 via-slate-800/80 to-slate-900/80 border-2 border-primary/50 shadow-2xl shadow-primary/20'
          : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50'
      )}
    >
      {/* Badge */}
      {tier.badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className={cn('px-4 py-1.5 text-sm font-semibold', getBadgeStyles(tier.badge.variant))}>
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {tier.badge.text}
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div
          className={cn(
            'inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4',
            tier.highlighted ? 'bg-primary/20 text-primary' : 'bg-slate-700/50 text-slate-300'
          )}
        >
          {tier.icon}
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
        <p className="text-sm text-slate-400">{tier.description}</p>
      </div>

      {/* Price */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          {originalPrice && billingCycle !== 'monthly' && (
            <span className="text-xl text-slate-500 line-through">{originalPrice.toLocaleString()}€</span>
          )}
          <div className="flex items-baseline">
            <span className="text-5xl font-bold text-white">{currentPrice.toLocaleString()}€</span>
            <span className="text-slate-400 ml-1">{getPriceLabel()}</span>
          </div>
        </div>
        {billingCycle !== 'monthly' && originalPrice && (
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
            {t('landing.pricing.youSave')} {(originalPrice - currentPrice).toLocaleString()}€
          </Badge>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8 flex-1">
        {tier.features.map((feature, index) => (
          <li
            key={index}
            className={cn('flex items-center gap-3 text-sm', feature.included ? 'text-slate-300' : 'text-slate-500')}
          >
            {feature.included ? (
              <Check className={cn('w-5 h-5 shrink-0', feature.highlight ? 'text-primary' : 'text-green-500')} />
            ) : (
              <X className="w-5 h-5 text-slate-600 shrink-0" />
            )}
            <span className={feature.highlight ? 'font-medium text-white' : ''}>{feature.name}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        onClick={() => onSelect(tier.id)}
        className={cn(
          'w-full h-12 rounded-xl font-semibold transition-all duration-300',
          tier.highlighted
            ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25'
            : 'bg-slate-700 hover:bg-slate-600 text-white'
        )}
      >
        {tier.cta}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
};

const CompetitivePricing = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const { createCheckout } = useSubscription();
  const { t, language } = useLanguage();

  const tiers = useMemo(() => buildPricingTiers(t), [language, t]);

  const handleSelectTier = (tierId: string) => {
    if (tierId === 'enterprise') {
      window.location.href = 'mailto:comercial@obelixia.com?subject=Enterprise%20Quote';
      return;
    }

    // Map tier to subscription tier
    const tierMap: Record<string, 'core' | 'automation' | 'industry'> = {
      starter: 'core',
      essential: 'core',
      pro: 'automation',
    };
    createCheckout(tierMap[tierId] || 'core');
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
            {t('landing.pricing.badge')}
          </Badge>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            {t('landing.pricing.title')}
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">{t('landing.pricing.subtitle')}</p>

          {/* Billing Toggle */}
          <BillingToggle value={billingCycle} onChange={setBillingCycle} />
        </motion.div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-16">
          {tiers.map((tier) => (
            <PricingCard key={tier.id} tier={tier} billingCycle={billingCycle} onSelect={handleSelectTier} />
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
            {t('landing.pricing.trust.refund')}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            {t('landing.pricing.trust.instant')}
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            {t('landing.pricing.trust.companies')}
          </div>
        </motion.div>

        {/* FAQ Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-slate-400 mb-4">{t('landing.pricing.faq.prompt')}</p>
          <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
            {t('landing.pricing.faq.cta')}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CompetitivePricing;
