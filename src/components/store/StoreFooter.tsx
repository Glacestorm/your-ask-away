import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Linkedin, Twitter, Github } from 'lucide-react';
import { ObelixiaLogo } from '@/components/ui/ObelixiaLogo';
import { footerNavigation } from '@/config/navigation';

const StoreFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  // Get footer groups from centralized navigation (excluding legal for separate row)
  const mainGroups = footerNavigation.filter(group => group.id !== 'legal');
  const legalGroup = footerNavigation.find(group => group.id === 'legal');

  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/store" className="inline-block mb-4">
              <ObelixiaLogo size="md" variant="full" animated={false} dark />
            </Link>
            <p className="text-slate-400 text-sm mb-6 max-w-xs leading-relaxed">
              Plataforma modular de gestión empresarial con IA integrada para empresas que buscan la excelencia.
            </p>
            <div className="space-y-2.5 text-sm text-slate-400">
              <a href="mailto:jfernandez@obelixia.com" className="flex items-center gap-2.5 hover:text-emerald-400 transition-colors">
                <Mail className="w-4 h-4" />
                <span>jfernandez@obelixia.com</span>
              </a>
              <a href="tel:+34606770033" className="flex items-center gap-2.5 hover:text-emerald-400 transition-colors">
                <Phone className="w-4 h-4" />
                <span>+34 606 770 033</span>
              </a>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4" />
                <span>León, España</span>
              </div>
            </div>
          </div>

          {/* Dynamic Navigation Groups */}
          {mainGroups.slice(0, 4).map((group) => (
            <div key={group.id}>
              <h4 className="text-white font-semibold mb-4 text-sm">{group.title}</h4>
              <ul className="space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <Link 
                      to={item.href} 
                      className="text-sm text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal Links Row */}
        {legalGroup && (
          <div className="py-6 border-t border-slate-800/50 mb-6">
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
              {legalGroup.items.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
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

export default StoreFooter;
