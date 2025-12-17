import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle, FileText, Users, Lock, Globe, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StoreFooter from '@/components/store/StoreFooter';

const GDPR: React.FC = () => {
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
              <h1 className="text-3xl font-bold text-white">Cumplimiento RGPD/GDPR</h1>
              <p className="text-slate-400">Última actualización: {lastUpdated}</p>
            </div>
          </div>
          <p className="text-slate-400">
            Información sobre nuestro cumplimiento del Reglamento General de Protección de Datos
          </p>
        </div>

        <div className="prose prose-invert prose-emerald max-w-none space-y-8">
          {/* Compromiso */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">Nuestro Compromiso con el RGPD</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <p>
                En ObelixIA nos tomamos muy en serio la protección de datos personales. 
                Cumplimos con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 
                de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).
              </p>
              <p>
                Como plataforma que presta servicios al sector bancario y financiero, 
                mantenemos los más altos estándares de seguridad y privacidad.
              </p>
            </div>
          </section>

          {/* Medidas implementadas */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">Medidas Implementadas</h2>
            </div>
            <div className="text-slate-300 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    Privacidad por Diseño
                  </h3>
                  <p className="text-sm">
                    La protección de datos está integrada en el desarrollo de todas nuestras 
                    funcionalidades desde su concepción (Art. 25 RGPD).
                  </p>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Minimización de Datos
                  </h3>
                  <p className="text-sm">
                    Solo recopilamos los datos estrictamente necesarios para la 
                    prestación del servicio.
                  </p>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Registro de Actividades
                  </h3>
                  <p className="text-sm">
                    Mantenemos un registro completo de las actividades de tratamiento 
                    conforme al Art. 30 RGPD.
                  </p>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    DPO Designado
                  </h3>
                  <p className="text-sm">
                    Contamos con un Delegado de Protección de Datos accesible 
                    en dpd@obelixia.com.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Sus derechos */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">Sus Derechos RGPD</h2>
            </div>
            <div className="text-slate-300 space-y-4">
              <div className="grid gap-3">
                <div className="flex items-start gap-3 bg-slate-800/50 rounded-lg p-4">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-medium">Derecho de Acceso (Art. 15)</h3>
                    <p className="text-sm">Obtener confirmación de si tratamos sus datos y acceder a ellos.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-800/50 rounded-lg p-4">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-medium">Derecho de Rectificación (Art. 16)</h3>
                    <p className="text-sm">Solicitar la corrección de datos inexactos o incompletos.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-800/50 rounded-lg p-4">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-medium">Derecho de Supresión (Art. 17)</h3>
                    <p className="text-sm">Solicitar la eliminación de sus datos ("derecho al olvido").</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-800/50 rounded-lg p-4">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-medium">Derecho de Limitación (Art. 18)</h3>
                    <p className="text-sm">Solicitar la limitación del tratamiento en ciertos casos.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-800/50 rounded-lg p-4">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-medium">Derecho de Portabilidad (Art. 20)</h3>
                    <p className="text-sm">Recibir sus datos en formato estructurado y transmitirlos a otro responsable.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-800/50 rounded-lg p-4">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-medium">Derecho de Oposición (Art. 21)</h3>
                    <p className="text-sm">Oponerse al tratamiento basado en interés legítimo o fines de marketing.</p>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20 mt-4">
                <p className="text-sm">
                  <strong>¿Cómo ejercer sus derechos?</strong><br />
                  Envíe su solicitud a <strong>dpd@obelixia.com</strong> adjuntando copia de su DNI. 
                  Responderemos en un plazo máximo de 30 días.
                </p>
              </div>
            </div>
          </section>

          {/* Seguridad */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">Medidas de Seguridad (Art. 32)</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <p>Implementamos medidas técnicas y organizativas apropiadas:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Cifrado:</strong> AES-256 para datos en reposo, TLS 1.3 para datos en tránsito</li>
                <li><strong>Pseudonimización:</strong> Cuando es técnicamente viable</li>
                <li><strong>Confidencialidad:</strong> Control de acceso basado en roles (RBAC)</li>
                <li><strong>Integridad:</strong> Auditoría completa de cambios</li>
                <li><strong>Disponibilidad:</strong> Copias de seguridad y plan de continuidad</li>
                <li><strong>Resiliencia:</strong> Cumplimiento DORA y NIS2</li>
              </ul>
            </div>
          </section>

          {/* Transferencias */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">Transferencias Internacionales</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <p>
                Priorizamos el almacenamiento de datos en la Unión Europea. Cuando es 
                necesaria una transferencia a terceros países, garantizamos:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Decisiones de adecuación de la Comisión Europea</li>
                <li>Cláusulas Contractuales Tipo (CCT)</li>
                <li>Certificación DPF (Data Privacy Framework) para EE.UU.</li>
                <li>Evaluaciones de impacto de transferencias (TIA)</li>
              </ul>
            </div>
          </section>

          {/* Brechas de seguridad */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-semibold text-white m-0">Gestión de Brechas de Seguridad</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <p>
                Conforme a los artículos 33 y 34 del RGPD, disponemos de procedimientos 
                para detectar, investigar y notificar brechas de seguridad:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Notificación a la AEPD en un máximo de 72 horas</li>
                <li>Comunicación a los afectados cuando suponga alto riesgo</li>
                <li>Documentación completa del incidente y medidas adoptadas</li>
                <li>Plan de respuesta a incidentes conforme a DORA</li>
              </ul>
            </div>
          </section>

          {/* Evaluación de impacto */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">Evaluaciones de Impacto (EIPD)</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <p>
                Realizamos Evaluaciones de Impacto relativas a la Protección de Datos (Art. 35) 
                cuando el tratamiento pueda entrañar alto riesgo, especialmente:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Tratamiento a gran escala de categorías especiales de datos</li>
                <li>Evaluación sistemática de aspectos personales (perfilado)</li>
                <li>Nuevas tecnologías que puedan afectar a derechos fundamentales</li>
                <li>Uso de inteligencia artificial en decisiones automatizadas</li>
              </ul>
            </div>
          </section>

          {/* Contacto */}
          <section className="bg-emerald-500/10 rounded-xl p-6 border border-emerald-500/20">
            <h2 className="text-xl font-semibold text-white mb-4">Delegado de Protección de Datos</h2>
            <div className="text-slate-300">
              <p>Para cualquier consulta relacionada con el RGPD:</p>
              <p className="mt-2">
                <strong>Email DPO:</strong> dpd@obelixia.com<br />
                <strong>Email general:</strong> jfernandez@obelixia.com<br />
                <strong>Teléfono:</strong> +34 606 770 033
              </p>
              <p className="mt-4">
                Si considera que sus derechos no han sido debidamente atendidos, puede presentar 
                una reclamación ante la <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Agencia Española de Protección de Datos (AEPD)</a>.
              </p>
            </div>
          </section>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
};

export default GDPR;
