import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { companySchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Download,
  Users,
  Sparkles,
  Loader2,
  Trash2,
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ExcelImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
  parroquias: string[];
}

interface ExcelRow {
  [key: string]: any;
}

interface MappedColumn {
  excelColumn: string;
  dbField: string;
}

interface ValidationError {
  row: number;
  field: string;
  value: any;
  error: string;
}

interface DuplicateRecord {
  row: number;
  existingCompany: string;
  matchType: 'nif' | 'name';
  similarity: number;
}

interface ImportResult {
  success: number;
  errors: number;
  duplicates: number;
  skipped: number;
}

const DB_FIELDS = [
  { value: 'name', label: 'Nombre *', required: true },
  { value: 'address', label: 'Dirección *', required: true },
  { value: 'latitude', label: 'Latitud *', required: true },
  { value: 'longitude', label: 'Longitud *', required: true },
  { value: 'parroquia', label: 'Parroquia *', required: true },
  { value: 'tax_id', label: 'NIF/CIF', required: false },
  { value: 'cnae', label: 'CNAE', required: false },
  { value: 'sector', label: 'Sector', required: false },
  { value: 'oficina', label: 'Oficina', required: false },
  { value: 'phone', label: 'Teléfono', required: false },
  { value: 'email', label: 'Email', required: false },
  { value: 'website', label: 'Sitio Web', required: false },
  { value: 'employees', label: 'Empleados', required: false },
  { value: 'turnover', label: 'Facturación', required: false },
  { value: 'registration_number', label: 'Nº Registro', required: false },
  { value: 'legal_form', label: 'Forma Legal', required: false },
  { value: 'observaciones', label: 'Observaciones', required: false },
];

