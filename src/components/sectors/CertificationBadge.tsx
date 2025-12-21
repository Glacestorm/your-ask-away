import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, FileCheck, Award, CheckCircle, BadgeCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const iconMap: Record<string, React.ElementType> = {
  Shield,
  Lock,
  FileCheck,
  Award,
  CheckCircle,
  BadgeCheck,
};

interface Certification {
  name: string;
  icon: string;
  description: string;
}

interface CertificationBadgeProps {
  certification: Certification;
  index: number;
  gradientColor?: string;
}

export const CertificationBadge: React.FC<CertificationBadgeProps> = ({ 
  certification, 
  index,
  gradientColor = '#3B82F6'
}) => {
  const Icon = iconMap[certification.icon] || Shield;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="relative group/badge cursor-pointer"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              <motion.div
                className="absolute inset-0 -translate-x-full"
                animate={{ translateX: ['100%', '-100%'] }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  repeatDelay: 3,
                  ease: 'linear'
                }}
                style={{
                  background: `linear-gradient(90deg, transparent, ${gradientColor}20, transparent)`
                }}
              />
            </div>
            
            <div 
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-300 group-hover/badge:scale-105"
              style={{
                backgroundColor: `${gradientColor}10`,
                borderColor: `${gradientColor}30`
              }}
            >
              <Icon 
                className="w-3.5 h-3.5" 
                style={{ color: gradientColor }}
              />
              <span 
                className="text-xs font-medium"
                style={{ color: gradientColor }}
              >
                {certification.name}
              </span>
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="bg-slate-800 border-slate-700 text-white max-w-xs"
        >
          <div className="flex items-start gap-2">
            <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: gradientColor }} />
            <div>
              <p className="font-medium text-sm">{certification.name}</p>
              <p className="text-xs text-slate-400">{certification.description}</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CertificationBadge;
