/**
 * Banking Hub Dashboard - Panel principal de integración bancaria
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Building2, 
  Link, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  TrendingUp,
  Globe,
  Plus,
  Settings,
  Zap,
  FileText,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { useERPBankingHub, BankConnection, BankTransaction, BankingProvider } from '@/hooks/erp/useERPBankingHub';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface BankingHubDashboardProps {
  companyId?: string;
}

export function BankingHubDashboard({ companyId }: BankingHubDashboardProps) {
  const {
    providers,
    accounts,
    connections,
    transactions,
    position,
    stats,
    isLoading,
    isSyncing,
    fetchProviders,
    fetchTransactions,
    createConnection,
    syncConnection,
    autoReconcile,
    createJournalEntries
  } = useERPBankingHub();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProvider, setSelectedProvider] = useState<BankingProvider | null>(null);
  const [showNewConnection, setShowNewConnection] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);

  // Filter providers
  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.country_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = regionFilter === 'all' || p.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesSearch = !searchTerm || 
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCreateConnection = async () => {
    if (!selectedProvider) return;
    
    await createConnection({
      provider_id: selectedProvider.id,
      connection_name: `${selectedProvider.provider_name} - Principal`,
      auto_reconcile: true,
      auto_create_entries: true
    });
    
    setShowNewConnection(false);
    setSelectedProvider(null);
  };

  const handleSyncAll = async () => {
    const activeConnections = connections.filter(c => c.status === 'active');
    for (const conn of activeConnections) {
      await syncConnection(conn.id, 'full');
    }
  };

  const handleAutoReconcile = async () => {
    const pendingIds = filteredTransactions
      .filter(t => t.status === 'pending')
      .map(t => t.id);
    
    if (pendingIds.length > 0) {
      await autoReconcile(pendingIds);
    }
  };

  const handleCreateEntries = async () => {
    const matchedIds = selectedTransactions.length > 0 
      ? selectedTransactions 
      : filteredTransactions.filter(t => t.status === 'matched').map(t => t.id);
    
    if (matchedIds.length > 0) {
      await createJournalEntries(matchedIds);
      setSelectedTransactions([]);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2 }> = {
      active: { variant: 'default', icon: CheckCircle2 },
      pending: { variant: 'secondary', icon: Clock },
      expired: { variant: 'outline', icon: AlertCircle },
      error: { variant: 'destructive', icon: AlertCircle },
      suspended: { variant: 'outline', icon: AlertCircle }
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getTransactionStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      matched: 'bg-blue-100 text-blue-800',
      reconciled: 'bg-green-100 text-green-800',
      ignored: 'bg-gray-100 text-gray-600',
      error: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', colors[status] || colors.pending)}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Banking Hub
          </h2>
          <p className="text-muted-foreground">
            Integración bancaria inteligente con +50 bancos globales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleSyncAll}
            disabled={isSyncing || connections.filter(c => c.status === 'active').length === 0}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
            Sincronizar Todo
          </Button>
          <Dialog open={showNewConnection} onOpenChange={setShowNewConnection}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Conexión
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Conectar Banco</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar banco..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={regionFilter} onValueChange={setRegionFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Región" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="europe">Europa</SelectItem>
                      <SelectItem value="americas">América</SelectItem>
                      <SelectItem value="asia">Asia-Pacífico</SelectItem>
                      <SelectItem value="africa">África</SelectItem>
                      <SelectItem value="middle_east">Medio Oriente</SelectItem>
                      <SelectItem value="global">Global</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredProviders.map((provider) => (
                      <Card 
                        key={provider.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          selectedProvider?.id === provider.id && "ring-2 ring-primary"
                        )}
                        onClick={() => setSelectedProvider(provider)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{provider.provider_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {provider.country_code} • {provider.protocol.toUpperCase()}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {provider.auth_type}
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {provider.supported_features.slice(0, 3).map((feature, i) => (
                              <span key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                {selectedProvider && (
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setSelectedProvider(null)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateConnection}>
                      <Link className="h-4 w-4 mr-2" />
                      Conectar {selectedProvider.provider_name}
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(stats.totalBalance)}
                </p>
                <p className="text-xs text-muted-foreground">Saldo Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(stats.totalAvailable)}
                </p>
                <p className="text-xs text-muted-foreground">Disponible</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Link className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeConnections}</p>
                <p className="text-xs text-muted-foreground">Conexiones Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingTransactions}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Building2 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalAccounts}</p>
                <p className="text-xs text-muted-foreground">Cuentas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="connections">Conexiones</TabsTrigger>
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
          <TabsTrigger value="reconciliation">Conciliación</TabsTrigger>
          <TabsTrigger value="providers">Bancos Disponibles</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Active Connections */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conexiones Activas</CardTitle>
              </CardHeader>
              <CardContent>
                {connections.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Link className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No hay conexiones configuradas</p>
                    <Button 
                      variant="link" 
                      onClick={() => setShowNewConnection(true)}
                      className="mt-2"
                    >
                      Conectar primer banco
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {connections.slice(0, 5).map((conn) => (
                      <div key={conn.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{conn.connection_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {conn.last_sync_at 
                                ? `Sync: ${formatDistanceToNow(new Date(conn.last_sync_at), { locale: es, addSuffix: true })}`
                                : 'Sin sincronizar'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(conn.status)}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => syncConnection(conn.id)}
                            disabled={isSyncing}
                          >
                            <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Últimas Transacciones</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No hay transacciones</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.slice(0, 8).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-1.5 rounded-full",
                            tx.amount > 0 ? "bg-green-100" : "bg-red-100"
                          )}>
                            {tx.amount > 0 
                              ? <ArrowDownLeft className="h-3 w-3 text-green-600" />
                              : <ArrowUpRight className="h-3 w-3 text-red-600" />
                            }
                          </div>
                          <div>
                            <p className="text-sm font-medium truncate max-w-[200px]">
                              {tx.description || tx.reference || 'Sin descripción'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(tx.transaction_date), 'dd/MM/yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "font-medium",
                            tx.amount > 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {tx.amount > 0 ? '+' : ''}{new Intl.NumberFormat('es-ES', { 
                              style: 'currency', 
                              currency: tx.currency || 'EUR' 
                            }).format(tx.amount)}
                          </p>
                          {getTransactionStatusBadge(tx.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Position by Bank */}
          {position && Object.keys(position.by_bank).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Posición por Banco</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(position.by_bank).map(([bank, balance]) => (
                    <div key={bank} className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">{bank}</p>
                      <p className="text-xl font-bold">
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(balance as number)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Connections Tab */}
        <TabsContent value="connections">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Conexiones Bancarias</CardTitle>
                <Button onClick={() => setShowNewConnection(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Conexión
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {connections.length === 0 ? (
                <div className="text-center py-12">
                  <Globe className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">Sin conexiones bancarias</h3>
                  <p className="text-muted-foreground mb-4">
                    Conecta tu primer banco para comenzar a sincronizar transacciones automáticamente
                  </p>
                  <Button onClick={() => setShowNewConnection(true)}>
                    <Link className="h-4 w-4 mr-2" />
                    Conectar Banco
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {connections.map((conn) => (
                    <div key={conn.id} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{conn.connection_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {conn.provider?.provider_name} • {conn.provider?.protocol.toUpperCase()}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>Frecuencia: {conn.sync_frequency}</span>
                              <span>Auto-conciliar: {conn.auto_reconcile ? 'Sí' : 'No'}</span>
                              <span>Auto-asientos: {conn.auto_create_entries ? 'Sí' : 'No'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(conn.status)}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => syncConnection(conn.id)}
                            disabled={isSyncing}
                          >
                            <RefreshCw className={cn("h-4 w-4 mr-1", isSyncing && "animate-spin")} />
                            Sync
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {conn.last_sync_at && (
                        <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                          Última sincronización: {format(new Date(conn.last_sync_at), "dd/MM/yyyy HH:mm", { locale: es })}
                        </div>
                      )}
                      {conn.error_message && (
                        <div className="mt-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                          {conn.error_message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle>Transacciones Bancarias</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="matched">Cruzado</SelectItem>
                      <SelectItem value="reconciled">Conciliado</SelectItem>
                      <SelectItem value="ignored">Ignorado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {filteredTransactions.map((tx) => (
                    <div 
                      key={tx.id} 
                      className={cn(
                        "p-4 rounded-lg border transition-colors",
                        selectedTransactions.includes(tx.id) && "bg-primary/5 border-primary"
                      )}
                      onClick={() => {
                        setSelectedTransactions(prev => 
                          prev.includes(tx.id) 
                            ? prev.filter(id => id !== tx.id)
                            : [...prev, tx.id]
                        );
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "p-2 rounded-full",
                            tx.amount > 0 ? "bg-green-100" : "bg-red-100"
                          )}>
                            {tx.amount > 0 
                              ? <ArrowDownLeft className="h-4 w-4 text-green-600" />
                              : <ArrowUpRight className="h-4 w-4 text-red-600" />
                            }
                          </div>
                          <div>
                            <p className="font-medium">{tx.description || 'Sin descripción'}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{format(new Date(tx.transaction_date), 'dd/MM/yyyy')}</span>
                              {tx.reference && <span>• {tx.reference}</span>}
                              {tx.counterparty_name && <span>• {tx.counterparty_name}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "text-lg font-bold",
                            tx.amount > 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {tx.amount > 0 ? '+' : ''}{new Intl.NumberFormat('es-ES', { 
                              style: 'currency', 
                              currency: tx.currency || 'EUR' 
                            }).format(tx.amount)}
                          </p>
                          <div className="flex items-center gap-2 justify-end mt-1">
                            {getTransactionStatusBadge(tx.status)}
                            {tx.match_confidence && (
                              <span className="text-xs text-muted-foreground">
                                {tx.match_confidence}% confianza
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reconciliation Tab */}
        <TabsContent value="reconciliation">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Conciliación Inteligente</CardTitle>
                  <CardDescription>
                    Usa IA para conciliar automáticamente transacciones con facturas y pagos
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline"
                    onClick={handleAutoReconcile}
                    disabled={isSyncing || stats.pendingTransactions === 0}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Auto-Conciliar ({stats.pendingTransactions})
                  </Button>
                  <Button
                    onClick={handleCreateEntries}
                    disabled={isSyncing || transactions.filter(t => t.status === 'matched').length === 0}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Crear Asientos
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <p className="text-2xl font-bold text-yellow-700">{stats.pendingTransactions}</p>
                  <p className="text-sm text-yellow-600">Pendientes de conciliar</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-2xl font-bold text-blue-700">
                    {transactions.filter(t => t.status === 'matched').length}
                  </p>
                  <p className="text-sm text-blue-600">Cruzados (listos para asiento)</p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-2xl font-bold text-green-700">
                    {transactions.filter(t => t.status === 'reconciled').length}
                  </p>
                  <p className="text-sm text-green-600">Conciliados</p>
                </div>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {transactions.filter(t => t.status !== 'reconciled').map((tx) => (
                    <div key={tx.id} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "p-1.5 rounded-full",
                              tx.amount > 0 ? "bg-green-100" : "bg-red-100"
                            )}>
                              {tx.amount > 0 
                                ? <ArrowDownLeft className="h-3 w-3 text-green-600" />
                                : <ArrowUpRight className="h-3 w-3 text-red-600" />
                              }
                            </div>
                            <p className="font-medium">{tx.description || 'Sin descripción'}</p>
                            {getTransactionStatusBadge(tx.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(tx.transaction_date), 'dd/MM/yyyy')} • {tx.reference}
                          </p>
                        </div>
                        <p className={cn(
                          "text-lg font-bold",
                          tx.amount > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {new Intl.NumberFormat('es-ES', { 
                            style: 'currency', 
                            currency: tx.currency || 'EUR' 
                          }).format(tx.amount)}
                        </p>
                      </div>

                      {tx.ai_analysis && Object.keys(tx.ai_analysis).length > 0 && (
                        <div className="mt-3 p-3 rounded-lg bg-muted/50 text-sm">
                          <p className="font-medium text-xs text-muted-foreground mb-1">
                            Análisis IA:
                          </p>
                          <p>{(tx.ai_analysis as any).reasoning || 'Sin análisis disponible'}</p>
                          {(tx.ai_analysis as any).category && (
                            <Badge variant="outline" className="mt-2">
                              {(tx.ai_analysis as any).category}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Bancos Disponibles</CardTitle>
                  <CardDescription>
                    +50 bancos de todo el mundo disponibles para conectar
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={regionFilter} onValueChange={setRegionFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Región" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las regiones</SelectItem>
                      <SelectItem value="europe">Europa</SelectItem>
                      <SelectItem value="americas">América</SelectItem>
                      <SelectItem value="asia">Asia-Pacífico</SelectItem>
                      <SelectItem value="africa">África</SelectItem>
                      <SelectItem value="middle_east">Medio Oriente</SelectItem>
                      <SelectItem value="global">Global (Agregadores)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar banco..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredProviders.map((provider) => (
                  <Card 
                    key={provider.id} 
                    className="cursor-pointer hover:shadow-md transition-all"
                    onClick={() => {
                      setSelectedProvider(provider);
                      setShowNewConnection(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-muted">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {provider.country_code}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{provider.provider_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {provider.protocol.toUpperCase()} • {provider.auth_type}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {provider.supported_features.slice(0, 2).map((f, i) => (
                          <span key={i} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            {f}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BankingHubDashboard;
