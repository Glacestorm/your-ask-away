import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Handshake, CheckCircle, ArrowRight, Building2, Users, Globe, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StoreFooter from '@/components/store/StoreFooter';

const Partners: React.FC = () => {
  const benefits = [
    {
      icon: Building2,
      title: 'Acceso a Tecnología Avanzada',
      description: 'Integra ObelixIA en tus soluciones y ofrece a tus clientes la última tecnología en IA bancaria.'
    },
    {
      icon: Users,
      title: 'Formación y Soporte',
      description: 'Programa de certificación y soporte técnico dedicado para partners.'
    },
    {
      icon: Globe,
      title: 'Co-marketing',
      description: 'Visibilidad en nuestros canales y participación en eventos del sector.'
    },
    {
      icon: Zap,
      title: 'Márgenes Competitivos',
      description: 'Estructura de comisiones atractiva y escalable según volumen.'
    }
  ];

  const partnerTypes = [
    {
      title: 'Partner Tecnológico',
      description: 'Para empresas de software que quieran integrar ObelixIA en sus soluciones.',
      features: ['APIs de integración', 'Documentación técnica completa', 'Sandbox de desarrollo', 'Soporte técnico prioritario']
    },
    {
      title: 'Partner de Consultoría',
      description: 'Para consultoras que asesoran a empresas del sector bancario y financiero.',
      features: ['Material de ventas', 'Formación comercial', 'Casos de éxito compartidos', 'Leads cualificados']
    },
    {
      title: 'Partner de Implementación',
      description: 'Para integradores que desplieguen e implementen ObelixIA.',
      features: ['Certificación técnica', 'Acceso a roadmap de producto', 'Soporte de implementación', 'Programa de incentivos']
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
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-sm mb-6">
            <Handshake className="w-4 h-4" />
            Programa de Partners
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Crece con ObelixIA
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
            Únete a nuestro ecosistema de partners y lleva soluciones de IA bancaria 
            de vanguardia a tus clientes.
          </p>
          <Link to="/contact">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white">
              Convertirse en Partner
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-16 px-4 bg-slate-900/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Beneficios del Programa</h2>
            <p className="text-slate-400">Ventajas exclusivas para nuestros partners</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-sm text-slate-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tipos de Partner */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Tipos de Partnership</h2>
            <p className="text-slate-400">Encuentra el modelo que mejor se adapte a tu negocio</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {partnerTypes.map((type, index) => (
              <div key={index} className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800 hover:border-emerald-500/50 transition-colors">
                <h3 className="text-xl font-semibold text-white mb-3">{type.title}</h3>
                <p className="text-slate-400 mb-6">{type.description}</p>
                <ul className="space-y-3">
                  {type.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">¿Interesado en ser partner?</h2>
          <p className="text-slate-400 mb-8">
            Contacta con nosotros y te explicaremos cómo podemos colaborar juntos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Solicitar información
              </Button>
            </Link>
            <a href="mailto:jfernandez@obelixia.com">
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                jfernandez@obelixia.com
              </Button>
            </a>
          </div>
        </div>
      </section>

      <StoreFooter />
    </div>
  );
};

export default Partners;
