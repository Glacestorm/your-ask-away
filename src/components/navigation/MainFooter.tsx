/**
 * MainFooter - Footer principal unificado
 * Usa la configuración de navigation.ts para todos los enlaces
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Linkedin, Twitter, Github } from 'lucide-react';
import { ObelixiaLogo } from '@/components/ui/ObelixiaLogo';
import { footerNavigation, quickActions } from '@/config/navigation';
import { Button } from '@/components/ui/button';

const MainFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="container mx-auto px-4 py-16">
        {/* CTA Section */}
        <div className="mb-12 p-8 rounded-2xl bg-gradient-to-r from-emerald-900/30 via-slate-900 to-cyan-900/30 border border-emerald-500/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                ¿Listo para transformar tu negocio?
              </h3>
              <p className="text-slate-400">
                Descubre cómo ObelixIA puede impulsar tu empresa con IA
              </p>
            </div>
            <div className="flex gap-3">
              {quickActions.slice(0, 2).map((action) => (
                <Link key={action.id} to={action.href}>
                  <Button 
                    variant={action.id === 'demo' ? 'default' : 'outline'}
                    className={action.id === 'demo' 
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400' 
                      : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    }
                  >
                    {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-7 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/store" className="inline-block mb-4">
              <ObelixiaLogo size="md" variant="full" animated={false} dark />
            </Link>
            <p className="text-slate-400 text-sm mb-6 max-w-xs">
              Plataforma modular de gestión empresarial con IA integrada para empresas que buscan la excelencia.
            </p>
            <div className="space-y-2 text-sm text-slate-400">
              <a href="mailto:jfernandez@obelixia.com" className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                <Mail className="w-4 h-4" />
                <span>jfernandez@obelixia.com</span>
              </a>
              <a href="tel:+34606770033" className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                <Phone className="w-4 h-4" />
                <span>+34 606 770 033</span>
              </a>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>León / España</span>
              </div>
            </div>
          </div>

          {/* Navigation Groups */}
          {footerNavigation.slice(0, 5).map((group) => (
            <div key={group.id}>
              <h4 className="text-white font-semibold mb-4">{group.title}</h4>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <Link 
                      to={item.href} 
                      className="text-sm text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-2"
                    >
                      {item.icon && <item.icon className="w-3.5 h-3.5" />}
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal Links Row */}
        <div className="py-6 border-y border-slate-800 mb-8">
          <div className="flex flex-wrap justify-center gap-6">
            {footerNavigation
              .find((g) => g.id === 'legal')
              ?.items.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  className="text-sm text-slate-500 hover:text-emerald-400 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © {currentYear} ObelixIA. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;
