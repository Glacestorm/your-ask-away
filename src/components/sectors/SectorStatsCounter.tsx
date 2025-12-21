import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface SectorStatsCounterProps {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export const SectorStatsCounter: React.FC<SectorStatsCounterProps> = ({
  value,
  label,
  prefix = '',
  suffix = '',
  duration = 2,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!isInView) return;

    const startTime = Date.now();
    const endValue = value;
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setDisplayValue(Math.round(easeOut * endValue * 10) / 10);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  const formatValue = (val: number): string => {
    if (Number.isInteger(value)) {
      return Math.round(val).toString();
    }
    return val.toFixed(1);
  };

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="text-2xl md:text-3xl font-bold text-white">
        {prefix}{formatValue(displayValue)}{suffix}
      </div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </motion.div>
  );
};

export default SectorStatsCounter;
