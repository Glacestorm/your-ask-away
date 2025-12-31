/**
 * Gestión de Ejercicios Fiscales y Periodos
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Calendar, Plus, Lock, Unlock, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useERPFiscalYears } from '@/hooks/erp/useERPFiscalYears';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { ERPFiscalYear, CreateFiscalYearForm } from '@/types/erp';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const initialForm: CreateFiscalYearForm = {
  name: '',
  start_date: '',
  end_date: '',
};

export function ERPFiscalYearsManager() {
  const { currentCompany, hasPermission } = useERPContext();
  const { fiscalYears, isLoading, fetchFiscalYears, createFiscalYear, closePeriod, closeFiscalYear } = useERPFiscalYears();
  
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<CreateFiscalYearForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

  const canWrite = hasPermission('accounting.close') || hasPermission('admin.all');

  useEffect(() => {
    if (currentCompany?.id) {
      fetchFiscalYears();
    }
  }, [currentCompany?.id, fetchFiscalYears]);

  const handleOpenCreate = () => {
    const year = new Date().getFullYear();
    setForm({
      name: `Ejercicio ${year}`,
      start_date: `${year}-01-01`,
      end_date: `${year}-12-31`,
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.start_date || !form.end_date) {
      toast.error('Completa todos los campos');
      return;
    }

    if (!currentCompany?.id) return;

    setIsSaving(true);
    try {
      await createFiscalYear(form);
      setShowDialog(false);
    } catch (err) {
      toast.error('Error al crear ejercicio');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClosePeriod = async (periodId: string, periodName: string) => {
    if (!confirm(`¿Cerrar el periodo "${periodName}"? Esta acción no se puede deshacer.`)) return;
    
    const success = await closePeriod(periodId);
    if (success) {
      fetchFiscalYears();
    }
  };

  const handleCloseFiscalYear = async (yearId: string, yearName: string) => {
    if (!confirm(`¿Cerrar el ejercicio "${yearName}"? Todos los periodos se cerrarán también.`)) return;
    
    const success = await closeFiscalYear(yearId);
    if (success) {
      fetchFiscalYears();
    }
  };

  const toggleExpand = (yearId: string) => {
    setExpandedYears(prev => {
      const next = new Set(prev);
      if (next.has(yearId)) {
        next.delete(yearId);
      } else {
        next.add(yearId);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: es });
  };

  if (!currentCompany) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Selecciona una empresa para gestionar ejercicios fiscales
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Ejercicios Fiscales
            </CardTitle>
            <CardDescription>
              Gestión de ejercicios y periodos contables
            </CardDescription>
          </div>
          {canWrite && (
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Ejercicio
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : fiscalYears.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay ejercicios fiscales. Crea el primero.
          </div>
        ) : (
          <div className="space-y-2">
            {fiscalYears.map((fy) => (
              <Collapsible
                key={fy.id}
                open={expandedYears.has(fy.id)}
                onOpenChange={() => toggleExpand(fy.id)}
              >
                <div className="rounded-lg border">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        {expandedYears.has(fy.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <div>
                          <p className="font-medium">{fy.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(fy.start_date)} - {formatDate(fy.end_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={fy.is_closed ? 'secondary' : 'default'}>
                          {fy.is_closed ? (
                            <><Lock className="h-3 w-3 mr-1" /> Cerrado</>
                          ) : (
                            <><Unlock className="h-3 w-3 mr-1" /> Abierto</>
                          )}
                        </Badge>
                        {canWrite && !fy.is_closed && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCloseFiscalYear(fy.id, fy.name);
                            }}
                          >
                            Cerrar Ejercicio
                          </Button>
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    {fy.periods && fy.periods.length > 0 && (
                      <div className="border-t px-4 pb-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Periodo</TableHead>
                              <TableHead>Inicio</TableHead>
                              <TableHead>Fin</TableHead>
                              <TableHead>Estado</TableHead>
                              {canWrite && <TableHead className="text-right">Acciones</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {fy.periods.map((period) => (
                              <TableRow key={period.id}>
                                <TableCell className="font-medium">{period.name}</TableCell>
                                <TableCell>{formatDate(period.start_date)}</TableCell>
                                <TableCell>{formatDate(period.end_date)}</TableCell>
                                <TableCell>
                                  <Badge variant={period.is_closed ? 'secondary' : 'outline'} className="text-xs">
                                    {period.is_closed ? 'Cerrado' : 'Abierto'}
                                  </Badge>
                                </TableCell>
                                {canWrite && (
                                  <TableCell className="text-right">
                                    {!period.is_closed && !fy.is_closed && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleClosePeriod(period.id, period.name)}
                                      >
                                        <Lock className="h-3 w-3 mr-1" />
                                        Cerrar
                                      </Button>
                                    )}
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )}

        {/* Dialog Crear */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Ejercicio Fiscal</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ejercicio 2025"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Fecha inicio</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Fecha fin</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Se crearán automáticamente 12 periodos mensuales.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default ERPFiscalYearsManager;
