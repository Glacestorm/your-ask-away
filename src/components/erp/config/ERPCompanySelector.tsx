/**
 * Selector de empresa para ERP multi-tenant
 */

import React from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { cn } from '@/lib/utils';

interface ERPCompanySelectorProps {
  className?: string;
}

export function ERPCompanySelector({ className }: ERPCompanySelectorProps) {
  const { companies, currentCompany, setCurrentCompany, isLoading } = useERPContext();

  if (isLoading) {
    return (
      <Button variant="outline" disabled className={cn("gap-2", className)}>
        <Building2 className="h-4 w-4" />
        Cargando...
      </Button>
    );
  }

  if (companies.length === 0) {
    return (
      <Button variant="outline" disabled className={cn("gap-2", className)}>
        <Building2 className="h-4 w-4" />
        Sin empresas
      </Button>
    );
  }

  if (companies.length === 1) {
    return (
      <Button variant="outline" className={cn("gap-2 cursor-default", className)}>
        <Building2 className="h-4 w-4" />
        {currentCompany?.name || 'Empresa'}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn("gap-2", className)}>
          <Building2 className="h-4 w-4" />
          <span className="max-w-[150px] truncate">
            {currentCompany?.name || 'Seleccionar empresa'}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        <DropdownMenuLabel>Cambiar empresa</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => setCurrentCompany(company)}
            className="gap-2 cursor-pointer"
          >
            <Building2 className="h-4 w-4" />
            <span className="flex-1 truncate">{company.name}</span>
            {currentCompany?.id === company.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ERPCompanySelector;
