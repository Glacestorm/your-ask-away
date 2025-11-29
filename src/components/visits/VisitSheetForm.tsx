import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Save, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VisitSheetFormProps {
  visitId: string;
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

interface CompanyData {
  id: string;
  name: string;
  tax_id: string | null;
  sector: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  employees: number | null;
  turnover: number | null;
  client_type: string | null;
}

export function VisitSheetForm({ visitId, companyId, open, onOpenChange, onSaved }: VisitSheetFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [existingSheet, setExistingSheet] = useState<any>(null);

  // Datos de la visita
  const [fecha, setFecha] = useState<Date>(new Date());
  const [hora, setHora] = useState<string>('');
  const [duracion, setDuracion] = useState<number>(60);
  const [canal, setCanal] = useState<string>('Presencial');
  const [tipoVisita, setTipoVisita] = useState<string>('Primera visita');

  // Datos del cliente
  const [tipoCliente, setTipoCliente] = useState<string>('Empresa');
  const [personaContacto, setPersonaContacto] = useState<string>('');
  const [cargoContacto, setCargoContacto] = useState<string>('');
  const [telefonoContacto, setTelefonoContacto] = useState<string>('');
  const [emailContacto, setEmailContacto] = useState<string>('');

  // Diagnóstico inicial
  const [diagnosticoInicial, setDiagnosticoInicial] = useState<string[]>([]);

  // Situación financiera empresa
  const [facturacionAnual, setFacturacionAnual] = useState<string>('');
  const [ebitdaEstimado, setEbitdaEstimado] = useState<string>('');
  const [endeudamientoTotal, setEndeudamientoTotal] = useState<string>('');
  const [liquidezDisponible, setLiquidezDisponible] = useState<string>('');
  const [tpvVolumenMensual, setTpvVolumenMensual] = useState<string>('');

  // Situación financiera particular
  const [ingresosNetosMensuales, setIngresosNetosMensuales] = useState<string>('');
  const [ahorroInversionDisponible, setAhorroInversionDisponible] = useState<string>('');
  const [endeudamientoParticular, setEndeudamientoParticular] = useState<string>('');
  const [situacionLaboral, setSituacionLaboral] = useState<string>('');

  // Necesidades detectadas
  const [necesidadesDetectadas, setNecesidadesDetectadas] = useState<string[]>([]);

  // Propuesta de valor
  const [propuestaValor, setPropuestaValor] = useState<string[]>([]);

  // Productos y servicios (campos simplificados)
  const [prestamoPersonal, setPrestamoPersonal] = useState<string>('');
  const [prestamoEmpresa, setPrestamoEmpresa] = useState<string>('');
  const [inversionImporte, setInversionImporte] = useState<string>('');
  const [tpvVolumenPrevisto, setTpvVolumenPrevisto] = useState<string>('');

  // Riesgos y cumplimiento
  const [riesgosCumplimiento, setRiesgosCumplimiento] = useState<string[]>([]);
  const [nivelRiesgo, setNivelRiesgo] = useState<string>('Bajo');
  const [senalesRevisar, setSenalesRevisar] = useState<string>('');

  // Resumen
  const [notasGestor, setNotasGestor] = useState<string>('');

  // Próximos pasos
  const [accion1, setAccion1] = useState<string>('');
  const [fechaAccion1, setFechaAccion1] = useState<Date | undefined>();
  const [accion2, setAccion2] = useState<string>('');
  const [fechaAccion2, setFechaAccion2] = useState<Date | undefined>();
  const [documentacionPendiente, setDocumentacionPendiente] = useState<string>('');
  const [proximaCita, setProximaCita] = useState<Date | undefined>();

  // Evaluación
  const [potencialAnualEstimado, setPotencialAnualEstimado] = useState<string>('');
  const [probabilidadCierre, setProbabilidadCierre] = useState<number>(50);
  const [nivelVinculacionRecomendado, setNivelVinculacionRecomendado] = useState<string>('Medio');
  const [oportunidadesFuturas, setOportunidadesFuturas] = useState<string>('');

  // Seguimiento
  const [proximaLlamada, setProximaLlamada] = useState<Date | undefined>();
  const [revisionCartera, setRevisionCartera] = useState<Date | undefined>();
  const [renovaciones, setRenovaciones] = useState<Date | undefined>();
  const [actualizacionKyc, setActualizacionKyc] = useState<Date | undefined>();

  useEffect(() => {
    if (open && companyId) {
      fetchCompanyData();
      fetchExistingSheet();
    }
  }, [open, companyId]);

  const fetchCompanyData = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) throw error;
      
      if (data) {
        setCompany(data);
        // Autocompletar campos del cliente
        setTelefonoContacto(data.phone || '');
        setEmailContacto(data.email || '');
        setTipoCliente(data.client_type === 'cliente' ? 'Empresa' : 'Particular');
      }
    } catch (error) {
      console.error('Error fetching company:', error);
    }
  };

  const fetchExistingSheet = async () => {
    try {
      const { data, error } = await supabase
        .from('visit_sheets')
        .select('*')
        .eq('visit_id', visitId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setExistingSheet(data);
        loadSheetData(data);
      }
    } catch (error) {
      console.error('Error fetching existing sheet:', error);
    }
  };

  const loadSheetData = (data: any) => {
    // Cargar todos los datos existentes
    if (data.fecha) setFecha(new Date(data.fecha));
    if (data.hora) setHora(data.hora);
    if (data.duracion) setDuracion(data.duracion);
    if (data.canal) setCanal(data.canal);
    if (data.tipo_visita) setTipoVisita(data.tipo_visita);
    if (data.tipo_cliente) setTipoCliente(data.tipo_cliente);
    if (data.persona_contacto) setPersonaContacto(data.persona_contacto);
    if (data.cargo_contacto) setCargoContacto(data.cargo_contacto);
    if (data.telefono_contacto) setTelefonoContacto(data.telefono_contacto);
    if (data.email_contacto) setEmailContacto(data.email_contacto);
    if (data.diagnostico_inicial) setDiagnosticoInicial(data.diagnostico_inicial);
    if (data.facturacion_anual) setFacturacionAnual(data.facturacion_anual.toString());
    if (data.notas_gestor) setNotasGestor(data.notas_gestor);
    if (data.necesidades_detectadas) setNecesidadesDetectadas(data.necesidades_detectadas);
    if (data.propuesta_valor) setPropuestaValor(data.propuesta_valor);
    if (data.probabilidad_cierre) setProbabilidadCierre(data.probabilidad_cierre);
    if (data.nivel_vinculacion_recomendado) setNivelVinculacionRecomendado(data.nivel_vinculacion_recomendado);
    // ... cargar más campos según necesidad
  };

  const handleSave = async () => {
    if (!user || !company) return;

    try {
      setLoading(true);

      const acciones = [];
      if (accion1) acciones.push({ accion: accion1, fecha: fechaAccion1 ? format(fechaAccion1, 'yyyy-MM-dd') : null });
      if (accion2) acciones.push({ accion: accion2, fecha: fechaAccion2 ? format(fechaAccion2, 'yyyy-MM-dd') : null });

      const sheetData = {
        visit_id: visitId,
        company_id: companyId,
        gestor_id: user.id,
        fecha: format(fecha, 'yyyy-MM-dd'),
        hora: hora || null,
        duracion: duracion || null,
        canal,
        tipo_visita: tipoVisita,
        tipo_cliente: tipoCliente,
        persona_contacto: personaContacto || null,
        cargo_contacto: cargoContacto || null,
        telefono_contacto: telefonoContacto || null,
        email_contacto: emailContacto || null,
        diagnostico_inicial: diagnosticoInicial,
        facturacion_anual: facturacionAnual ? parseFloat(facturacionAnual) : null,
        ebitda_estimado: ebitdaEstimado ? parseFloat(ebitdaEstimado) : null,
        endeudamiento_total: endeudamientoTotal ? parseFloat(endeudamientoTotal) : null,
        liquidez_disponible: liquidezDisponible ? parseFloat(liquidezDisponible) : null,
        tpv_volumen_mensual: tpvVolumenMensual ? parseFloat(tpvVolumenMensual) : null,
        ingresos_netos_mensuales: ingresosNetosMensuales ? parseFloat(ingresosNetosMensuales) : null,
        ahorro_inversion_disponible: ahorroInversionDisponible ? parseFloat(ahorroInversionDisponible) : null,
        endeudamiento_particular: endeudamientoParticular ? parseFloat(endeudamientoParticular) : null,
        situacion_laboral: situacionLaboral || null,
        necesidades_detectadas: necesidadesDetectadas,
        propuesta_valor: propuestaValor,
        productos_servicios: {
          prestamo_personal: prestamoPersonal || null,
          prestamo_empresa: prestamoEmpresa || null,
          inversion_importe: inversionImporte || null,
          tpv_volumen_previsto: tpvVolumenPrevisto || null,
        },
        riesgos_cumplimiento: {
          checks: riesgosCumplimiento,
          nivel_riesgo: nivelRiesgo,
          senales_revisar: senalesRevisar || null,
        },
        notas_gestor: notasGestor || null,
        acciones_acordadas: acciones,
        documentacion_pendiente: documentacionPendiente || null,
        proxima_cita: proximaCita ? format(proximaCita, 'yyyy-MM-dd') : null,
        potencial_anual_estimado: potencialAnualEstimado ? parseFloat(potencialAnualEstimado) : null,
        probabilidad_cierre: probabilidadCierre,
        nivel_vinculacion_recomendado: nivelVinculacionRecomendado,
        oportunidades_futuras: oportunidadesFuturas || null,
        proxima_llamada: proximaLlamada ? format(proximaLlamada, 'yyyy-MM-dd') : null,
        revision_cartera: revisionCartera ? format(revisionCartera, 'yyyy-MM-dd') : null,
        renovaciones: renovaciones ? format(renovaciones, 'yyyy-MM-dd') : null,
        actualizacion_kyc: actualizacionKyc ? format(actualizacionKyc, 'yyyy-MM-dd') : null,
      };

      if (existingSheet) {
        const { error } = await supabase
          .from('visit_sheets')
          .update(sheetData)
          .eq('id', existingSheet.id);

        if (error) throw error;
        toast.success('Ficha de visita actualizada correctamente');
      } else {
        const { error } = await supabase
          .from('visit_sheets')
          .insert(sheetData);

        if (error) throw error;
        toast.success('Ficha de visita creada correctamente');
      }

      onOpenChange(false);
      if (onSaved) onSaved();
    } catch (error: any) {
      console.error('Error saving visit sheet:', error);
      toast.error('Error al guardar la ficha de visita');
    } finally {
      setLoading(false);
    }
  };

  const diagnosticoOptions = [
    'Sin incidencias',
    'Pendiente renovación de producto',
    'Necesidad de financiación',
    'Necesidad de inversión / ahorro',
    'Optimización de servicios digitales',
    'Problemas operativos (TPV / cobros / pagos)',
    'Interés en diversificación de productos',
    'Revisión de seguros',
    'Revisar estructura societaria (empresas)',
  ];

  const necesidadesOptions = [
    'Financiación',
    'Inversión / Wealth',
    'Soluciones de cobro (TPV, online, QR, API)',
    'Seguro personal / empresarial',
    'Reestructuración de deuda',
    'Optimización fiscal',
    'Banca online / digitalización',
    'Coberturas para empleados (benefits)',
    'Internacional (pagos, divisas, import/export)',
    'Sostenibilidad / ESG',
  ];

  const propuestaOptions = [
    'Línea de crédito / préstamo',
    'Hipoteca',
    'Leasing / renting',
    'TPV físico',
    'TPV virtual / pasarela pagos',
    'API de pagos / integración ERP',
    'Cuentas empresa / tesorería',
    'Seguros (vida, salud, empresa, comercio)',
    'Planes de pensiones / ahorro',
    'Inversión / Fondos / Carteras',
    'Servicios internacionales (SEPA, Swift, divisas)',
    'Banca online / firma digital',
  ];

  const riesgosOptions = [
    'Documentación actualizada',
    'Declaración FATCA/CRS',
    'Origen de fondos claro',
    'No hay alertas AML',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ficha de Visita Completa - {company?.name}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-8rem)] pr-4">
          <Tabs defaultValue="datos-visita" className="w-full">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="datos-visita">Visita</TabsTrigger>
              <TabsTrigger value="cliente">Cliente</TabsTrigger>
              <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
              <TabsTrigger value="productos">Productos</TabsTrigger>
              <TabsTrigger value="evaluacion">Evaluación</TabsTrigger>
              <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>
            </TabsList>

            {/* Tab 1: Datos de la Visita */}
            <TabsContent value="datos-visita" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">1. Datos de la Visita</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(fecha, "dd/MM/yyyy", { locale: es })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={fecha}
                            onSelect={(date) => date && setFecha(date)}
                            locale={es}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hora">Hora</Label>
                      <Input
                        id="hora"
                        type="time"
                        value={hora}
                        onChange={(e) => setHora(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duracion">Duración (min)</Label>
                      <Input
                        id="duracion"
                        type="number"
                        value={duracion}
                        onChange={(e) => setDuracion(parseInt(e.target.value) || 60)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Canal</Label>
                      <Select value={canal} onValueChange={setCanal}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Presencial">Presencial</SelectItem>
                          <SelectItem value="Teléfono">Teléfono</SelectItem>
                          <SelectItem value="Videollamada">Videollamada</SelectItem>
                          <SelectItem value="Email">Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Visita</Label>
                      <Select value={tipoVisita} onValueChange={setTipoVisita}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Primera visita">Primera visita</SelectItem>
                          <SelectItem value="Seguimiento">Seguimiento</SelectItem>
                          <SelectItem value="Postventa">Postventa</SelectItem>
                          <SelectItem value="Renovación">Renovación</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Datos del Cliente */}
            <TabsContent value="cliente" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">2. Datos del Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Cliente</Label>
                      <Select value={tipoCliente} onValueChange={setTipoCliente}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Particular">Particular</SelectItem>
                          <SelectItem value="Empresa">Empresa</SelectItem>
                          <SelectItem value="Pyme">Pyme</SelectItem>
                          <SelectItem value="Gran Empresa">Gran Empresa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nombre / Razón Social</Label>
                      <Input value={company?.name || ''} disabled />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>NIF / CIF</Label>
                      <Input value={company?.tax_id || ''} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Sector</Label>
                      <Input value={company?.sector || ''} disabled />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Input value={company?.address || ''} disabled />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="persona-contacto">Persona de Contacto</Label>
                      <Input
                        id="persona-contacto"
                        value={personaContacto}
                        onChange={(e) => setPersonaContacto(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cargo-contacto">Cargo</Label>
                      <Input
                        id="cargo-contacto"
                        value={cargoContacto}
                        onChange={(e) => setCargoContacto(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefono-contacto">Teléfono</Label>
                      <Input
                        id="telefono-contacto"
                        value={telefonoContacto}
                        onChange={(e) => setTelefonoContacto(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-contacto">Email</Label>
                      <Input
                        id="email-contacto"
                        type="email"
                        value={emailContacto}
                        onChange={(e) => setEmailContacto(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Diagnóstico */}
            <TabsContent value="diagnostico" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">3. Diagnóstico Inicial</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {diagnosticoOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`diag-${option}`}
                          checked={diagnosticoInicial.includes(option)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setDiagnosticoInicial([...diagnosticoInicial, option]);
                            } else {
                              setDiagnosticoInicial(diagnosticoInicial.filter(i => i !== option));
                            }
                          }}
                        />
                        <label htmlFor={`diag-${option}`} className="text-sm cursor-pointer">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">4. Situación Financiera</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tipoCliente !== 'Particular' ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="facturacion">Facturación Anual (€)</Label>
                          <Input
                            id="facturacion"
                            type="number"
                            value={facturacionAnual}
                            onChange={(e) => setFacturacionAnual(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ebitda">EBITDA Estimado (€)</Label>
                          <Input
                            id="ebitda"
                            type="number"
                            value={ebitdaEstimado}
                            onChange={(e) => setEbitdaEstimado(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="endeudamiento">Endeudamiento Total (€)</Label>
                          <Input
                            id="endeudamiento"
                            type="number"
                            value={endeudamientoTotal}
                            onChange={(e) => setEndeudamientoTotal(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="liquidez">Liquidez Disponible (€)</Label>
                          <Input
                            id="liquidez"
                            type="number"
                            value={liquidezDisponible}
                            onChange={(e) => setLiquidezDisponible(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tpv-volumen">TPV Volumen Mensual (€)</Label>
                        <Input
                          id="tpv-volumen"
                          type="number"
                          value={tpvVolumenMensual}
                          onChange={(e) => setTpvVolumenMensual(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="ingresos">Ingresos Netos Mensuales (€)</Label>
                          <Input
                            id="ingresos"
                            type="number"
                            value={ingresosNetosMensuales}
                            onChange={(e) => setIngresosNetosMensuales(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ahorro">Ahorro / Inversión Disponible (€)</Label>
                          <Input
                            id="ahorro"
                            type="number"
                            value={ahorroInversionDisponible}
                            onChange={(e) => setAhorroInversionDisponible(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="endeudamiento-part">Endeudamiento (€)</Label>
                          <Input
                            id="endeudamiento-part"
                            type="number"
                            value={endeudamientoParticular}
                            onChange={(e) => setEndeudamientoParticular(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="situacion-laboral">Situación Laboral</Label>
                          <Input
                            id="situacion-laboral"
                            value={situacionLaboral}
                            onChange={(e) => setSituacionLaboral(e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">5. Necesidades Detectadas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {necesidadesOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`nec-${option}`}
                        checked={necesidadesDetectadas.includes(option)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNecesidadesDetectadas([...necesidadesDetectadas, option]);
                          } else {
                            setNecesidadesDetectadas(necesidadesDetectadas.filter(i => i !== option));
                          }
                        }}
                      />
                      <label htmlFor={`nec-${option}`} className="text-sm cursor-pointer">
                        {option}
                      </label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 4: Productos */}
            <TabsContent value="productos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">6. Propuesta de Valor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {propuestaOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`prop-${option}`}
                        checked={propuestaValor.includes(option)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPropuestaValor([...propuestaValor, option]);
                          } else {
                            setPropuestaValor(propuestaValor.filter(i => i !== option));
                          }
                        }}
                      />
                      <label htmlFor={`prop-${option}`} className="text-sm cursor-pointer">
                        {option}
                      </label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">7. Productos & Servicios Comentados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prestamo-personal">Préstamo Personal (€)</Label>
                      <Input
                        id="prestamo-personal"
                        type="number"
                        value={prestamoPersonal}
                        onChange={(e) => setPrestamoPersonal(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prestamo-empresa">Préstamo Empresa (€)</Label>
                      <Input
                        id="prestamo-empresa"
                        type="number"
                        value={prestamoEmpresa}
                        onChange={(e) => setPrestamoEmpresa(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="inversion-importe">Inversión Importe (€)</Label>
                      <Input
                        id="inversion-importe"
                        type="number"
                        value={inversionImporte}
                        onChange={(e) => setInversionImporte(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tpv-previsto">TPV Volumen Previsto (€/mes)</Label>
                      <Input
                        id="tpv-previsto"
                        type="number"
                        value={tpvVolumenPrevisto}
                        onChange={(e) => setTpvVolumenPrevisto(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">8. Riesgos / Alertas / Cumplimiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {riesgosOptions.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`riesgo-${option}`}
                          checked={riesgosCumplimiento.includes(option)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setRiesgosCumplimiento([...riesgosCumplimiento, option]);
                            } else {
                              setRiesgosCumplimiento(riesgosCumplimiento.filter(i => i !== option));
                            }
                          }}
                        />
                        <label htmlFor={`riesgo-${option}`} className="text-sm cursor-pointer">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Nivel de Riesgo</Label>
                    <Select value={nivelRiesgo} onValueChange={setNivelRiesgo}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bajo">Bajo</SelectItem>
                        <SelectItem value="Medio">Medio</SelectItem>
                        <SelectItem value="Alto">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senales">Señales a Revisar</Label>
                    <Textarea
                      id="senales"
                      value={senalesRevisar}
                      onChange={(e) => setSenalesRevisar(e.target.value)}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">9. Resumen de la Reunión</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="notas-gestor">Notas del Gestor</Label>
                    <Textarea
                      id="notas-gestor"
                      value={notasGestor}
                      onChange={(e) => setNotasGestor(e.target.value)}
                      rows={5}
                      placeholder="Objetivos, necesidades, objecciones, tono del cliente, acuerdos previos..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 5: Evaluación */}
            <TabsContent value="evaluacion" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">10. Próximos Pasos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="accion1">Acción 1</Label>
                    <Input
                      id="accion1"
                      value={accion1}
                      onChange={(e) => setAccion1(e.target.value)}
                      placeholder="Descripción de la acción..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Acción 1</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {fechaAccion1 ? format(fechaAccion1, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={fechaAccion1}
                          onSelect={setFechaAccion1}
                          locale={es}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accion2">Acción 2</Label>
                    <Input
                      id="accion2"
                      value={accion2}
                      onChange={(e) => setAccion2(e.target.value)}
                      placeholder="Descripción de la acción..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Acción 2</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {fechaAccion2 ? format(fechaAccion2, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={fechaAccion2}
                          onSelect={setFechaAccion2}
                          locale={es}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="documentacion">Documentación Pendiente</Label>
                    <Textarea
                      id="documentacion"
                      value={documentacionPendiente}
                      onChange={(e) => setDocumentacionPendiente(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Próxima Cita</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {proximaCita ? format(proximaCita, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={proximaCita}
                          onSelect={setProximaCita}
                          locale={es}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">11. Evaluación del Potencial</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="potencial">Potencial Anual Estimado (€)</Label>
                    <Input
                      id="potencial"
                      type="number"
                      value={potencialAnualEstimado}
                      onChange={(e) => setPotencialAnualEstimado(e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="probabilidad">Probabilidad de Cierre (%): {probabilidadCierre}%</Label>
                    <input
                      id="probabilidad"
                      type="range"
                      min="0"
                      max="100"
                      value={probabilidadCierre}
                      onChange={(e) => setProbabilidadCierre(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nivel de Vinculación Recomendado</Label>
                    <Select value={nivelVinculacionRecomendado} onValueChange={setNivelVinculacionRecomendado}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bajo">Bajo</SelectItem>
                        <SelectItem value="Medio">Medio</SelectItem>
                        <SelectItem value="Alto">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="oportunidades">Oportunidades Futuras</Label>
                    <Textarea
                      id="oportunidades"
                      value={oportunidadesFuturas}
                      onChange={(e) => setOportunidadesFuturas(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 6: Seguimiento */}
            <TabsContent value="seguimiento" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">12. Seguimiento y Recordatorios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Próxima Llamada</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {proximaLlamada ? format(proximaLlamada, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={proximaLlamada}
                            onSelect={setProximaLlamada}
                            locale={es}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Revisión de Cartera</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {revisionCartera ? format(revisionCartera, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={revisionCartera}
                            onSelect={setRevisionCartera}
                            locale={es}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Renovaciones</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {renovaciones ? format(renovaciones, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={renovaciones}
                            onSelect={setRenovaciones}
                            locale={es}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Actualización KYC</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {actualizacionKyc ? format(actualizacionKyc, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={actualizacionKyc}
                            onSelect={setActualizacionKyc}
                            locale={es}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Guardando...' : existingSheet ? 'Actualizar Ficha' : 'Guardar Ficha'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}