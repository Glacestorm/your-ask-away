import { useNavigate } from 'react-router-dom';
import { Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeSelector } from '@/components/ThemeSelector';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
    <div className={`flex items-center ${hasTitle ? 'justify-between' : 'justify-end'} rounded-2xl bg-gradient-to-br from-card via-card to-accent/20 p-3 shadow-lg border border-border/50`}>
      {hasTitle && (
        <div className="flex items-center gap-3">
          {/* Navigation History Buttons */}
          {(onGoBack || onGoForward) && (
            <div className="flex items-center gap-1 mr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onGoBack}
                    disabled={!canGoBack}
                    className="h-8 w-8 rounded-lg hover:bg-accent/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Enrere</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onGoForward}
                    disabled={!canGoForward}
                    className="h-8 w-8 rounded-lg hover:bg-accent/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Endavant</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
          
          <div>
            {title && (
              <h1 className="text-base font-semibold tracking-tight text-foreground">
                {title}
              </h1>
            )}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        {/* Navigation History Buttons when no title */}
        {!hasTitle && (onGoBack || onGoForward) && (
          <div className="flex items-center gap-1 mr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onGoBack}
                  disabled={!canGoBack}
                  className="h-8 w-8 rounded-lg hover:bg-accent/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Enrere</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onGoForward}
                  disabled={!canGoForward}
                  className="h-8 w-8 rounded-lg hover:bg-accent/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Endavant</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/home')}
          className="hover:bg-accent/50 transition-colors rounded-xl h-9 w-9"
          title="Inicio"
        >
          <Home className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/profile')}
          className="hover:bg-accent/50 transition-colors rounded-xl h-9 w-9"
          title="Mi Perfil"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
        
        <ThemeSelector />
        <LanguageSelector />
      </div>
    </div>
  );
}
