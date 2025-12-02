import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileDown } from 'lucide-react';
import { CompanyWithDetails } from '@/types/database';
import { exportCompaniesToPDF, PDFFieldOptions } from './CompanyPrintReport';

const defaultFields: PDFFieldOptions = {
  parroquia: true,
  sector: true,
  cnae: true,
  taxId: true,
  clientType: true,
  employees: true,
  phone: true,
  email: true,
  website: false,
  facturacion: true,
  periodoFacturacion: false,
  ingresosCreand: true,
  plBanco: true,
  beneficios: true,
  bp: false,
  vinculacionCreand: true,
  vinculacionMorabanc: true,
  vinculacionAndbank: true,
  gestor: true,
  ultimaVisita: true,
  observaciones: true,
  productos: true,
  status: true,
};

interface PDFExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: CompanyWithDetails[];
  title: string;
}

export function PDFExportDialog({ open, onOpenChange, companies, title }: PDFExportDialogProps) {
  const [fields, setFields] = useState<PDFFieldOptions>(defaultFields);

  const toggleField = (field: keyof PDFFieldOptions) => {
    setFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const selectAll = () => {
    const allTrue = Object.keys(fields).reduce((acc, key) => ({ ...acc, [key]: true }), {} as PDFFieldOptions);
    setFields(allTrue);
  };

  const deselectAll = () => {
    const allFalse = Object.keys(fields).reduce((acc, key) => ({ ...acc, [key]: false }), {} as PDFFieldOptions);
    setFields(allFalse);
  };

  const handleExport = () => {
    exportCompaniesToPDF(companies, title, fields);
    onOpenChange(false);
  };

  const FieldCheckbox = ({ field, label }: { field: keyof PDFFieldOptions; label: string }) => (
    <div className="flex items-center space-x-2">
      <Checkbox 
        id={field} 
        checked={fields[field]} 
        onCheckedChange={() => toggleField(field)}
      />
      <Label htmlFor={field} className="text-sm cursor-pointer">{label}</Label>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Exportación PDF</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-2 mb-2">
          <Button variant="outline" size="sm" onClick={selectAll}>Seleccionar todo</Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>Deseleccionar todo</Button>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {/* Basic Info */}
            <div>
              <h4 className="font-medium text-sm mb-2 text-muted-foreground">Información Básica</h4>
              <div className="grid grid-cols-2 gap-2">
                <FieldCheckbox field="parroquia" label="Parroquia" />
                <FieldCheckbox field="sector" label="Sector" />
                <FieldCheckbox field="cnae" label="CNAE" />
                <FieldCheckbox field="taxId" label="CIF/NIF" />
                <FieldCheckbox field="clientType" label="Tipo Cliente" />
                <FieldCheckbox field="employees" label="Empleados" />
                <FieldCheckbox field="phone" label="Teléfono" />
                <FieldCheckbox field="email" label="Email" />
                <FieldCheckbox field="website" label="Web" />
                <FieldCheckbox field="status" label="Estado" />
              </div>
            </div>

            <Separator />

            {/* Financial */}
            <div>
              <h4 className="font-medium text-sm mb-2 text-muted-foreground">Información Financiera</h4>
              <div className="grid grid-cols-2 gap-2">
                <FieldCheckbox field="facturacion" label="Facturación" />
                <FieldCheckbox field="periodoFacturacion" label="Período Fact." />
                <FieldCheckbox field="ingresosCreand" label="Ingresos Creand" />
                <FieldCheckbox field="plBanco" label="P&L Banco" />
                <FieldCheckbox field="beneficios" label="Beneficios" />
                <FieldCheckbox field="bp" label="BP" />
              </div>
            </div>

            <Separator />

            {/* Vinculación */}
            <div>
              <h4 className="font-medium text-sm mb-2 text-muted-foreground">Vinculación Bancaria</h4>
              <div className="grid grid-cols-2 gap-2">
                <FieldCheckbox field="vinculacionCreand" label="Vinc. Creand" />
                <FieldCheckbox field="vinculacionMorabanc" label="Vinc. Morabanc" />
                <FieldCheckbox field="vinculacionAndbank" label="Vinc. Andbank" />
              </div>
            </div>

            <Separator />

            {/* Other */}
            <div>
              <h4 className="font-medium text-sm mb-2 text-muted-foreground">Otros Datos</h4>
              <div className="grid grid-cols-2 gap-2">
                <FieldCheckbox field="gestor" label="Gestor" />
                <FieldCheckbox field="ultimaVisita" label="Última Visita" />
                <FieldCheckbox field="observaciones" label="Observaciones" />
                <FieldCheckbox field="productos" label="Productos" />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleExport} className="gap-2">
            <FileDown className="h-4 w-4" />
            Exportar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}