import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Video, 
  Stethoscope, 
  Pill, 
  Heart,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useHealthcarePro, TelemedicineSession, DiagnosisAssistResult, DrugInteraction } from '@/hooks/admin/verticals/useHealthcarePro';
import { cn } from '@/lib/utils';

export function HealthcareProPanel() {
  const [activeTab, setActiveTab] = useState('telemedicine');
  const [telemedicineSession, setTelemedicineSession] = useState<TelemedicineSession | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisAssistResult | null>(null);
  const [drugInteractions, setDrugInteractions] = useState<DrugInteraction[] | null>(null);

  const {
    isLoading,
    createTelemedicineSession,
    getDiagnosisAssist,
    checkDrugInteractions,
  } = useHealthcarePro();

  const handleCreateSession = async () => {
    const session = await createTelemedicineSession('demo-patient', 'demo-doctor', new Date().toISOString());
    if (session) setTelemedicineSession(session);
  };

  const handleDiagnosis = async () => {
    const result = await getDiagnosisAssist(['fever', 'cough', 'fatigue'], { age: 35, conditions: [] });
    if (result) setDiagnosisResult(result);
  };

  const handleDrugCheck = async () => {
    const interactions = await checkDrugInteractions(['Aspirin', 'Ibuprofen', 'Lisinopril']);
    setDrugInteractions(interactions);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3 bg-gradient-to-r from-red-500/10 via-pink-500/10 to-rose-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-pink-500">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Healthcare PRO</CardTitle>
              <p className="text-xs text-muted-foreground">Telemedicina, EHR & AI Diagnóstico</p>
            </div>
          </div>
          <Badge variant="outline" className="text-red-500 border-red-500">
            PRO
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="telemedicine" className="text-xs">
              <Video className="h-3 w-3 mr-1" />
              Telemedicina
            </TabsTrigger>
            <TabsTrigger value="diagnosis" className="text-xs">
              <Stethoscope className="h-3 w-3 mr-1" />
              AI Diagnóstico
            </TabsTrigger>
            <TabsTrigger value="drugs" className="text-xs">
              <Pill className="h-3 w-3 mr-1" />
              Interacciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="telemedicine" className="mt-0">
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                <Button 
                  onClick={handleCreateSession} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Video className="h-4 w-4 mr-2" />}
                  Crear Sesión de Telemedicina
                </Button>
                
                {telemedicineSession && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Sesión Creada</span>
                      </div>
                      <div className="text-xs space-y-1 text-muted-foreground">
                        <p>ID: {telemedicineSession.id}</p>
                        <p>Estado: <Badge variant="outline" className="text-xs">{telemedicineSession.status}</Badge></p>
                        <p className="truncate">URL: {telemedicineSession.video_url}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="diagnosis" className="mt-0">
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                <Button 
                  onClick={handleDiagnosis} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Stethoscope className="h-4 w-4 mr-2" />}
                  Ejecutar AI Diagnóstico Demo
                </Button>

                {diagnosisResult && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-3">
                      <p className="text-sm font-medium mb-2">Posibles Condiciones:</p>
                      <div className="space-y-2">
                        {diagnosisResult.possible_conditions?.map((condition, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span>{condition.condition}</span>
                            <Badge variant="secondary">
                              {Math.round(condition.probability * 100)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                      {diagnosisResult.recommended_tests?.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium mb-1">Tests Recomendados:</p>
                          <div className="flex flex-wrap gap-1">
                            {diagnosisResult.recommended_tests.map((test, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">{test}</Badge>
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

          <TabsContent value="drugs" className="mt-0">
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                <Button 
                  onClick={handleDrugCheck} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Pill className="h-4 w-4 mr-2" />}
                  Verificar Interacciones Demo
                </Button>

                {drugInteractions && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-3">
                      {drugInteractions.length > 0 ? (
                        <div className="space-y-2">
                          {drugInteractions.map((interaction, idx) => (
                            <div key={idx} className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                              <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                <span className="text-xs font-medium">
                                  {interaction.drug1} + {interaction.drug2}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">{interaction.description}</p>
                              <Badge variant="outline" className={cn(
                                "text-xs mt-1",
                                interaction.severity === 'severe' && "text-red-500 border-red-500",
                                interaction.severity === 'moderate' && "text-yellow-500 border-yellow-500",
                                interaction.severity === 'mild' && "text-green-500 border-green-500"
                              )}>
                                {interaction.severity}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-500">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">No se detectaron interacciones</span>
                        </div>
                      )}
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

export default HealthcareProPanel;
