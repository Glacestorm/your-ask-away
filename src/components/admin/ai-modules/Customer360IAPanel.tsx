import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, User, Heart, TrendingUp, Maximize2, Minimize2 } from 'lucide-react';
import { useCustomer360IA } from '@/hooks/admin/useCustomer360IA';
import { cn } from '@/lib/utils';

interface Customer360IAPanelProps {
  context?: { entityId: string; entityName?: string } | null;
  className?: string;
}

export function Customer360IAPanel({ context, className }: Customer360IAPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isLoading, customer, fetchCustomer360, getHealthColor } = useCustomer360IA();

  useEffect(() => {
    if (context?.entityId) fetchCustomer360(context.entityId);
  }, [context?.entityId, fetchCustomer360]);

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <User className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona un cliente para vista 360°</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all duration-300 overflow-hidden", isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
              <User className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-base">Customer 360° IA</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => fetchCustomer360(context.entityId)} disabled={isLoading} className="h-8 w-8">
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8">
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
          {customer ? (
            <div className="space-y-3">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.demographics?.industry || 'Cliente'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-muted/30">
                    <p className="text-xs text-muted-foreground">Lifetime Value</p>
                    <p className="font-medium">${customer.financial?.lifetime_value?.toLocaleString() || 0}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/30">
                    <p className="text-xs text-muted-foreground">Health Score</p>
                    <div className="flex items-center gap-1">
                      <Heart className={cn("h-4 w-4", getHealthColor(customer.engagement?.health_score || 0))} />
                      <span className="font-medium">{customer.engagement?.health_score || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
              {customer.alerts?.map((alert, idx) => (
                <div key={idx} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm">{alert.message}</span>
                  </div>
                  <Badge variant="outline" className="text-xs mt-2">{alert.type}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50 animate-pulse" />
              <p className="text-sm">Cargando perfil 360°...</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default Customer360IAPanel;
