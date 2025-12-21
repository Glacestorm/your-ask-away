import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Filter, Building2, Search, X, ArrowLeft
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSectors } from '@/hooks/useSectors';
import { CaseStudyCard } from '@/components/sectors/CaseStudyCard';
import { AggregatedMetrics } from '@/components/sectors/AggregatedMetrics';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

const CasosDeExito: React.FC = () => {
  const { sectors, loading } = useSectors({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  // Get all case studies with sector info
  const allCaseStudies = sectors.flatMap(sector => 
    sector.case_studies.map(cs => ({
      ...cs,
      sectorName: sector.name,
      sectorSlug: sector.slug,
      gradientColor: sector.gradient_from || '#3B82F6'
    }))
  );

  // Filter case studies
  const filteredCaseStudies = allCaseStudies.filter(cs => {
    const matchesSearch = 
      cs.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cs.result.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cs.sectorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSector = !selectedSector || cs.sectorSlug === selectedSector;
    
    return matchesSearch && matchesSector;
  });

  // Get unique sectors for filter
  const sectorOptions = sectors
    .filter(s => s.case_studies.length > 0)
    .map(s => ({ slug: s.slug, name: s.name, color: s.gradient_from }));

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
        
        <div className="container mx-auto px-6 relative">
          {/* Back link */}
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full mb-6">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Casos de Éxito</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Historias de transformación digital
            </h1>
            <p className="text-xl text-slate-400">
              Descubre cómo empresas de todos los sectores han optimizado sus operaciones 
              y alcanzado resultados excepcionales con Obelixia.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Aggregated Metrics */}
      <section className="py-12 border-y border-slate-800">
        <div className="container mx-auto px-6">
          <AggregatedMetrics />
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b border-slate-800 sticky top-0 bg-slate-950/95 backdrop-blur-sm z-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                placeholder="Buscar por empresa, sector o resultado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary rounded-full"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-400 hover:text-white"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Sector filters */}
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSector(null)}
                className={`rounded-full text-sm ${
                  !selectedSector 
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Todos
              </Button>
              {sectorOptions.map((sector) => (
                <Button
                  key={sector.slug}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSector(sector.slug)}
                  className={`rounded-full text-sm ${
                    selectedSector === sector.slug
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {sector.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="w-12 h-12 rounded-xl bg-slate-800" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2 bg-slate-800" />
                      <Skeleton className="h-3 w-20 bg-slate-800" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full mb-4 bg-slate-800 rounded-xl" />
                  <Skeleton className="h-16 w-full bg-slate-800" />
                </div>
              ))}
            </div>
          ) : filteredCaseStudies.length > 0 ? (
            <>
              <p className="text-slate-400 mb-8">
                {filteredCaseStudies.length} caso{filteredCaseStudies.length !== 1 ? 's' : ''} de éxito
                {selectedSector && ` en ${sectorOptions.find(s => s.slug === selectedSector)?.name}`}
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCaseStudies.map((cs, index) => (
                  <CaseStudyCard
                    key={`${cs.company}-${index}`}
                    caseStudy={cs}
                    sectorName={cs.sectorName}
                    sectorSlug={cs.sectorSlug}
                    gradientColor={cs.gradientColor}
                    index={index}
                  />
                ))}
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No se encontraron casos de éxito
              </h3>
              <p className="text-slate-400 mb-4">
                Prueba con otros términos de búsqueda o filtros
              </p>
              <Button
                variant="outline"
                className="border-slate-700 text-white hover:bg-slate-800"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSector(null);
                }}
              >
                Limpiar filtros
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-slate-800">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-display font-bold text-white mb-4">
              ¿Quieres ser nuestro próximo caso de éxito?
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Agenda una demo personalizada y descubre cómo Obelixia puede transformar 
              tu negocio con resultados medibles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/demo">
                <Button
                  size="lg"
                  className="h-12 px-8 rounded-full bg-gradient-to-r from-primary to-purple-500 text-white hover:opacity-90"
                >
                  Solicitar demo gratuita
                </Button>
              </Link>
              <Link to="/#contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 rounded-full border-slate-700 text-white hover:bg-slate-800"
                >
                  Contactar con ventas
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default CasosDeExito;
