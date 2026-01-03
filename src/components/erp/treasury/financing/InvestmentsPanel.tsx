import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  PiggyBank,
  BarChart3,
  RefreshCw,
  Building2,
  Coins,
  Euro,
  Calendar
} from 'lucide-react';
import { useERPInvestments } from '@/hooks/erp/useERPInvestments';
import { useERPContext } from '@/hooks/erp';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const investmentTypeConfig = {
  term_deposit: { label: 'Depósito a Plazo', icon: PiggyBank, color: 'bg-green-500' },
  government_bond: { label: 'Bono del Estado', icon: Building2, color: 'bg-blue-500' },
  corporate_bond: { label: 'Bono Corporativo', icon: BarChart3, color: 'bg-purple-500' },
  stock: { label: 'Acciones', icon: TrendingUp, color: 'bg-orange-500' },
  mutual_fund: { label: 'Fondo de Inversión', icon: Wallet, color: 'bg-cyan-500' },
  other: { label: 'Otros', icon: Coins, color: 'bg-gray-500' },
};

const statusConfig = {
  active: { label: 'Activa', variant: 'default' as const },
  matured: { label: 'Vencida', variant: 'secondary' as const },
  sold: { label: 'Vendida', variant: 'outline' as const },
  cancelled: { label: 'Cancelada', variant: 'destructive' as const },
};

export function InvestmentsPanel() {
  const { currentCompany } = useERPContext();
  const { 
    investments, 
    isLoading,
    stats,
    createInvestment,
    refetch
  } = useERPInvestments();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    investment_type: 'term_deposit' as const,
    investment_name: '',
    financial_entity_name: '',
    nominal_amount: '',
    interest_rate: '',
    purchase_date: '',
    maturity_date: '',
    description: '',
  });

  const handleCreate = async () => {
    if (!formData.investment_name || !formData.nominal_amount) return;
    
    await createInvestment({
      investment_type: formData.investment_type,
      investment_name: formData.investment_name,
      financial_entity_name: formData.financial_entity_name || undefined,
      nominal_amount: parseFloat(formData.nominal_amount),
      interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : undefined,
      purchase_date: formData.purchase_date || new Date().toISOString().split('T')[0],
      maturity_date: formData.maturity_date || undefined,
      description: formData.description || undefined,
    });
    
    setIsCreateOpen(false);
    setFormData({
      investment_type: 'term_deposit',
      investment_name: '',
      financial_entity_name: '',
      nominal_amount: '',
      interest_rate: '',
      purchase_date: '',
      maturity_date: '',
      description: '',
    });
  };

  const filteredInvestments = activeTab === 'all' 
    ? investments 
    : investments.filter(inv => inv.investment_type === activeTab);

  // Calculate next maturity date
  const nextMaturity = investments
    .filter(inv => inv.status === 'active' && inv.maturity_date)
    .sort((a, b) => new Date(a.maturity_date!).getTime() - new Date(b.maturity_date!).getTime())[0]?.maturity_date;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Inversiones Activas</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.activeInvestments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Valor Total</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {stats.totalValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Rendimiento Total</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-green-600">-</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Próx. Vencimiento</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {nextMaturity 
                ? format(new Date(nextMaturity), 'dd MMM', { locale: es })
                : '-'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Distribution */}
      {Object.keys(stats.byType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Distribución del Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.byType).map(([type, value]) => {
                const config = investmentTypeConfig[type as keyof typeof investmentTypeConfig];
                const percentage = stats.totalValue > 0 
                  ? (value / stats.totalValue) * 100 
                  : 0;
                
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {config && <config.icon className="h-4 w-4" />}
                        <span>{config?.label || type}</span>
                      </div>
                      <span className="font-medium">
                        {value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Cartera de Inversiones
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualizar
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva Inversión
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nueva Inversión</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Tipo de Inversión</Label>
                    <Select 
                      value={formData.investment_type} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, investment_type: v as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(investmentTypeConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className="h-4 w-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre de la Inversión</Label>
                    <Input 
                      value={formData.investment_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, investment_name: e.target.value }))}
                      placeholder="Depósito 12 meses"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Entidad Financiera</Label>
                    <Input 
                      value={formData.financial_entity_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, financial_entity_name: e.target.value }))}
                      placeholder="Banco Santander"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Importe Nominal (€)</Label>
                    <Input 
                      type="number"
                      value={formData.nominal_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, nominal_amount: e.target.value }))}
                      placeholder="50000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Interés / Rendimiento (%)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={formData.interest_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, interest_rate: e.target.value }))}
                      placeholder="3.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Compra</Label>
                    <Input 
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Fecha de Vencimiento</Label>
                    <Input 
                      type="date"
                      value={formData.maturity_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, maturity_date: e.target.value }))}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Descripción</Label>
                    <Textarea 
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descripción de la inversión..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate}>
                    Crear Inversión
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="term_deposit">Depósitos</TabsTrigger>
              <TabsTrigger value="government_bond">Bonos Estado</TabsTrigger>
              <TabsTrigger value="stock">Acciones</TabsTrigger>
              <TabsTrigger value="mutual_fund">Fondos</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-4">
              <ScrollArea className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredInvestments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Wallet className="h-8 w-8 mb-2" />
                    <p>No hay inversiones registradas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredInvestments.map((investment) => {
                      const typeConfig = investmentTypeConfig[investment.investment_type as keyof typeof investmentTypeConfig];
                      const invStatus = investment.status || 'active';
                      const status = statusConfig[invStatus as keyof typeof statusConfig];
                      const Icon = typeConfig?.icon || Wallet;
                      const returnValue = (investment.current_value || 0) - (investment.nominal_amount || 0);
                      const returnPercentage = investment.nominal_amount 
                        ? (returnValue / investment.nominal_amount) * 100 
                        : 0;
                      
                      return (
                        <div 
                          key={investment.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${typeConfig?.color || 'bg-gray-500'}`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{investment.investment_name}</span>
                                <Badge variant={status?.variant}>{status?.label}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {investment.financial_entity_name || 'Sin entidad'} • {typeConfig?.label}
                              </p>
                              {investment.maturity_date && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Vence: {format(new Date(investment.maturity_date), 'dd MMM yyyy', { locale: es })}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              {(investment.current_value || 0).toLocaleString('es-ES', { style: 'currency', currency: investment.currency || 'EUR' })}
                            </p>
                            <div className={`text-sm flex items-center justify-end gap-1 ${returnValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {returnValue >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              <span>
                                {returnValue >= 0 ? '+' : ''}{returnValue.toLocaleString('es-ES', { style: 'currency', currency: investment.currency || 'EUR' })}
                                {' '}({returnPercentage.toFixed(2)}%)
                              </span>
                            </div>
                            {investment.interest_rate && (
                              <p className="text-xs text-muted-foreground">
                                TIN: {investment.interest_rate}%
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default InvestmentsPanel;
