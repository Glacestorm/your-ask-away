import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  FileText, X, Building2, User, Phone, Mail, Calendar, 
  CreditCard, Landmark, Shield, TrendingUp, BarChart3,
  Target, MessageSquare, Save, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Company {
  id: string;
  name: string;
  tax_id: string | null;
  phone: string | null;
  email: string | null;
  sector: string | null;
  bp: string | null;
}

interface QuickVisitSheetCardProps {
  className?: string;
}

export function QuickVisitSheetCard({ className }: QuickVisitSheetCardProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);
  const [visitSheetsCount, setVisitSheetsCount] = useState(0);

  // Datos Generales
  const [formData, setFormData] = useState({
    bp: '',
    fechaInicio: new Date(),
    fechaCierre: undefined as Date | undefined,
    tipoCliente: 'empresa' as 'personal' | 'empresa',
    esClientePotencial: 'cliente' as 'cliente' | 'potencial',
    nombreRazonSocial: '',
    nifCif: '',
    telefonoPersonal: '',
    telefonoLaboral: '',
    emailPersonal: '',
    emailLaboral: '',
    visitaSolicitadaPor: 'gestor' as 'gestor' | 'responsable',
    tipoVisita: 'visita_360' as 'tpv' | 'visita_360',
    personaContacto: '',
    cargoContacto: '',
  });

  // Productos TPV
  const [productosTPV, setProductosTPV] = useState({
    tpvOrdinario: { entidad: '', importe: '', pedido: false, ofrecido: false },
    tpvMail: { entidad: '', importe: '', pedido: false, ofrecido: false, contraprestacion: 'ninguna', contraImporte: '' },
    tpvVirtual: { entidad: '', importe: '', pedido: false, ofrecido: false, contraprestacion: 'ninguna', contraImporte: '' },
    tpvMoney: { entidad: '', importe: '', pedido: false, ofrecido: false, contraprestacion: 'ninguna', contraImporte: '' },
    tpvBizum: { entidad: '', importe: '', pedido: false, ofrecido: false },
  });

  // Productos Estándar
  const [productosEstandar, setProductosEstandar] = useState({
    creditRapid: { entidad: '', importe: '', pedido: false, ofrecido: false },
    prestamoPersonal: { entidad: '', importe: '', pedido: false, ofrecido: false },
    prestamoHipotecario: { entidad: '', importe: '', pedido: false, ofrecido: false },
    poliza: { entidad: '', importe: '', pedido: false, ofrecido: false },
    descuentoComercial: { entidad: '', importe: '', pedido: false, ofrecido: false },
    aval: { entidad: '', importe: '', pedido: false, ofrecido: false },
    mercat: { entidad: '', importe: '', pedido: false, ofrecido: false },
    acciones: { entidad: '', importe: '', pedido: false, ofrecido: false },
    rentaFija: { entidad: '', importe: '', pedido: false, ofrecido: false },
  });

  // Banca Online, Nóminas, Seguros
  const [servicios, setServicios] = useState({
    bancaOnline: { pedido: false, ofrecido: false },
    nominas: { pedido: false, ofrecido: false },
    seguroVida: { tipo: '', importe: '' },
    seguroSalud: {
      piam: { tipo: '' as '' | 'individual' | 'familiar' },
      creandSalutPlus: { tipo: '' as '' | 'individual' | 'familiar' },
      creandSalut: { tipo: '' as '' | 'individual' | 'familiar' },
    },
    planJubilacion: '',
    planPension: '',
    apiEmpresas: { pedido: false, ofrecido: false, contactoInformatico: '', contactoContable: '' },
  });

  // Pasivo y Capital
  const [pasivoCapital, setPasivoCapital] = useState({
    tesoreria: '',
    plazo: '',
    plazoVencimiento: '',
    mercat: '',
    acciones: '',
    rentaFija: '',
    capitalAnbank: '',
    capitalMorabanc: '',
    capitalCreand: '',
    transferenciaCapital: '' as '' | 'cheque' | 'transferencia',
  });

  // Datos Financieros
  const [datosFinancieros, setDatosFinancieros] = useState({
    mtr2023: '', mtr2024: '', mtr2025: '', mesMtr2025: '',
    pl2023: '', pl2024: '', pl2025: '', mesPl2025: '',
    tpv2023: '', tpv2024: '', tpv2025: '',
    eeff2024: '', eeff2025: '', mesEeff2025: '',
    facturacion2023: '', facturacion2024: '', facturacion2025: '',
    beneficios2023: '', beneficios2024: '', beneficios2025: '',
  });

  // Vinculación
  const [vinculacion, setVinculacion] = useState({
    anbank: '',
    morabanc: '',
    creand: '',
    comentarios: '',
  });

  // Observaciones y Éxito
  const [observaciones, setObservaciones] = useState({
    observacionesGestor: '',
    gradoConsecucion: '',
    gradoExito: '',
    criteriosObservados: '',
    proximaCita: undefined as Date | undefined,
    notasReunion: '',
    necesidadPrincipal: '',
    productoOfrecido: '',
    importePropuesto: '',
  });

  useEffect(() => {
    if (user) {
      loadCompanies();
      loadVisitSheetsCount();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCompanyId) {
      const company = companies.find(c => c.id === selectedCompanyId);
      if (company) {
        setSelectedCompany(company);
        setFormData(prev => ({
          ...prev,
          bp: company.bp || '',
          nombreRazonSocial: company.name,
          nifCif: company.tax_id || '',
          telefonoLaboral: company.phone || '',
          emailLaboral: company.email || '',
        }));
      }
    }
  }, [selectedCompanyId, companies]);

  const loadCompanies = async () => {
    const { data } = await supabase
      .from('companies')
      .select('id, name, tax_id, phone, email, sector, bp')
      .order('name');
    if (data) setCompanies(data);
  };

  const loadVisitSheetsCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from('visit_sheets')
      .select('*', { count: 'exact', head: true })
      .eq('gestor_id', user.id);
    setVisitSheetsCount(count || 0);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isExpanded) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateX((y - centerY) / 10);
    setRotateY((centerX - x) / 10);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  const handleSave = async () => {
    if (!user || !selectedCompanyId) {
      toast.error('Selecciona una empresa');
      return;
    }

    setSaving(true);
    try {
      // First create a visit record
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .insert({
          company_id: selectedCompanyId,
          gestor_id: user.id,
          visit_date: format(formData.fechaInicio, 'yyyy-MM-dd'),
          result: 'Pendiente',
          notes: observaciones.notasReunion,
        })
        .select()
        .single();

      if (visitError) throw visitError;

      // Then create the visit sheet
      const { error: sheetError } = await supabase
        .from('visit_sheets')
        .insert({
          visit_id: visitData.id,
          company_id: selectedCompanyId,
          gestor_id: user.id,
          fecha: format(formData.fechaInicio, 'yyyy-MM-dd'),
          tipo_cliente: formData.tipoCliente === 'empresa' ? 'Empresa' : 'Particular',
          tipo_visita: formData.tipoVisita === 'tpv' ? 'TPV' : 'Visita 360°',
          persona_contacto: formData.personaContacto,
          cargo_contacto: formData.cargoContacto,
          telefono_contacto: formData.telefonoLaboral,
          email_contacto: formData.emailLaboral,
          notas_gestor: observaciones.observacionesGestor,
          probabilidad_cierre: parseInt(observaciones.gradoConsecucion) || null,
          potencial_anual_estimado: parseFloat(observaciones.importePropuesto) || null,
          proxima_cita: observaciones.proximaCita ? format(observaciones.proximaCita, 'yyyy-MM-dd') : null,
          productos_servicios: {
            tpv: productosTPV,
            estandar: productosEstandar,
            servicios: servicios,
          },
          diagnostico_inicial: [
            { label: 'Necesidad Principal', value: observaciones.necesidadPrincipal },
            { label: 'Producto Ofrecido', value: observaciones.productoOfrecido },
          ],
        });

      if (sheetError) throw sheetError;

      toast.success('Ficha de visita guardada correctamente');
      resetForm();
      loadVisitSheetsCount();
      setIsExpanded(false);
    } catch (error) {
      console.error('Error saving visit sheet:', error);
      toast.error('Error al guardar la ficha');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedCompanyId('');
    setSelectedCompany(null);
    setFormData({
      bp: '',
      fechaInicio: new Date(),
      fechaCierre: undefined,
      tipoCliente: 'empresa',
      esClientePotencial: 'cliente',
      nombreRazonSocial: '',
      nifCif: '',
      telefonoPersonal: '',
      telefonoLaboral: '',
      emailPersonal: '',
      emailLaboral: '',
      visitaSolicitadaPor: 'gestor',
      tipoVisita: 'visita_360',
      personaContacto: '',
      cargoContacto: '',
    });
    setObservaciones({
      observacionesGestor: '',
      gradoConsecucion: '',
      gradoExito: '',
      criteriosObservados: '',
      proximaCita: undefined,
      notasReunion: '',
      necesidadPrincipal: '',
      productoOfrecido: '',
      importePropuesto: '',
    });
  };

  // Collapsed card view
  if (!isExpanded) {
    return (
      <Card
        className={cn(
          "cursor-pointer transition-all duration-300 hover:shadow-xl border-border/50 bg-gradient-to-br from-card to-card/80",
          className
        )}
        style={{
          transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isHovered ? 1.02 : 1})`,
          transition: 'transform 0.3s ease-out',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setIsHovered(true)}
        onClick={() => setIsExpanded(true)}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <FileText className="h-8 w-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground mb-1">Ficha de Visita</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                Formulario completo para registro de visitas comerciales bancarias
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground mt-1" />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
              {visitSheetsCount} fichas
            </Badge>
            <span className="text-xs text-muted-foreground">Clic para abrir formulario</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Expanded form view
  return (
    <Card className={cn("border-border/50 bg-card", className)}>
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Ficha de Visita Comercial</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Registro completo de visita bancaria</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="p-6 space-y-6">
            {/* Company Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Seleccionar Empresa
              </Label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Buscar empresa..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Accordion type="multiple" defaultValue={["datos-generales"]} className="space-y-3">
              {/* 1. Datos Generales */}
              <AccordionItem value="datos-generales" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-blue-500" />
                    <span className="font-semibold">1. Datos Generales</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>BP (7 cifras)</Label>
                      <Input 
                        value={formData.bp} 
                        onChange={e => setFormData(p => ({ ...p, bp: e.target.value }))}
                        placeholder="1234567"
                        maxLength={7}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Inicio Visita</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <Calendar className="mr-2 h-4 w-4" />
                            {format(formData.fechaInicio, 'dd/MM/yyyy')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={formData.fechaInicio}
                            onSelect={d => d && setFormData(p => ({ ...p, fechaInicio: d }))}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Cliente</Label>
                      <RadioGroup 
                        value={formData.tipoCliente} 
                        onValueChange={v => setFormData(p => ({ ...p, tipoCliente: v as any }))}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="personal" id="personal" />
                          <Label htmlFor="personal" className="cursor-pointer">Personal</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="empresa" id="empresa" />
                          <Label htmlFor="empresa" className="cursor-pointer">Empresa</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label>Es Cliente o Potencial</Label>
                      <RadioGroup 
                        value={formData.esClientePotencial} 
                        onValueChange={v => setFormData(p => ({ ...p, esClientePotencial: v as any }))}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cliente" id="cliente" />
                          <Label htmlFor="cliente" className="cursor-pointer">Cliente</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="potencial" id="potencial" />
                          <Label htmlFor="potencial" className="cursor-pointer">Potencial</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label>Nombre / Razón Social</Label>
                      <Input 
                        value={formData.nombreRazonSocial} 
                        onChange={e => setFormData(p => ({ ...p, nombreRazonSocial: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>NIF / CIF</Label>
                      <Input 
                        value={formData.nifCif} 
                        onChange={e => setFormData(p => ({ ...p, nifCif: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono Personal</Label>
                      <Input 
                        value={formData.telefonoPersonal} 
                        onChange={e => setFormData(p => ({ ...p, telefonoPersonal: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono Laboral</Label>
                      <Input 
                        value={formData.telefonoLaboral} 
                        onChange={e => setFormData(p => ({ ...p, telefonoLaboral: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Personal</Label>
                      <Input 
                        type="email"
                        value={formData.emailPersonal} 
                        onChange={e => setFormData(p => ({ ...p, emailPersonal: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Laboral</Label>
                      <Input 
                        type="email"
                        value={formData.emailLaboral} 
                        onChange={e => setFormData(p => ({ ...p, emailLaboral: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Visita Solicitada Por</Label>
                      <RadioGroup 
                        value={formData.visitaSolicitadaPor} 
                        onValueChange={v => setFormData(p => ({ ...p, visitaSolicitadaPor: v as any }))}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="gestor" id="solicitada-gestor" />
                          <Label htmlFor="solicitada-gestor" className="cursor-pointer">Gestor</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="responsable" id="solicitada-responsable" />
                          <Label htmlFor="solicitada-responsable" className="cursor-pointer">Responsable</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Visita</Label>
                      <RadioGroup 
                        value={formData.tipoVisita} 
                        onValueChange={v => setFormData(p => ({ ...p, tipoVisita: v as any }))}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="tpv" id="tipo-tpv" />
                          <Label htmlFor="tipo-tpv" className="cursor-pointer">TPV</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="visita_360" id="tipo-360" />
                          <Label htmlFor="tipo-360" className="cursor-pointer">Visita 360°</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label>Persona de Contacto</Label>
                      <Input 
                        value={formData.personaContacto} 
                        onChange={e => setFormData(p => ({ ...p, personaContacto: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cargo del Contacto</Label>
                      <Input 
                        value={formData.cargoContacto} 
                        onChange={e => setFormData(p => ({ ...p, cargoContacto: e.target.value }))}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 2. Productos TPV */}
              <AccordionItem value="productos-tpv" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-green-500" />
                    <span className="font-semibold">2. Productos TPV</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4">
                    {Object.entries({
                      tpvOrdinario: 'TPV Ordinario',
                      tpvMail: 'TPV Mail',
                      tpvVirtual: 'TPV Virtual',
                      tpvMoney: 'TPV Money',
                      tpvBizum: 'TPV Bizum',
                    }).map(([key, label]) => (
                      <div key={key} className="p-3 rounded-lg bg-muted/50 space-y-3">
                        <div className="font-medium text-sm">{label}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <Input 
                            placeholder="Entidad"
                            value={(productosTPV as any)[key].entidad}
                            onChange={e => setProductosTPV(p => ({ ...p, [key]: { ...(p as any)[key], entidad: e.target.value }}))}
                          />
                          <Input 
                            placeholder="Importe (€)"
                            type="number"
                            value={(productosTPV as any)[key].importe}
                            onChange={e => setProductosTPV(p => ({ ...p, [key]: { ...(p as any)[key], importe: e.target.value }}))}
                          />
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`${key}-pedido`}
                              checked={(productosTPV as any)[key].pedido}
                              onCheckedChange={c => setProductosTPV(p => ({ ...p, [key]: { ...(p as any)[key], pedido: c }}))}
                            />
                            <Label htmlFor={`${key}-pedido`} className="text-xs">Pedido</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`${key}-ofrecido`}
                              checked={(productosTPV as any)[key].ofrecido}
                              onCheckedChange={c => setProductosTPV(p => ({ ...p, [key]: { ...(p as any)[key], ofrecido: c }}))}
                            />
                            <Label htmlFor={`${key}-ofrecido`} className="text-xs">Ofrecido</Label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 3. Productos Estándar */}
              <AccordionItem value="productos-estandar" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <Landmark className="h-5 w-5 text-purple-500" />
                    <span className="font-semibold">3. Productos Estándar (Activo/Pasivo)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4">
                    {Object.entries({
                      creditRapid: 'Crèdit Ràpid',
                      prestamoPersonal: 'Préstamo Personal',
                      prestamoHipotecario: 'Préstamo Hipotecario',
                      poliza: 'Póliza',
                      descuentoComercial: 'Descuento Comercial',
                      aval: 'Aval',
                      mercat: 'Mercat',
                      acciones: 'Acciones',
                      rentaFija: 'Renta Fija',
                    }).map(([key, label]) => (
                      <div key={key} className="p-3 rounded-lg bg-muted/50 space-y-3">
                        <div className="font-medium text-sm">{label}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <Input 
                            placeholder="Entidad"
                            value={(productosEstandar as any)[key].entidad}
                            onChange={e => setProductosEstandar(p => ({ ...p, [key]: { ...(p as any)[key], entidad: e.target.value }}))}
                          />
                          <Input 
                            placeholder="Importe (€)"
                            type="number"
                            value={(productosEstandar as any)[key].importe}
                            onChange={e => setProductosEstandar(p => ({ ...p, [key]: { ...(p as any)[key], importe: e.target.value }}))}
                          />
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`estandar-${key}-pedido`}
                              checked={(productosEstandar as any)[key].pedido}
                              onCheckedChange={c => setProductosEstandar(p => ({ ...p, [key]: { ...(p as any)[key], pedido: c }}))}
                            />
                            <Label htmlFor={`estandar-${key}-pedido`} className="text-xs">Pedido</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`estandar-${key}-ofrecido`}
                              checked={(productosEstandar as any)[key].ofrecido}
                              onCheckedChange={c => setProductosEstandar(p => ({ ...p, [key]: { ...(p as any)[key], ofrecido: c }}))}
                            />
                            <Label htmlFor={`estandar-${key}-ofrecido`} className="text-xs">Ofrecido</Label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 4. Servicios */}
              <AccordionItem value="servicios" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-cyan-500" />
                    <span className="font-semibold">4. Banca Online, Nóminas, Seguros y Planes</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="font-medium text-sm mb-2">Banca Online</div>
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox checked={servicios.bancaOnline.pedido} onCheckedChange={c => setServicios(p => ({ ...p, bancaOnline: { ...p.bancaOnline, pedido: !!c }}))} />
                            <Label className="text-xs">Pedido</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox checked={servicios.bancaOnline.ofrecido} onCheckedChange={c => setServicios(p => ({ ...p, bancaOnline: { ...p.bancaOnline, ofrecido: !!c }}))} />
                            <Label className="text-xs">Ofrecido</Label>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="font-medium text-sm mb-2">Nóminas</div>
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox checked={servicios.nominas.pedido} onCheckedChange={c => setServicios(p => ({ ...p, nominas: { ...p.nominas, pedido: !!c }}))} />
                            <Label className="text-xs">Pedido</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox checked={servicios.nominas.ofrecido} onCheckedChange={c => setServicios(p => ({ ...p, nominas: { ...p.nominas, ofrecido: !!c }}))} />
                            <Label className="text-xs">Ofrecido</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="font-medium">Seguros Vida</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo Producto</Label>
                          <Input value={servicios.seguroVida.tipo} onChange={e => setServicios(p => ({ ...p, seguroVida: { ...p.seguroVida, tipo: e.target.value }}))} placeholder="Tipo de seguro" />
                        </div>
                        <div className="space-y-2">
                          <Label>Importe (€)</Label>
                          <Input type="number" value={servicios.seguroVida.importe} onChange={e => setServicios(p => ({ ...p, seguroVida: { ...p.seguroVida, importe: e.target.value }}))} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="font-medium">Seguros Salud</div>
                      <div className="grid grid-cols-3 gap-4">
                        {['piam', 'creandSalutPlus', 'creandSalut'].map(seg => (
                          <div key={seg} className="p-3 rounded-lg bg-muted/50">
                            <div className="text-sm font-medium mb-2">{seg === 'piam' ? 'PIAM' : seg === 'creandSalutPlus' ? 'Creand Salut Plus' : 'Creand Salut'}</div>
                            <RadioGroup value={(servicios.seguroSalud as any)[seg].tipo} onValueChange={v => setServicios(p => ({ ...p, seguroSalud: { ...p.seguroSalud, [seg]: { tipo: v }}}))}>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="individual" id={`${seg}-ind`} />
                                <Label htmlFor={`${seg}-ind`} className="text-xs">Individual</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="familiar" id={`${seg}-fam`} />
                                <Label htmlFor={`${seg}-fam`} className="text-xs">Familiar</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Plan Jubilación (€/mes)</Label>
                        <Input type="number" value={servicios.planJubilacion} onChange={e => setServicios(p => ({ ...p, planJubilacion: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Plan Pensión (€/mes)</Label>
                        <Input type="number" value={servicios.planPension} onChange={e => setServicios(p => ({ ...p, planPension: e.target.value }))} />
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/50 space-y-3">
                      <div className="font-medium text-sm">API Empresas</div>
                      <div className="flex gap-4 mb-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox checked={servicios.apiEmpresas.pedido} onCheckedChange={c => setServicios(p => ({ ...p, apiEmpresas: { ...p.apiEmpresas, pedido: !!c }}))} />
                          <Label className="text-xs">Pedido</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox checked={servicios.apiEmpresas.ofrecido} onCheckedChange={c => setServicios(p => ({ ...p, apiEmpresas: { ...p.apiEmpresas, ofrecido: !!c }}))} />
                          <Label className="text-xs">Ofrecido</Label>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="Contacto Informático" value={servicios.apiEmpresas.contactoInformatico} onChange={e => setServicios(p => ({ ...p, apiEmpresas: { ...p.apiEmpresas, contactoInformatico: e.target.value }}))} />
                        <Input placeholder="Contacto Contable" value={servicios.apiEmpresas.contactoContable} onChange={e => setServicios(p => ({ ...p, apiEmpresas: { ...p.apiEmpresas, contactoContable: e.target.value }}))} />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 5. Pasivo y Capital */}
              <AccordionItem value="pasivo-capital" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                    <span className="font-semibold">5. Pasivo y Capital por Entidad</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tesorería (€)</Label>
                      <Input type="number" value={pasivoCapital.tesoreria} onChange={e => setPasivoCapital(p => ({ ...p, tesoreria: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Plazo (€)</Label>
                      <Input type="number" value={pasivoCapital.plazo} onChange={e => setPasivoCapital(p => ({ ...p, plazo: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Vencimiento Plazo</Label>
                      <Input value={pasivoCapital.plazoVencimiento} onChange={e => setPasivoCapital(p => ({ ...p, plazoVencimiento: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Mercat (€)</Label>
                      <Input type="number" value={pasivoCapital.mercat} onChange={e => setPasivoCapital(p => ({ ...p, mercat: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Acciones (€)</Label>
                      <Input type="number" value={pasivoCapital.acciones} onChange={e => setPasivoCapital(p => ({ ...p, acciones: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Renta Fija (€)</Label>
                      <Input type="number" value={pasivoCapital.rentaFija} onChange={e => setPasivoCapital(p => ({ ...p, rentaFija: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Capital Andbank (€)</Label>
                      <Input type="number" value={pasivoCapital.capitalAnbank} onChange={e => setPasivoCapital(p => ({ ...p, capitalAnbank: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Capital Morabanc (€)</Label>
                      <Input type="number" value={pasivoCapital.capitalMorabanc} onChange={e => setPasivoCapital(p => ({ ...p, capitalMorabanc: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Capital Creand (€)</Label>
                      <Input type="number" value={pasivoCapital.capitalCreand} onChange={e => setPasivoCapital(p => ({ ...p, capitalCreand: e.target.value }))} />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label>Transferir Capital a Creand</Label>
                    <RadioGroup value={pasivoCapital.transferenciaCapital} onValueChange={v => setPasivoCapital(p => ({ ...p, transferenciaCapital: v as any }))} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cheque" id="trans-cheque" />
                        <Label htmlFor="trans-cheque">Cheque</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="transferencia" id="trans-transferencia" />
                        <Label htmlFor="trans-transferencia">Transferencia</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 6. Datos Financieros */}
              <AccordionItem value="datos-financieros" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    <span className="font-semibold">6. Datos Financieros (MTR/P&L/TPV/EEFF)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="font-medium text-sm col-span-1"></div>
                      <div className="font-medium text-sm text-center">2023</div>
                      <div className="font-medium text-sm text-center">2024</div>
                      <div className="font-medium text-sm text-center">2025</div>
                    </div>
                    {[
                      { label: 'MTR (€)', keys: ['mtr2023', 'mtr2024', 'mtr2025'] },
                      { label: 'P&L (€)', keys: ['pl2023', 'pl2024', 'pl2025'] },
                      { label: 'TPV (€)', keys: ['tpv2023', 'tpv2024', 'tpv2025'] },
                      { label: 'Facturación (€)', keys: ['facturacion2023', 'facturacion2024', 'facturacion2025'] },
                      { label: 'Beneficios (€)', keys: ['beneficios2023', 'beneficios2024', 'beneficios2025'] },
                    ].map(row => (
                      <div key={row.label} className="grid grid-cols-4 gap-4 items-center">
                        <Label className="text-sm">{row.label}</Label>
                        {row.keys.map(k => (
                          <Input 
                            key={k}
                            type="number" 
                            value={(datosFinancieros as any)[k]} 
                            onChange={e => setDatosFinancieros(p => ({ ...p, [k]: e.target.value }))}
                            className="text-center"
                          />
                        ))}
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label>EEFF 2024 (resumen)</Label>
                        <Textarea value={datosFinancieros.eeff2024} onChange={e => setDatosFinancieros(p => ({ ...p, eeff2024: e.target.value }))} rows={2} />
                      </div>
                      <div className="space-y-2">
                        <Label>EEFF 2025 (resumen)</Label>
                        <Textarea value={datosFinancieros.eeff2025} onChange={e => setDatosFinancieros(p => ({ ...p, eeff2025: e.target.value }))} rows={2} />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 7. Grado de Vinculación */}
              <AccordionItem value="vinculacion" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-orange-500" />
                    <span className="font-semibold">7. Grado de Vinculación</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Andbank (%)</Label>
                        <Input type="number" min="0" max="100" value={vinculacion.anbank} onChange={e => setVinculacion(p => ({ ...p, anbank: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Morabanc (%)</Label>
                        <Input type="number" min="0" max="100" value={vinculacion.morabanc} onChange={e => setVinculacion(p => ({ ...p, morabanc: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Creand (%)</Label>
                        <Input type="number" min="0" max="100" value={vinculacion.creand} onChange={e => setVinculacion(p => ({ ...p, creand: e.target.value }))} />
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Total</span>
                        <Badge variant={
                          (parseInt(vinculacion.anbank || '0') + parseInt(vinculacion.morabanc || '0') + parseInt(vinculacion.creand || '0')) === 100 
                            ? 'default' 
                            : 'destructive'
                        }>
                          {parseInt(vinculacion.anbank || '0') + parseInt(vinculacion.morabanc || '0') + parseInt(vinculacion.creand || '0')}%
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Comentarios sobre Vinculación</Label>
                      <Textarea value={vinculacion.comentarios} onChange={e => setVinculacion(p => ({ ...p, comentarios: e.target.value }))} rows={3} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 8. Observaciones y Éxito */}
              <AccordionItem value="observaciones" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-pink-500" />
                    <span className="font-semibold">8. Observaciones y Grado de Éxito</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Necesidad Principal</Label>
                        <Input value={observaciones.necesidadPrincipal} onChange={e => setObservaciones(p => ({ ...p, necesidadPrincipal: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Producto Ofrecido</Label>
                        <Input value={observaciones.productoOfrecido} onChange={e => setObservaciones(p => ({ ...p, productoOfrecido: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Importe Propuesto (€)</Label>
                        <Input type="number" value={observaciones.importePropuesto} onChange={e => setObservaciones(p => ({ ...p, importePropuesto: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Próxima Cita</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <Calendar className="mr-2 h-4 w-4" />
                              {observaciones.proximaCita ? format(observaciones.proximaCita, 'dd/MM/yyyy') : 'Seleccionar fecha'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={observaciones.proximaCita}
                              onSelect={d => setObservaciones(p => ({ ...p, proximaCita: d }))}
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Grado de Consecución (%)</Label>
                        <Input type="number" min="0" max="100" value={observaciones.gradoConsecucion} onChange={e => setObservaciones(p => ({ ...p, gradoConsecucion: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Grado de Éxito (1-10)</Label>
                        <Input type="number" min="1" max="10" value={observaciones.gradoExito} onChange={e => setObservaciones(p => ({ ...p, gradoExito: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Observaciones del Gestor</Label>
                      <Textarea value={observaciones.observacionesGestor} onChange={e => setObservaciones(p => ({ ...p, observacionesGestor: e.target.value }))} rows={4} placeholder="Observaciones extensas..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Notas de la Reunión</Label>
                      <Textarea value={observaciones.notasReunion} onChange={e => setObservaciones(p => ({ ...p, notasReunion: e.target.value }))} rows={4} />
                    </div>
                    <div className="space-y-2">
                      <Label>Criterios Observados</Label>
                      <Textarea value={observaciones.criteriosObservados} onChange={e => setObservaciones(p => ({ ...p, criteriosObservados: e.target.value }))} rows={2} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button variant="outline" onClick={() => setIsExpanded(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !selectedCompanyId}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar Ficha'}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
