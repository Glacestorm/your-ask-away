/**
 * Fixed Assets Panel - Phase 15
 * Fixed asset management with depreciation
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Package, 
  Plus, 
  Search,
  TrendingDown,
  Calculator,
  FileText,
  BarChart3,
  Building2,
  Car,
  Monitor,
  Wrench,
  Archive,
  RefreshCw
} from 'lucide-react';
import { useObelixiaFixedAssets, type AssetCategory } from '@/hooks/admin/obelixia-accounting';
import { cn } from '@/lib/utils';

export function FixedAssetsPanel() {
  const [activeTab, setActiveTab] = useState('assets');
  const [searchTerm, setSearchTerm] = useState('');
  
  const {
    isLoading,
    isProcessing,
    assets,
    stats,
    fetchAssets,
    calculateDepreciationSchedule,
    runMonthlyDepreciation,
    createAsset
  } = useObelixiaFixedAssets();

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const getCategoryIcon = (category: AssetCategory) => {
    switch (category) {
      case 'buildings': return <Building2 className="h-4 w-4" />;
      case 'vehicles': return <Car className="h-4 w-4" />;
      case 'computers': return <Monitor className="h-4 w-4" />;
      case 'machinery': return <Wrench className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'disposed': return 'bg-muted text-muted-foreground';
      case 'fully_depreciated': return 'bg-orange-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Activo',
      disposed: 'Dado de baja',
      fully_depreciated: 'Depreciado',
      impaired: 'Deteriorado',
      under_maintenance: 'En mantenimiento'
    };
    return labels[status] || status;
  };

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate summary from assets
  const summary = {
    totalAssets: assets.length,
    totalValue: assets.reduce((sum, a) => sum + a.acquisitionCost, 0),
    totalDepreciation: assets.reduce((sum, a) => sum + a.accumulatedDepreciation, 0),
    netValue: assets.reduce((sum, a) => sum + a.currentValue, 0)
  };

  // Generate categories from assets
  const categories = Object.entries(
    assets.reduce((acc, asset) => {
      if (!acc[asset.category]) {
        acc[asset.category] = { 
          count: 0, 
          value: 0,
          depreciationYears: Math.round(asset.usefulLifeMonths / 12),
          method: asset.depreciationMethod
        };
      }
      acc[asset.category].count++;
      acc[asset.category].value += asset.currentValue;
      return acc;
    }, {} as Record<string, { count: number; value: number; depreciationYears: number; method: string }>)
  ).map(([key, data]) => ({
    id: key,
    code: key,
    name: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
    assetCount: data.count,
    totalValue: data.value,
    depreciationYears: data.depreciationYears,
    depreciationMethod: data.method
  }));

  // Generate depreciation schedule
  const depreciationSchedule = assets
    .filter(a => a.status === 'active' && a.monthlyDepreciation > 0)
    .map(asset => ({
      assetId: asset.id,
      assetName: asset.name,
      method: asset.depreciationMethod,
      usefulLifeYears: Math.round(asset.usefulLifeMonths / 12),
      monthlyDepreciation: asset.monthlyDepreciation,
      accumulatedDepreciation: asset.accumulatedDepreciation,
      remainingValue: asset.currentValue,
      percentageDepreciated: (asset.accumulatedDepreciation / (asset.acquisitionCost - asset.residualValue)) * 100
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
            <Package className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Gestión de Activos Fijos</h1>
            <p className="text-muted-foreground">
              Control de patrimonio y depreciación automática
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => runMonthlyDepreciation({ year: 2024, month: 12 })}
            disabled={isProcessing}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calcular Depreciación
          </Button>
          <Button size="sm" onClick={() => createAsset({})}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Activo
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.totalAssets}</p>
                <p className="text-sm text-muted-foreground">Total Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <BarChart3 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">€{(summary.totalValue / 1000).toFixed(0)}K</p>
                <p className="text-sm text-muted-foreground">Valor Bruto</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <TrendingDown className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">€{(summary.totalDepreciation / 1000).toFixed(0)}K</p>
                <p className="text-sm text-muted-foreground">Depreciación Acum.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Calculator className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">€{(summary.netValue / 1000).toFixed(0)}K</p>
                <p className="text-sm text-muted-foreground">Valor Neto</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Activos
          </TabsTrigger>
          <TabsTrigger value="depreciation" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Depreciación
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Categorías
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Informes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Inventario de Activos</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar activo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Valor Adq.</TableHead>
                      <TableHead className="text-right">Depreciación</TableHead>
                      <TableHead className="text-right">Valor Neto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-mono text-sm">{asset.code}</TableCell>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(asset.category)}
                            <span className="text-sm">{asset.category}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          €{asset.acquisitionCost.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          €{asset.accumulatedDepreciation.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          €{asset.currentValue.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(asset.status)}>
                            {getStatusLabel(asset.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredAssets.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p>No se encontraron activos</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="depreciation" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Calendario de Depreciación</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => runMonthlyDepreciation({ year: 2024, month: 12 })}
                disabled={isProcessing}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isProcessing && "animate-spin")} />
                Recalcular
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {depreciationSchedule.map((schedule) => (
                    <div key={schedule.assetId} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{schedule.assetName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Método: {schedule.method === 'straight_line' ? 'Lineal' : schedule.method}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            €{schedule.monthlyDepreciation.toLocaleString()}/mes
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Vida útil: {schedule.usefulLifeYears} años
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progreso de depreciación</span>
                          <span>{schedule.percentageDepreciated.toFixed(1)}%</span>
                        </div>
                        <Progress value={schedule.percentageDepreciated} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Depreciado: €{schedule.accumulatedDepreciation.toLocaleString()}</span>
                          <span>Restante: €{schedule.remainingValue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {depreciationSchedule.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <TrendingDown className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                      <p>No hay calendario de depreciación</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categorías de Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <Card key={category.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          {getCategoryIcon(category.code as AssetCategory)}
                        </div>
                        <div>
                          <h4 className="font-medium">{category.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {category.depreciationYears} años de vida útil
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Activos</span>
                          <span className="font-medium">{category.assetCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valor Total</span>
                          <span className="font-medium">€{category.totalValue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Método</span>
                          <Badge variant="outline">
                            {category.depreciationMethod === 'straight_line' ? 'Lineal' : category.depreciationMethod}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {categories.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Archive className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p>No hay categorías configuradas</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informes de Activos Fijos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'inventory', name: 'Inventario de Activos', description: 'Listado completo de activos fijos', icon: Package },
                  { id: 'depreciation', name: 'Cuadro de Amortización', description: 'Detalle de depreciación por activo', icon: TrendingDown },
                  { id: 'movements', name: 'Movimientos del Período', description: 'Altas, bajas y transferencias', icon: RefreshCw },
                  { id: 'valuation', name: 'Valoración Patrimonial', description: 'Valor neto contable del patrimonio', icon: BarChart3 },
                ].map((report) => (
                  <Card 
                    key={report.id} 
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <report.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{report.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {report.description}
                          </p>
                          <Button variant="link" className="px-0 mt-2" size="sm">
                            Generar informe →
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default FixedAssetsPanel;
