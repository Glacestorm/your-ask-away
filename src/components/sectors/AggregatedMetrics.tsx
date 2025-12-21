import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Award, Clock, Building2, CheckCircle } from 'lucide-react';

interface AggregatedMetricsProps {
  totalClients?: number;
  totalSavings?: string;
  satisfaction?: number;
  avgImplementation?: string;
}

export const AggregatedMetrics: React.FC<AggregatedMetricsProps> = ({
  totalClients = 500,
  totalSavings = '€2.3M',
  satisfaction = 98,
  avgImplementation = '4 sem'
}) => {
  const metrics = [
    {
      icon: Users,
      value: `+${totalClients}`,
      label: 'Empresas confían en nosotros',
      color: '#3B82F6'
    },
    {
      icon: TrendingUp,
      value: totalSavings,
      label: 'Ahorro generado',
      color: '#10B981'
    },
    {
      icon: Award,
      value: `${satisfaction}%`,
      label: 'Satisfacción clientes',
      color: '#F59E0B'
    },
    {
      icon: Clock,
      value: avgImplementation,
      label: 'Implementación media',
      color: '#8B5CF6'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="relative group"
        >
          <div className="text-center p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all duration-300">
            {/* Icon */}
            <div 
              className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${metric.color}20` }}
            >
              <metric.icon 
                className="w-6 h-6"
                style={{ color: metric.color }}
              />
            </div>
            
            {/* Value */}
            <p 
              className="text-3xl md:text-4xl font-bold mb-2"
              style={{ color: metric.color }}
            >
              {metric.value}
            </p>
            
            {/* Label */}
            <p className="text-sm text-slate-400">
              {metric.label}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default AggregatedMetrics;
