import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { 
  Upload, 
  Download, 
  Scan, 
  FileJson, 
  FileSpreadsheet, 
  FileCode, 
  FileText,
  MoreVertical,
  Building2
} from 'lucide-react';
import { UniversalImportExportPanel } from './UniversalImportExportPanel';
import { ERPModule, ExportFormat, ImportResult } from '@/hooks/erp/useERPImportExport';

interface ImportExportToolbarProps {
  module: ERPModule;
  exportData?: Record<string, unknown>;
  onImportComplete?: (data: ImportResult) => void;
  onExportComplete?: (data: unknown) => void;
  variant?: 'full' | 'compact' | 'icon-only';
  showOCR?: boolean;
  className?: string;
}

export function ImportExportToolbar({
  module,
  exportData,
  onImportComplete,
  onExportComplete,
  variant = 'compact',
  showOCR = true,
  className
}: ImportExportToolbarProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [defaultTab, setDefaultTab] = useState<'import' | 'export' | 'ocr'>('import');

  const handleOpenImport = () => {
    setDefaultTab('import');
    setShowImportDialog(true);
  };

  const handleOpenOCR = () => {
    setDefaultTab('ocr');
    setShowImportDialog(true);
  };

  const handleOpenExport = () => {
    setShowExportDialog(true);
  };

  if (variant === 'icon-only') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={className}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleOpenImport}>
            <Upload className="h-4 w-4 mr-2" />
            Importar datos
          </DropdownMenuItem>
          {showOCR && (
            <DropdownMenuItem onClick={handleOpenOCR}>
              <Scan className="h-4 w-4 mr-2" />
              Escanear documento (OCR)
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleOpenExport} disabled={!exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar datos
          </DropdownMenuItem>
        </DropdownMenuContent>

        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Importar / OCR</DialogTitle>
            </DialogHeader>
            <UniversalImportExportPanel 
              module={module}
              onImportComplete={(data) => {
                onImportComplete?.(data);
                setShowImportDialog(false);
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Exportar datos</DialogTitle>
            </DialogHeader>
            <UniversalImportExportPanel 
              module={module}
              exportData={exportData}
              onExportComplete={(data) => {
                onExportComplete?.(data);
                setShowExportDialog(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </DropdownMenu>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={handleOpenImport}>
              <Upload className="h-4 w-4 mr-1" />
              Importar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Importar datos</DialogTitle>
            </DialogHeader>
            <UniversalImportExportPanel 
              module={module}
              onImportComplete={(data) => {
                onImportComplete?.(data);
                setShowImportDialog(false);
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={!exportData}>
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Exportar datos</DialogTitle>
            </DialogHeader>
            <UniversalImportExportPanel 
              module={module}
              exportData={exportData}
              onExportComplete={(data) => {
                onExportComplete?.(data);
                setShowExportDialog(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Full variant
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" onClick={handleOpenImport}>
            <Upload className="h-4 w-4 mr-2" />
            Importar datos
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar datos</DialogTitle>
          </DialogHeader>
          <UniversalImportExportPanel 
            module={module}
            onImportComplete={(data) => {
              onImportComplete?.(data);
              setShowImportDialog(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {showOCR && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={handleOpenOCR}>
              <Scan className="h-4 w-4 mr-2" />
              Escanear OCR
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>OCR Inteligente</DialogTitle>
            </DialogHeader>
            <UniversalImportExportPanel 
              module={module}
              onImportComplete={(data) => {
                onImportComplete?.(data);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled={!exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Exportar datos</DialogTitle>
          </DialogHeader>
          <UniversalImportExportPanel 
            module={module}
            exportData={exportData}
            onExportComplete={(data) => {
              onExportComplete?.(data);
              setShowExportDialog(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ImportExportToolbar;
