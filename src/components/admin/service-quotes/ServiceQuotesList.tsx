/**
 * Service Quotes List Component
 * Displays and manages service quotes with filtering and actions
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  FileText, Plus, Search, MoreHorizontal, Send, Eye, 
  X, Clock, Euro, TrendingUp, CheckCircle, AlertCircle 
} from 'lucide-react';
import { 
  useServiceQuotes, 
  ServiceQuote, 
  QuoteStatus,
  getStatusColor,
  getServiceTypeLabel 
} from '@/hooks/admin/useServiceQuotes';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ServiceQuotesListProps {
  installationId?: string;
  onCreateNew?: () => void;
  onViewQuote?: (quoteId: string) => void;
}

const STATUS_OPTIONS: { value: QuoteStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'draft', label: 'Borrador' },
  { value: 'sent', label: 'Enviado' },
  { value: 'viewed', label: 'Visto' },
  { value: 'accepted', label: 'Aceptado' },
  { value: 'rejected', label: 'Rechazado' },
  { value: 'expired', label: 'Expirado' },
  { value: 'cancelled', label: 'Cancelado' },
];

export function ServiceQuotesList({
  installationId,
  onCreateNew,
  onViewQuote,
}: ServiceQuotesListProps) {
  const { quotes, loading, fetchQuotes, sendQuote, cancelQuote, getQuoteStats } = useServiceQuotes(installationId);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');

  useEffect(() => {
    if (installationId) {
      fetchQuotes();
    }
  }, [installationId, fetchQuotes]);

  const stats = getQuoteStats();

  // Filter quotes
  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.service_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status: QuoteStatus): string => {
    const labels: Record<QuoteStatus, string> = {
      draft: 'Borrador',
      sent: 'Enviado',
      viewed: 'Visto',
      accepted: 'Aceptado',
      rejected: 'Rechazado',
      expired: 'Expirado',
      cancelled: 'Cancelado',
    };
    return labels[status];
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: es });
  };

  const isExpiringSoon = (validUntil: string) => {
    const daysUntilExpiry = Math.ceil(
      (new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const handleAction = async (quote: ServiceQuote, action: 'send' | 'cancel' | 'view') => {
    switch (action) {
      case 'send':
        await sendQuote(quote.id);
        break;
      case 'cancel':
        await cancelQuote(quote.id);
        break;
      case 'view':
        onViewQuote?.(quote.id);
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total presupuestos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.accepted}</p>
              <p className="text-xs text-muted-foreground">Aceptados</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Euro className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.acceptedValue.toFixed(0)}€</p>
              <p className="text-xs text-muted-foreground">Valor aceptado</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.conversionRate.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Tasa conversión</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Presupuestos de Servicio</CardTitle>
              <CardDescription>
                Gestiona los presupuestos de esta instalación
              </CardDescription>
            </div>
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Presupuesto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número o título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as QuoteStatus | 'all')}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay presupuestos</p>
              <Button variant="outline" className="mt-4" onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Crear primer presupuesto
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Presupuesto</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Válido hasta</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono text-sm">
                      {quote.quote_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{quote.service_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(quote.created_at)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getServiceTypeLabel(quote.service_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {quote.total_price.toFixed(2)} €
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(quote.status)}>
                        {getStatusLabel(quote.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{formatDate(quote.valid_until)}</span>
                        {isExpiringSoon(quote.valid_until) && quote.status === 'sent' && (
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAction(quote, 'view')}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                          {quote.status === 'draft' && (
                            <DropdownMenuItem onClick={() => handleAction(quote, 'send')}>
                              <Send className="h-4 w-4 mr-2" />
                              Enviar al cliente
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {['draft', 'sent'].includes(quote.status) && (
                            <DropdownMenuItem 
                              onClick={() => handleAction(quote, 'cancel')}
                              className="text-destructive"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancelar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
