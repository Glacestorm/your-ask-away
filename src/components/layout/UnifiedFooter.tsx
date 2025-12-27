/**
 * UnifiedFooter - Footer unificado para toda la aplicación
 * Combina StoreFooter y MainFooter en un solo componente consistente
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Linkedin, Twitter, Github } from 'lucide-react';
import { ObelixiaLogo } from '@/components/ui/ObelixiaLogo';
import { footerNavigation, quickActions, type NavItem, type NavGroup } from '@/config/navigation';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { RegionalFlag } from '@/components/ui/RegionalFlag';
import { WelcomeLanguageModal } from '@/components/WelcomeLanguageModal';
import { AnimatePresence } from 'framer-motion';

interface UnifiedFooterProps {
  /** Mostrar la sección CTA con botones de acción */
  showCTA?: boolean;
  /** Variante de estilo */
  variant?: 'default' | 'minimal';
}

const UnifiedFooter: React.FC<UnifiedFooterProps> = ({ 
  showCTA = true,
  variant = 'default'
}) => {
  const currentYear = new Date().getFullYear();
  const { t, language } = useLanguage();
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  // Nombres de idiomas para mostrar
  const LANGUAGE_NAMES: Record<string, string> = {
    es: 'Español',
    en: 'English',
    ca: 'Català',
    eu: 'Euskara',
    gl: 'Galego',
    oc: 'Occitan',
    ast: 'Asturianu',
    an: 'Aragonés',
    fr: 'Français',
    de: 'Deutsch',
    pt: 'Português',
    it: 'Italiano',
    'zh-CN': '简体中文',
    'zh-TW': '繁體中文',
    ja: '日本語',
    ko: '한국어',
    ar: 'العربية',
    ru: 'Русский',
    nl: 'Nederlands',
    pl: 'Polski',
    'pt-BR': 'Português (BR)',
    'es-MX': 'Español (MX)',
    'en-US': 'English (US)',
  };

  const currentLanguageName = LANGUAGE_NAMES[language] || 'Language';

  // === Helpers de traducción ===
  const getItemLabel = (item: NavItem): string => {
    if (item.labelKey) {
      const byKey = t(item.labelKey);
      if (byKey !== item.labelKey) return byKey;
    }
    const footerKey = `footer.${item.id}`;
    const byFooterKey = t(footerKey);
    return byFooterKey !== footerKey ? byFooterKey : item.label;
  };

  const getGroupTitle = (group: NavGroup): string => {
    if (group.titleKey) {
      const byKey = t(group.titleKey);
      if (byKey !== group.titleKey) return byKey;
    }
    return group.title;
  };

  const getQuickActionLabel = (action: NavItem): string => {
    if (action.labelKey) {
      const byKey = t(action.labelKey);
      if (byKey !== action.labelKey) return byKey;
    }
    const key = `quickActions.${action.id}`;
    const byKey = t(key);
    return byKey !== key ? byKey : action.label;
  };

  // === Grupos de navegación ===
  const productGroup = footerNavigation.find((g) => g.id === 'productos');
  const solutionsGroup = footerNavigation.find((g) => g.id === 'soluciones');
  const developersGroup = footerNavigation.find((g) => g.id === 'desarrolladores');
  const companyGroup = footerNavigation.find((g) => g.id === 'empresa');
  const legalGroup = footerNavigation.find((g) => g.id === 'legal');

  const navigationGroups = [productGroup, solutionsGroup, developersGroup, companyGroup].filter(Boolean) as NavGroup[];

  // === Componente de grupo de enlaces ===
  const FooterLinkGroup = ({ group }: { group: NavGroup }) => (
    <div>
      <h4 className="font-medium text-slate-200 mb-4">{getGroupTitle(group)}</h4>
      <ul className="space-y-3">
        {group.items.map((item) => (
          <li key={item.id}>
            <Link 
              to={item.href} 
              className="text-slate-400 hover:text-white transition-colors duration-200 text-sm flex items-center gap-2"
            >
              {item.icon && <item.icon className="w-3.5 h-3.5" />}
              {getItemLabel(item)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  // === Redes sociales ===
  const SocialLinks = () => (
    <div className="flex items-center gap-4">
      <a
        href="https://linkedin.com"
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
        aria-label="LinkedIn"
      >
        <Linkedin className="w-4 h-4" />
      </a>
      <a
        href="https://twitter.com"
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
        aria-label="Twitter"
      >
        <Twitter className="w-4 h-4" />
      </a>
      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 rounded-full bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
        aria-label="GitHub"
      >
        <Github className="w-4 h-4" />
      </a>
    </div>
  );

  return (
    <footer className="bg-slate-950 border-t border-slate-800/50">
      {/* CTA Section */}
      {showCTA && (
        <div className="container mx-auto px-6 pt-16">
          <div className="p-8 rounded-2xl bg-gradient-to-r from-emerald-900/30 via-slate-900 to-cyan-900/30 border border-emerald-500/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{t('footer.cta.title')}</h3>
                <p className="text-slate-400">{t('footer.cta.description')}</p>
              </div>
              <div className="flex gap-3">
                {quickActions.slice(0, 2).map((action) => (
                  <Link key={action.id} to={action.href}>
                    <Button
                      variant={action.id === 'demo' ? 'default' : 'outline'}
                      className={
                        action.id === 'demo'
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400'
                          : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      }
                    >
                      {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                      {getQuickActionLabel(action)}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12">
          {/* Brand Section */}
          <div className="col-span-2">
            <Link to="/store" className="inline-block mb-6">
              <ObelixiaLogo size="md" variant="full" animated={false} dark />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
              {t('footer.description')}
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
                {t('footer.location')}
              </div>
            </div>
          </div>

          {/* Navigation Groups */}
          {navigationGroups.map((group) => (
            <FooterLinkGroup key={group.id} group={group} />
          ))}
        </div>
      </div>

      {/* Legal Links Row */}
      {legalGroup && (
        <div className="border-t border-slate-800/50">
          <div className="container mx-auto px-6 py-6">
            <div className="flex flex-wrap justify-center gap-6">
              {legalGroup.items.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {getItemLabel(item)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <div className="border-t border-slate-800/50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-slate-500">
              {t('footer.copyright').replace('{year}', String(currentYear))}
            </p>
            
            <div className="flex items-center gap-6">
              {/* Language Selector Link */}
              <button
                onClick={() => setIsLanguageModalOpen(true)}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label={`Idioma actual: ${currentLanguageName}. Clic para cambiar`}
              >
                <RegionalFlag code={language} size="sm" />
                <span>{currentLanguageName}</span>
              </button>
              
              <SocialLinks />
            </div>
          </div>
        </div>
      </div>

      {/* Language Modal */}
      <AnimatePresence>
        {isLanguageModalOpen && (
          <WelcomeLanguageModal
            mode="selector"
            isOpen={isLanguageModalOpen}
            onOpenChange={setIsLanguageModalOpen}
          />
        )}
      </AnimatePresence>
    </footer>
  );
};

export default UnifiedFooter;
