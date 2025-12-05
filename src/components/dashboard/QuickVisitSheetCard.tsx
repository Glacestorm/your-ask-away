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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  FileText, X, Building2, User, CreditCard, Landmark, Shield, TrendingUp, BarChart3,
  Target, Save, ChevronRight, AlertCircle, Calendar, Edit2
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

interface VisitSheetData {
  id: string;
  visit_id: string;
  company_id: string;
  gestor_id: string;
  fecha: string;
  tipo_cliente?: string;
  tipo_visita?: string;
  persona_contacto?: string;
  cargo_contacto?: string;
  telefono_contacto?: string;
  email_contacto?: string;
  notas_gestor?: string;
  probabilidad_cierre?: number;
  potencial_anual_estimado?: number;
  proxima_cita?: string;
  productos_servicios?: any;
  diagnostico_inicial?: any[];
}

interface QuickVisitSheetCardProps {
  className?: string;
  editSheet?: VisitSheetData | null;
  onEditComplete?: () => void;
}

interface ValidationErrors {
  company?: string;
  fechaInicio?: string;
  personaContacto?: string;
  tipoVisita?: string;
  vinculacion?: string;
}

export function QuickVisitSheetCard({ className, editSheet, onEditComplete }: QuickVisitSheetCardProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(!!editSheet);
  const [isHovered, setIsHovered] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);
  const [visitSheetsCount, setVisitSheetsCount] = useState(0);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isEditMode, setIsEditMode] = useState(!!editSheet);
  const [editVisitId, setEditVisitId] = useState<string | null>(editSheet?.visit_id || null);
  const [editSheetId, setEditSheetId] = useState<string | null>(editSheet?.id || null);

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

  // Load edit data when provided
  useEffect(() => {
    if (editSheet) {
      setIsExpanded(true);
      setIsEditMode(true);
      setEditVisitId(editSheet.visit_id);
      setEditSheetId(editSheet.id);
      setSelectedCompanyId(editSheet.company_id);
      
      // Load form data from editSheet
      setFormData(prev => ({
        ...prev,
        fechaInicio: editSheet.fecha ? new Date(editSheet.fecha) : new Date(),
        tipoCliente: editSheet.tipo_cliente === 'Empresa' ? 'empresa' : 'personal',
        tipoVisita: editSheet.tipo_visita === 'TPV' ? 'tpv' : 'visita_360',
        personaContacto: editSheet.persona_contacto || '',
        cargoContacto: editSheet.cargo_contacto || '',
        telefonoLaboral: editSheet.telefono_contacto || '',
        emailLaboral: editSheet.email_contacto || '',
      }));
      
      setObservaciones(prev => ({
        ...prev,
        observacionesGestor: editSheet.notas_gestor || '',
        gradoConsecucion: editSheet.probabilidad_cierre?.toString() || '',
        importePropuesto: editSheet.potencial_anual_estimado?.toString() || '',
        proximaCita: editSheet.proxima_cita ? new Date(editSheet.proxima_cita) : undefined,
      }));

      // Load products if available
      if (editSheet.productos_servicios) {
        if (editSheet.productos_servicios.tpv) {
          setProductosTPV(editSheet.productos_servicios.tpv);
        }
        if (editSheet.productos_servicios.estandar) {
          setProductosEstandar(editSheet.productos_servicios.estandar);
        }
        if (editSheet.productos_servicios.servicios) {
          setServicios(editSheet.productos_servicios.servicios);
        }
      }

      // Load diagnostico
      if (editSheet.diagnostico_inicial && Array.isArray(editSheet.diagnostico_inicial)) {
        const necesidad = editSheet.diagnostico_inicial.find((d: any) => d.label === 'Necesidad Principal');
        const producto = editSheet.diagnostico_inicial.find((d: any) => d.label === 'Producto Ofrecido');
        setObservaciones(prev => ({
          ...prev,
          necesidadPrincipal: necesidad?.value || '',
          productoOfrecido: producto?.value || '',
        }));
      }
    }
  }, [editSheet]);

  useEffect(() => {
    if (user) {
      loadCompanies();
      loadVisitSheetsCount();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCompanyId && !isEditMode) {
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
    } else if (selectedCompanyId && isEditMode) {
      const company = companies.find(c => c.id === selectedCompanyId);
      if (company) setSelectedCompany(company);
    }
  }, [selectedCompanyId, companies, isEditMode]);

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

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (!selectedCompanyId) {
      newErrors.company = 'Selecciona una empresa';
    }
    
    if (!formData.fechaInicio) {
      newErrors.fechaInicio = 'La fecha es obligatoria';
    }
    
    if (!formData.personaContacto.trim()) {
      newErrors.personaContacto = 'La persona de contacto es obligatoria';
    }

    // Validar que la suma de vinculación sea exactamente 100% si hay algún valor
    const vinculacionSum = parseInt(vinculacion.anbank || '0') + 
                           parseInt(vinculacion.morabanc || '0') + 
                           parseInt(vinculacion.creand || '0');
    const hasVinculacionData = vinculacion.anbank || vinculacion.morabanc || vinculacion.creand;
    
    if (hasVinculacionData && vinculacionSum !== 100) {
      newErrors.vinculacion = `La suma de porcentajes debe ser exactamente 100% (actual: ${vinculacionSum}%)`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateForm();
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
    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }

    // Mark all fields as touched
    setTouched({ company: true, fechaInicio: true, personaContacto: true, vinculacion: true });

    if (!validateForm()) {
      toast.error('Por favor, completa los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      if (isEditMode && editVisitId && editSheetId) {
        // Update existing sheet
        const { error: sheetError } = await supabase
          .from('visit_sheets')
          .update({
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
          })
          .eq('id', editSheetId);

        if (sheetError) throw sheetError;

        // Update visit
        await supabase
          .from('visits')
          .update({
            visit_date: format(formData.fechaInicio, 'yyyy-MM-dd'),
            notes: observaciones.notasReunion,
          })
          .eq('id', editVisitId);

        toast.success('Ficha de visita actualizada correctamente');
        if (onEditComplete) onEditComplete();
      } else {
        // Create new visit and sheet
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
      }

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
    setErrors({});
    setTouched({});
    setIsEditMode(false);
    setEditVisitId(null);
    setEditSheetId(null);
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
    setProductosTPV({
      tpvOrdinario: { entidad: '', importe: '', pedido: false, ofrecido: false },
      tpvMail: { entidad: '', importe: '', pedido: false, ofrecido: false, contraprestacion: 'ninguna', contraImporte: '' },
      tpvVirtual: { entidad: '', importe: '', pedido: false, ofrecido: false, contraprestacion: 'ninguna', contraImporte: '' },
      tpvMoney: { entidad: '', importe: '', pedido: false, ofrecido: false, contraprestacion: 'ninguna', contraImporte: '' },
      tpvBizum: { entidad: '', importe: '', pedido: false, ofrecido: false },
    });
    setProductosEstandar({
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
    setServicios({
      bancaOnline: { pedido: false, ofrecido: false },
      nominas: { pedido: false, ofrecido: false },
      seguroVida: { tipo: '', importe: '' },
      seguroSalud: {
        piam: { tipo: '' },
        creandSalutPlus: { tipo: '' },
        creandSalut: { tipo: '' },
      },
      planJubilacion: '',
      planPension: '',
      apiEmpresas: { pedido: false, ofrecido: false, contactoInformatico: '', contactoContable: '' },
    });
  };

  const handleClose = () => {
    setIsExpanded(false);
    if (isEditMode && onEditComplete) {
      resetForm();
      onEditComplete();
    }
  };

  // Error message component
  const ErrorMessage = ({ error }: { error?: string }) => {
    if (!error) return null;
    return (
      <div className="flex items-center gap-1 text-destructive text-xs mt-1">
        <AlertCircle className="h-3 w-3" />
        <span>{error}</span>
      </div>
    );
  };

  // Required field label
  const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
    <Label className="flex items-center gap-1">
      {children}
      <span className="text-destructive">*</span>
    </Label>
  );

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
              {isEditMode ? <Edit2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle className="text-xl">
                {isEditMode ? 'Editar Ficha de Visita' : 'Nueva Ficha de Visita Comercial'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {isEditMode ? 'Modificar registro existente' : 'Registro completo de visita bancaria'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <span className="text-destructive mr-1">*</span> Campos obligatorios
            </Badge>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="p-6 space-y-6">
            {/* Company Selection */}
            <div className="space-y-3">
              <RequiredLabel>
                <Building2 className="h-4 w-4 text-primary mr-1" />
                Seleccionar Empresa
              </RequiredLabel>
              <Select 
                value={selectedCompanyId} 
                onValueChange={(v) => {
                  setSelectedCompanyId(v);
                  setTouched(prev => ({ ...prev, company: true }));
                }}
                disabled={isEditMode}
              >
                <SelectTrigger className={cn(touched.company && errors.company && "border-destructive")}>
                  <SelectValue placeholder="Buscar empresa..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {touched.company && <ErrorMessage error={errors.company} />}
            </div>

            <Accordion type="multiple" defaultValue={["datos-generales"]} className="space-y-3">
              {/* 1. Datos Generales */}
              <AccordionItem value="datos-generales" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-blue-500" />
                    <span className="font-semibold">1. Datos Generales</span>
                    {(touched.personaContacto && errors.personaContacto) && (
                      <Badge variant="destructive" className="ml-2 text-xs">Campos incompletos</Badge>
                    )}
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
                      <RequiredLabel>Fecha Inicio Visita</RequiredLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            className={cn(
                              "w-full justify-start",
                              touched.fechaInicio && errors.fechaInicio && "border-destructive"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {format(formData.fechaInicio, 'dd/MM/yyyy')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={formData.fechaInicio}
                            onSelect={d => {
                              if (d) {
                                setFormData(p => ({ ...p, fechaInicio: d }));
                                setTouched(prev => ({ ...prev, fechaInicio: true }));
                              }
                            }}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      {touched.fechaInicio && <ErrorMessage error={errors.fechaInicio} />}
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
                      <RequiredLabel>Persona de Contacto</RequiredLabel>
                      <Input 
                        value={formData.personaContacto} 
                        onChange={e => setFormData(p => ({ ...p, personaContacto: e.target.value }))}
                        onBlur={() => handleBlur('personaContacto')}
                        className={cn(touched.personaContacto && errors.personaContacto && "border-destructive")}
                        placeholder="Nombre de la persona de contacto"
                      />
                      {touched.personaContacto && <ErrorMessage error={errors.personaContacto} />}
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
                    <div className="p-3 rounded-lg bg-muted/50 space-y-3">
                      <div className="font-medium text-sm">Seguro de Vida</div>
                      <div className="grid grid-cols-2 gap-3">
                        <Select value={servicios.seguroVida.tipo} onValueChange={v => setServicios(p => ({ ...p, seguroVida: { ...p.seguroVida, tipo: v }}))}>
                          <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">Individual</SelectItem>
                            <SelectItem value="familiar">Familiar</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder="Importe (€)" value={servicios.seguroVida.importe} onChange={e => setServicios(p => ({ ...p, seguroVida: { ...p.seguroVida, importe: e.target.value }}))} />
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 space-y-3">
                      <div className="font-medium text-sm">Seguros de Salud</div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">PIAM</Label>
                          <Select value={servicios.seguroSalud.piam.tipo} onValueChange={v => setServicios(p => ({ ...p, seguroSalud: { ...p.seguroSalud, piam: { tipo: v as any }}}))}>
                            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="individual">Individual</SelectItem>
                              <SelectItem value="familiar">Familiar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Creand Salut Plus</Label>
                          <Select value={servicios.seguroSalud.creandSalutPlus.tipo} onValueChange={v => setServicios(p => ({ ...p, seguroSalud: { ...p.seguroSalud, creandSalutPlus: { tipo: v as any }}}))}>
                            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="individual">Individual</SelectItem>
                              <SelectItem value="familiar">Familiar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Creand Salut</Label>
                          <Select value={servicios.seguroSalud.creandSalut.tipo} onValueChange={v => setServicios(p => ({ ...p, seguroSalud: { ...p.seguroSalud, creandSalut: { tipo: v as any }}}))}>
                            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="individual">Individual</SelectItem>
                              <SelectItem value="familiar">Familiar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Plan de Jubilación</Label>
                        <Input value={servicios.planJubilacion} onChange={e => setServicios(p => ({ ...p, planJubilacion: e.target.value }))} placeholder="Importe (€)" />
                      </div>
                      <div className="space-y-2">
                        <Label>Plan de Pensiones</Label>
                        <Input value={servicios.planPension} onChange={e => setServicios(p => ({ ...p, planPension: e.target.value }))} placeholder="Importe (€)" />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 5. Datos Financieros */}
              <AccordionItem value="datos-financieros" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    <span className="font-semibold">5. Datos Financieros (MTR/P&L/TPV)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-3">
                      <Label className="font-medium">MTR</Label>
                      <Input placeholder="2023" value={datosFinancieros.mtr2023} onChange={e => setDatosFinancieros(p => ({ ...p, mtr2023: e.target.value }))} />
                      <Input placeholder="2024" value={datosFinancieros.mtr2024} onChange={e => setDatosFinancieros(p => ({ ...p, mtr2024: e.target.value }))} />
                      <Input placeholder="2025" value={datosFinancieros.mtr2025} onChange={e => setDatosFinancieros(p => ({ ...p, mtr2025: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <Label className="font-medium">P&L</Label>
                      <Input placeholder="2023" value={datosFinancieros.pl2023} onChange={e => setDatosFinancieros(p => ({ ...p, pl2023: e.target.value }))} />
                      <Input placeholder="2024" value={datosFinancieros.pl2024} onChange={e => setDatosFinancieros(p => ({ ...p, pl2024: e.target.value }))} />
                      <Input placeholder="2025" value={datosFinancieros.pl2025} onChange={e => setDatosFinancieros(p => ({ ...p, pl2025: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <Label className="font-medium">TPV</Label>
                      <Input placeholder="2023" value={datosFinancieros.tpv2023} onChange={e => setDatosFinancieros(p => ({ ...p, tpv2023: e.target.value }))} />
                      <Input placeholder="2024" value={datosFinancieros.tpv2024} onChange={e => setDatosFinancieros(p => ({ ...p, tpv2024: e.target.value }))} />
                      <Input placeholder="2025" value={datosFinancieros.tpv2025} onChange={e => setDatosFinancieros(p => ({ ...p, tpv2025: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <Label className="font-medium">Facturación</Label>
                      <Input placeholder="2023" value={datosFinancieros.facturacion2023} onChange={e => setDatosFinancieros(p => ({ ...p, facturacion2023: e.target.value }))} />
                      <Input placeholder="2024" value={datosFinancieros.facturacion2024} onChange={e => setDatosFinancieros(p => ({ ...p, facturacion2024: e.target.value }))} />
                      <Input placeholder="2025" value={datosFinancieros.facturacion2025} onChange={e => setDatosFinancieros(p => ({ ...p, facturacion2025: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <Label className="font-medium">Beneficios</Label>
                      <Input placeholder="2023" value={datosFinancieros.beneficios2023} onChange={e => setDatosFinancieros(p => ({ ...p, beneficios2023: e.target.value }))} />
                      <Input placeholder="2024" value={datosFinancieros.beneficios2024} onChange={e => setDatosFinancieros(p => ({ ...p, beneficios2024: e.target.value }))} />
                      <Input placeholder="2025" value={datosFinancieros.beneficios2025} onChange={e => setDatosFinancieros(p => ({ ...p, beneficios2025: e.target.value }))} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 6. Vinculación */}
              <AccordionItem value="vinculacion" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-pink-500" />
                    <span className="font-semibold">6. Grado de Vinculación</span>
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
                    {(() => {
                      const sum = parseInt(vinculacion.anbank || '0') + parseInt(vinculacion.morabanc || '0') + parseInt(vinculacion.creand || '0');
                      const hasData = vinculacion.anbank || vinculacion.morabanc || vinculacion.creand;
                      if (!hasData) return null;
                      
                      if (sum === 100) {
                        return (
                          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                            <span className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</span>
                            <span>Suma correcta: {sum}%</span>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                          <AlertCircle className="h-4 w-4" />
                          <span>La suma debe ser exactamente 100% (actual: {sum}%)</span>
                        </div>
                      );
                    })()}
                    {errors.vinculacion && touched.vinculacion && (
                      <p className="text-destructive text-xs mt-1">{errors.vinculacion}</p>
                    )}
                    <div className="space-y-2">
                      <Label>Comentarios</Label>
                      <Textarea value={vinculacion.comentarios} onChange={e => setVinculacion(p => ({ ...p, comentarios: e.target.value }))} rows={3} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 7. Observaciones y Éxito */}
              <AccordionItem value="observaciones" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-red-500" />
                    <span className="font-semibold">7. Observaciones y Grado de Éxito</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Necesidad Principal Detectada</Label>
                        <Input value={observaciones.necesidadPrincipal} onChange={e => setObservaciones(p => ({ ...p, necesidadPrincipal: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Producto Ofrecido</Label>
                        <Input value={observaciones.productoOfrecido} onChange={e => setObservaciones(p => ({ ...p, productoOfrecido: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                    <div className="space-y-2">
                      <Label>Notas de la Reunión</Label>
                      <Textarea value={observaciones.notasReunion} onChange={e => setObservaciones(p => ({ ...p, notasReunion: e.target.value }))} rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label>Observaciones del Gestor</Label>
                      <Textarea value={observaciones.observacionesGestor} onChange={e => setObservaciones(p => ({ ...p, observacionesGestor: e.target.value }))} rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Grado de Consecución (%)</Label>
                        <Input type="number" min="0" max="100" value={observaciones.gradoConsecucion} onChange={e => setObservaciones(p => ({ ...p, gradoConsecucion: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Grado de Éxito</Label>
                        <Select value={observaciones.gradoExito} onValueChange={v => setObservaciones(p => ({ ...p, gradoExito: v }))}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="muy_alto">Muy Alto</SelectItem>
                            <SelectItem value="alto">Alto</SelectItem>
                            <SelectItem value="medio">Medio</SelectItem>
                            <SelectItem value="bajo">Bajo</SelectItem>
                            <SelectItem value="muy_bajo">Muy Bajo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : (isEditMode ? 'Actualizar Ficha' : 'Guardar Ficha')}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
