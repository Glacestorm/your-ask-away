import { useNavigate } from 'react-router-dom';
import { Home, ChevronLeft, ChevronRight, Map } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeSelector } from '@/components/ThemeSelector';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { OnlineUsersIndicator } from '@/components/presence/OnlineUsersIndicator';
import { OfflineSyncIndicator } from '@/components/dashboard/OfflineSyncIndicator';
import { ObelixiaLogo } from '@/components/ui/ObelixiaLogo';
import { NavButton3D } from '@/components/ui/NavButton3D';

interface GlobalNavHeaderProps {
  title?: string;
  subtitle?: string;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onGoBack?: () => void;
  onGoForward?: () => void;
}

export function GlobalNavHeader({ 
  title, 
  subtitle, 
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward
}: GlobalNavHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const hasTitle = title || subtitle;

  return (
    <header className="flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-card via-card to-accent/10 px-4 py-3 shadow-lg border border-border/40 backdrop-blur-sm">
      {/* Left Section: Logo + Navigation + Title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Logo */}
        <ObelixiaLogo size="sm" variant="icon" animated={false} />
        
        {/* Navigation Arrows */}
        {(canGoBack || canGoForward) && (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <NavButton3D
                  variant="ghost"
                  size="sm"
                  onClick={onGoBack}
                  disabled={!canGoBack}
                  icon={<ChevronLeft className="h-4 w-4" />}
                  aria-label="Atrás"
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">Atrás</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <NavButton3D
                  variant="ghost"
                  size="sm"
                  onClick={onGoForward}
                  disabled={!canGoForward}
                  icon={<ChevronRight className="h-4 w-4" />}
                  aria-label="Adelante"
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">Adelante</TooltipContent>
            </Tooltip>
          </div>
        )}
        
        {/* Title */}
        {hasTitle && (
          <div className="min-w-0">
            {title && (
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground truncate">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground font-medium truncate">{subtitle}</p>
            )}
          </div>
        )}
      </div>
      
      {/* Right Section: Actions */}
      <nav className="flex items-center gap-2" aria-label="Acciones principales">
        {/* Status Indicators */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 border border-border/30">
          <OfflineSyncIndicator />
          <OnlineUsersIndicator />
        </div>
        
        {/* Home Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <NavButton3D
              variant="default"
              size="md"
              onClick={() => navigate('/home')}
              icon={<Home className="h-4 w-4" />}
              aria-label="Inicio"
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">Inicio</TooltipContent>
        </Tooltip>
        
        {/* Map Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <NavButton3D
              variant="primary"
              size="md"
              onClick={() => navigate('/admin?section=map')}
              icon={<Map className="h-4 w-4" />}
              label="Mapa"
              aria-label="Mapa de empresas"
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">Mapa de empresas</TooltipContent>
        </Tooltip>
        
        {/* Profile Avatar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate('/profile')}
              className="relative h-9 w-9 rounded-xl overflow-hidden border-2 border-primary/30 shadow-md hover:border-primary/50 hover:scale-105 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Mi Perfil"
            >
              <Avatar className="h-full w-full">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-semibold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Mi Perfil</TooltipContent>
        </Tooltip>
        
        {/* Theme Selector */}
        <ThemeSelector />
        
        {/* Language Selector */}
        <LanguageSelector />
      </nav>
    </header>
  );
}
