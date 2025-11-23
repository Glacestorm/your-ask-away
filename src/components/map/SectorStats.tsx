import { CompanyWithDetails } from '@/types/database';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getSectorIcon } from './markerIcons';
import { cn } from '@/lib/utils';

interface SectorStatsProps {
  companies: CompanyWithDetails[];
  onSectorClick: (sector: string) => void;
  selectedSectors: string[];
}

export function SectorStats({ companies, onSectorClick, selectedSectors }: SectorStatsProps) {
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Empresas por Sector</h3>
        <Badge variant="secondary">{totalCompanies} total</Badge>
      </div>

      <ScrollArea className="h-[400px] pr-3">
        <div className="space-y-2">
          {sortedSectors.map(([sector, data]) => {
            const Icon = getSectorIcon(sector !== 'Sin sector' ? sector : null);
            const percentage = ((data.count / totalCompanies) * 100).toFixed(1);
            const isSelected = selectedSectors.includes(sector);

            return (
              <Button
                key={sector}
                variant={isSelected ? 'default' : 'outline'}
                className={cn(
                  'w-full justify-start h-auto py-3 px-3 hover:bg-accent',
                  isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
                onClick={() => onSectorClick(sector)}
              >
                <div className="flex items-center gap-3 w-full">
                  <Icon className={cn(
                    'h-5 w-5 flex-shrink-0',
                    isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                  )} />
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium truncate">{sector}</span>
                      <Badge 
                        variant={isSelected ? 'secondary' : 'outline'}
                        className="flex-shrink-0"
                      >
                        {data.count}
                      </Badge>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all',
                          isSelected ? 'bg-primary-foreground' : 'bg-primary'
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    
                    <span className={cn(
                      'text-xs mt-1 block',
                      isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    )}>
                      {percentage}% del total
                    </span>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </ScrollArea>

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
