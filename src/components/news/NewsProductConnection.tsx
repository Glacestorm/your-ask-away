import type { FC } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Shield, TrendingUp, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewsProductConnectionProps {
  productConnection: string | null;
  productRelevanceReason: string | null;
  importanceLevel?: string;
  className?: string;
}

const NewsProductConnection: FC<NewsProductConnectionProps> = ({
  productConnection,
  productRelevanceReason,
  importanceLevel = 'medium',
  className = '',
}) => {
  if (!productConnection && !productRelevanceReason) {
    return null;
  }

  const getImportanceStyles = () => {
    switch (importanceLevel) {
      case 'critical':
        return {
          gradient: 'from-rose-500/20 via-rose-500/10 to-amber-500/10',
          border: 'border-rose-500/30',
          icon: 'text-rose-400',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        };
      case 'high':
        return {
          gradient: 'from-amber-500/20 via-amber-500/10 to-emerald-500/10',
          border: 'border-amber-500/30',
          icon: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        };
      default:
        return {
          gradient: 'from-emerald-500/20 via-blue-500/10 to-purple-500/10',
          border: 'border-emerald-500/30',
          icon: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
    }
  };

  const styles = getImportanceStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={`relative overflow-hidden rounded-2xl ${className}`}
    >
      {/* Premium Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient}`} />
      <div className="absolute inset-0 backdrop-blur-xl" />
      
      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            x: [0, 50, 0],
            y: [0, -30, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"
        />
        <motion.div
          animate={{ 
            x: [0, -40, 0],
            y: [0, 20, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"
        />
      </div>

      {/* Content */}
      <div className={`relative p-6 border ${styles.border} rounded-2xl`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className={`p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/20`}
            >
              <Shield className={`w-6 h-6 ${styles.icon}`} />
            </motion.div>
            <div>
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                ¿Cómo ObelixIA te ayuda?
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Solución inteligente para tu empresa
              </p>
            </div>
          </div>
          
          {importanceLevel !== 'medium' && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`px-3 py-1 text-xs font-semibold rounded-full border ${styles.badge}`}
            >
              {importanceLevel === 'critical' ? '⚠️ Crítico' : '🔥 Alta Prioridad'}
            </motion.span>
          )}
        </div>

        {/* Connection Content */}
        {productConnection && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
          >
            <div className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <Zap className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-slate-300 text-sm leading-relaxed">
                {productConnection}
              </p>
            </div>
          </motion.div>
        )}

        {/* Relevance Reason */}
        {productRelevanceReason && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-5"
          >
            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
              <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-300 mb-1">¿Por qué necesitas esto?</p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {productRelevanceReason}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Benefits List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-2 mb-5"
        >
          {['Automatización', 'Cumplimiento', 'Seguridad', 'Eficiencia'].map((benefit, i) => (
            <div key={benefit} className="flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{benefit}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-500/20 group"
          >
            <span>Descubre cómo ObelixIA puede ayudarte</span>
            <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
      </div>
    </motion.div>
  );
};

export default NewsProductConnection;
