import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Copy,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Wand2,
  Eye,
  SkipForward,
  Filter,
  Zap
} from 'lucide-react';
import { useCRMMigration, CRMMigration, ValidationResult, DuplicateInfo, Transformation } from '@/hooks/admin/integrations';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CRMValidationPanelProps {
  migration: CRMMigration | null;
  onValidationComplete?: (result: ValidationResult) => void;
  onProceed?: () => void;
  className?: string;
}

const TRANSFORMATION_TYPES = [
  { value: 'trim', label: 'Eliminar espacios', description: 'Quita espacios al inicio y final' },
  { value: 'lowercase', label: 'Minúsculas', description: 'Convierte todo a minúsculas' },
  { value: 'uppercase', label: 'Mayúsculas', description: 'Convierte todo a mayúsculas' },
  { value: 'capitalize', label: 'Capitalizar', description: 'Primera letra de cada palabra en mayúscula' },
  { value: 'normalize_phone', label: 'Normalizar teléfono', description: 'Formato estándar +34XXXXXXXXX' },
  { value: 'normalize_cif', label: 'Normalizar CIF', description: 'Formato estándar sin espacios' },
  { value: 'number', label: 'Convertir a número', description: 'Extrae solo dígitos' },
  { value: 'default', label: 'Valor por defecto', description: 'Asigna valor si está vacío' },
];

