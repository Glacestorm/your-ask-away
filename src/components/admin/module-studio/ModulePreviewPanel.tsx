/**
 * ModulePreviewPanel - Live Preview Panel for Module Studio
 * Shows real-time preview of module forms, dashboards, and configurations
 */

import { useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Eye,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  Maximize2,
  Minimize2,
  Grid,
  Type,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Settings2,
  User,
  UserCog,
  Users,
  Download,
  RotateCcw,
  Check,
  Layout,
  LayoutDashboard,
  Puzzle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useModulePreview, PreviewMode, ViewAsRole, DeviceType } from '@/hooks/admin/useModulePreview';
import { ModuleFormRenderer } from './ModuleFormRenderer';

interface ModulePreviewPanelProps {
  moduleData: Record<string, unknown> | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

// Preview Mode Icons
const modeIcons: Record<PreviewMode, typeof Eye> = {
  form: Layout,
  dashboard: LayoutDashboard,
  integration: Puzzle,
  mobile: Smartphone,
};

// Device Icons
const deviceIcons: Record<DeviceType, typeof Monitor> = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
};

// Role Icons
const roleIcons: Record<ViewAsRole, typeof User> = {
  admin: UserCog,
  user: User,
  client: Users,
  guest: User,
};

// Settings Panel Component
const PreviewSettings = memo(function PreviewSettings({
  config,
  onToggleGrid,
  onToggleLabels,
  onToggleValidation,
  onZoomChange,
}: {
  config: ReturnType<typeof useModulePreview>['config'];
  onToggleGrid: () => void;
  onToggleLabels: () => void;
  onToggleValidation: () => void;
  onZoomChange: (zoom: number) => void;
}) {
  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center justify-between">
        <Label className="text-xs flex items-center gap-2">
          <Grid className="h-3 w-3" />
          Mostrar Grid
        </Label>
        <Switch checked={config.showGrid} onCheckedChange={onToggleGrid} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs flex items-center gap-2">
          <Type className="h-3 w-3" />
          Mostrar Labels
        </Label>
        <Switch checked={config.showLabels} onCheckedChange={onToggleLabels} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs flex items-center gap-2">
          <AlertCircle className="h-3 w-3" />
          Validación
        </Label>
        <Switch checked={config.showValidation} onCheckedChange={onToggleValidation} />
      </div>
      <Separator />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Zoom: {config.zoom}%</Label>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onZoomChange(config.zoom - 10)}
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onZoomChange(config.zoom + 10)}
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <Slider
          value={[config.zoom]}
          onValueChange={([v]) => onZoomChange(v)}
          min={50}
          max={200}
          step={10}
        />
      </div>
    </div>
  );
});

