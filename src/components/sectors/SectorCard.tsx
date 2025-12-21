import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, HardHat, Stethoscope, Factory, Truck, 
  GraduationCap, Landmark, Utensils, Building2, ArrowRight,
  Sparkles, CheckCircle2, Play
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sector, SectorFeature, SectorAICapability } from '@/hooks/useSectors';
import SectorStatsCounter from './SectorStatsCounter';
import { Link } from 'react-router-dom';

const iconMap: Record<string, React.ElementType> = {
  ShoppingCart,
  HardHat,
  Stethoscope,
  Factory,
  Truck,
  GraduationCap,
  Landmark,
  Utensils,
  Building2,
};

interface SectorCardProps {
  sector: Sector;
  index: number;
}

export const SectorCard: React.FC<SectorCardProps> = ({ sector, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = iconMap[sector.icon_name || 'Building2'] || Building2;

  const statusConfig = {
    available: { label: 'Disponible', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    coming_soon: { label: 'Próximamente', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    new: { label: 'Nuevo', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    beta: { label: 'Beta', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  };

  const status = statusConfig[sector.availability_status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative h-full"
    >
      <div 
        className="relative h-full rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-slate-600 hover:shadow-2xl hover:shadow-primary/10"
        style={{
          background: isHovered 
            ? `linear-gradient(135deg, ${sector.gradient_from}10 0%, ${sector.gradient_to}10 100%)` 
            : undefined
        }}
      >
        {/* Gradient overlay on hover */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, ${sector.gradient_from}08 0%, ${sector.gradient_to}08 100%)`
          }}
        />

        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="outline" className={`${status.color} border text-xs font-medium`}>
            {status.label}
          </Badge>
        </div>

        {/* Main content */}
        <div className="relative p-6">
          {/* Icon */}
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${sector.gradient_from}30 0%, ${sector.gradient_to}30 100%)`
            }}
          >
            <Icon 
              className="w-8 h-8 transition-colors duration-300" 
              style={{ color: sector.gradient_from || '#3B82F6' }}
            />
          </div>

          {/* Title & Description */}
          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary transition-colors">
            {sector.name}
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            {sector.short_description}
          </p>

          {/* Stats */}
          {sector.stats.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-6 py-4 border-y border-slate-800">
              {sector.stats.slice(0, 3).map((stat, i) => (
                <SectorStatsCounter
                  key={i}
                  value={stat.value}
                  label={stat.label}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                />
              ))}
            </div>
          )}

          {/* Features - visible on hover */}
          <AnimatePresence>
            {isHovered && sector.features.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6 overflow-hidden"
              >
                <div className="space-y-2">
                  {sector.features.slice(0, 4).map((feature: SectorFeature, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 
                        className="w-4 h-4 mt-0.5 flex-shrink-0" 
                        style={{ color: sector.gradient_from || '#3B82F6' }}
                      />
                      <div>
                        <span className="text-sm text-white font-medium">{feature.title}</span>
                        <span className="text-xs text-slate-500 block">{feature.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Capabilities badge */}
          {sector.ai_capabilities.length > 0 && (
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400">
                {sector.ai_capabilities.length} capacidades IA
              </span>
            </div>
          )}

          {/* Regulations */}
          {sector.regulations.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-6">
              {sector.regulations.slice(0, 3).map((reg, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className="text-xs bg-slate-800/50 text-slate-400 border-slate-700"
                >
                  {reg.code}
                </Badge>
              ))}
              {sector.regulations.length > 3 && (
                <Badge 
                  variant="outline" 
                  className="text-xs bg-slate-800/50 text-slate-400 border-slate-700"
                >
                  +{sector.regulations.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex gap-2">
            <Link to={sector.landing_page_url || `/sectors/${sector.slug}`} className="flex-1">
              <Button 
                variant="outline" 
                className="w-full h-10 text-sm border-slate-700 text-white hover:bg-slate-800 transition-all group-hover:border-primary/50"
              >
                Ver más
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            {sector.demo_video_url && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-slate-400 hover:text-primary hover:bg-primary/10"
                onClick={() => window.open(sector.demo_video_url!, '_blank')}
              >
                <Play className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Case Study Preview on hover */}
        <AnimatePresence>
          {isHovered && sector.case_studies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent"
            >
              <div className="text-xs text-slate-500 mb-1">Caso de éxito</div>
              <div className="text-sm text-white font-medium">
                {sector.case_studies[0].company}
              </div>
              <div 
                className="text-xs font-semibold"
                style={{ color: sector.gradient_from || '#3B82F6' }}
              >
                {sector.case_studies[0].result}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SectorCard;
