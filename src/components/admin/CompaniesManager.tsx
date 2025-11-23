import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Plus, Pencil, Trash2, Upload, Phone, Mail, Globe, Users, Building2, FileText, History, Clock, TrendingUp, Package, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { CompanyWithDetails, StatusColor, Profile } from '@/types/database';
import { ExcelImporter } from './ExcelImporter';
import { CompanyPhotosManager } from '@/components/company/CompanyPhotosManager';
import { useLanguage } from '@/contexts/LanguageContext';

interface CompanyContact {
  id: string;
  company_id: string;
  contact_name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_primary: boolean;
}

interface CompanyDocument {
  id: string;
  company_id: string;
  document_name: string;
  document_type: string | null;
  document_url: string | null;
  file_size: number | null;
  notes: string | null;
  created_at: string;
}

interface Visit {
  id: string;
  visit_date: string;
  notes: string | null;
  result: string | null;
  productos_ofrecidos: string[] | null;
  porcentaje_vinculacion: number | null;
  pactos_realizados: string | null;
  gestor: { full_name: string | null; email: string } | null;
}

interface AuditLog {
  id: string;
  action: string;
  created_at: string;
  old_data: any;
  new_data: any;
}

export function CompaniesManager() {
  const { t } = useLanguage();
  const [companies, setCompanies] = useState<CompanyWithDetails[]>([]);
  const [statusColors, setStatusColors] = useState<StatusColor[]>([]);
  const [gestores, setGestores] = useState<Profile[]>([]);
  const [parroquias, setParroquias] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [importerOpen, setImporterOpen] = useState(false);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitFormData, setVisitFormData] = useState({
    visit_date: new Date().toISOString().split('T')[0],
    gestor_id: '',
    productos_ofrecidos: [] as string[],
    porcentaje_vinculacion: '',
    pactos_realizados: '',
    result: '',
    notes: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    longitude: 0,
    latitude: 0,
    cnae: '',
    parroquia: '',
    oficina: '',
    status_id: '',
    gestor_id: '',
    fecha_ultima_visita: '',
    observaciones: '',
    phone: '',
    email: '',
    website: '',
    employees: '',
    turnover: '',
    sector: '',
    tax_id: '',
    registration_number: '',
    legal_form: '',
    vinculacion_entidad_1: '',
    vinculacion_entidad_2: '',
    vinculacion_entidad_3: '',
    bp: '',
    client_type: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [companiesRes, statusRes, gestoresRes, conceptsRes, productsRes] = await Promise.all([
        supabase.from('companies').select('*, status_colors(*), profiles(*)').order('name'),
        supabase.from('status_colors').select('*').order('display_order'),
        supabase.from('profiles').select('*').order('full_name'),
        supabase.from('concepts').select('*').eq('concept_type', 'parroquia').eq('active', true),
        supabase.from('products').select('*').eq('active', true).order('category, name'),
      ]);

      if (companiesRes.data) setCompanies(companiesRes.data as CompanyWithDetails[]);
      if (statusRes.data) setStatusColors(statusRes.data);
      if (gestoresRes.data) setGestores(gestoresRes.data);
      if (conceptsRes.data) setParroquias(conceptsRes.data.map((c: any) => c.concept_value));
      if (productsRes.data) setProducts(productsRes.data);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(t('form.errorLoading'));
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!formData.name || !formData.address || !formData.parroquia) {
        toast.error(t('form.required'));
        return;
      }

      const dataToSave = {
        name: formData.name,
        address: formData.address,
        longitude: Number(formData.longitude),
        latitude: Number(formData.latitude),
        cnae: formData.cnae || null,
        parroquia: formData.parroquia,
        oficina: formData.oficina || null,
        status_id: formData.status_id || null,
        gestor_id: formData.gestor_id || null,
        fecha_ultima_visita: formData.fecha_ultima_visita || null,
        observaciones: formData.observaciones || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        employees: formData.employees ? Number(formData.employees) : null,
        turnover: formData.turnover ? Number(formData.turnover) : null,
        sector: formData.sector || null,
        tax_id: formData.tax_id || null,
        registration_number: formData.registration_number || null,
        legal_form: formData.legal_form || null,
        vinculacion_entidad_1: formData.vinculacion_entidad_1 ? Number(formData.vinculacion_entidad_1) : null,
        vinculacion_entidad_2: formData.vinculacion_entidad_2 ? Number(formData.vinculacion_entidad_2) : null,
        vinculacion_entidad_3: formData.vinculacion_entidad_3 ? Number(formData.vinculacion_entidad_3) : null,
        bp: formData.bp || null,
        client_type: formData.client_type || null,
      };

      if (editingCompany) {
        const { error } = await supabase
          .from('companies')
          .update(dataToSave)
          .eq('id', editingCompany.id);

        if (error) throw error;
        toast.success(t('companyForm.companyUpdated'));
      } else {
        const { error } = await supabase
          .from('companies')
          .insert(dataToSave);

        if (error) throw error;
        toast.success(t('companyForm.companyCreated'));
      }

      setDialogOpen(false);
      setEditingCompany(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving company:', error);
      toast.error(t('form.errorSaving'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('form.confirmDelete'))) return;

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(t('companyForm.companyDeleted'));
      fetchData();
    } catch (error: any) {
      console.error('Error deleting company:', error);
      toast.error(t('form.errorDeleting'));
    }
  };

  const handleEdit = async (company: CompanyWithDetails) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      address: company.address,
      longitude: company.longitude,
      latitude: company.latitude,
      cnae: company.cnae || '',
      parroquia: company.parroquia,
      oficina: company.oficina || '',
      status_id: company.status_id || '',
      gestor_id: company.gestor_id || '',
      fecha_ultima_visita: company.fecha_ultima_visita || '',
      observaciones: company.observaciones || '',
      phone: (company as any).phone || '',
      email: (company as any).email || '',
      website: (company as any).website || '',
      employees: (company as any).employees?.toString() || '',
      turnover: (company as any).turnover?.toString() || '',
      sector: (company as any).sector || '',
      tax_id: (company as any).tax_id || '',
      registration_number: (company as any).registration_number || '',
      legal_form: (company as any).legal_form || '',
      vinculacion_entidad_1: (company as any).vinculacion_entidad_1?.toString() || '',
      vinculacion_entidad_2: (company as any).vinculacion_entidad_2?.toString() || '',
      vinculacion_entidad_3: (company as any).vinculacion_entidad_3?.toString() || '',
      bp: (company as any).bp || '',
      client_type: (company as any).client_type || '',
    });
    
    // Load activity history
    await fetchActivityHistory(company.id);
    
    setDialogOpen(true);
  };

  const fetchActivityHistory = async (companyId: string) => {
    try {
      // Fetch visits
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select('id, visit_date, notes, result, productos_ofrecidos, porcentaje_vinculacion, pactos_realizados, gestor:profiles(full_name, email)')
        .eq('company_id', companyId)
        .order('visit_date', { ascending: false });

      if (visitsError) throw visitsError;
      setVisits(visitsData || []);

      // Fetch audit logs
      const { data: auditData, error: auditError } = await supabase
        .from('audit_logs')
        .select('id, action, created_at, old_data, new_data')
        .eq('table_name', 'companies')
        .eq('record_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (auditError) throw auditError;
      setAuditLogs(auditData || []);
    } catch (error: any) {
      console.error('Error fetching activity history:', error);
    }
  };

  const handleSaveVisit = async () => {
    if (!editingCompany) return;

    try {
      setLoading(true);

      if (!visitFormData.visit_date || !visitFormData.gestor_id) {
        toast.error(t('form.required'));
        return;
      }

      const { error } = await supabase.from('visits').insert({
        company_id: editingCompany.id,
        visit_date: visitFormData.visit_date,
        gestor_id: visitFormData.gestor_id,
        productos_ofrecidos: visitFormData.productos_ofrecidos.length > 0 ? visitFormData.productos_ofrecidos : null,
        porcentaje_vinculacion: visitFormData.porcentaje_vinculacion ? Number(visitFormData.porcentaje_vinculacion) : null,
        pactos_realizados: visitFormData.pactos_realizados || null,
        result: visitFormData.result || null,
        notes: visitFormData.notes || null,
      });

      if (error) throw error;

      toast.success(t('visitForm.visitCreated'));
      setShowVisitForm(false);
      setVisitFormData({
        visit_date: new Date().toISOString().split('T')[0],
        gestor_id: '',
        productos_ofrecidos: [],
        porcentaje_vinculacion: '',
        pactos_realizados: '',
        result: '',
        notes: '',
      });
      await fetchActivityHistory(editingCompany.id);
    } catch (error: any) {
      console.error('Error saving visit:', error);
      toast.error(t('form.errorSaving'));
    } finally {
      setLoading(false);
    }
  };

  const toggleProducto = (productName: string) => {
    setVisitFormData(prev => ({
      ...prev,
      productos_ofrecidos: prev.productos_ofrecidos.includes(productName)
        ? prev.productos_ofrecidos.filter(p => p !== productName)
        : [...prev.productos_ofrecidos, productName]
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      longitude: 0,
      latitude: 0,
      cnae: '',
      parroquia: '',
      oficina: '',
      status_id: '',
      gestor_id: '',
      fecha_ultima_visita: '',
      observaciones: '',
      phone: '',
      email: '',
      website: '',
      employees: '',
      turnover: '',
      sector: '',
      tax_id: '',
      registration_number: '',
      legal_form: '',
      vinculacion_entidad_1: '',
      vinculacion_entidad_2: '',
      vinculacion_entidad_3: '',
      bp: '',
      client_type: '',
    });
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('admin.companies')}</CardTitle>
            <CardDescription>{t('companyForm.title')}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImporterOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              {t('companyForm.importExcel')}
            </Button>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              {t('companyForm.addCompany')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('companyForm.address')}</TableHead>
                <TableHead>{t('companyForm.parish')}</TableHead>
                <TableHead>{t('company.phone')}</TableHead>
                <TableHead>{t('company.email')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('companyForm.manager')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.address}</TableCell>
                  <TableCell>{company.parroquia}</TableCell>
                  <TableCell>{(company as any).phone || '-'}</TableCell>
                  <TableCell>{(company as any).email || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: company.status?.color_hex || '#gray' }}
                      />
                      {company.status?.status_name || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>{company.gestor?.full_name || company.gestor?.email || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(company)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(company.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>

      {/* Dialog for Create/Edit with Tabs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCompany ? t('companyForm.editCompany') : t('companyForm.addCompany')}</DialogTitle>
            <DialogDescription>
              {t('companyForm.title')}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="inline-flex h-auto items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-full flex-wrap gap-1">
              {/* Información General */}
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{t('companyForm.basicInfo')}</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{t('companyForm.contactInfo')}</span>
              </TabsTrigger>
              
              <div className="h-6 w-px bg-border" />
              
              {/* Información Financiera/Legal */}
              <TabsTrigger value="business" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>{t('companyForm.financialInfo')}</span>
              </TabsTrigger>
              <TabsTrigger value="legal" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Legal/Fiscal</span>
              </TabsTrigger>
              
              <div className="h-6 w-px bg-border" />
              
              {/* Gestión */}
              <TabsTrigger value="management" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{t('company.manager')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="photos" 
                disabled={!editingCompany} 
                className="flex items-center gap-2 data-[state=disabled]:opacity-50 data-[state=disabled]:cursor-not-allowed data-[state=disabled]:pointer-events-none"
              >
                <Camera className="h-4 w-4" />
                <span>{t('company.photos')}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                disabled={!editingCompany} 
                className="flex items-center gap-2 data-[state=disabled]:opacity-50 data-[state=disabled]:cursor-not-allowed data-[state=disabled]:pointer-events-none"
              >
                <History className="h-4 w-4" />
                <span>{t('visitForm.visitHistory')}</span>
              </TabsTrigger>
            </TabsList>

            {/* Datos Básicos */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('companyForm.companyName')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_type">Tipo de Cliente</Label>
                  <Select value={formData.client_type} onValueChange={(v) => setFormData({ ...formData, client_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="potencial_cliente">Potencial Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sector">{t('companyForm.sector')}</Label>
                  <Input
                    id="sector"
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bp">BP (Número de Cuenta)</Label>
                  <Input
                    id="bp"
                    value={formData.bp}
                    onChange={(e) => setFormData({ ...formData, bp: e.target.value })}
                    placeholder="ESXX XXXX XXXX XXXX XXXX XXXX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t('companyForm.address')} *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parroquia">{t('companyForm.parish')} *</Label>
                  <Select value={formData.parroquia} onValueChange={(v) => setFormData({ ...formData, parroquia: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.selectOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      {parroquias.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oficina">{t('companyForm.office')}</Label>
                  <Input
                    id="oficina"
                    value={formData.oficina}
                    onChange={(e) => setFormData({ ...formData, oficina: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="longitude">{t('companyForm.longitude')} *</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="latitude">{t('companyForm.latitude')} *</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Contacto */}
            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('company.phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+376 XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('company.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="info@empresa.ad"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">{t('company.website')}</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.empresa.ad"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">{t('companyForm.observations')}</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  rows={4}
                />
              </div>
            </TabsContent>

            {/* Empresarial */}
            <TabsContent value="business" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employees">{t('companyForm.employees')}</Label>
                  <Input
                    id="employees"
                    type="number"
                    value={formData.employees}
                    onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="turnover">{t('companyForm.turnover')} (€)</Label>
                  <Input
                    id="turnover"
                    type="number"
                    step="0.01"
                    value={formData.turnover}
                    onChange={(e) => setFormData({ ...formData, turnover: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnae">{t('companyForm.cnae')}</Label>
                <Input
                  id="cnae"
                  value={formData.cnae}
                  onChange={(e) => setFormData({ ...formData, cnae: e.target.value })}
                />
              </div>

              <Separator className="my-4" />
              
              <div className="space-y-2">
                <Label className="text-base font-semibold">Vinculación Bancaria (%)</Label>
                <p className="text-sm text-muted-foreground">Porcentaje de vinculación con cada entidad bancaria</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vinculacion_entidad_1">Entidad 1 (%)</Label>
                  <Input
                    id="vinculacion_entidad_1"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.vinculacion_entidad_1}
                    onChange={(e) => setFormData({ ...formData, vinculacion_entidad_1: e.target.value })}
                    placeholder="0-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vinculacion_entidad_2">Entidad 2 (%)</Label>
                  <Input
                    id="vinculacion_entidad_2"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.vinculacion_entidad_2}
                    onChange={(e) => setFormData({ ...formData, vinculacion_entidad_2: e.target.value })}
                    placeholder="0-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vinculacion_entidad_3">Entidad 3 (%)</Label>
                  <Input
                    id="vinculacion_entidad_3"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.vinculacion_entidad_3}
                    onChange={(e) => setFormData({ ...formData, vinculacion_entidad_3: e.target.value })}
                    placeholder="0-100"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Legal/Fiscal */}
            <TabsContent value="legal" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_id">NIF/CIF</Label>
                  <Input
                    id="tax_id"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration_number">{t('company.registrationNumber')}</Label>
                  <Input
                    id="registration_number"
                    value={formData.registration_number}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="legal_form">{t('company.legalForm')}</Label>
                <Input
                  id="legal_form"
                  value={formData.legal_form}
                  onChange={(e) => setFormData({ ...formData, legal_form: e.target.value })}
                  placeholder="SL, SA, Cooperativa, etc."
                />
              </div>
            </TabsContent>

            {/* Gestión */}
            <TabsContent value="management" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">{t('common.status')}</Label>
                  <Select value={formData.status_id} onValueChange={(v) => setFormData({ ...formData, status_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.selectOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      {statusColors.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color_hex }} />
                            {s.status_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gestor">{t('companyForm.manager')}</Label>
                  <Select value={formData.gestor_id} onValueChange={(v) => setFormData({ ...formData, gestor_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.selectOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      {gestores.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.full_name || g.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha">{t('companyForm.lastVisit')}</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha_ultima_visita}
                  onChange={(e) => setFormData({ ...formData, fecha_ultima_visita: e.target.value })}
                />
              </div>
            </TabsContent>

            {/* Fotos */}
            <TabsContent value="photos" className="space-y-4 mt-4">
              {editingCompany && (
                <CompanyPhotosManager 
                  companyId={editingCompany.id} 
                  companyName={editingCompany.name}
                />
              )}
            </TabsContent>

            {/* Histórico de Actividades */}
            <TabsContent value="history" className="space-y-4 mt-4">
              {editingCompany && (
                <div className="space-y-6">
                  {/* Formulario para nueva visita */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        {t('visitForm.addVisit')}
                      </h3>
                      <Button 
                        variant={showVisitForm ? "outline" : "default"}
                        size="sm"
                        onClick={() => setShowVisitForm(!showVisitForm)}
                      >
                        {showVisitForm ? t('common.cancel') : t('visitForm.addVisit')}
                      </Button>
                    </div>

                    {showVisitForm && (
                      <Card className="p-4 mb-4">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="visit_date">{t('visitForm.visitDate')} *</Label>
                              <Input
                                id="visit_date"
                                type="date"
                                value={visitFormData.visit_date}
                                onChange={(e) => setVisitFormData({ ...visitFormData, visit_date: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="visit_gestor">{t('companyForm.manager')} *</Label>
                              <Select 
                                value={visitFormData.gestor_id} 
                                onValueChange={(v) => setVisitFormData({ ...visitFormData, gestor_id: v })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t('form.selectOption')} />
                                </SelectTrigger>
                                <SelectContent>
                                  {gestores.map((g) => (
                                    <SelectItem key={g.id} value={g.id}>
                                      {g.full_name || g.email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>{t('visitForm.products')}</Label>
                            <ScrollArea className="h-[200px] border rounded-md p-3">
                              <div className="space-y-4">
                                {['activo', 'pasivo', 'servicio'].map((category) => (
                                  <div key={category}>
                                    <h4 className="font-medium text-sm mb-2 capitalize flex items-center gap-2">
                                      <Package className="h-4 w-4" />
                                      {category === 'activo' ? t('product.activeCategory') :
                                       category === 'pasivo' ? t('product.passiveCategory') :
                                       t('product.serviceCategory')}
                                    </h4>
                                    <div className="space-y-2 ml-6">
                                      {products
                                        .filter((p) => p.category === category)
                                        .map((product) => (
                                          <div key={product.id} className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`product-${product.id}`}
                                              checked={visitFormData.productos_ofrecidos.includes(product.name)}
                                              onCheckedChange={() => toggleProducto(product.name)}
                                            />
                                            <label
                                              htmlFor={`product-${product.id}`}
                                              className="text-sm cursor-pointer"
                                            >
                                              {product.name}
                                              {product.description && (
                                                <span className="text-muted-foreground ml-1">
                                                  - {product.description}
                                                </span>
                                              )}
                                            </label>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="porcentaje_vinculacion">
                                {t('visitForm.linkage')} (%)
                              </Label>
                              <Input
                                id="porcentaje_vinculacion"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={visitFormData.porcentaje_vinculacion}
                                onChange={(e) => setVisitFormData({ ...visitFormData, porcentaje_vinculacion: e.target.value })}
                                placeholder="0.00"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="result">{t('visitForm.result')}</Label>
                              <Select 
                                value={visitFormData.result} 
                                onValueChange={(v) => setVisitFormData({ ...visitFormData, result: v })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t('form.selectOption')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Exitosa">{t('visit.success')}</SelectItem>
                                  <SelectItem value="Pendiente seguimiento">{t('visit.pending')}</SelectItem>
                                  <SelectItem value="Sin interés">{t('visit.noInterest')}</SelectItem>
                                  <SelectItem value="Aplazada">{t('visit.postponed')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="pactos_realizados">{t('visitForm.agreements')}</Label>
                            <Textarea
                              id="pactos_realizados"
                              value={visitFormData.pactos_realizados}
                              onChange={(e) => setVisitFormData({ ...visitFormData, pactos_realizados: e.target.value })}
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="visit_notes">{t('company.notes')}</Label>
                            <Textarea
                              id="visit_notes"
                              value={visitFormData.notes}
                              onChange={(e) => setVisitFormData({ ...visitFormData, notes: e.target.value })}
                              rows={3}
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => setShowVisitForm(false)}
                            >
                              {t('common.cancel')}
                            </Button>
                            <Button onClick={handleSaveVisit} disabled={loading}>
                              {loading ? t('common.loading') : t('common.save')}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Visitas Realizadas */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {t('visitForm.visitHistory')} ({visits.length})
                    </h3>
                    <ScrollArea className="h-[300px] border rounded-md p-4">
                      {visits.length > 0 ? (
                        <div className="space-y-3">
                          {visits.map((visit) => (
                            <Card key={visit.id} className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-sm font-semibold">
                                      {new Date(visit.visit_date).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {t('companyForm.manager')}: {visit.gestor?.full_name || visit.gestor?.email || 'N/A'}
                                    </p>
                                  </div>
                                  {visit.result && (
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      visit.result === 'Exitosa' ? 'bg-green-100 text-green-800' :
                                      visit.result === 'Sin interés' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {visit.result}
                                    </span>
                                  )}
                                </div>

                                {visit.productos_ofrecidos && visit.productos_ofrecidos.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium mb-1">{t('visitForm.products')}:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {visit.productos_ofrecidos.map((prod, idx) => (
                                        <span 
                                          key={idx} 
                                          className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded"
                                        >
                                          {prod}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {visit.porcentaje_vinculacion !== null && (
                                  <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      <span className="font-medium">{t('visitForm.linkage')}:</span> {visit.porcentaje_vinculacion}%
                                    </span>
                                  </div>
                                )}

                                {visit.pactos_realizados && (
                                  <div>
                                    <p className="text-xs font-medium mb-1">{t('visitForm.agreements')}:</p>
                                    <p className="text-sm text-muted-foreground">{visit.pactos_realizados}</p>
                                  </div>
                                )}

                                {visit.notes && (
                                  <div>
                                    <p className="text-xs font-medium mb-1">{t('company.notes')}:</p>
                                    <p className="text-sm text-muted-foreground">{visit.notes}</p>
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          {t('visitForm.noVisits')}
                        </p>
                      )}
                    </ScrollArea>
                  </div>

                  {/* Cambios y Actualizaciones */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {t('audit.changesHistory')}
                    </h3>
                    <ScrollArea className="h-[200px] border rounded-md p-4">
                      {auditLogs.length > 0 ? (
                        <div className="space-y-3">
                          {auditLogs.map((log) => (
                            <Card key={log.id} className="p-3">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                    log.action === 'INSERT' ? 'bg-green-100 text-green-800' :
                                    log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {log.action === 'INSERT' ? t('audit.created') :
                                     log.action === 'UPDATE' ? t('audit.updated') : t('audit.deleted')}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(log.created_at).toLocaleString()}
                                  </span>
                                </div>
                                
                                {log.action === 'UPDATE' && log.old_data && log.new_data && (
                                  <div className="text-sm space-y-1 mt-2">
                                    {Object.keys(log.new_data).map((key) => {
                                      if (log.old_data[key] !== log.new_data[key] && 
                                          key !== 'updated_at' && 
                                          key !== 'created_at') {
                                        return (
                                          <div key={key} className="text-xs">
                                            <span className="font-medium capitalize">
                                              {key.replace('_', ' ')}:
                                            </span>
                                            <span className="text-muted-foreground line-through ml-1">
                                              {log.old_data[key] || t('audit.empty')}
                                            </span>
                                            <span className="mx-1">→</span>
                                            <span className="text-foreground font-medium">
                                              {log.new_data[key] || t('audit.empty')}
                                            </span>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })}
                                  </div>
                                )}

                                {log.action === 'INSERT' && (
                                  <p className="text-sm text-muted-foreground">
                                    {t('audit.companyCreated')}
                                  </p>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          {t('audit.noChanges')}
                        </p>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excel Importer */}
      <ExcelImporter
        open={importerOpen}
        onOpenChange={setImporterOpen}
        onImportComplete={fetchData}
        parroquias={parroquias}
      />
    </Card>
  );
}