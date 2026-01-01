/**
 * FiscalClosingWizard - Asistente de Cierre/Apertura de Ejercicio
 * Fusiona funcionalidad de admin/accounting/ClosingAutomationPanel.tsx
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  AlertTriangle,
  ArrowRight,
  Lock,
  Unlock,
  FileText,
  Calculator,
  BookOpen,
  RefreshCw,
  Loader2,
  ChevronRight,
  Play,
  RotateCcw
} from 'lucide-react';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type StepStatus = 'pending' | 'in_progress' | 'completed' | 'error' | 'skipped';

interface ClosingStep {
  id: string;
  name: string;
  description: string;
  status: StepStatus;
  required: boolean;
  validations?: string[];
  errors?: string[];
}

const initialSteps: ClosingStep[] = [
  { 
    id: 'validate_entries',
    name: '1. Validar Asientos', 
    description: 'Verificar que todos los asientos estén cuadrados y validados',
    status: 'pending',
    required: true,
    validations: ['Asientos cuadrados', 'Sin borradores pendientes', 'Periodos cerrados']
  },
  { 
    id: 'reconcile_accounts',
    name: '2. Conciliar Cuentas', 
    description: 'Conciliar bancos, clientes y proveedores',
    status: 'pending',
    required: true,
    validations: ['Bancos conciliados', 'Clientes cuadrados', 'Proveedores cuadrados']
  },
  { 
    id: 'calculate_depreciation',
    name: '3. Amortizaciones', 
    description: 'Calcular y contabilizar amortizaciones del ejercicio',
    status: 'pending',
    required: true,
    validations: ['Amortización calculada', 'Asientos generados']
  },
  { 
    id: 'provisions',
    name: '4. Provisiones', 
    description: 'Revisar y registrar provisiones necesarias',
    status: 'pending',
    required: false,
    validations: ['Provisión insolvencias', 'Provisión existencias', 'Otras provisiones']
  },
  { 
    id: 'accruals',
    name: '5. Periodificaciones', 
    description: 'Ajustes por periodificación de ingresos y gastos',
    status: 'pending',
    required: false,
    validations: ['Gastos anticipados', 'Ingresos anticipados', 'Ajustes realizados']
  },
  { 
    id: 'regularization',
    name: '6. Regularización', 
    description: 'Regularizar cuentas de gastos e ingresos a PyG',
    status: 'pending',
    required: true,
    validations: ['Grupo 6 regularizado', 'Grupo 7 regularizado', 'Resultado calculado']
  },
  { 
    id: 'result_distribution',
    name: '7. Distribución Resultado', 
    description: 'Propuesta de distribución del resultado',
    status: 'pending',
    required: true,
    validations: ['Propuesta generada', 'Asiento distribución']
  },
  { 
    id: 'closing_entry',
    name: '8. Asiento de Cierre', 
    description: 'Generar asiento de cierre del ejercicio',
    status: 'pending',
    required: true,
    validations: ['Asiento cierre generado', 'Saldos a cero']
  },
  { 
    id: 'opening_entry',
    name: '9. Asiento de Apertura', 
    description: 'Generar asiento de apertura del nuevo ejercicio',
    status: 'pending',
    required: true,
    validations: ['Nuevo ejercicio creado', 'Asiento apertura generado']
  },
];

export function FiscalClosingWizard() {
  const { currentCompany } = useERPContext();
  const [steps, setSteps] = useState<ClosingStep[]>(initialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wizardStarted, setWizardStarted] = useState(false);

  const progress = (steps.filter(s => s.status === 'completed').length / steps.length) * 100;
  const currentStep = steps[currentStepIndex];

  const updateStepStatus = (stepId: string, status: StepStatus, errors?: string[]) => {
    setSteps(prev => prev.map(s => 
      s.id === stepId ? { ...s, status, errors } : s
    ));
  };

  const executeStep = async (step: ClosingStep) => {
    setIsProcessing(true);
    updateStepStatus(step.id, 'in_progress');

    // Simular ejecución
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simular resultado (90% éxito)
    const success = Math.random() > 0.1;

    if (success) {
      updateStepStatus(step.id, 'completed');
      toast.success(`${step.name} completado`);
      
      // Avanzar al siguiente paso
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      }
    } else {
      updateStepStatus(step.id, 'error', ['Error simulado para demostración']);
      toast.error(`Error en ${step.name}`);
    }

    setIsProcessing(false);
  };

  const skipStep = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (step?.required) {
      toast.error('Este paso es obligatorio');
      return;
    }
    updateStepStatus(stepId, 'skipped');
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
    toast.info('Paso omitido');
  };

  const resetWizard = () => {
    setSteps(initialSteps);
    setCurrentStepIndex(0);
    setWizardStarted(false);
  };

  const getStepIcon = (step: ClosingStep, index: number) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'skipped':
        return <Circle className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Circle className={cn("h-5 w-5", index === currentStepIndex ? "text-primary" : "text-muted-foreground")} />;
    }
  };

  if (!currentCompany) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-muted-foreground">
          Selecciona una empresa para el cierre fiscal
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Asistente de Cierre Fiscal</h3>
            <p className="text-sm text-muted-foreground">
              Ejercicio actual
            </p>
          </div>
        </div>
        
        {wizardStarted && (
          <Button variant="outline" size="sm" onClick={resetWizard}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reiniciar
          </Button>
        )}
      </div>

      {!wizardStarted ? (
        /* Pantalla inicial */
        <Card>
          <CardContent className="py-10">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Cierre del Ejercicio 2024</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Este asistente te guiará paso a paso en el proceso de cierre fiscal. 
                  Incluye validaciones, regularización y generación de asientos de cierre y apertura.
                </p>
              </div>
              
              <Alert className="max-w-lg mx-auto">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Asegúrate de tener una copia de seguridad antes de continuar. 
                  Este proceso modifica datos contables.
                </AlertDescription>
              </Alert>

              <Button size="lg" onClick={() => setWizardStarted(true)}>
                <Play className="h-4 w-4 mr-2" />
                Iniciar Proceso de Cierre
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Wizard activo */
        <>
          {/* Progress bar */}
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progreso del cierre</span>
                <span className="font-medium">{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            {/* Lista de pasos */}
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Pasos del Proceso</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-1">
                    {steps.map((step, index) => (
                      <div 
                        key={step.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                          index === currentStepIndex ? "bg-primary/10" : "hover:bg-muted/50",
                          step.status === 'completed' && "opacity-70"
                        )}
                        onClick={() => setCurrentStepIndex(index)}
                      >
                        {getStepIcon(step, index)}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            index === currentStepIndex && "text-primary"
                          )}>
                            {step.name}
                          </p>
                          {step.required && step.status === 'pending' && (
                            <Badge variant="outline" className="text-xs mt-1">Obligatorio</Badge>
                          )}
                        </div>
                        {index === currentStepIndex && (
                          <ChevronRight className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Detalle del paso actual */}
            <Card className="col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{currentStep.name}</CardTitle>
                    <CardDescription>{currentStep.description}</CardDescription>
                  </div>
                  {currentStep.required && (
                    <Badge>Obligatorio</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Validaciones */}
                {currentStep.validations && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Validaciones</h4>
                    <div className="space-y-2">
                      {currentStep.validations.map((validation, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                          {currentStep.status === 'completed' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">{validation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errores */}
                {currentStep.errors && currentStep.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside">
                        {currentStep.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Acciones */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    {!currentStep.required && currentStep.status === 'pending' && (
                      <Button 
                        variant="ghost" 
                        onClick={() => skipStep(currentStep.id)}
                        disabled={isProcessing}
                      >
                        Omitir paso
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {currentStep.status === 'error' && (
                      <Button 
                        variant="outline"
                        onClick={() => executeStep(currentStep)}
                        disabled={isProcessing}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reintentar
                      </Button>
                    )}
                    {currentStep.status !== 'completed' && currentStep.status !== 'skipped' && (
                      <Button 
                        onClick={() => executeStep(currentStep)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Ejecutar Paso
                          </>
                        )}
                      </Button>
                    )}
                    {currentStep.status === 'completed' && currentStepIndex < steps.length - 1 && (
                      <Button onClick={() => setCurrentStepIndex(prev => prev + 1)}>
                        Siguiente
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default FiscalClosingWizard;
