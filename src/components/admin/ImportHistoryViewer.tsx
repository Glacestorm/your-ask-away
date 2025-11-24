import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, Users, CheckCircle2, XCircle, Loader2, Calendar, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ImportBatch {
  id: string;
  filename: string | null;
  total_records: number;
  successful_records: number;
  failed_records: number;
  created_at: string;
  created_by: string | null;
  notes: string | null;
  profiles?: {
    full_name: string | null;
    email: string;
  } | null;
}

export function ImportHistoryViewer() {
  const { t } = useLanguage();
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);

  useEffect(() => {
    fetchBatches();
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [batches, dateFrom, dateTo, selectedUser]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const { data: batchesData, error: batchesError } = await supabase
        .from('import_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (batchesError) throw batchesError;

      // Obtener información de usuarios
      const userIds = [...new Set(batchesData?.map(b => b.created_by).filter(Boolean))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      // Combinar datos
      const batchesWithProfiles = batchesData?.map(batch => ({
        ...batch,
        profiles: profilesData?.find(p => p.id === batch.created_by) || null,
      })) || [];

      setBatches(batchesWithProfiles);
    } catch (error) {
      console.error('Error fetching import batches:', error);
      toast.error('Error al cargar el historial de importaciones');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email');

      if (error) throw error;

      setUsers(data?.map(u => ({ id: u.id, name: u.full_name || u.email, email: u.email })) || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...batches];

    // Filtrar por fecha
    if (dateFrom) {
      filtered = filtered.filter(b => new Date(b.created_at) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(b => new Date(b.created_at) <= new Date(dateTo + 'T23:59:59'));
    }

    // Filtrar por usuario
    if (selectedUser !== 'all') {
      filtered = filtered.filter(b => b.created_by === selectedUser);
    }

    setFilteredBatches(filtered);
  };

  const exportToExcel = () => {
    try {
      const exportData = filteredBatches.map(batch => ({
        'Fecha': format(new Date(batch.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
        'Usuario': batch.profiles?.full_name || batch.profiles?.email || 'Desconocido',
        'Archivo': batch.filename || '-',
        'Total Registros': batch.total_records,
        'Exitosos': batch.successful_records,
        'Fallidos': batch.failed_records,
        'Tasa de Éxito': `${((batch.successful_records / batch.total_records) * 100).toFixed(1)}%`,
        'Notas': batch.notes || '-',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Historial Importaciones');

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 18 }, // Fecha
        { wch: 25 }, // Usuario
        { wch: 30 }, // Archivo
        { wch: 15 }, // Total Registros
        { wch: 10 }, // Exitosos
        { wch: 10 }, // Fallidos
        { wch: 15 }, // Tasa de Éxito
        { wch: 40 }, // Notas
      ];
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `historial_importaciones_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
      toast.success('Historial exportado exitosamente');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error al exportar el historial');
    }
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedUser('all');
  };

  const getSuccessRate = (batch: ImportBatch) => {
    if (batch.total_records === 0) return 0;
    return ((batch.successful_records / batch.total_records) * 100).toFixed(1);
  };

  const getTotalStats = () => {
    const total = filteredBatches.reduce((acc, b) => ({
      totalRecords: acc.totalRecords + b.total_records,
      successful: acc.successful + b.successful_records,
      failed: acc.failed + b.failed_records,
    }), { totalRecords: 0, successful: 0, failed: 0 });

    return total;
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Importaciones</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredBatches.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecords}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registros Exitosos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registros Fallidos</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Filtra el historial por fecha y usuario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Desde</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">Hasta</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user">Usuario</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger id="user">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex items-end gap-2">
              <Button variant="outline" onClick={clearFilters} className="flex-1">
                Limpiar
              </Button>
              <Button onClick={exportToExcel} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historial de Importaciones
          </CardTitle>
          <CardDescription>
            {filteredBatches.length} importaciones encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Archivo</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Exitosos</TableHead>
                  <TableHead className="text-center">Fallidos</TableHead>
                  <TableHead className="text-center">Tasa de Éxito</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron importaciones
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBatches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">
                        {format(new Date(batch.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {batch.profiles?.full_name || 'Desconocido'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {batch.profiles?.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{batch.filename || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{batch.total_records}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          {batch.successful_records}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {batch.failed_records > 0 ? (
                          <Badge variant="destructive">{batch.failed_records}</Badge>
                        ) : (
                          <Badge variant="outline">0</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={Number(getSuccessRate(batch)) >= 90 ? 'default' : 'secondary'}
                          className={
                            Number(getSuccessRate(batch)) >= 90
                              ? 'bg-green-500 hover:bg-green-600'
                              : ''
                          }
                        >
                          {getSuccessRate(batch)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {batch.notes || '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
