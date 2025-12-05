import { useNavigate, useSearchParams } from 'react-router-dom';
import { Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MapButtonProps {
  onNavigateToMap?: () => void;
}

export function MapButton({ onNavigateToMap }: MapButtonProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleClick = () => {
    if (onNavigateToMap) {
      onNavigateToMap();
    } else {
      navigate('/admin?section=map');
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleClick}
          variant="outline"
          className="gap-2 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 hover:bg-primary/20 hover:border-primary/50 transition-all duration-300"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/80 shadow-sm">
            <Map className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-medium">Mapa</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Obrir el mapa d'empreses</p>
      </TooltipContent>
    </Tooltip>
  );
}