export const ExcelImporter = ({ open, onOpenChange, onImportComplete, parroquias }: ExcelImporterProps) => {
  const [step, setStep] = useState<'upload' | 'map' | 'validate' | 'import'>('upload');
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<MappedColumn[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateRecord[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [smartMapping, setSmartMapping] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteLastDialog, setShowDeleteLastDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error('El archivo Excel está vacío');
        return;
      }

      setExcelData(jsonData);
      const columns = Object.keys(jsonData[0]);
      setExcelColumns(columns);

      // Auto-map columns based on common patterns
      const autoMapping = autoMapColumns(columns);
      setColumnMapping(autoMapping);

      toast.success(`Archivo cargado: ${jsonData.length} filas detectadas`);
      setStep('map');
    } catch (error: any) {
      console.error('Error loading Excel:', error);
      toast.error('Error al cargar el archivo Excel');
    }
  };

  const autoMapColumns = (columns: string[]): MappedColumn[] => {
    const mapping: MappedColumn[] = [];
    const patterns: { [key: string]: string[] } = {
      name: ['nombre', 'name', 'empresa', 'company', 'razon social', 'razón social'],
      address: ['dirección', 'direccion', 'address', 'calle', 'domicilio'],
      latitude: ['latitud', 'latitude', 'lat', 'y'],
      longitude: ['longitud', 'longitude', 'lon', 'lng', 'x'],
      parroquia: ['parroquia', 'parish', 'municipio', 'localidad'],
      tax_id: ['nif', 'cif', 'tax_id', 'tax id', 'dni', 'ruc', 'identificación fiscal'],
      cnae: ['cnae', 'actividad', 'activity'],
      sector: ['sector', 'industria', 'industry', 'rubro'],
      oficina: ['oficina', 'office', 'sucursal', 'agencia'],
      phone: ['teléfono', 'telefono', 'phone', 'tel', 'móvil', 'movil'],
      email: ['email', 'correo', 'e-mail', 'mail'],
      website: ['web', 'website', 'sitio web', 'página web', 'url'],
      employees: ['empleados', 'employees', 'trabajadores', 'plantilla', 'personal'],
      turnover: ['facturación', 'facturacion', 'turnover', 'ingresos', 'ventas'],
      registration_number: ['registro', 'registration', 'nº registro', 'num registro'],
      legal_form: ['forma legal', 'legal form', 'tipo sociedad', 'forma jurídica'],
      observaciones: ['observaciones', 'notes', 'notas', 'comentarios', 'remarks'],
    };

    columns.forEach((col) => {
      const normalized = col.toLowerCase().trim();
      for (const [dbField, keywords] of Object.entries(patterns)) {
        if (keywords.some((keyword) => normalized.includes(keyword))) {
          mapping.push({ excelColumn: col, dbField });
          break;
        }
      }
    });

    return mapping;
  };

  const smartAutoMap = async () => {
    setSmartMapping(true);
    try {
      const { data, error } = await supabase.functions.invoke('smart-column-mapping', {
        body: {
          columns: excelColumns,
          sampleData: excelData.slice(0, 3)
        }
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Límite de solicitudes alcanzado. Por favor, espera un momento e intenta de nuevo.');
        } else if (data.error.includes('Payment required')) {
          toast.error('Se requiere pago. Por favor, añade créditos a tu espacio de trabajo Lovable AI.');
        } else {
          toast.error('Error en el mapeo inteligente: ' + data.error);
        }
        return;
      }

      if (data.mappings && Array.isArray(data.mappings)) {
        const aiMappings: MappedColumn[] = data.mappings.map((m: any) => ({
          excelColumn: m.excelColumn,
          dbField: m.dbField
        }));
        
        setColumnMapping(aiMappings);
        toast.success(`✨ Mapeo inteligente completado: ${data.mappedColumns} de ${data.totalColumns} columnas mapeadas`);
        
        // Show reasoning if available
        if (data.mappings.some((m: any) => m.reasoning)) {
          console.log('AI Mapping Reasoning:', data.mappings);
        }
      } else {
        toast.error('Respuesta inválida del servicio de mapeo');
      }
    } catch (error: any) {
      console.error('Error in smart mapping:', error);
      toast.error('Error al realizar el mapeo inteligente. Usando mapeo automático básico.');
      // Fallback to basic mapping
      const basicMapping = autoMapColumns(excelColumns);
      setColumnMapping(basicMapping);
    } finally {
      setSmartMapping(false);
    }
  };

  const updateMapping = (excelColumn: string, dbField: string) => {
    setColumnMapping((prev) => {
      const filtered = prev.filter((m) => m.excelColumn !== excelColumn && m.dbField !== dbField);
      if (dbField !== 'skip') {
        return [...filtered, { excelColumn, dbField }];
      }
      return filtered;
    });
  };

  const getMappedField = (excelColumn: string): string => {
    const mapping = columnMapping.find((m) => m.excelColumn === excelColumn);
    return mapping?.dbField || 'skip';
  };

  const validateData = async () => {
    const errors: ValidationError[] = [];
    const dups: DuplicateRecord[] = [];

    // Fetch existing companies for duplicate detection
    const { data: existingCompanies } = await supabase
      .from('companies')
      .select('name, tax_id');

    const existingNamesLower = existingCompanies?.map((c) => c.name.toLowerCase()) || [];
    const existingTaxIds = existingCompanies
      ?.map((c) => c.tax_id)
      .filter(Boolean)
      .map((id) => id!.toLowerCase()) || [];

    excelData.forEach((row, index) => {
      const mappedData: any = {};

      columnMapping.forEach(({ excelColumn, dbField }) => {
        mappedData[dbField] = row[excelColumn];
      });

      // Validate required fields
      if (!mappedData.name || !mappedData.address || !mappedData.parroquia) {
        errors.push({
          row: index + 2,
          field: 'Campos obligatorios',
          value: '',
          error: 'Faltan campos obligatorios (Nombre, Dirección o Parroquia)',
        });
        return;
      }

      // Validate coordinates
      const lat = Number(mappedData.latitude);
      const lon = Number(mappedData.longitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.push({
          row: index + 2,
          field: 'latitude',
          value: mappedData.latitude,
          error: 'Latitud inválida (debe estar entre -90 y 90)',
        });
      }
      if (isNaN(lon) || lon < -180 || lon > 180) {
        errors.push({
          row: index + 2,
          field: 'longitude',
          value: mappedData.longitude,
          error: 'Longitud inválida (debe estar entre -180 y 180)',
        });
      }

      // Validate email format
      if (mappedData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mappedData.email)) {
        errors.push({
          row: index + 2,
          field: 'email',
          value: mappedData.email,
          error: 'Email inválido',
        });
      }

      // Validate URL format
      if (mappedData.website && mappedData.website.trim() !== '') {
        try {
          new URL(mappedData.website);
        } catch {
          errors.push({
            row: index + 2,
            field: 'website',
            value: mappedData.website,
            error: 'URL inválida',
          });
        }
      }

      // Validate numeric fields
      if (mappedData.employees && isNaN(Number(mappedData.employees))) {
        errors.push({
          row: index + 2,
          field: 'employees',
          value: mappedData.employees,
          error: 'Debe ser un número válido',
        });
      }
      if (mappedData.turnover && isNaN(Number(mappedData.turnover))) {
        errors.push({
          row: index + 2,
          field: 'turnover',
          value: mappedData.turnover,
          error: 'Debe ser un número válido',
        });
      }

      // Check for duplicates by tax_id
      if (mappedData.tax_id) {
        const normalizedTaxId = mappedData.tax_id.toLowerCase().trim();
        if (existingTaxIds.includes(normalizedTaxId)) {
          dups.push({
            row: index + 2,
            existingCompany: existingCompanies?.find(
              (c) => c.tax_id?.toLowerCase() === normalizedTaxId
            )?.name || 'Desconocida',
            matchType: 'nif',
            similarity: 100,
          });
        }
      }

      // Check for duplicates by name (fuzzy match)
      if (mappedData.name) {
        const normalizedName = mappedData.name.toLowerCase().trim();
        const exactMatch = existingNamesLower.find((n) => n === normalizedName);
        if (exactMatch) {
          dups.push({
            row: index + 2,
            existingCompany: existingCompanies?.find(
              (c) => c.name.toLowerCase() === normalizedName
            )?.name || 'Desconocida',
            matchType: 'name',
            similarity: 100,
          });
        } else {
          // Check for similar names (simple contains check)
          const similar = existingNamesLower.find((n) =>
            n.includes(normalizedName) || normalizedName.includes(n)
          );
          if (similar) {
            const similarity = Math.round(
              (Math.min(normalizedName.length, similar.length) /
                Math.max(normalizedName.length, similar.length)) *
                100
            );
            if (similarity > 70) {
              dups.push({
                row: index + 2,
                existingCompany: existingCompanies?.find(
                  (c) => c.name.toLowerCase() === similar
                )?.name || 'Desconocida',
                matchType: 'name',
                similarity,
              });
            }
          }
        }
      }
    });

    setValidationErrors(errors);
    setDuplicates(dups);
    setStep('validate');

    if (errors.length === 0 && dups.length === 0) {
      toast.success('✅ Validación completada sin errores');
    } else if (errors.length > 0) {
      toast.error(`Se encontraron ${errors.length} errores de validación`);
    }
  };

  const performImport = async () => {
    setImporting(true);
    setImportProgress(0);

    const result: ImportResult = {
      success: 0,
      errors: 0,
      duplicates: 0,
      skipped: 0,
    };

    // Crear registro de lote de importación
    const { data: batchData, error: batchError } = await supabase
      .from('import_batches')
      .insert([{
        filename: 'import.xlsx',
        total_records: excelData.length,
        successful_records: 0,
        failed_records: 0
      }])
      .select()
      .single();

    if (batchError || !batchData) {
      toast.error("No se pudo crear el registro de importación");
      setImporting(false);
      return;
    }

    setCurrentBatchId(batchData.id);

    const totalRows = excelData.length;
    const duplicateRows = new Set(duplicates.map((d) => d.row));
    const errorRows = new Set(validationErrors.map((e) => e.row));

    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i];
      const rowNumber = i + 2;

      // Skip rows with errors or duplicates
      if (errorRows.has(rowNumber)) {
        result.errors++;
        setImportProgress(((i + 1) / totalRows) * 100);
        continue;
      }

      if (duplicateRows.has(rowNumber)) {
        result.duplicates++;
        setImportProgress(((i + 1) / totalRows) * 100);
        continue;
      }

      const mappedData: any = {};
      columnMapping.forEach(({ excelColumn, dbField }) => {
        mappedData[dbField] = row[excelColumn];
      });

      // Geocodificar si faltan coordenadas o son 0
      let latitude = mappedData.latitude ? Number(mappedData.latitude) : null;
      let longitude = mappedData.longitude ? Number(mappedData.longitude) : null;

      if ((!latitude || latitude === 0 || !longitude || longitude === 0) && mappedData.address) {
        try {
          const { data: geoData, error: geoError } = await supabase.functions.invoke('geocode-address', {
            body: { 
              address: mappedData.address,
              parroquia: mappedData.parroquia 
            }
          });

          if (!geoError && geoData?.latitude && geoData?.longitude) {
            latitude = geoData.latitude;
            longitude = geoData.longitude;
          }
        } catch (geoError) {
          console.warn(`Geocoding failed for row ${rowNumber}:`, geoError);
        }
      }

      try {
        const { error } = await supabase.from('companies').insert({
          name: mappedData.name,
          address: mappedData.address,
          latitude: latitude,
          longitude: longitude,
          parroquia: mappedData.parroquia,
          cnae: mappedData.cnae || null,
          sector: mappedData.sector || null,
          oficina: mappedData.oficina || null,
          phone: mappedData.phone || null,
          email: mappedData.email || null,
          website: mappedData.website || null,
          employees: mappedData.employees ? Number(mappedData.employees) : null,
          turnover: mappedData.turnover ? Number(mappedData.turnover) : null,
          tax_id: mappedData.tax_id || null,
          registration_number: mappedData.registration_number || null,
          legal_form: mappedData.legal_form || null,
          observaciones: mappedData.observaciones || null,
          import_batch_id: batchData.id,
        });

        if (error) throw error;
        result.success++;
      } catch (error: any) {
        console.error(`Error importing row ${rowNumber}:`, error);
        result.errors++;
      }

      setImportProgress(((i + 1) / totalRows) * 100);
    }

    // Actualizar estadísticas del lote
    await supabase
      .from('import_batches')
      .update({
        successful_records: result.success,
        failed_records: result.errors + result.duplicates
      })
      .eq('id', batchData.id);

    setImportResult(result);
    setImporting(false);
    setStep('import');

    toast.success(
      `Importación completada: ${result.success} empresas importadas correctamente`
    );
    onImportComplete();
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .not('id', 'is', null);

      if (error) throw error;

      toast.success("Todas las empresas han sido eliminadas correctamente");
      onImportComplete();
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar empresas");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteLastImport = async () => {
    if (!currentBatchId) {
      toast.error("No hay importación reciente para eliminar");
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('import_batch_id', currentBatchId);

      if (error) throw error;

      toast.success("Las empresas de la última importación han sido eliminadas");
      onImportComplete();
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar importación");
    } finally {
      setDeleting(false);
      setShowDeleteLastDialog(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setExcelData([]);
    setExcelColumns([]);
    setColumnMapping([]);
    setValidationErrors([]);
    setDuplicates([]);
    setImportProgress(0);
    setImportResult(null);
    setCurrentBatchId(null);
    onOpenChange(false);
  };

  const exportTemplate = () => {
    const headers = DB_FIELDS.filter((f) => f.required).map((f) => f.label.replace(' *', ''));
    const optionalHeaders = DB_FIELDS.filter((f) => !f.required).map((f) => f.label);
    const allHeaders = [...headers, ...optionalHeaders];

    const ws = XLSX.utils.aoa_to_sheet([allHeaders]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, 'plantilla_importacion_empresas.xlsx');
    toast.success('Plantilla descargada correctamente');
  };

  const requiredFieldsMapped = DB_FIELDS.filter((f) => f.required).every((f) =>
    columnMapping.some((m) => m.dbField === f.value)
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Importador Avanzado de Empresas</DialogTitle>
          <DialogDescription>
            Importa empresas desde Excel con validación y detección de duplicados
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" disabled={step !== 'upload'}>
              <Upload className="h-4 w-4 mr-2" />
              Cargar Archivo
            </TabsTrigger>
            <TabsTrigger value="map" disabled={step !== 'map'}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Mapear Columnas
            </TabsTrigger>
            <TabsTrigger value="validate" disabled={step !== 'validate'}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Validar Datos
            </TabsTrigger>
            <TabsTrigger value="import" disabled={step !== 'import'}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Importar
            </TabsTrigger>
          </TabsList>

          {/* Step 1: Upload */}
          <TabsContent value="upload" className="space-y-4">
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertTitle>Formato del Archivo Excel</AlertTitle>
              <AlertDescription>
                El archivo debe contener una fila de encabezados y los datos en las filas
                siguientes. Campos obligatorios: Nombre, Dirección, Latitud, Longitud y
                Parroquia.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center items-center border-2 border-dashed rounded-lg p-12 hover:border-primary transition-colors">
              <div className="text-center">
                <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-lg font-semibold text-primary">
                    Haz clic para seleccionar un archivo
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Formatos soportados: .xlsx, .xls
                  </p>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            <Button variant="outline" onClick={exportTemplate} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla Excel
            </Button>
          </TabsContent>

          {/* Step 2: Map Columns */}
          <TabsContent value="map" className="space-y-4">
            <Alert>
              <ArrowRight className="h-4 w-4" />
              <AlertTitle>Mapeo Automático Aplicado</AlertTitle>
              <AlertDescription>
                Se detectaron automáticamente {columnMapping.length} columnas. Verifica y ajusta
                el mapeo según sea necesario.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                onClick={smartAutoMap} 
                disabled={smartMapping}
                variant="default"
                className="flex-1"
              >
                {smartMapping ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analizando con IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Mapeo Inteligente con IA
                  </>
                )}
              </Button>
              <Button 
                onClick={() => {
                  const basicMapping = autoMapColumns(excelColumns);
                  setColumnMapping(basicMapping);
                  toast.success('Mapeo básico aplicado');
                }}
                variant="outline"
              >
                Mapeo Básico
              </Button>
            </div>

            <ScrollArea className="h-[400px] border rounded-lg p-4">
              <div className="space-y-3">
                {excelColumns.map((col) => (
                  <div key={col} className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">{col}</Label>
                      <p className="text-xs text-muted-foreground">
                        Muestra: {String(excelData[0][col]).substring(0, 50)}...
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={getMappedField(col)}
                      onValueChange={(value) => updateMapping(col, value)}
                    >
                      <SelectTrigger className="w-[250px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">
                          <span className="text-muted-foreground">-- Ignorar --</span>
                        </SelectItem>
                        {DB_FIELDS.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {!requiredFieldsMapped && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Campos Obligatorios Faltantes</AlertTitle>
                <AlertDescription>
                  Debes mapear todos los campos obligatorios: Nombre, Dirección, Latitud,
                  Longitud y Parroquia.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Atrás
              </Button>
              <Button onClick={validateData} disabled={!requiredFieldsMapped}>
                Validar Datos
              </Button>
            </div>
          </TabsContent>

          {/* Step 3: Validate */}
          <TabsContent value="validate" className="space-y-4">
            {importing && (
              <Alert>
                <FileSpreadsheet className="h-4 w-4 animate-pulse" />
                <AlertTitle>Importando Datos...</AlertTitle>
                <AlertDescription>
                  Por favor espera mientras se importan los registros. Las empresas sin coordenadas se están geolocalizando automáticamente.
                </AlertDescription>
              </Alert>
            )}
            {importing && (
              <div className="space-y-2">
                <Progress value={importProgress} className="w-full" />
                <p className="text-center text-sm text-muted-foreground">
                  {Math.round(importProgress)}% completado
                </p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertTitle>Registros Válidos</AlertTitle>
                <AlertDescription className="text-2xl font-bold">
                  {excelData.length - validationErrors.length - duplicates.length}
                </AlertDescription>
              </Alert>

              <Alert variant={validationErrors.length > 0 ? 'destructive' : 'default'}>
                <XCircle className="h-4 w-4" />
                <AlertTitle>Errores</AlertTitle>
                <AlertDescription className="text-2xl font-bold">
                  {validationErrors.length}
                </AlertDescription>
              </Alert>

              <Alert variant={duplicates.length > 0 ? 'destructive' : 'default'}>
                <Users className="h-4 w-4" />
                <AlertTitle>Duplicados</AlertTitle>
                <AlertDescription className="text-2xl font-bold">
                  {duplicates.length}
                </AlertDescription>
              </Alert>
            </div>

            <Tabs defaultValue="errors" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="errors">
                  Errores ({validationErrors.length})
                </TabsTrigger>
                <TabsTrigger value="duplicates">
                  Duplicados ({duplicates.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="errors">
                <ScrollArea className="h-[300px] border rounded-lg">
                  {validationErrors.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center p-8">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                        <p>No se encontraron errores de validación</p>
                      </div>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fila</TableHead>
                          <TableHead>Campo</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationErrors.map((error, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Badge variant="destructive">{error.row}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{error.field}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {String(error.value).substring(0, 30)}
                            </TableCell>
                            <TableCell className="text-sm text-destructive">
                              {error.error}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="duplicates">
                <ScrollArea className="h-[300px] border rounded-lg">
                  {duplicates.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center p-8">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                        <p>No se encontraron duplicados</p>
                      </div>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fila</TableHead>
                          <TableHead>Empresa Existente</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Similitud</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {duplicates.map((dup, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Badge variant="destructive">{dup.row}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {dup.existingCompany}
                            </TableCell>
                            <TableCell>
                              <Badge variant={dup.matchType === 'nif' ? 'default' : 'secondary'}>
                                {dup.matchType === 'nif' ? 'NIF Exacto' : 'Nombre Similar'}
                              </Badge>
                            </TableCell>
                            <TableCell>{dup.similarity}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('map')} disabled={importing}>
                Atrás
              </Button>
              <Button
                onClick={performImport}
                disabled={importing || validationErrors.length > 0 || excelData.length === duplicates.length}
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando... {Math.round(importProgress)}%
                  </>
                ) : (
                  <>
                    Iniciar Importación ({excelData.length - validationErrors.length - duplicates.length}{' '}
                    registros)
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Step 4: Import */}
          <TabsContent value="import" className="space-y-4">
            {importing ? (
              <div className="space-y-4">
                <Alert>
                  <FileSpreadsheet className="h-4 w-4 animate-pulse" />
                  <AlertTitle>Importando Datos...</AlertTitle>
                  <AlertDescription>
                    Por favor espera mientras se importan los registros
                  </AlertDescription>
                </Alert>
                <Progress value={importProgress} className="w-full" />
                <p className="text-center text-sm text-muted-foreground">
                  {Math.round(importProgress)}% completado
                </p>
              </div>
            ) : (
              importResult && (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertTitle>Importación Completada</AlertTitle>
                    <AlertDescription>
                      El proceso de importación ha finalizado correctamente
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="border rounded-lg p-4 text-center">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p className="text-2xl font-bold text-green-500">{importResult.success}</p>
                      <p className="text-sm text-muted-foreground">Exitosas</p>
                    </div>

                    <div className="border rounded-lg p-4 text-center">
                      <XCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                      <p className="text-2xl font-bold text-red-500">{importResult.errors}</p>
                      <p className="text-sm text-muted-foreground">Errores</p>
                    </div>

                    <div className="border rounded-lg p-4 text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                      <p className="text-2xl font-bold text-orange-500">
                        {importResult.duplicates}
                      </p>
                      <p className="text-sm text-muted-foreground">Duplicados</p>
                    </div>

                    <div className="border rounded-lg p-4 text-center">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                      <p className="text-2xl font-bold text-yellow-500">{importResult.skipped}</p>
                      <p className="text-sm text-muted-foreground">Omitidos</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setShowDeleteLastDialog(true)}
                      variant="destructive"
                      disabled={!currentBatchId}
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar Última Importación
                    </Button>
                    <Button onClick={handleClose} className="flex-1">
                      Cerrar
                    </Button>
                  </div>
                </div>
              )
            )}
          </TabsContent>
        </Tabs>
        
        {/* Botón de borrado masivo en el footer */}
        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <Button 
            onClick={() => setShowDeleteDialog(true)}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar Todas las Empresas
          </Button>
        </div>
      </DialogContent>
      
      {/* Dialog para confirmar borrado masivo */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              ¿Eliminar todas las empresas?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará TODAS las empresas de la base de datos de forma permanente. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAll}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Sí, eliminar todas'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para confirmar borrado de última importación */}
      <AlertDialog open={showDeleteLastDialog} onOpenChange={setShowDeleteLastDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              ¿Eliminar última importación?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará todas las empresas importadas en la última sesión de importación.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteLastImport}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Sí, eliminar importación'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
