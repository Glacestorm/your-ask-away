import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  Fingerprint, 
  Smartphone, 
  MapPin, 
  Activity,
  Key,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useXAMAContext } from '@/contexts/XAMAContext';
import { cn } from '@/lib/utils';

interface XAMAVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredSensitivity?: 'low' | 'medium' | 'high' | 'critical';
  onVerificationComplete?: (success: boolean) => void;
}

const ATTRIBUTE_ICONS: Record<string, React.ReactNode> = {
  device: <Smartphone className="h-5 w-5" />,
  location: <MapPin className="h-5 w-5" />,
  behavior: <Activity className="h-5 w-5" />,
  biometric: <Fingerprint className="h-5 w-5" />,
  passkey: <Key className="h-5 w-5" />,
  session: <Shield className="h-5 w-5" />
};

const ATTRIBUTE_LABELS: Record<string, string> = {
  device: 'Dispositiu',
  location: 'Ubicació',
  behavior: 'Comportament',
  biometric: 'Biometria',
  passkey: 'Passkey',
  session: 'Sessió'
};

export function XAMAVerificationDialog({
  open,
  onOpenChange,
  requiredSensitivity = 'medium',
  onVerificationComplete
}: XAMAVerificationDialogProps) {
  const { state, verifyAttribute, verifyForResource, refreshAllAttributes } = useXAMAContext();
  const [verifyingAttribute, setVerifyingAttribute] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleVerifyAttribute = async (attribute: string) => {
    setVerifyingAttribute(attribute);
    const success = await verifyAttribute(attribute);
    setVerifyingAttribute(null);
    
    if (success && state.profile) {
      const authorized = await verifyForResource(requiredSensitivity);
      if (authorized) {
        onVerificationComplete?.(true);
        onOpenChange(false);
      }
    }
  };
  
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await refreshAllAttributes();
    setIsRefreshing(false);
    
    const authorized = await verifyForResource(requiredSensitivity);
    if (authorized) {
      onVerificationComplete?.(true);
      onOpenChange(false);
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };
  
  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (score >= 60) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };
  
  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };
  
  if (!state.profile) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Verificació XAMA
          </DialogTitle>
          <DialogDescription>
            Verificació multi-atribut per accedir a recursos de nivell {requiredSensitivity.toUpperCase()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Overall Trust Score */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Puntuació de Confiança Global</span>
                <Badge variant={getRiskBadgeVariant(state.profile.riskLevel)}>
                  Risc: {state.profile.riskLevel.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Progress value={state.profile.overallTrustScore} className="flex-1" />
                <span className={cn("font-bold text-lg", getScoreColor(state.profile.overallTrustScore))}>
                  {state.profile.overallTrustScore}%
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                <span>Nivell AAL: {state.profile.authenticationLevel}</span>
                <span>Estat: {state.profile.continuousAuthStatus}</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Attribute Scores */}
          <div className="grid grid-cols-2 gap-4">
            {state.profile.attributes.map((attr) => (
              <Card key={attr.attribute} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {ATTRIBUTE_ICONS[attr.attribute]}
                      <span className="font-medium">{ATTRIBUTE_LABELS[attr.attribute]}</span>
                    </div>
                    {getScoreIcon(attr.score)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Progress value={attr.score} className="flex-1 h-2" />
                      <span className={cn("text-sm font-medium", getScoreColor(attr.score))}>
                        {attr.score}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Confiança: {Math.round(attr.confidence * 100)}%</span>
                      <span>Pes: {Math.round(attr.weight * 100)}%</span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      disabled={verifyingAttribute === attr.attribute}
                      onClick={() => handleVerifyAttribute(attr.attribute)}
                    >
                      {verifyingAttribute === attr.attribute ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Verificant...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Verificar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Session Health */}
          {state.sessionHealth && (
            <Card className={cn(
              "border-2",
              state.sessionHealth.status === 'healthy' && "border-green-500/30",
              state.sessionHealth.status === 'warning' && "border-yellow-500/30",
              state.sessionHealth.status === 'critical' && "border-red-500/30"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Estat de la Sessió</span>
                  <Badge variant={
                    state.sessionHealth.status === 'healthy' ? 'default' :
                    state.sessionHealth.status === 'warning' ? 'secondary' : 'destructive'
                  }>
                    {state.sessionHealth.status.toUpperCase()}
                  </Badge>
                </div>
                
                {state.sessionHealth.issues.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {state.sessionHealth.issues.map((issue, i) => (
                      <p key={i} className="text-sm text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        {issue}
                      </p>
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground">
                  Temps fins expiració: {Math.round(state.sessionHealth.timeUntilExpiry)} minuts
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel·lar
            </Button>
            <Button
              className="flex-1"
              disabled={isRefreshing}
              onClick={handleRefreshAll}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Actualitzant...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualitzar Tot
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
