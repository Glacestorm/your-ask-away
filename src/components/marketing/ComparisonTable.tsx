import React from 'react';
import { motion } from 'framer-motion';

interface ComparisonRow {
  feature: string;
  obelixia: string;
  crm: string;
  erp: string;
}

interface ComparisonTableProps {
  data?: ComparisonRow[];
}

const defaultData: ComparisonRow[] = [
  { feature: "IA Integrada", obelixia: "✓", crm: "Limitada", erp: "✗" },
  { feature: "Cumplimiento DORA", obelixia: "✓", crm: "✗", erp: "Parcial" },
  { feature: "Implementación", obelixia: "Semanas", crm: "Meses", erp: "Años" },
  { feature: "Coste Total", obelixia: "Bajo", crm: "Medio", erp: "Alto" },
  { feature: "Actualizaciones", obelixia: "Continuas", crm: "Trimestrales", erp: "Anuales" },
  { feature: "Soporte 24/7", obelixia: "✓", crm: "Extra", erp: "Extra" },
  { feature: "Multi-idioma", obelixia: "✓", crm: "Parcial", erp: "Parcial" },
  { feature: "API Abierta", obelixia: "✓", crm: "Limitada", erp: "✗" },
];

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ 
  data = defaultData 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-800/80">
              <th className="text-left p-4 text-white font-semibold">Característica</th>
              <th className="text-center p-4 text-emerald-400 font-bold">Obelixia</th>
              <th className="text-center p-4 text-slate-400">CRMs Tradicionales</th>
              <th className="text-center p-4 text-slate-400">ERPs Legacy</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr 
                key={i} 
                className="border-t border-slate-700/50 hover:bg-slate-800/50 transition-colors"
              >
                <td className="p-4 font-medium text-white">{row.feature}</td>
                <td className="p-4 text-center">
                  <span className={`font-semibold ${
                    row.obelixia === '✓' ? 'text-emerald-400' : 'text-emerald-300'
                  }`}>
                    {row.obelixia}
                  </span>
                </td>
                <td className="p-4 text-center text-slate-400">{row.crm}</td>
                <td className="p-4 text-center text-slate-400">{row.erp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
        <p className="text-lg font-medium text-white">
          Obelixia reduce el tiempo de implementación en un{' '}
          <span className="text-emerald-400 font-bold">70%</span> y el coste total 
          de propiedad en un <span className="text-emerald-400 font-bold">40%</span>
        </p>
      </div>
    </motion.div>
  );
};

export default ComparisonTable;
