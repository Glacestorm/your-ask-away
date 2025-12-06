import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { GestorFilterSelector } from '@/components/dashboard/GestorFilterSelector';
import { VisitsMetrics } from '@/components/admin/VisitsMetrics';
import { ProductsMetrics } from '@/components/admin/ProductsMetrics';
import { VinculacionMetrics } from '@/components/admin/VinculacionMetrics';
import { GestoresMetrics } from '@/components/admin/GestoresMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Package, Target, Users } from 'lucide-react';

type MetricType = 'visits' | 'products' | 'vinculacion' | 'gestores';

interface FilteredMetricsWrapperProps {
  initialMetric?: MetricType;
}

export function FilteredMetricsWrapper({ initialMetric = 'visits' }: FilteredMetricsWrapperProps) {
  const { user, isOfficeDirector, isCommercialDirector, isCommercialManager, isSuperAdmin } = useAuth();
  const [selectedGestorId, setSelectedGestorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MetricType>(initialMetric);

  // Regular gestores see their own data only
  const isRegularGestor = !isOfficeDirector && !isCommercialDirector && !isCommercialManager && !isSuperAdmin;
  const effectiveGestorId = isRegularGestor ? user?.id : selectedGestorId;

  const showSelector = !isRegularGestor;

  return (
    <div className="space-y-4">
      {/* Header with filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">
          {activeTab === 'visits' && 'Mètriques de Visites'}
          {activeTab === 'products' && 'Mètriques de Productes'}
          {activeTab === 'vinculacion' && 'Mètriques de Vinculació'}
          {activeTab === 'gestores' && 'Mètriques de Gestors'}
        </h2>
        
        {showSelector && (
          <GestorFilterSelector
            selectedGestorId={selectedGestorId}
            onGestorChange={setSelectedGestorId}
            showAllOption={true}
          />
        )}
      </div>

      {/* Tabs for different metrics */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MetricType)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="visits" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Visites</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Productes</span>
          </TabsTrigger>
          <TabsTrigger value="vinculacion" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Vinculació</span>
          </TabsTrigger>
          <TabsTrigger value="gestores" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Gestors</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visits" className="mt-4">
          <VisitsMetrics gestorId={effectiveGestorId} />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <ProductsMetrics gestorId={effectiveGestorId} />
        </TabsContent>

        <TabsContent value="vinculacion" className="mt-4">
          <VinculacionMetrics gestorId={effectiveGestorId} />
        </TabsContent>

        <TabsContent value="gestores" className="mt-4">
          <GestoresMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
