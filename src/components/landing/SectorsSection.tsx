import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Lightbulb, Building2, CreditCard, GraduationCap, Briefcase, Factory, HeartPulse } from 'lucide-react';

interface SectorCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  delay?: number;
}

const SectorCard: React.FC<SectorCardProps> = ({ icon: Icon, title, description, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ y: -5, scale: 1.02 }}
    className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/30 rounded-2xl p-6 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 cursor-pointer"
  >
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0 group-hover:from-blue-500/30 group-hover:to-violet-500/30 transition-colors">
        <Icon className="w-6 h-6 text-blue-400" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  </motion.div>
);

const sectors = [
  {
    icon: ShoppingCart,
    title: 'E-COMMERCE',
    description: 'Envía cupones, acompaña frecuencia de compra y conecta tu cliente por múltiples canales.',
  },
  {
    icon: Lightbulb,
    title: 'INFOPRODUCTORES',
    description: 'Automatiza CPLs, agendamientos y ventas vía WhatsApp e Instagram.',
  },
  {
    icon: Building2,
    title: 'AGENCIAS Y NEGOCIOS LOCALES',
    description: 'Ten control de múltiples proyectos con funnels y automatizaciones independientes.',
  },
  {
    icon: CreditCard,
    title: 'SUSCRIPCIONES',
    description: 'Monitorea renovaciones, upsells y relacionamiento con clientes recurrentes.',
  },
  {
    icon: GraduationCap,
    title: 'EDUCACIÓN Y CURSOS ONLINE',
    description: 'Clases, leads y atendimiento en un solo lugar con mensajería y datos integrados.',
  },
  {
    icon: Briefcase,
    title: 'BANCA Y FINANZAS',
    description: 'CRM bancario con compliance GDPR, PSD2 y gestión de patrimonios.',
  },
  {
    icon: Factory,
    title: 'MANUFACTURA',
    description: 'Cadena de suministro, producción y gestión de clientes B2B integrada.',
  },
  {
    icon: HeartPulse,
    title: 'SALUD Y CLÍNICAS',
    description: 'Gestión de pacientes, citas y seguimiento con protección de datos sanitarios.',
  },
];

export const SectorsSection: React.FC = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c1222] via-slate-950 to-[#0c1222]" />
      
      {/* Gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-600/10 via-violet-600/10 to-blue-600/10 rounded-full blur-[200px]" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-400 mb-6">
            Multi-sector
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            De lanzamientos a e-commerce.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              De tiendas físicas a consultorios.
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Si vendes, atiendes, integras o escalas con datos, ObelixIA es para ti.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sectors.map((sector, index) => (
            <SectorCard
              key={sector.title}
              {...sector}
              delay={index * 0.05}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SectorsSection;
