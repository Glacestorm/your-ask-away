import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  ShieldX,
  Activity,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useXAMAContext } from '@/contexts/XAMAContext';
import { XAMAVerificationDialog } from './XAMAVerificationDialog';
import { cn } from '@/lib/utils';

export function XAMAStatusIndicator() {
  const { state, refreshAllAttributes } = useXAMAContext();
  const [showVerification, setShowVerification] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  if (!state.profile) return null;
  
  const getStatusIcon = () => {
    if (state.profile.continuousAuthStatus === 'expired') {
      return <ShieldX className="h-4 w-4 text-destructive" />;
    }
    if (state.profile.riskLevel === 'critical' || state.profile.riskLevel === 'high') {
      return <ShieldAlert className="h-4 w-4 text-yellow-500" />;
    }
    if (state.profile.overallTrustScore >= 70) {
      return <ShieldCheck className="h-4 w-4 text-green-500" />;
    }
    return <Shield className="h-4 w-4 text-muted-foreground" />;
  };
  
  const getStatusColor = () => {
    if (state.profile.continuousAuthStatus === 'expired') return 'bg-destructive';
    if (state.profile.riskLevel === 'critical') return 'bg-red-500';
    if (state.profile.riskLevel === 'high') return 'bg-orange-500';
    if (state.profile.riskLevel === 'medium') return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAllAttributes();
    setIsRefreshing(false);
  };
  
  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative gap-2">
            {getStatusIcon()}
            <span className="hidden sm:inline text-xs">XAMA</span>
            <span className={cn(
              "absolute -top-1 -right-1 h-2 w-2 rounded-full",
              getStatusColor()
            )} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                XAMA Status
              </h4>
              <Badge variant={
                state.profile.continuousAuthStatus === 'active' ? 'default' :
                state.profile.continuousAuthStatus === 'degraded' ? 'secondary' : 'destructive'
              }>
                {state.profile.continuousAuthStatus.toUpperCase()}
              </Badge>
            </div>
            
            {/* Trust Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confiança</span>
                <span className="font-medium">{state.profile.overallTrustScore}%</span>
              </div>
              <Progress value={state.profile.overallTrustScore} />
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{state.profile.authenticationLevel}</p>
                  <p className="text-xs text-muted-foreground">Nivell AAL</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium capitalize">{state.profile.riskLevel}</p>
                  <p className="text-xs text-muted-foreground">Risc</p>
                </div>
              </div>
            </div>
            
            {/* Session Health */}
            {state.sessionHealth && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Expira en: {Math.round(state.sessionHealth.timeUntilExpiry)} min
                  </span>
                </div>
                
                {state.sessionHealth.issues.length > 0 && (
                  <p className="text-xs text-yellow-500">
                    {state.sessionHealth.issues.length} advertència(s)
                  </p>
                )}
              </div>
            )}
            
            {/* Anomaly Alert */}
            {state.lastAnomalyDetection?.isAnomaly && (
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm">
                <p className="font-medium text-yellow-500">Anomalia Detectada</p>
                <p className="text-xs text-muted-foreground">
                  {state.lastAnomalyDetection.anomalyType.join(', ')}
                </p>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={isRefreshing}
                onClick={handleRefresh}
              >
                <RefreshCw className={cn("h-3 w-3 mr-1", isRefreshing && "animate-spin")} />
                Refrescar
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => setShowVerification(true)}
              >
                Verificar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      <XAMAVerificationDialog
        open={showVerification}
        onOpenChange={setShowVerification}
      />
    </>
  );
}
