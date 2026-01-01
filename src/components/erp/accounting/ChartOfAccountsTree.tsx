/**
 * ChartOfAccountsTree - Plan de cuentas en árbol
 * Migrado de obelixia-accounting con soporte multi-país
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Edit,
  Trash2,
  FolderTree,
  FileText,
  RefreshCw,
  Filter
} from 'lucide-react';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { useERPAccounting } from '@/hooks/erp/useERPAccounting';
import { HelpTooltip } from './HelpTooltip';
import { CreateAccountDialog } from './CreateAccountDialog';
import { cn } from '@/lib/utils';
import {
  ACCOUNT_GROUP_NAMES,
  ACCOUNT_TYPE_COLORS,
  getAccountTypeLabel,
  getGroupName,
  getAccountGroup
} from '@/lib/erp/accounting-dictionaries';

interface ChartOfAccountsTreeProps {
  onSelectAccount?: (account: any) => void;
  selectionMode?: boolean;
  className?: string;
}

interface AccountGroup {
  group: string;
  name: string;
  accounts: any[];
  isOpen: boolean;
}

export function ChartOfAccountsTree({
  onSelectAccount,
  selectionMode = false,
  className
}: ChartOfAccountsTreeProps) {
  const { currentCompany } = useERPContext();
  const { chartOfAccounts, isLoading, fetchChartOfAccounts } = useERPAccounting();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['4', '6', '7']));
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  const countryCode = currentCompany?.country?.substring(0, 2).toUpperCase() || 'ES';

  // Cargar cuentas al montar
  useEffect(() => {
    if (currentCompany?.id) {
      fetchChartOfAccounts();
    }
  }, [currentCompany?.id, fetchChartOfAccounts]);

  // Agrupar cuentas por grupo principal (primer dígito)
  const groupedAccounts = useMemo(() => {
    const filtered = chartOfAccounts.filter(account => {
      const matchesSearch = !searchTerm || 
        account.account_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = !filterType || account.account_type === filterType;
      
      return matchesSearch && matchesType;
    });

    const groups: Record<string, AccountGroup> = {};

    // Inicializar grupos 1-9
    for (let i = 1; i <= 9; i++) {
      const groupNum = i.toString();
      groups[groupNum] = {
        group: groupNum,
        name: getGroupName(groupNum, countryCode),
        accounts: [],
        isOpen: openGroups.has(groupNum)
      };
    }

    // Asignar cuentas a grupos
    filtered.forEach(account => {
      const group = getAccountGroup(account.account_code || '1');
      if (groups[group]) {
        groups[group].accounts.push(account);
      }
    });

    // Ordenar cuentas dentro de cada grupo
    Object.values(groups).forEach(group => {
      group.accounts.sort((a, b) => (a.account_code || '').localeCompare(b.account_code || ''));
    });

    return Object.values(groups).filter(g => g.accounts.length > 0 || !searchTerm);
  }, [chartOfAccounts, searchTerm, filterType, openGroups, countryCode]);

  // Toggle grupo
  const toggleGroup = useCallback((group: string) => {
    setOpenGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  }, []);

  // Expandir/Colapsar todos
  const expandAll = () => {
    setOpenGroups(new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']));
  };

  const collapseAll = () => {
    setOpenGroups(new Set());
  };

  // Obtener badge color por tipo
  const getTypeBadge = (type: string) => {
    const colorClass = ACCOUNT_TYPE_COLORS[type] || ACCOUNT_TYPE_COLORS.asset;
    const label = getAccountTypeLabel(type, countryCode);
    return (
      <Badge variant="outline" className={cn('text-xs', colorClass)}>
        {label}
      </Badge>
    );
  };

  // Handle account click
  const handleAccountClick = (account: any) => {
    if (selectionMode && onSelectAccount) {
      onSelectAccount(account);
    }
  };

  // Handle edit
  const handleEdit = (account: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAccount(account);
    setShowCreateDialog(true);
  };

  // Cerrar dialog
  const handleDialogClose = () => {
    setShowCreateDialog(false);
    setEditingAccount(null);
    fetchChartOfAccounts();
  };

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="pb-3 space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Plan de Cuentas</CardTitle>
            <HelpTooltip 
              content="Plan General de Contabilidad adaptado a la normativa del país seleccionado."
              regulationRef={countryCode === 'ES' ? 'PGC' : countryCode === 'AD' ? 'PGC Andorra' : undefined}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchChartOfAccounts()}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nueva
            </Button>
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={openGroups.size > 0 ? collapseAll : expandAll}
            title={openGroups.size > 0 ? 'Colapsar todo' : 'Expandir todo'}
          >
            {openGroups.size > 0 ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Filtros rápidos por tipo */}
        <div className="flex gap-1 mt-2 flex-wrap">
          <Button
            variant={filterType === null ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilterType(null)}
            className="h-7 text-xs"
          >
            Todas
          </Button>
          {['asset', 'liability', 'equity', 'income', 'expense'].map(type => (
            <Button
              key={type}
              variant={filterType === type ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilterType(type)}
              className="h-7 text-xs"
            >
              {getAccountTypeLabel(type, countryCode)}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-1">
            {groupedAccounts.map((group) => (
              <Collapsible
                key={group.group}
                open={openGroups.has(group.group)}
                onOpenChange={() => toggleGroup(group.group)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    {openGroups.has(group.group) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-semibold text-primary">{group.group}</span>
                    <span className="font-medium">{group.name}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {group.accounts.length}
                    </Badge>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="ml-6 border-l-2 border-muted pl-2 mt-1">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-24">Código</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead className="w-24">Tipo</TableHead>
                          <TableHead className="w-16 text-center">Nivel</TableHead>
                          <TableHead className="w-20"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.accounts.map((account) => (
                          <TableRow
                            key={account.id}
                            className={cn(
                              'cursor-pointer transition-colors',
                              selectionMode && 'hover:bg-primary/10',
                              !account.accepts_entries && 'bg-muted/30 font-medium'
                            )}
                            onClick={() => handleAccountClick(account)}
                          >
                            <TableCell className="font-mono text-sm">
                              <div className="flex items-center gap-1">
                                {!account.accepts_entries ? (
                                  <FolderTree className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                  <FileText className="h-3 w-3 text-muted-foreground" />
                                )}
                                {account.account_code}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={cn(
                                account.account_group === 1 && 'font-semibold',
                                account.account_group === 2 && 'font-medium'
                              )}>
                                {account.account_name}
                              </span>
                            </TableCell>
                            <TableCell>
                              {getTypeBadge(account.account_type)}
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground text-sm">
                              {account.level}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => handleEdit(account, e)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {group.accounts.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                              No hay cuentas en este grupo
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}

            {groupedAccounts.length === 0 && searchTerm && (
              <div className="text-center text-muted-foreground py-8">
                No se encontraron cuentas que coincidan con "{searchTerm}"
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Dialog crear/editar cuenta */}
      <CreateAccountDialog
        open={showCreateDialog}
        onOpenChange={handleDialogClose}
        editingAccount={editingAccount}
        countryCode={countryCode}
      />
    </Card>
  );
}

export default ChartOfAccountsTree;
