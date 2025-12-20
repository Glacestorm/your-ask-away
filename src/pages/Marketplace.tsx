import { useState } from 'react';
import { useMarketplaceApps, useMarketplaceStats, useCategoryCounts } from '@/hooks/useMarketplace';
import { AppCard, MarketplaceCategories, FeaturedApps, PremiumIntegrationsGrid } from '@/components/marketplace';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Store, Users, Puzzle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: apps, isLoading } = useMarketplaceApps(selectedCategory || undefined);
  const { data: stats } = useMarketplaceStats();
  const { data: categoryCounts } = useCategoryCounts();

  const filteredApps = apps?.filter(app => 
    !searchTerm || 
    app.app_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30">
              Marketplace
            </Badge>
            <h1 className="text-4xl font-bold mb-4">
              Extiende tu CRM con las mejores integraciones
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Descubre apps, integraciones y herramientas certificadas para potenciar tu gestión comercial
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar apps, integraciones o categorías..."
                className="pl-10 h-12 text-lg"
              />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mt-8">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                <span className="text-sm">
                  <strong>{stats?.totalApps || 0}</strong> Apps
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Puzzle className="h-5 w-5 text-primary" />
                <span className="text-sm">
                  <strong>{stats?.totalIntegrations || 0}</strong> Integraciones
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm">
                  <strong>{stats?.totalPartners || 0}</strong> Partners
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-10">
        {/* Categories */}
        <MarketplaceCategories 
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          counts={categoryCounts || {}}
        />

        {/* Featured Apps - Only show when no filters */}
        {!selectedCategory && !searchTerm && (
          <FeaturedApps />
        )}

        {/* Premium Integrations - Only show when no filters */}
        {!selectedCategory && !searchTerm && (
          <PremiumIntegrationsGrid limit={4} />
        )}

        {/* All Apps */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {selectedCategory ? `Apps de ${selectedCategory.toUpperCase()}` : 'Todas las Apps'}
            </h3>
            {filteredApps && (
              <Badge variant="secondary">{filteredApps.length} resultados</Badge>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : filteredApps && filteredApps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="font-semibold mb-2">No se encontraron apps</h4>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? 'Prueba con otros términos de búsqueda'
                    : 'No hay apps disponibles en esta categoría'
                  }
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory(null);
                }}>
                  Ver todas las apps
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* CTA for Partners */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">¿Eres desarrollador?</h3>
              <p className="text-muted-foreground">
                Únete a nuestro programa de partners y publica tus apps en el marketplace
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/partners">
                <Button>
                  Ser Partner
                  <ArrowRight className="h-4 w-4 ml-2" />
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
      </div>
    </div>
  );
}
