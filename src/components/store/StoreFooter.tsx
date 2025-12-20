import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Phone, MapPin, Linkedin, Twitter, Github } from 'lucide-react';
import { ObelixiaLogo } from '@/components/ui/ObelixiaLogo';
import { footerNavigation } from '@/config/navigation';

const StoreFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  // Get footer groups from centralized navigation
  const productGroup = footerNavigation.find(g => g.id === 'productos');
  const solutionsGroup = footerNavigation.find(g => g.id === 'soluciones');
  const developersGroup = footerNavigation.find(g => g.id === 'desarrolladores');
  const companyGroup = footerNavigation.find(g => g.id === 'empresa');
  const legalGroup = footerNavigation.find(g => g.id === 'legal');

  const FooterLinkGroup = ({ title, items }: { title: string; items: { id: string; label: string; href: string }[] }) => (
    <div>
      <h4 className="font-medium text-slate-200 mb-4">{title}</h4>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <Link 
              to={item.href} 
              className="text-slate-400 hover:text-white transition-colors duration-200 text-sm"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="bg-slate-950 border-t border-slate-800/50">
      {/* Main Footer */}
      <div className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12">
          {/* Brand Section */}
          <div className="col-span-2">
            <Link to="/store" className="inline-block mb-6">
              <ObelixiaLogo size="md" variant="full" animated={false} dark />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
              Plataforma modular de gestión empresarial con IA integrada. 
              Transformamos empresas con tecnología inteligente.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <a 
                href="mailto:jfernandez@obelixia.com" 
                className="flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-colors group"
              >
                <Mail className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
                jfernandez@obelixia.com
              </a>
              <a 
                href="tel:+34606770033" 
                className="flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-colors group"
              >
                <Phone className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
                +34 606 770 033
              </a>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <MapPin className="w-4 h-4 text-slate-500" />
                León, España
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {productGroup && <FooterLinkGroup title={productGroup.title} items={productGroup.items} />}
          {solutionsGroup && <FooterLinkGroup title={solutionsGroup.title} items={solutionsGroup.items} />}
          {developersGroup && <FooterLinkGroup title={developersGroup.title} items={developersGroup.items} />}
          {companyGroup && <FooterLinkGroup title={companyGroup.title} items={companyGroup.items} />}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800/50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Copyright & Legal */}
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <p className="text-sm text-slate-500">
                © {currentYear} ObelixIA. Todos los derechos reservados.
              </p>
              {legalGroup && (
                <div className="flex items-center gap-6">
                  {legalGroup.items.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      to={item.href}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
