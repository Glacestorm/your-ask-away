import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileDown, Loader2, CheckCircle, Shield } from 'lucide-react';
import { useSessionExport, ExportOptions } from '@/hooks/admin/useSessionExport';

interface SessionExportButtonProps {
  sessionId: string;
  sessionCode: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function SessionExportButton({ 
  sessionId, 
  sessionCode,
  variant = 'outline',
  size = 'default'
}: SessionExportButtonProps) {
  const { exportToPDF, isExporting } = useSessionExport();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    includeActions: true,
    includeTimestamps: true,
    includeSummary: true
  });

  const handleExport = async () => {
    const success = await exportToPDF(sessionId, options);
    if (success) {
      setDialogOpen(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <FileDown className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Exportar Sesión
          </DialogTitle>
          <DialogDescription>
            Genera un informe PDF verificable de la sesión {sessionCode}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                El PDF incluirá un código de verificación único y hash de integridad
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Opciones de Exportación</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeActions"
                checked={options.includeActions}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, includeActions: checked === true }))
                }
              />
              <Label htmlFor="includeActions" className="text-sm font-normal cursor-pointer">
                Incluir registro de acciones
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeTimestamps"
                checked={options.includeTimestamps}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, includeTimestamps: checked === true }))
                }
              />
              <Label htmlFor="includeTimestamps" className="text-sm font-normal cursor-pointer">
                Incluir marcas de tiempo
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeSummary"
                checked={options.includeSummary}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, includeSummary: checked === true }))
                }
              />
              <Label htmlFor="includeSummary" className="text-sm font-normal cursor-pointer">
                Incluir resumen estadístico
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Descargar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
