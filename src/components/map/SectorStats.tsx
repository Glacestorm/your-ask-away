import { CompanyWithDetails } from '@/types/database';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getSectorIcon } from './markerIcons';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useState } from 'react';

interface SectorStatsProps {
  companies: CompanyWithDetails[];
  onSectorClick: (sector: string) => void;
  selectedSectors: string[];
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

export function SectorStats({ companies, onSectorClick, selectedSectors }: SectorStatsProps) {
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  // Group companies by sector and count
  const sectorStats = companies.reduce((acc, company) => {
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
  const totalCompanies = companies.length;

  // Prepare data for chart
  const chartData = sortedSectors.map(([sector, data], index) => ({
    name: sector,
    value: data.count,
    percentage: ((data.count / totalCompanies) * 100).toFixed(1),
    color: COLORS[index % COLORS.length],
  }));

  // Custom label for the chart
  const renderCustomLabel = (entry: any) => {
    const percentage = parseFloat(entry.percentage);
    // Only show label if percentage is significant enough
    if (percentage < 5) return null;
    return `${percentage}%`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Empresas por Sector</h3>
        <Badge variant="secondary">{totalCompanies} total</Badge>
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
        <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          Detalle por Sector
        </h4>
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
                    hoveredSector === sector && 'ring-2 ring-primary/50'
                  )}
                  onClick={() => onSectorClick(sector)}
                  onMouseEnter={() => setHoveredSector(sector)}
                  onMouseLeave={() => setHoveredSector(null)}
                >
                  <div className="flex items-center gap-3 w-full">
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

      {selectedSectors.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            {selectedSectors.length} sector{selectedSectors.length > 1 ? 'es' : ''} seleccionado{selectedSectors.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
