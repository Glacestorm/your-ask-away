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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  FileText, X, Building2, User, CreditCard, Landmark, Shield, TrendingUp, BarChart3,
  Target, Save, ChevronRight, AlertCircle, Calendar, Edit2, RefreshCw, Download,
  ZoomIn, ZoomOut, RotateCcw, Printer, ChevronLeft, ChevronDown, Maximize2, Minimize2, Search
} from 'lucide-react';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import jsPDF from 'jspdf';

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
  const [companySearch, setCompanySearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [visitSheetsCount, setVisitSheetsCount] = useState(0);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [vinculacionLoaded, setVinculacionLoaded] = useState<'affiliations' | 'company' | null>(null);
  const [isEditMode, setIsEditMode] = useState(!!editSheet);
  const [editVisitId, setEditVisitId] = useState<string | null>(editSheet?.visit_id || null);
  const [editSheetId, setEditSheetId] = useState<string | null>(editSheet?.id || null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(1);
  const [isPdfFullscreen, setIsPdfFullscreen] = useState(false);

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
    const loadCompanyData = async () => {
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

        // Load existing bank affiliations for this company
        const { data: affiliations } = await supabase
          .from('company_bank_affiliations')
          .select('bank_name, affiliation_percentage')
          .eq('company_id', selectedCompanyId)
          .eq('active', true);

        // Reset vinculacion loaded state
        setVinculacionLoaded(null);

        if (affiliations && affiliations.length > 0) {
          const newVinculacion = { anbank: '', morabanc: '', creand: '', comentarios: '' };
          affiliations.forEach(aff => {
            const bankLower = aff.bank_name.toLowerCase();
            if (bankLower.includes('andbank')) {
              newVinculacion.anbank = String(aff.affiliation_percentage || 0);
            } else if (bankLower.includes('morabanc')) {
              newVinculacion.morabanc = String(aff.affiliation_percentage || 0);
            } else if (bankLower.includes('creand')) {
              newVinculacion.creand = String(aff.affiliation_percentage || 0);
            }
          });
          setVinculacion(prev => ({ ...prev, ...newVinculacion }));
          setVinculacionLoaded('affiliations');
        } else {
          // Also check companies table vinculacion_entidad fields
          const { data: companyData } = await supabase
            .from('companies')
            .select('vinculacion_entidad_1, vinculacion_entidad_2, vinculacion_entidad_3')
            .eq('id', selectedCompanyId)
            .maybeSingle();

          if (companyData && (companyData.vinculacion_entidad_1 || companyData.vinculacion_entidad_2 || companyData.vinculacion_entidad_3)) {
            setVinculacion(prev => ({
              ...prev,
              anbank: companyData.vinculacion_entidad_1 ? String(companyData.vinculacion_entidad_1) : '',
              morabanc: companyData.vinculacion_entidad_2 ? String(companyData.vinculacion_entidad_2) : '',
              creand: companyData.vinculacion_entidad_3 ? String(companyData.vinculacion_entidad_3) : '',
            }));
            setVinculacionLoaded('company');
          }
        }
      } else if (selectedCompanyId && isEditMode) {
        const company = companies.find(c => c.id === selectedCompanyId);
        if (company) {
          setSelectedCompany(company);
          setCompanySearch(company.name);
        }
      }
    };

    loadCompanyData();
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

  // Sync bank affiliations with company_bank_affiliations table
  const syncBankAffiliations = async (companyId: string) => {
    const vinculacionSum = parseInt(vinculacion.anbank || '0') + 
                           parseInt(vinculacion.morabanc || '0') + 
                           parseInt(vinculacion.creand || '0');
    
    // Only sync if we have valid vinculación data (sum = 100%)
    if (vinculacionSum !== 100) return;

    const banks = [
      { name: 'Andbank', percentage: parseInt(vinculacion.anbank || '0') },
      { name: 'Morabanc', percentage: parseInt(vinculacion.morabanc || '0') },
      { name: 'Creand', percentage: parseInt(vinculacion.creand || '0'), isPrimary: true },
    ];

    try {
      // Delete existing affiliations for this company
      await supabase
        .from('company_bank_affiliations')
        .delete()
        .eq('company_id', companyId);

      // Insert new affiliations
      const affiliationsToInsert = banks
        .filter(bank => bank.percentage > 0)
        .map((bank, index) => ({
          company_id: companyId,
          bank_name: bank.name,
          affiliation_percentage: bank.percentage,
          is_primary: bank.isPrimary || false,
          active: true,
          priority_order: index,
        }));

      if (affiliationsToInsert.length > 0) {
        const { error } = await supabase
          .from('company_bank_affiliations')
          .insert(affiliationsToInsert);

        if (error) {
          console.error('Error syncing bank affiliations:', error);
        }
      }

      // Also update company vinculacion fields
      await supabase
        .from('companies')
        .update({
          vinculacion_entidad_1: parseInt(vinculacion.anbank || '0') || null,
          vinculacion_entidad_2: parseInt(vinculacion.morabanc || '0') || null,
          vinculacion_entidad_3: parseInt(vinculacion.creand || '0') || null,
          vinculacion_modo: 'manual',
        })
        .eq('id', companyId);

    } catch (error) {
      console.error('Error syncing bank affiliations:', error);
    }
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
      const targetCompanyId = isEditMode ? editSheet?.company_id : selectedCompanyId;

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

        // Sync bank affiliations
        if (targetCompanyId) {
          await syncBankAffiliations(targetCompanyId);
        }

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

        // Sync bank affiliations
        await syncBankAffiliations(selectedCompanyId);

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
    setCompanySearch('');
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

  const generatePdfDocument = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    // Helper functions
    const addHeader = () => {
      doc.setFillColor(13, 71, 161);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('FICHA DE VISITA COMERCIAL', pageWidth / 2, 18, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${format(formData.fechaInicio, 'dd/MM/yyyy')}`, pageWidth / 2, 28, { align: 'center' });
      y = 45;
    };

    const addSection = (title: string) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 5, pageWidth - margin * 2, 8, 'F');
      doc.setTextColor(13, 71, 161);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 2, y);
      y += 8;
      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
    };

    const addField = (label: string, value: string | number | undefined | null, inline = false) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      const displayValue = value?.toString() || '-';
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      const labelWidth = doc.getTextWidth(`${label}: `);
      doc.text(displayValue, margin + labelWidth + 2, y);
      if (!inline) y += 6;
    };

    const addTwoColumns = (label1: string, value1: string | undefined, label2: string, value2: string | undefined) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(`${label1}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text(value1 || '-', margin + 35, y);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(`${label2}:`, pageWidth / 2, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text(value2 || '-', pageWidth / 2 + 35, y);
      y += 6;
    };

    // Generate PDF
    addHeader();

    // Client Data Section
    addSection('DATOS DEL CLIENTE');
    addTwoColumns('BP', formData.bp, 'NIF/CIF', formData.nifCif);
    addField('Razón Social', formData.nombreRazonSocial);
    addTwoColumns('Tipo Cliente', formData.tipoCliente === 'empresa' ? 'Empresa' : 'Particular', 
                  'Estado', formData.esClientePotencial === 'cliente' ? 'Cliente' : 'Potencial');
    y += 4;

    // Contact Data Section
    addSection('DATOS DE CONTACTO');
    addTwoColumns('Persona Contacto', formData.personaContacto, 'Cargo', formData.cargoContacto);
    addTwoColumns('Teléfono', formData.telefonoLaboral, 'Email', formData.emailLaboral);
    y += 4;

    // Visit Data Section
    addSection('DATOS DE LA VISITA');
    addTwoColumns('Tipo Visita', formData.tipoVisita === 'tpv' ? 'TPV' : 'Visita 360°',
                  'Solicitada por', formData.visitaSolicitadaPor === 'gestor' ? 'Gestor' : 'Responsable');
    addTwoColumns('Fecha', format(formData.fechaInicio, 'dd/MM/yyyy'),
                  'Próxima Cita', observaciones.proximaCita ? format(observaciones.proximaCita, 'dd/MM/yyyy') : '-');
    y += 4;

    // TPV Products Section
    addSection('PRODUCTOS TPV');
    const tpvProducts = [
      { name: 'TPV Ordinario', data: productosTPV.tpvOrdinario },
      { name: 'TPV Mail', data: productosTPV.tpvMail },
      { name: 'TPV Virtual', data: productosTPV.tpvVirtual },
      { name: 'TPV Money', data: productosTPV.tpvMoney },
      { name: 'TPV Bizum', data: productosTPV.tpvBizum },
    ];
    tpvProducts.forEach(product => {
      if (product.data.ofrecido || product.data.pedido || product.data.importe) {
        addTwoColumns(
          product.name, 
          `${product.data.ofrecido ? '✓ Ofrecido' : ''} ${product.data.pedido ? '✓ Pedido' : ''}`.trim() || '-',
          'Importe', product.data.importe ? `${product.data.importe}€` : '-'
        );
      }
    });
    y += 4;

    // Standard Products Section
    addSection('PRODUCTOS ESTÁNDAR');
    const standardProducts = [
      { name: 'Crédit Ràpid', data: productosEstandar.creditRapid },
      { name: 'Préstamo Personal', data: productosEstandar.prestamoPersonal },
      { name: 'Préstamo Hipotecario', data: productosEstandar.prestamoHipotecario },
      { name: 'Póliza', data: productosEstandar.poliza },
      { name: 'Descuento Comercial', data: productosEstandar.descuentoComercial },
      { name: 'Aval', data: productosEstandar.aval },
      { name: 'Mercat', data: productosEstandar.mercat },
      { name: 'Acciones', data: productosEstandar.acciones },
      { name: 'Renta Fija', data: productosEstandar.rentaFija },
    ];
    standardProducts.forEach(product => {
      if (product.data.ofrecido || product.data.pedido || product.data.importe) {
        addTwoColumns(
          product.name,
          `${product.data.ofrecido ? '✓ Ofrecido' : ''} ${product.data.pedido ? '✓ Pedido' : ''}`.trim() || '-',
          'Importe', product.data.importe ? `${product.data.importe}€` : '-'
        );
      }
    });
    y += 4;

    // Services Section
    addSection('SERVICIOS');
    addTwoColumns('Banca Online', servicios.bancaOnline.ofrecido ? '✓ Ofrecido' : '-',
                  'Nóminas', servicios.nominas.ofrecido ? '✓ Ofrecido' : '-');
    if (servicios.seguroVida.tipo || servicios.seguroVida.importe) {
      addTwoColumns('Seguro Vida', servicios.seguroVida.tipo || '-', 
                    'Importe', servicios.seguroVida.importe ? `${servicios.seguroVida.importe}€` : '-');
    }
    y += 4;

    // Bank Affiliation Section
    addSection('VINCULACIÓN BANCARIA');
    addField('Andbank', vinculacion.anbank ? `${vinculacion.anbank}%` : '-');
    addField('Morabanc', vinculacion.morabanc ? `${vinculacion.morabanc}%` : '-');
    addField('Creand', vinculacion.creand ? `${vinculacion.creand}%` : '-');
    if (vinculacion.comentarios) {
      addField('Comentarios', vinculacion.comentarios);
    }
    y += 4;

    // Financial Data Section
    if (datosFinancieros.facturacion2024 || datosFinancieros.facturacion2025 || datosFinancieros.beneficios2024) {
      addSection('DATOS FINANCIEROS');
      if (datosFinancieros.facturacion2024) addField('Facturación 2024', `${datosFinancieros.facturacion2024}€`);
      if (datosFinancieros.facturacion2025) addField('Facturación 2025', `${datosFinancieros.facturacion2025}€`);
      if (datosFinancieros.beneficios2024) addField('Beneficios 2024', `${datosFinancieros.beneficios2024}€`);
      if (datosFinancieros.beneficios2025) addField('Beneficios 2025', `${datosFinancieros.beneficios2025}€`);
      y += 4;
    }

    // Evaluation Section
    addSection('EVALUACIÓN Y SEGUIMIENTO');
    addTwoColumns('Necesidad Principal', observaciones.necesidadPrincipal,
                  'Producto Ofrecido', observaciones.productoOfrecido);
    addTwoColumns('Probabilidad Cierre', observaciones.gradoConsecucion ? `${observaciones.gradoConsecucion}%` : '-',
                  'Potencial Anual', observaciones.importePropuesto ? `${observaciones.importePropuesto}€` : '-');
    y += 4;

    // Notes Section
    if (observaciones.observacionesGestor || observaciones.notasReunion) {
      addSection('OBSERVACIONES');
      if (observaciones.observacionesGestor) {
        doc.setFontSize(9);
        const splitNotes = doc.splitTextToSize(observaciones.observacionesGestor, pageWidth - margin * 2);
        doc.text(splitNotes, margin, y);
        y += splitNotes.length * 4 + 4;
      }
      if (observaciones.notasReunion) {
        addField('Notas Reunión', '');
        const splitMeetingNotes = doc.splitTextToSize(observaciones.notasReunion, pageWidth - margin * 2);
        doc.text(splitMeetingNotes, margin, y);
        y += splitMeetingNotes.length * 4;
      }
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFillColor(240, 240, 240);
      doc.rect(0, doc.internal.pageSize.getHeight() - 15, pageWidth, 15, 'F');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
      doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, doc.internal.pageSize.getHeight() - 6);
    }

    return doc;
  };

  const handlePreviewPDF = () => {
    const doc = generatePdfDocument();
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    setPdfPreviewUrl(url);
    setPdfDoc(doc);
    setPdfTotalPages(doc.getNumberOfPages());
    setPdfPage(1);
    setPdfZoom(100);
    setShowPdfPreview(true);
  };

  const handleDownloadPDF = () => {
    if (pdfDoc) {
      const filename = `ficha_visita_${formData.nombreRazonSocial.replace(/\s+/g, '_') || 'sin_empresa'}_${format(formData.fechaInicio, 'yyyyMMdd')}.pdf`;
      pdfDoc.save(filename);
      toast.success('PDF descargado correctamente');
    }
  };

  const handlePrintPDF = () => {
    if (pdfPreviewUrl) {
      const printWindow = window.open(pdfPreviewUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    }
  };

  const handleZoomIn = () => {
    setPdfZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setPdfZoom(prev => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setPdfZoom(100);
  };

  const handleClosePdfPreview = () => {
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }
    setPdfPreviewUrl(null);
    setPdfDoc(null);
    setShowPdfPreview(false);
    setPdfZoom(100);
    setPdfPage(1);
    setIsPdfFullscreen(false);
  };

  const handleToggleFullscreen = () => {
    setIsPdfFullscreen(prev => !prev);
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
    <Label className="flex items-center gap-1 text-foreground dark:text-foreground">
      {children}
      <span className="text-destructive">*</span>
    </Label>
  );

  const cardColor = 'hsl(var(--chart-2))';
  
  // Always render collapsed card + Dialog
  return (
    <>
      {/* Collapsed card view with compact stats */}
      <div
        className="perspective-1000"
        style={{ perspective: '1000px' }}
      >
        <div
          onClick={() => setIsExpanded(true)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={() => setIsHovered(true)}
          className={cn(
            "relative cursor-pointer rounded-2xl p-6 h-48 transition-all duration-300 ease-out",
            "border-2 shadow-lg hover:shadow-2xl",
            "bg-gradient-to-br from-card via-card to-card/80",
            "transform-gpu will-change-transform",
            isHovered && "scale-[1.02]",
            className
          )}
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Glow effect */}
          <div 
            className={cn(
              "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
              isHovered && "opacity-100"
            )}
            style={{
              background: `radial-gradient(circle at 50% 0%, ${cardColor}20, transparent 70%)`,
            }}
          />

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-between" style={{ transform: 'translateZ(30px)' }}>
            <div className="flex items-start justify-between">
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-300",
                  isHovered && "scale-110"
                )}
                style={{ backgroundColor: `${cardColor}20` }}
              >
                <FileText className="h-7 w-7" style={{ color: cardColor }} />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">{visitSheetsCount}</div>
                <div className="text-xs text-muted-foreground">Fitxes</div>
              </div>
            </div>

            {/* Compact stats row */}
            <TooltipProvider delayDuration={200}>
              <div className="flex items-center gap-3 text-xs">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-background/50 cursor-help">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{companies.length}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <p>Empreses disponibles per seleccionar</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-background/50 cursor-help">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{format(new Date(), 'dd/MM')}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <p>Data actual per noves fitxes</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Ficha de Visita</h3>
              <p className="text-sm text-muted-foreground line-clamp-1">
                Formulari de visites comercials
              </p>
            </div>
          </div>

          {/* Bottom gradient line */}
          <div 
            className={cn(
              "absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl transition-all duration-300",
              isHovered ? "opacity-100" : "opacity-50"
            )}
            style={{ backgroundColor: cardColor }}
          />
        </div>
      </div>

      {/* Dialog for expanded form */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 dark:bg-gradient-to-b dark:from-card dark:to-background">
          <DialogHeader className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/20 dark:via-amber-500/10 dark:to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 dark:bg-amber-500/30 dark:text-amber-400 shadow-sm dark:shadow-amber-500/10">
                {isEditMode ? <Edit2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              </div>
              <div>
                <DialogTitle className="text-xl dark:text-foreground">
                  {isEditMode ? 'Editar Ficha de Visita' : 'Nova Fitxa de Visita Comercial'}
                </DialogTitle>
                <DialogDescription className="mt-1 dark:text-muted-foreground">
                  {isEditMode ? 'Modificar registre existent' : 'Registre complet de visita bancària'}
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="absolute top-4 right-12 text-xs dark:border-border/50 dark:bg-background/50">
              <span className="text-destructive mr-1">*</span> Camps obligatoris
            </Badge>
          </DialogHeader>
        <ScrollArea className="h-[600px] dark:bg-background/30">
          <div className="p-6 space-y-6">
            {/* Company Selection with Search */}
            <div className="space-y-3 p-4 rounded-lg bg-muted/30 dark:bg-muted/20 dark:border dark:border-border/30">
              <RequiredLabel>
                <Building2 className="h-4 w-4 text-primary mr-1" />
                Seleccionar Empresa
              </RequiredLabel>
              
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, BP o sector..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="pl-9 dark:bg-background/50 dark:border-border/50"
                  disabled={isEditMode}
                />
              </div>
              
              {/* Company List */}
              {!isEditMode && companySearch.length > 0 && (
                <ScrollArea className="h-48 border rounded-md dark:border-border/50 dark:bg-background/30">
                  <div className="p-2 space-y-1">
                    {companies
                      .filter(c => {
                        const search = companySearch.toLowerCase();
                        return (
                          c.name.toLowerCase().includes(search) ||
                          (c.bp && c.bp.toLowerCase().includes(search)) ||
                          (c.sector && c.sector.toLowerCase().includes(search)) ||
                          (c.tax_id && c.tax_id.toLowerCase().includes(search))
                        );
                      })
                      .slice(0, 50)
                      .map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCompanyId(c.id);
                            setCompanySearch(c.name);
                            setTouched(prev => ({ ...prev, company: true }));
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                            "hover:bg-accent/50 dark:hover:bg-accent/30",
                            selectedCompanyId === c.id && "bg-primary/10 border border-primary/30"
                          )}
                        >
                          <div className="font-medium text-foreground">{c.name}</div>
                          <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                            {c.bp && <span>BP: {c.bp}</span>}
                            {c.sector && <span>Sector: {c.sector}</span>}
                            {c.tax_id && <span>NIF: {c.tax_id}</span>}
                          </div>
                        </button>
                      ))}
                    {companies.filter(c => {
                      const search = companySearch.toLowerCase();
                      return (
                        c.name.toLowerCase().includes(search) ||
                        (c.bp && c.bp.toLowerCase().includes(search)) ||
                        (c.sector && c.sector.toLowerCase().includes(search)) ||
                        (c.tax_id && c.tax_id.toLowerCase().includes(search))
                      );
                    }).length === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No se encontraron empresas
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
              
              {/* Selected Company Display */}
              {selectedCompanyId && selectedCompany && (
                <div className="p-3 rounded-md bg-primary/5 border border-primary/20 dark:bg-primary/10 dark:border-primary/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">{selectedCompany.name}</div>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                        {selectedCompany.bp && <span>BP: {selectedCompany.bp}</span>}
                        {selectedCompany.sector && <span>Sector: {selectedCompany.sector}</span>}
                      </div>
                    </div>
                    {!isEditMode && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCompanyId('');
                          setSelectedCompany(null);
                          setCompanySearch('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {touched.company && <ErrorMessage error={errors.company} />}
            </div>

            <Accordion type="multiple" defaultValue={["datos-generales"]} className="space-y-3">
              {/* 1. Datos Generales */}
              <AccordionItem value="datos-generales" className="border rounded-lg px-4 dark:border-border/50 dark:bg-card/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    <span className="font-semibold text-foreground">1. Datos Generales</span>
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
              <AccordionItem value="productos-tpv" className="border rounded-lg px-4 dark:border-border/50 dark:bg-card/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="font-semibold text-foreground">2. Productos TPV</span>
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
              <AccordionItem value="productos-estandar" className="border rounded-lg px-4 dark:border-border/50 dark:bg-card/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <Landmark className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                    <span className="font-semibold text-foreground">3. Productos Estándar (Activo/Pasivo)</span>
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
              <AccordionItem value="servicios" className="border rounded-lg px-4 dark:border-border/50 dark:bg-card/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
                    <span className="font-semibold text-foreground">4. Banca Online, Nóminas, Seguros y Planes</span>
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
              <AccordionItem value="datos-financieros" className="border rounded-lg px-4 dark:border-border/50 dark:bg-card/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                    <span className="font-semibold text-foreground">5. Datos Financieros (MTR/P&L/TPV)</span>
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
              <AccordionItem value="vinculacion" className="border rounded-lg px-4 dark:border-border/50 dark:bg-card/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-pink-500 dark:text-pink-400" />
                    <span className="font-semibold text-foreground">6. Grado de Vinculación</span>
                    {vinculacionLoaded && (
                      <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Dades carregades
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4">
                    {vinculacionLoaded && (
                      <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-sm">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4" />
                          <span>
                            {vinculacionLoaded === 'affiliations' 
                              ? "Dades de vinculació carregades des de les afiliacions bancàries de l'empresa"
                              : "Dades de vinculació carregades des del registre de l'empresa"}
                          </span>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          className="h-7 px-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-300 dark:hover:text-blue-100 dark:hover:bg-blue-900"
                          onClick={() => {
                            setVinculacion({ anbank: '', morabanc: '', creand: '', comentarios: '' });
                            setVinculacionLoaded(null);
                          }}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Resetejar
                        </Button>
                      </div>
                    )}
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
              <AccordionItem value="observaciones" className="border rounded-lg px-4 dark:border-border/50 dark:bg-card/50">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-red-500 dark:text-red-400" />
                    <span className="font-semibold text-foreground">7. Observaciones y Grado de Éxito</span>
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

            {/* Action Buttons */}
            <div className="flex justify-between gap-3 pt-4 border-t border-border/50 dark:border-border/30">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={handlePreviewPDF}
                      className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950/50"
                    >
                      <FileText className="h-4 w-4" />
                      Vista previa PDF
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Previsualizar ficha de visita antes de descargar</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="dark:bg-background/50 dark:hover:bg-muted/80">
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving} className="gap-2 dark:shadow-sm dark:shadow-primary/20">
                  <Save className="h-4 w-4" />
                  {saving ? 'Guardant...' : (isEditMode ? 'Actualitzar Fitxa' : 'Guardar Fitxa')}
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={showPdfPreview} onOpenChange={setShowPdfPreview}>
        <DialogContent className={cn(
          "p-0 gap-0 dark:bg-card dark:border-border/50 transition-all duration-300",
          isPdfFullscreen 
            ? "max-w-[100vw] w-[100vw] h-[100vh] rounded-none" 
            : "max-w-6xl h-[95vh]"
        )}>
          {/* Header */}
          <DialogHeader className="p-4 pb-3 border-b border-border/30 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-500/20 dark:via-blue-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/20 dark:bg-blue-500/30">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold dark:text-foreground">
                    Vista Previa del PDF
                  </DialogTitle>
                  <DialogDescription className="text-sm dark:text-muted-foreground">
                    {formData.nombreRazonSocial || 'Ficha de Visita'} • {pdfTotalPages} página{pdfTotalPages > 1 ? 's' : ''}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleFullscreen}
                        className="h-8 w-8 rounded-full"
                      >
                        {isPdfFullscreen ? (
                          <Minimize2 className="h-4 w-4" />
                        ) : (
                          <Maximize2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isPdfFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClosePdfPreview}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/20 bg-muted/20 dark:bg-muted/10">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomOut}
                      disabled={pdfZoom <= 50}
                      className="h-8 w-8"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reducir zoom</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-background/50 border border-border/30 min-w-[80px] justify-center">
                <span className="text-sm font-medium">{pdfZoom}%</span>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomIn}
                      disabled={pdfZoom >= 200}
                      className="h-8 w-8"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Aumentar zoom</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleResetZoom}
                      className="h-8 w-8"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Restablecer zoom</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="w-px h-6 bg-border/50 mx-2" />

              {/* Page indicator */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-background/50 border border-border/30">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {pdfTotalPages} página{pdfTotalPages > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrintPDF}
                      className="gap-2 text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-950/50"
                    >
                      <Printer className="h-4 w-4" />
                      Imprimir
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Imprimir documento directamente</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                size="sm"
                onClick={handleDownloadPDF}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="h-4 w-4" />
                Descargar
              </Button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-auto bg-muted/30 dark:bg-muted/10 p-4">
            {pdfPreviewUrl && (
              <div 
                className="flex justify-center min-h-full"
                style={{ 
                  transform: `scale(${pdfZoom / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s ease-out'
                }}
              >
                <iframe
                  src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                  className="w-full max-w-4xl rounded-lg border border-border/50 bg-white shadow-lg"
                  style={{ height: `${Math.max(600, 800 * (pdfZoom / 100))}px` }}
                  title="Vista previa del PDF"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border/20 bg-muted/10 dark:bg-muted/5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Generado: {format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Usa la rueda del ratón para desplazarte</span>
              <span>•</span>
              <span>Ctrl + P para imprimir</span>
              <span>•</span>
              <span>{isPdfFullscreen ? 'Esc para salir' : 'Clic en ⛶ para pantalla completa'}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
