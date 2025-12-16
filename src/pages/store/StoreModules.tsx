import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import StoreNavbar from '@/components/store/StoreNavbar';
import StoreFooter from '@/components/store/StoreFooter';
import ModuleCard from '@/components/store/ModuleCard';
import CartSidebar from '@/components/store/CartSidebar';

interface Module {
  id: string;
  module_key: string;
  module_name: string;
  description: string | null;
  module_icon: string | null;
  base_price: number | null;
  category: string;
  is_core: boolean | null;
  features: any;
  sector: string | null;
}

const StoreModules: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchModules = async () => {
      const { data, error } = await supabase
        .from('app_modules')
        .select('*')
        .order('category', { ascending: true });
      
      if (!error && data) {
        setModules(data);
      }
      setLoading(false);
    };

    fetchModules();
  }, []);

  const filteredModules = modules.filter(module => {
    const matchesSearch = module.module_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (module.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || module.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(modules.map(m => m.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <StoreNavbar />
      <CartSidebar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              CATÁLOGO COMPLETO
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Todos los Módulos
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Explora nuestra colección completa de módulos empresariales
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row gap-4 mb-8"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Buscar módulos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48 bg-slate-800/50 border-slate-700 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat} className="text-white hover:bg-slate-700">
                    {cat === 'all' ? 'Todas' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-emerald-600' : 'border-slate-700 text-slate-400'}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-emerald-600' : 'border-slate-700 text-slate-400'}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>

          {/* Results count */}
          <div className="mb-6">
            <p className="text-slate-400">
              {filteredModules.length} módulos encontrados
            </p>
          </div>

          {/* Modules Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'flex flex-col gap-4'
            }>
              {filteredModules.map((module, index) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ModuleCard 
                    module={module} 
                    isPremium={module.category === 'vertical'}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {filteredModules.length === 0 && !loading && (
            <div className="text-center py-20">
              <p className="text-slate-400 text-lg">No se encontraron módulos</p>
              <Button 
                variant="link" 
                onClick={() => { setSearchTerm(''); setCategoryFilter('all'); }}
                className="text-emerald-400"
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      </main>

      <StoreFooter />
    </div>
  );
};

export default StoreModules;
