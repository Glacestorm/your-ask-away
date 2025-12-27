/**
 * ModuleExportImportPanel - Exportación e importación de módulos
 * Drag & drop, validación, opciones de formato
 */

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw, 
  Upload,
  Download,
  FileJson,
  FileCode,
  FolderArchive,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Shield
} from 'lucide-react';
import { useModuleExportImport, ExportOptions } from '@/hooks/admin/useModuleExportImport';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ModuleExportImportPanelProps {
  moduleKey?: string;
  className?: string;
}

export function ModuleExportImportPanel({ moduleKey, className }: ModuleExportImportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeAssets: true,
    includeConfigs: true,
    includeVersions: false,
    encryptSensitiveData: true
  });
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    moduleName?: string;
    warnings: string[];
    errors: string[];
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    isExporting,
    isImporting,
    isValidating,
    exportProgress,
    importProgress,
    lastExport,
    exportModule,
    validateImport,
    importModule,
    triggerDownload
  } = useModuleExportImport();

  const handleExport = async () => {
    if (!moduleKey) return;
    const result = await exportModule(moduleKey, exportOptions);
    if (result) {
      triggerDownload(result);
    }
  };

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    const result = await validateImport(file);
    setValidationResult(result);
  }, [validateImport]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.json') || file.name.endsWith('.yaml') || file.name.endsWith('.zip'))) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleImport = async () => {
    if (!selectedFile || !validationResult?.isValid) return;
    await importModule(selectedFile, true);
    setSelectedFile(null);
    setValidationResult(null);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'json': return <FileJson className="h-4 w-4" />;
      case 'yaml': return <FileCode className="h-4 w-4" />;
      case 'zip': return <FolderArchive className="h-4 w-4" />;
      default: return <FileJson className="h-4 w-4" />;
    }
  };

  if (!moduleKey) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-12 text-center">
          <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona un módulo para exportar/importar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Download className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-base">Exportar / Importar</CardTitle>
            <CardDescription className="text-xs">
              Transfiere módulos entre proyectos
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-6">
        {/* Export Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Download className="h-4 w-4" /> Exportar Módulo
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Formato</Label>
              <Select
                value={exportOptions.format}
                onValueChange={(v: 'json' | 'yaml' | 'zip') => 
                  setExportOptions(prev => ({ ...prev, format: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">
                    <span className="flex items-center gap-2">
                      <FileJson className="h-4 w-4" /> JSON
                    </span>
                  </SelectItem>
                  <SelectItem value="yaml">
                    <span className="flex items-center gap-2">
                      <FileCode className="h-4 w-4" /> YAML
                    </span>
                  </SelectItem>
                  <SelectItem value="zip">
                    <span className="flex items-center gap-2">
                      <FolderArchive className="h-4 w-4" /> ZIP (con assets)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Incluir configuraciones</Label>
              <Switch
                checked={exportOptions.includeConfigs}
                onCheckedChange={(v) => setExportOptions(prev => ({ ...prev, includeConfigs: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Incluir assets</Label>
              <Switch
                checked={exportOptions.includeAssets}
                onCheckedChange={(v) => setExportOptions(prev => ({ ...prev, includeAssets: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Incluir historial de versiones</Label>
              <Switch
                checked={exportOptions.includeVersions}
                onCheckedChange={(v) => setExportOptions(prev => ({ ...prev, includeVersions: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-1">
                <Shield className="h-3 w-3" /> Encriptar datos sensibles
              </Label>
              <Switch
                checked={exportOptions.encryptSensitiveData}
                onCheckedChange={(v) => setExportOptions(prev => ({ ...prev, encryptSensitiveData: v }))}
              />
            </div>
          </div>

          {isExporting && (
            <div className="space-y-1">
              <Progress value={exportProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">Exportando... {exportProgress}%</p>
            </div>
          )}

          <Button onClick={handleExport} disabled={isExporting} className="w-full gap-2">
            {isExporting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {getFormatIcon(exportOptions.format)}
                Exportar como {exportOptions.format.toUpperCase()}
              </>
            )}
          </Button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">o</span>
          </div>
        </div>

        {/* Import Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Upload className="h-4 w-4" /> Importar Módulo
          </h4>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.yaml,.yml,.zip"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />

          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer",
              isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={cn(
              "h-8 w-8 mx-auto mb-2 transition-colors",
              isDragOver ? "text-primary" : "text-muted-foreground"
            )} />
            <p className="text-sm font-medium">
              {isDragOver ? 'Suelta el archivo aquí' : 'Arrastra un archivo o haz clic'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Soporta .json, .yaml, .zip
            </p>
          </div>

          {/* Validation Results */}
          <AnimatePresence>
            {validationResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div className={cn(
                  "p-3 rounded-lg border",
                  validationResult.isValid 
                    ? "bg-green-500/10 border-green-500/30" 
                    : "bg-red-500/10 border-red-500/30"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {validationResult.isValid ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Archivo válido</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-600">Archivo inválido</span>
                      </>
                    )}
                  </div>
                  
                  {validationResult.moduleName && (
                    <p className="text-xs">
                      Módulo: <span className="font-medium">{validationResult.moduleName}</span>
                    </p>
                  )}
                </div>

                {validationResult.warnings.length > 0 && (
                  <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                    <span className="text-xs font-medium text-yellow-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Advertencias
                    </span>
                    <ul className="text-xs text-yellow-600/80 mt-1">
                      {validationResult.warnings.map((w, i) => <li key={i}>• {w}</li>)}
                    </ul>
                  </div>
                )}

                {validationResult.errors.length > 0 && (
                  <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                    <span className="text-xs font-medium text-red-600 flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> Errores
                    </span>
                    <ul className="text-xs text-red-600/80 mt-1">
                      {validationResult.errors.map((e, i) => <li key={i}>• {e}</li>)}
                    </ul>
                  </div>
                )}

                {isImporting && (
                  <div className="space-y-1">
                    <Progress value={importProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">Importando... {importProgress}%</p>
                  </div>
                )}

                {validationResult.isValid && (
                  <Button 
                    onClick={handleImport} 
                    disabled={isImporting}
                    className="w-full gap-2"
                  >
                    {isImporting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-4 w-4" /> Importar Módulo
                      </>
                    )}
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

export default ModuleExportImportPanel;
