import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Building2, Trophy, TrendingUp, Users,
  Quote, CheckCircle2, ArrowRight, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSectors } from '@/hooks/useSectors';
import { Skeleton } from '@/components/ui/skeleton';

const CaseStudyDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { sectors, loading } = useSectors({});

  // Find the case study by company slug
  const findCaseStudy = () => {
    for (const sector of sectors) {
      const caseStudy = sector.case_studies.find(
        cs => cs.company.toLowerCase().replace(/\s+/g, '-') === slug
      );
      if (caseStudy) {
        return { caseStudy, sector };
      }
    }
    return null;
  };

  const found = findCaseStudy();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 py-20">
        <div className="container mx-auto px-6">
          <Skeleton className="h-8 w-32 mb-8 bg-slate-800" />
          <Skeleton className="h-12 w-2/3 mb-4 bg-slate-800" />
          <Skeleton className="h-6 w-1/2 mb-12 bg-slate-800" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-32 bg-slate-800 rounded-xl" />
            <Skeleton className="h-32 bg-slate-800 rounded-xl" />
            <Skeleton className="h-32 bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!found) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Caso no encontrado</h1>
          <p className="text-slate-400 mb-6">No pudimos encontrar el caso de éxito solicitado.</p>
          <Link to="/casos-de-exito">
            <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ver todos los casos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { caseStudy, sector } = found;
  const gradientColor = sector.gradient_from || '#3B82F6';

  // Parse metrics from result (simulated)
  const metrics = [
    { label: 'Ahorro anual', value: '€45K', icon: TrendingUp },
    { label: 'Tiempo ahorrado', value: '60%', icon: Trophy },
    { label: 'Usuarios activos', value: '120+', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${gradientColor}15 0%, transparent 50%)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950" />

        <div className="container mx-auto px-6 relative">
          {/* Back link */}
          <Link 
            to="/casos-de-exito" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Todos los casos de éxito
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            {/* Sector badge */}
            <Badge 
              variant="outline" 
              className="mb-6"
              style={{ borderColor: gradientColor, color: gradientColor }}
            >
              {sector.name}
            </Badge>

            {/* Company info */}
            <div className="flex items-center gap-4 mb-6">
              {caseStudy.logo_url ? (
                <img 
                  src={caseStudy.logo_url} 
                  alt={caseStudy.company}
                  className="w-16 h-16 rounded-xl object-contain bg-white p-2"
                />
              ) : (
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{ background: `${gradientColor}30` }}
                >
                  <Building2 className="w-8 h-8" style={{ color: gradientColor }} />
                </div>
              )}
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
                  {caseStudy.company}
                </h1>
              </div>
            </div>

            {/* Result highlight */}
            <div 
              className="inline-flex items-center gap-3 px-6 py-4 rounded-xl mb-8"
              style={{ background: `${gradientColor}20`, borderLeft: `4px solid ${gradientColor}` }}
            >
              <Trophy className="w-6 h-6" style={{ color: gradientColor }} />
              <span className="text-xl text-white font-medium">{caseStudy.result}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-12 border-y border-slate-800">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {metrics.map((metric, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 rounded-xl bg-slate-900/50 border border-slate-800"
              >
                <metric.icon 
                  className="w-8 h-8 mx-auto mb-3" 
                  style={{ color: gradientColor }} 
                />
                <p className="text-3xl font-bold text-white mb-1">{metric.value}</p>
                <p className="text-slate-400 text-sm">{metric.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Challenge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-display font-bold text-white mb-4">
                  El Desafío
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  {caseStudy.company} enfrentaba desafíos significativos en la gestión de sus operaciones. 
                  La falta de automatización y la complejidad del cumplimiento normativo estaban 
                  afectando su eficiencia y capacidad de crecimiento.
                </p>
              </motion.div>

              {/* Solution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-display font-bold text-white mb-4">
                  La Solución
                </h2>
                <p className="text-slate-400 leading-relaxed mb-6">
                  Implementamos Obelixia {sector.name} con una configuración personalizada que incluía:
                </p>
                <div className="space-y-3">
                  {sector.features.slice(0, 4).map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: gradientColor }} />
                      <div>
                        <p className="text-white font-medium">{feature.title}</p>
                        <p className="text-slate-500 text-sm">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Testimonial */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative p-8 rounded-xl bg-slate-900/50 border border-slate-800"
              >
                <Quote className="absolute top-4 right-4 w-12 h-12 text-primary/10" />
                <blockquote className="text-lg text-white italic mb-4">
                  "Obelixia ha transformado completamente nuestra forma de trabajar. 
                  {caseStudy.result} y la satisfacción de nuestro equipo ha aumentado significativamente."
                </blockquote>
                <p className="text-slate-400 text-sm">
                  — Director de Operaciones, {caseStudy.company}
                </p>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Demo video card */}
              {sector.demo_video_url && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-6"
                >
                  <h3 className="font-semibold text-white mb-4">Ver demo en vídeo</h3>
                  <Button 
                    className="w-full gap-2"
                    style={{ background: gradientColor }}
                    onClick={() => window.open(sector.demo_video_url!, '_blank')}
                  >
                    <Play className="w-4 h-4" />
                    Reproducir demo
                  </Button>
                </motion.div>
              )}

              {/* Sector info card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-6"
              >
                <h3 className="font-semibold text-white mb-4">Solución utilizada</h3>
                <div 
                  className="p-4 rounded-lg mb-4"
                  style={{ background: `${gradientColor}15` }}
                >
                  <p className="font-semibold text-white">{sector.name}</p>
                  <p className="text-sm text-slate-400 mt-1">{sector.short_description}</p>
                </div>
                <Link to={sector.landing_page_url || `/sectors/${sector.slug}`}>
                  <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-slate-800 gap-2">
                    Ver solución
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>

              {/* CTA card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-primary/30 bg-primary/10 p-6"
              >
                <h3 className="font-semibold text-white mb-2">
                  ¿Quieres resultados similares?
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Agenda una demo personalizada y descubre cómo podemos ayudarte.
                </p>
                <Link to="/demo">
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Solicitar demo gratuita
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Related cases */}
      <section className="py-16 border-t border-slate-800">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-display font-bold text-white mb-8">
            Más casos de éxito
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {sectors
              .filter(s => s.id !== sector.id)
              .flatMap(s => s.case_studies.map(cs => ({ ...cs, sectorName: s.name, gradientColor: s.gradient_from })))
              .slice(0, 3)
              .map((cs, i) => (
                <Link 
                  key={i}
                  to={`/casos-de-exito/${cs.company.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors"
                  >
                    <Badge variant="outline" className="mb-3 text-xs border-slate-700 text-slate-400">
                      {cs.sectorName}
                    </Badge>
                    <h3 className="font-semibold text-white group-hover:text-primary transition-colors">
                      {cs.company}
                    </h3>
                    <p className="text-sm text-slate-400 mt-2">{cs.result}</p>
                  </motion.div>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CaseStudyDetailPage;
