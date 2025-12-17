import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Star, Check, Crown, Building2, MapPin, 
  Calculator, Target, FileText, Bell, Shield, Brain,
  BarChart3, Users, Globe, Lock, Zap, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ModuleCardProps {
  module: {
    id: string;
    module_key: string;
    module_name: string;
    description: string | null;
    module_icon: string | null;
    base_price: number | null;
    category: string;
    is_core: boolean | null;
    features?: any;
  };
  isPremium?: boolean;
  showFullDetails?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  Building2, MapPin, Calculator, Target, FileText, Bell, Shield, Brain,
  BarChart3, Users, Globe, Lock, Zap, Database, Crown, Star, Check
};

const ModuleCard: React.FC<ModuleCardProps> = ({ module, isPremium = false, showFullDetails = false }) => {
  const { toast } = useToast();

  const IconComponent = iconMap[module.module_icon || 'Building2'] || Building2;

  const features = Array.isArray(module.features) 
    ? module.features 
    : (typeof module.features === 'object' && module.features?.list) 
      ? module.features.list 
      : ['Funcionalidad completa', 'Soporte incluido', 'Actualizaciones'];

  const handleRequestQuote = () => {
    // Scroll to contact section or open quote request modal
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      toast({
        title: 'Solicitar cotización',
        description: `Contacte con nuestro equipo comercial para obtener un precio personalizado para ${module.module_name}`,
      });
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`group relative bg-slate-800/50 backdrop-blur border rounded-2xl overflow-hidden transition-all duration-300 ${
        isPremium 
          ? 'border-amber-500/50 hover:border-amber-400/70 hover:shadow-lg hover:shadow-amber-500/20' 
          : 'border-slate-700/50 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10'
      }`}
    >
      {/* Premium Badge */}
      {isPremium && (
        <div className="absolute top-0 right-0">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-4 py-1 rounded-bl-xl flex items-center gap-1">
            <Crown className="w-3 h-3" />
            PREMIUM
          </div>
        </div>
      )}

      {/* Core Badge */}
      {module.is_core && (
        <div className="absolute top-3 right-3">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
            CORE
          </Badge>
        </div>
      )}

      <div className="p-6">
        {/* Icon & Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
            isPremium 
              ? 'bg-gradient-to-br from-amber-500 to-amber-600' 
              : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
          }`}>
            <IconComponent className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">{module.module_name}</h3>
            <p className="text-sm text-slate-400 capitalize">{module.category}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
          {module.description || 'Módulo empresarial completo con todas las funcionalidades necesarias.'}
        </p>

        {/* Features */}
        <div className="space-y-2 mb-6">
          {features.slice(0, 4).map((feature: string, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
              <Check className={`w-4 h-4 ${isPremium ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Actions - Sin precios públicos */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
          <div>
            <div className="text-lg font-semibold text-slate-300">Precio personalizado</div>
            <div className="text-xs text-slate-500">Solicite cotización</div>
          </div>
          
          <div className="flex gap-2">
            <Link to={`/store/modules/${module.module_key}`}>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-slate-400 hover:text-white"
              >
                Detalles
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={handleRequestQuote}
              className={isPremium 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white'
              }
            >
              Solicitar Precio
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ModuleCard;
