/**
 * ESG Scoring Panel
 * Evaluación y scoring ESG con benchmarks
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Leaf, 
  Users, 
  Building2, 
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  RefreshCw,
  BarChart3,
  Globe,
  Shield
} from 'lucide-react';
import { useESGCompliance } from '@/hooks/admin/esg';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ESGScoringPanelProps {
  industry?: string;
  className?: string;
}

export function ESGScoringPanel({ industry = 'technology', className }: ESGScoringPanelProps) {
  const [selectedIndustry, setSelectedIndustry] = useState(industry);
  const [activeTab, setActiveTab] = useState('assessment');
  
  // Formulario de evaluación
  const [companyData, setCompanyData] = useState({
    has_environmental_policy: true,
    has_climate_targets: true,
    renewable_energy_percent: 35,
    waste_recycling_percent: 60,
    water_management: true,
    biodiversity_policy: false,
    diversity_ratio: 42,
    gender_pay_gap: 8,
    employee_training_hours: 40,
    health_safety_incidents: 2,
    community_investment: true,
    supply_chain_audit: true,
    board_independence: 60,
    board_diversity: 30,
    executive_esg_link: true,
    whistleblower_policy: true,
    anti_corruption_policy: true,
    tax_transparency: true
  });

  const {
    isLoading,
    esgScore,
    benchmarks,
    assessESGRisk,
    getBenchmarks
  } = useESGCompliance();

  useEffect(() => {
    getBenchmarks(selectedIndustry);
  }, [selectedIndustry]);

  const handleAssess = async () => {
    await assessESGRisk(selectedIndustry, companyData);
    toast.success('Evaluación ESG completada');
  };

  const updateCompanyData = (key: string, value: unknown) => {
    setCompanyData(prev => ({ ...prev, [key]: value }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/20';
    if (score >= 60) return 'bg-yellow-500/20';
    if (score >= 40) return 'bg-orange-500/20';
    return 'bg-red-500/20';
  };

  const getRatingColor = (rating: string) => {
    if (rating?.startsWith('AAA') || rating?.startsWith('AA')) return 'bg-green-500 text-white';
    if (rating?.startsWith('A') || rating?.startsWith('BBB')) return 'bg-yellow-500 text-black';
    if (rating?.startsWith('BB') || rating?.startsWith('B')) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  const currentBenchmark = benchmarks[selectedIndustry] || { environmental: 60, social: 60, governance: 70 };

  return (
    <div className={cn("space-y-6", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="assessment" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Evaluación
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Resultados
          </TabsTrigger>
          <TabsTrigger value="benchmarks" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Benchmarks
          </TabsTrigger>
          <TabsTrigger value="materiality" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Materialidad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assessment" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Environmental */}
            <Card className="border-green-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-green-500" />
                  Environmental
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="env_policy"
                    checked={companyData.has_environmental_policy}
                    onCheckedChange={(v) => updateCompanyData('has_environmental_policy', v)}
                  />
                  <Label htmlFor="env_policy">Política ambiental documentada</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="climate_targets"
                    checked={companyData.has_climate_targets}
                    onCheckedChange={(v) => updateCompanyData('has_climate_targets', v)}
                  />
                  <Label htmlFor="climate_targets">Objetivos climáticos establecidos</Label>
                </div>
                <div className="space-y-2">
                  <Label>Energía renovable: {companyData.renewable_energy_percent}%</Label>
                  <Slider
                    value={[companyData.renewable_energy_percent]}
                    onValueChange={([v]) => updateCompanyData('renewable_energy_percent', v)}
                    max={100}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Residuos reciclados: {companyData.waste_recycling_percent}%</Label>
                  <Slider
                    value={[companyData.waste_recycling_percent]}
                    onValueChange={([v]) => updateCompanyData('waste_recycling_percent', v)}
                    max={100}
                    step={5}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="water"
                    checked={companyData.water_management}
                    onCheckedChange={(v) => updateCompanyData('water_management', v)}
                  />
                  <Label htmlFor="water">Gestión del agua</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="biodiversity"
                    checked={companyData.biodiversity_policy}
                    onCheckedChange={(v) => updateCompanyData('biodiversity_policy', v)}
                  />
                  <Label htmlFor="biodiversity">Política de biodiversidad</Label>
                </div>
              </CardContent>
            </Card>

            {/* Social */}
            <Card className="border-blue-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Social
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Diversidad en plantilla: {companyData.diversity_ratio}%</Label>
                  <Slider
                    value={[companyData.diversity_ratio]}
                    onValueChange={([v]) => updateCompanyData('diversity_ratio', v)}
                    max={100}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Brecha salarial género: {companyData.gender_pay_gap}%</Label>
                  <Slider
                    value={[companyData.gender_pay_gap]}
                    onValueChange={([v]) => updateCompanyData('gender_pay_gap', v)}
                    max={50}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horas formación/empleado: {companyData.employee_training_hours}h</Label>
                  <Slider
                    value={[companyData.employee_training_hours]}
                    onValueChange={([v]) => updateCompanyData('employee_training_hours', v)}
                    max={100}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Incidentes de seguridad: {companyData.health_safety_incidents}</Label>
                  <Slider
                    value={[companyData.health_safety_incidents]}
                    onValueChange={([v]) => updateCompanyData('health_safety_incidents', v)}
                    max={20}
                    step={1}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="community"
                    checked={companyData.community_investment}
                    onCheckedChange={(v) => updateCompanyData('community_investment', v)}
                  />
                  <Label htmlFor="community">Inversión en comunidad</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="supply_audit"
                    checked={companyData.supply_chain_audit}
                    onCheckedChange={(v) => updateCompanyData('supply_chain_audit', v)}
                  />
                  <Label htmlFor="supply_audit">Auditoría cadena suministro</Label>
                </div>
              </CardContent>
            </Card>

            {/* Governance */}
            <Card className="border-purple-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-500" />
                  Governance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Independencia del consejo: {companyData.board_independence}%</Label>
                  <Slider
                    value={[companyData.board_independence]}
                    onValueChange={([v]) => updateCompanyData('board_independence', v)}
                    max={100}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Diversidad en consejo: {companyData.board_diversity}%</Label>
                  <Slider
                    value={[companyData.board_diversity]}
                    onValueChange={([v]) => updateCompanyData('board_diversity', v)}
                    max={100}
                    step={5}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="exec_esg"
                    checked={companyData.executive_esg_link}
                    onCheckedChange={(v) => updateCompanyData('executive_esg_link', v)}
                  />
                  <Label htmlFor="exec_esg">Retribución variable ligada a ESG</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="whistleblower"
                    checked={companyData.whistleblower_policy}
                    onCheckedChange={(v) => updateCompanyData('whistleblower_policy', v)}
                  />
                  <Label htmlFor="whistleblower">Canal de denuncias</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="anticorruption"
                    checked={companyData.anti_corruption_policy}
                    onCheckedChange={(v) => updateCompanyData('anti_corruption_policy', v)}
                  />
                  <Label htmlFor="anticorruption">Política anticorrupción</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="tax"
                    checked={companyData.tax_transparency}
                    onCheckedChange={(v) => updateCompanyData('tax_transparency', v)}
                  />
                  <Label htmlFor="tax">Transparencia fiscal</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Industria a evaluar</Label>
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Tecnología</SelectItem>
                      <SelectItem value="manufacturing">Manufactura</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="healthcare">Salud</SelectItem>
                      <SelectItem value="finance">Finanzas</SelectItem>
                      <SelectItem value="energy">Energía</SelectItem>
                      <SelectItem value="agriculture">Agricultura</SelectItem>
                      <SelectItem value="construction">Construcción</SelectItem>
                      <SelectItem value="hospitality">Hostelería</SelectItem>
                      <SelectItem value="logistics">Logística</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAssess} disabled={isLoading} size="lg">
                  {isLoading ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Evaluando...</>
                  ) : (
                    <><Target className="h-4 w-4 mr-2" /> Evaluar ESG</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          {esgScore ? (
            <div className="space-y-6">
              {/* Score Principal */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className={cn("col-span-1 md:col-span-1", getScoreBg(esgScore.overall_score))}>
                  <CardContent className="pt-6 text-center">
                    <div className={cn("text-5xl font-bold", getScoreColor(esgScore.overall_score))}>
                      {esgScore.overall_score}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">ESG Score</p>
                    <Badge className={cn("mt-3", getRatingColor(esgScore.rating))}>
                      {esgScore.rating}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-green-500/20">
                        <Leaf className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <div className={cn("text-2xl font-bold", getScoreColor(esgScore.environmental.score))}>
                          {esgScore.environmental.score}
                        </div>
                        <p className="text-sm text-muted-foreground">Environmental</p>
                      </div>
                    </div>
                    <Progress value={esgScore.environmental.score} className="mt-3 h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Benchmark: {currentBenchmark.environmental}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-blue-500/20">
                        <Users className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <div className={cn("text-2xl font-bold", getScoreColor(esgScore.social.score))}>
                          {esgScore.social.score}
                        </div>
                        <p className="text-sm text-muted-foreground">Social</p>
                      </div>
                    </div>
                    <Progress value={esgScore.social.score} className="mt-3 h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Benchmark: {currentBenchmark.social}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-purple-500/20">
                        <Building2 className="h-6 w-6 text-purple-500" />
                      </div>
                      <div>
                        <div className={cn("text-2xl font-bold", getScoreColor(esgScore.governance.score))}>
                          {esgScore.governance.score}
                        </div>
                        <p className="text-sm text-muted-foreground">Governance</p>
                      </div>
                    </div>
                    <Progress value={esgScore.governance.score} className="mt-3 h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Benchmark: {currentBenchmark.governance}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Riesgos y Oportunidades */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-500">
                      <AlertTriangle className="h-5 w-5" />
                      Riesgos Clave
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {esgScore.key_risks.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-500">
                      <CheckCircle className="h-5 w-5" />
                      Plan de Acción
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {esgScore.action_plan.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* ODS Alineados */}
              <Card>
                <CardHeader>
                  <CardTitle>Objetivos de Desarrollo Sostenible Alineados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {esgScore.sdg_alignment.map((sdg, idx) => (
                      <Badge key={idx} variant="outline" className="text-sm py-2 px-4">
                        {sdg}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Completa la evaluación para ver los resultados
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="benchmarks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Benchmarks por Industria</CardTitle>
              <CardDescription>Comparativa de scores ESG promedio por sector</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(benchmarks).map(([ind, scores]) => (
                  <div key={ind} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium capitalize">{ind}</span>
                      <Badge variant="outline">
                        Promedio: {Math.round((scores.environmental + scores.social + scores.governance) / 3)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Environmental</span>
                          <span className={getScoreColor(scores.environmental)}>{scores.environmental}</span>
                        </div>
                        <Progress value={scores.environmental} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Social</span>
                          <span className={getScoreColor(scores.social)}>{scores.social}</span>
                        </div>
                        <Progress value={scores.social} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Governance</span>
                          <span className={getScoreColor(scores.governance)}>{scores.governance}</span>
                        </div>
                        <Progress value={scores.governance} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materiality" className="mt-6">
          {esgScore?.materiality_matrix ? (
            <Card>
              <CardHeader>
                <CardTitle>Matriz de Materialidad</CardTitle>
                <CardDescription>Temas ESG por importancia e impacto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {esgScore.materiality_matrix.map((item, idx) => (
                    <Card key={idx} className={cn(
                      "border",
                      item.importance >= 8 && item.impact >= 8 ? "border-red-500/50 bg-red-500/5" :
                      item.importance >= 6 && item.impact >= 6 ? "border-yellow-500/50 bg-yellow-500/5" :
                      "border-green-500/50 bg-green-500/5"
                    )}>
                      <CardContent className="pt-4">
                        <h4 className="font-semibold mb-2">{item.topic}</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Importancia:</span>
                            <div className="flex items-center gap-1 mt-1">
                              <Progress value={item.importance * 10} className="h-2 flex-1" />
                              <span className="font-medium">{item.importance}/10</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Impacto:</span>
                            <div className="flex items-center gap-1 mt-1">
                              <Progress value={item.impact * 10} className="h-2 flex-1" />
                              <span className="font-medium">{item.impact}/10</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Realiza una evaluación ESG para ver la matriz de materialidad
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ESGScoringPanel;
