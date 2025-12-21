import React from 'react';
import { motion } from 'framer-motion';
import { Building2, TrendingUp, Quote, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface CaseStudyMetric {
  label: string;
  value: string;
  period?: string;
}

interface CaseStudy {
  company: string;
  result: string;
  testimonial?: string;
  logo_url?: string | null;
  contact_name?: string;
  contact_role?: string;
  industry?: string;
  metrics?: CaseStudyMetric[];
  implementation_time?: string;
}

interface CaseStudyCardProps {
  caseStudy: CaseStudy;
  sectorName?: string;
  sectorSlug?: string;
  gradientColor?: string;
  index?: number;
  variant?: 'default' | 'compact' | 'featured';
}

export const CaseStudyCard: React.FC<CaseStudyCardProps> = ({ 
  caseStudy, 
  sectorName,
  sectorSlug,
  gradientColor = '#3B82F6',
  index = 0,
  variant = 'default'
}) => {
  // Extract numeric value from result for display
  const numericMatch = caseStudy.result.match(/(\d+)/);
  const numericValue = numericMatch ? numericMatch[1] : '';
  const resultText = caseStudy.result.replace(/\d+/, '').trim();

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="group relative rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-all duration-300"
      >
        <div className="flex items-start gap-4">
          {/* Logo */}
          {caseStudy.logo_url ? (
            <img 
              src={caseStudy.logo_url} 
              alt={caseStudy.company}
              className="w-12 h-12 rounded-lg object-contain bg-white p-1.5"
            />
          ) : (
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${gradientColor}20` }}
            >
              <Building2 className="w-6 h-6" style={{ color: gradientColor }} />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{caseStudy.company}</p>
            {sectorName && (
              <p className="text-xs text-slate-500">{sectorName}</p>
            )}
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: gradientColor }} />
              <span className="text-sm font-bold" style={{ color: gradientColor }}>
                {numericValue}
              </span>
              <span className="text-xs text-slate-400">{resultText}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'featured') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${gradientColor}15 0%, transparent 50%)`
        }}
      >
        <div className="border border-slate-800 rounded-2xl p-8">
          {/* Quote icon */}
          <Quote 
            className="w-10 h-10 mb-6 opacity-30" 
            style={{ color: gradientColor }}
          />

          {/* Testimonial */}
          {caseStudy.testimonial && (
            <p className="text-lg text-slate-300 italic mb-6 leading-relaxed">
              "{caseStudy.testimonial}"
            </p>
          )}

          {/* Author */}
          <div className="flex items-center gap-4 mb-6">
            {caseStudy.logo_url ? (
              <img 
                src={caseStudy.logo_url} 
                alt={caseStudy.company}
                className="w-14 h-14 rounded-xl object-contain bg-white p-2"
              />
            ) : (
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${gradientColor}20` }}
              >
                <Building2 className="w-7 h-7" style={{ color: gradientColor }} />
              </div>
            )}
            <div>
              <p className="text-white font-semibold">{caseStudy.company}</p>
              {caseStudy.contact_name && (
                <p className="text-sm text-slate-400">
                  {caseStudy.contact_name}
                  {caseStudy.contact_role && `, ${caseStudy.contact_role}`}
                </p>
              )}
              {sectorName && (
                <Badge 
                  variant="outline" 
                  className="mt-1 text-xs border-slate-700 text-slate-400"
                >
                  {sectorName}
                </Badge>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-800/50 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: gradientColor }}>
                {numericValue}%
              </p>
              <p className="text-xs text-slate-400">Mejora</p>
            </div>
            {caseStudy.metrics?.slice(0, 2).map((metric, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-bold text-white">{metric.value}</p>
                <p className="text-xs text-slate-400">{metric.label}</p>
              </div>
            ))}
            {!caseStudy.metrics && (
              <>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {caseStudy.implementation_time || '4 sem'}
                  </p>
                  <p className="text-xs text-slate-400">Implementación</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">100%</p>
                  <p className="text-xs text-slate-400">Satisfacción</p>
                </div>
              </>
            )}
          </div>

          {/* CTA */}
          {sectorSlug && (
            <Link to={`/casos-de-exito/${sectorSlug}`}>
              <Button 
                variant="outline" 
                className="w-full border-slate-700 text-white hover:bg-slate-800"
              >
                Ver caso completo
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group relative rounded-2xl border border-slate-800 bg-slate-900/80 p-6 hover:border-slate-700 hover:shadow-xl transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {caseStudy.logo_url ? (
            <img 
              src={caseStudy.logo_url} 
              alt={caseStudy.company}
              className="w-12 h-12 rounded-xl object-contain bg-white p-2"
            />
          ) : (
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${gradientColor}20` }}
            >
              <Building2 className="w-6 h-6" style={{ color: gradientColor }} />
            </div>
          )}
          <div>
            <p className="text-white font-semibold">{caseStudy.company}</p>
            {caseStudy.industry && (
              <p className="text-xs text-slate-500">{caseStudy.industry}</p>
            )}
          </div>
        </div>
        {sectorName && (
          <Badge 
            variant="outline" 
            className="text-xs border-slate-700 text-slate-400"
          >
            {sectorName}
          </Badge>
        )}
      </div>

      {/* Result highlight */}
      <div 
        className="rounded-xl p-4 mb-4"
        style={{ backgroundColor: `${gradientColor}10` }}
      >
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4" style={{ color: gradientColor }} />
          <span className="text-xs text-slate-400">Resultado principal</span>
        </div>
        <p className="text-xl font-bold text-white">{caseStudy.result}</p>
      </div>

      {/* Testimonial preview */}
      {caseStudy.testimonial && (
        <div className="relative mb-4">
          <Quote 
            className="absolute -left-1 -top-1 w-4 h-4 opacity-30" 
            style={{ color: gradientColor }}
          />
          <p className="text-sm text-slate-400 italic pl-4 line-clamp-3">
            "{caseStudy.testimonial}"
          </p>
          {caseStudy.contact_name && (
            <p className="text-xs text-slate-500 mt-2 pl-4">
              — {caseStudy.contact_name}
              {caseStudy.contact_role && `, ${caseStudy.contact_role}`}
            </p>
          )}
        </div>
      )}

      {/* Metrics row */}
      {caseStudy.metrics && caseStudy.metrics.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {caseStudy.metrics.slice(0, 3).map((metric, i) => (
            <div key={i} className="text-center p-2 bg-slate-800/50 rounded-lg">
              <p className="text-sm font-bold text-white">{metric.value}</p>
              <p className="text-xs text-slate-500">{metric.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <Link to={sectorSlug ? `/casos-de-exito/${sectorSlug}` : '/casos-de-exito'}>
        <Button 
          variant="ghost" 
          className="w-full text-slate-400 hover:text-white hover:bg-slate-800 group-hover:text-primary"
        >
          Ver caso completo
          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
      </Link>
    </motion.div>
  );
};

export default CaseStudyCard;