export function CRMValidationPanel({ 
  migration, 
  onValidationComplete,
  onProceed,
  className 
}: CRMValidationPanelProps) {
  const [activeTab, setActiveTab] = useState('validation');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [duplicates, setDuplicates] = useState<{ internal: DuplicateInfo[]; external: DuplicateInfo[] } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [selectedTransformations, setSelectedTransformations] = useState<Transformation[]>([]);
  const [duplicateThreshold, setDuplicateThreshold] = useState(0.85);
  const [showDuplicateDetails, setShowDuplicateDetails] = useState(false);
  const [transformPreview, setTransformPreview] = useState<Record<string, unknown> | null>(null);

  const {
    validateMigration,
    checkDuplicates,
    applyTransformations,
    previewTransformation,
    skipDuplicates,
    isLoading
  } = useCRMMigration();

  // Run validation
  const handleValidate = useCallback(async () => {
    if (!migration?.id) return;
    
    setIsValidating(true);
    const result = await validateMigration(migration.id);
    setIsValidating(false);
    
    if (result) {
      setValidationResult(result);
      onValidationComplete?.(result);
    }
  }, [migration?.id, validateMigration, onValidationComplete]);

  // Check duplicates
  const handleCheckDuplicates = useCallback(async () => {
    if (!migration?.id) return;
    
    setIsCheckingDuplicates(true);
    const result = await checkDuplicates(migration.id, undefined, duplicateThreshold);
    setIsCheckingDuplicates(false);
    
    if (result) {
      setDuplicates({
        internal: result.internal || [],
        external: result.external || []
      });
    }
  }, [migration?.id, checkDuplicates, duplicateThreshold]);

  // Skip duplicates
  const handleSkipDuplicates = useCallback(async () => {
    if (!migration?.id) return;
    await skipDuplicates(migration.id);
    // Refresh duplicates check
    handleCheckDuplicates();
  }, [migration?.id, skipDuplicates, handleCheckDuplicates]);

  // Add transformation
  const addTransformation = useCallback((type: string, field: string) => {
    const newTransform: Transformation = {
      field,
      type,
      params: type === 'default' ? { value: '' } : undefined
    };
    setSelectedTransformations(prev => [...prev, newTransform]);
  }, []);

  // Apply transformations
  const handleApplyTransformations = useCallback(async () => {
    if (!migration?.id || selectedTransformations.length === 0) return;
    
    await applyTransformations(migration.id, selectedTransformations);
    setSelectedTransformations([]);
    
    // Re-validate after transformations
    handleValidate();
  }, [migration?.id, selectedTransformations, applyTransformations, handleValidate]);

  // Preview transformation
  const handlePreviewTransform = useCallback(async (transformation: Transformation) => {
    if (!migration) return;
    
    // Get a sample record - using migration config as example
    const sampleData = migration.config?.raw_content 
      ? { sample: 'Test Value', email: 'test@example.com', phone: '123456789' }
      : { sample: 'Test Value' };
    
    const result = await previewTransformation(sampleData, transformation);
    if (result) {
      setTransformPreview(result.transformed);
      toast.success(`Transformación: ${result.field} → ${result.newValue}`);
    }
  }, [migration, previewTransformation]);

  if (!migration) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-8 text-center">
          <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Selecciona una migración para validar
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalDuplicates = (duplicates?.internal.length || 0) + (duplicates?.external.length || 0);
  const canProceed = validationResult?.canProceed && totalDuplicates === 0;

  return (
    <Card className={cn("transition-all duration-300", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Validación Pre-Migración</CardTitle>
              <CardDescription>
                {migration.migration_name} • {migration.total_records} registros
              </CardDescription>
            </div>
          </div>
          {validationResult && (
            <Badge variant={validationResult.canProceed ? "default" : "destructive"}>
              {validationResult.canProceed ? 'Listo para migrar' : 'Requiere correcciones'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="validation" className="text-xs gap-1">
              <CheckCircle className="h-3 w-3" />
              Validación
            </TabsTrigger>
            <TabsTrigger value="duplicates" className="text-xs gap-1">
              <Copy className="h-3 w-3" />
              Duplicados
              {totalDuplicates > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {totalDuplicates}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="transforms" className="text-xs gap-1">
              <Wand2 className="h-3 w-3" />
              Transformar
            </TabsTrigger>
          </TabsList>

          {/* Validation Tab */}
          <TabsContent value="validation" className="space-y-4 mt-0">
            <div className="flex gap-2">
              <Button 
                onClick={handleValidate}
                disabled={isValidating}
                className="flex-1"
              >
                {isValidating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Ejecutar Validación
              </Button>
            </div>

            {validationResult && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">{validationResult.totalValidated}</div>
                    <div className="text-xs text-muted-foreground">Validados</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-500/10">
                    <div className="text-2xl font-bold text-green-600">{validationResult.passed}</div>
                    <div className="text-xs text-muted-foreground">Pasaron</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-500/10">
                    <div className="text-2xl font-bold text-red-600">{validationResult.failed}</div>
                    <div className="text-xs text-muted-foreground">Fallaron</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-amber-500/10">
                    <div className="text-2xl font-bold text-amber-600">{validationResult.warnings?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Avisos</div>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Tasa de éxito</span>
                    <span>{Math.round((validationResult.passed / validationResult.totalValidated) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(validationResult.passed / validationResult.totalValidated) * 100} 
                    className="h-2"
                  />
                </div>

                {/* Warnings */}
                {validationResult.warnings && validationResult.warnings.length > 0 && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium w-full">
                      <ChevronRight className="h-4 w-4 transition-transform ui-open:rotate-90" />
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      {validationResult.warnings.length} Advertencias
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <ScrollArea className="h-[120px] mt-2">
                        <div className="space-y-1">
                          {validationResult.warnings.map((warning, idx) => (
                            <div 
                              key={idx}
                              className="flex items-start gap-2 p-2 text-xs bg-amber-500/10 rounded"
                            >
                              <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span>{warning.message}</span>
                              {warning.field && (
                                <Badge variant="outline" className="ml-auto text-[10px]">
                                  {warning.field}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Status */}
                <div className={cn(
                  "flex items-center gap-2 p-3 rounded-lg",
                  validationResult.canProceed 
                    ? "bg-green-500/10 text-green-700" 
                    : "bg-red-500/10 text-red-700"
                )}>
                  {validationResult.canProceed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span className="text-sm font-medium">
                    {validationResult.canProceed 
                      ? 'Datos validados correctamente'
                      : 'Se encontraron errores que bloquean la migración'
                    }
                  </span>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Duplicates Tab */}
          <TabsContent value="duplicates" className="space-y-4 mt-0">
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Umbral de similitud</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0.5"
                    max="1"
                    step="0.05"
                    value={duplicateThreshold}
                    onChange={(e) => setDuplicateThreshold(Number(e.target.value))}
                    className="h-9"
                  />
                  <span className="text-xs text-muted-foreground">
                    {Math.round(duplicateThreshold * 100)}%
                  </span>
                </div>
              </div>
              <Button 
                onClick={handleCheckDuplicates}
                disabled={isCheckingDuplicates}
              >
                {isCheckingDuplicates ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Filter className="h-4 w-4 mr-2" />
                )}
                Buscar Duplicados
              </Button>
            </div>

            {duplicates && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-blue-500/10">
                    <div className="text-xl font-bold text-blue-600">{duplicates.internal.length}</div>
                    <div className="text-xs text-muted-foreground">Internos</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-purple-500/10">
                    <div className="text-xl font-bold text-purple-600">{duplicates.external.length}</div>
                    <div className="text-xs text-muted-foreground">En BD</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-xl font-bold">{totalDuplicates}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                </div>

                {totalDuplicates > 0 && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setShowDuplicateDetails(!showDuplicateDetails)}
                    >
                      {showDuplicateDetails ? (
                        <ChevronDown className="h-4 w-4 mr-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-2" />
                      )}
                      Ver detalles
                    </Button>

                    {showDuplicateDetails && (
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {[...duplicates.internal, ...duplicates.external].map((dup, idx) => (
                            <div 
                              key={idx}
                              className="p-2 text-xs bg-muted/50 rounded-lg space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-[10px]">
                                  {dup.field}
                                </Badge>
                                <span className="text-muted-foreground">
                                  {Math.round(dup.similarity * 100)}% similar
                                </span>
                              </div>
                              <p className="text-muted-foreground">{dup.reason}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}

                    <Button 
                      variant="secondary"
                      className="w-full"
                      onClick={handleSkipDuplicates}
                    >
                      <SkipForward className="h-4 w-4 mr-2" />
                      Omitir todos los duplicados
                    </Button>
                  </>
                )}

                {totalDuplicates === 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">No se encontraron duplicados</span>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Transforms Tab */}
          <TabsContent value="transforms" className="space-y-4 mt-0">
            <div className="space-y-3">
              <Label>Agregar transformación</Label>
              <div className="grid grid-cols-2 gap-2">
                {TRANSFORMATION_TYPES.slice(0, 6).map(type => (
                  <Button
                    key={type.value}
                    variant="outline"
                    size="sm"
                    className="justify-start text-xs h-auto py-2"
                    onClick={() => addTransformation(type.value, '*')}
                  >
                    <Zap className="h-3 w-3 mr-2 text-amber-500" />
                    <div className="text-left">
                      <div>{type.label}</div>
                      <div className="text-[10px] text-muted-foreground font-normal">
                        {type.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {selectedTransformations.length > 0 && (
              <div className="space-y-2">
                <Label>Transformaciones seleccionadas</Label>
                <div className="space-y-1">
                  {selectedTransformations.map((t, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{t.type}</Badge>
                        <span>→ {t.field}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handlePreviewTransform(t)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => setSelectedTransformations(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full"
                  onClick={handleApplyTransformations}
                  disabled={isLoading}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Aplicar {selectedTransformations.length} transformaciones
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Proceed Button */}
        {validationResult && onProceed && (
          <div className="mt-4 pt-4 border-t">
            <Button 
              className="w-full"
              disabled={!canProceed}
              onClick={onProceed}
            >
              {canProceed ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Continuar con Migración
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Corrige los errores para continuar
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CRMValidationPanel;