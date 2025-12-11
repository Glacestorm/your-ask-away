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
import { Brain, Sparkles, TrendingUp, BarChart3, Loader2, AlertCircle } from 'lucide-react';
import { useMLExplainability } from '@/hooks/useMLExplainability';
import { useRandomForest } from '@/hooks/useRandomForest';
import { useDeepLearning } from '@/hooks/useDeepLearning';
import { toast } from 'sonner';

export function MLExplainabilityPanel() {
  const { explain, isLoading: shapLoading, result: shapResult, getContributionColor } = useMLExplainability();
  const { predict: rfPredict, isLoading: rfLoading, result: rfResult, getImportanceColor } = useRandomForest();
  const { predict: dlPredict, isLoading: dlLoading, result: dlResult, getArchitectureIcon } = useDeepLearning();

  const [modelType, setModelType] = useState<'churn_prediction' | 'credit_scoring' | 'anomaly_detection' | 'segmentation'>('churn_prediction');
  const [sampleData, setSampleData] = useState({
    revenue: '150000',
    visits: '12',
    products: '5',
    vinculacion: '65',
    days_since_last_visit: '30'
  });

  const getFeatures = () => ({
    revenue: parseFloat(sampleData.revenue),
    visits: parseInt(sampleData.visits),
    products: parseInt(sampleData.products),
    vinculacion: parseFloat(sampleData.vinculacion),
    days_since_last_visit: parseInt(sampleData.days_since_last_visit)
  });

  const handleExplainSHAP = async () => {
    try {
      await explain(modelType, getFeatures(), 'both');
    } catch (error) {
      toast.error('Error en l\'anàlisi');
    }
  };

  const handleRandomForest = async () => {
    try {
      await rfPredict('classification', getFeatures(), 'churn');
    } catch (error) {
      toast.error('Error en predicció');
    }
  };

  const handleDeepLearning = async () => {
    try {
      await dlPredict('mlp', 'classification', getFeatures());
    } catch (error) {
      toast.error('Error en predicció');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            ML Explainability (SHAP/LIME)
          </h2>
          <p className="text-muted-foreground">
            Anàlisi d'interpretabilitat de models de Machine Learning
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Paràmetres d'Entrada</CardTitle>
            <CardDescription>Configura les dades per a l'anàlisi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipus de Model</Label>
              <Select value={modelType} onValueChange={(v: any) => setModelType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="churn_prediction">Predicció de Churn</SelectItem>
                  <SelectItem value="credit_scoring">Risc de Crèdit</SelectItem>
                  <SelectItem value="anomaly_detection">Detecció d'Anomalies</SelectItem>
                  <SelectItem value="segmentation">Segmentació</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ingressos Anuals (€)</Label>
              <Input
                type="number"
                value={sampleData.revenue}
                onChange={(e) => setSampleData(prev => ({ ...prev, revenue: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Nombre de Visites</Label>
              <Input
                type="number"
                value={sampleData.visits}
                onChange={(e) => setSampleData(prev => ({ ...prev, visits: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Productes Contractats</Label>
              <Input
                type="number"
                value={sampleData.products}
                onChange={(e) => setSampleData(prev => ({ ...prev, products: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Vinculació (%)</Label>
              <Input
                type="number"
                value={sampleData.vinculacion}
                onChange={(e) => setSampleData(prev => ({ ...prev, vinculacion: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Dies des de Última Visita</Label>
              <Input
                type="number"
                value={sampleData.days_since_last_visit}
                onChange={(e) => setSampleData(prev => ({ ...prev, days_since_last_visit: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button onClick={handleExplainSHAP} disabled={shapLoading} className="w-full">
                {shapLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Analitzar SHAP/LIME
              </Button>
              <Button onClick={handleRandomForest} disabled={rfLoading} variant="secondary" className="w-full">
                {rfLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
                Random Forest
              </Button>
              <Button onClick={handleDeepLearning} disabled={dlLoading} variant="outline" className="w-full">
                {dlLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
                Deep Learning
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Resultats d'Anàlisi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="shap">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="shap">SHAP/LIME</TabsTrigger>
                <TabsTrigger value="rf">Random Forest</TabsTrigger>
                <TabsTrigger value="dl">Deep Learning</TabsTrigger>
              </TabsList>

              <TabsContent value="shap" className="mt-4">
                {shapResult ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="font-medium">Valor de Sortida</span>
                        <Badge variant="secondary" className="text-lg">
                          {shapResult.shap_values.output_value.toFixed(3)}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold">SHAP Values - Contribucions</h4>
                        {shapResult.shap_values.feature_contributions.map((fc, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{fc.feature}</span>
                              <span className={getContributionColor(fc.direction)}>
                                {fc.direction === 'positive' ? '+' : ''}{fc.contribution.toFixed(3)}
                              </span>
                            </div>
                            <Progress value={Math.abs(fc.contribution) * 100} className="h-2" />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold">LIME - Pesos de Features</h4>
                        {shapResult.lime_explanation.feature_weights.map((fw, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{fw.feature}</span>
                              <span>Pes: {fw.weight.toFixed(3)} (Conf: {(fw.confidence * 100).toFixed(0)}%)</span>
                            </div>
                            <Progress value={Math.abs(fw.weight) * 100} className="h-2" />
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold mb-2">Explicació Natural</h4>
                        <p className="text-sm text-muted-foreground">{shapResult.summary.explanation_text}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 border rounded-lg">
                          <span className="text-sm text-muted-foreground">Model Fidelitat</span>
                          <p className="font-medium">{(shapResult.lime_explanation.model_fidelity * 100).toFixed(1)}%</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <span className="text-sm text-muted-foreground">Confiança</span>
                          <p className="font-medium">{(shapResult.summary.confidence_score * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Executa una anàlisi per veure resultats</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="rf" className="mt-4">
                {rfResult ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="font-medium">Predicció</span>
                        <Badge variant="secondary" className="text-lg">
                          {typeof rfResult.prediction === 'number' 
                            ? rfResult.prediction.toFixed(3)
                            : rfResult.prediction}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 border rounded-lg">
                          <span className="text-sm text-muted-foreground">Probabilitat</span>
                          <p className="font-medium">{(rfResult.probability * 100).toFixed(1)}%</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <span className="text-sm text-muted-foreground">Estimadors</span>
                          <p className="font-medium">{rfResult.ensemble_details.n_estimators}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold">Importància de Features</h4>
                        {rfResult.ensemble_details.feature_importances.map((fi, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{fi.feature}</span>
                              <span className={getImportanceColor(fi.importance)}>
                                {(fi.importance * 100).toFixed(1)}%
                              </span>
                            </div>
                            <Progress value={fi.importance * 100} className="h-2" />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold">Mètriques del Model</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 border rounded text-sm">
                            <span className="text-muted-foreground">Accuracy:</span> {(rfResult.model_metrics.accuracy * 100).toFixed(1)}%
                          </div>
                          <div className="p-2 border rounded text-sm">
                            <span className="text-muted-foreground">Precision:</span> {(rfResult.model_metrics.precision * 100).toFixed(1)}%
                          </div>
                          <div className="p-2 border rounded text-sm">
                            <span className="text-muted-foreground">Recall:</span> {(rfResult.model_metrics.recall * 100).toFixed(1)}%
                          </div>
                          <div className="p-2 border rounded text-sm">
                            <span className="text-muted-foreground">F1:</span> {(rfResult.model_metrics.f1_score * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Executa una predicció Random Forest</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="dl" className="mt-4">
                {dlResult ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="font-medium">Predicció</span>
                        <Badge variant="secondary" className="text-lg">
                          {typeof dlResult.prediction === 'number' 
                            ? dlResult.prediction.toFixed(3)
                            : JSON.stringify(dlResult.prediction)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 border rounded-lg">
                          <span className="text-sm text-muted-foreground">Confiança</span>
                          <p className="font-medium">{(dlResult.confidence * 100).toFixed(1)}%</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <span className="text-sm text-muted-foreground">Arquitectura</span>
                          <p className="font-medium text-xs">{getArchitectureIcon(dlResult.architecture.type)} {dlResult.architecture.type.toUpperCase()}</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <span className="text-sm text-muted-foreground">Capes</span>
                          <p className="font-medium">{dlResult.architecture.layers.length}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold">Gradients de Features</h4>
                        {dlResult.gradients.feature_gradients.map((fg, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{fg.feature}</span>
                              <span>Saliència: {(fg.saliency * 100).toFixed(1)}%</span>
                            </div>
                            <Progress value={fg.saliency * 100} className="h-2" />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold">Incertesa</h4>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 border rounded text-sm">
                            <span className="text-muted-foreground">Epistèmica:</span> {(dlResult.uncertainty.epistemic * 100).toFixed(1)}%
                          </div>
                          <div className="p-2 border rounded text-sm">
                            <span className="text-muted-foreground">Aleatòria:</span> {(dlResult.uncertainty.aleatoric * 100).toFixed(1)}%
                          </div>
                          <div className="p-2 border rounded text-sm">
                            <span className="text-muted-foreground">Total:</span> {(dlResult.uncertainty.total * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold">Arquitectura de Capes</h4>
                        <div className="space-y-2">
                          {dlResult.architecture.layers.map((layer, idx) => (
                            <div key={idx} className="p-2 border rounded text-sm flex justify-between">
                              <span>{layer.name}</span>
                              <span className="text-muted-foreground">{layer.units} unitats · {layer.activation}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Executa una predicció Deep Learning</p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
