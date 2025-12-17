import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Mail, Clock, Check, X, FileText, 
  Euro, User, Building2, Send, Trash2, Edit
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { INTERNAL_MODULE_PRICING, calculateCustomPrice, getModulePricing } from '@/config/internalPricing';

interface Quote {
  id: string;
  customer_email: string;
  customer_name: string | null;
  customer_company: string | null;
  customer_tax_id: string | null;
  status: string;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
}

interface QuoteItem {
  id: string;
  quote_id: string;
  module_key: string;
  module_name: string;
  custom_price: number;
  license_type: string;
  quantity: number;
  notes: string | null;
}

const QuoteManager: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // New quote form
  const [newQuote, setNewQuote] = useState({
    customer_email: '',
    customer_name: '',
    customer_company: '',
    customer_tax_id: '',
    notes: '',
  });
  
  // New item form
  const [newItem, setNewItem] = useState({
    module_key: '',
    custom_price: 0,
    license_type: 'annual',
    quantity: 1,
    discount: 0,
  });

  useEffect(() => {
    fetchQuotes();
  }, []);

  useEffect(() => {
    if (selectedQuote) {
      fetchQuoteItems(selectedQuote.id);
    }
  }, [selectedQuote]);

  const fetchQuotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customer_quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error cargando cotizaciones');
    } else {
      setQuotes(data || []);
    }
    setLoading(false);
  };

  const fetchQuoteItems = async (quoteId: string) => {
    const { data, error } = await supabase
      .from('customer_quote_items')
      .select('*')
      .eq('quote_id', quoteId);

    if (error) {
      toast.error('Error cargando items de cotización');
    } else {
      setQuoteItems(data || []);
    }
  };

  const createQuote = async () => {
    if (!newQuote.customer_email) {
      toast.error('Email del cliente requerido');
      return;
    }

    const { data, error } = await supabase
      .from('customer_quotes')
      .insert({
        customer_email: newQuote.customer_email,
        customer_name: newQuote.customer_name || null,
        customer_company: newQuote.customer_company || null,
        customer_tax_id: newQuote.customer_tax_id || null,
        notes: newQuote.notes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      toast.error('Error creando cotización');
    } else {
      toast.success('Cotización creada');
      setQuotes([data, ...quotes]);
      setSelectedQuote(data);
      setIsCreateOpen(false);
      setNewQuote({ customer_email: '', customer_name: '', customer_company: '', customer_tax_id: '', notes: '' });
    }
  };

  const addItemToQuote = async () => {
    if (!selectedQuote || !newItem.module_key) return;

    const modulePricing = getModulePricing(newItem.module_key);
    const basePrice = modulePricing?.basePrice || 0;
    const finalPrice = calculateCustomPrice(basePrice, newItem.license_type as any, newItem.discount);

    const { data, error } = await supabase
      .from('customer_quote_items')
      .insert({
        quote_id: selectedQuote.id,
        module_key: newItem.module_key,
        module_name: modulePricing?.moduleName || newItem.module_key,
        custom_price: finalPrice,
        license_type: newItem.license_type,
        quantity: newItem.quantity,
      })
      .select()
      .single();

    if (error) {
      toast.error('Error añadiendo módulo');
    } else {
      toast.success('Módulo añadido');
      setQuoteItems([...quoteItems, data]);
      setNewItem({ module_key: '', custom_price: 0, license_type: 'annual', quantity: 1, discount: 0 });
    }
  };

  const removeItem = async (itemId: string) => {
    const { error } = await supabase
      .from('customer_quote_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast.error('Error eliminando item');
    } else {
      setQuoteItems(quoteItems.filter(i => i.id !== itemId));
      toast.success('Item eliminado');
    }
  };

  const updateQuoteStatus = async (quoteId: string, status: string) => {
    const { error } = await supabase
      .from('customer_quotes')
      .update({ status })
      .eq('id', quoteId);

    if (error) {
      toast.error('Error actualizando estado');
    } else {
      setQuotes(quotes.map(q => q.id === quoteId ? { ...q, status } : q));
      if (selectedQuote?.id === quoteId) {
        setSelectedQuote({ ...selectedQuote, status });
      }
      toast.success('Estado actualizado');
    }
  };

  const sendQuoteToCustomer = async (quote: Quote) => {
    // Here you would integrate with email service
    // For now, just update status to 'sent'
    await updateQuoteStatus(quote.id, 'sent');
    toast.success(`Cotización enviada a ${quote.customer_email}`);
  };

  const getTotalQuoteValue = () => {
    return quoteItems.reduce((sum, item) => sum + (item.custom_price * item.quantity), 0);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      sent: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      accepted: 'bg-green-500/20 text-green-300 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
      expired: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    };
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      sent: 'Enviada',
      accepted: 'Aceptada',
      rejected: 'Rechazada',
      expired: 'Expirada',
    };
    return <Badge className={styles[status] || styles.pending}>{labels[status] || status}</Badge>;
  };

  const filteredQuotes = quotes.filter(q =>
    q.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.customer_company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Cotizaciones</h2>
          <p className="text-muted-foreground">Crear y gestionar cotizaciones personalizadas para clientes</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cotización
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Cotización</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email del Cliente *</Label>
                <Input
                  type="email"
                  value={newQuote.customer_email}
                  onChange={e => setNewQuote({ ...newQuote, customer_email: e.target.value })}
                  placeholder="cliente@empresa.com"
                />
              </div>
              <div>
                <Label>Nombre del Cliente</Label>
                <Input
                  value={newQuote.customer_name}
                  onChange={e => setNewQuote({ ...newQuote, customer_name: e.target.value })}
                  placeholder="Juan García"
                />
              </div>
              <div>
                <Label>Empresa</Label>
                <Input
                  value={newQuote.customer_company}
                  onChange={e => setNewQuote({ ...newQuote, customer_company: e.target.value })}
                  placeholder="Empresa S.L."
                />
              </div>
              <div>
                <Label>CIF/NIF</Label>
                <Input
                  value={newQuote.customer_tax_id}
                  onChange={e => setNewQuote({ ...newQuote, customer_tax_id: e.target.value })}
                  placeholder="B12345678"
                />
              </div>
              <div>
                <Label>Notas internas</Label>
                <Textarea
                  value={newQuote.notes}
                  onChange={e => setNewQuote({ ...newQuote, notes: e.target.value })}
                  placeholder="Notas sobre el cliente..."
                />
              </div>
              <Button onClick={createQuote} className="w-full">
                Crear Cotización
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de cotizaciones */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar cotizaciones..."
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Cargando...</p>
              ) : filteredQuotes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay cotizaciones</p>
              ) : (
                <div className="space-y-2">
                  {filteredQuotes.map(quote => (
                    <div
                      key={quote.id}
                      onClick={() => setSelectedQuote(quote)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedQuote?.id === quote.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium truncate">
                          {quote.customer_company || quote.customer_name || quote.customer_email}
                        </span>
                        {getStatusBadge(quote.status)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{quote.customer_email}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(quote.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Detalle de cotización */}
        <Card className="lg:col-span-2">
          {selectedQuote ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {selectedQuote.customer_company || 'Cotización'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedQuote.customer_email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedQuote.status)}
                    {selectedQuote.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => sendQuoteToCustomer(selectedQuote)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Enviar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Datos del cliente */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{selectedQuote.customer_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CIF/NIF</p>
                    <p className="font-medium">{selectedQuote.customer_tax_id || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Válida hasta</p>
                    <p className="font-medium">
                      {selectedQuote.valid_until 
                        ? new Date(selectedQuote.valid_until).toLocaleDateString('es-ES')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-medium text-lg text-primary">
                      {getTotalQuoteValue().toLocaleString('es-ES')}€
                    </p>
                  </div>
                </div>

                {/* Añadir módulo */}
                <div className="p-4 border rounded-lg space-y-4">
                  <h4 className="font-medium">Añadir Módulo</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <Label>Módulo</Label>
                      <Select
                        value={newItem.module_key}
                        onValueChange={val => {
                          const pricing = getModulePricing(val);
                          setNewItem({ 
                            ...newItem, 
                            module_key: val,
                            custom_price: pricing?.basePrice || 0
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar módulo" />
                        </SelectTrigger>
                        <SelectContent>
                          {INTERNAL_MODULE_PRICING.map(m => (
                            <SelectItem key={m.moduleKey} value={m.moduleKey}>
                              {m.moduleName} - {m.basePrice.toLocaleString()}€
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Licencia</Label>
                      <Select
                        value={newItem.license_type}
                        onValueChange={val => setNewItem({ ...newItem, license_type: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensual</SelectItem>
                          <SelectItem value="annual">Anual</SelectItem>
                          <SelectItem value="perpetual">Perpetua</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Descuento %</Label>
                      <Input
                        type="number"
                        min={0}
                        max={50}
                        value={newItem.discount}
                        onChange={e => setNewItem({ ...newItem, discount: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <Button onClick={addItemToQuote} disabled={!newItem.module_key}>
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir a Cotización
                  </Button>
                </div>

                {/* Lista de items */}
                <div>
                  <h4 className="font-medium mb-3">Módulos en Cotización</h4>
                  {quoteItems.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No hay módulos en esta cotización
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {quoteItems.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{item.module_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.license_type === 'monthly' && 'Mensual'}
                              {item.license_type === 'annual' && 'Anual'}
                              {item.license_type === 'perpetual' && 'Perpetua'}
                              {' • '}x{item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-primary">
                              {(item.custom_price * item.quantity).toLocaleString('es-ES')}€
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Acciones de estado */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => updateQuoteStatus(selectedQuote.id, 'accepted')}
                    className="text-green-600 border-green-600"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Marcar Aceptada
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateQuoteStatus(selectedQuote.id, 'rejected')}
                    className="text-red-600 border-red-600"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Marcar Rechazada
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-[500px] text-muted-foreground">
              Selecciona una cotización para ver los detalles
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default QuoteManager;
