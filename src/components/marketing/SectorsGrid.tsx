import React from 'react';
import { Landmark, Shield, BarChart3 } from 'lucide-react';
import { SectorCard } from './SectorCard';

const sectors = [
  {
    icon: Landmark,
    title: "Banca",
    description: "Gestión de carteras, cumplimiento normativo y análisis de riesgo con IA.",
    features: ["Cumplimiento DORA", "Gestión de Mora", "KYC Automatizado", "Reporting EBA"],
    delay: 0,
  },
  {
    icon: Shield,
    title: "Seguros",
    description: "Gestión de pólizas, siniestros y cumplimiento con Solvencia II.",
    features: ["Solvencia II", "Gestión de Siniestros", "Pricing Dinámico", "Fraude Detection"],
    delay: 0.1,
  },
  {
    icon: BarChart3,
    title: "Empresas",
    description: "ERP integrado con gestión financiera y análisis predictivo.",
    features: ["Gestión Financiera", "RRHH Integrado", "Business Intelligence", "Automatización"],
    delay: 0.2,
  },
];

export const SectorsGrid: React.FC = () => {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {sectors.map((sector) => (
        <SectorCard
          key={sector.title}
          icon={sector.icon}
          title={sector.title}
          description={sector.description}
          features={sector.features}
          delay={sector.delay}
        />
      ))}
    </div>
  );
};

export default SectorsGrid;
