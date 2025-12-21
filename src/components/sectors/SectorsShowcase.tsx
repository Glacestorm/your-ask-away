import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Search, Sparkles, Filter, 
  Building, Briefcase, Rocket, X, ArrowRight, Trophy
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSectors } from '@/hooks/useSectors';
import SectorCard from './SectorCard';
import { Skeleton } from '@/components/ui/skeleton';
import { CaseStudiesCarousel } from './CaseStudiesCarousel';
import { ClientLogosBar } from './ClientLogosBar';
import { AggregatedMetrics } from './AggregatedMetrics';
import { AIRecommenderPanel } from './AIRecommenderPanel';
import { Link } from 'react-router-dom';

const companySizeFilters = [
  { key: 'all', label: 'Todos', icon: Building2 },
  { key: 'startup', label: 'Startups', icon: Rocket },
  { key: 'pyme', label: 'PYME', icon: Building },
  { key: 'gran_empresa', label: 'Gran Empresa', icon: Briefcase },
];

export const SectorsShowcase: React.FC = () => {
  const { sectors, loading } = useSectors({ featured: true });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAIRecommender, setShowAIRecommender] = useState(false);

  const filteredSectors = sectors.filter(sector => {
    const matchesSearch = 
      sector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sector.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sector.cnae_codes?.some(code => code.includes(searchTerm));
    
    const matchesFilter = 
      activeFilter === 'all' || 
      sector.target_company_sizes?.includes(activeFilter);
    
    return matchesSearch && matchesFilter;
  });

  // Get all client names from case studies for the logos bar
  const allClients = sectors.flatMap(sector => 
    sector.case_studies.map(cs => ({
      name: cs.company,
      logo_url: cs.logo_url,
      gradientColor: sector.gradient_from
    }))
  );

  // Get sectors with case studies for the carousel
  const sectorsWithCaseStudies = sectors.filter(s => s.case_studies.length > 0);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-6 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Experiencia Multisectorial</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-semibold text-white mb-6">
            Sectores donde trabajamos
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Soluciones especializadas adaptadas a las necesidades únicas de cada industria, 
            con funcionalidades específicas y cumplimiento normativo integrado.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-12"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                placeholder="Buscar sector o código CNAE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary rounded-full"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-white"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* AI Recommender Toggle */}
            <Button
              variant={showAIRecommender ? 'default' : 'outline'}
              onClick={() => setShowAIRecommender(!showAIRecommender)}
              className={`h-12 rounded-full gap-2 ${
                showAIRecommender 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0' 
                  : 'border-slate-700 text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Recomendador IA
            </Button>
          </div>

          {/* Company Size Filters */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <Filter className="w-4 h-4 text-slate-500 mr-2" />
            {companySizeFilters.map((filter) => (
              <Button
                key={filter.key}
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilter(filter.key)}
                className={`rounded-full gap-2 transition-all ${
                  activeFilter === filter.key
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <filter.icon className="w-4 h-4" />
                {filter.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* AI Recommender Panel - Advanced */}
        {showAIRecommender && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-3xl mx-auto mb-12"
          >
            <AIRecommenderPanel onClose={() => setShowAIRecommender(false)} />
          </motion.div>
        )}

        {/* Sectors Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
                <Skeleton className="w-16 h-16 rounded-2xl mb-6 bg-slate-800" />
                <Skeleton className="h-6 w-3/4 mb-2 bg-slate-800" />
                <Skeleton className="h-4 w-full mb-4 bg-slate-800" />
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-12 bg-slate-800" />
                  <Skeleton className="h-12 bg-slate-800" />
                  <Skeleton className="h-12 bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredSectors.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredSectors.map((sector, index) => (
              <SectorCard key={sector.id} sector={sector} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No se encontraron sectores
            </h3>
            <p className="text-slate-400">
              Prueba con otros términos de búsqueda o filtros
            </p>
            <Button
              variant="outline"
              className="mt-4 border-slate-700 text-white hover:bg-slate-800"
              onClick={() => {
                setSearchTerm('');
                setActiveFilter('all');
              }}
            >
              Limpiar filtros
            </Button>
          </motion.div>
        )}

        {/* Case Studies Section */}
        {!loading && sectorsWithCaseStudies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-32"
          >
            {/* Section header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full mb-6">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Casos de Éxito</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-display font-semibold text-white mb-4">
                Resultados que hablan por sí solos
              </h3>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Empresas de todos los sectores confían en Obelixia para transformar sus operaciones
              </p>
            </div>

            {/* Client logos carousel */}
            {allClients.length > 0 && (
              <ClientLogosBar clients={allClients} />
            )}

            {/* Aggregated metrics */}
            <div className="my-12">
              <AggregatedMetrics />
            </div>

            {/* Featured case study carousel */}
            <div className="max-w-3xl mx-auto">
              <CaseStudiesCarousel sectors={sectorsWithCaseStudies} />
            </div>

            {/* CTA to case studies page */}
            <div className="text-center mt-12">
              <Link to="/casos-de-exito">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-slate-700 text-white hover:bg-slate-800 gap-2"
                >
                  Ver todos los casos de éxito
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-slate-400 mb-4">
            ¿No encuentras tu sector? Contáctanos para una solución personalizada
          </p>
          <Button
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="h-12 px-8 rounded-full bg-gradient-to-r from-primary to-purple-500 text-white hover:opacity-90"
          >
            Solicitar información
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default SectorsShowcase;
