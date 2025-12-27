import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import ModuleCard from './ModuleCard';

interface Module {
  id: string;
  module_key: string;
  module_name: string;
  description: string | null;
  module_icon: string | null;
  base_price: number | null;
  category: string;
  is_core: boolean | null;
  features: any;
}

const FeaturedModules: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchModules = async () => {
      const { data, error } = await supabase
        .from('app_modules')
        .select('*')
        .in('category', ['core', 'horizontal'])
        .limit(6);
      
      if (!error && data) {
        setModules(data);
      }
      setLoading(false);
    };

    fetchModules();
  }, []);

  const featuredModules = modules.length > 0 ? modules : [
    {
      id: '1',
      module_key: 'core',
      module_name: 'Core Sistema',
      description: t('landing.modules.coreDesc'),
      module_icon: 'Building2',
      base_price: null,
      category: 'core',
      is_core: true,
      features: [
        t('landing.modules.features.companyManagement'),
        t('landing.modules.features.contacts'),
        t('landing.modules.features.pipeline'),
        t('landing.modules.features.reports'),
      ],
    },
    {
      id: '2',
      module_key: 'visits',
      module_name: t('landing.modules.visitsName'),
      description: t('landing.modules.visitsDesc'),
      module_icon: 'MapPin',
      base_price: null,
      category: 'horizontal',
      is_core: false,
      features: [
        t('landing.modules.features.calendar'),
        t('landing.modules.features.routes'),
        t('landing.modules.features.checkInOut'),
        t('landing.modules.features.reports'),
      ],
    },
    {
      id: '3',
      module_key: 'accounting',
      module_name: t('landing.modules.accountingName'),
      description: t('landing.modules.accountingDesc'),
      module_icon: 'Calculator',
      base_price: null,
      category: 'horizontal',
      is_core: false,
      features: [
        t('landing.modules.features.balance'),
        t('landing.modules.features.profitLoss'),
        t('landing.modules.features.cashFlow'),
        t('landing.modules.features.ratios'),
      ],
    },
    {
      id: '4',
      module_key: 'goals',
      module_name: t('landing.modules.goalsName'),
      description: t('landing.modules.goalsDesc'),
      module_icon: 'Target',
      base_price: null,
      category: 'horizontal',
      is_core: false,
      features: [
        t('landing.modules.features.kpis'),
        t('landing.modules.features.dashboards'),
        t('landing.modules.features.alerts'),
        t('landing.modules.features.gamification'),
      ],
    },
    {
      id: '5',
      module_key: 'documentation',
      module_name: t('landing.modules.docsName'),
      description: t('landing.modules.docsDesc'),
      module_icon: 'FileText',
      base_price: null,
      category: 'horizontal',
      is_core: false,
      features: [
        t('landing.modules.features.versioning'),
        t('landing.modules.features.templates'),
        t('landing.modules.features.digitalSignature'),
        t('landing.modules.features.ocr'),
      ],
    },
    {
      id: '6',
      module_key: 'notifications',
      module_name: t('landing.modules.notificationsName'),
      description: t('landing.modules.notificationsDesc'),
      module_icon: 'Bell',
      base_price: null,
      category: 'horizontal',
      is_core: false,
      features: [
        t('landing.modules.features.email'),
        t('landing.modules.features.push'),
        t('landing.modules.features.sms'),
        t('landing.modules.features.inApp'),
      ],
    },
  ];

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30">
            <Zap className="w-3 h-3 mr-1" />
            {t('landing.modules.badge')}
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('landing.modules.title')}
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            {t('landing.modules.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {featuredModules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <ModuleCard module={module} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link to="/store/modules">
            <Button 
              size="lg"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800/50"
            >
              {t('landing.modules.viewAll')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedModules;
