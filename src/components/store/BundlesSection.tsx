import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Check, ArrowRight, Sparkles, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface Bundle {
  id: string;
  bundle_key: string;
  bundle_name: string;
  description: string | null;
  module_keys: string[];
  original_price: number;
  bundle_price: number;
  discount_percent: number;
  badge: string | null;
  is_featured: boolean | null;
}

const BundlesSection: React.FC = () => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const fetchBundles = async () => {
      const { data } = await supabase
        .from('store_bundles')
        .select('*')
        .eq('is_active', true)
        .order('bundle_price', { ascending: true });
      
      if (data) {
        setBundles(data);
      }
    };

    fetchBundles();
  }, []);

  const defaultBundles: Bundle[] = [
    {
      id: 'b1',
      bundle_key: 'starter',
      bundle_name: 'Pack Starter',
      description: 'Perfecto para comenzar con lo esencial',
      module_keys: ['core', 'documentation', 'visits'],
      original_price: 149000,
      bundle_price: 99000,
      discount_percent: 33,
      badge: 'Popular',
      is_featured: true,
    },
    {
      id: 'b2',
      bundle_key: 'banking_complete',
      bundle_name: 'Pack Banca Completo',
      description: 'Todo lo necesario para entidades financieras',
      module_keys: ['core', 'accounting', 'audit', 'banking_ai', 'compliance', 'risk_management'],
      original_price: 520000,
      bundle_price: 399000,
      discount_percent: 23,
      badge: 'Recomendado',
      is_featured: true,
    },
    {
      id: 'b3',
      bundle_key: 'enterprise',
      bundle_name: 'Pack Enterprise',
      description: 'Licencia perpetua con todos los módulos y código fuente',
      module_keys: ['all'],
      original_price: 1200000,
      bundle_price: 880000,
      discount_percent: 27,
      badge: 'Mejor Valor',
      is_featured: true,
    },
  ];

  const displayBundles = bundles.length > 0 ? bundles : defaultBundles;

  const handleAddBundle = (bundle: Bundle) => {
    addItem({
      moduleKey: bundle.bundle_key,
      moduleName: bundle.bundle_name,
      price: bundle.bundle_price,
      quantity: 1,
      licenseType: bundle.bundle_key === 'enterprise' ? 'perpetual' : 'annual',
      category: 'bundle',
    });

    toast({
      title: 'Pack añadido',
      description: `${bundle.bundle_name} se ha añadido a tu carrito`,
    });
  };

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
            <Package className="w-3 h-3 mr-1" />
            PACKS ESPECIALES
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Ahorra con Nuestros Packs
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Combinaciones optimizadas de módulos con descuentos exclusivos
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {displayBundles.map((bundle, index) => (
            <motion.div
              key={bundle.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl overflow-hidden ${
                index === 2 
                  ? 'bg-gradient-to-br from-amber-950/50 via-slate-800/50 to-amber-950/30 border-2 border-amber-500/50' 
                  : index === 1 
                    ? 'bg-gradient-to-br from-emerald-950/50 via-slate-800/50 to-emerald-950/30 border-2 border-emerald-500/50'
                    : 'bg-slate-800/50 border border-slate-700/50'
              }`}
            >
              {/* Badge */}
              {bundle.badge && (
                <div className={`absolute top-0 right-0 px-4 py-1 text-xs font-bold text-white rounded-bl-xl ${
                  index === 2 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                  index === 1 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                  'bg-gradient-to-r from-blue-500 to-blue-600'
                }`}>
                  {bundle.badge}
                </div>
              )}

              <div className="p-8">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                    index === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                    index === 1 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                    'bg-gradient-to-br from-blue-500 to-blue-600'
                  }`}>
                    {index === 2 ? <Sparkles className="w-8 h-8 text-white" /> :
                     index === 1 ? <Star className="w-8 h-8 text-white" /> :
                     <Zap className="w-8 h-8 text-white" />}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{bundle.bundle_name}</h3>
                  <p className="text-slate-400 text-sm">{bundle.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-lg text-slate-500 line-through">{formatPrice(bundle.original_price)}</span>
                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                      -{bundle.discount_percent}%
                    </Badge>
                  </div>
                  <div className="text-4xl font-bold text-white">{formatPrice(bundle.bundle_price)}</div>
                  <div className="text-sm text-slate-400">
                    {bundle.bundle_key === 'enterprise' ? (
                      <span className="flex flex-col items-center gap-1">
                        <span className="text-amber-300">Licencia perpetua</span>
                        <span className="text-[10px] text-slate-500">Pago único • Tuyo para siempre</span>
                      </span>
                    ) : (
                      <span className="flex flex-col items-center gap-1">
                        <span>/año</span>
                        <span className="text-[10px] text-slate-500">Renovable • Sin permanencia</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">SIN IVA</div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {bundle.module_keys.slice(0, 5).map((key, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className={`w-4 h-4 ${
                        index === 2 ? 'text-amber-400' :
                        index === 1 ? 'text-emerald-400' :
                        'text-blue-400'
                      }`} />
                      <span className="capitalize">{key === 'all' ? 'Todos los módulos' : key.replace('_', ' ')}</span>
                    </div>
                  ))}
                  {bundle.module_keys.length > 5 && (
                    <div className="text-sm text-slate-400 pl-6">
                      +{bundle.module_keys.length - 5} módulos más
                    </div>
                  )}
                </div>

                {/* CTA */}
                <Button
                  onClick={() => handleAddBundle(bundle)}
                  className={`w-full py-6 text-lg ${
                    index === 2 
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700' :
                    index === 1 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700' :
                      'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                  } text-white`}
                >
                  Añadir al Carrito
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BundlesSection;
