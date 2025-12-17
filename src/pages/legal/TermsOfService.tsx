import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Scale, Shield, AlertTriangle, Users, CreditCard, Ban, RefreshCw, Gavel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StoreFooter from '@/components/store/StoreFooter';

const TermsOfService: React.FC = () => {
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
              <FileText className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Términos y Condiciones de Servicio</h1>
              <p className="text-slate-400">Última actualización: {lastUpdated}</p>
            </div>
          </div>
        </div>

        <div className="prose prose-invert prose-emerald max-w-none space-y-8">
          {/* Identificación */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">1. Identificación del Prestador</h2>
            </div>
            <div className="text-slate-300 space-y-2">
              <p><strong>Denominación Social:</strong> ObelixIA Technologies S.L.</p>
              <p><strong>NIF:</strong> B-XXXXXXXX</p>
              <p><strong>Domicilio Social:</strong> León, España</p>
              <p><strong>Email:</strong> jfernandez@obelixia.com</p>
              <p><strong>Teléfono:</strong> +34 606 770 033</p>
              <p><strong>Inscrita en:</strong> Registro Mercantil de León</p>
            </div>
          </section>

          {/* Objeto */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">2. Objeto y Ámbito de Aplicación</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <p>
                Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma ObelixIA 
                (en adelante, "la Plataforma"), un software de gestión empresarial con inteligencia artificial 
                integrada destinado a empresas del sector bancario, financiero y comercial.
              </p>
              <p>
                El acceso y uso de la Plataforma atribuye la condición de Usuario e implica la aceptación 
                plena y sin reservas de todas y cada una de las disposiciones incluidas en estos Términos.
              </p>
              <p>
                ObelixIA se reserva el derecho de modificar en cualquier momento la presentación, 
                configuración y contenido de la Plataforma, así como las condiciones requeridas para su acceso y/o uso.
              </p>
            </div>
          </section>

          {/* Servicios */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">3. Descripción de los Servicios</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <p>ObelixIA proporciona los siguientes servicios:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>CRM Bancario Inteligente:</strong> Gestión de cartera de clientes empresariales</li>
                <li><strong>Análisis Financiero:</strong> Balances, cuentas de resultados, ratios sectoriales</li>
                <li><strong>Gestión de Visitas:</strong> Planificación y seguimiento de actividad comercial</li>
                <li><strong>Cumplimiento Normativo:</strong> DORA, NIS2, ISO 27001, GDPR, MiFID II</li>
                <li><strong>IA Integrada:</strong> Asistente virtual, análisis predictivo, automatizaciones</li>
                <li><strong>Módulos Sectoriales:</strong> Adaptados por código CNAE</li>
              </ul>
              <p>
                Los servicios se prestan en modalidad SaaS (Software as a Service), On-Premise o Híbrido, 
                según el plan contratado por el Cliente.
              </p>
            </div>
          </section>

          {/* Condiciones de Acceso */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">4. Condiciones de Acceso y Uso</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <h3 className="text-lg font-medium text-white">4.1 Requisitos del Usuario</h3>
              <p>El Usuario declara ser mayor de edad y disponer de capacidad legal suficiente para vincularse por estos Términos.</p>
              
              <h3 className="text-lg font-medium text-white">4.2 Registro y Cuenta</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>El Usuario debe proporcionar información veraz y actualizada</li>
                <li>Es responsable de mantener la confidencialidad de sus credenciales</li>
                <li>Debe notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
              </ul>

              <h3 className="text-lg font-medium text-white">4.3 Uso Permitido</h3>
              <p>El Usuario se compromete a utilizar la Plataforma conforme a la ley, la moral, el orden público y los presentes Términos.</p>
            </div>
          </section>

          {/* Prohibiciones */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Ban className="w-5 h-5 text-red-400" />
              <h2 className="text-xl font-semibold text-white m-0">5. Conductas Prohibidas</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <p>Queda expresamente prohibido:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Realizar ingeniería inversa, descompilar o desensamblar el software</li>
                <li>Sublicenciar, vender o redistribuir la Plataforma sin autorización</li>
                <li>Utilizar la Plataforma para actividades ilegales o fraudulentas</li>
                <li>Introducir virus, malware o código malicioso</li>
                <li>Intentar acceder a sistemas o datos sin autorización</li>
                <li>Sobrecargar intencionadamente los servidores</li>
                <li>Compartir credenciales de acceso con terceros no autorizados</li>
                <li>Extraer datos de forma masiva (scraping) sin consentimiento</li>
              </ul>
            </div>
          </section>

          {/* Precios y Pagos */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">6. Precios y Condiciones de Pago</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <h3 className="text-lg font-medium text-white">6.1 Precios</h3>
              <p>Los precios de los servicios serán los vigentes en el momento de la contratación, expresados en euros e incluyendo el IVA aplicable.</p>

              <h3 className="text-lg font-medium text-white">6.2 Facturación</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Las licencias perpetuas se facturan en un único pago</li>
                <li>Las suscripciones se facturan mensual o anualmente según el plan</li>
                <li>Los módulos adicionales se facturan según tarifa vigente</li>
              </ul>

              <h3 className="text-lg font-medium text-white">6.3 Formas de Pago</h3>
              <p>Aceptamos tarjeta de crédito/débito, transferencia bancaria y domiciliación SEPA.</p>

              <h3 className="text-lg font-medium text-white">6.4 Impago</h3>
              <p>El impago de cualquier cantidad debida facultará a ObelixIA para suspender el acceso a la Plataforma hasta regularizar la situación.</p>
            </div>
          </section>

          {/* Propiedad Intelectual */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">7. Propiedad Intelectual e Industrial</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <p>
                Todos los derechos de propiedad intelectual e industrial sobre la Plataforma, incluyendo 
                código fuente, diseño, estructura, bases de datos, logos, marcas y contenidos, son 
                titularidad exclusiva de ObelixIA Technologies S.L. o sus licenciantes.
              </p>
              <p>
                La contratación de los servicios no supone cesión alguna de derechos de propiedad 
                intelectual, sino únicamente una licencia de uso no exclusiva, limitada al territorio 
                y duración acordados.
              </p>
              <p>
                Los datos introducidos por el Usuario en la Plataforma seguirán siendo propiedad del Usuario.
              </p>
            </div>
          </section>

          {/* Protección de Datos */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">8. Protección de Datos</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <p>
                El tratamiento de datos personales se rige por nuestra{' '}
                <Link to="/privacy" className="text-emerald-400 hover:underline">Política de Privacidad</Link>, 
                conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
              </p>
              <p>
                Cuando ObelixIA actúe como Encargado del Tratamiento de datos del Cliente, se formalizará 
                el correspondiente Contrato de Encargo de Tratamiento conforme al artículo 28 del RGPD.
              </p>
            </div>
          </section>

          {/* Garantías y Limitación */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-semibold text-white m-0">9. Garantías y Limitación de Responsabilidad</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <h3 className="text-lg font-medium text-white">9.1 Disponibilidad</h3>
              <p>ObelixIA se compromete a mantener una disponibilidad del servicio del 99.5% mensual, excluyendo mantenimientos programados.</p>

              <h3 className="text-lg font-medium text-white">9.2 Limitación de Responsabilidad</h3>
              <p>ObelixIA no será responsable de:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Daños indirectos, incidentales o consecuentes</li>
                <li>Pérdida de beneficios, datos o interrupción de negocio</li>
                <li>Fallos derivados de causas de fuerza mayor</li>
                <li>Uso inadecuado de la Plataforma por el Usuario</li>
              </ul>
              <p>
                La responsabilidad máxima de ObelixIA estará limitada al importe abonado por el Cliente 
                en los 12 meses anteriores al evento causante del daño.
              </p>
            </div>
          </section>

          {/* Duración y Resolución */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">10. Duración y Resolución</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <h3 className="text-lg font-medium text-white">10.1 Duración</h3>
              <p>El contrato tendrá la duración especificada en el plan contratado, renovándose automáticamente por períodos iguales salvo comunicación en contrario.</p>

              <h3 className="text-lg font-medium text-white">10.2 Causas de Resolución</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Por voluntad del Usuario, comunicándolo con 30 días de antelación</li>
                <li>Por incumplimiento grave de cualquiera de las partes</li>
                <li>Por impago durante más de 30 días</li>
                <li>Por cese de actividad de cualquiera de las partes</li>
              </ul>

              <h3 className="text-lg font-medium text-white">10.3 Efectos de la Resolución</h3>
              <p>Tras la resolución, el Usuario dispondrá de 30 días para exportar sus datos. Transcurrido este plazo, ObelixIA procederá a su eliminación segura.</p>
            </div>
          </section>

          {/* Ley Aplicable */}
          <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Gavel className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white m-0">11. Legislación Aplicable y Jurisdicción</h2>
            </div>
            <div className="text-slate-300 space-y-3">
              <p>
                Los presentes Términos se rigen por la legislación española. En particular:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información (LSSI-CE)</li>
                <li>Real Decreto Legislativo 1/2007, de 16 de noviembre, Ley General de Consumidores y Usuarios</li>
                <li>Reglamento (UE) 2016/679 (RGPD)</li>
                <li>Ley Orgánica 3/2018, de 5 de diciembre (LOPDGDD)</li>
              </ul>
              <p>
                Para la resolución de cualquier controversia, las partes se someten a los Juzgados y 
                Tribunales de León (España), con renuncia expresa a cualquier otro fuero que pudiera corresponderles.
              </p>
            </div>
          </section>

          {/* Contacto */}
          <section className="bg-emerald-500/10 rounded-xl p-6 border border-emerald-500/20">
            <h2 className="text-xl font-semibold text-white mb-4">Contacto</h2>
            <div className="text-slate-300">
              <p>Para cualquier consulta sobre estos Términos, puede contactarnos en:</p>
              <p className="mt-2">
                <strong>Email:</strong> jfernandez@obelixia.com<br />
                <strong>Teléfono:</strong> +34 606 770 033<br />
                <strong>Dirección:</strong> León, España
              </p>
            </div>
          </section>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
};

export default TermsOfService;
