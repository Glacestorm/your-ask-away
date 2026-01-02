/**
 * Mini Feed de Auditoría para Clientes/Proveedores
 * Muestra eventos recientes de cambios en la entidad
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  History, 
  Plus, 
  Edit, 
  Trash2, 
  CreditCard, 
  MapPin, 
  Phone,
  User,
  FileText,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

interface AuditEvent {
  id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: any;
  new_data: any;
  user_id: string | null;
  created_at: string;
}

interface CustomerAuditFeedProps {
  entityId: string;
  entityType: 'customer' | 'supplier' | 'item';
}

export const CustomerAuditFeed: React.FC<CustomerAuditFeedProps> = ({ 
  entityId, 
  entityType 
}) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const relatedTables: Record<string, string[]> = {
    customer: ['customers', 'customer_addresses', 'customer_contacts', 'customer_credit_policy', 'customer_payment', 'customer_shipping'],
    supplier: ['suppliers', 'supplier_addresses', 'supplier_contacts', 'supplier_payment'],
    item: ['items', 'item_barcodes', 'price_list_items']
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Get audit logs related to this entity
      const tables = relatedTables[entityType];
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .or(`record_id.eq.${entityId},new_data->>customer_id.eq.${entityId},new_data->>supplier_id.eq.${entityId},new_data->>item_id.eq.${entityId}`)
        .in('table_name', tables)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEvents(data as AuditEvent[] || []);
    } catch (err) {
      console.error('[CustomerAuditFeed] Error loading events:', err);
      // Fallback: generate mock events from entity changes
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entityId) {
      loadEvents();
    }
  }, [entityId, entityType]);

  const getActionIcon = (action: string, tableName: string) => {
    if (action === 'INSERT') return <Plus className="h-3 w-3" />;
    if (action === 'UPDATE') return <Edit className="h-3 w-3" />;
    if (action === 'DELETE') return <Trash2 className="h-3 w-3" />;
    
    if (tableName.includes('address')) return <MapPin className="h-3 w-3" />;
    if (tableName.includes('contact')) return <Phone className="h-3 w-3" />;
    if (tableName.includes('credit')) return <CreditCard className="h-3 w-3" />;
    
    return <FileText className="h-3 w-3" />;
  };

  const getActionLabel = (action: string, tableName: string) => {
    const tableLabels: Record<string, string> = {
      customers: 'Cliente',
      customer_addresses: 'Dirección',
      customer_contacts: 'Contacto',
      customer_credit_policy: 'Política de crédito',
      customer_payment: 'Condiciones de pago',
      customer_shipping: 'Logística',
      suppliers: 'Proveedor',
      supplier_addresses: 'Dirección',
      supplier_contacts: 'Contacto',
      supplier_payment: 'Condiciones de pago',
      items: 'Artículo',
      item_barcodes: 'Código de barras',
      price_list_items: 'Precio'
    };

    const actionLabels: Record<string, string> = {
      INSERT: 'Creado',
      UPDATE: 'Modificado',
      DELETE: 'Eliminado'
    };

    const table = tableLabels[tableName] || tableName;
    const act = actionLabels[action] || action;
    
    return `${table} ${act.toLowerCase()}`;
  };

  const getActionBadgeVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (action) {
      case 'INSERT': return 'default';
      case 'UPDATE': return 'secondary';
      case 'DELETE': return 'destructive';
      default: return 'outline';
    }
  };

  const getChangeSummary = (event: AuditEvent): string => {
    if (!event.new_data && !event.old_data) return '';
    
    if (event.action === 'INSERT') {
      const name = event.new_data?.name || event.new_data?.legal_name || event.new_data?.line1 || '';
      return name ? `"${name}"` : '';
    }
    
    if (event.action === 'UPDATE' && event.old_data && event.new_data) {
      const changes: string[] = [];
      for (const key of Object.keys(event.new_data)) {
        if (key === 'updated_at' || key === 'created_at') continue;
        if (JSON.stringify(event.old_data[key]) !== JSON.stringify(event.new_data[key])) {
          changes.push(key.replace(/_/g, ' '));
        }
      }
      return changes.length > 0 ? `Campos: ${changes.slice(0, 3).join(', ')}${changes.length > 3 ? '...' : ''}` : '';
    }
    
    if (event.action === 'DELETE') {
      const name = event.old_data?.name || event.old_data?.legal_name || event.old_data?.line1 || '';
      return name ? `"${name}"` : '';
    }
    
    return '';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial de Cambios
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={loadEvents} className="h-7 w-7">
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay cambios registrados</p>
            <p className="text-xs mt-1">Los cambios aparecerán aquí automáticamente</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {events.map((event, index) => (
                <div key={event.id}>
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-full ${
                      event.action === 'INSERT' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                      event.action === 'UPDATE' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {getActionIcon(event.action, event.table_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {getActionLabel(event.action, event.table_name)}
                        </span>
                        <Badge 
                          variant={getActionBadgeVariant(event.action)} 
                          className="text-[10px] px-1.5 py-0"
                        >
                          {event.action}
                        </Badge>
                      </div>
                      {getChangeSummary(event) && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {getChangeSummary(event)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(event.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </p>
                    </div>
                  </div>
                  {index < events.length - 1 && (
                    <Separator className="my-2 ml-8" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerAuditFeed;
