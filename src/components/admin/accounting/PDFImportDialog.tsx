import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileUp, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface PDFImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statementId: string;
  companyName: string;
  fiscalYear: number;
  onImportComplete: () => void;
}

interface MappedField {
  field: string;
  label: string;
  value: number;
  confidence: number;
}

const PDFImportDialog = ({ 
  open, 
  onOpenChange, 
  statementId, 
  companyName, 
  fiscalYear,
  onImportComplete 
}: PDFImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mappedFields, setMappedFields] = useState<MappedField[]>([]);
  const [step, setStep] = useState<'upload' | 'parsing' | 'review' | 'importing'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Si us plau, selecciona un fitxer PDF');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStep('parsing');
    setProgress(10);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Content = await base64Promise;

      setProgress(30);

      const { data, error } = await supabase.functions.invoke('parse-financial-pdf', {
        body: { pdfContent: base64Content, companyName, fiscalYear, statementId }
      });

      setProgress(70);

      if (error) throw error;

      if (data.mappedFields && data.mappedFields.length > 0) {
        setMappedFields(data.mappedFields);
        setStep('review');
        setProgress(100);
      } else {
        toast.error('No s\'han pogut extreure dades del PDF');
        setStep('upload');
      }
    } catch (error) {
      console.error('Error parsing PDF:', error);
      toast.error('Error processant el PDF');
      setStep('upload');
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    setStep('importing');
    setProgress(0);

    try {
      const balanceSheetFields: Record<string, number> = {};
      const incomeStatementFields: Record<string, number> = {};

      mappedFields.forEach(field => {
        if (field.field.startsWith('balance_')) {
          balanceSheetFields[field.field.replace('balance_', '')] = field.value;
        } else if (field.field.startsWith('income_')) {
          incomeStatementFields[field.field.replace('income_', '')] = field.value;
        }
      });

      setProgress(30);

      if (Object.keys(balanceSheetFields).length > 0) {
        const { error: balanceError } = await supabase
          .from('balance_sheets')
          .update(balanceSheetFields)
          .eq('statement_id', statementId);
        
        if (balanceError) throw balanceError;
      }

      setProgress(60);

      if (Object.keys(incomeStatementFields).length > 0) {
        const { error: incomeError } = await supabase
          .from('income_statements')
          .update(incomeStatementFields)
          .eq('statement_id', statementId);
        
        if (incomeError) throw incomeError;
      }

      await supabase
        .from('company_financial_statements')
        .update({ source: 'pdf_import' })
        .eq('id', statementId);

      setProgress(100);
      toast.success(`${mappedFields.length} camps importats correctament!`);
      onImportComplete();
      handleClose();
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Error important les dades');
      setStep('review');
    }
  };

  const handleClose = () => {
    setFile(null);
    setStep('upload');
    setProgress(0);
    setMappedFields([]);
    onOpenChange(false);
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge className="bg-green-500">Alta ({Math.round(confidence * 100)}%)</Badge>;
    } else if (confidence >= 0.5) {
      return <Badge className="bg-amber-500">Mitjana ({Math.round(confidence * 100)}%)</Badge>;
    } else {
      return <Badge className="bg-red-500">Baixa ({Math.round(confidence * 100)}%)</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5" />
            Importar Estats Financers des de PDF
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {step === 'upload' && (
            <div className="space-y-4">
              <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}>
                <CardContent className="p-8 text-center">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">
                    {file ? file.name : 'Selecciona un fitxer PDF'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Puja els comptes anuals en format PDF per extreure automàticament les dades.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>Cancel·lar</Button>
                <Button onClick={handleUpload} disabled={!file || uploading}>
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processant...</>
                  ) : (
                    <><FileUp className="w-4 h-4 mr-2" /> Analitzar PDF</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 'parsing' && (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                <h3 className="font-semibold mb-2">Analitzant el document...</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Estem extraient les dades del PDF mitjançant intel·ligència artificial.
                </p>
                <Progress value={progress} className="w-full" />
              </CardContent>
            </Card>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">S'han trobat {mappedFields.length} camps</span>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {mappedFields.map((field, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{field.label}</p>
                        <p className="text-xs text-muted-foreground">{field.field}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">{formatCurrency(field.value)}</span>
                        {getConfidenceBadge(field.confidence)}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">Revisa les dades</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Abans d'importar, comprova que els valors extrets són correctes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep('upload')}>Tornar</Button>
                <Button onClick={handleImport}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Importar {mappedFields.length} Camps
                </Button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                <h3 className="font-semibold mb-2">Important dades...</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Guardant les dades als estats financers.
                </p>
                <Progress value={progress} className="w-full" />
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFImportDialog;
