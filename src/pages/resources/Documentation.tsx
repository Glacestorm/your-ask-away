import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Book, Code, Shield, Database, Users, Zap, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UnifiedFooter from '@/components/layout/UnifiedFooter';

const Documentation: React.FC = () => {
  const sections = [
    {
      icon: Zap,
      title: 'Inicio Rápido',
      description: 'Guía para comenzar a usar ObelixIA en minutos.',
      links: [
        { label: 'Primeros pasos', href: '#getting-started' },
        { label: 'Configuración inicial', href: '#setup' },
        { label: 'Tu primer dashboard', href: '#first-dashboard' }
      ]
    },
    {
      icon: Code,
      title: 'API Reference',
      description: 'Documentación completa de nuestra API REST.',
      links: [
        { label: 'Autenticación', href: '/api' },
        { label: 'Endpoints', href: '/api' },
        { label: 'Webhooks', href: '/api' }
      ]
    },
    {
      icon: Database,
      title: 'Módulos',
      description: 'Guías detalladas de cada módulo de la plataforma.',
      links: [
        { label: 'CRM Bancario', href: '#crm' },
        { label: 'Contabilidad', href: '#accounting' },
        { label: 'Gestión de visitas', href: '#visits' }
      ]
    },
    {
      icon: Shield,
      title: 'Seguridad y Compliance',
      description: 'Documentación sobre seguridad y cumplimiento normativo.',
      links: [
        { label: 'DORA / NIS2', href: '#dora' },
        { label: 'ISO 27001', href: '#iso27001' },
        { label: 'GDPR / RGPD', href: '/gdpr' }
      ]
    },
    {
      icon: Users,
      title: 'Administración',
      description: 'Guías para administradores del sistema.',
      links: [
        { label: 'Gestión de usuarios', href: '#users' },
        { label: 'Roles y permisos', href: '#roles' },
        { label: 'Configuración', href: '#config' }
      ]
    },
    {
      icon: FileText,
      title: 'Integraciones',
      description: 'Conecta ObelixIA con otras herramientas.',
      links: [
        { label: 'Mapas y geolocalización', href: '#maps' },
        { label: 'Notificaciones', href: '#notifications' },
        { label: 'Exportaciones', href: '#exports' }
      ]
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
            <Book className="w-4 h-4" />
            Centro de Documentación
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Documentación de ObelixIA</h1>
          <p className="text-xl text-slate-400">
            Todo lo que necesitas para aprovechar al máximo nuestra plataforma.
          </p>
        </div>
      </section>

      {/* Search */}
      <section className="px-4 pb-8">
        <div className="container mx-auto max-w-2xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar en la documentación..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section, index) => (
              <div key={index} className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <section.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                </div>
                <p className="text-slate-400 text-sm mb-4">{section.description}</p>
                <ul className="space-y-2">
                  {section.links.map((link, i) => (
                    <li key={i}>
                      <Link 
                        to={link.href} 
                        className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        {link.label}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help */}
      <section className="py-16 px-4 bg-slate-900/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-white mb-4">¿Necesitas más ayuda?</h2>
          <p className="text-slate-400 mb-8">
            Nuestro equipo de soporte está disponible para resolver tus dudas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Contactar soporte
              </Button>
            </Link>
            <Link to="/api">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                Ver API Reference
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <UnifiedFooter />
    </div>
  );
};

export default Documentation;
