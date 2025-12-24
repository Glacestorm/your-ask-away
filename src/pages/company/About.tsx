import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Target, Award, Sparkles, Shield, Globe, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UnifiedFooter from '@/components/layout/UnifiedFooter';
import { ObelixiaLogo } from '@/components/ui/ObelixiaLogo';

const About: React.FC = () => {
  const values = [
    {
      icon: Shield,
      title: 'Seguridad',
      description: 'Cumplimiento con las normativas más exigentes del sector bancario: DORA, NIS2, ISO 27001, GDPR.'
    },
    {
      icon: Lightbulb,
      title: 'Innovación',
      description: 'Inteligencia artificial integrada para automatizar procesos y potenciar la toma de decisiones.'
    },
    {
      icon: Users,
      title: 'Orientación al Cliente',
      description: 'Escuchamos las necesidades del sector para desarrollar soluciones que realmente aporten valor.'
    },
    {
      icon: Globe,
      title: 'Adaptabilidad',
      description: 'Módulos sectoriales por CNAE que se adaptan a las particularidades de cada industria.'
    }
  ];

  const milestones = [
    { year: '2024', event: 'Fundación de ObelixIA Technologies' },
    { year: '2024', event: 'Lanzamiento de la plataforma ObelixIA v1.0' },
    { year: '2024', event: 'Implementación de cumplimiento DORA y NIS2' },
    { year: '2025', event: 'Expansión al mercado europeo' }
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
          <ObelixiaLogo size="lg" variant="full" animated={false} dark className="mx-auto mb-8" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Transformando la Gestión Empresarial con IA
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Somos una empresa tecnológica española especializada en soluciones de software 
            empresarial con inteligencia artificial integrada para el sector bancario y financiero.
          </p>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="py-16 px-4 bg-slate-900/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <Target className="w-6 h-6 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Nuestra Misión</h2>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Proporcionar a las empresas del sector financiero y comercial herramientas 
                tecnológicas de vanguardia que les permitan gestionar sus operaciones de 
                forma eficiente, segura y conforme a la normativa vigente, todo ello potenciado 
                por inteligencia artificial.
              </p>
            </div>

            <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Nuestra Visión</h2>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Convertirnos en el referente europeo de plataformas CRM con IA para el sector 
                bancario, siendo reconocidos por nuestra excelencia tecnológica, nuestro 
                compromiso con la seguridad y nuestra capacidad de innovación continua.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Nuestros Valores</h2>
            <p className="text-slate-400">Los principios que guían todo lo que hacemos</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-slate-900/50 rounded-xl p-6 border border-slate-800 text-center">
                <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{value.title}</h3>
                <p className="text-sm text-slate-400">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Historia */}
      <section className="py-16 px-4 bg-slate-900/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Nuestra Historia</h2>
            <p className="text-slate-400">El camino hacia la excelencia tecnológica</p>
          </div>
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-emerald-500/30" />
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className={`flex-1 ${index % 2 === 0 ? 'md:pr-8 md:text-right' : 'md:pl-8'} pl-12 md:pl-0`}>
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 inline-block">
                      <span className="text-emerald-400 font-bold">{milestone.year}</span>
                      <p className="text-slate-300">{milestone.event}</p>
                    </div>
                  </div>
                  <div className="absolute left-4 md:left-1/2 w-3 h-3 bg-emerald-500 rounded-full transform -translate-x-1/2" />
                  <div className="flex-1 hidden md:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Nuestro Equipo</h2>
            <p className="text-slate-400">Profesionales comprometidos con la excelencia</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">JF</span>
              </div>
              <h3 className="text-xl font-semibold text-white">Jaime Fernández García</h3>
              <p className="text-emerald-400 mb-3">Co-fundador & Representante Comercial</p>
              <p className="text-sm text-slate-400">
                Experto en desarrollo de negocio y relaciones comerciales en el sector tecnológico.
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Equipo Técnico</h3>
              <p className="text-emerald-400 mb-3">Desarrollo & Arquitectura</p>
              <p className="text-sm text-slate-400">
                Ingenieros especializados en IA, seguridad y desarrollo de software empresarial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">¿Listo para transformar tu negocio?</h2>
          <p className="text-slate-400 mb-8">Descubre cómo ObelixIA puede ayudarte a alcanzar tus objetivos</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/store">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Explorar Módulos
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

      <UnifiedFooter />
    </div>
  );
};

export default About;
