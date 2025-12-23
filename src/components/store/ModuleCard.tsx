import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Star, Check, Crown, Building2, MapPin, 
  Calculator, Target, FileText, Bell, Shield, Brain,
  BarChart3, Users, Globe, Lock, Zap, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCMSTranslation } from '@/hooks/cms/useCMSTranslation';

interface ModuleCardProps {
  module: {
    id: string;
    module_key: string;
    module_name: string;
    description: string | null;
    module_icon: string | null;
    base_price: number | null;
    category: string;
    is_core: boolean | null;
    features?: any;
  };
  isPremium?: boolean;
  showFullDetails?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  Building2, MapPin, Calculator, Target, FileText, Bell, Shield, Brain,
  BarChart3, Users, Globe, Lock, Zap, Database, Crown, Star, Check
};

const ModuleCard: React.FC<ModuleCardProps> = ({ module, isPremium = false, showFullDetails = false }) => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { translateAsync } = useCMSTranslation('store');

  const IconComponent = iconMap[module.module_icon || 'Building2'] || Building2;

  const defaultFeatures = [t('store.fullFunctionality'), t('store.supportIncluded'), t('store.updates')];
  const rawFeatures: string[] = Array.isArray(module.features) 
    ? module.features 
    : (typeof module.features === 'object' && module.features?.list) 
      ? module.features.list 
      : [];

  const [translatedFeatures, setTranslatedFeatures] = useState<string[] | null>(null);
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null);
  const [translatedName, setTranslatedName] = useState<string | null>(null);
  const [translatedCategory, setTranslatedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (language === 'es') {
      setTranslatedFeatures(null);
      setTranslatedDescription(null);
      setTranslatedName(null);
      setTranslatedCategory(null);
      return;
    }

    let cancelled = false;

    const featuresToTranslate = rawFeatures.slice(0, showFullDetails ? rawFeatures.length : 4);

    (async () => {
      try {
        const [featuresArr, desc, name, category] = await Promise.all([
          featuresToTranslate.length > 0
            ? Promise.all(featuresToTranslate.map((f) => translateAsync(f, language, 'es')))
            : Promise.resolve([]),
          module.description ? translateAsync(module.description, language, 'es') : Promise.resolve(null),
          translateAsync(module.module_name, language, 'es'),
          translateAsync(module.category, language, 'es'),
        ]);

        if (!cancelled) {
          setTranslatedFeatures(featuresArr.length > 0 ? featuresArr : null);
          setTranslatedDescription(desc);
          setTranslatedName(name);
          setTranslatedCategory(category);
        }
      } catch (e) {
        // Never break UI if translation is unavailable
        if (!cancelled) {
          setTranslatedFeatures(null);
          setTranslatedDescription(null);
          setTranslatedName(null);
          setTranslatedCategory(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [language, module.module_name, module.description, module.category, showFullDetails, translateAsync, rawFeatures.join(',')]);

  const features = translatedFeatures ?? (rawFeatures.length > 0 ? rawFeatures : defaultFeatures);
  const displayName = translatedName ?? module.module_name;
  const displayDescription = translatedDescription ?? module.description;
  const displayCategory = translatedCategory ?? module.category;

  const handleRequestQuote = () => {
    // Scroll to contact section or open quote request modal
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      toast({
        title: t('store.requestQuote'),
        description: t('store.contactTeamForPrice').replace('{name}', displayName),
      });
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`group relative bg-slate-800/50 backdrop-blur border rounded-2xl overflow-hidden transition-all duration-300 ${
        isPremium 
          ? 'border-amber-500/50 hover:border-amber-400/70 hover:shadow-lg hover:shadow-amber-500/20' 
          : 'border-slate-700/50 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10'
      }`}
    >
      {/* Premium Badge */}
      {isPremium && (
        <div className="absolute top-0 right-0">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-4 py-1 rounded-bl-xl flex items-center gap-1">
            <Crown className="w-3 h-3" />
            {t('store.badge.premium')}
          </div>
        </div>
      )}

      {/* Core Badge */}
      {module.is_core && (
        <div className="absolute top-3 right-3">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
            {t('store.badge.core')}
          </Badge>
        </div>
      )}

      <div className="p-6">
        {/* Icon & Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
            isPremium 
              ? 'bg-gradient-to-br from-amber-500 to-amber-600' 
              : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
          }`}>
            <IconComponent className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">{displayName}</h3>
            <p className="text-sm text-slate-400 capitalize">{displayCategory}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
          {displayDescription || t('store.completeEnterpriseModule')}
        </p>

        {/* Features */}
        <div className="space-y-2 mb-6">
          {features.slice(0, 4).map((feature: string, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
              <Check className={`w-4 h-4 ${isPremium ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Actions - Sin precios públicos */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
          <div>
            <div className="text-lg font-semibold text-slate-300">{t('store.customPrice')}</div>
            <div className="text-xs text-slate-500">{t('store.requestQuote')}</div>
          </div>
          
          <div className="flex gap-2">
            <Link to={`/store/modules/${module.module_key}`}>
              <Button 
                size="sm"
                className="bg-gradient-to-b from-slate-600 to-slate-700 text-white border border-slate-500 shadow-[0_4px_0_0_rgba(30,41,59,1),0_6px_10px_rgba(0,0,0,0.3)] hover:shadow-[0_2px_0_0_rgba(30,41,59,1),0_4px_6px_rgba(0,0,0,0.3)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all duration-150"
              >
                {t('store.details')}
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={handleRequestQuote}
              className={isPremium 
                ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-white border border-amber-400 shadow-[0_4px_0_0_rgba(180,83,9,1),0_6px_10px_rgba(0,0,0,0.3)] hover:shadow-[0_2px_0_0_rgba(180,83,9,1),0_4px_6px_rgba(0,0,0,0.3)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all duration-150'
                : 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white border border-emerald-400 shadow-[0_4px_0_0_rgba(4,120,87,1),0_6px_10px_rgba(0,0,0,0.3)] hover:shadow-[0_2px_0_0_rgba(4,120,87,1),0_4px_6px_rgba(0,0,0,0.3)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all duration-150'
              }
            >
              {t('store.requestPrice')}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ModuleCard;
