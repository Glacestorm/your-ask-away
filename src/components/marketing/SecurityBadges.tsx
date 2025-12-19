import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Shield, ShieldCheck } from 'lucide-react';

interface Certification {
  title: string;
  subtitle: string;
  description: string;
  items: string[];
}

interface SecurityBadgesProps {
  certifications?: Certification[];
}

const defaultCertifications: Certification[] = [
  {
    title: "DORA",
    subtitle: "Digital Operational Resilience Act",
    description: "Cumplimiento completo con el reglamento europeo de resiliencia operativa digital para entidades financieras.",
    items: ["Gestión de riesgos TIC", "Pruebas de resiliencia", "Notificación de incidentes", "Gestión de terceros"]
  },
  {
    title: "NIS2",
    subtitle: "Network and Information Security",
    description: "Cumplimiento con la directiva europea de seguridad de redes y sistemas de información.",
    items: ["Gestión de riesgos", "Respuesta a incidentes", "Continuidad de negocio", "Seguridad de cadena"]
  },
  {
    title: "GDPR",
    subtitle: "General Data Protection Regulation",
    description: "Protección de datos personales según el reglamento europeo.",
    items: ["Consentimiento explícito", "Derecho al olvido", "Portabilidad de datos", "DPO integrado"]
  },
  {
    title: "ENS",
    subtitle: "Esquema Nacional de Seguridad",
    description: "Cumplimiento con el marco de seguridad español para administraciones públicas.",
    items: ["Nivel Alto certificado", "Auditorías periódicas", "Control de accesos", "Cifrado avanzado"]
  },
];

export const SecurityBadges: React.FC<SecurityBadgesProps> = ({ 
  certifications = defaultCertifications 
}) => {
  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        {certifications.map((cert, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4 hover:border-emerald-500/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-400">{cert.title}</h3>
                <p className="text-xs text-slate-500">{cert.subtitle}</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm">{cert.description}</p>
            <ul className="space-y-2">
              {cert.items.map((item, j) => (
                <li key={j} className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-emerald-600/20 via-emerald-500/10 to-emerald-600/20 border border-emerald-500/30 rounded-xl p-8 text-center"
      >
        <Shield className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
        <h3 className="text-2xl font-bold text-white mb-2">
          Seguridad de Nivel Empresarial
        </h3>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Nuestra plataforma cumple con los más altos estándares de seguridad europeos, 
          garantizando la protección de tus datos y la continuidad de tu negocio.
        </p>
      </motion.div>
    </div>
  );
};

export default SecurityBadges;
