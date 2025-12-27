import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Package, Check, Star, Sparkles, ArrowRight, Shield, BarChart3, 
  Zap, Users, Brain, FileText, CreditCard, Tag, Award, Settings,
  Layers, TrendingUp, Scale, Banknote, AlertTriangle, UserCheck,
  FileCheck, ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSectorModules, SectorModule, SectorPack } from '@/hooks/useSectorModules';
import { cn } from '@/lib/utils';

interface SectorModulesSectionProps {
  sectorSlug: string;
  accentColor?: string;
}

const iconMap: Record<string, React.ElementType> = {
  Users, Shield, BarChart3, Zap, Package, Brain, FileText, CreditCard,
  Tag, Award, Settings, Layers, TrendingUp, Scale, Banknote, AlertTriangle,
  UserCheck, FileCheck, ClipboardList, Star, Sparkles
};

const colorClasses: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  slate: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  rose: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  violet: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  pink: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30', badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  indigo: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
};

function ModuleCard({ module, color }: { module: SectorModule; color: string }) {
  const Icon = iconMap[module.module_icon] || Package;
  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-slate-800/50 border rounded-xl p-4 hover:bg-slate-800/70 transition-all",
        colors.border
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", colors.bg)}>
          <Icon className={cn("w-5 h-5", colors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-white truncate">{module.module_name}</h4>
            {module.is_core && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/50 text-amber-400">
                Core
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 line-clamp-2 mb-2">{module.description}</p>
          <div className="flex items-center justify-between">
            <span className={cn("text-sm font-bold", colors.text)}>
              {module.base_price}€<span className="text-xs text-slate-500">/mes</span>
            </span>
            {module.features && module.features.length > 0 && (
              <span className="text-[10px] text-slate-500">
                {module.features.length} funciones
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PackCard({ pack, color, isFeatured }: { pack: SectorPack; color: string; isFeatured?: boolean }) {
  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative bg-slate-800/60 border-2 rounded-2xl p-6 transition-all",
        isFeatured ? `${colors.border} ring-2 ring-offset-2 ring-offset-slate-900` : "border-slate-700",
        isFeatured && `ring-${color}-500/30`
      )}
    >
      {isFeatured && (
        <div className={cn("absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold", colors.badge)}>
          <Sparkles className="w-3 h-3 inline mr-1" />
          Recomendado
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">{pack.name}</h3>
        <p className="text-sm text-slate-400 mb-4">{pack.description}</p>
        
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-3xl font-bold text-white">{pack.discountedPrice}€</span>
          <span className="text-lg text-slate-500 line-through">{pack.originalPrice}€</span>
        </div>
        <Badge className={colors.badge}>
          Ahorra {pack.discountPercentage}%
        </Badge>
      </div>

      <div className="space-y-2 mb-6">
        {pack.features.map((feature, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
            <Check className={cn("w-4 h-4 flex-shrink-0", colors.text)} />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <p className="text-xs text-slate-500 mb-2">{pack.modules.length} módulos incluidos:</p>
        <div className="flex flex-wrap gap-1">
          {pack.modules.slice(0, 6).map((m) => (
            <Badge key={m.id} variant="outline" className="text-[10px] border-slate-600 text-slate-400">
              {m.module_name}
            </Badge>
          ))}
          {pack.modules.length > 6 && (
            <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
              +{pack.modules.length - 6} más
            </Badge>
          )}
        </div>
      </div>

      <Link to="/demo">
        <Button 
          className={cn(
            "w-full",
            isFeatured 
              ? `bg-gradient-to-r from-${color}-600 to-${color}-500 hover:from-${color}-500 hover:to-${color}-400` 
              : "bg-slate-700 hover:bg-slate-600"
          )}
        >
          Solicitar Demo
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </motion.div>
  );
}

export function SectorModulesSection({ sectorSlug, accentColor }: SectorModulesSectionProps) {
  const { 
    sectorName, 
    recommendedModules, 
    basicPack, 
    advancedPack, 
    loading,
    getSectorColor 
  } = useSectorModules(sectorSlug);

  const color = accentColor || getSectorColor();
  const colors = colorClasses[color] || colorClasses.blue;

  if (loading) {
    return (
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-800 rounded w-1/3 mx-auto" />
            <div className="h-4 bg-slate-800 rounded w-1/2 mx-auto" />
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-slate-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const coreModules = recommendedModules.filter(m => m.is_core);
  const sectorSpecificModules = recommendedModules.filter(m => !m.is_core);

  return (
    <section className="py-16 border-t border-slate-800">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge className={cn("mb-4", colors.badge)}>
            <Package className="w-3 h-3 mr-1" />
            MÓDULOS RECOMENDADOS
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Solución completa para {sectorName}
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Módulos especializados y probados para empresas del sector {sectorName.toLowerCase()}.
            Elige el pack que mejor se adapte a tus necesidades.
          </p>
        </motion.div>

        {/* Packs Section */}
        {(basicPack || advancedPack) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-16"
          >
            <h3 className="text-xl font-semibold text-white text-center mb-8">
              <Star className={cn("w-5 h-5 inline mr-2", colors.text)} />
              Packs Preconfigurados
            </h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {basicPack && <PackCard pack={basicPack} color={color} />}
              {advancedPack && <PackCard pack={advancedPack} color={color} isFeatured />}
            </div>
          </motion.div>
        )}

        {/* Modules Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-slate-800/50">
              <TabsTrigger value="all">Todos ({recommendedModules.length})</TabsTrigger>
              <TabsTrigger value="core">Core ({coreModules.length})</TabsTrigger>
              <TabsTrigger value="sector">Específicos ({sectorSpecificModules.length})</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedModules.map((module, i) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ModuleCard module={module} color={color} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="core">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {coreModules.map((module, i) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ModuleCard module={module} color={color} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sector">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectorSpecificModules.map((module, i) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ModuleCard module={module} color={color} />
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-slate-400 mb-4">
            ¿Necesitas una solución personalizada?
          </p>
          <Link to="/contact">
            <Button variant="outline" className="border-slate-600 hover:bg-slate-800">
              Hablar con un especialista
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default SectorModulesSection;
