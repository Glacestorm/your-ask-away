import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Eye, TrendingUp, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Customer360Card() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/admin?section=customer-360');
  };

  return (
    <Card 
      className="cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg bg-gradient-to-br from-violet-500/10 to-purple-600/5 border-violet-500/20 group"
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-violet-500/30">
            <User className="h-6 w-6 text-white" />
          </div>
          <Badge variant="secondary" className="text-xs bg-violet-500/10 text-violet-700">
            <TrendingUp className="h-3 w-3 mr-1" />
            CDP
          </Badge>
        </div>
        <CardTitle className="text-lg mt-3 group-hover:text-violet-600 transition-colors">
          Customer 360°
        </CardTitle>
        <CardDescription className="text-sm">
          Vista unificada del cliente con scores, métricas y recomendaciones
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center">
            <Activity className="h-3 w-3 mr-1" />
            Health Score
          </div>
          <div className="flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            RFM Analysis
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
