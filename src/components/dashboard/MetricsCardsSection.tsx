import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, TrendingUp, ArrowRight } from 'lucide-react';

export function MetricsCardsSection() {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate('/admin?section=filtered-metrics');
  };

  return (
    <Card 
      className="cursor-pointer group relative overflow-hidden border-primary/20 hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-primary/5 via-transparent to-primary/10"
      onClick={handleCardClick}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full bg-primary/10 opacity-50 group-hover:opacity-80 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-20 h-20 rounded-tr-full bg-primary/5 opacity-50" />
      
      <CardContent className="p-5 flex items-center gap-4 relative z-10">
        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <BarChart3 className="h-7 w-7 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-base">Quadre de Comandament</h3>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-sm text-muted-foreground leading-tight">
            Mètriques integrals: Visites, Productes, Vinculació, Benchmarks
          </p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </CardContent>
    </Card>
  );
}
