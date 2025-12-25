import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Briefcase, 
  Scale,
  GraduationCap,
  Hotel,
  Users,
  RefreshCw,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useServicesPro, ContractAnalysis, AdaptiveLearningPath, RevenuePricing, CustomerDNA } from '@/hooks/admin/verticals/useServicesPro';
import { cn } from '@/lib/utils';

export function ServicesProPanel() {
  const [activeTab, setActiveTab] = useState('legal');
  const [contractAnalysis, setContractAnalysis] = useState<ContractAnalysis | null>(null);
  const [adaptivePath, setAdaptivePath] = useState<AdaptiveLearningPath | null>(null);
  const [revenuePricing, setRevenuePricing] = useState<RevenuePricing[] | null>(null);
  const [customerDNA, setCustomerDNA] = useState<CustomerDNA | null>(null);

  const {
    isLoading,
    analyzeContract,
    getAdaptivePath,
    getRevenuePricing,
    getCustomerDNA,
  } = useServicesPro();

  const handleContract = async () => {
    const analysis = await analyzeContract('contract-demo-1', 'Este es un contrato de ejemplo para análisis...');
    if (analysis) setContractAnalysis(analysis);
  };

  const handleLearning = async () => {
    const path = await getAdaptivePath('student-demo', 'course-demo');
    if (path) setAdaptivePath(path);
  };

  const handlePricing = async () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const pricing = await getRevenuePricing('hotel-demo', { 
      start: today.toISOString().split('T')[0], 
      end: nextWeek.toISOString().split('T')[0] 
    });
    if (pricing) setRevenuePricing(pricing);
  };

  const handleCustomerDNA = async () => {
    const dna = await getCustomerDNA('customer-demo');
    if (dna) setCustomerDNA(dna);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Services PRO</CardTitle>
              <p className="text-xs text-muted-foreground">Legal, Educación, Hospitality & Retail</p>
            </div>
          </div>
          <Badge variant="outline" className="text-blue-500 border-blue-500">
            PRO
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="legal" className="text-xs">
              <Scale className="h-3 w-3 mr-1" />
              Legal
            </TabsTrigger>
            <TabsTrigger value="education" className="text-xs">
              <GraduationCap className="h-3 w-3 mr-1" />
              Edu
            </TabsTrigger>
            <TabsTrigger value="hospitality" className="text-xs">
              <Hotel className="h-3 w-3 mr-1" />
              Hotel
            </TabsTrigger>
            <TabsTrigger value="retail" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Retail
            </TabsTrigger>
          </TabsList>

          <TabsContent value="legal" className="mt-0">
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                <Button 
                  onClick={handleContract} 
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                  Analizar Contrato Demo
                </Button>

                {contractAnalysis && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Análisis de Riesgo</span>
                        <Badge variant={contractAnalysis.overall_risk > 50 ? "destructive" : "secondary"}>
                          {contractAnalysis.overall_risk}% riesgo
                        </Badge>
                      </div>
                      
                      {contractAnalysis.clauses?.map((clause, idx) => (
                        <div key={idx} className="p-2 rounded bg-background border text-xs">
                          <div className="flex items-center justify-between">
                            <span>{clause.type}</span>
                            <Badge variant="outline" className={cn(
                              clause.risk_level === 'high' && "text-red-500 border-red-500",
                              clause.risk_level === 'medium' && "text-yellow-500 border-yellow-500",
                              clause.risk_level === 'low' && "text-green-500 border-green-500"
                            )}>
                              {clause.risk_level}
                            </Badge>
                          </div>
                        </div>
                      ))}

                      {contractAnalysis.missing_clauses?.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs font-medium mb-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-yellow-500" />
                            Cláusulas Faltantes:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {contractAnalysis.missing_clauses.map((clause, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">{clause}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="education" className="mt-0">
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                <Button 
                  onClick={handleLearning} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <GraduationCap className="h-4 w-4 mr-2" />}
                  Generar Ruta Adaptativa
                </Button>

                {adaptivePath && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Ruta de Aprendizaje</span>
                        <Badge variant="secondary">Nivel {adaptivePath.current_level}</Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Finalización estimada: {new Date(adaptivePath.predicted_completion_date).toLocaleDateString()}
                      </div>

                      {adaptivePath.knowledge_gaps?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-1">Brechas de Conocimiento:</p>
                          <div className="flex flex-wrap gap-1">
                            {adaptivePath.knowledge_gaps.map((gap, idx) => (
                              <Badge key={idx} variant="destructive" className="text-xs">{gap}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="hospitality" className="mt-0">
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                <Button 
                  onClick={handlePricing} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Hotel className="h-4 w-4 mr-2" />}
                  Revenue Pricing AI
                </Button>

                {revenuePricing && revenuePricing.length > 0 && (
                  <div className="space-y-2">
                    {revenuePricing.map((room, idx) => (
                      <Card key={idx} className="bg-muted/50">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{room.room_type}</span>
                            <span className="text-xs text-muted-foreground">{room.date}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded bg-background">
                              <p className="text-muted-foreground">Base</p>
                              <p className="font-medium">${room.base_price}</p>
                            </div>
                            <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                              <p className="text-green-600">Recomendado</p>
                              <p className="font-bold text-green-600">${room.recommended_price}</p>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Demanda: {Math.round(room.demand_score * 100)}% | Ocupación est.: {Math.round(room.expected_occupancy * 100)}%
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="retail" className="mt-0">
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                <Button 
                  onClick={handleCustomerDNA} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
                  Customer DNA Analysis
                </Button>

                {customerDNA && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Perfil del Cliente</span>
                        <span className="text-xs text-muted-foreground">{customerDNA.customer_id}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {customerDNA.segments?.map((segment, idx) => (
                          <Badge key={idx} variant="secondary">{segment}</Badge>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-background">
                          <p className="text-muted-foreground">Frecuencia</p>
                          <p className="font-medium">{customerDNA.purchase_behavior?.frequency}/año</p>
                        </div>
                        <div className="p-2 rounded bg-background">
                          <p className="text-muted-foreground">Ticket Medio</p>
                          <p className="font-medium">${customerDNA.purchase_behavior?.average_order_value}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Riesgo Churn</p>
                          <Progress value={customerDNA.churn_risk * 100} className="h-2 w-20 mt-1" />
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Lifetime Value</p>
                          <p className="font-bold text-green-600">${customerDNA.lifetime_value?.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ServicesProPanel;
