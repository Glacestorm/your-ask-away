import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileSpreadsheet } from 'lucide-react';
import { CompanyWithDetails } from '@/types/database';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

const STORAGE_KEY = 'excel-export-field-preferences';

export interface ExcelFieldOptions {
  name: boolean;
  address: boolean;
  parroquia: boolean;
  phone: boolean;
  email: boolean;
  website: boolean;
  sector: boolean;
  cnae: boolean;
  taxId: boolean;
  status: boolean;
  gestor: boolean;
  oficina: boolean;
  clientType: boolean;
  turnover: boolean;
  vinculacionCreand: boolean;
  vinculacionMorabanc: boolean;
  vinculacionAndbank: boolean;
  plBanco: boolean;
  beneficios: boolean;
  bp: boolean;
  employees: boolean;
  ultimaVisita: boolean;
  observaciones: boolean;
}

const defaultFields: ExcelFieldOptions = {
  name: true,
  address: true,
  parroquia: true,
  phone: true,
  email: true,
  website: false,
  sector: true,
  cnae: true,
  taxId: true,
  status: true,
  gestor: true,
  oficina: true,
  clientType: true,
  turnover: true,
  vinculacionCreand: true,
  vinculacionMorabanc: true,
  vinculacionAndbank: true,
  plBanco: true,
  beneficios: true,
  bp: false,
  employees: true,
  ultimaVisita: true,
  observaciones: false,
};

const loadFieldsFromStorage = (): ExcelFieldOptions => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultFields, ...parsed };
    }
  } catch (e) {
    console.error('Error loading Excel preferences:', e);
  }
  return defaultFields;
};

const saveFieldsToStorage = (fields: ExcelFieldOptions) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
  } catch (e) {
    console.error('Error saving Excel preferences:', e);
  }
};

interface ExcelExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: CompanyWithDetails[];
}

export function ExcelExportDialog({ open, onOpenChange, companies }: ExcelExportDialogProps) {
  const [fields, setFields] = useState<ExcelFieldOptions>(() => loadFieldsFromStorage());

  useEffect(() => {
    saveFieldsToStorage(fields);
  }, [fields]);

  const toggleField = (field: keyof ExcelFieldOptions) => {
    setFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const selectAll = () => {
    const allTrue = Object.keys(defaultFields).reduce((acc, key) => ({ ...acc, [key]: true }), {} as ExcelFieldOptions);
    setFields(allTrue);
  };

  const deselectAll = () => {
    const allFalse = Object.keys(defaultFields).reduce((acc, key) => ({ ...acc, [key]: false }), {} as ExcelFieldOptions);
    setFields(allFalse);
  };

  const handleExport = () => {
    const exportData = companies.map(company => {
      const row: Record<string, string | number> = {};
      
      if (fields.name) row['Nombre'] = company.name;
      if (fields.address) row['Dirección'] = company.address;
      if (fields.parroquia) row['Parroquia'] = company.parroquia;
      if (fields.phone) row['Teléfono'] = company.phone || '';
      if (fields.email) row['Email'] = company.email || '';
      if (fields.website) row['Web'] = company.website || '';
      if (fields.sector) row['Sector'] = company.sector || '';
      if (fields.cnae) row['CNAE'] = company.cnae || '';
      if (fields.taxId) row['CIF/NIF'] = company.tax_id || '';
      if (fields.status) row['Estado'] = company.status?.status_name || '';
      if (fields.gestor) row['Gestor'] = company.gestor?.full_name || '';
      if (fields.oficina) row['Oficina'] = company.oficina || '';
      if (fields.clientType) row['Tipo Cliente'] = company.client_type || '';
      if (fields.turnover) row['Facturación'] = company.turnover || '';
      if (fields.vinculacionCreand) row['Vinculación Creand (%)'] = company.vinculacion_entidad_1 || 0;
      if (fields.vinculacionMorabanc) row['Vinculación Morabanc (%)'] = company.vinculacion_entidad_2 || 0;
      if (fields.vinculacionAndbank) row['Vinculación Andbank (%)'] = company.vinculacion_entidad_3 || 0;
      if (fields.plBanco) row['P&L Banco'] = company.pl_banco || '';
      if (fields.beneficios) row['Beneficios'] = company.beneficios || '';
      if (fields.bp) row['BP'] = company.bp || '';
      if (fields.employees) row['Empleados'] = company.employees || '';
      if (fields.ultimaVisita) row['Última Visita'] = company.fecha_ultima_visita ? format(new Date(company.fecha_ultima_visita), 'dd/MM/yyyy') : '';
      if (fields.observaciones) row['Observaciones'] = company.observaciones || '';
      
      return row;
    });

    if (exportData.length === 0 || Object.keys(exportData[0]).length === 0) {
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Empresas');
    
    const maxWidth = 50;
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.min(Math.max(key.length, ...exportData.map(row => String(row[key as keyof typeof row] || '').length)), maxWidth)
    }));
    worksheet['!cols'] = colWidths;
    
    XLSX.writeFile(workbook, `empresas_filtradas_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    onOpenChange(false);
  };

  const FieldCheckbox = ({ field, label }: { field: keyof ExcelFieldOptions; label: string }) => (
    <div className="flex items-center space-x-2">
      <Checkbox 
        id={`excel-${field}`} 
        checked={fields[field]} 
        onCheckedChange={() => toggleField(field)}
      />
      <Label htmlFor={`excel-${field}`} className="text-sm cursor-pointer">{label}</Label>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Exportación Excel</DialogTitle>
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
                <FieldCheckbox field="name" label="Nombre" />
                <FieldCheckbox field="address" label="Dirección" />
                <FieldCheckbox field="parroquia" label="Parroquia" />
                <FieldCheckbox field="phone" label="Teléfono" />
                <FieldCheckbox field="email" label="Email" />
                <FieldCheckbox field="website" label="Web" />
                <FieldCheckbox field="sector" label="Sector" />
                <FieldCheckbox field="cnae" label="CNAE" />
                <FieldCheckbox field="taxId" label="CIF/NIF" />
                <FieldCheckbox field="status" label="Estado" />
                <FieldCheckbox field="clientType" label="Tipo Cliente" />
                <FieldCheckbox field="employees" label="Empleados" />
              </div>
            </div>

            <Separator />

            {/* Assignment */}
            <div>
              <h4 className="font-medium text-sm mb-2 text-muted-foreground">Asignación</h4>
              <div className="grid grid-cols-2 gap-2">
                <FieldCheckbox field="gestor" label="Gestor" />
                <FieldCheckbox field="oficina" label="Oficina" />
              </div>
            </div>

            <Separator />

            {/* Financial */}
            <div>
              <h4 className="font-medium text-sm mb-2 text-muted-foreground">Información Financiera</h4>
              <div className="grid grid-cols-2 gap-2">
                <FieldCheckbox field="turnover" label="Facturación" />
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
                <FieldCheckbox field="ultimaVisita" label="Última Visita" />
                <FieldCheckbox field="observaciones" label="Observaciones" />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleExport} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
