import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, X, Plus, Check, Minus, ArrowRight,
  Sparkles, Shield, FileText, Cpu, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sector } from '@/hooks/useSectors';
import { Link } from 'react-router-dom';

interface SectorComparisonProps {
  sectors: Sector[];
  onClose?: () => void;
  maxComparison?: number;
}

export const SectorComparison: React.FC<SectorComparisonProps> = ({ 
  sectors, 
  onClose,
  maxComparison = 3 
}) => {
  const [selectedSectors, setSelectedSectors] = useState<Sector[]>([]);

  const toggleSector = (sector: Sector) => {
    if (selectedSectors.find(s => s.id === sector.id)) {
      setSelectedSectors(selectedSectors.filter(s => s.id !== sector.id));
    } else if (selectedSectors.length < maxComparison) {
      setSelectedSectors([...selectedSectors, sector]);
    }
  };

  const isSelected = (sectorId: string) => selectedSectors.some(s => s.id === sectorId);

  // Get all unique features across selected sectors
  const allFeatures = [...new Set(
    selectedSectors.flatMap(s => s.features.map(f => f.title))
  )];

  // Get all unique AI capabilities
  const allAICapabilities = [...new Set(
    selectedSectors.flatMap(s => s.ai_capabilities.map(c => c.name))
  )];

  // Get all unique regulations
  const allRegulations = [...new Set(
    selectedSectors.flatMap(s => s.regulations.map(r => r.code))
  )];

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Comparar Sectores</h3>
          <p className="text-sm text-slate-400 mt-1">
            Selecciona hasta {maxComparison} sectores para comparar
          </p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Sector selection */}
      <div className="p-4 border-b border-slate-800">
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {sectors.map((sector) => (
              <motion.button
                key={sector.id}
                onClick={() => toggleSector(sector)}
                disabled={!isSelected(sector.id) && selectedSectors.length >= maxComparison}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap ${
                  isSelected(sector.id)
                    ? 'bg-primary/20 border-primary text-primary'
                    : selectedSectors.length >= maxComparison
                    ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSelected(sector.id) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {sector.name}
              </motion.button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Comparison table */}
      <AnimatePresence mode="wait">
        {selectedSectors.length >= 2 ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <ScrollArea className="max-h-[600px]">
              <div className="p-6">
                {/* Headers */}
                <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${selectedSectors.length}, 1fr)` }}>
                  <div />
                  {selectedSectors.map((sector) => (
                    <motion.div
                      key={sector.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center p-4 rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, ${sector.gradient_from}20, ${sector.gradient_to}20)`
                      }}
                    >
                    <h4 className="font-semibold text-white text-lg">{sector.name}</h4>
                      <Badge 
                        variant="outline" 
                        className="mt-2 text-xs"
                        style={{ borderColor: sector.gradient_from, color: sector.gradient_from }}
                      >
                        {(sector as any).pricing_tier || 'professional'}
                      </Badge>
                    </motion.div>
                  ))}
                </div>

                {/* Stats comparison */}
                <div className="mt-6">
                  <h5 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4" /> Métricas Clave
                  </h5>
                  <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${selectedSectors.length}, 1fr)` }}>
                    {['Clientes', 'Ahorro', 'Satisfacción'].map((label, idx) => (
                      <React.Fragment key={label}>
                        <div className="text-sm text-slate-500 py-2">{label}</div>
                        {selectedSectors.map((sector) => {
                          const stat = sector.stats[idx];
                          return (
                            <div key={sector.id} className="text-center py-2">
                              {stat ? (
                                <span className="text-white font-semibold">
                                  {stat.prefix}{stat.value}{stat.suffix}
                                </span>
                              ) : (
                                <Minus className="w-4 h-4 text-slate-600 mx-auto" />
                              )}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Features comparison */}
                {allFeatures.length > 0 && (
                  <div className="mt-8">
                    <h5 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Funcionalidades
                    </h5>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `200px repeat(${selectedSectors.length}, 1fr)` }}>
                      {allFeatures.slice(0, 6).map((feature) => (
                        <React.Fragment key={feature}>
                          <div className="text-sm text-slate-500 py-2 truncate">{feature}</div>
                          {selectedSectors.map((sector) => {
                            const hasFeature = sector.features.some(f => f.title === feature);
                            return (
                              <div key={sector.id} className="text-center py-2">
                                {hasFeature ? (
                                  <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                                ) : (
                                  <Minus className="w-4 h-4 text-slate-600 mx-auto" />
                                )}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Capabilities comparison */}
                {allAICapabilities.length > 0 && (
                  <div className="mt-8">
                    <h5 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Capacidades IA
                    </h5>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `200px repeat(${selectedSectors.length}, 1fr)` }}>
                      {allAICapabilities.slice(0, 5).map((capability) => (
                        <React.Fragment key={capability}>
                          <div className="text-sm text-slate-500 py-2 truncate">{capability}</div>
                          {selectedSectors.map((sector) => {
                            const hasCapability = sector.ai_capabilities.some(c => c.name === capability);
                            return (
                              <div key={sector.id} className="text-center py-2">
                                {hasCapability ? (
                                  <Cpu className="w-5 h-5 text-amber-400 mx-auto" />
                                ) : (
                                  <Minus className="w-4 h-4 text-slate-600 mx-auto" />
                                )}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regulations comparison */}
                {allRegulations.length > 0 && (
                  <div className="mt-8">
                    <h5 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Normativas
                    </h5>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `200px repeat(${selectedSectors.length}, 1fr)` }}>
                      {allRegulations.slice(0, 5).map((regulation) => (
                        <React.Fragment key={regulation}>
                          <div className="text-sm text-slate-500 py-2">{regulation}</div>
                          {selectedSectors.map((sector) => {
                            const hasRegulation = sector.regulations.some(r => r.code === regulation);
                            return (
                              <div key={sector.id} className="text-center py-2">
                                {hasRegulation ? (
                                  <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                                ) : (
                                  <Minus className="w-4 h-4 text-slate-600 mx-auto" />
                                )}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTAs */}
                <div className="mt-8 grid gap-4" style={{ gridTemplateColumns: `200px repeat(${selectedSectors.length}, 1fr)` }}>
                  <div />
                  {selectedSectors.map((sector) => (
                    <Link 
                      key={sector.id} 
                      to={sector.landing_page_url || `/sectors/${sector.slug}`}
                    >
                      <Button 
                        className="w-full rounded-full gap-2"
                        style={{ 
                          background: `linear-gradient(135deg, ${sector.gradient_from}, ${sector.gradient_to})` 
                        }}
                      >
                        Ver {sector.name}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-12 text-center"
          >
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">
              Selecciona al menos 2 sectores para compararlos
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SectorComparison;
