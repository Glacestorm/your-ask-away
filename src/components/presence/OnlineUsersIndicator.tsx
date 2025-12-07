import React, { useState } from 'react';
import { usePresence, OnlineUser } from '@/hooks/usePresence';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnlineUsersIndicatorProps {
  className?: string;
  showNames?: boolean;
  maxAvatars?: number;
}

const roleLabels: Record<string, string> = {
  superadmin: 'Superadmin',
  director_comercial: 'Director Comercial',
  director_oficina: 'Director Oficina',
  responsable_comercial: 'Resp. Comercial',
  gestor: 'Gestor',
  auditor: 'Auditor',
  user: 'Usuari',
};

const roleColors: Record<string, string> = {
  superadmin: 'bg-purple-500',
  director_comercial: 'bg-blue-500',
  director_oficina: 'bg-green-500',
  responsable_comercial: 'bg-amber-500',
  gestor: 'bg-cyan-500',
  auditor: 'bg-gray-500',
  user: 'bg-slate-500',
};

export function OnlineUsersIndicator({
  className,
  showNames = false,
  maxAvatars = 3,
}: OnlineUsersIndicatorProps) {
  const { onlineUsers, isConnected, onlineCount } = usePresence();
  const [isOpen, setIsOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const groupedUsers = React.useMemo(() => {
    const groups: Record<string, OnlineUser[]> = {};
    onlineUsers.forEach((user) => {
      const role = user.role || 'user';
      if (!groups[role]) {
        groups[role] = [];
      }
      groups[role].push(user);
    });
    return groups;
  }, [onlineUsers]);

  const displayedUsers = onlineUsers.slice(0, maxAvatars);
  const remainingCount = Math.max(0, onlineCount - maxAvatars);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full',
            'bg-muted/50 hover:bg-muted transition-colors',
            'border border-border/50',
            className
          )}
        >
          {isConnected ? (
            <Wifi className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-destructive" />
          )}

          <div className="flex -space-x-2">
            {displayedUsers.map((user) => (
              <Avatar
                key={user.id}
                className="h-6 w-6 border-2 border-background"
              >
                <AvatarImage src={user.avatar_url} alt={user.full_name} />
                <AvatarFallback
                  className={cn(
                    'text-[10px] text-white',
                    roleColors[user.role] || roleColors.user
                  )}
                >
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>

          <Badge
            variant="secondary"
            className="h-5 min-w-[20px] px-1.5 text-xs font-medium"
          >
            {remainingCount > 0 ? `+${remainingCount}` : onlineCount}
          </Badge>

          {showNames && onlineCount > 0 && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              online
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Usuaris Online</span>
            <Badge variant="secondary" className="ml-auto">
              {onlineCount}
            </Badge>
          </div>
        </div>

        <ScrollArea className="max-h-[300px]">
          <div className="p-2 space-y-3">
            {Object.entries(groupedUsers).map(([role, users]) => (
              <div key={role}>
                <div className="flex items-center gap-2 px-2 py-1">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      roleColors[role] || roleColors.user
                    )}
                  />
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {roleLabels[role] || role} ({users.length})
                  </span>
                </div>

                <div className="space-y-1">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-muted/50"
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={user.avatar_url}
                            alt={user.full_name}
                          />
                          <AvatarFallback
                            className={cn(
                              'text-xs text-white',
                              roleColors[user.role] || roleColors.user
                            )}
                          >
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.full_name}
                        </p>
                        {user.oficina && (
                          <p className="text-xs text-muted-foreground truncate">
                            {user.oficina}
                          </p>
                        )}
                      </div>

                      {user.current_page && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {user.current_page.split('/').pop() || 'home'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {onlineCount === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No hi ha altres usuaris online
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
