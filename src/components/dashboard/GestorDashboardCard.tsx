import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface GestorDashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
  isActive?: boolean;
  stats?: {
    value: string | number;
    label: string;
  };
  tooltip?: string;
}

export function GestorDashboardCard({
  title,
  description,
  icon: Icon,
  color,
  onClick,
  isActive = false,
  stats,
  tooltip
}: GestorDashboardCardProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

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

  return (
    <div
      className="perspective-1000"
      style={{ perspective: '1000px' }}
    >
      <div
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        className={cn(
          "relative cursor-pointer rounded-2xl p-6 h-48 transition-all duration-300 ease-out",
          "border-2 shadow-lg hover:shadow-2xl",
          "bg-gradient-to-br from-card via-card to-card/80",
          "transform-gpu will-change-transform",
          isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background",
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
            background: `radial-gradient(circle at 50% 0%, ${color}20, transparent 70%)`,
          }}
        />

        {/* Tooltip info icon */}
        {tooltip && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "absolute top-3 right-3 z-20 p-1.5 rounded-full transition-all duration-200",
                    "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground",
                    "opacity-0 group-hover:opacity-100",
                    isHovered && "opacity-100"
                  )}
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                className="max-w-xs text-sm p-3 bg-popover border shadow-lg"
                sideOffset={8}
              >
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between" style={{ transform: 'translateZ(30px)' }}>
          <div className="flex items-start justify-between">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-300",
                isHovered && "scale-110"
              )}
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon className="h-7 w-7" style={{ color }} />
            </div>
            {stats && (
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">{stats.value}</div>
                <div className="text-xs text-muted-foreground">{stats.label}</div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          </div>
        </div>

        {/* Bottom gradient line */}
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl transition-all duration-300",
            isHovered ? "opacity-100" : "opacity-50"
          )}
          style={{ backgroundColor: color }}
        />

        {/* Active indicator */}
        {isActive && (
          <div 
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-background animate-pulse"
            style={{ backgroundColor: color }}
          />
        )}
      </div>
    </div>
  );
}