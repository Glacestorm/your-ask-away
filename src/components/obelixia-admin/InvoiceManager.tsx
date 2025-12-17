import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Mail, Receipt, Euro, Send, 
  Printer, Eye, Check, Clock, AlertCircle, Trash2, Edit, Download, Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceItem {
  module_key: string;
  module_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_email: string;
  customer_name: string | null;
  customer_company: string | null;
  customer_tax_id: string | null;
  customer_address: string | null;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: string;
  issue_date: string;
  due_date: string | null;
  notes: string | null;
  cover_letter: string | null;
  sent_at: string | null;
  created_at: string;
}

const DEFAULT_COVER_LETTER = `Estimado/a cliente,

Es un placer remitirle la factura adjunta correspondiente a los servicios de software ObelixIA contratados.

En ObelixIA estamos comprometidos con ofrecer soluciones tecnológicas de máxima calidad para optimizar la gestión de su negocio. Agradecemos sinceramente su confianza en nosotros.

Para cualquier consulta o aclaración sobre esta factura, no dude en ponerse en contacto con nuestro equipo comercial.

Quedamos a su disposición para cualquier cuestión adicional.

Atentamente,

El equipo de ObelixIA
Jaime Fernández García
Director Comercial
jfernandez@obelixia.com
+34 606 770 033`;

