import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { CompanyWithDetails } from '@/types/database';

interface CompanyDataCompletenessProps {
  company: CompanyWithDetails;
  showDetails?: boolean;
}

interface FieldCheck {
  name: string;
  field: string;
  weight: number;
  required: boolean;
}

const FIELD_CHECKS: FieldCheck[] = [
  { name: 'Nombre', field: 'name', weight: 10, required: true },
  { name: 'Direccion', field: 'address', weight: 10, required: true },
  { name: 'Parroquia', field: 'parroquia', weight: 5, required: true },
  { name: 'Telefono', field: 'phone', weight: 8, required: false },
  { name: 'Email', field: 'email', weight: 7, required: false },
  { name: 'NRT/CIF', field: 'tax_id', weight: 8, required: false },
  { name: 'BP', field: 'bp', weight: 6, required: false },
  { name: 'CNAE', field: 'cnae', weight: 5, required: false },
  { name: 'Sector', field: 'sector', weight: 4, required: false },
  { name: 'Empleados', field: 'employees', weight: 4, required: false },
  { name: 'Facturacion', field: 'turnover', weight: 5, required: false },
  { name: 'Gestor Asignado', field: 'gestor_id', weight: 7, required: false },
  { name: 'Estado', field: 'status_id', weight: 6, required: false },
  { name: 'Tipo Cliente', field: 'client_type', weight: 5, required: false },
  { name: 'Geolocalizacion', field: 'latitude', weight: 5, required: false },
  { name: 'Vinculacion', field: 'vinculacion_entidad_1', weight: 5, required: false },
];

export function CompanyDataCompleteness({ company, showDetails = false }: CompanyDataCompletenessProps) {
  const { completeness, filledFields, missingFields } = useMemo(() => {
    let totalWeight = 0;
    let filledWeight = 0;
    const filled: string[] = [];
    const missing: string[] = [];

    FIELD_CHECKS.forEach(check => {
      totalWeight += check.weight;
      const value = (company as any)[check.field];
      const isFilled = value !== null && value !== undefined && value !== '' && value !== 0;
      
      if (isFilled) {
        filledWeight += check.weight;
        filled.push(check.name);
      } else {
        missing.push(check.name);
      }
    });

    return {
      completeness: Math.round((filledWeight / totalWeight) * 100),
      filledFields: filled,
      missingFields: missing,
    };
  }, [company]);

  const getColor = (value: number) => {
    if (value >= 80) return 'text-green-500';
    if (value >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getIcon = (value: number) => {
    if (value >= 80) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (value >= 50) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              {getIcon(completeness)}
              <span className={`text-xs font-medium ${getColor(completeness)}`}>
                {completeness}%
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold">Completitud de datos: {completeness}%</p>
              {missingFields.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Campos faltantes:</p>
                  <p className="text-xs">{missingFields.join(', ')}</p>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Completitud de datos</span>
        <div className="flex items-center gap-2">
          {getIcon(completeness)}
          <span className={`text-sm font-bold ${getColor(completeness)}`}>
            {completeness}%
          </span>
        </div>
      </div>
      
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`absolute inset-y-0 left-0 ${getProgressColor(completeness)} transition-all duration-300`}
          style={{ width: `${completeness}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="font-medium text-green-600 mb-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Completados ({filledFields.length})
          </p>
          <ul className="space-y-0.5 text-muted-foreground">
            {filledFields.slice(0, 5).map(field => (
              <li key={field}>- {field}</li>
            ))}
            {filledFields.length > 5 && (
              <li className="text-primary">+{filledFields.length - 5} mas...</li>
            )}
          </ul>
        </div>
        <div>
          <p className="font-medium text-red-600 mb-1 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Faltantes ({missingFields.length})
          </p>
          <ul className="space-y-0.5 text-muted-foreground">
            {missingFields.slice(0, 5).map(field => (
              <li key={field}>- {field}</li>
            ))}
            {missingFields.length > 5 && (
              <li className="text-primary">+{missingFields.length - 5} mas...</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