// Dashboard Preview Component (Simplified)
const DashboardPreview = memo(function DashboardPreview({
  moduleName,
  formValues,
}: {
  moduleName: string;
  formValues: Record<string, unknown>;
}) {
  const enabledFeatures = Object.entries(formValues).filter(([_, v]) => v === true).length;
  
  return (
    <div className="p-4 space-y-4">
      {/* Module Card */}
      <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border">
        <h3 className="font-semibold text-lg">{moduleName}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {enabledFeatures} características activas
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-muted/30 rounded-lg text-center">
          <div className="text-2xl font-bold text-primary">{enabledFeatures}</div>
          <p className="text-xs text-muted-foreground">Activas</p>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-500">
            <Check className="h-6 w-6 mx-auto" />
          </div>
          <p className="text-xs text-muted-foreground">Configurado</p>
        </div>
      </div>
      
      {/* Quick Settings */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Configuración Rápida</h4>
        {Object.entries(formValues).slice(0, 4).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-2 bg-muted/20 rounded">
            <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
            <Badge variant={value ? 'default' : 'outline'}>
              {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
});

// Integration Preview Component
const IntegrationPreview = memo(function IntegrationPreview({
  moduleKey,
  dependencies,
}: {
  moduleKey: string;
  dependencies: string[];
}) {
  return (
    <div className="p-4 space-y-4">
      <div className="text-center p-6 border-2 border-dashed rounded-lg">
        <Puzzle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
        <h3 className="font-medium">Vista de Integración</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Cómo este módulo se conecta con otros
        </p>
      </div>
      
      {dependencies.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Dependencias</h4>
          {dependencies.map(dep => (
            <div key={dep} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">{dep}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-sm text-muted-foreground">
          Este módulo no tiene dependencias
        </div>
      )}
    </div>
  );
});

// Main Component
export function ModulePreviewPanel({
  moduleData,
  isExpanded = false,
  onToggleExpand,
  className,
}: ModulePreviewPanelProps) {
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    previewData,
    config,
    previewState,
    deviceDimensions,
    isRefreshing,
    setMode,
    setViewAs,
    setDevice,
    setZoom,
    toggleShowGrid,
    toggleShowLabels,
    toggleShowValidation,
    setFieldValue,
    toggleSection,
    validateAll,
    resetForm,
    refresh,
    exportFormData,
  } = useModulePreview(moduleData);
  
  // Handle export
  const handleExport = () => {
    const data = exportFormData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${previewData?.moduleKey || 'module'}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Configuración exportada');
  };
  
  // Handle validate
  const handleValidate = () => {
    const isValid = validateAll();
    if (isValid) {
      toast.success('Todos los campos son válidos');
    } else {
      toast.error('Hay errores de validación');
    }
  };
  
  // No module selected state
  if (!moduleData || !previewData) {
    return (
      <Card className={cn('border-dashed opacity-60', className)}>
        <CardContent className="py-8 text-center">
          <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Selecciona un módulo para ver el preview
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const ModeIcon = modeIcons[config.mode];
  const DeviceIcon = deviceIcons[config.device];
  
  return (
    <Card className={cn(
      'transition-all duration-300 flex flex-col overflow-hidden',
      isExpanded ? 'fixed inset-4 z-50 shadow-2xl' : '',
      className
    )}>
      {/* Header */}
      <CardHeader className="pb-2 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Live Preview</CardTitle>
              <p className="text-xs text-muted-foreground">
                {previewData.moduleName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {previewState.isDirty && (
              <Badge variant="outline" className="text-xs text-amber-600">
                Modificado
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSettings(!showSettings)}
              title="Configuración"
            >
              <Settings2 className={cn('h-4 w-4', showSettings && 'text-primary')} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={refresh}
              disabled={isRefreshing}
              title="Refrescar"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </Button>
            {onToggleExpand && (
              <Button
                variant={isExpanded ? 'secondary' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={onToggleExpand}
                title={isExpanded ? 'Minimizar' : 'Expandir'}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Controls Bar */}
        <div className="px-3 py-2 border-b bg-muted/30 space-y-2 flex-shrink-0">
          {/* Mode Tabs */}
          <Tabs value={config.mode} onValueChange={v => setMode(v as PreviewMode)}>
            <TabsList className="h-8 w-full grid grid-cols-3">
              <TabsTrigger value="form" className="text-xs h-7 px-2">
                <Layout className="h-3 w-3 mr-1" />
                Form
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="text-xs h-7 px-2">
                <LayoutDashboard className="h-3 w-3 mr-1" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="integration" className="text-xs h-7 px-2">
                <Puzzle className="h-3 w-3 mr-1" />
                Integración
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Secondary Controls - Reorganized */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Device Selector */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              {(['desktop', 'tablet', 'mobile'] as DeviceType[]).map(device => {
                const Icon = deviceIcons[device];
                return (
                  <Button
                    key={device}
                    variant={config.device === device ? 'default' : 'ghost'}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setDevice(device)}
                    title={device}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </Button>
                );
              })}
            </div>
            
            {/* View As Selector */}
            <Select value={config.viewAs} onValueChange={v => setViewAs(v as ViewAsRole)}>
              <SelectTrigger className="w-[100px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">
                  <span className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    Cliente
                  </span>
                </SelectItem>
                <SelectItem value="user">
                  <span className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    Usuario
                  </span>
                </SelectItem>
                <SelectItem value="admin">
                  <span className="flex items-center gap-2">
                    <UserCog className="h-3 w-3" />
                    Admin
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Actions - Flex to end */}
            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={handleValidate}
                title="Validar"
              >
                <Check className="h-3 w-3 mr-1" />
                Validar
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={resetForm}
                title="Resetear"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleExport}
                title="Exportar"
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Settings Panel (Collapsible) */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b overflow-hidden flex-shrink-0"
            >
              <div className="p-3">
                <PreviewSettings
                  config={config}
                  onToggleGrid={toggleShowGrid}
                  onToggleLabels={toggleShowLabels}
                  onToggleValidation={toggleShowValidation}
                  onZoomChange={setZoom}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Preview Content */}
        <div 
          className={cn(
            'flex-1 overflow-hidden flex items-start justify-center p-4 min-h-0',
            config.showGrid && 'bg-[linear-gradient(to_right,hsl(var(--muted)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted)/0.3)_1px,transparent_1px)] bg-[size:20px_20px]'
          )}
        >
          <div
            className={cn(
              'bg-background border rounded-lg shadow-lg overflow-hidden transition-all duration-300',
              config.device === 'mobile' && 'rounded-[2rem]',
              config.device === 'tablet' && 'rounded-xl'
            )}
            style={{
              width: deviceDimensions.width,
              maxWidth: deviceDimensions.maxWidth,
              height: config.device !== 'desktop' ? deviceDimensions.height : 'calc(100% - 2rem)',
              transform: `scale(${config.zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Device Frame Header (for mobile/tablet) */}
            {config.device !== 'desktop' && (
              <div className="h-6 bg-muted flex items-center justify-center">
                <div className="w-16 h-1 bg-muted-foreground/20 rounded-full" />
              </div>
            )}
            
            <ScrollArea className={cn(
              config.device === 'desktop' ? 'h-full' : 'h-[calc(100%-24px)]'
            )}>
              {/* Form Preview */}
              {config.mode === 'form' && previewData.sections && (
                <div className="p-4">
                  <ModuleFormRenderer
                    sections={previewData.sections}
                    previewState={previewState}
                    config={config}
                    onFieldChange={setFieldValue}
                    onToggleSection={toggleSection}
                  />
                </div>
              )}
              
              {/* Dashboard Preview */}
              {config.mode === 'dashboard' && (
                <DashboardPreview
                  moduleName={previewData.moduleName}
                  formValues={previewState.formValues}
                />
              )}
              
              {/* Integration Preview */}
              {config.mode === 'integration' && (
                <IntegrationPreview
                  moduleKey={previewData.moduleKey}
                  dependencies={(moduleData?.dependencies as string[]) || []}
                />
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ModulePreviewPanel;
