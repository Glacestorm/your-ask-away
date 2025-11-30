import { useNavigate } from 'react-router-dom';
import { Home, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeSelector } from '@/components/ThemeSelector';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface GlobalNavHeaderProps {
  title?: string;
  subtitle?: string;
  showSidebarTrigger?: boolean;
}

export function GlobalNavHeader({ title, subtitle, showSidebarTrigger = false }: GlobalNavHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-card via-card to-accent/20 p-6 shadow-lg border border-border/50">
      <div className="flex items-center gap-4">
        {showSidebarTrigger && <SidebarTrigger />}
        {(title || subtitle) && (
          <div>
            {title && (
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                {title}
              </h1>
            )}
            {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/home')}
          className="hover:bg-accent/50 transition-colors rounded-xl h-10 w-10"
          title="Inicio"
        >
          <Home className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/profile')}
          className="hover:bg-accent/50 transition-colors rounded-xl h-10 w-10"
          title="Mi Perfil"
        >
          <Avatar className="h-8 w-8">
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
