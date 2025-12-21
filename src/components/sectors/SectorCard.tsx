import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, HardHat, Stethoscope, Factory, Truck, 
  GraduationCap, Landmark, Utensils, Building2, ArrowRight,
  Sparkles, CheckCircle2, Play, FileText, Cpu, Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sector, SectorFeature, SectorAICapability } from '@/hooks/useSectors';
import SectorStatsCounter from './SectorStatsCounter';
import { CertificationBadge } from './CertificationBadge';
import { CaseStudyPreview } from './CaseStudyPreview';
import { Link } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  sector: Sector & { 
    certifications?: Array<{ name: string; icon: string; description: string }>;
    pricing_tier?: string;
  };
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
  const gradientColor = sector.gradient_from || '#3B82F6';

  // Default certifications if none provided
  const certifications = sector.certifications || [
    { name: 'ISO 27001', icon: 'Shield', description: 'Seguridad de la información' },
    { name: 'GDPR', icon: 'Lock', description: 'Protección de datos EU' },
  ];

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
            ? `linear-gradient(135deg, ${gradientColor}10 0%, ${sector.gradient_to}10 100%)` 
            : undefined
        }}
      >
        {/* Animated gradient border on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${gradientColor}15 0%, ${sector.gradient_to}15 100%)`,
          }}
        />

        {/* Gradient overlay on hover */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, ${gradientColor}08 0%, ${sector.gradient_to}08 100%)`
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
          {/* Icon with scale animation */}
          <motion.div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.3 }}
            style={{
              background: `linear-gradient(135deg, ${gradientColor}30 0%, ${sector.gradient_to}30 100%)`
            }}
          >
            <Icon 
              className="w-8 h-8 transition-colors duration-300" 
              style={{ color: gradientColor }}
            />
          </motion.div>

          {/* Title & Description */}
          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary transition-colors">
            {sector.name}
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            {sector.short_description}
          </p>

          {/* Certifications - visible on hover */}
          <AnimatePresence>
            {isHovered && certifications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-4 overflow-hidden"
              >
                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Certificaciones
                </p>
                <div className="flex flex-wrap gap-2">
                  {certifications.map((cert, i) => (
                    <CertificationBadge
                      key={cert.name}
                      certification={cert}
                      index={i}
                      gradientColor={gradientColor}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          {sector.stats.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4 py-4 border-y border-slate-800">
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
                className="mb-4 overflow-hidden"
              >
                <div className="space-y-2">
                  {sector.features.slice(0, 4).map((feature: SectorFeature, i: number) => (
                    <motion.div 
                      key={i} 
                      className="flex items-start gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <CheckCircle2 
                        className="w-4 h-4 mt-0.5 flex-shrink-0" 
                        style={{ color: gradientColor }}
                      />
                      <div>
                        <span className="text-sm text-white font-medium">{feature.title}</span>
                        <span className="text-xs text-slate-500 block">{feature.description}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Capabilities - enhanced on hover */}
          {sector.ai_capabilities.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-400">
                  {sector.ai_capabilities.length} capacidades IA
                </span>
              </div>
              
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1.5 pl-6">
                      {sector.ai_capabilities.slice(0, 3).map((capability: SectorAICapability, i: number) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="flex items-center gap-2"
                        >
                          <Cpu className="w-3 h-3 text-amber-400/70" />
                          <span className="text-xs text-slate-400">{capability.name}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Regulations with tooltips */}
          {sector.regulations.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              <TooltipProvider delayDuration={200}>
                {sector.regulations.slice(0, 3).map((reg, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-slate-800/50 text-slate-400 border-slate-700 cursor-help hover:border-slate-600 transition-colors"
                      >
                        {reg.code}
                        <Info className="w-2.5 h-2.5 ml-1 opacity-50" />
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="top" 
                      className="bg-slate-800 border-slate-700 text-white max-w-xs"
                    >
                      <p className="font-medium text-sm">{reg.code}</p>
                      <p className="text-xs text-slate-400">{reg.name || 'Normativa aplicable al sector'}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {sector.regulations.length > 3 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-slate-800/50 text-slate-400 border-slate-700 cursor-help"
                      >
                        +{sector.regulations.length - 3}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="top" 
                      className="bg-slate-800 border-slate-700 text-white"
                    >
                      <p className="text-xs">
                        {sector.regulations.slice(3).map(r => r.code).join(', ')}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          )}

          {/* Modules preview on hover */}
          <AnimatePresence>
            {isHovered && sector.modules_recommended && sector.modules_recommended.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-4 overflow-hidden"
              >
                <p className="text-xs text-slate-500 mb-2">Módulos recomendados</p>
                <div className="flex flex-wrap gap-1">
                  {sector.modules_recommended.slice(0, 4).map((module: string, i: number) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="text-xs px-2 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700"
                    >
                      {module}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA Buttons */}
          <div className="flex gap-2">
            <Link to={sector.landing_page_url || `/sectors/${sector.slug}`} className="flex-1">
              <Button 
                variant="outline" 
                className="w-full h-10 text-sm bg-slate-900/60 border-slate-700 text-white hover:text-white hover:bg-slate-800 transition-all group-hover:border-primary/50"
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

        {/* Case Study Preview on hover - enhanced */}
        <AnimatePresence>
          {isHovered && sector.case_studies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="px-6 pb-6"
            >
              <p className="text-xs text-slate-500 mb-2">Caso de éxito destacado</p>
              <CaseStudyPreview 
                caseStudy={sector.case_studies[0]}
                gradientColor={gradientColor}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SectorCard;
