import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRoutePreload } from '@/hooks/useRoutePreload';

export interface MegaMenuItem {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  description?: string;
  badge?: string;
}

export interface MegaMenuSection {
  title?: string;
  items: MegaMenuItem[];
}

export interface MegaMenuProps {
  sections: MegaMenuSection[];
  featured?: {
    title: string;
    description: string;
    href: string;
    image?: string;
  };
  onClose: () => void;
}

const MegaMenu: React.FC<MegaMenuProps> = ({ sections, featured, onClose }) => {
  const { preloadRoute } = useRoutePreload();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="pt-2"
    >
      <div className="container mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100">
          <div className="grid grid-cols-12 divide-x divide-slate-100">
            {/* Main Content */}
            <div className={`${featured ? 'col-span-9' : 'col-span-12'} p-8`}>
              <div className="grid grid-cols-3 gap-8">
                {sections.map((section, sectionIndex) => (
                  <div key={sectionIndex}>
                    {section.title && (
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                        {section.title}
                      </h4>
                    )}
                    <ul className="space-y-1">
                      {section.items.map((item) => (
                        <li key={item.id}>
                          <Link
                            to={item.href}
                            onClick={onClose}
                            onMouseEnter={() => preloadRoute(item.href)}
                            className="group flex items-start gap-4 p-3 -mx-3 rounded-xl hover:bg-slate-50 transition-colors duration-150"
                          >
                            {item.icon && (
                              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors duration-150">
                                <item.icon className="w-5 h-5 text-slate-600 group-hover:text-primary transition-colors duration-150" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900 group-hover:text-primary transition-colors duration-150">
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <Badge className="bg-primary/10 text-primary text-[10px] px-1.5 py-0 border-0 font-medium">
                                    {item.badge}
                                  </Badge>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Section */}
            {featured && (
              <div className="col-span-3 p-8 bg-slate-50">
                <div className="h-full flex flex-col">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Destacado
                  </h4>
                  <Link
                    to={featured.href}
                    onClick={onClose}
                    onMouseEnter={() => preloadRoute(featured.href)}
                    className="group flex-1 flex flex-col"
                  >
                    {featured.image && (
                      <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-4 overflow-hidden">
                        <img 
                          src={featured.image} 
                          alt={featured.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    )}
                    {!featured.image && (
                      <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 mb-4 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                          <ArrowRight className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                    )}
                    <h5 className="font-semibold text-slate-900 group-hover:text-primary transition-colors mb-1">
                      {featured.title}
                    </h5>
                    <p className="text-sm text-slate-500 flex-1">
                      {featured.description}
                    </p>
                    <div className="flex items-center gap-1 text-sm font-medium text-primary mt-3">
                      <span>Explorar</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MegaMenu;
