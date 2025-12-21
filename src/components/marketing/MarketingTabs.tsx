import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, ShieldCheck, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';
import { ComparisonTable } from './ComparisonTable';
import { SecurityBadges } from './SecurityBadges';
import { DemoRequestForm } from './DemoRequestForm';

export const MarketingTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('comparativas');
  const { trackTabView } = useMarketingAnalytics();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    trackTabView(value);
  };

  return (
    <section id="marketing" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            DIFERENCIACIÓN COMPETITIVA
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Por qué elegir Obelixia
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Compara nuestras soluciones, conoce nuestros estándares de seguridad 
            y solicita una demostración personalizada.
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-slate-700 rounded-xl p-1 h-auto max-w-2xl mx-auto">
            <TabsTrigger 
              value="comparativas" 
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white py-3 rounded-lg"
            >
              <GitCompare className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Comparativas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="seguridad" 
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white py-3 rounded-lg"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Seguridad</span>
            </TabsTrigger>
            <TabsTrigger 
              value="demo" 
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white py-3 rounded-lg"
            >
              <Play className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Demo</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comparativas">
            <ComparisonTable />
          </TabsContent>

          <TabsContent value="seguridad">
            <SecurityBadges />
          </TabsContent>

          <TabsContent value="demo">
            <DemoRequestForm />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default MarketingTabs;
