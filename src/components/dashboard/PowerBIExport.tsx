import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface DataSet {
  id: string;
  label: string;
  data: any[];
}

interface PowerBIExportProps {
  datasets: DataSet[];
  filename?: string;
}

export function PowerBIExport({ datasets, filename = 'powerbi-export' }: PowerBIExportProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>(datasets.map(d => d.id));

  const toggleDataset = (id: string) => {
    setSelectedDatasets(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const exportToPowerBI = async () => {
    if (selectedDatasets.length === 0) {
      toast.error('Selecciona almenys un conjunt de dades');
      return;
    }

    setExporting(true);
    try {
      // Create Power BI compatible JSON structure
      const powerBIData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        datasets: selectedDatasets.map(id => {
          const dataset = datasets.find(d => d.id === id);
          if (!dataset) return null;
          
          // Flatten nested objects and ensure all values are Power BI compatible
          const flattenedData = dataset.data.map(row => flattenObject(row));
          
          return {
            name: dataset.label,
            schema: generateSchema(flattenedData[0] || {}),
            rows: flattenedData,
          };
        }).filter(Boolean),
      };

      // Export as JSON for Power BI import
      const jsonBlob = new Blob([JSON.stringify(powerBIData, null, 2)], { type: 'application/json' });
      downloadFile(jsonBlob, `${filename}-powerbi.json`);

      // Also export as CSV for each dataset (Power BI can import CSV directly)
      for (const id of selectedDatasets) {
        const dataset = datasets.find(d => d.id === id);
        if (!dataset || !dataset.data.length) continue;
        
        const flatData = dataset.data.map(row => flattenObject(row));
        const csvContent = convertToCSV(flatData);
        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadFile(csvBlob, `${filename}-${dataset.id}.csv`);
      }

      toast.success('Dades exportades per Power BI correctament');
      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error en exportar les dades');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Power BI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Exportar a Power BI
          </DialogTitle>
          <DialogDescription>
            Selecciona els conjunts de dades a exportar. Es generaran fitxers JSON i CSV compatibles amb Power BI.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Label className="text-sm font-medium">Conjunts de dades:</Label>
          <div className="space-y-3">
            {datasets.map(dataset => (
              <div key={dataset.id} className="flex items-center space-x-3">
                <Checkbox
                  id={dataset.id}
                  checked={selectedDatasets.includes(dataset.id)}
                  onCheckedChange={() => toggleDataset(dataset.id)}
                />
                <Label htmlFor={dataset.id} className="text-sm cursor-pointer flex-1">
                  {dataset.label}
                  <span className="text-muted-foreground ml-2">
                    ({dataset.data.length} registres)
                  </span>
                </Label>
              </div>
            ))}
          </div>

          <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground space-y-1">
            <p><strong>Formats generats:</strong></p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>JSON estructurat per importar a Power BI Desktop</li>
              <li>CSV per cada dataset (importació directa)</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel·lar
          </Button>
          <Button onClick={exportToPowerBI} disabled={exporting || selectedDatasets.length === 0}>
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportant...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}_${key}` : key;
      const value = obj[key];
      
      if (value === null || value === undefined) {
        result[newKey] = null;
      } else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(result, flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        result[newKey] = JSON.stringify(value);
      } else if (value instanceof Date) {
        result[newKey] = value.toISOString();
      } else {
        result[newKey] = value;
      }
    }
  }
  
  return result;
}

function generateSchema(sample: Record<string, any>) {
  const schema: { name: string; type: string }[] = [];
  
  for (const key in sample) {
    const value = sample[key];
    let type = 'string';
    
    if (typeof value === 'number') {
      type = Number.isInteger(value) ? 'integer' : 'number';
    } else if (typeof value === 'boolean') {
      type = 'boolean';
    } else if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
      type = 'datetime';
    }
    
    schema.push({ name: key, type });
  }
  
  return schema;
}

function convertToCSV(data: Record<string, any>[]): string {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
