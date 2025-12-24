import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Users, Database, Lock, Eye, Mail, Globe, FileText, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UnifiedFooter from '@/components/layout/UnifiedFooter';

const PrivacyPolicy: React.FC = () => {
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
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Política de Privacidad</h1>
              <p className="text-slate-400">Última actualización: {lastUpdated}</p>
            </div>
          </div>
          <p className="text-slate-400">
            Conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD)
          </p>
        </div>

        <div className="prose prose-invert prose-emerald max-w-none space-y-8">
          {/* Responsable */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">1. Responsable del Tratamiento</h2>
            </div>
            <div className="text-slate-300 space-y-2">
              <p><strong>Identidad:</strong> ObelixIA Technologies S.L.</p>
              <p><strong>NIF:</strong> B-XXXXXXXX</p>
              <p><strong>Dirección:</strong> León, España</p>
              <p><strong>Email:</strong> jfernandez@obelixia.com</p>
              <p><strong>Teléfono:</strong> +34 606 770 033</p>
              <p><strong>Delegado de Protección de Datos (DPO):</strong> dpd@obelixia.com</p>
            </div>
          </section>

          {/* Datos Recogidos */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">2. Datos Personales que Recopilamos</h2>
            </div>
            <div className="text-slate-300 space-y-4">
              <h3 className="text-lg font-medium text-white">2.1 Datos proporcionados directamente:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Datos identificativos:</strong> nombre, apellidos, DNI/NIF, cargo</li>
                <li><strong>Datos de contacto:</strong> email, teléfono, dirección postal</li>
                <li><strong>Datos profesionales:</strong> empresa, sector, puesto</li>
                <li><strong>Datos de facturación:</strong> datos fiscales, método de pago</li>
              </ul>

              <h3 className="text-lg font-medium text-white">2.2 Datos recopilados automáticamente:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, dispositivo</li>
                <li><strong>Datos de uso:</strong> páginas visitadas, tiempo de sesión, acciones realizadas</li>
                <li><strong>Cookies:</strong> según nuestra <Link to="/cookies" className="text-emerald-400 hover:underline">Política de Cookies</Link></li>
              </ul>

              <h3 className="text-lg font-medium text-white">2.3 Datos de terceros:</h3>
              <p>Datos de empresas clientes introducidos por los usuarios en el marco de la prestación del servicio (actuando ObelixIA como Encargado del Tratamiento).</p>
            </div>
          </section>

          {/* Finalidades */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">3. Finalidades del Tratamiento</h2>
            </div>
            <div className="text-slate-300">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-white">Finalidad</th>
                    <th className="text-left py-2 text-white">Base Legal</th>
                    <th className="text-left py-2 text-white">Conservación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="py-2">Gestión de la relación contractual</td>
                    <td className="py-2">Ejecución de contrato (Art. 6.1.b RGPD)</td>
                    <td className="py-2">Duración del contrato + 5 años</td>
                  </tr>
                  <tr>
                    <td className="py-2">Facturación y cobro</td>
                    <td className="py-2">Obligación legal (Art. 6.1.c RGPD)</td>
                    <td className="py-2">6 años (Ley tributaria)</td>
                  </tr>
                  <tr>
                    <td className="py-2">Soporte técnico</td>
                    <td className="py-2">Ejecución de contrato (Art. 6.1.b RGPD)</td>
                    <td className="py-2">Duración del contrato + 2 años</td>
                  </tr>
                  <tr>
                    <td className="py-2">Comunicaciones comerciales</td>
                    <td className="py-2">Consentimiento (Art. 6.1.a RGPD)</td>
                    <td className="py-2">Hasta revocación</td>
                  </tr>
                  <tr>
                    <td className="py-2">Mejora del servicio y análisis</td>
                    <td className="py-2">Interés legítimo (Art. 6.1.f RGPD)</td>
                    <td className="py-2">26 meses (datos anonimizados)</td>
                  </tr>
                  <tr>
                    <td className="py-2">Cumplimiento normativo (DORA, NIS2)</td>
                    <td className="py-2">Obligación legal (Art. 6.1.c RGPD)</td>
                    <td className="py-2">Según normativa aplicable</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Derechos */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">4. Derechos del Interesado</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <p>Conforme al RGPD, usted tiene derecho a:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Acceso:</strong> Obtener confirmación de si tratamos sus datos y acceder a ellos</li>
                <li><strong>Rectificación:</strong> Solicitar la corrección de datos inexactos</li>
                <li><strong>Supresión:</strong> Solicitar la eliminación de sus datos ("derecho al olvido")</li>
                <li><strong>Limitación:</strong> Solicitar la limitación del tratamiento en ciertos casos</li>
                <li><strong>Portabilidad:</strong> Recibir sus datos en formato estructurado y transmitirlos</li>
                <li><strong>Oposición:</strong> Oponerse al tratamiento en determinadas circunstancias</li>
                <li><strong>No decisiones automatizadas:</strong> No ser objeto de decisiones basadas únicamente en tratamiento automatizado</li>
              </ul>
              <p className="mt-4">
                Para ejercer estos derechos, envíe solicitud a <strong>dpd@obelixia.com</strong> acompañada de copia de DNI.
              </p>
              <p>
                Si considera que sus derechos no han sido debidamente atendidos, puede presentar reclamación ante la 
                <strong> Agencia Española de Protección de Datos (AEPD)</strong>: <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">www.aepd.es</a>
              </p>
            </div>
          </section>

          {/* Destinatarios */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">5. Destinatarios de los Datos</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <p>Sus datos podrán ser comunicados a:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Administraciones Públicas:</strong> Cuando exista obligación legal</li>
                <li><strong>Entidades financieras:</strong> Para la gestión de pagos</li>
                <li><strong>Proveedores de servicios:</strong> Con contrato de encargo de tratamiento</li>
              </ul>
              
              <h3 className="text-lg font-medium text-white mt-4">Proveedores principales:</h3>
              <table className="w-full text-sm mt-2">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-white">Proveedor</th>
                    <th className="text-left py-2 text-white">Servicio</th>
                    <th className="text-left py-2 text-white">Ubicación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="py-2">Supabase Inc.</td>
                    <td className="py-2">Base de datos y autenticación</td>
                    <td className="py-2">UE (Frankfurt)</td>
                  </tr>
                  <tr>
                    <td className="py-2">Stripe</td>
                    <td className="py-2">Procesamiento de pagos</td>
                    <td className="py-2">UE</td>
                  </tr>
                  <tr>
                    <td className="py-2">Google Cloud (Gemini AI)</td>
                    <td className="py-2">Inteligencia artificial</td>
                    <td className="py-2">UE</td>
                  </tr>
                  <tr>
                    <td className="py-2">Resend</td>
                    <td className="py-2">Envío de emails</td>
                    <td className="py-2">UE</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Transferencias Internacionales */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">6. Transferencias Internacionales</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <p>
                Priorizamos proveedores con servidores en la Unión Europea. En caso de transferencias 
                a terceros países, garantizamos las siguientes salvaguardas:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Decisión de adecuación de la Comisión Europea</li>
                <li>Cláusulas Contractuales Tipo (CCT) de la Comisión Europea</li>
                <li>Certificación bajo el Marco de Privacidad de Datos UE-EE.UU. (DPF)</li>
              </ul>
            </div>
          </section>

          {/* Seguridad */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">7. Medidas de Seguridad</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <p>Implementamos medidas técnicas y organizativas conforme al artículo 32 del RGPD:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Cifrado:</strong> AES-256 para datos en reposo, TLS 1.3 para datos en tránsito</li>
                <li><strong>Control de acceso:</strong> Autenticación multifactor (MFA/WebAuthn)</li>
                <li><strong>Auditoría:</strong> Registro de accesos y modificaciones</li>
                <li><strong>Copias de seguridad:</strong> Backups cifrados con retención de 30 días</li>
                <li><strong>Certificaciones:</strong> ISO 27001, SOC 2 Type II (en proceso)</li>
                <li><strong>Cumplimiento:</strong> DORA, NIS2, PSD2/PSD3</li>
              </ul>
            </div>
          </section>

          {/* Menores */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">8. Datos de Menores</h2>
            </div>
            <div className="text-slate-300">
              <p>
                Nuestros servicios están dirigidos exclusivamente a profesionales y empresas. 
                No recopilamos intencionadamente datos de menores de 16 años. Si detectamos 
                que hemos recogido datos de un menor, procederemos a su eliminación inmediata.
              </p>
            </div>
          </section>

          {/* Modificaciones */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">9. Modificaciones de la Política</h2>
            </div>
            <div className="text-slate-300">
              <p>
                Nos reservamos el derecho de modificar esta Política para adaptarla a novedades 
                legislativas o jurisprudenciales. Los cambios significativos serán notificados 
                por email con al menos 30 días de antelación.
              </p>
            </div>
          </section>

          {/* Contacto */}
          <section className="bg-emerald-500/10 rounded-xl p-6 border border-emerald-500/20">
            <h2 className="text-xl font-semibold text-white mb-4">Contacto del DPO</h2>
            <div className="text-slate-300">
              <p>Para cualquier consulta sobre protección de datos:</p>
              <p className="mt-2">
                <strong>Delegado de Protección de Datos:</strong> dpd@obelixia.com<br />
                <strong>Email general:</strong> jfernandez@obelixia.com<br />
                <strong>Teléfono:</strong> +34 606 770 033
              </p>
            </div>
          </section>
        </div>
      </main>

      <UnifiedFooter />
    </div>
  );
};

export default PrivacyPolicy;
