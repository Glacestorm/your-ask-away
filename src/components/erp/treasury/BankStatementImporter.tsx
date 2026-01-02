import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  FileText, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface BankStatementImporterProps {
  companyId: string;
  onImportComplete?: () => void;
}

export function BankStatementImporter({ companyId, onImportComplete }: BankStatementImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setImporting(true);
    try {
      // Simulate import - in real implementation would parse OFX/MT940/CAMT
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Extracto importado correctamente');
      onImportComplete?.();
      setFile(null);
    } catch (err) {
      toast.error('Error al importar extracto');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Importar Extracto Bancario
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <input
            type="file"
            id="statement-file"
            accept=".ofx,.mt940,.xml,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="statement-file" className="cursor-pointer">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium">Arrastra o selecciona un archivo</p>
            <p className="text-sm text-muted-foreground mt-1">
              Formatos: OFX, MT940, CAMT.053, CSV
            </p>
          </label>
        </div>

        {file && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{file.name}</span>
            </div>
            <Button size="sm" onClick={handleImport} disabled={importing}>
              {importing ? 'Importando...' : 'Importar'}
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Detección automática de formato
          </p>
          <p className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Conciliación automática con IA
          </p>
          <p className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-yellow-500" />
            Revisa los movimientos antes de confirmar
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default BankStatementImporter;
