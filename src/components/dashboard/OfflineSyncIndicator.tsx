// Offline Sync Status Indicator Component
// Shows connection status, pending operations, and sync controls

import React from 'react';
import { 
  Wifi, 
  WifiOff, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Download,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface OfflineSyncIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function OfflineSyncIndicator({ 
  className,
  showDetails = true 
}: OfflineSyncIndicatorProps) {
  const { user } = useAuth();
  const {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncNow,
    cacheAllData,
  } = useOfflineSync();

  const handleDownloadOffline = async () => {
    if (user?.id) {
      await cacheAllData(user.id);
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Mai';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Ara mateix';
    if (diff < 3600000) return `Fa ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Fa ${Math.floor(diff / 3600000)} h`;
    return date.toLocaleDateString('ca');
  };

  // Simple indicator for minimal display
  if (!showDetails) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-orange-500" />
        )}
        {pendingCount > 0 && (
          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
            {pendingCount}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={cn(
            "relative gap-2 h-9 px-3",
            !isOnline && "text-orange-600 dark:text-orange-400",
            className
          )}
        >
          {isSyncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isOnline ? (
            <Cloud className="h-4 w-4 text-green-500" />
          ) : (
            <CloudOff className="h-4 w-4" />
          )}
          
          <span className="hidden sm:inline text-sm">
            {isSyncing ? 'Sincronitzant...' : isOnline ? 'Online' : 'Offline'}
          </span>
          
          {pendingCount > 0 && (
            <Badge 
              variant={isOnline ? "secondary" : "destructive"} 
              className="h-5 px-1.5 text-xs"
            >
              {pendingCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-80">
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Connectat</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <span className="font-medium text-orange-600">Mode Offline</span>
                </>
              )}
            </div>
            
            <Badge variant={isOnline ? "outline" : "secondary"}>
              {isOnline ? 'Sync actiu' : 'Dades locals'}
            </Badge>
          </div>

          {/* Pending Operations */}
          {pendingCount > 0 && (
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Operacions pendents</span>
                <Badge variant="secondary">{pendingCount}</Badge>
              </div>
              {isSyncing && (
                <Progress value={33} className="h-1" />
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {isOnline 
                  ? 'Es sincronitzaran automàticament' 
                  : "S'enviaran quan hi hagi connexió"}
              </p>
            </div>
          )}

          {/* Last Sync */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Última sincronització</span>
            <span>{formatLastSync(lastSyncTime)}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={syncNow}
              disabled={!isOnline || isSyncing}
            >
              <RefreshCw className={cn(
                "h-4 w-4 mr-2",
                isSyncing && "animate-spin"
              )} />
              Sincronitzar
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleDownloadOffline}
              disabled={!isOnline || isSyncing || !user?.id}
            >
              <Download className="h-4 w-4 mr-2" />
              Descarregar
            </Button>
          </div>

          {/* Offline Mode Info */}
          {!isOnline && (
            <div className="text-xs text-muted-foreground bg-orange-50 dark:bg-orange-950/20 p-2 rounded">
              <strong>Mode offline actiu:</strong> Pots continuar treballant. 
              Els canvis es sincronitzaran automàticament quan tornis a tenir connexió.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default OfflineSyncIndicator;
