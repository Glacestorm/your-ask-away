/**
 * Factoring Panel - Main UI for factoring operations
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  FileText,
  Plus,
  Building2,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  ArrowUpRight,
  Percent,
} from 'lucide-react';
import { useERPFactoring, FactoringContract, FactoringAssignment } from '@/hooks/erp/useERPFactoring';
import { NewContractForm } from './NewContractForm';
import { NewAssignmentForm } from './NewAssignmentForm';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  with_recourse: 'Con Recurso',
  without_recourse: 'Sin Recurso',
  reverse_factoring: 'Confirming',
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Activo', variant: 'default' },
  suspended: { label: 'Suspendido', variant: 'secondary' },
  terminated: { label: 'Terminado', variant: 'destructive' },
  expired: { label: 'Vencido', variant: 'outline' },
  pending: { label: 'Pendiente', variant: 'secondary' },
  approved: { label: 'Aprobado', variant: 'default' },
  advanced: { label: 'Anticipado', variant: 'default' },
  collected: { label: 'Cobrado', variant: 'default' },
  defaulted: { label: 'Impagado', variant: 'destructive' },
  rejected: { label: 'Rechazado', variant: 'destructive' },
};

export function FactoringPanel() {
  const {
    contracts,
    assignments,
    loading,
    stats,
    fetchContracts,
    fetchAssignments,
  } = useERPFactoring();

  const [activeTab, setActiveTab] = useState('contracts');
  const [showNewContract, setShowNewContract] = useState(false);
  const [showNewAssignment, setShowNewAssignment] = useState(false);
  const [selectedContract, setSelectedContract] = useState<FactoringContract | null>(null);

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const handleRefresh = () => {
    fetchContracts();
    fetchAssignments();
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contratos Activos</p>
                <p className="text-xl font-bold">{stats.activeContracts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Límite Disponible</p>
                <p className="text-xl font-bold">{formatCurrency(stats.availableLimit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <ArrowUpRight className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Anticipado</p>
                <p className="text-xl font-bold">{formatCurrency(stats.advancedAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cesiones Pendientes</p>
                <p className="text-xl font-bold">{stats.pendingAssignments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Factoring
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
                Actualizar
              </Button>
              {activeTab === 'contracts' ? (
                <Button size="sm" onClick={() => setShowNewContract(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nuevo Contrato
                </Button>
              ) : (
                <Button size="sm" onClick={() => setShowNewAssignment(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva Cesión
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="contracts" className="gap-1">
                <FileText className="h-4 w-4" />
                Contratos ({contracts.length})
              </TabsTrigger>
              <TabsTrigger value="assignments" className="gap-1">
                <Building2 className="h-4 w-4" />
                Cesiones ({assignments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contracts">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contrato</TableHead>
                      <TableHead>Entidad</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Límite</TableHead>
                      <TableHead className="text-right">Disponible</TableHead>
                      <TableHead>% Anticipo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow
                        key={contract.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedContract(contract)}
                      >
                        <TableCell className="font-medium">
                          {contract.contract_number}
                        </TableCell>
                        <TableCell>
                          {contract.financial_entity?.name || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {CONTRACT_TYPE_LABELS[contract.contract_type] || contract.contract_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(contract.global_limit), contract.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(contract.available_limit), contract.currency)}
                        </TableCell>
                        <TableCell>
                          {contract.advance_percentage}%
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_CONFIG[contract.status]?.variant || 'outline'}>
                            {STATUS_CONFIG[contract.status]?.label || contract.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {contracts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay contratos de factoring
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="assignments">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Factura</TableHead>
                      <TableHead>Deudor</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                      <TableHead className="text-right">Anticipado</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Cesión</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">
                          {assignment.invoice_number}
                        </TableCell>
                        <TableCell>
                          {assignment.debtor?.legal_name || assignment.debtor_name}
                        </TableCell>
                        <TableCell>
                          {new Date(assignment.due_date).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(assignment.invoice_amount), assignment.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(assignment.advance_amount), assignment.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_CONFIG[assignment.status]?.variant || 'outline'}>
                            {STATUS_CONFIG[assignment.status]?.label || assignment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDistanceToNow(new Date(assignment.assignment_date), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {assignments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay cesiones de facturas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modals */}
      <NewContractForm
        open={showNewContract}
        onOpenChange={setShowNewContract}
      />

      <NewAssignmentForm
        open={showNewAssignment}
        onOpenChange={setShowNewAssignment}
        contracts={contracts.filter(c => c.status === 'active')}
      />
    </div>
  );
}

export default FactoringPanel;
