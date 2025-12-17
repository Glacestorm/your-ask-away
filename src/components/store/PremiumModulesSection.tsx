import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, Shield, Brain, BarChart3, Lock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ModuleCard from './ModuleCard';

const PremiumModulesSection: React.FC = () => {
  const premiumModules = [
    {
      id: 'p1',
      module_key: 'banking_ai',
      module_name: 'IA Bancaria Avanzada',
      description: 'Machine Learning para scoring crediticio, detección de fraude y predicción de riesgo con modelos IFRS 9',
      module_icon: 'Brain',
      base_price: 149000,
      category: 'enterprise',
      is_core: false,
      features: ['ML Predictivo', 'Scoring Crediticio', 'Detección Fraude', 'IFRS 9 Compliant'],
    },
    {
      id: 'p2',
      module_key: 'compliance_pro',
      module_name: 'Compliance Bancario Pro',
      description: 'Suite completa de cumplimiento normativo: DORA, NIS2, PSD2, Basel III/IV, MiFID II',
      module_icon: 'Shield',
      base_price: 119000,
      category: 'enterprise',
      is_core: false,
      features: ['DORA/NIS2', 'PSD2/PSD3', 'Basel III/IV', 'MiFID II'],
    },
    {
      id: 'p3',
      module_key: 'open_banking',
      module_name: 'Open Banking API',
      description: 'Integración PSD2/PSD3 con APIs bancarias, consentimientos y agregación de cuentas',
      module_icon: 'Lock',
      base_price: 79000,
      category: 'enterprise',
      is_core: false,
      features: ['APIs FAPI', 'Gestión Consentimientos', 'TPP Integration', 'SCA Compliant'],
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/30 via-slate-900 to-amber-950/20" />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-400/10 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30"
            >
              <Crown className="w-8 h-8 text-white" />
            </motion.div>
          </div>

          <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-amber-400/20 text-amber-300 border-amber-500/30">
            <Sparkles className="w-4 h-4 mr-2" />
            SOLUCIONES ENTERPRISE
          </Badge>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Módulos{' '}
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
              Premium
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Tecnología de vanguardia para organizaciones que exigen lo máximo en seguridad y rendimiento
          </p>
        </motion.div>

        {/* Premium Features Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-6 mb-12"
        >
          {[
            { icon: Shield, label: 'Soporte Prioritario 24/7' },
            { icon: Zap, label: 'Onboarding Personalizado' },
            { icon: BarChart3, label: 'SLA 99.99% Garantizado' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-full border border-amber-500/30">
              <item.icon className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-200">{item.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Premium Modules Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {premiumModules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
            >
              <ModuleCard module={module} isPremium />
            </motion.div>
          ))}
        </div>

        {/* Enterprise CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-col items-center p-8 bg-gradient-to-br from-amber-500/10 to-amber-400/5 rounded-2xl border border-amber-500/30">
            <p className="text-lg text-amber-200 mb-2">¿Necesitas una solución personalizada?</p>
            <p className="text-3xl font-bold text-white mb-4">Pack Enterprise Completo</p>
            <div className="flex items-center gap-4 text-slate-300">
              <span className="line-through text-slate-500">€1.200.000</span>
              <span className="text-4xl font-bold text-amber-400">€880.000</span>
              <Badge className="bg-red-500/20 text-red-300 border-red-500/30">-27%</Badge>
            </div>
            <p className="text-sm text-slate-400 mt-2">Licencia perpetua • Todos los módulos incluidos</p>
            <p className="text-[10px] text-slate-500 mt-1">SIN IVA • Pago único</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PremiumModulesSection;
