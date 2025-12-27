import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Mail, Phone, Building2, Calendar, Clock, 
  CheckCircle, XCircle, MessageSquare, User,
  RefreshCw, Filter, Search, MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface DemoRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string;
  position: string | null;
  sector: string | null;
  company_size: string | null;
  message: string | null;
  source_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  status: string;
  notes: string | null;
  assigned_to: string | null;
  contacted_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  contacted: { label: 'Contactado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Phone },
  scheduled: { label: 'Agendado', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Calendar },
  completed: { label: 'Completado', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
};

export default function DemoRequestsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null);
  const [notes, setNotes] = useState('');

  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ['demo-requests', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('demo_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DemoRequest[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      if (notes !== undefined) updates.notes = notes;
      if (status === 'contacted') updates.contacted_at = new Date().toISOString();
      
      const { error } = await supabase
        .from('demo_requests')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demo-requests'] });
      toast.success('Estado actualizado');
      setSelectedRequest(null);
    },
    onError: () => {
      toast.error('Error al actualizar');
    },
  });

  const filteredRequests = requests?.filter(req => 
    req.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter(r => r.status === 'pending').length || 0,
    contacted: requests?.filter(r => r.status === 'contacted').length || 0,
    scheduled: requests?.filter(r => r.status === 'scheduled').length || 0,
    completed: requests?.filter(r => r.status === 'completed').length || 0,
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Solicitudes de Demo</h1>
          <p className="text-muted-foreground">Gestiona las solicitudes de demostración de clientes potenciales</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pendientes</div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.contacted}</div>
            <div className="text-sm text-muted-foreground">Contactados</div>
          </CardContent>
        </Card>
        <Card className="border-purple-500/30">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-400">{stats.scheduled}</div>
            <div className="text-sm text-muted-foreground">Agendados</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completados</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="contacted">Contactado</SelectItem>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes ({filteredRequests?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay solicitudes de demo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests?.map((request) => {
                const config = statusConfig[request.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                
                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{request.full_name}</span>
                          <Badge variant="outline" className={config.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {request.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {request.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(request.created_at), "d MMM yyyy HH:mm", { locale: es })}
                          </span>
                        </div>
                        {request.message && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                            "{request.message}"
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedRequest(request)}>
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'contacted' })}>
                          Marcar como contactado
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'scheduled' })}>
                          Marcar como agendado
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'completed' })}>
                          Marcar como completado
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'cancelled' })}
                          className="text-red-500"
                        >
                          Cancelar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles de solicitud</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Nombre</label>
                  <p className="font-medium">{selectedRequest.full_name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="font-medium">{selectedRequest.email}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Empresa</label>
                  <p className="font-medium">{selectedRequest.company}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Teléfono</label>
                  <p className="font-medium">{selectedRequest.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Sector</label>
                  <p className="font-medium">{selectedRequest.sector || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Origen</label>
                  <p className="font-medium">{selectedRequest.source_page || '-'}</p>
                </div>
              </div>
              
              {selectedRequest.message && (
                <div>
                  <label className="text-sm text-muted-foreground">Mensaje</label>
                  <p className="mt-1 p-3 bg-muted rounded-lg text-sm">{selectedRequest.message}</p>
                </div>
              )}

              <div>
                <label className="text-sm text-muted-foreground">Notas internas</label>
                <Textarea
                  value={notes || selectedRequest.notes || ''}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Añadir notas..."
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Select 
                  value={selectedRequest.status}
                  onValueChange={(status) => {
                    updateStatusMutation.mutate({ 
                      id: selectedRequest.id, 
                      status,
                      notes: notes || selectedRequest.notes || undefined
                    });
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="contacted">Contactado</SelectItem>
                    <SelectItem value="scheduled">Agendado</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    updateStatusMutation.mutate({
                      id: selectedRequest.id,
                      status: selectedRequest.status,
                      notes,
                    });
                  }}
                >
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
