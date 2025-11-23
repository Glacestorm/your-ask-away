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
import { Plus, Pencil, Trash2, Upload, Phone, Mail, Globe, Users, Building2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { CompanyWithDetails, StatusColor, Profile } from '@/types/database';
import * as XLSX from 'xlsx';

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

export function CompaniesManager() {
  const [companies, setCompanies] = useState<CompanyWithDetails[]>([]);
  const [statusColors, setStatusColors] = useState<StatusColor[]>([]);
  const [gestores, setGestores] = useState<Profile[]>([]);
  const [parroquias, setParroquias] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
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
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [companiesRes, statusRes, gestoresRes, conceptsRes] = await Promise.all([
        supabase.from('companies').select('*, status_colors(*), profiles(*)').order('name'),
        supabase.from('status_colors').select('*').order('display_order'),
        supabase.from('profiles').select('*').order('full_name'),
        supabase.from('concepts').select('*').eq('concept_type', 'parroquia').eq('active', true),
      ]);

      if (companiesRes.data) setCompanies(companiesRes.data as CompanyWithDetails[]);
      if (statusRes.data) setStatusColors(statusRes.data);
      if (gestoresRes.data) setGestores(gestoresRes.data);
      if (conceptsRes.data) setParroquias(conceptsRes.data.map((c: any) => c.concept_value));
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar los datos');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!formData.name || !formData.address || !formData.parroquia) {
        toast.error('Por favor completa los campos obligatorios');
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
      };

      if (editingCompany) {
        const { error } = await supabase
          .from('companies')
          .update(dataToSave)
          .eq('id', editingCompany.id);

        if (error) throw error;
        toast.success('Empresa actualizada correctamente');
      } else {
        const { error } = await supabase
          .from('companies')
          .insert(dataToSave);

        if (error) throw error;
        toast.success('Empresa creada correctamente');
      }

      setDialogOpen(false);
      setEditingCompany(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving company:', error);
      toast.error('Error al guardar la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta empresa?')) return;

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Empresa eliminada correctamente');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting company:', error);
      toast.error('Error al eliminar la empresa');
    }
  };

  const handleEdit = (company: CompanyWithDetails) => {
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
    });
    setDialogOpen(true);
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
    });
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      for (const row of jsonData) {
        await supabase.from('companies').insert({
          name: row.Nombre || row.name,
          address: row.Dirección || row.Direccion || row.address,
          longitude: Number(row.Longitud || row.longitude || 1.5218),
          latitude: Number(row.Latitud || row.latitude || 42.5063),
          cnae: row.CNAE || row.cnae || null,
          parroquia: row.Parroquia || row.parroquia || 'Andorra la Vella',
          oficina: row.Oficina || row.oficina || null,
          observaciones: row.Observaciones || row.observaciones || null,
          phone: row.Telefono || row.Teléfono || row.phone || null,
          email: row.Email || row.email || null,
          website: row.Web || row.website || null,
          sector: row.Sector || row.sector || null,
        });
      }

      toast.success(`Se importaron ${jsonData.length} empresas correctamente`);
      fetchData();
    } catch (error: any) {
      console.error('Error importing Excel:', error);
      toast.error('Error al importar el archivo Excel');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestión de Empresas</CardTitle>
            <CardDescription>Administración completa del fichero de empresas</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => document.getElementById('excel-input')?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Importar Excel
            </Button>
            <input
              id="excel-input"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportExcel}
            />
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Empresa
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Parroquia</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Gestor</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}</DialogTitle>
            <DialogDescription>
              Gestiona toda la información de la empresa por secciones
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">
                <Building2 className="h-4 w-4 mr-2" />
                Datos Básicos
              </TabsTrigger>
              <TabsTrigger value="contact">
                <Phone className="h-4 w-4 mr-2" />
                Contacto
              </TabsTrigger>
              <TabsTrigger value="business">
                <Users className="h-4 w-4 mr-2" />
                Empresarial
              </TabsTrigger>
              <TabsTrigger value="legal">
                <FileText className="h-4 w-4 mr-2" />
                Legal/Fiscal
              </TabsTrigger>
              <TabsTrigger value="management">
                <Globe className="h-4 w-4 mr-2" />
                Gestión
              </TabsTrigger>
            </TabsList>

            {/* Datos Básicos */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sector">Sector</Label>
                  <Input
                    id="sector"
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parroquia">Parroquia *</Label>
                  <Select value={formData.parroquia} onValueChange={(v) => setFormData({ ...formData, parroquia: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {parroquias.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oficina">Oficina</Label>
                  <Input
                    id="oficina"
                    value={formData.oficina}
                    onChange={(e) => setFormData({ ...formData, oficina: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitud *</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitud *</Label>
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
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+376 XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
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
                <Label htmlFor="website">Sitio Web</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.empresa.ad"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones de Contacto</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  rows={4}
                  placeholder="Notas sobre contactos, horarios, preferencias..."
                />
              </div>
            </TabsContent>

            {/* Empresarial */}
            <TabsContent value="business" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employees">Número de Empleados</Label>
                  <Input
                    id="employees"
                    type="number"
                    value={formData.employees}
                    onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="turnover">Facturación Anual (€)</Label>
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
                <Label htmlFor="cnae">CNAE</Label>
                <Input
                  id="cnae"
                  value={formData.cnae}
                  onChange={(e) => setFormData({ ...formData, cnae: e.target.value })}
                />
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
                  <Label htmlFor="registration_number">Número de Registro</Label>
                  <Input
                    id="registration_number"
                    value={formData.registration_number}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="legal_form">Forma Jurídica</Label>
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
                  <Label htmlFor="status">Estado</Label>
                  <Select value={formData.status_id} onValueChange={(v) => setFormData({ ...formData, status_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
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
                  <Label htmlFor="gestor">Gestor Asignado</Label>
                  <Select value={formData.gestor_id} onValueChange={(v) => setFormData({ ...formData, gestor_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
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
                <Label htmlFor="fecha">Fecha Última Visita</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha_ultima_visita}
                  onChange={(e) => setFormData({ ...formData, fecha_ultima_visita: e.target.value })}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}