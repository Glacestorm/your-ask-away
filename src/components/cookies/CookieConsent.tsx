import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';

interface CookiePreferences {
  necessary: boolean;
  preferences: boolean;
  analytics: boolean;
}

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    preferences: false,
    analytics: false
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const savePreferences = (acceptAll: boolean = false) => {
    const finalPreferences = acceptAll 
      ? { necessary: true, preferences: true, analytics: true }
      : preferences;
    
    localStorage.setItem('cookie-consent', JSON.stringify({
      ...finalPreferences,
      timestamp: new Date().toISOString()
    }));
    
    setIsVisible(false);
  };

  const rejectAll = () => {
    const minimalPreferences = { necessary: true, preferences: false, analytics: false };
    localStorage.setItem('cookie-consent', JSON.stringify({
      ...minimalPreferences,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4"
      >
        <div className="container mx-auto max-w-4xl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            {!showSettings ? (
              // Main Banner
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-500/10 rounded-lg flex-shrink-0">
                    <Cookie className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Utilizamos cookies
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Usamos cookies propias y de terceros para mejorar tu experiencia, analizar el tráfico 
                      y personalizar el contenido. Puedes aceptar todas, rechazarlas o configurar tus preferencias.
                      Más información en nuestra{' '}
                      <Link to="/cookies" className="text-emerald-400 hover:underline">
                        Política de Cookies
                      </Link>.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button 
                        onClick={() => savePreferences(true)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Aceptar todas
                      </Button>
                      <Button 
                        onClick={rejectAll}
                        variant="outline" 
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        Rechazar
                      </Button>
                      <Button 
                        onClick={() => setShowSettings(true)}
                        variant="ghost" 
                        className="text-slate-400 hover:text-white"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configurar
                      </Button>
                    </div>
                  </div>
                  <button 
                    onClick={rejectAll}
                    className="text-slate-500 hover:text-white p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              // Settings Panel
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Configuración de Cookies</h3>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="text-slate-500 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Necessary */}
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-white">Cookies Necesarias</h4>
                      <p className="text-sm text-slate-400">
                        Esenciales para el funcionamiento del sitio. No pueden desactivarse.
                      </p>
                    </div>
                    <Switch checked={true} disabled className="opacity-50" />
                  </div>

                  {/* Preferences */}
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-white">Cookies de Preferencias</h4>
                      <p className="text-sm text-slate-400">
                        Permiten recordar tus preferencias y personalizar tu experiencia.
                      </p>
                    </div>
                    <Switch 
                      checked={preferences.preferences}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, preferences: checked })}
                    />
                  </div>

                  {/* Analytics */}
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-white">Cookies Analíticas</h4>
                      <p className="text-sm text-slate-400">
                        Nos ayudan a entender cómo usas el sitio para mejorarlo.
                      </p>
                    </div>
                    <Switch 
                      checked={preferences.analytics}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, analytics: checked })}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => savePreferences(false)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    Guardar preferencias
                  </Button>
                  <Button 
                    onClick={() => savePreferences(true)}
                    variant="outline" 
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Aceptar todas
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CookieConsent;
