/**
 * Chart of Accounts Manager
 * Gestión del Plan General Contable de ObelixIA
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Search, 
  ChevronRight, 
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  FolderTree
} from 'lucide-react';
import { useObelixiaAccounting, ChartAccount } from '@/hooks/admin/obelixia-accounting';
import { cn } from '@/lib/utils';

interface AccountGroup {
  code: string;
  name: string;
  accounts: ChartAccount[];
}

export function ChartOfAccountsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['7', '6', '4']));
  
  const { accounts: chartOfAccounts, isLoading, fetchAccounts } = useObelixiaAccounting();

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Agrupar cuentas por grupo principal (primer dígito)
  const groupedAccounts = chartOfAccounts.reduce((acc, account) => {
    const groupCode = account.account_code.charAt(0);
    if (!acc[groupCode]) {
      acc[groupCode] = [];
    }
    acc[groupCode].push(account);
    return acc;
  }, {} as Record<string, ChartAccount[]>);

  const groupNames: Record<string, string> = {
    '1': 'Financiación Básica',
    '2': 'Inmovilizado',
    '3': 'Existencias',
    '4': 'Acreedores y Deudores',
    '5': 'Cuentas Financieras',
    '6': 'Compras y Gastos',
    '7': 'Ventas e Ingresos',
    '8': 'Gastos en Patrimonio Neto',
    '9': 'Ingresos en Patrimonio Neto'
  };

  const toggleGroup = (groupCode: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupCode)) {
      newExpanded.delete(groupCode);
    } else {
      newExpanded.add(groupCode);
    }
    setExpandedGroups(newExpanded);
  };

  const filteredAccounts = searchTerm
    ? chartOfAccounts.filter(
        acc => 
          acc.account_code.includes(searchTerm) || 
          acc.account_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'asset': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'liability': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'equity': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'income': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'expense': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const translateAccountType = (type: string) => {
    const types: Record<string, string> = {
      'asset': 'Activo',
      'liability': 'Pasivo',
      'equity': 'Patrimonio',
      'income': 'Ingreso',
      'expense': 'Gasto'
    };
    return types[type] || type;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-primary" />
            Plan General Contable
          </CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Nueva Cuenta
          </Button>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          {filteredAccounts ? (
            // Mostrar resultados de búsqueda
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="w-24">Tipo</TableHead>
                  <TableHead className="w-24 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono font-medium">
                      {account.account_code}
                    </TableCell>
                    <TableCell>{account.account_name}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", getAccountTypeColor(account.account_type))}>
                        {translateAccountType(account.account_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            // Mostrar árbol jerárquico
            <div className="space-y-2">
              {Object.entries(groupedAccounts)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([groupCode, accounts]) => (
                  <Collapsible
                    key={groupCode}
                    open={expandedGroups.has(groupCode)}
                    onOpenChange={() => toggleGroup(groupCode)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-10 px-2 hover:bg-muted/50"
                      >
                        {expandedGroups.has(groupCode) ? (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2" />
                        )}
                        <span className="font-mono font-bold mr-2">{groupCode}</span>
                        <span className="font-medium">{groupNames[groupCode]}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {accounts.length}
                        </Badge>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-6">
                      <Table>
                        <TableBody>
                          {accounts
                            .sort((a, b) => a.account_code.localeCompare(b.account_code))
                            .map((account) => (
                              <TableRow key={account.id} className="hover:bg-muted/30">
                                <TableCell className="w-24 font-mono text-sm py-2">
                                  {account.account_code}
                                </TableCell>
                                <TableCell className="py-2 text-sm">
                                  {account.account_name}
                                </TableCell>
                                <TableCell className="w-24 py-2">
                                  <Badge 
                                    variant="outline" 
                                    className={cn("text-xs", getAccountTypeColor(account.account_type))}
                                  >
                                    {translateAccountType(account.account_type)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="w-20 py-2 text-right">
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ChartOfAccountsManager;
