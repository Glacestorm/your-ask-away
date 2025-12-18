import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { History, Search, Download, Filter, RefreshCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_email?: string;
}

const actions = ['create', 'update', 'delete', 'publish', 'unpublish', 'login', 'logout'];
const entities = ['page', 'post', 'theme', 'setting', 'user', 'media', 'navigation', 'translation'];

export function AuditDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => { loadLogs(); }, [filterAction, filterEntity, dateFrom, dateTo]);

  const loadLogs = async () => {
    try {
      let query = supabase.from('cms_audit_log').select('*').order('created_at', { ascending: false }).limit(100);
      if (filterAction !== 'all') query = query.eq('action', filterAction);
      if (filterEntity !== 'all') query = query.eq('entity_type', filterEntity);
      if (dateFrom) query = query.gte('created_at', dateFrom);
      if (dateTo) query = query.lte('created_at', dateTo);

      const { data, error } = await query;
      if (error) throw error;

      const userIds = [...new Set(data?.map(l => l.user_id).filter(Boolean))];
      const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', userIds);
      const emailMap = new Map(profiles?.map(p => [p.id, p.email]));

      setLogs((data as any[])?.map(l => ({
        ...l,
        old_value: l.old_value as Record<string, any> | null,
        new_value: l.new_value as Record<string, any> | null,
        user_email: emailMap.get(l.user_id) || 'Sistema'
      })) || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = () => {
    const csv = [
      ['Fecha', 'Usuario', 'Acción', 'Entidad', 'ID', 'IP'].join(','),
      ...logs.map(l => [
        format(new Date(l.created_at), 'yyyy-MM-dd HH:mm:ss'),
        l.user_email,
        l.action,
        l.entity_type,
        l.entity_id || '',
        l.ip_address || ''
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Exportado');
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-500/20 text-green-500';
      case 'update': return 'bg-blue-500/20 text-blue-500';
      case 'delete': return 'bg-red-500/20 text-red-500';
      case 'publish': return 'bg-purple-500/20 text-purple-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const filtered = logs.filter(l => 
    search === '' || 
    l.entity_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.user_email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2"><History className="h-6 w-6" />Auditoría CMS</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadLogs}><RefreshCw className="h-4 w-4 mr-2" />Actualizar</Button>
          <Button variant="outline" onClick={exportLogs}><Download className="h-4 w-4 mr-2" />Exportar</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-10" />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Acción" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {actions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterEntity} onValueChange={setFilterEntity}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Entidad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {entities.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-2 max-h-[600px] overflow-y-auto">
              {filtered.map(log => (
                <div key={log.id} className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 ${selectedLog?.id === log.id ? 'bg-muted/50 border-primary' : ''}`} onClick={() => setSelectedLog(log)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                      <Badge variant="outline">{log.entity_type}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                  <p className="font-medium">{log.entity_name || log.entity_id || 'Sin nombre'}</p>
                  <p className="text-sm text-muted-foreground">{log.user_email}</p>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No hay registros</p>}
            </div>

            <Card>
              <CardHeader><CardTitle>Detalles</CardTitle></CardHeader>
              <CardContent>
                {selectedLog ? (
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Fecha</p>
                      <p>{format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss')}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Usuario</p>
                      <p>{selectedLog.user_email}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">IP</p>
                      <p>{selectedLog.ip_address || 'N/A'}</p>
                    </div>
                    {selectedLog.old_value && (
                      <div>
                        <p className="font-medium text-muted-foreground">Valor anterior</p>
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">{JSON.stringify(selectedLog.old_value, null, 2)}</pre>
                      </div>
                    )}
                    {selectedLog.new_value && (
                      <div>
                        <p className="font-medium text-muted-foreground">Valor nuevo</p>
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">{JSON.stringify(selectedLog.new_value, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Selecciona un registro</p>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
