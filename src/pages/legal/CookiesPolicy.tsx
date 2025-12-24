import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie, Settings, BarChart3, Shield, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UnifiedFooter from '@/components/layout/UnifiedFooter';

const CookiesPolicy: React.FC = () => {
  const lastUpdated = "17 de diciembre de 2024";

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

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <Cookie className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Política de Cookies</h1>
              <p className="text-slate-400">Última actualización: {lastUpdated}</p>
            </div>
          </div>
          <p className="text-slate-400">
            Conforme a la Ley 34/2002 (LSSI-CE) y el Reglamento (UE) 2016/679 (RGPD)
          </p>
        </div>

        <div className="prose prose-invert prose-emerald max-w-none space-y-8">
          {/* Qué son las cookies */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">1. ¿Qué son las Cookies?</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <p>
                Las cookies son pequeños archivos de texto que se almacenan en su dispositivo 
                (ordenador, tablet, smartphone) cuando visita un sitio web. Permiten que el 
                sitio recuerde sus acciones y preferencias durante un período de tiempo.
              </p>
              <p>
                Las cookies pueden ser "propias" (establecidas por el sitio que visita) o 
                "de terceros" (establecidas por otros dominios).
              </p>
            </div>
          </section>

          {/* Tipos de cookies */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Cookie className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">2. Tipos de Cookies que Utilizamos</h2>
            </div>
            <div className="text-slate-300 space-y-4">
              <h3 className="text-lg font-medium text-white">2.1 Cookies Técnicas (Necesarias)</h3>
              <p>Son esenciales para el funcionamiento del sitio. No requieren consentimiento.</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-white">Cookie</th>
                    <th className="text-left py-2 text-white">Finalidad</th>
                    <th className="text-left py-2 text-white">Duración</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="py-2">sb-access-token</td>
                    <td className="py-2">Autenticación de usuario</td>
                    <td className="py-2">Sesión</td>
                  </tr>
                  <tr>
                    <td className="py-2">sb-refresh-token</td>
                    <td className="py-2">Renovación de sesión</td>
                    <td className="py-2">7 días</td>
                  </tr>
                  <tr>
                    <td className="py-2">obelixia-theme</td>
                    <td className="py-2">Preferencia de tema (claro/oscuro)</td>
                    <td className="py-2">1 año</td>
                  </tr>
                  <tr>
                    <td className="py-2">obelixia-lang</td>
                    <td className="py-2">Preferencia de idioma</td>
                    <td className="py-2">1 año</td>
                  </tr>
                  <tr>
                    <td className="py-2">cookie-consent</td>
                    <td className="py-2">Registro de consentimiento de cookies</td>
                    <td className="py-2">1 año</td>
                  </tr>
                </tbody>
              </table>

              <h3 className="text-lg font-medium text-white mt-6">2.2 Cookies de Preferencias</h3>
              <p>Permiten recordar sus preferencias y personalizar su experiencia.</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-white">Cookie</th>
                    <th className="text-left py-2 text-white">Finalidad</th>
                    <th className="text-left py-2 text-white">Duración</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="py-2">obelixia-sidebar</td>
                    <td className="py-2">Estado del menú lateral</td>
                    <td className="py-2">30 días</td>
                  </tr>
                  <tr>
                    <td className="py-2">obelixia-map-view</td>
                    <td className="py-2">Preferencias de vista del mapa</td>
                    <td className="py-2">30 días</td>
                  </tr>
                  <tr>
                    <td className="py-2">obelixia-dashboard</td>
                    <td className="py-2">Configuración del dashboard</td>
                    <td className="py-2">30 días</td>
                  </tr>
                </tbody>
              </table>

              <h3 className="text-lg font-medium text-white mt-6">2.3 Cookies Analíticas</h3>
              <p>Nos ayudan a entender cómo interactúan los usuarios con el sitio.</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-white">Cookie</th>
                    <th className="text-left py-2 text-white">Proveedor</th>
                    <th className="text-left py-2 text-white">Finalidad</th>
                    <th className="text-left py-2 text-white">Duración</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="py-2">_ga</td>
                    <td className="py-2">Google Analytics</td>
                    <td className="py-2">Distinguir usuarios</td>
                    <td className="py-2">2 años</td>
                  </tr>
                  <tr>
                    <td className="py-2">_gid</td>
                    <td className="py-2">Google Analytics</td>
                    <td className="py-2">Distinguir usuarios</td>
                    <td className="py-2">24 horas</td>
                  </tr>
                  <tr>
                    <td className="py-2">_gat</td>
                    <td className="py-2">Google Analytics</td>
                    <td className="py-2">Limitar tasa de solicitudes</td>
                    <td className="py-2">1 minuto</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Base legal */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">3. Base Legal</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Cookies técnicas:</strong> Interés legítimo (Art. 6.1.f RGPD) - Son necesarias para el funcionamiento del servicio</li>
                <li><strong>Cookies de preferencias:</strong> Consentimiento (Art. 6.1.a RGPD)</li>
                <li><strong>Cookies analíticas:</strong> Consentimiento (Art. 6.1.a RGPD)</li>
              </ul>
            </div>
          </section>

          {/* Gestión de cookies */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">4. Gestión de Cookies</h2>
            </div>
            <div className="text-slate-300 space-y-4">
              <h3 className="text-lg font-medium text-white">4.1 Panel de Configuración</h3>
              <p>
                Puede gestionar sus preferencias de cookies en cualquier momento a través del 
                panel de configuración de cookies accesible desde el banner inferior o desde 
                el pie de página del sitio.
              </p>

              <h3 className="text-lg font-medium text-white">4.2 Configuración del Navegador</h3>
              <p>También puede configurar su navegador para gestionar cookies:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Google Chrome</a></li>
                <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Mozilla Firefox</a></li>
                <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Safari</a></li>
                <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Microsoft Edge</a></li>
              </ul>

              <h3 className="text-lg font-medium text-white">4.3 Opt-out de Analíticas</h3>
              <p>
                Puede desactivar Google Analytics instalando el{' '}
                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                  complemento de inhabilitación de Google Analytics
                </a>.
              </p>
            </div>
          </section>

          {/* Consecuencias */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">5. Consecuencias de Desactivar Cookies</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <p>Si desactiva las cookies:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Cookies técnicas:</strong> Algunas funcionalidades del sitio podrían no funcionar correctamente</li>
                <li><strong>Cookies de preferencias:</strong> Deberá configurar sus preferencias en cada visita</li>
                <li><strong>Cookies analíticas:</strong> No afectará a su experiencia, pero no podremos mejorar el servicio basándonos en patrones de uso</li>
              </ul>
            </div>
          </section>

          {/* Actualizaciones */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">6. Actualizaciones de esta Política</h2>
            </div>
            <div className="text-slate-300">
              <p>
                Esta Política de Cookies puede ser actualizada periódicamente para reflejar 
                cambios en las cookies que utilizamos o por otros motivos operativos, legales 
                o regulatorios. Le recomendamos revisar esta página regularmente.
              </p>
            </div>
          </section>

          {/* Contacto */}
          <section className="bg-emerald-500/10 rounded-xl p-6 border border-emerald-500/20">
            <h2 className="text-xl font-semibold text-white mb-4">Contacto</h2>
            <div className="text-slate-300">
              <p>Para cualquier consulta sobre nuestra Política de Cookies:</p>
              <p className="mt-2">
                <strong>Email:</strong> jfernandez@obelixia.com<br />
                <strong>Teléfono:</strong> +34 606 770 033<br />
                <strong>DPO:</strong> dpd@obelixia.com
              </p>
            </div>
          </section>
        </div>
      </main>

      <UnifiedFooter />
    </div>
  );
};

export default CookiesPolicy;
