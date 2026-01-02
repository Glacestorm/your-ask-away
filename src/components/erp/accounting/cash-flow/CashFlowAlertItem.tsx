/**
 * CashFlowAlertItem - Componente para renderizar una alerta de flujo de caja
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CashFlowAlert } from '@/hooks/erp/useERPCashFlow';

export interface CashFlowAlertItemProps {
  alert: CashFlowAlert;
  onDismiss: (id: string) => void;
}

export function CashFlowAlertItem({ alert, onDismiss }: CashFlowAlertItemProps) {
  return (
    <div
      className={cn(
        "p-3 rounded-lg border flex items-start gap-3 transition-all",
        alert.type === 'critical' && 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
        alert.type === 'warning' && 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
        alert.type === 'info' && 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
      )}
    >
      {alert.type === 'critical' && <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />}
      {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />}
      {alert.type === 'info' && <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-sm">{alert.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={() => onDismiss(alert.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        {alert.recommendations.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Recomendaciones:</p>
            <ul className="text-xs space-y-0.5 ml-3">
              {alert.recommendations.slice(0, 2).map((rec, idx) => (
                <li key={idx} className="list-disc">{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default CashFlowAlertItem;
