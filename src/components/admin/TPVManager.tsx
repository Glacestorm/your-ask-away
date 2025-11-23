import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CreditCard, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface TPVStats {
  terminal_id: string;
  terminal_identifier: string;
  terminal_type: string;
  bank_name: string;
  company_name: string;
  annual_revenue: number;
  affiliation_percentage: number;
  active: boolean;
  commissions: {
    nacional: number;
    propia: number;
    internacional: number;
  };
}

export function TPVManager() {
  const [stats, setStats] = useState<TPVStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBank, setFilterBank] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTPVStats();
  }, []);

  const fetchTPVStats = async () => {
    try {
      setLoading(true);

      // Fetch all terminals with company info
      const { data: terminals, error: terminalsError } = await supabase
        .from('company_tpv_terminals' as any)
        .select(`
          id,
          terminal_identifier,
          terminal_type,
          bank_name,
          annual_revenue,
          affiliation_percentage,
          active,
          company_id
        `)
        .order('annual_revenue', { ascending: false });

      if (terminalsError) throw terminalsError;

      // Fetch company names
      const companyIds = [...new Set(terminals?.map((t: any) => t.company_id))];
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds);

      if (companiesError) throw companiesError;

      const companiesMap = new Map(companies?.map(c => [c.id, c.name]));

      // Fetch all commissions
      const terminalIds = terminals?.map((t: any) => t.id) || [];
      const { data: commissions, error: commissionsError } = await supabase
        .from('tpv_commission_rates' as any)
        .select('*')
        .in('terminal_id', terminalIds);

      if (commissionsError) throw commissionsError;

      // Group commissions by terminal
      const commissionsMap = new Map<string, any>();
      commissions?.forEach((comm: any) => {
        if (!commissionsMap.has(comm.terminal_id)) {
          commissionsMap.set(comm.terminal_id, {
            nacional: 0,
            propia: 0,
            internacional: 0,
          });
        }
        const terminalComm = commissionsMap.get(comm.terminal_id);
        terminalComm[comm.card_type.toLowerCase()] = comm.commission_rate;
      });

      // Combine data
      const statsData: TPVStats[] = terminals?.map((terminal: any) => ({
        terminal_id: terminal.id,
        terminal_identifier: terminal.terminal_identifier,
        terminal_type: terminal.terminal_type,
        bank_name: terminal.bank_name,
        company_name: companiesMap.get(terminal.company_id) || 'Desconocida',
        annual_revenue: terminal.annual_revenue,
        affiliation_percentage: terminal.affiliation_percentage,
        active: terminal.active,
        commissions: commissionsMap.get(terminal.id) || {
          nacional: 0,
          propia: 0,
          internacional: 0,
        },
      })) || [];

      setStats(statsData);
    } catch (error: any) {
      console.error('Error fetching TPV stats:', error);
      toast.error('Error al cargar estadísticas de TPV');
    } finally {
      setLoading(false);
    }
  };

  const filteredStats = stats.filter((stat) => {
    if (filterBank !== 'all' && stat.bank_name !== filterBank) return false;
    if (filterType !== 'all' && stat.terminal_type !== filterType) return false;
    if (searchTerm && !stat.company_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !stat.terminal_identifier.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getTotalRevenue = () => {
    return filteredStats.reduce((sum, stat) => sum + stat.annual_revenue, 0);
  };

  const getAverageCommission = (type: 'nacional' | 'propia' | 'internacional') => {
    const activeTerminals = filteredStats.filter(s => s.active);
    if (activeTerminals.length === 0) return 0;
    const total = activeTerminals.reduce((sum, stat) => sum + stat.commissions[type], 0);
    return (total / activeTerminals.length).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Terminales</CardDescription>
            <CardTitle className="text-3xl">{filteredStats.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Facturación Total</CardDescription>
            <CardTitle className="text-2xl">
              {getTotalRevenue().toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Comisión Media Nacional</CardDescription>
            <CardTitle className="text-3xl">{getAverageCommission('nacional')}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Terminales Activos</CardDescription>
            <CardTitle className="text-3xl">
              {filteredStats.filter(s => s.active).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Gestión de Terminales TPV
          </CardTitle>
          <CardDescription>Vista global de todos los terminales del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-4">
            <Input
              placeholder="Buscar por empresa o terminal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select value={filterBank} onValueChange={setFilterBank}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Banco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los bancos</SelectItem>
                <SelectItem value="Creand">Creand</SelectItem>
                <SelectItem value="Morabanc">Morabanc</SelectItem>
                <SelectItem value="Andbank">Andbank</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Físico">Físico</SelectItem>
                <SelectItem value="LINK">LINK</SelectItem>
                <SelectItem value="Virtual">Virtual</SelectItem>
                <SelectItem value="MONEI">MONEI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Terminal</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead className="text-right">Facturación</TableHead>
                <TableHead className="text-right">% Vinc.</TableHead>
                <TableHead className="text-right">Com. Nacional</TableHead>
                <TableHead className="text-right">Com. Propia</TableHead>
                <TableHead className="text-right">Com. Internac.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    No se encontraron terminales
                  </TableCell>
                </TableRow>
              ) : (
                filteredStats.map((stat) => (
                  <TableRow key={stat.terminal_id}>
                    <TableCell>
                      <Badge variant={stat.active ? "default" : "secondary"}>
                        {stat.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{stat.company_name}</TableCell>
                    <TableCell>{stat.terminal_identifier}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{stat.terminal_type}</Badge>
                    </TableCell>
                    <TableCell>{stat.bank_name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {stat.annual_revenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-right">{stat.affiliation_percentage}%</TableCell>
                    <TableCell className="text-right">{stat.commissions.nacional}%</TableCell>
                    <TableCell className="text-right">{stat.commissions.propia}%</TableCell>
                    <TableCell className="text-right">{stat.commissions.internacional}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
