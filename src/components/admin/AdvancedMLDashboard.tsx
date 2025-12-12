import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Brain, Sparkles, TrendingUp, BarChart3, Loader2, AlertCircle, Layers, GitBranch, Zap, FlaskConical, CheckCircle, XCircle } from 'lucide-react';
import { useAdvancedMLScoring } from '@/hooks/useAdvancedMLScoring';
import { useModelRegistry } from '@/hooks/useModelRegistry';
import { toast } from 'sonner';

export function AdvancedMLDashboard() {
  const { score, isLoading: scoringLoading, result: scoringResult, getRiskColor, getRiskBadgeVariant } = useAdvancedMLScoring();
  const { models, modelsLoading, abTests, abTestsLoading, registerModel, createABTest, promoteToProduction, completeABTest } = useModelRegistry();

  const [scoringType, setScoringType] = useState<'credit' | 'churn' | 'ltv' | 'propensity'>('credit');
  const [sampleData, setSampleData] = useState({
    revenue: '150000',
    visits: '12',
    products: '5',
    vinculacion: '65',
    days_since_last_visit: '30',
    payment_history: '0.95',
    debt_ratio: '0.35'
  });

  const [newModel, setNewModel] = useState({
    model_name: '',
    model_type: 'credit',
    version: '1.0.0',
    description: ''
  });

  const [newABTest, setNewABTest] = useState({
    test_name: '',
    model_a_id: '',
    model_b_id: '',
    traffic_split_a: 0.5
  });

  const getFeatures = () => ({
    revenue: parseFloat(sampleData.revenue),
    visits: parseInt(sampleData.visits),
    products: parseInt(sampleData.products),
    vinculacion: parseFloat(sampleData.vinculacion),
    days_since_last_visit: parseInt(sampleData.days_since_last_visit),
    payment_history: parseFloat(sampleData.payment_history),
    debt_ratio: parseFloat(sampleData.debt_ratio)
  });

  const handleScore = async () => {
    await score(scoringType, getFeatures(), { useEnsemble: true, explainability: true });
  };

  const handleRegisterModel = () => {
    if (!newModel.model_name || !newModel.version) {
      toast.error('Nom i versió requerits');
      return;
    }
    registerModel(newModel);
    setNewModel({ model_name: '', model_type: 'credit', version: '1.0.0', description: '' });
  };

  const handleCreateABTest = () => {
    if (!newABTest.test_name || !newABTest.model_a_id || !newABTest.model_b_id) {
      toast.error('Tots els camps són requerits');
      return;
    }
    createABTest(newABTest);
    setNewABTest({ test_name: '', model_a_id: '', model_b_id: '', traffic_split_a: 0.5 });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Advanced ML Scoring & Registry
          </h2>
          <p className="text-muted-foreground">
            Ensemble ML, A/B Testing i Explicabilitat EU AI Act
          </p>
        </div>
      </div>

      <Tabs defaultValue="scoring" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scoring" className="gap-2">
            <Zap className="h-4 w-4" />
            Scoring Avançat
          </TabsTrigger>
          <TabsTrigger value="registry" className="gap-2">
            <Layers className="h-4 w-4" />
            Model Registry
          </TabsTrigger>
          <TabsTrigger value="abtests" className="gap-2">
            <GitBranch className="h-4 w-4" />
            A/B Tests
          </TabsTrigger>
          <TabsTrigger value="explainability" className="gap-2">
            <FlaskConical className="h-4 w-4" />
            Explicabilitat
          </TabsTrigger>
        </TabsList>

        {/* Scoring Tab */}
        <TabsContent value="scoring" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Paràmetres d'Entrada</CardTitle>
                <CardDescription>Dades per al scoring ensemble</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipus de Scoring</Label>
                  <Select value={scoringType} onValueChange={(v: 'credit' | 'churn' | 'ltv' | 'propensity') => setScoringType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">Credit Scoring</SelectItem>
                      <SelectItem value="churn">Predicció Churn</SelectItem>
                      <SelectItem value="ltv">Lifetime Value</SelectItem>
                      <SelectItem value="propensity">Propensity to Buy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Ingressos (€)</Label>
                    <Input type="number" value={sampleData.revenue} onChange={(e) => setSampleData(prev => ({ ...prev, revenue: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Visites</Label>
                    <Input type="number" value={sampleData.visits} onChange={(e) => setSampleData(prev => ({ ...prev, visits: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Productes</Label>
                    <Input type="number" value={sampleData.products} onChange={(e) => setSampleData(prev => ({ ...prev, products: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Vinculació (%)</Label>
                    <Input type="number" value={sampleData.vinculacion} onChange={(e) => setSampleData(prev => ({ ...prev, vinculacion: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hist. Pagaments</Label>
                    <Input type="number" step="0.01" value={sampleData.payment_history} onChange={(e) => setSampleData(prev => ({ ...prev, payment_history: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Ràtio Deute</Label>
                    <Input type="number" step="0.01" value={sampleData.debt_ratio} onChange={(e) => setSampleData(prev => ({ ...prev, debt_ratio: e.target.value }))} />
                  </div>
                </div>

                <Button onClick={handleScore} disabled={scoringLoading} className="w-full">
                  {scoringLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Executar Scoring Ensemble
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Resultats Ensemble
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scoringResult ? (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {/* Main Result */}
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <span className="text-sm text-muted-foreground">Scoring Final</span>
                          <p className="text-3xl font-bold">
                            {scoringType === 'credit' 
                              ? scoringResult.ensemble_prediction.final_score.toFixed(0)
                              : (scoringResult.ensemble_prediction.final_score * 100).toFixed(1) + '%'}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={getRiskBadgeVariant(scoringResult.ensemble_prediction.risk_level)} className="mb-2">
                            {scoringResult.ensemble_prediction.risk_level.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            Confiança: {(scoringResult.ensemble_prediction.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">{scoringResult.ensemble_prediction.recommendation}</p>
                      </div>

                      <Separator />

                      {/* Individual Models */}
                      <div className="space-y-3">
                        <h4 className="font-semibold">Models de l'Ensemble</h4>
                        {scoringResult.individual_models.map((model, idx) => (
                          <div key={idx} className="p-3 border rounded-lg space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{model.model_name}</span>
                              <Badge variant="outline">{(model.weight * 100).toFixed(0)}% pes</Badge>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Predicció: {typeof model.prediction === 'number' ? model.prediction.toFixed(3) : model.prediction}</span>
                              <span>Contribució: {model.weighted_contribution.toFixed(3)}</span>
                            </div>
                            <Progress value={model.weight * 100} className="h-1" />
                          </div>
                        ))}
                      </div>

                      <Separator />

                      {/* Model Metrics */}
                      <div className="space-y-3">
                        <h4 className="font-semibold">Mètriques del Model</h4>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 border rounded text-center">
                            <p className="text-xs text-muted-foreground">AUC-ROC</p>
                            <p className="font-medium">{(scoringResult.model_metrics.auc_roc * 100).toFixed(1)}%</p>
                          </div>
                          <div className="p-2 border rounded text-center">
                            <p className="text-xs text-muted-foreground">Precision</p>
                            <p className="font-medium">{(scoringResult.model_metrics.precision * 100).toFixed(1)}%</p>
                          </div>
                          <div className="p-2 border rounded text-center">
                            <p className="text-xs text-muted-foreground">Recall</p>
                            <p className="font-medium">{(scoringResult.model_metrics.recall * 100).toFixed(1)}%</p>
                          </div>
                          <div className="p-2 border rounded text-center">
                            <p className="text-xs text-muted-foreground">F1 Score</p>
                            <p className="font-medium">{(scoringResult.model_metrics.f1_score * 100).toFixed(1)}%</p>
                          </div>
                          <div className="p-2 border rounded text-center">
                            <p className="text-xs text-muted-foreground">Log Loss</p>
                            <p className="font-medium">{scoringResult.model_metrics.log_loss.toFixed(4)}</p>
                          </div>
                          <div className="p-2 border rounded text-center">
                            <p className="text-xs text-muted-foreground">Calibration</p>
                            <p className="font-medium">{(scoringResult.model_metrics.calibration_error * 100).toFixed(2)}%</p>
                          </div>
                        </div>
                      </div>

                      {/* Latency */}
                      <div className="p-2 bg-muted/30 rounded text-center text-sm text-muted-foreground">
                        Latència: {scoringResult.metadata.latency_ms}ms | Versió: {scoringResult.metadata.model_version}
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Executa un scoring per veure resultats</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Model Registry Tab */}
        <TabsContent value="registry" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Registrar Nou Model</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom del Model</Label>
                  <Input value={newModel.model_name} onChange={(e) => setNewModel(prev => ({ ...prev, model_name: e.target.value }))} placeholder="credit_scoring_v2" />
                </div>
                <div className="space-y-2">
                  <Label>Tipus</Label>
                  <Select value={newModel.model_type} onValueChange={(v) => setNewModel(prev => ({ ...prev, model_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">Credit Scoring</SelectItem>
                      <SelectItem value="churn">Churn Prediction</SelectItem>
                      <SelectItem value="ltv">Lifetime Value</SelectItem>
                      <SelectItem value="propensity">Propensity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Versió</Label>
                  <Input value={newModel.version} onChange={(e) => setNewModel(prev => ({ ...prev, version: e.target.value }))} placeholder="1.0.0" />
                </div>
                <div className="space-y-2">
                  <Label>Descripció</Label>
                  <Input value={newModel.description} onChange={(e) => setNewModel(prev => ({ ...prev, description: e.target.value }))} />
                </div>
                <Button onClick={handleRegisterModel} className="w-full">
                  <Layers className="h-4 w-4 mr-2" />
                  Registrar Model
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Models Registrats</CardTitle>
                <CardDescription>{models?.length || 0} models al registry</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {modelsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : models?.length ? (
                    <div className="space-y-3">
                      {models.map((model) => (
                        <div key={model.id} className="p-3 border rounded-lg flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{model.model_name}</span>
                              <Badge variant="outline">v{model.version}</Badge>
                              {model.is_production && <Badge variant="default">PROD</Badge>}
                              {model.is_active ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                            </div>
                            <p className="text-sm text-muted-foreground">{model.model_type} · {model.description}</p>
                          </div>
                          {!model.is_production && model.is_active && (
                            <Button size="sm" variant="outline" onClick={() => promoteToProduction(model.id)}>
                              Promoure a Prod
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Cap model registrat</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* A/B Tests Tab */}
        <TabsContent value="abtests" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Crear Test A/B</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom del Test</Label>
                  <Input value={newABTest.test_name} onChange={(e) => setNewABTest(prev => ({ ...prev, test_name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Model A (Control)</Label>
                  <Select value={newABTest.model_a_id} onValueChange={(v) => setNewABTest(prev => ({ ...prev, model_a_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecciona model" /></SelectTrigger>
                    <SelectContent>
                      {models?.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.model_name} v{m.version}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Model B (Treatment)</Label>
                  <Select value={newABTest.model_b_id} onValueChange={(v) => setNewABTest(prev => ({ ...prev, model_b_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecciona model" /></SelectTrigger>
                    <SelectContent>
                      {models?.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.model_name} v{m.version}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tràfic Model A: {(newABTest.traffic_split_a * 100).toFixed(0)}%</Label>
                  <Input type="range" min="0" max="1" step="0.1" value={newABTest.traffic_split_a} onChange={(e) => setNewABTest(prev => ({ ...prev, traffic_split_a: parseFloat(e.target.value) }))} />
                </div>
                <Button onClick={handleCreateABTest} className="w-full">
                  <GitBranch className="h-4 w-4 mr-2" />
                  Crear Test A/B
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Tests A/B Actius</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {abTestsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : abTests?.length ? (
                    <div className="space-y-3">
                      {abTests.map((test) => (
                        <div key={test.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{test.test_name}</span>
                            <Badge variant={test.status === 'running' ? 'default' : test.status === 'completed' ? 'secondary' : 'outline'}>
                              {test.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>Split: {(test.traffic_split_a * 100).toFixed(0)}% / {((1 - test.traffic_split_a) * 100).toFixed(0)}%</span>
                            <span>Inici: {new Date(test.start_date).toLocaleDateString()}</span>
                          </div>
                          {test.status === 'running' && (
                            <div className="mt-2 flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => completeABTest({ testId: test.id, winnerId: test.model_a_id })}>
                                Model A Guanya
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => completeABTest({ testId: test.id, winnerId: test.model_b_id })}>
                                Model B Guanya
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Cap test A/B actiu</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Explainability Tab */}
        <TabsContent value="explainability" className="space-y-4">
          {scoringResult?.explainability ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">SHAP Values</CardTitle>
                  <CardDescription>Contribució de cada variable a la predicció</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scoringResult.explainability.shap_values.map((shap, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{shap.feature}</span>
                          <span className={shap.direction === 'positive' ? 'text-emerald-500' : 'text-red-500'}>
                            {shap.direction === 'positive' ? '+' : ''}{shap.value.toFixed(3)}
                          </span>
                        </div>
                        <Progress value={Math.abs(shap.value) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Counterfactuals</CardTitle>
                  <CardDescription>Què canviaria el resultat?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scoringResult.explainability.counterfactuals.map((cf, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <p className="font-medium text-sm">{cf.change}</p>
                        <p className="text-xs text-muted-foreground">{cf.impact}</p>
                        <Badge variant="outline" className="mt-1">Nou Score: {cf.new_score}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Camí de Decisió (EU AI Act Compliant)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {scoringResult.explainability.decision_path.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">{idx + 1}</Badge>
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Explicació en Llenguatge Natural</h4>
                    <p className="text-sm text-muted-foreground">{scoringResult.explainability.human_explanation}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <FlaskConical className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Executa un scoring per veure l'explicabilitat</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdvancedMLDashboard;
