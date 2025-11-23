import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Filter, CalendarDays } from 'lucide-react';
import { format, subMonths, subDays, startOfYear, endOfYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface DateRangeFilterProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('lastMonth');

  const setPredefinedPeriod = (period: string) => {
    setSelectedPeriod(period);
    const today = new Date();
    let from: Date;
    let to: Date = today;

    switch (period) {
      case 'last7days':
        from = subDays(today, 7);
        break;
      case 'lastMonth':
        from = subMonths(today, 1);
        break;
      case 'last3months':
        from = subMonths(today, 3);
        break;
      case 'last6months':
        from = subMonths(today, 6);
        break;
      case 'thisYear':
        from = startOfYear(today);
        to = endOfYear(today);
        break;
      case 'lastYear':
        const lastYear = new Date(today.getFullYear() - 1, 0, 1);
        from = startOfYear(lastYear);
        to = endOfYear(lastYear);
        break;
      default:
        from = subMonths(today, 1);
    }

    onDateRangeChange({ from, to });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros de Periodo
        </CardTitle>
        <CardDescription>
          Selecciona un rango de fechas para analizar los datos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedPeriod === 'last7days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPredefinedPeriod('last7days')}
            >
              Últimos 7 días
            </Button>
            <Button
              variant={selectedPeriod === 'lastMonth' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPredefinedPeriod('lastMonth')}
            >
              Último mes
            </Button>
            <Button
              variant={selectedPeriod === 'last3months' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPredefinedPeriod('last3months')}
            >
              Últimos 3 meses
            </Button>
            <Button
              variant={selectedPeriod === 'last6months' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPredefinedPeriod('last6months')}
            >
              Últimos 6 meses
            </Button>
            <Button
              variant={selectedPeriod === 'thisYear' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPredefinedPeriod('thisYear')}
            >
              Este año
            </Button>
            <Button
              variant={selectedPeriod === 'lastYear' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPredefinedPeriod('lastYear')}
            >
              Año pasado
            </Button>
          </div>

          {/* Custom Date Range Picker */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Popover modal={true}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full sm:w-auto justify-start text-left font-normal',
                    !dateRange && 'text-muted-foreground'
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'dd/MM/yyyy')} -{' '}
                        {format(dateRange.to, 'dd/MM/yyyy')}
                      </>
                    ) : (
                      format(dateRange.from, 'dd/MM/yyyy')
                    )
                  ) : (
                    <span>Rango personalizado</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-0 z-[100] bg-background border shadow-lg" 
                align="start"
                side="bottom"
                sideOffset={10}
                avoidCollisions={true}
                collisionPadding={20}
              >
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    onDateRangeChange(range);
                    setSelectedPeriod('custom');
                  }}
                  numberOfMonths={2}
                  className={cn('p-3 pointer-events-auto bg-background')}
                />
              </PopoverContent>
            </Popover>
            
            {dateRange?.from && dateRange?.to && (
              <div className="text-sm text-muted-foreground">
                📊 Datos: {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
