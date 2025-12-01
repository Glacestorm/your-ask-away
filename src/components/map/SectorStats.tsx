import { CompanyWithDetails } from '@/types/database';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { getSectorIcon } from './markerIcons';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { useState } from 'react';
import { CheckSquare, Square, XCircle, Shuffle, TrendingUp, Users, Package, Filter, BarChart3, BarChartHorizontal, LineChartIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface SectorStatsProps {
  companies: CompanyWithDetails[];
  onSectorClick: (sector: string) => void;
  selectedSectors: string[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onInvertSelection: () => void;
  turnoverRange: [number, number];
  employeeRange: [number, number];
  onTurnoverRangeChange: (range: [number, number]) => void;
  onEmployeeRangeChange: (range: [number, number]) => void;
}

// Color palette for the chart
const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8b5cf6',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
];

type ChartType = 'horizontal' | 'vertical' | 'line';

export function SectorStats({ 
  companies, 
  onSectorClick, 
  selectedSectors,
  onSelectAll,
  onClearSelection,
  onInvertSelection,
  turnoverRange,
  employeeRange,
  onTurnoverRangeChange,
  onEmployeeRangeChange
}: SectorStatsProps) {
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('horizontal');

  // Calculate max values for sliders
  const maxTurnover = Math.max(...companies.map(c => c.turnover || 0));
  const maxEmployees = Math.max(...companies.map(c => c.employees || 0));

  // Apply range filters to companies
  const filteredCompanies = companies.filter(company => {
    const turnoverMatch = !company.turnover || 
      (company.turnover >= turnoverRange[0] && company.turnover <= turnoverRange[1]);
    const employeeMatch = !company.employees || 
      (company.employees >= employeeRange[0] && company.employees <= employeeRange[1]);
    return turnoverMatch && employeeMatch;
  });

  const hasActiveRangeFilters = 
    turnoverRange[0] > 0 || 
    turnoverRange[1] < maxTurnover ||
    employeeRange[0] > 0 || 
    employeeRange[1] < maxEmployees;

  // Group filtered companies by sector and count
  const sectorStats = filteredCompanies.reduce((acc, company) => {
    const sector = company.sector || 'Sin sector';
    if (!acc[sector]) {
      acc[sector] = {
        count: 0,
        companies: [],
      };
    }
    acc[sector].count++;
    acc[sector].companies.push(company);
    return acc;
  }, {} as Record<string, { count: number; companies: CompanyWithDetails[] }>);

  // Sort sectors by count (descending)
  const sortedSectors = Object.entries(sectorStats).sort(
    ([, a], [, b]) => b.count - a.count
  );

  // Calculate total and percentages
  const totalCompanies = filteredCompanies.length;

  // Prepare data for chart
  const chartData = sortedSectors.map(([sector, data], index) => ({
    name: sector,
    value: data.count,
    percentage: ((data.count / totalCompanies) * 100).toFixed(1),
    color: COLORS[index % COLORS.length],
  }));

  // Calculate filtered count for selected sectors
  const filteredCount = selectedSectors.length > 0
    ? selectedSectors.reduce((sum, sector) => {
        const sectorData = sectorStats[sector];
        return sum + (sectorData?.count || 0);
      }, 0)
    : totalCompanies;

  // Custom label for the chart
  const renderCustomLabel = (entry: any) => {
    const percentage = parseFloat(entry.percentage);
    // Only show label if percentage is significant enough
    if (percentage < 5) return null;
    return `${percentage}%`;
  };

  // Calculate comparative metrics for selected sectors
  const calculateSectorMetrics = (sector: string) => {
    const sectorCompanies = sectorStats[sector]?.companies || [];
    const companiesWithTurnover = sectorCompanies.filter(c => c.turnover);
    const companiesWithEmployees = sectorCompanies.filter(c => c.employees);
    const totalProducts = sectorCompanies.reduce((sum, c) => sum + (c.products?.length || 0), 0);

    return {
      sector,
      avgTurnover: companiesWithTurnover.length > 0
        ? companiesWithTurnover.reduce((sum, c) => sum + (c.turnover || 0), 0) / companiesWithTurnover.length
        : 0,
      avgEmployees: companiesWithEmployees.length > 0
        ? companiesWithEmployees.reduce((sum, c) => sum + (c.employees || 0), 0) / companiesWithEmployees.length
        : 0,
      avgProducts: sectorCompanies.length > 0
        ? totalProducts / sectorCompanies.length
        : 0,
      totalCompanies: sectorCompanies.length,
      color: chartData.find(d => d.name === sector)?.color || COLORS[0]
    };
  };

  const selectedMetrics = selectedSectors.map(calculateSectorMetrics);

  return (
    <div className="space-y-4 h-full overflow-y-auto pb-4">
      {/* Header with controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Empresas por Sector</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Selección múltiple disponible
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveRangeFilters && (
              <Badge variant="default" className="text-xs">
                Filtrado
              </Badge>
            )}
            <Badge variant="secondary">{totalCompanies} total</Badge>
          </div>
        </div>

        {/* Multi-selection controls */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            className="flex items-center gap-1.5 h-8 text-xs"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            disabled={selectedSectors.length === 0}
            className="flex items-center gap-1.5 h-8 text-xs"
          >
            <XCircle className="h-3.5 w-3.5" />
            Limpiar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onInvertSelection}
            className="flex items-center gap-1.5 h-8 text-xs"
          >
            <Shuffle className="h-3.5 w-3.5" />
            Invertir
          </Button>
          <Button
            variant={hasActiveRangeFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 h-8 text-xs"
          >
            <Filter className="h-3.5 w-3.5" />
            Filtros
          </Button>
          {selectedSectors.length > 0 && (
            <Badge variant="default" className="ml-auto">
              {selectedSectors.length} seleccionado{selectedSectors.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Range Filters */}
        {showFilters && (
          <Card className="p-4 bg-muted/30 space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium mb-2 flex items-center justify-between">
                  <span>Rango de Facturación</span>
                  <span className="text-muted-foreground font-normal">
                    €{(turnoverRange[0] / 1000).toFixed(0)}K - €{(turnoverRange[1] / 1000).toFixed(0)}K
                  </span>
                </Label>
                <Slider
                  min={0}
                  max={maxTurnover}
                  step={10000}
                  value={turnoverRange}
                  onValueChange={(value) => onTurnoverRangeChange(value as [number, number])}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-xs font-medium mb-2 flex items-center justify-between">
                  <span>Rango de Empleados</span>
                  <span className="text-muted-foreground font-normal">
                    {employeeRange[0]} - {employeeRange[1]}
                  </span>
                </Label>
                <Slider
                  min={0}
                  max={maxEmployees}
                  step={1}
                  value={employeeRange}
                  onValueChange={(value) => onEmployeeRangeChange(value as [number, number])}
                  className="mt-2"
                />
              </div>

              {hasActiveRangeFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onTurnoverRangeChange([0, maxTurnover]);
                    onEmployeeRangeChange([0, maxEmployees]);
                  }}
                  className="w-full text-xs"
                >
                  Restablecer filtros
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Donut Chart */}
      <Card className="p-4 bg-muted/30 relative">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={renderCustomLabel}
              labelLine={false}
              onMouseEnter={(_, index) => setHoveredSector(chartData[index].name)}
              onMouseLeave={() => setHoveredSector(null)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="transition-opacity cursor-pointer"
                  opacity={
                    hoveredSector === null || hoveredSector === entry.name
                      ? 1
                      : 0.4
                  }
                  onClick={() => onSectorClick(entry.name)}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <Card className="p-3 shadow-lg">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: data.color }}
                        />
                        <div>
                          <p className="text-sm font-medium">{data.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {data.value} empresas ({data.percentage}%)
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                }
                return null;
              }}
            />
            {/* Center text inside chart */}
            <text
              x="50%"
              y="45%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground text-2xl font-bold"
            >
              {sortedSectors.length}
            </text>
            <text
              x="50%"
              y="55%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-xs"
            >
              sectores
            </text>
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Sector List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Detalle por Sector
          </h4>
          {selectedSectors.length > 0 && (
            <span className="text-xs text-primary font-medium">
              Mostrando {filteredCount} empresas
            </span>
          )}
        </div>
        <ScrollArea className="h-[280px] pr-3">
          <div className="space-y-2">
            {sortedSectors.map(([sector, data], index) => {
              const Icon = getSectorIcon(sector !== 'Sin sector' ? sector : null);
              const percentage = ((data.count / totalCompanies) * 100).toFixed(1);
              const isSelected = selectedSectors.includes(sector);
              const color = chartData[index].color;

              return (
                <Button
                  key={sector}
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn(
                    'w-full justify-start h-auto py-2.5 px-3 hover:bg-accent transition-all',
                    isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                    hoveredSector === sector && 'ring-2 ring-primary/50',
                    'relative'
                  )}
                  onClick={() => onSectorClick(sector)}
                  onMouseEnter={() => setHoveredSector(sector)}
                  onMouseLeave={() => setHoveredSector(null)}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2">
                      <CheckSquare className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  <div className={cn(
                    "flex items-center gap-3 w-full",
                    isSelected && "ml-3"
                  )}>
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <Icon className={cn(
                      'h-4 w-4 flex-shrink-0',
                      isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                    )} />
                    
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{sector}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={cn(
                            'text-xs',
                            isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                          )}>
                            {percentage}%
                          </span>
                          <Badge 
                            variant={isSelected ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {data.count}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Comparative Metrics */}
      {selectedSectors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Comparativa de Métricas
              </h4>
              <Badge variant="outline" className="text-xs">
                {selectedSectors.length} sector{selectedSectors.length > 1 ? 'es' : ''}
              </Badge>
            </div>
            
            {/* Chart Type Toggle */}
            <ToggleGroup 
              type="single" 
              value={chartType} 
              onValueChange={(value) => value && setChartType(value as ChartType)}
              className="gap-1"
            >
              <ToggleGroupItem value="horizontal" size="sm" className="h-7 w-7 p-0">
                <BarChartHorizontal className="h-3.5 w-3.5" />
              </ToggleGroupItem>
              <ToggleGroupItem value="vertical" size="sm" className="h-7 w-7 p-0">
                <BarChart3 className="h-3.5 w-3.5" />
              </ToggleGroupItem>
              <ToggleGroupItem value="line" size="sm" className="h-7 w-7 p-0">
                <LineChartIcon className="h-3.5 w-3.5" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="grid gap-3">
            {/* Turnover Comparison */}
            <Card className="p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h5 className="text-sm font-semibold">Facturación Promedio</h5>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                {chartType === 'horizontal' ? (
                  <BarChart data={selectedMetrics} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      type="number" 
                      tickFormatter={(value) => `€${(value / 1000).toFixed(0)}K`}
                      className="text-xs"
                    />
                    <YAxis 
                      type="category" 
                      dataKey="sector" 
                      width={80}
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <Card className="p-2 shadow-lg">
                              <p className="text-xs font-medium">{payload[0].payload.sector}</p>
                              <p className="text-xs text-primary">
                                €{((payload[0].value as number) / 1000).toFixed(0)}K
                              </p>
                            </Card>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="avgTurnover" radius={[0, 4, 4, 0]}>
                      {selectedMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : chartType === 'vertical' ? (
                  <BarChart data={selectedMetrics}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="sector" 
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `€${(value / 1000).toFixed(0)}K`}
                      className="text-xs"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <Card className="p-2 shadow-lg">
                              <p className="text-xs font-medium">{payload[0].payload.sector}</p>
                              <p className="text-xs text-primary">
                                €{((payload[0].value as number) / 1000).toFixed(0)}K
                              </p>
                            </Card>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="avgTurnover" radius={[4, 4, 0, 0]}>
                      {selectedMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={selectedMetrics}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="sector" 
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `€${(value / 1000).toFixed(0)}K`}
                      className="text-xs"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <Card className="p-2 shadow-lg">
                              <p className="text-xs font-medium">{payload[0].payload.sector}</p>
                              <p className="text-xs text-primary">
                                €{((payload[0].value as number) / 1000).toFixed(0)}K
                              </p>
                            </Card>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgTurnover" 
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </Card>

            {/* Employees Comparison */}
            <Card className="p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-primary" />
                <h5 className="text-sm font-semibold">Empleados Promedio</h5>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                {chartType === 'horizontal' ? (
                  <BarChart data={selectedMetrics} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis 
                      type="category" 
                      dataKey="sector" 
                      width={80}
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <Card className="p-2 shadow-lg">
                              <p className="text-xs font-medium">{payload[0].payload.sector}</p>
                              <p className="text-xs text-primary">
                                {(payload[0].value as number).toFixed(1)} empleados
                              </p>
                            </Card>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="avgEmployees" radius={[0, 4, 4, 0]}>
                      {selectedMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : chartType === 'vertical' ? (
                  <BarChart data={selectedMetrics}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="sector" className="text-xs" tick={{ fontSize: 11 }} />
                    <YAxis className="text-xs" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <Card className="p-2 shadow-lg">
                              <p className="text-xs font-medium">{payload[0].payload.sector}</p>
                              <p className="text-xs text-primary">
                                {(payload[0].value as number).toFixed(1)} empleados
                              </p>
                            </Card>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="avgEmployees" radius={[4, 4, 0, 0]}>
                      {selectedMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={selectedMetrics}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="sector" className="text-xs" tick={{ fontSize: 11 }} />
                    <YAxis className="text-xs" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <Card className="p-2 shadow-lg">
                              <p className="text-xs font-medium">{payload[0].payload.sector}</p>
                              <p className="text-xs text-primary">
                                {(payload[0].value as number).toFixed(1)} empleados
                              </p>
                            </Card>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgEmployees" 
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </Card>

            {/* Products Comparison */}
            <Card className="p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-primary" />
                <h5 className="text-sm font-semibold">Productos Promedio</h5>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                {chartType === 'horizontal' ? (
                  <BarChart data={selectedMetrics} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis 
                      type="category" 
                      dataKey="sector" 
                      width={80}
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <Card className="p-2 shadow-lg">
                              <p className="text-xs font-medium">{payload[0].payload.sector}</p>
                              <p className="text-xs text-primary">
                                {(payload[0].value as number).toFixed(1)} productos
                              </p>
                            </Card>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="avgProducts" radius={[0, 4, 4, 0]}>
                      {selectedMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : chartType === 'vertical' ? (
                  <BarChart data={selectedMetrics}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="sector" className="text-xs" tick={{ fontSize: 11 }} />
                    <YAxis className="text-xs" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <Card className="p-2 shadow-lg">
                              <p className="text-xs font-medium">{payload[0].payload.sector}</p>
                              <p className="text-xs text-primary">
                                {(payload[0].value as number).toFixed(1)} productos
                              </p>
                            </Card>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="avgProducts" radius={[4, 4, 0, 0]}>
                      {selectedMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={selectedMetrics}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="sector" className="text-xs" tick={{ fontSize: 11 }} />
                    <YAxis className="text-xs" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <Card className="p-2 shadow-lg">
                              <p className="text-xs font-medium">{payload[0].payload.sector}</p>
                              <p className="text-xs text-primary">
                                {(payload[0].value as number).toFixed(1)} productos
                              </p>
                            </Card>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgProducts" 
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Summary footer */}
          <Card className="p-3 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-primary">Análisis Combinado</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedSectors.length} sector{selectedSectors.length > 1 ? 'es' : ''} • {filteredCount} empresa{filteredCount !== 1 ? 's' : ''}
                </p>
              </div>
              <Badge variant="default" className="text-xs">
                {((filteredCount / totalCompanies) * 100).toFixed(1)}%
              </Badge>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
