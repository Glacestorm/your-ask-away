import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Activity, Target, Building2, Package, X, GitCompare, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

interface GestorStats {
  totalVisits: number;
  successRate: number;
  totalCompanies: number;
  totalProducts: number;
}

interface MonthlyData {
  month: string;
  visits: number;
  successful: number;
  comparisonVisits?: number;
  comparisonSuccessful?: number;
}

interface RecentVisit {
  id: string;
  visit_date: string;
  company_name: string;
  result: string;
  notes: string;
}

interface ResultDistribution {
  result: string;
  count: number;
}

interface ProductCount {
  product: string;
  count: number;
}

interface TopCompany {
  name: string;
  vinculacion: number;
}

interface GestorOverviewSectionProps {
  stats: GestorStats;
  comparisonStats: GestorStats;
  monthlyData: MonthlyData[];
  recentVisits: RecentVisit[];
  resultDistribution: ResultDistribution[];
  topProducts: ProductCount[];
  topCompanies: TopCompany[];
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  comparisonPeriod: string;
  setComparisonPeriod: (period: string) => void;
  comparisonDateRange: DateRange | undefined;
  showComparison: boolean;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  availableProducts: string[];
  selectedProducts: string[];
  toggleProductFilter: (product: string) => void;
  minVinculacion: number;
  setMinVinculacion: (value: number) => void;
  maxVinculacion: number;
  setMaxVinculacion: (value: number) => void;
  onBack: () => void;
}

