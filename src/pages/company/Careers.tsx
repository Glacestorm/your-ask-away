import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, MapPin, Clock, Users, Rocket, Heart, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StoreFooter from '@/components/store/StoreFooter';

const Careers: React.FC = () => {
  const perks = [
    { icon: Rocket, title: 'Crecimiento', description: 'Proyectos desafiantes y formación continua' },
    { icon: Heart, title: 'Flexibilidad', description: 'Trabajo remoto y horario flexible' },
    { icon: Coffee, title: 'Ambiente', description: 'Equipo colaborativo y ambiente positivo' },
    { icon: Users, title: 'Impacto', description: 'Tu trabajo tiene impacto real en el sector' }
  ];

  const openPositions = [
    {
      title: 'Senior Full Stack Developer',
      department: 'Ingeniería',
      location: 'Remoto / León',
      type: 'Tiempo completo',
      description: 'Buscamos un desarrollador senior con experiencia en React, TypeScript y Node.js para liderar proyectos críticos.'
    },
    {
      title: 'AI/ML Engineer',
      department: 'Inteligencia Artificial',
      location: 'Remoto / León',
      type: 'Tiempo completo',
      description: 'Únete al equipo de IA para desarrollar modelos predictivos y soluciones de automatización para el sector bancario.'
    },
    {
      title: 'Product Manager',
      department: 'Producto',
      location: 'Remoto / León',
      type: 'Tiempo completo',
      description: 'Lidera la estrategia de producto y trabaja con equipos multidisciplinares para definir el roadmap de ObelixIA.'
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
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Construye el Futuro con Nosotros
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Únete a un equipo apasionado por la tecnología y la innovación. 
            Estamos transformando la gestión empresarial con inteligencia artificial.
          </p>
        </div>
      </section>

      {/* Perks */}
      <section className="py-16 px-4 bg-slate-900/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">¿Por qué ObelixIA?</h2>
            <p className="text-slate-400">Lo que nos hace diferentes</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map((perk, index) => (
              <div key={index} className="bg-slate-900/50 rounded-xl p-6 border border-slate-800 text-center">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <perk.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{perk.title}</h3>
                <p className="text-sm text-slate-400">{perk.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Posiciones Abiertas</h2>
            <p className="text-slate-400">Encuentra tu próximo reto profesional</p>
          </div>
          <div className="space-y-6">
            {openPositions.map((position, index) => (
              <div key={index} className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{position.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {position.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {position.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {position.type}
                      </span>
                    </div>
                    <p className="text-slate-400">{position.description}</p>
                  </div>
                  <Link to="/contact">
                    <Button className="bg-emerald-500 hover:bg-emerald-600 text-white whitespace-nowrap">
                      Aplicar
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* No Position */}
      <section className="py-16 px-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            ¿No encuentras la posición que buscas?
          </h2>
          <p className="text-slate-400 mb-8">
            Siempre estamos buscando talento. Envíanos tu CV y te tendremos en cuenta 
            para futuras oportunidades.
          </p>
          <a href="mailto:jfernandez@obelixia.com?subject=Candidatura espontánea">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white">
              Enviar candidatura espontánea
            </Button>
          </a>
        </div>
      </section>

      <StoreFooter />
    </div>
  );
};

export default Careers;
