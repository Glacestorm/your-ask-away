import React from 'react';
import { motion } from 'framer-motion';
import { Info, Clock, Infinity, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';

interface PricingBadgeProps {
  type: 'annual' | 'perpetual';
  showVat?: boolean;
}

export const PricingBadge: React.FC<PricingBadgeProps> = ({ type, showVat = true }) => {
  const { t } = useLanguage();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 cursor-help">
            {type === 'perpetual' ? (
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                <Infinity className="w-3 h-3 mr-1" />
                {t('landing.pricing.billing.perpetual')}
              </Badge>
            ) : (
              <span className="text-xs text-slate-400">{t('landing.bundles.annual')}</span>
            )}
            {showVat && <span className="text-[10px] text-slate-500 ml-1">{t('landing.bundles.noVat')}</span>}
            <HelpCircle className="w-3 h-3 text-slate-500" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-slate-800 border-slate-700">
          {type === 'perpetual' ? (
            <div className="space-y-2">
              <p className="font-semibold text-amber-300">{t('store.pricingBadge.tooltip.perpetual.title')}</p>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>
                  • <strong>{t('store.pricingBadge.tooltip.perpetual.item1.label')}</strong>{' '}
                  {t('store.pricingBadge.tooltip.perpetual.item1.value')}
                </li>
                <li>
                  • <strong>{t('store.pricingBadge.tooltip.perpetual.item2.label')}</strong>{' '}
                  {t('store.pricingBadge.tooltip.perpetual.item2.value')}
                </li>
                <li>
                  • <strong>{t('store.pricingBadge.tooltip.perpetual.item3.label')}</strong>{' '}
                  {t('store.pricingBadge.tooltip.perpetual.item3.value')}
                </li>
                <li>
                  • <strong>{t('store.pricingBadge.tooltip.perpetual.item4.label')}</strong>{' '}
                  {t('store.pricingBadge.tooltip.perpetual.item4.value')}
                </li>
                <li>
                  • <strong>{t('store.pricingBadge.tooltip.perpetual.item5.label')}</strong>{' '}
                  {t('store.pricingBadge.tooltip.perpetual.item5.value')}
                </li>
              </ul>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-semibold text-emerald-300">{t('store.pricingBadge.tooltip.annual.title')}</p>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>
                  • <strong>{t('store.pricingBadge.tooltip.annual.item1.label')}</strong>{' '}
                  {t('store.pricingBadge.tooltip.annual.item1.value')}
                </li>
                <li>
                  • <strong>{t('store.pricingBadge.tooltip.annual.item2.label')}</strong>{' '}
                  {t('store.pricingBadge.tooltip.annual.item2.value')}
                </li>
                <li>
                  • <strong>{t('store.pricingBadge.tooltip.annual.item3.label')}</strong>{' '}
                  {t('store.pricingBadge.tooltip.annual.item3.value')}
                </li>
                <li>
                  • <strong>{t('store.pricingBadge.tooltip.annual.item4.label')}</strong>{' '}
                  {t('store.pricingBadge.tooltip.annual.item4.value')}
                </li>
                <li>
                  • <strong>{t('store.pricingBadge.tooltip.annual.item5.label')}</strong>{' '}
                  {t('store.pricingBadge.tooltip.annual.item5.value')}
                </li>
              </ul>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const PricingExplanation: React.FC = () => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-12 p-6 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-2xl"
    >
      <div className="flex items-start gap-3 mb-4">
        <Info className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-lg font-semibold text-white mb-1">
            {t('store.pricingExplanation.title')}
          </h4>
          <p className="text-sm text-slate-400">
            {t('store.pricingExplanation.subtitle.before')}
            <strong className="text-slate-300">{t('landing.bundles.noVat')}</strong>{' '}
            {t('store.pricingExplanation.subtitle.after')}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Licencia Anual */}
        <div className="p-4 bg-slate-800/50 rounded-xl border border-emerald-500/30">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h5 className="font-semibold text-white">{t('store.pricingExplanation.annual.heading')}</h5>
          </div>
          <ul className="text-sm text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span>
                <strong>{t('store.pricingExplanation.annual.item1.label')}</strong>{' '}
                {t('store.pricingExplanation.annual.item1.value')}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span>
                <strong>{t('store.pricingExplanation.annual.item2.label')}</strong>{' '}
                {t('store.pricingExplanation.annual.item2.value')}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span>
                <strong>{t('store.pricingExplanation.annual.item3.label')}</strong>{' '}
                {t('store.pricingExplanation.annual.item3.value')}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span>
                <strong>{t('store.pricingExplanation.annual.item4.label')}</strong>{' '}
                {t('store.pricingExplanation.annual.item4.value')}
              </span>
            </li>
          </ul>
        </div>

        {/* Licencia Perpetua */}
        <div className="p-4 bg-slate-800/50 rounded-xl border border-amber-500/30">
          <div className="flex items-center gap-2 mb-3">
            <Infinity className="w-5 h-5 text-amber-400" />
            <h5 className="font-semibold text-white">{t('store.pricingExplanation.perpetual.heading')}</h5>
          </div>
          <ul className="text-sm text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-amber-400">✓</span>
              <span>
                <strong>{t('store.pricingExplanation.perpetual.item1.label')}</strong>{' '}
                {t('store.pricingExplanation.perpetual.item1.value')}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">✓</span>
              <span>
                <strong>{t('store.pricingExplanation.perpetual.item2.label')}</strong>{' '}
                {t('store.pricingExplanation.perpetual.item2.value')}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">✓</span>
              <span>
                <strong>{t('store.pricingExplanation.perpetual.item3.label')}</strong>{' '}
                {t('store.pricingExplanation.perpetual.item3.value')}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">✓</span>
              <span>
                <strong>{t('store.pricingExplanation.perpetual.item4.label')}</strong>{' '}
                {t('store.pricingExplanation.perpetual.item4.value')}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
        <p className="text-xs text-blue-300">
          <strong>{t('store.pricingExplanation.fiscalNote.label')}</strong>{' '}
          {t('store.pricingExplanation.fiscalNote.text')}
        </p>
      </div>
    </motion.div>
  );
};

export default PricingExplanation;
