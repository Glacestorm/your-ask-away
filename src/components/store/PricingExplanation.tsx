import React from 'react';
import { motion } from 'framer-motion';
import { Info, Shield, Clock, Infinity, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PricingBadgeProps {
  type: 'annual' | 'perpetual';
  showVat?: boolean;
}

export const PricingBadge: React.FC<PricingBadgeProps> = ({ type, showVat = true }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 cursor-help">
            {type === 'perpetual' ? (
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                <Infinity className="w-3 h-3 mr-1" />
                Perpetua
              </Badge>
            ) : (
              <span className="text-xs text-slate-400">/año</span>
            )}
            {showVat && <span className="text-[10px] text-slate-500 ml-1">SIN IVA</span>}
            <HelpCircle className="w-3 h-3 text-slate-500" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-slate-800 border-slate-700">
          {type === 'perpetual' ? (
            <div className="space-y-2">
              <p className="font-semibold text-amber-300">Licencia Perpetua</p>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• <strong>Pago único:</strong> Sin renovaciones anuales</li>
                <li>• <strong>Propiedad total:</strong> El software es tuyo para siempre</li>
                <li>• <strong>Actualizaciones:</strong> Incluidas durante 5 años</li>
                <li>• <strong>Soporte:</strong> 24/7 durante 2 años incluido</li>
                <li>• <strong>Código fuente:</strong> Acceso completo (Enterprise)</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-semibold text-emerald-300">Licencia Anual</p>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• <strong>Renovación:</strong> Pago anual mientras uses el servicio</li>
                <li>• <strong>Actualizaciones:</strong> Todas incluidas</li>
                <li>• <strong>Soporte:</strong> 24/7 incluido</li>
                <li>• <strong>Flexibilidad:</strong> Cancela cuando quieras</li>
                <li>• <strong>Cloud:</strong> Infraestructura incluida</li>
              </ul>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const PricingExplanation: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-12 p-6 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-2xl"
    >
      <div className="flex items-start gap-3 mb-4">
        <Info className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-lg font-semibold text-white mb-1">
            Información sobre Precios y Licencias
          </h4>
          <p className="text-sm text-slate-400">
            Todos los precios se muestran <strong className="text-slate-300">SIN IVA</strong> (21% aplicable en España/UE)
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Licencia Anual */}
        <div className="p-4 bg-slate-800/50 rounded-xl border border-emerald-500/30">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h5 className="font-semibold text-white">Licencia Anual (€/año)</h5>
          </div>
          <ul className="text-sm text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span><strong>Duración:</strong> Renovable anualmente, sin límite de años</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span><strong>Incluye:</strong> Actualizaciones, soporte 24/7, hosting cloud</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span><strong>Ideal para:</strong> Empresas que prefieren OPEX vs CAPEX</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span><strong>Cancelación:</strong> Flexible, sin permanencia mínima</span>
            </li>
          </ul>
        </div>

        {/* Licencia Perpetua */}
        <div className="p-4 bg-slate-800/50 rounded-xl border border-amber-500/30">
          <div className="flex items-center gap-2 mb-3">
            <Infinity className="w-5 h-5 text-amber-400" />
            <h5 className="font-semibold text-white">Garantía Perpetua</h5>
          </div>
          <ul className="text-sm text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-amber-400">✓</span>
              <span><strong>Propiedad:</strong> Pago único, el software es tuyo para siempre</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">✓</span>
              <span><strong>Actualizaciones:</strong> 5 años de updates incluidos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">✓</span>
              <span><strong>Soporte Premium:</strong> 2 años incluidos, renovable</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">✓</span>
              <span><strong>On-Premise:</strong> Instalación en tus servidores disponible</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
        <p className="text-xs text-blue-300">
          <strong>Nota fiscal:</strong> El IVA (21%) se calculará en el checkout según la localización de facturación. 
          Empresas con NIF-IVA intracomunitario válido pueden aplicar inversión del sujeto pasivo.
        </p>
      </div>
    </motion.div>
  );
};

export default PricingExplanation;
