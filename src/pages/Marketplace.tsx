import { useState } from 'react';
import { useMarketplaceApps, useCategoryCounts } from '@/hooks/useMarketplace';
import { 
  AppCard, 
  MarketplaceCategories, 
  FeaturedApps, 
  PremiumIntegrationsGrid 
} from '@/components/marketplace';
import { MarketplaceHero } from '@/components/marketplace/MarketplaceHero';
import { SystemModulesSection } from '@/components/marketplace/SystemModulesSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, 
  ArrowRight, 
  Layers,
  Package,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const { data: apps, isLoading } = useMarketplaceApps(selectedCategory || undefined);
  const { data: categoryCounts } = useCategoryCounts();

  const filteredApps = apps?.filter(app => 
    !searchTerm || 
    app.app_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const showFiltered = selectedCategory || searchTerm;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <MarketplaceHero 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-10">
        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <MarketplaceCategories 
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            counts={categoryCounts || {}}
          />
        </motion.div>

        {/* Tabs for content sections - only when no filters */}
        {!showFiltered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-6">
                <TabsTrigger value="all" className="gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  Destacados
                </TabsTrigger>
                <TabsTrigger value="modules" className="gap-1.5">
                  <Layers className="h-4 w-4" />
                  Módulos
                </TabsTrigger>
                <TabsTrigger value="apps" className="gap-1.5">
                  <Store className="h-4 w-4" />
                  Apps
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-10 mt-0">
                {/* Featured Apps */}
                <FeaturedApps />

                {/* System Modules Preview */}
                <SystemModulesSection limit={6} showViewAll />

                {/* Premium Integrations */}
                <PremiumIntegrationsGrid limit={4} />
              </TabsContent>

              <TabsContent value="modules" className="mt-0">
                <SystemModulesSection limit={99} showViewAll={false} />
              </TabsContent>

              <TabsContent value="apps" className="space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-secondary/10">
                      <Package className="h-5 w-5 text-secondary" />
                    </div>
                    Apps de Partners
                    {filteredApps && (
                      <Badge variant="secondary" className="ml-2">{filteredApps.length}</Badge>
                    )}
                  </h3>
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                  </div>
                ) : filteredApps && filteredApps.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredApps.map((app, index) => (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <AppCard app={app} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h4 className="font-semibold mb-2">No hay apps de partners aún</h4>
                      <p className="text-muted-foreground">
                        Pronto añadiremos más apps de nuestros partners certificados
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}

        {/* Filtered Results - when filters active */}
        {showFiltered && (
          <motion.div 
            className="space-y-4" 
            id="marketplace-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {selectedCategory ? `Apps de ${selectedCategory.toUpperCase()}` : 'Resultados de búsqueda'}
              </h3>
              <div className="flex items-center gap-2">
                {filteredApps && (
                  <Badge variant="secondary">{filteredApps.length} resultados</Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory(null);
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : filteredApps && filteredApps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredApps.map((app, index) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <AppCard app={app} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="font-semibold mb-2">No se encontraron apps</h4>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm
                      ? 'Prueba con otros términos de búsqueda'
                      : 'No hay apps disponibles en esta categoría'}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory(null);
                    }}
                  >
                    Ver todas las apps
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* CTA for Partners */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 border-primary/20">
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative">
              <div>
                <h3 className="text-xl font-semibold mb-2">¿Eres desarrollador?</h3>
                <p className="text-muted-foreground">
                  Únete a nuestro programa de partners y publica tus apps en el marketplace
                </p>
              </div>
              <div className="flex gap-3">
                <Link to="/partners">
                  <Button className="gap-2 shadow-lg shadow-primary/20">
                    Ser Partner
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/developers">
                  <Button variant="outline">
                    Documentación
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