export const InvoiceManager: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [modules, setModules] = useState<any[]>([]);
  
  const [newInvoice, setNewInvoice] = useState({
    customer_email: '',
    customer_name: '',
    customer_company: '',
    customer_tax_id: '',
    customer_address: '',
    notes: '',
    cover_letter: DEFAULT_COVER_LETTER,
    tax_rate: 21,
    due_days: 30,
  });
  
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [newItem, setNewItem] = useState({
    module_key: '',
    quantity: 1,
  });

  useEffect(() => {
    fetchInvoices();
    fetchModules();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('obelixia_invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error cargando facturas');
    } else {
      // Parse items JSON for each invoice
      const parsedData = (data || []).map(inv => ({
        ...inv,
        items: typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items
      }));
      setInvoices(parsedData);
    }
    setLoading(false);
  };

  const fetchModules = async () => {
    const { data } = await supabase
      .from('obelixia_module_pricing')
      .select('*')
      .eq('is_active', true);
    setModules(data || []);
  };

  const addItemToInvoice = () => {
    if (!newItem.module_key) return;
    
    const module = modules.find(m => m.module_key === newItem.module_key);
    if (!module) return;

    const item: InvoiceItem = {
      module_key: module.module_key,
      module_name: module.module_name,
      quantity: newItem.quantity,
      unit_price: module.base_price,
      total: module.base_price * newItem.quantity,
    };

    setInvoiceItems([...invoiceItems, item]);
    setNewItem({ module_key: '', quantity: 1 });
  };

  const removeItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * (newInvoice.tax_rate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const createInvoice = async () => {
    if (!newInvoice.customer_email || invoiceItems.length === 0) {
      toast.error('Email y al menos un módulo son requeridos');
      return;
    }

    const { subtotal, taxAmount, total } = calculateTotals();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + newInvoice.due_days);

    // Generate invoice number
    const invoiceNumber = `OBX-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

    const { data, error } = await supabase
      .from('obelixia_invoices')
      .insert([{
        invoice_number: invoiceNumber,
        customer_email: newInvoice.customer_email,
        customer_name: newInvoice.customer_name || null,
        customer_company: newInvoice.customer_company || null,
        customer_tax_id: newInvoice.customer_tax_id || null,
        customer_address: newInvoice.customer_address || null,
        items: invoiceItems as any,
        subtotal,
        tax_rate: newInvoice.tax_rate,
        tax_amount: taxAmount,
        total,
        due_date: dueDate.toISOString().split('T')[0],
        notes: newInvoice.notes || null,
        cover_letter: newInvoice.cover_letter || null,
        status: 'draft',
      }])
      .select()
      .single();

    if (error) {
      toast.error('Error creando factura');
      console.error(error);
    } else {
      toast.success('Factura creada correctamente');
      setInvoices([{ ...data, items: invoiceItems } as Invoice, ...invoices]);
      setSelectedInvoice({ ...data, items: invoiceItems } as Invoice);
      setIsCreateOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setNewInvoice({
      customer_email: '',
      customer_name: '',
      customer_company: '',
      customer_tax_id: '',
      customer_address: '',
      notes: '',
      cover_letter: DEFAULT_COVER_LETTER,
      tax_rate: 21,
      due_days: 30,
    });
    setInvoiceItems([]);
  };

  const sendInvoice = async (invoice: Invoice) => {
    setIsSending(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId: invoice.id,
          recipientEmail: invoice.customer_email,
          coverLetter: invoice.cover_letter || DEFAULT_COVER_LETTER,
        }
      });

      if (error) throw error;

      // Update status
      await supabase
        .from('obelixia_invoices')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', invoice.id);

      toast.success(`Factura enviada a ${invoice.customer_email}`);
      fetchInvoices();
    } catch (error: any) {
      toast.error('Error enviando factura: ' + (error.message || 'Error desconocido'));
    } finally {
      setIsSending(false);
    }
  };

  const generateInvoicePDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Dark header background
    doc.setFillColor(10, 10, 15);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    // Logo text with gradient simulation
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246); // Blue
    doc.text('Obelix', 20, 30);
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text('IA', 58, 30);
    
    // Invoice number
    doc.setFontSize(12);
    doc.setTextColor(148, 163, 184);
    doc.text(`Factura: ${invoice.invoice_number}`, pageWidth - 20, 25, { align: 'right' });
    doc.text(`Fecha: ${new Date(invoice.issue_date).toLocaleDateString('es-ES')}`, pageWidth - 20, 35, { align: 'right' });
    
    // Reset colors
    doc.setTextColor(0, 0, 0);
    
    // Company info
    doc.setFontSize(10);
    doc.text('ObelixIA Software Solutions', 20, 65);
    doc.text('CIF: B12345678', 20, 72);
    doc.text('jfernandez@obelixia.com | +34 606 770 033', 20, 79);
    
    // Customer info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Facturar a:', 20, 95);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(invoice.customer_company || invoice.customer_name || '-', 20, 103);
    doc.text(`CIF/NIF: ${invoice.customer_tax_id || '-'}`, 20, 110);
    doc.text(invoice.customer_email, 20, 117);
    if (invoice.customer_address) {
      doc.text(invoice.customer_address, 20, 124);
    }
    
    // Items table
    const tableData = (invoice.items || []).map((item: InvoiceItem) => [
      item.module_name,
      item.quantity.toString(),
      `${item.unit_price.toLocaleString('es-ES')} €`,
      `${item.total.toLocaleString('es-ES')} €`
    ]);
    
    (doc as any).autoTable({
      startY: 135,
      head: [['Módulo', 'Cant.', 'Precio Unit.', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
      styles: { fontSize: 10 },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });
    
    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Subtotal: ${invoice.subtotal.toLocaleString('es-ES')} €`, pageWidth - 20, finalY, { align: 'right' });
    doc.text(`IVA (${invoice.tax_rate}%): ${invoice.tax_amount.toLocaleString('es-ES')} €`, pageWidth - 20, finalY + 7, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`TOTAL: ${invoice.total.toLocaleString('es-ES')} €`, pageWidth - 20, finalY + 17, { align: 'right' });
    
    // Payment info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('es-ES') : '-';
    doc.text(`Fecha de vencimiento: ${dueDate}`, 20, finalY + 30);
    
    // Footer
    doc.setFontSize(8);
    doc.text('ObelixIA - CRM Bancario Inteligente | www.obelixia.com', pageWidth / 2, 285, { align: 'center' });
    
    return doc;
  };

  const printInvoice = (invoice: Invoice) => {
    const doc = generateInvoicePDF(invoice);
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    toast.success('Documento listo para imprimir');
  };

  const saveInvoice = (invoice: Invoice) => {
    const doc = generateInvoicePDF(invoice);
    doc.save(`Factura_${invoice.invoice_number}.pdf`);
    toast.success('Factura guardada correctamente');
  };

  const deleteInvoice = async (invoice: Invoice) => {
    if (!confirm(`¿Está seguro de eliminar la factura ${invoice.invoice_number}?`)) return;
    
    const { error } = await supabase
      .from('obelixia_invoices')
      .delete()
      .eq('id', invoice.id);

    if (error) {
      toast.error('Error eliminando factura');
    } else {
      setInvoices(invoices.filter(inv => inv.id !== invoice.id));
      if (selectedInvoice?.id === invoice.id) {
        setSelectedInvoice(null);
      }
      toast.success('Factura eliminada correctamente');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { class: string; label: string; icon: any }> = {
      draft: { class: 'bg-slate-500/20 text-slate-300', label: 'Borrador', icon: Edit },
      sent: { class: 'bg-blue-500/20 text-blue-300', label: 'Enviada', icon: Send },
      paid: { class: 'bg-emerald-500/20 text-emerald-300', label: 'Pagada', icon: Check },
      overdue: { class: 'bg-red-500/20 text-red-300', label: 'Vencida', icon: AlertCircle },
      cancelled: { class: 'bg-slate-600/20 text-slate-400', label: 'Cancelada', icon: Trash2 },
    };
    const { class: className, label, icon: Icon } = config[status] || config.draft;
    return (
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(price);
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customer_company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Gestión de Facturas
          </h3>
          <p className="text-muted-foreground text-sm">
            Crea y envía facturas con carta de presentación formal
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Factura
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Factura</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6">
              {/* Left column - Customer data */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground border-b border-border pb-2">
                  Datos del Cliente
                </h4>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newInvoice.customer_email}
                    onChange={e => setNewInvoice({ ...newInvoice, customer_email: e.target.value })}
                    placeholder="cliente@empresa.com"
                  />
                </div>
                <div>
                  <Label>Nombre Contacto</Label>
                  <Input
                    value={newInvoice.customer_name}
                    onChange={e => setNewInvoice({ ...newInvoice, customer_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Empresa</Label>
                  <Input
                    value={newInvoice.customer_company}
                    onChange={e => setNewInvoice({ ...newInvoice, customer_company: e.target.value })}
                  />
                </div>
                <div>
                  <Label>CIF/NIF</Label>
                  <Input
                    value={newInvoice.customer_tax_id}
                    onChange={e => setNewInvoice({ ...newInvoice, customer_tax_id: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Dirección</Label>
                  <Textarea
                    value={newInvoice.customer_address}
                    onChange={e => setNewInvoice({ ...newInvoice, customer_address: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>IVA (%)</Label>
                    <Input
                      type="number"
                      value={newInvoice.tax_rate}
                      onChange={e => setNewInvoice({ ...newInvoice, tax_rate: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Días Vencimiento</Label>
                    <Input
                      type="number"
                      value={newInvoice.due_days}
                      onChange={e => setNewInvoice({ ...newInvoice, due_days: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* Right column - Items and Cover letter */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground border-b border-border pb-2">
                  Módulos a Facturar
                </h4>
                <div className="flex gap-2">
                  <Select
                    value={newItem.module_key}
                    onValueChange={val => setNewItem({ ...newItem, module_key: val })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar módulo" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map(m => (
                        <SelectItem key={m.module_key} value={m.module_key}>
                          {m.module_name} - {formatPrice(m.base_price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    value={newItem.quantity}
                    onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-20"
                  />
                  <Button onClick={addItemToInvoice} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Items list */}
                <div className="border border-border rounded-lg p-3 max-h-40 overflow-y-auto">
                  {invoiceItems.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      Añade módulos a la factura
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {invoiceItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-foreground">
                            {item.module_name} x{item.quantity}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-primary">{formatPrice(item.total)}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeItem(idx)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA ({newInvoice.tax_rate}%)</span>
                    <span className="text-foreground">{formatPrice(taxAmount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary text-lg">{formatPrice(total)}</span>
                  </div>
                </div>

                <div>
                  <Label>Carta de Presentación</Label>
                  <Textarea
                    value={newInvoice.cover_letter}
                    onChange={e => setNewInvoice({ ...newInvoice, cover_letter: e.target.value })}
                    className="text-sm"
                    rows={6}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="border-slate-600">
                Cancelar
              </Button>
              <Button 
                onClick={createInvoice} 
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={!newInvoice.customer_email || invoiceItems.length === 0}
              >
                <Receipt className="w-4 h-4 mr-2" />
                Crear Factura
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice list */}
        <Card className="lg:col-span-1 bg-slate-900/50 border-slate-700">
          <CardHeader className="pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar facturas..."
                className="pl-10 bg-slate-800 border-slate-600"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {loading ? (
                <p className="text-center text-slate-400 py-8">Cargando...</p>
              ) : filteredInvoices.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No hay facturas</p>
              ) : (
                <div className="space-y-2">
                  {filteredInvoices.map(invoice => (
                    <div
                      key={invoice.id}
                      onClick={() => setSelectedInvoice(invoice)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedInvoice?.id === invoice.id
                          ? 'bg-emerald-500/10 border-emerald-500'
                          : 'border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-sm text-white">
                          {invoice.invoice_number}
                        </span>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-sm text-slate-400 truncate">
                        {invoice.customer_company || invoice.customer_name || invoice.customer_email}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-500">
                          {new Date(invoice.issue_date).toLocaleDateString('es-ES')}
                        </span>
                        <span className="text-sm font-semibold text-emerald-400">
                          {formatPrice(invoice.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Invoice detail */}
        <Card className="lg:col-span-2 bg-slate-900/50 border-slate-700">
          {selectedInvoice ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Receipt className="w-5 h-5" />
                      {selectedInvoice.invoice_number}
                    </CardTitle>
                    <p className="text-sm text-slate-400 mt-1">
                      Emitida: {new Date(selectedInvoice.issue_date).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedInvoice.status)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => saveInvoice(selectedInvoice)}
                      className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Guardar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => printInvoice(selectedInvoice)}
                      className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                    >
                      <Printer className="w-4 h-4 mr-1" />
                      Imprimir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteInvoice(selectedInvoice)}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar
                    </Button>
                    {selectedInvoice.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => sendInvoice(selectedInvoice)}
                        disabled={isSending}
                        className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        {isSending ? 'Enviando...' : 'Enviar'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Customer info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Cliente</p>
                    <p className="text-white font-medium">{selectedInvoice.customer_company || selectedInvoice.customer_name || '-'}</p>
                    <p className="text-sm text-slate-400">{selectedInvoice.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">CIF/NIF</p>
                    <p className="text-white">{selectedInvoice.customer_tax_id || '-'}</p>
                    <p className="text-sm text-slate-400">{selectedInvoice.customer_address || '-'}</p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="font-medium text-white mb-3">Detalle</h4>
                  <div className="border border-slate-700 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-800/50">
                        <tr>
                          <th className="text-left text-xs text-slate-400 p-3">Módulo</th>
                          <th className="text-center text-xs text-slate-400 p-3">Cant.</th>
                          <th className="text-right text-xs text-slate-400 p-3">Precio</th>
                          <th className="text-right text-xs text-slate-400 p-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedInvoice.items || []).map((item: InvoiceItem, idx: number) => (
                          <tr key={idx} className="border-t border-slate-700">
                            <td className="p-3 text-white">{item.module_name}</td>
                            <td className="p-3 text-center text-slate-300">{item.quantity}</td>
                            <td className="p-3 text-right text-slate-300">{formatPrice(item.unit_price)}</td>
                            <td className="p-3 text-right text-emerald-400 font-medium">{formatPrice(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2 bg-slate-800/50 p-4 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Subtotal</span>
                      <span className="text-white">{formatPrice(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">IVA ({selectedInvoice.tax_rate}%)</span>
                      <span className="text-white">{formatPrice(selectedInvoice.tax_amount)}</span>
                    </div>
                    <Separator className="bg-slate-700" />
                    <div className="flex justify-between font-bold text-lg">
                      <span className="text-white">Total</span>
                      <span className="text-emerald-400">{formatPrice(selectedInvoice.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-slate-800/30 rounded-lg">
                    <p className="text-slate-500">Fecha Emisión</p>
                    <p className="text-white">{new Date(selectedInvoice.issue_date).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div className="p-3 bg-slate-800/30 rounded-lg">
                    <p className="text-slate-500">Fecha Vencimiento</p>
                    <p className="text-white">
                      {selectedInvoice.due_date 
                        ? new Date(selectedInvoice.due_date).toLocaleDateString('es-ES')
                        : '-'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-800/30 rounded-lg">
                    <p className="text-slate-500">Enviada</p>
                    <p className="text-white">
                      {selectedInvoice.sent_at 
                        ? new Date(selectedInvoice.sent_at).toLocaleDateString('es-ES')
                        : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center text-slate-500">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Selecciona una factura para ver los detalles</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};
