import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, 
  Download, 
  Check, 
  X, 
  Users, 
  Building2,
  Sparkles,
  Shield,
  Zap,
  FileText,
  Mail,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Module {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  pricePerUser: number;
  category: 'core' | 'addon' | 'premium';
  icon: string;
}

interface Addon {
  id: string;
  name: string;
  price: number;
  description: string;
}

const modules: Module[] = [
  { id: 'crm', name: 'CRM Comercial', description: 'Gestión de clientes y oportunidades', basePrice: 29, pricePerUser: 5, category: 'core', icon: '👥' },
  { id: 'erp', name: 'ERP Empresarial', description: 'Contabilidad, facturación y compras', basePrice: 49, pricePerUser: 8, category: 'core', icon: '📊' },
  { id: 'rrhh', name: 'RRHH & Nóminas', description: 'Gestión de personal y nóminas', basePrice: 39, pricePerUser: 6, category: 'core', icon: '👔' },
  { id: 'gis', name: 'GIS Territorial', description: 'Mapas y geolocalización', basePrice: 25, pricePerUser: 4, category: 'addon', icon: '🗺️' },
  { id: 'bi', name: 'Business Intelligence', description: 'Dashboards y analytics', basePrice: 35, pricePerUser: 5, category: 'addon', icon: '📈' },
  { id: 'ai', name: 'IA Avanzada', description: 'Predicciones y automatizaciones', basePrice: 59, pricePerUser: 10, category: 'premium', icon: '🤖' },
  { id: 'compliance', name: 'Compliance Suite', description: 'GDPR, auditorías y blockchain', basePrice: 45, pricePerUser: 7, category: 'premium', icon: '🛡️' },
  { id: 'api', name: 'API Enterprise', description: 'Integraciones ilimitadas', basePrice: 99, pricePerUser: 0, category: 'premium', icon: '🔌' },
];

const addons: Addon[] = [
  { id: 'support_premium', name: 'Soporte Premium 24/7', price: 199, description: 'Atención prioritaria sin esperas' },
  { id: 'training', name: 'Formación Personalizada', price: 499, description: '10h de formación para tu equipo' },
  { id: 'migration', name: 'Migración de Datos', price: 299, description: 'Importamos tus datos actuales' },
  { id: 'sla', name: 'SLA 99.9%', price: 149, description: 'Garantía de disponibilidad' },
  { id: 'backup', name: 'Backup Diario', price: 49, description: 'Copias de seguridad automáticas' },
];

const billingCycles = [
  { id: 'monthly', name: 'Mensual', discount: 0 },
  { id: 'annual', name: 'Anual', discount: 20 },
  { id: 'perpetual', name: 'Perpetuo', discount: 0, multiplier: 24 },
];

