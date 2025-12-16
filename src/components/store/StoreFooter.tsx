import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, Phone, MapPin, Linkedin, Twitter, Github } from 'lucide-react';

const StoreFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const links = {
    productos: [
      { label: 'Módulos', href: '/store/modules' },
      { label: 'Packs', href: '/store/bundles' },
      { label: 'Precios', href: '/store/pricing' },
      { label: 'Enterprise', href: '/store/enterprise' },
    ],
    empresa: [
      { label: 'Sobre Nosotros', href: '/about' },
      { label: 'Contacto', href: '/contact' },
      { label: 'Partners', href: '/partners' },
      { label: 'Carreras', href: '/careers' },
    ],
    recursos: [
      { label: 'Documentación', href: '/docs' },
      { label: 'API Reference', href: '/api' },
      { label: 'Blog', href: '/blog' },
      { label: 'Casos de Éxito', href: '/cases' },
    ],
    legal: [
      { label: 'Términos de Servicio', href: '/terms' },
      { label: 'Política de Privacidad', href: '/privacy' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'GDPR', href: '/gdpr' },
    ],
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/store" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ObelixIA</span>
            </Link>
            <p className="text-slate-400 text-sm mb-6 max-w-xs">
              Plataforma modular de gestión empresarial con IA integrada para empresas que buscan la excelencia.
            </p>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>info@obelixia.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+376 123 456</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Andorra la Vella, Andorra</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Productos</h4>
            <ul className="space-y-2">
              {links.productos.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2">
              {links.empresa.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Recursos</h4>
            <ul className="space-y-2">
              {links.recursos.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {links.legal.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © {currentYear} ObelixIA. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
