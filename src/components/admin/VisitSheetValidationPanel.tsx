import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, User, Building2, Calendar, Package, FileText, History } from 'lucide-react';
import { format } from 'date-fns';
import { es, ca } from 'date-fns/locale';

import type { Json } from '@/integrations/supabase/types';

interface VisitSheetPending {
  id: string;
  visit_id: string;
  company_id: string;
  gestor_id: string;
  fecha: string;
  productos_ofrecidos: Json;
  resultado_oferta: string | null;
  validation_status: string | null;
  notas_gestor: string | null;
  potencial_anual_estimado: number | null;
  probabilidad_cierre: number | null;
  created_at: string;
  validated_at?: string | null;
  validated_by?: string | null;
  validation_notes?: string | null;
  company?: { name: string } | null;
  gestor?: { full_name: string | null; email: string } | null;
}

interface ValidationHistory {
  id: string;
  visit_sheet_id: string;
  validated_by: string;
  validated_at: string;
  validation_status: string;
  validation_notes: string;
  productos_added: string[];
  validator?: { full_name: string };
}

export default function VisitSheetValidationPanel() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [pendingSheets, setPendingSheets] = useState<VisitSheetPending[]>([]);
  const [validatedSheets, setValidatedSheets] = useState<VisitSheetPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState<VisitSheetPending | null>(null);
  const [validationNotes, setValidationNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [validationHistory, setValidationHistory] = useState<ValidationHistory[]>([]);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historySheetId, setHistorySheetId] = useState<string | null>(null);

  const dateLocale = language === 'ca' ? ca : es;

  useEffect(() => {
    fetchPendingSheets();
    fetchValidatedSheets();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('id, name').eq('active', true);
    if (data) setProducts(data);
  };

  const fetchPendingSheets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('visit_sheets')
      .select(`
        id, visit_id, company_id, gestor_id, fecha, productos_ofrecidos, 
        resultado_oferta, validation_status, notas_gestor, 
        potencial_anual_estimado, probabilidad_cierre, created_at,
        company:companies(name),
        gestor:profiles!visit_sheets_gestor_id_fkey(full_name, email)
      `)
      .eq('validation_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending sheets:', error);
      toast.error('Error al cargar fichas pendientes');
    } else {
      setPendingSheets(data || []);
    }
    setLoading(false);
  };

  const fetchValidatedSheets = async () => {
    const { data } = await supabase
      .from('visit_sheets')
      .select(`
        id, visit_id, company_id, gestor_id, fecha, productos_ofrecidos, 
        resultado_oferta, validation_status, notas_gestor, 
        potencial_anual_estimado, probabilidad_cierre, created_at,
        validated_at, validated_by, validation_notes,
        company:companies(name),
        gestor:profiles!visit_sheets_gestor_id_fkey(full_name, email)
      `)
      .in('validation_status', ['approved', 'rejected'])
      .order('validated_at', { ascending: false })
      .limit(50);

    if (data) setValidatedSheets(data);
  };

  const handleValidate = async (approved: boolean) => {
    if (!selectedSheet || !user) return;
    
    setProcessing(true);
    try {
      // Update visit sheet validation status
      const { error: updateError } = await supabase
        .from('visit_sheets')
        .update({
          validation_status: approved ? 'approved' : 'rejected',
          validated_by: user.id,
          validated_at: new Date().toISOString(),
          validation_notes: validationNotes
        })
        .eq('id', selectedSheet.id);

      if (updateError) throw updateError;

      // If approved and result was positive, add products to company
      if (approved && selectedSheet.resultado_oferta === 'aceptada') {
        const productosOfrecidos = Array.isArray(selectedSheet.productos_ofrecidos) 
          ? selectedSheet.productos_ofrecidos as string[]
          : [];
        
        for (const productName of productosOfrecidos) {
          const product = products.find(p => p.name === productName);
          if (product) {
            // Check if product already exists for company
            const { data: existing } = await supabase
              .from('company_products')
              .select('id')
              .eq('company_id', selectedSheet.company_id)
              .eq('product_id', product.id)
              .single();

            if (!existing) {
              await supabase.from('company_products').insert({
                company_id: selectedSheet.company_id,
                product_id: product.id,
                contract_date: new Date().toISOString().split('T')[0],
                active: true
              });
            }
          }
        }
      }

      // Notify gestor
      await supabase.from('notifications').insert({
        user_id: selectedSheet.gestor_id,
        title: approved ? 'Ficha de Visita Aprobada' : 'Ficha de Visita Rechazada',
        message: `Tu ficha de visita para ${selectedSheet.company?.name || 'empresa'} ha sido ${approved ? 'aprobada' : 'rechazada'}. ${validationNotes ? `Notas: ${validationNotes}` : ''}`,
        severity: approved ? 'info' : 'warning'
      });

      toast.success(approved ? 'Ficha aprobada correctamente' : 'Ficha rechazada');
      setSelectedSheet(null);
      setValidationNotes('');
      fetchPendingSheets();
      fetchValidatedSheets();
    } catch (error) {
      console.error('Error validating sheet:', error);
      toast.error('Error al validar la ficha');
    }
    setProcessing(false);
  };

  const getProductNames = (productos: Json | null) => {
    if (!productos) return 'Ninguno';
    if (Array.isArray(productos) && productos.length > 0) {
      return productos.join(', ');
    }
    return 'Ninguno';
  };

  const getResultBadge = (result: string | null) => {
    switch (result) {
      case 'aceptada':
        return <Badge className="bg-green-500">Aceptada</Badge>;
      case 'rechazada':
        return <Badge variant="destructive">Rechazada</Badge>;
      case 'pendiente':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'aplazada':
        return <Badge className="bg-amber-500">Aplazada</Badge>;
      default:
        return <Badge variant="outline">Sin resultado</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Aprobada</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rechazada</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
    }
  };

  const showHistory = async (sheetId: string) => {
    setHistorySheetId(sheetId);
    
    // Get validation info from the sheet itself
    const { data: sheet } = await supabase
      .from('visit_sheets')
      .select(`
        id, validated_at, validated_by, validation_status, validation_notes, productos_ofrecidos,
        validator:profiles!visit_sheets_validated_by_fkey(full_name)
      `)
      .eq('id', sheetId)
      .single();

    if (sheet && sheet.validated_at) {
      setValidationHistory([{
        id: sheet.id,
        visit_sheet_id: sheet.id,
        validated_by: sheet.validated_by || '',
        validated_at: sheet.validated_at,
        validation_status: sheet.validation_status || '',
        validation_notes: sheet.validation_notes || '',
        productos_added: sheet.validation_status === 'approved' ? (sheet.productos_ofrecidos as string[] || []) : [],
        validator: sheet.validator as { full_name: string } | undefined
      }]);
    } else {
      setValidationHistory([]);
    }
    
    setShowHistoryDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Panel de Validación de Fichas</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            <Clock className="w-4 h-4 mr-2" />
            {pendingSheets.length} pendientes
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            Pendientes ({pendingSheets.length})
          </TabsTrigger>
          <TabsTrigger value="validated" className="gap-2">
            <History className="w-4 h-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : pendingSheets.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p>No hay fichas pendientes de validación</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingSheets.map((sheet) => (
                <Card key={sheet.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{sheet.company?.name || 'Empresa'}</span>
                          {getResultBadge(sheet.resultado_oferta)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {sheet.gestor?.full_name || 'Gestor'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(sheet.fecha), 'dd/MM/yyyy', { locale: dateLocale })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="w-3 h-3 text-muted-foreground" />
                          <span className="font-medium">Productos ofrecidos:</span>
                          <span>{getProductNames(sheet.productos_ofrecidos as string[])}</span>
                        </div>
                        {sheet.notas_gestor && (
                          <div className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                            <FileText className="w-3 h-3 inline mr-1" />
                            {sheet.notas_gestor}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showHistory(sheet.id)}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedSheet(sheet);
                            setValidationNotes('');
                          }}
                        >
                          Validar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="validated" className="mt-4">
          <ScrollArea className="h-[600px]">
            <div className="grid gap-4">
              {validatedSheets.map((sheet) => (
                <Card key={sheet.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{sheet.company?.name || 'Empresa'}</span>
                          {getStatusBadge(sheet.validation_status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {sheet.gestor?.full_name || 'Gestor'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(sheet.fecha), 'dd/MM/yyyy', { locale: dateLocale })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="w-3 h-3 text-muted-foreground" />
                          <span>{getProductNames(sheet.productos_ofrecidos as string[])}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => showHistory(sheet.id)}
                      >
                        <History className="w-4 h-4 mr-1" />
                        Ver historial
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Validation Dialog */}
      <Dialog open={!!selectedSheet} onOpenChange={() => setSelectedSheet(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Validar Ficha de Visita</DialogTitle>
          </DialogHeader>
          
          {selectedSheet && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span className="font-semibold">{selectedSheet.company?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-3 h-3" />
                  <span>{selectedSheet.gestor?.full_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Resultado de oferta:</span>
                  {getResultBadge(selectedSheet.resultado_oferta)}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Productos ofrecidos:</span>
                  <p className="mt-1">{getProductNames(selectedSheet.productos_ofrecidos as string[])}</p>
                </div>
                {selectedSheet.resultado_oferta === 'aceptada' && (
                  <div className="bg-green-500/10 border border-green-500/20 p-2 rounded text-sm text-green-700 dark:text-green-400">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Al aprobar, los productos se añadirán automáticamente al cliente
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notas de validación (opcional)</label>
                <Textarea
                  value={validationNotes}
                  onChange={(e) => setValidationNotes(e.target.value)}
                  placeholder="Añade notas o comentarios sobre la validación..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => handleValidate(false)}
              disabled={processing}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Rechazar
            </Button>
            <Button
              onClick={() => handleValidate(true)}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Historial de Validación</DialogTitle>
          </DialogHeader>
          
          {validationHistory.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p>Esta ficha aún no ha sido validada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {validationHistory.map((record) => (
                <div key={record.id} className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(record.validation_status)}
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(record.validated_at), "dd/MM/yyyy HH:mm", { locale: dateLocale })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-3 h-3" />
                    <span>Validado por: {record.validator?.full_name || 'Desconocido'}</span>
                  </div>
                  {record.validation_notes && (
                    <div className="text-sm bg-background p-2 rounded">
                      <span className="font-medium">Notas:</span> {record.validation_notes}
                    </div>
                  )}
                  {record.productos_added.length > 0 && (
                    <div className="text-sm text-green-600 dark:text-green-400">
                      <Package className="w-3 h-3 inline mr-1" />
                      Productos añadidos: {record.productos_added.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
