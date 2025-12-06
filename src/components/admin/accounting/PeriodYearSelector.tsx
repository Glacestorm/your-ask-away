import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Clock, FileText, Calendar, ChevronLeft, ChevronRight, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface YearData {
  fiscal_year: number;
  status: 'draft' | 'submitted' | 'approved';
  statement_type: string;
  is_archived: boolean;
  has_balance: boolean;
}

interface PeriodYearSelectorProps {
  companyId: string;
  selectedYear: number;
  onSelectYear: (year: number) => void;
}

const PeriodYearSelector = ({ companyId, selectedYear, onSelectYear }: PeriodYearSelectorProps) => {
  const [years, setYears] = useState<YearData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (companyId) {
      fetchYears();
    }
  }, [companyId]);

  const fetchYears = async () => {
    setLoading(true);
    try {
      // Fetch all statements for this company
      const { data: statements, error } = await supabase
        .from('company_financial_statements')
        .select('fiscal_year, status, statement_type, is_archived')
        .eq('company_id', companyId)
        .order('fiscal_year', { ascending: false });

      if (error) throw error;

      // Get balance info for each statement
      const yearsData: YearData[] = [];
      
      for (const stmt of statements || []) {
        const { data: balance } = await supabase
          .from('balance_sheets')
          .select('id')
          .eq('statement_id', stmt.fiscal_year.toString())
          .maybeSingle();

        yearsData.push({
          fiscal_year: stmt.fiscal_year,
          status: stmt.status as 'draft' | 'submitted' | 'approved',
          statement_type: stmt.statement_type,
          is_archived: stmt.is_archived,
          has_balance: !!balance
        });
      }

      setYears(yearsData);
    } catch (error) {
      console.error('Error fetching years:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeYears = years.filter(y => !y.is_archived);
  const archivedYears = years.filter(y => y.is_archived);
  const displayYears = showArchived ? years : activeYears;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="w-3 h-3 text-amber-500" />;
      case 'submitted':
        return <FileText className="w-3 h-3 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'border-amber-500/50 bg-amber-500/10';
      case 'submitted':
        return 'border-blue-500/50 bg-blue-500/10';
      case 'approved':
        return 'border-green-500/50 bg-green-500/10';
      default:
        return 'border-border';
    }
  };

  const getModelAbbr = (type: string) => {
    switch (type) {
      case 'normal': return 'N';
      case 'abreujat': return 'A';
      case 'simplificat': return 'S';
      default: return '?';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-16 h-10 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (years.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Calendar className="w-4 h-4" />
        <span>Sense exercicis fiscals</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <TooltipProvider>
          {displayYears.map((year) => (
            <Tooltip key={year.fiscal_year}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => !year.is_archived && onSelectYear(year.fiscal_year)}
                  disabled={year.is_archived}
                  className={cn(
                    'relative h-12 px-3 transition-all',
                    selectedYear === year.fiscal_year && !year.is_archived 
                      ? 'ring-2 ring-primary ring-offset-2' 
                      : '',
                    getStatusColor(year.status),
                    year.is_archived && 'opacity-50'
                  )}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(year.status)}
                      <span className="font-semibold">{year.fiscal_year}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge 
                        variant="secondary" 
                        className="text-[10px] px-1 py-0 h-4"
                      >
                        {getModelAbbr(year.statement_type)}
                      </Badge>
                      {year.is_archived && (
                        <Archive className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  <p className="font-semibold">Exercici {year.fiscal_year}</p>
                  <p>Model: {year.statement_type}</p>
                  <p>Estat: {year.status === 'draft' ? 'Esborrany' : year.status === 'submitted' ? 'Enviat' : 'Aprovat'}</p>
                  {year.is_archived && <p className="text-amber-500">Arxivat</p>}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>

        {archivedYears.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className="text-muted-foreground"
          >
            <Archive className="w-4 h-4 mr-1" />
            {showArchived ? 'Ocultar arxivats' : `${archivedYears.length} arxivats`}
          </Button>
        )}
      </div>

      {/* Period indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="w-3 h-3" />
        <span>Període fiscal: Gener - Desembre</span>
        <span className="text-muted-foreground/50">|</span>
        <span>{activeYears.length} exercicis actius</span>
        {activeYears.length >= 5 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600 border-amber-500/30">
            Màxim actius
          </Badge>
        )}
      </div>
    </div>
  );
};

export default PeriodYearSelector;
