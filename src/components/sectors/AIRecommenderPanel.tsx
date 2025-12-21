import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Search, Loader2, CheckCircle2, AlertCircle, 
  ArrowRight, Cpu, FileText, Package, TrendingUp, Building2,
  ChevronDown, ChevronUp, Info, Star
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface AIRecommenderPanelProps {
  onClose?: () => void;
}

interface SectorRecommendation {
  sector_id: string;
  sector_name: string;
  sector_slug: string;
  compatibility_score: number;
  gradient_from: string;
  gradient_to: string;
  short_description: string;
  features: any[];
  ai_capabilities: any[];
  regulations: { code: string; name?: string; explanation?: string; importance?: string }[];
  modules_recommended: string[];
  case_studies: any[];
}

interface ModuleRecommendation {
  name: string;
  description: string;
  priority: 'core' | 'recommended' | 'optional';
}

interface AIAnalysisResult {
  primary_sector: SectorRecommendation | null;
  alternative_sectors: SectorRecommendation[];
  compatibility_summary: string;
  module_recommendations: ModuleRecommendation[];
  ai_insights: string[];
}

export const AIRecommenderPanel: React.FC<AIRecommenderPanelProps> = ({ onClose }) => {
  const [cnaeInput, setCnaeInput] = useState('');
  const [companySize, setCompanySize] = useState<'startup' | 'pyme' | 'gran_empresa'>('pyme');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('insights');

  const handleAnalyze = async () => {
    if (!cnaeInput || cnaeInput.length < 2) {
      setError('Introduce al menos los 2 primeros dígitos del código CNAE');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-cnae-recommender', {
        body: {
          cnae_code: cnaeInput,
          company_size: companySize,
          include_pricing: true
        }
      });

      if (fnError) throw fnError;
      
      if (data?.success && data?.analysis) {
        setResult(data.analysis);
        setExpandedSection('insights');
      } else {
        setError(data?.error || 'No se pudo analizar el código CNAE');
      }
    } catch (err: any) {
      console.error('Error calling AI recommender:', err);
      setError(err.message || 'Error al conectar con el servicio de recomendación');
    } finally {
      setIsLoading(false);
    }
  };

  const getImportanceBadgeColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'core': return <Star className="w-3 h-3 text-amber-400 fill-amber-400" />;
      case 'recommended': return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
      default: return <Info className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Recomendador IA Avanzado</h3>
          <p className="text-sm text-slate-400">
            Análisis inteligente basado en tu código CNAE
          </p>
        </div>
      </div>

      {/* Input form */}
      <div className="space-y-4 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Código CNAE (ej: 4711, 6411, 8610...)"
              value={cnaeInput}
              onChange={(e) => setCnaeInput(e.target.value.replace(/[^0-9]/g, ''))}
              className="pl-10 h-12 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              maxLength={5}
            />
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || cnaeInput.length < 2}
            className="h-12 px-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analizar
              </>
            )}
          </Button>
        </div>

        {/* Company size selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Tamaño empresa:</span>
          <div className="flex gap-1">
            {[
              { key: 'startup', label: 'Startup' },
              { key: 'pyme', label: 'PYME' },
              { key: 'gran_empresa', label: 'Gran Empresa' }
            ].map((size) => (
              <Button
                key={size.key}
                variant="ghost"
                size="sm"
                onClick={() => setCompanySize(size.key as any)}
                className={`rounded-full text-xs ${
                  companySize === size.key
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {size.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Primary Sector Card */}
            {result.primary_sector && (
              <div 
                className="rounded-xl p-5 border"
                style={{
                  backgroundColor: `${result.primary_sector.gradient_from}10`,
                  borderColor: `${result.primary_sector.gradient_from}30`
                }}
              >
                {/* Compatibility score */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Sector Recomendado
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Compatibilidad</span>
                    <span 
                      className="text-lg font-bold"
                      style={{ color: result.primary_sector.gradient_from }}
                    >
                      {result.primary_sector.compatibility_score}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <Progress 
                  value={result.primary_sector.compatibility_score} 
                  className="h-2 mb-4"
                />

                {/* Sector info */}
                <h4 className="text-xl font-semibold text-white mb-2">
                  {result.primary_sector.sector_name}
                </h4>
                <p className="text-sm text-slate-400 mb-4">
                  {result.primary_sector.short_description}
                </p>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                    <Cpu className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                    <p className="text-xs text-slate-400">
                      {result.primary_sector.ai_capabilities.length} IA
                    </p>
                  </div>
                  <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                    <FileText className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                    <p className="text-xs text-slate-400">
                      {result.primary_sector.regulations.length} Normativas
                    </p>
                  </div>
                  <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                    <Package className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                    <p className="text-xs text-slate-400">
                      {result.primary_sector.modules_recommended.length} Módulos
                    </p>
                  </div>
                </div>

                {/* View sector CTA */}
                <Link to={`/sectores/${result.primary_sector.sector_slug}`}>
                  <Button 
                    variant="outline" 
                    className="w-full border-slate-700 text-white hover:bg-slate-800"
                  >
                    Ver solución completa
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}

            {/* AI Insights */}
            {result.ai_insights.length > 0 && (
              <Collapsible
                open={expandedSection === 'insights'}
                onOpenChange={() => setExpandedSection(expandedSection === 'insights' ? null : 'insights')}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-white hover:bg-slate-800/50 p-4 h-auto"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Insights de IA
                    </span>
                    {expandedSection === 'insights' ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-2 px-4 pb-4">
                    {result.ai_insights.map((insight, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="text-sm text-slate-300 p-3 bg-slate-800/30 rounded-lg"
                      >
                        {insight}
                      </motion.div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Module Recommendations */}
            {result.module_recommendations.length > 0 && (
              <Collapsible
                open={expandedSection === 'modules'}
                onOpenChange={() => setExpandedSection(expandedSection === 'modules' ? null : 'modules')}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-white hover:bg-slate-800/50 p-4 h-auto"
                  >
                    <span className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-400" />
                      Módulos Recomendados ({result.module_recommendations.length})
                    </span>
                    {expandedSection === 'modules' ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-2 px-4 pb-4">
                    {result.module_recommendations.map((module, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg"
                      >
                        {getPriorityIcon(module.priority)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{module.name}</span>
                            <Badge 
                              variant="outline" 
                              className="text-xs capitalize"
                            >
                              {module.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{module.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Regulations */}
            {result.primary_sector?.regulations && result.primary_sector.regulations.length > 0 && (
              <Collapsible
                open={expandedSection === 'regulations'}
                onOpenChange={() => setExpandedSection(expandedSection === 'regulations' ? null : 'regulations')}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-white hover:bg-slate-800/50 p-4 h-auto"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      Normativas Aplicables ({result.primary_sector.regulations.length})
                    </span>
                    {expandedSection === 'regulations' ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-2 px-4 pb-4">
                    <TooltipProvider>
                      {result.primary_sector.regulations.map((reg, i) => (
                        <Tooltip key={i}>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg cursor-help">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline"
                                  className={getImportanceBadgeColor(reg.importance || 'medium')}
                                >
                                  {reg.code}
                                </Badge>
                                <span className="text-sm text-slate-300">{reg.name}</span>
                              </div>
                              <Info className="w-4 h-4 text-slate-500" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="left" 
                            className="max-w-xs bg-slate-800 border-slate-700 text-white"
                          >
                            <p className="text-sm">{reg.explanation}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Alternative Sectors */}
            {result.alternative_sectors.length > 0 && (
              <div className="pt-4 border-t border-slate-800">
                <p className="text-sm text-slate-400 mb-3">Sectores alternativos:</p>
                <div className="flex flex-wrap gap-2">
                  {result.alternative_sectors.map((sector, i) => (
                    <Link key={i} to={`/sectores/${sector.sector_slug}`}>
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-slate-800 transition-colors"
                        style={{ borderColor: `${sector.gradient_from}50` }}
                      >
                        {sector.sector_name}
                        <span className="ml-1 opacity-60">{sector.compatibility_score}%</span>
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="pt-4 border-t border-slate-800">
              <Link to="/demo">
                <Button className="w-full h-12 bg-gradient-to-r from-primary to-purple-500 text-white hover:opacity-90">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Solicitar demo personalizada
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No result state */}
      {!result && !isLoading && !error && (
        <div className="text-center py-8 text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            Introduce tu código CNAE para recibir recomendaciones personalizadas
          </p>
        </div>
      )}
    </div>
  );
};

export default AIRecommenderPanel;
