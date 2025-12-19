import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, LucideIcon } from 'lucide-react';

interface SectorCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  delay?: number;
}

export const SectorCard: React.FC<SectorCardProps> = ({
  icon: Icon,
  title,
  description,
  features,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4 hover:border-emerald-500/50 transition-all"
    >
      <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
        <Icon className="w-6 h-6 text-emerald-400" />
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
      <ul className="space-y-2">
        {features.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

export default SectorCard;
