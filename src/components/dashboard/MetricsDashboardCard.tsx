import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function MetricsDashboardCard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleClick = () => {
    navigate('/admin?section=filtered-metrics');
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] group"
      onClick={handleClick}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
          <BarChart3 className="h-5 w-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">Mètriques</h3>
          <p className="text-xs text-muted-foreground truncate">Visites, Productes, Vinculació i Gestors</p>
        </div>
      </CardContent>
    </Card>
  );
}
