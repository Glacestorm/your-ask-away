import { useUnifiedMarketplaceStats } from '@/hooks/useUnifiedMarketplace';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Store, 
  Puzzle, 
  Users, 
  Layers,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MarketplaceHeroProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function MarketplaceHero({ searchTerm, onSearchChange }: MarketplaceHeroProps) {
  const { data: stats } = useUnifiedMarketplaceStats();

  const statItems = [
    { 
      icon: Layers, 
      value: stats?.totalSolutions || 0, 
      label: 'Soluciones',
      gradient: 'from-primary to-primary/70'
    },
    { 
      icon: Store, 
      value: stats?.totalApps || 0, 
      label: 'Apps Partners',
      gradient: 'from-secondary to-secondary/70'
    },
    { 
      icon: Puzzle, 
      value: stats?.totalIntegrations || 0, 
      label: 'Integraciones',
      gradient: 'from-amber-500 to-amber-400'
    },
    { 
      icon: Users, 
      value: stats?.totalPartners || 0, 
      label: 'Partners',
      gradient: 'from-purple-500 to-purple-400'
    },
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[hsl(222,47%,11%)] via-[hsl(222,47%,9%)] to-slate-950">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/10 to-transparent opacity-50" />
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16 relative">
        <motion.div 
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Badge className="mb-4 bg-primary/20 text-white border-primary/30 hover:bg-primary/30 px-4 py-1">
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary" />
              Marketplace
            </Badge>
          </motion.div>

          <motion.h1 
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            Extiende tu CRM con las mejores soluciones
          </motion.h1>

          <motion.p 
            className="text-base md:text-lg text-gray-400 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            Descubre apps, módulos, integraciones y herramientas certificadas para potenciar tu gestión comercial
          </motion.p>

          {/* Search */}
          <motion.div 
            className="relative max-w-xl mx-auto mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar apps, módulos, integraciones..."
            className="pl-11 h-12 text-base bg-white/10 backdrop-blur-sm border-white/20 focus:border-primary/50 shadow-sm text-white placeholder:text-gray-400"
            />
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-4 md:gap-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {statItems.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-sm"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              >
                <div className={`p-1.5 rounded-full bg-gradient-to-br ${stat.gradient}`}>
                  <stat.icon className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm text-white">
                  <strong className="font-semibold">{stat.value}</strong>
                  <span className="text-gray-400 ml-1">{stat.label}</span>
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default MarketplaceHero;