export function QuotationCalculator() {
  const [selectedModules, setSelectedModules] = useState<string[]>(['crm']);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [usersCount, setUsersCount] = useState(5);
  const [billingCycle, setBillingCycle] = useState('annual');
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '', company: '' });
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const pricing = useMemo(() => {
    const cycle = billingCycles.find(c => c.id === billingCycle) || billingCycles[0];
    
    // Calculate modules cost
    const modulesCost = selectedModules.reduce((total, modId) => {
      const mod = modules.find(m => m.id === modId);
      if (!mod) return total;
      return total + mod.basePrice + (mod.pricePerUser * usersCount);
    }, 0);

    // Calculate addons cost
    const addonsCost = selectedAddons.reduce((total, addId) => {
      const addon = addons.find(a => a.id === addId);
      return total + (addon?.price || 0);
    }, 0);

    const subtotal = modulesCost + addonsCost;
    
    // Volume discount
    let volumeDiscount = 0;
    if (usersCount >= 50) volumeDiscount = 25;
    else if (usersCount >= 25) volumeDiscount = 15;
    else if (usersCount >= 10) volumeDiscount = 10;
    else if (usersCount >= 5) volumeDiscount = 5;

    // Cycle discount
    const cycleDiscount = cycle.discount;
    const totalDiscount = Math.min(volumeDiscount + cycleDiscount, 40); // Max 40%

    const discountAmount = subtotal * (totalDiscount / 100);
    let finalPrice = subtotal - discountAmount;

    // Perpetual multiplier
    if (cycle.id === 'perpetual') {
      finalPrice = finalPrice * (cycle.multiplier || 24);
    }

    return {
      modulesCost,
      addonsCost,
      subtotal,
      volumeDiscount,
      cycleDiscount,
      totalDiscount,
      discountAmount,
      finalPrice,
      pricePerUser: selectedModules.length > 0 ? finalPrice / usersCount : 0,
      isPerpetual: cycle.id === 'perpetual',
    };
  }, [selectedModules, selectedAddons, usersCount, billingCycle]);

  const generatePDF = useCallback(async () => {
    if (!contactInfo.name || !contactInfo.email) {
      toast.error('Por favor, completa el nombre y email de contacto');
      return;
    }

    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('ObelixCRM', 20, 25);
      doc.setFontSize(12);
      doc.text('Propuesta Comercial Personalizada', 20, 35);

      // Date and Quote Number
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      const today = new Date();
      const quoteNumber = `QT-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      doc.text(`Fecha: ${today.toLocaleDateString('es-ES')}`, pageWidth - 60, 50);
      doc.text(`Referencia: ${quoteNumber}`, pageWidth - 60, 56);

      // Client Info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Datos del Cliente', 20, 55);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Empresa: ${contactInfo.company || 'N/A'}`, 20, 63);
      doc.text(`Contacto: ${contactInfo.name}`, 20, 69);
      doc.text(`Email: ${contactInfo.email}`, 20, 75);
      doc.text(`Teléfono: ${contactInfo.phone || 'N/A'}`, 20, 81);

      // Modules Table
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Módulos Seleccionados', 20, 95);

      const selectedModulesList = selectedModules.map(modId => {
        const mod = modules.find(m => m.id === modId);
        if (!mod) return null;
        const cost = mod.basePrice + (mod.pricePerUser * usersCount);
        return [mod.name, mod.description, `${usersCount} usuarios`, `${cost.toFixed(2)}€/mes`];
      }).filter(Boolean);

      autoTable(doc, {
        startY: 100,
        head: [['Módulo', 'Descripción', 'Usuarios', 'Precio']],
        body: selectedModulesList as string[][],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Addons Table
      if (selectedAddons.length > 0) {
        const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Servicios Adicionales', 20, finalY + 15);

        const selectedAddonsList = selectedAddons.map(addId => {
          const addon = addons.find(a => a.id === addId);
          if (!addon) return null;
          return [addon.name, addon.description, `${addon.price.toFixed(2)}€/mes`];
        }).filter(Boolean);

        autoTable(doc, {
          startY: finalY + 20,
          head: [['Servicio', 'Descripción', 'Precio']],
          body: selectedAddonsList as string[][],
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94] },
        });
      }

      // Pricing Summary
      const summaryY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
      doc.setFillColor(245, 245, 245);
      doc.rect(20, summaryY, pageWidth - 40, 60, 'F');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen de Precios', 25, summaryY + 10);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Subtotal: ${pricing.subtotal.toFixed(2)}€/mes`, 25, summaryY + 22);
      doc.text(`Descuento por volumen: ${pricing.volumeDiscount}%`, 25, summaryY + 30);
      doc.text(`Descuento ciclo de facturación: ${pricing.cycleDiscount}%`, 25, summaryY + 38);
      doc.setTextColor(220, 38, 38);
      doc.text(`Ahorro total: -${pricing.discountAmount.toFixed(2)}€/mes`, 25, summaryY + 46);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const priceLabel = pricing.isPerpetual ? 'Precio Total (Licencia Perpetua):' : 'Precio Final:';
      const priceUnit = pricing.isPerpetual ? '' : '/mes';
      doc.text(`${priceLabel} ${pricing.finalPrice.toFixed(2)}€${priceUnit}`, pageWidth - 90, summaryY + 52);

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      doc.text('Esta propuesta es válida por 30 días. Los precios no incluyen IVA.', 20, 280);
      doc.text('ObelixCRM - www.obelixcrm.com - info@obelixcrm.com', 20, 286);

      // Save PDF
      doc.save(`Propuesta_ObelixCRM_${quoteNumber}.pdf`);
      toast.success('PDF generado correctamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedModules, selectedAddons, usersCount, pricing, contactInfo]);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Configuration Panel */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calculadora de Cotización
            </CardTitle>
            <CardDescription>
              Configura tu solución personalizada y genera una propuesta profesional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="modules">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="modules">Módulos</TabsTrigger>
                <TabsTrigger value="addons">Servicios</TabsTrigger>
                <TabsTrigger value="contact">Contacto</TabsTrigger>
              </TabsList>

              <TabsContent value="modules" className="space-y-6 mt-6">
                {/* Users Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Número de Usuarios
                    </Label>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {usersCount}
                    </Badge>
                  </div>
                  <Slider
                    value={[usersCount]}
                    onValueChange={([value]) => setUsersCount(value)}
                    min={1}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 usuario</span>
                    <span>100 usuarios</span>
                  </div>
                </div>

                <Separator />

                {/* Billing Cycle */}
                <div className="space-y-3">
                  <Label>Ciclo de Facturación</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {billingCycles.map((cycle) => (
                      <Button
                        key={cycle.id}
                        variant={billingCycle === cycle.id ? 'default' : 'outline'}
                        className="relative"
                        onClick={() => setBillingCycle(cycle.id)}
                      >
                        {cycle.name}
                        {cycle.discount > 0 && (
                          <Badge className="absolute -top-2 -right-2 text-xs" variant="destructive">
                            -{cycle.discount}%
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Modules Grid */}
                <div className="space-y-3">
                  <Label>Selecciona Módulos</Label>
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="grid gap-3">
                      {modules.map((mod) => (
                        <motion.div
                          key={mod.id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <Card
                            className={`cursor-pointer transition-colors ${
                              selectedModules.includes(mod.id)
                                ? 'border-primary bg-primary/5'
                                : 'hover:border-muted-foreground/50'
                            }`}
                            onClick={() => toggleModule(mod.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{mod.icon}</span>
                                  <div>
                                    <div className="font-medium flex items-center gap-2">
                                      {mod.name}
                                      <Badge variant="outline" className="text-xs">
                                        {mod.category}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {mod.description}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className="font-semibold">{mod.basePrice}€</div>
                                    <div className="text-xs text-muted-foreground">
                                      +{mod.pricePerUser}€/usuario
                                    </div>
                                  </div>
                                  {selectedModules.includes(mod.id) ? (
                                    <Check className="h-5 w-5 text-primary" />
                                  ) : (
                                    <div className="h-5 w-5 rounded-full border-2" />
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="addons" className="space-y-4 mt-6">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid gap-3">
                    {addons.map((addon) => (
                      <Card
                        key={addon.id}
                        className={`cursor-pointer transition-colors ${
                          selectedAddons.includes(addon.id)
                            ? 'border-green-500 bg-green-500/5'
                            : 'hover:border-muted-foreground/50'
                        }`}
                        onClick={() => toggleAddon(addon.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{addon.name}</div>
                              <p className="text-sm text-muted-foreground">{addon.description}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="font-semibold">{addon.price}€/mes</div>
                              <Switch checked={selectedAddons.includes(addon.id)} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 mt-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre *</Label>
                      <Input
                        id="name"
                        value={contactInfo.name}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactInfo.email}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Empresa</Label>
                      <Input
                        id="company"
                        value={contactInfo.company}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Nombre de tu empresa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={contactInfo.phone}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+34 XXX XXX XXX"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Summary */}
      <div className="space-y-6">
        <Card className="sticky top-4">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Resumen de Precios
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Módulos ({selectedModules.length})</span>
                <span>{pricing.modulesCost.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Servicios ({selectedAddons.length})</span>
                <span>{pricing.addonsCost.toFixed(2)}€</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{pricing.subtotal.toFixed(2)}€/mes</span>
              </div>
            </div>

            {pricing.totalDiscount > 0 && (
              <div className="p-3 bg-green-500/10 rounded-lg">
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    Descuento total ({pricing.totalDiscount}%)
                  </span>
                  <span>-{pricing.discountAmount.toFixed(2)}€</span>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-1">
              <div className="flex justify-between text-2xl font-bold">
                <span>Total</span>
                <span className="text-primary">
                  {pricing.finalPrice.toFixed(2)}€
                  {!pricing.isPerpetual && <span className="text-sm font-normal">/mes</span>}
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Por usuario</span>
                <span>{pricing.pricePerUser.toFixed(2)}€</span>
              </div>
            </div>

            {pricing.isPerpetual && (
              <Badge variant="secondary" className="w-full justify-center">
                <Shield className="h-3 w-3 mr-1" />
                Licencia Perpetua - Pago Único
              </Badge>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              size="lg"
              onClick={generatePDF}
              disabled={isGenerating || selectedModules.length === 0}
            >
              {isGenerating ? (
                <>Generando...</>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Generar Propuesta PDF
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-green-500" />
                Sin permanencia
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-green-500" />
                Soporte incluido
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-green-500" />
                Actualizaciones gratuitas
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-green-500" />
                Migración asistida
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default QuotationCalculator;
