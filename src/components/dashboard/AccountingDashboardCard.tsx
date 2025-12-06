import { useNavigate } from 'react-router-dom';
import { Calculator, FileText, TrendingUp, Building2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AccountingDashboardCardProps {
  onNavigate?: () => void;
}

export function AccountingDashboardCard({ onNavigate }: AccountingDashboardCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statementsCount, setStatementsCount] = useState(0);
  const [companiesWithStatements, setCompaniesWithStatements] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Card state
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchAccountingStats();
    }
  }, [user?.id]);

  const fetchAccountingStats = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Get count of financial statements
      const { count: statementsTotal } = await supabase
        .from('company_financial_statements')
        .select('*', { count: 'exact', head: true });

      // Get count of companies with statements
      const { data: uniqueCompanies } = await supabase
        .from('company_financial_statements')
        .select('company_id')
        .limit(1000);

      const uniqueCompanyIds = new Set(uniqueCompanies?.map(c => c.company_id) || []);

      setStatementsCount(statementsTotal || 0);
      setCompaniesWithStatements(uniqueCompanyIds.size);
    } catch (error) {
      console.error('Error fetching accounting stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const rotateXValue = (mouseY / (rect.height / 2)) * -15;
    const rotateYValue = (mouseX / (rect.width / 2)) * 15;
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleClick = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      navigate('/admin?section=accounting&view=menu');
    }
  };

  const cardColor = 'hsl(var(--chart-3))';

  return (
    <div
      className="perspective-1000"
      style={{ perspective: '1000px' }}
    >
      <div
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        className={cn(
          "relative cursor-pointer rounded-2xl p-6 h-48 transition-all duration-300 ease-out",
          "border-2 shadow-lg hover:shadow-2xl",
          "bg-gradient-to-br from-card via-card to-card/80",
          "transform-gpu will-change-transform",
          isHovered && "scale-[1.02]"
        )}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glow effect */}
        <div 
          className={cn(
            "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
            isHovered && "opacity-100"
          )}
          style={{
            background: `radial-gradient(circle at 50% 0%, ${cardColor}20, transparent 70%)`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between" style={{ transform: 'translateZ(30px)' }}>
          <div className="flex items-start justify-between">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-300",
                isHovered && "scale-110"
              )}
              style={{ backgroundColor: `${cardColor}20` }}
            >
              <Calculator className="h-7 w-7" style={{ color: cardColor }} />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">{statementsCount}</div>
              <div className="text-xs text-muted-foreground">Estats</div>
            </div>
          </div>

          {/* Compact stats row */}
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-3 text-xs">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-background/50 cursor-help">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{companiesWithStatements} emp.</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p>Empreses amb estats financers</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-background/50 cursor-help">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Balanços</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p>Gestió d'estats financers</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          {/* Title and description */}
          <div>
            <h3 className="font-semibold text-lg text-foreground mb-1">Comptabilitat</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              Gestió comptable i estats financers...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}