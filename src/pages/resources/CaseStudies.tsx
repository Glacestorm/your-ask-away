import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, TrendingUp, Users, Clock, Building2, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StoreFooter from '@/components/store/StoreFooter';

const CaseStudies: React.FC = () => {
  const cases = [
    {
      title: 'Transformación Digital en Banca Regional',
      company: 'Entidad Financiera Regional',
      sector: 'Banca',
      challenge: 'Gestión manual de 500+ clientes empresariales con información dispersa en múltiples sistemas.',
      solution: 'Implementación de ObelixIA con módulos de CRM, visitas y análisis financiero integrado.',
      results: [
        { metric: '40%', label: 'Reducción tiempo gestión' },
        { metric: '25%', label: 'Aumento captación' },
        { metric: '60%', label: 'Mejora seguimiento' }
      ],
      testimonial: '"ObelixIA ha transformado completamente nuestra forma de gestionar la cartera comercial."',
      testimonialAuthor: 'Director Comercial'
    },
    {
      title: 'Cumplimiento DORA en tiempo récord',
      company: 'Gestora de Fondos',
      sector: 'Gestión de activos',
      challenge: 'Necesidad de cumplir con DORA antes de la fecha límite con recursos limitados.',
      solution: 'Módulo de compliance DORA/NIS2 con automatización de reportes y monitorización.',
      results: [
        { metric: '100%', label: 'Cumplimiento DORA' },
        { metric: '70%', label: 'Menos auditorías manuales' },
        { metric: '3 meses', label: 'Tiempo implementación' }
      ],
      testimonial: '"Pasamos de la incertidumbre a tener todo controlado en semanas."',
      testimonialAuthor: 'Compliance Officer'
    },
    {
      title: 'Optimización de Red Comercial',
      company: 'Compañía de Seguros',
      sector: 'Seguros',
      challenge: 'Red de 50 agentes con dificultades para coordinar visitas y hacer seguimiento.',
      solution: 'Módulos de gestión de visitas con geolocalización y planificación de rutas.',
      results: [
        { metric: '35%', label: 'Más visitas/día' },
        { metric: '50%', label: 'Reducción desplazamientos' },
        { metric: '20%', label: 'Aumento conversión' }
      ],
      testimonial: '"Nuestros agentes ahora tienen toda la información que necesitan en cualquier momento."',
      testimonialAuthor: 'Director de Red'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link to="/store">
            <Button variant="ghost" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la tienda
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-sm mb-6">
            <Trophy className="w-4 h-4" />
            Casos de Éxito
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Historias de Transformación</h1>
          <p className="text-xl text-slate-400">
            Descubre cómo empresas del sector financiero han transformado su operativa con ObelixIA.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 pb-16">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-1">50+</div>
              <div className="text-sm text-slate-400">Implementaciones</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-1">35%</div>
              <div className="text-sm text-slate-400">Mejora productividad media</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-1">100%</div>
              <div className="text-sm text-slate-400">Cumplimiento normativo</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-1">4.8/5</div>
              <div className="text-sm text-slate-400">Satisfacción cliente</div>
            </div>
          </div>
        </div>
      </section>

      {/* Cases */}
      <section className="px-4 pb-16">
        <div className="container mx-auto max-w-5xl space-y-12">
          {cases.map((caseStudy, index) => (
            <div key={index} className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-full">
                  {caseStudy.sector}
                </span>
                <span className="flex items-center gap-1 text-slate-500 text-sm">
                  <Building2 className="w-4 h-4" />
                  {caseStudy.company}
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-6">{caseStudy.title}</h2>
              
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">El Desafío</h3>
                  <p className="text-slate-300">{caseStudy.challenge}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">La Solución</h3>
                  <p className="text-slate-300">{caseStudy.solution}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {caseStudy.results.map((result, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-400 mb-1">{result.metric}</div>
                    <div className="text-xs text-slate-400">{result.label}</div>
                  </div>
                ))}
              </div>

              <blockquote className="border-l-4 border-emerald-500 pl-4 italic text-slate-400">
                {caseStudy.testimonial}
                <footer className="text-sm text-slate-500 mt-2 not-italic">— {caseStudy.testimonialAuthor}</footer>
              </blockquote>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">¿Quieres ser nuestro próximo caso de éxito?</h2>
          <p className="text-slate-400 mb-8">
            Descubre cómo ObelixIA puede transformar tu negocio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/store">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Solicitar Demo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                Contactar
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <StoreFooter />
    </div>
  );
};

export default CaseStudies;
