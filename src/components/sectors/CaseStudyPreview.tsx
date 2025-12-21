import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, TrendingUp, Quote } from 'lucide-react';

interface CaseStudy {
  company: string;
  result: string;
  testimonial?: string;
  logo_url?: string;
  contact_name?: string;
  contact_role?: string;
}

interface CaseStudyPreviewProps {
  caseStudy: CaseStudy;
  gradientColor?: string;
}

export const CaseStudyPreview: React.FC<CaseStudyPreviewProps> = ({ 
  caseStudy, 
  gradientColor = '#3B82F6' 
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  // Extract numeric value from result for animation
  const numericMatch = caseStudy.result.match(/(\d+)/);
  const targetValue = numericMatch ? parseInt(numericMatch[1]) : 0;
  const suffix = caseStudy.result.replace(/\d+/, '').trim();

  useEffect(() => {
    if (targetValue === 0) return;
    
    const duration = 1000;
    const steps = 30;
    const increment = targetValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetValue) {
        setDisplayValue(targetValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [targetValue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl p-4 border"
      style={{
        backgroundColor: `${gradientColor}08`,
        borderColor: `${gradientColor}20`
      }}
    >
      {/* Header with company */}
      <div className="flex items-center gap-3 mb-3">
        {caseStudy.logo_url ? (
          <img 
            src={caseStudy.logo_url} 
            alt={caseStudy.company}
            className="w-10 h-10 rounded-lg object-contain bg-white p-1"
          />
        ) : (
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${gradientColor}20` }}
          >
            <Building2 className="w-5 h-5" style={{ color: gradientColor }} />
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-white">{caseStudy.company}</p>
          {caseStudy.contact_name && (
            <p className="text-xs text-slate-500">
              {caseStudy.contact_name}{caseStudy.contact_role ? `, ${caseStudy.contact_role}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* Animated metric */}
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4" style={{ color: gradientColor }} />
        <div className="flex items-baseline gap-1">
          <motion.span 
            className="text-2xl font-bold"
            style={{ color: gradientColor }}
          >
            {displayValue}
          </motion.span>
          <span className="text-sm text-slate-400">{suffix}</span>
        </div>
      </div>

      {/* Testimonial */}
      {caseStudy.testimonial && (
        <div className="relative">
          <Quote 
            className="absolute -left-1 -top-1 w-4 h-4 opacity-30" 
            style={{ color: gradientColor }}
          />
          <p className="text-xs text-slate-400 italic pl-4 line-clamp-2">
            "{caseStudy.testimonial}"
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default CaseStudyPreview;