export function GestorOverviewSection({
  stats,
  comparisonStats,
  monthlyData,
  recentVisits,
  resultDistribution,
  topProducts,
  topCompanies,
  dateRange,
  setDateRange,
  comparisonPeriod,
  setComparisonPeriod,
  comparisonDateRange,
  showComparison,
  showFilters,
  setShowFilters,
  hasActiveFilters,
  clearFilters,
  availableProducts,
  selectedProducts,
  toggleProductFilter,
  minVinculacion,
  setMinVinculacion,
  maxVinculacion,
  setMaxVinculacion,
  onBack
}: GestorOverviewSectionProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <Button variant="ghost" onClick={onBack} className="mb-4 hover:translate-x-[-4px] transition-transform">
        ← Tornar al panell
      </Button>

      {/* Filtros Compactos - Full Width */}
      <Card className="border-muted/50 w-full">
        <CardContent className="py-4">
          <div className="space-y-4">
            {/* Selector de fechas - Full width */}
            <DateRangeFilter 
              dateRange={dateRange} 
              onDateRangeChange={setDateRange}
            />

            {/* Comparación de períodos */}
            <div className="flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-muted-foreground" />
              <Select value={comparisonPeriod} onValueChange={setComparisonPeriod}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Comparar amb..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('gestor.dashboard.noComparison')}</SelectItem>
                  <SelectItem value="previous_month">{t('gestor.dashboard.previousPeriod')}</SelectItem>
                  <SelectItem value="same_last_year">{t('gestor.dashboard.sameLastYear')}</SelectItem>
                  <SelectItem value="previous_6_months">{t('gestor.dashboard.previous6Months')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Netejar
                </Button>
              )}
              <Button
                variant={showFilters ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-9 text-xs"
              >
                {showFilters ? "Menys filtres" : "Més filtres"}
              </Button>
            </div>
          </div>

          {/* Info de comparación */}
          {showComparison && comparisonDateRange && (
            <p className="text-xs text-muted-foreground mt-2 pl-6">
              Comparant amb: {format(comparisonDateRange.from!, 'dd/MM/yyyy')} - {format(comparisonDateRange.to!, 'dd/MM/yyyy')}
            </p>
          )}

          {/* Filtros avanzados expandibles */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Productes</Label>
                <ScrollArea className="h-24 border rounded-md p-2">
                  <div className="grid grid-cols-2 gap-1">
                    {availableProducts.map(product => (
                      <div key={product} className="flex items-center space-x-1.5">
                        <Checkbox
                          id={`product-${product}`}
                          checked={selectedProducts.includes(product)}
                          onCheckedChange={() => toggleProductFilter(product)}
                          className="h-3.5 w-3.5"
                        />
                        <label htmlFor={`product-${product}`} className="text-xs cursor-pointer truncate">
                          {product}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                {selectedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedProducts.map(product => (
                      <Badge key={product} variant="secondary" className="text-xs h-5 px-1.5">
                        {product}
                        <X className="h-2.5 w-2.5 ml-1 cursor-pointer" onClick={() => toggleProductFilter(product)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Rang de Vinculació</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={minVinculacion}
                    onChange={(e) => setMinVinculacion(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className="h-8 w-20 text-sm"
                    placeholder="Min"
                  />
                  <span className="text-muted-foreground">—</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={maxVinculacion}
                    onChange={(e) => setMaxVinculacion(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className="h-8 w-20 text-sm"
                    placeholder="Max"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Mètriques Clau</h2>
            <p className="text-sm text-muted-foreground">Indicadors principals del meu rendiment</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('gestor.dashboard.totalVisits')}</CardTitle>
              <Activity className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.totalVisits}</div>
              {showComparison && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">vs {comparisonStats.totalVisits}</span>
                  {stats.totalVisits > comparisonStats.totalVisits ? (
                    <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                      ↑ {stats.totalVisits - comparisonStats.totalVisits}
                    </Badge>
                  ) : stats.totalVisits < comparisonStats.totalVisits ? (
                    <Badge variant="default" className="bg-red-500/10 text-red-600 border-red-500/20">
                      ↓ {comparisonStats.totalVisits - stats.totalVisits}
                    </Badge>
                  ) : null}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">{t('gestor.dashboard.visitsDesc')}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('gestor.dashboard.successRate')}</CardTitle>
              <Target className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.successRate}%</div>
              {showComparison && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">vs {comparisonStats.successRate}%</span>
                  {stats.successRate > comparisonStats.successRate ? (
                    <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                      ↑ {stats.successRate - comparisonStats.successRate}%
                    </Badge>
                  ) : stats.successRate < comparisonStats.successRate ? (
                    <Badge variant="default" className="bg-red-500/10 text-red-600 border-red-500/20">
                      ↓ {comparisonStats.successRate - stats.successRate}%
                    </Badge>
                  ) : null}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">{t('gestor.dashboard.successDesc')}</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('gestor.dashboard.companies')}</CardTitle>
              <Building2 className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.totalCompanies}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('gestor.dashboard.companiesDesc')}</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('gestor.dashboard.products')}</CardTitle>
              <Package className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.totalProducts}</div>
              {showComparison && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">vs {comparisonStats.totalProducts}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">{t('gestor.dashboard.productsDesc')}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Evolution Chart */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
            <TrendingUp className="h-5 w-5 text-chart-2" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Evolució Temporal</h2>
            <p className="text-sm text-muted-foreground">Rendiment al llarg del temps</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('gestor.dashboard.monthlyEvolution')}</CardTitle>
            <CardDescription>{t('gestor.dashboard.monthlyEvolutionDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="visits" stroke="hsl(var(--chart-1))" strokeWidth={2} name={t('gestor.dashboard.currentPeriod') + ' - ' + t('gestor.dashboard.totalVisits')} />
                  <Line type="monotone" dataKey="successful" stroke="hsl(var(--chart-2))" strokeWidth={2} name={t('gestor.dashboard.currentPeriod') + ' - ' + t('gestor.dashboard.successfulVisits')} />
                  {showComparison && (
                    <>
                      <Line type="monotone" dataKey="comparisonVisits" stroke="hsl(var(--chart-3))" strokeWidth={2} strokeDasharray="5 5" name={t('gestor.dashboard.comparisonPeriod') + ' - ' + t('gestor.dashboard.totalVisits')} />
                      <Line type="monotone" dataKey="comparisonSuccessful" stroke="hsl(var(--chart-4))" strokeWidth={2} strokeDasharray="5 5" name={t('gestor.dashboard.comparisonPeriod') + ' - ' + t('gestor.dashboard.successfulVisits')} />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                {t('director.noData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Performance Analysis */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
            <BarChart3 className="h-5 w-5 text-chart-3" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Anàlisi de Rendiment</h2>
            <p className="text-sm text-muted-foreground">Detall dels meus resultats i empreses</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('gestor.dashboard.resultDistribution')}</CardTitle>
              <CardDescription>{t('gestor.dashboard.resultDistributionDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {resultDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={resultDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="result" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--chart-1))" name={t('gestor.dashboard.visits')} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  {t('director.noData')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('gestor.dashboard.topProducts')}</CardTitle>
            <CardDescription>{t('gestor.dashboard.topProductsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="product" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" name={t('gestor.dashboard.timesOffered')} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                {t('director.noData')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('gestor.dashboard.topCompanies')}</CardTitle>
            <CardDescription>{t('gestor.dashboard.topCompaniesDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {topCompanies.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topCompanies} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="vinculacion" fill="hsl(var(--chart-3))" name={t('gestor.dashboard.vinculacion')} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                {t('director.noData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
            <Activity className="h-5 w-5 text-chart-1" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Activitat Recent</h2>
            <p className="text-sm text-muted-foreground">Les meves últimes visites</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('gestor.dashboard.recentVisits')}</CardTitle>
            <CardDescription>{t('gestor.dashboard.recentVisitsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('gestor.dashboard.date')}</TableHead>
                  <TableHead>{t('gestor.dashboard.company')}</TableHead>
                  <TableHead>{t('gestor.dashboard.result')}</TableHead>
                  <TableHead>{t('gestor.dashboard.notes')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentVisits.length > 0 ? (
                  recentVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell>{format(new Date(visit.visit_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-medium">{visit.company_name}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          visit.result === 'Exitosa' 
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                            : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {visit.result}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{visit.notes}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {t('director.noData')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
