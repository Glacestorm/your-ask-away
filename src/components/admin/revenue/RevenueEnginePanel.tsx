import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  Clock,
  Target,
  Zap,
  Gift,
  Calculator,
  Send,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Plus,
  ExternalLink
} from 'lucide-react';
import { useRevenueEngine, SmartTrial, Affiliate, Quote } from '@/hooks/admin/revenue/useRevenueEngine';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export function RevenueEnginePanel() {
  const [activeTab, setActiveTab] = useState('trials');
  const [selectedTrial, setSelectedTrial] = useState<SmartTrial | null>(null);
  const [isNewAffiliateOpen, setIsNewAffiliateOpen] = useState(false);
  const [isNewQuoteOpen, setIsNewQuoteOpen] = useState(false);
  const [conversionAnalysis, setConversionAnalysis] = useState<any>(null);

  // New affiliate form
  const [newAffiliate, setNewAffiliate] = useState({
    name: '',
    email: '',
    commission_rate: 20,
    payment_method: 'bank_transfer'
  });

  // New quote form
  const [newQuote, setNewQuote] = useState({
    company_id: '',
    requirements: ''
  });

  const {
    isLoading,
    trials,
    affiliates,
    quotes,
    stats,
    lastRefresh,
    fetchTrials,
    createTrial,
    analyzeTrialConversion,
    fetchAffiliates,
    registerAffiliate,
    fetchQuotes,
    generateQuote,
    approveQuote,
    startAutoRefresh,
    stopAutoRefresh
  } = useRevenueEngine();

  useEffect(() => {
    startAutoRefresh(90000);
    return () => stopAutoRefresh();
  }, [startAutoRefresh, stopAutoRefresh]);

  const handleRefresh = useCallback(() => {
    fetchTrials();
    fetchAffiliates();
    fetchQuotes();
  }, [fetchTrials, fetchAffiliates, fetchQuotes]);

  const handleAnalyzeConversion = async (trial: SmartTrial) => {
    setSelectedTrial(trial);
    const analysis = await analyzeTrialConversion(trial.id);
    setConversionAnalysis(analysis);
  };

  const handleCreateAffiliate = async () => {
    if (!newAffiliate.name || !newAffiliate.email) {
      toast.error('Nombre y email son requeridos');
      return;
    }

    await registerAffiliate(
      newAffiliate.name,
      newAffiliate.email,
      newAffiliate.commission_rate / 100,
      newAffiliate.payment_method
    );

    setNewAffiliate({ name: '', email: '', commission_rate: 20, payment_method: 'bank_transfer' });
    setIsNewAffiliateOpen(false);
  };

  const handleGenerateQuote = async () => {
    if (!newQuote.company_id) {
      toast.error('Selecciona una empresa');
      return;
    }

    await generateQuote(
      newQuote.company_id,
      { description: newQuote.requirements }
    );

    setNewQuote({ company_id: '', requirements: '' });
    setIsNewQuoteOpen(false);
  };

  const getTrialStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'converted': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'expired': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'sent': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'expired': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Revenue Engine
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  IA
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Sincronizando...'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="p-2 rounded-lg bg-background/50 text-center">
              <p className="text-lg font-bold text-blue-400">{stats.active_trials}</p>
              <p className="text-xs text-muted-foreground">Trials activos</p>
            </div>
            <div className="p-2 rounded-lg bg-background/50 text-center">
              <p className="text-lg font-bold text-green-400">{stats.trial_conversion_rate.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Conversión</p>
            </div>
            <div className="p-2 rounded-lg bg-background/50 text-center">
              <p className="text-lg font-bold text-purple-400">{stats.total_affiliates}</p>
              <p className="text-xs text-muted-foreground">Afiliados</p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-3">
            <TabsTrigger value="trials" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Trials
            </TabsTrigger>
            <TabsTrigger value="billing" className="text-xs">
              <Calculator className="h-3 w-3 mr-1" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="affiliates" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Afiliados
            </TabsTrigger>
            <TabsTrigger value="quotes" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Cotizaciones
            </TabsTrigger>
          </TabsList>

          {/* TRIALS TAB */}
          <TabsContent value="trials" className="mt-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {trials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No hay trials activos</p>
                  </div>
                ) : (
                  trials.map((trial) => (
                    <div
                      key={trial.id}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleAnalyzeConversion(trial)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{trial.companies?.name || 'Empresa'}</p>
                          <p className="text-xs text-muted-foreground">CNAE: {trial.companies?.cnae_code}</p>
                        </div>
                        <Badge className={getTrialStatusColor(trial.status)}>
                          {trial.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {trial.duration_days} días
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {trial.plan_type}
                        </span>
                      </div>

                      {trial.ai_recommendations && (
                        <div className="mt-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="h-3 w-3 text-emerald-400" />
                            <span className="text-xs font-medium text-emerald-400">Probabilidad conversión</span>
                          </div>
                          <Progress
                            value={(trial.ai_recommendations.conversion_probability || 0) * 100}
                            className="h-1.5"
                          />
                          <p className="text-xs mt-1 text-emerald-300">
                            {((trial.ai_recommendations.conversion_probability || 0) * 100).toFixed(0)}%
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Conversion Analysis Dialog */}
            {selectedTrial && conversionAnalysis && (
              <Dialog open={!!selectedTrial} onOpenChange={() => setSelectedTrial(null)}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-emerald-500" />
                      Análisis de Conversión
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium mb-2">Probabilidad de conversión</p>
                      <div className="flex items-center gap-3">
                        <Progress
                          value={(conversionAnalysis.conversion_probability || 0) * 100}
                          className="flex-1 h-3"
                        />
                        <span className="text-lg font-bold text-emerald-400">
                          {((conversionAnalysis.conversion_probability || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {conversionAnalysis.risk_factors?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-400" />
                          Factores de riesgo
                        </p>
                        <ul className="space-y-1">
                          {conversionAnalysis.risk_factors.map((risk: string, i: number) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-orange-400">•</span>
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {conversionAnalysis.next_best_actions?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-blue-400" />
                          Próximas acciones
                        </p>
                        <ul className="space-y-2">
                          {conversionAnalysis.next_best_actions.slice(0, 3).map((action: any, i: number) => (
                            <li key={i} className="p-2 rounded bg-background border text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{action.action}</span>
                                <Badge variant="outline" className={
                                  action.priority === 'high' ? 'text-red-400 border-red-400/30' :
                                  action.priority === 'medium' ? 'text-yellow-400 border-yellow-400/30' :
                                  'text-green-400 border-green-400/30'
                                }>
                                  {action.priority}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground mt-1">{action.impact}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* BILLING TAB */}
          <TabsContent value="billing" className="mt-0">
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-card text-center">
                <BarChart3 className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm font-medium">Usage-Based Billing</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Facturación basada en uso con integración Stripe
                </p>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-lg font-bold text-green-400">€{stats?.monthly_usage_revenue?.toFixed(0) || 0}</p>
                    <p className="text-xs text-muted-foreground">Revenue mensual</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-lg font-bold text-blue-400">€{stats?.pending_commissions?.toFixed(0) || 0}</p>
                    <p className="text-xs text-muted-foreground">Pendiente</p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="text-xs font-medium mb-2">Métricas de uso trackeadas:</p>
                <div className="flex flex-wrap gap-1">
                  {['api_calls', 'storage_gb', 'users_active', 'reports_generated', 'ai_queries'].map(metric => (
                    <Badge key={metric} variant="outline" className="text-xs">
                      {metric}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* AFFILIATES TAB */}
          <TabsContent value="affiliates" className="mt-0">
            <div className="flex justify-end mb-2">
              <Dialog open={isNewAffiliateOpen} onOpenChange={setIsNewAffiliateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-3 w-3 mr-1" />
                    Nuevo Afiliado
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Afiliado</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Nombre</Label>
                      <Input
                        value={newAffiliate.name}
                        onChange={(e) => setNewAffiliate(p => ({ ...p, name: e.target.value }))}
                        placeholder="Nombre del afiliado"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newAffiliate.email}
                        onChange={(e) => setNewAffiliate(p => ({ ...p, email: e.target.value }))}
                        placeholder="email@ejemplo.com"
                      />
                    </div>
                    <div>
                      <Label>Comisión (%)</Label>
                      <Input
                        type="number"
                        value={newAffiliate.commission_rate}
                        onChange={(e) => setNewAffiliate(p => ({ ...p, commission_rate: Number(e.target.value) }))}
                        min={1}
                        max={50}
                      />
                    </div>
                    <Button onClick={handleCreateAffiliate} className="w-full">
                      <Gift className="h-4 w-4 mr-2" />
                      Registrar Afiliado
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {affiliates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No hay afiliados registrados</p>
                  </div>
                ) : (
                  affiliates.map((affiliate) => (
                    <div key={affiliate.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{affiliate.name}</p>
                          <p className="text-xs text-muted-foreground">{affiliate.email}</p>
                        </div>
                        <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
                          {affiliate.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-1 rounded bg-muted/50">
                          <p className="text-sm font-bold">{affiliate.total_referrals}</p>
                          <p className="text-xs text-muted-foreground">Referidos</p>
                        </div>
                        <div className="p-1 rounded bg-muted/50">
                          <p className="text-sm font-bold text-green-400">€{affiliate.total_earnings.toFixed(0)}</p>
                          <p className="text-xs text-muted-foreground">Ganado</p>
                        </div>
                        <div className="p-1 rounded bg-muted/50">
                          <p className="text-sm font-bold text-blue-400">€{affiliate.pending_payout.toFixed(0)}</p>
                          <p className="text-xs text-muted-foreground">Pendiente</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Código: <code className="bg-muted px-1 rounded">{affiliate.affiliate_code}</code>
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* QUOTES TAB */}
          <TabsContent value="quotes" className="mt-0">
            <div className="flex justify-end mb-2">
              <Dialog open={isNewQuoteOpen} onOpenChange={setIsNewQuoteOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Generar Cotización IA
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-500" />
                      Cotización Automatizada con IA
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>ID de Empresa</Label>
                      <Input
                        value={newQuote.company_id}
                        onChange={(e) => setNewQuote(p => ({ ...p, company_id: e.target.value }))}
                        placeholder="UUID de la empresa"
                      />
                    </div>
                    <div>
                      <Label>Requisitos</Label>
                      <Textarea
                        value={newQuote.requirements}
                        onChange={(e) => setNewQuote(p => ({ ...p, requirements: e.target.value }))}
                        placeholder="Describe los requisitos del cliente..."
                        rows={4}
                      />
                    </div>
                    <Button onClick={handleGenerateQuote} className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Generar con IA
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {quotes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No hay cotizaciones</p>
                  </div>
                ) : (
                  quotes.map((quote) => (
                    <div key={quote.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm flex items-center gap-2">
                            {quote.companies?.name || 'Empresa'}
                            {quote.ai_generated && (
                              <Sparkles className="h-3 w-3 text-emerald-400" />
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Válido hasta: {format(new Date(quote.valid_until), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <Badge className={getQuoteStatusColor(quote.status)}>
                          {quote.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Total:</span>
                          <span className="font-bold text-green-400 ml-2">€{quote.total.toFixed(2)}</span>
                        </div>
                        {quote.status === 'sent' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveQuote(quote.id)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aprobar
                          </Button>
                        )}
                      </div>

                      {quote.ai_suggestions && quote.ai_suggestions.length > 0 && (
                        <div className="mt-2 p-2 rounded bg-muted/30 text-xs">
                          <p className="font-medium text-emerald-400 mb-1">Sugerencias IA:</p>
                          <ul className="space-y-0.5 text-muted-foreground">
                            {quote.ai_suggestions.slice(0, 2).map((s, i) => (
                              <li key={i}>• {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default RevenueEnginePanel;
