import { useState, useEffect, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Phone, Tag, User, Eye, Trash2, Plus, Search, Grid3x3, List, CheckSquare, Square, Package, Users, Mail, FileText, TrendingUp, Camera, Upload, Copy, Loader2, AlertTriangle, CheckCircle2, XCircle, Clock, History, Pencil, Globe, Lock } from "lucide-react";
import { toast } from 'sonner';
import { CompanyWithDetails, StatusColor, Profile } from '@/types/database';
import { ExcelImporter } from './ExcelImporter';
import { CompanyPhotosManager } from '@/components/company/CompanyPhotosManager';
import { CompaniesPagination } from './CompaniesPagination';
import { CompanyExportButton } from './CompanyExportButton';
import { CompanyDataCompleteness } from './CompanyDataCompleteness';
import { AdvancedCompanyFilters } from './AdvancedCompanyFilters';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useCompaniesServerPagination } from '@/hooks/useCompaniesServerPagination';
import { useCompanyPhotosLazy } from '@/hooks/useCompanyPhotosLazy';

interface AdvancedFilters {
  status?: string;
  gestor?: string;
  parroquia?: string;
  oficina?: string;
  clientType?: string;
  hasPhone?: boolean;
  hasEmail?: boolean;
  hasGeolocalization?: boolean;
  minVinculacion?: number;
  maxVinculacion?: number;
  minEmployees?: number;
  maxEmployees?: number;
  minTurnover?: number;
  maxTurnover?: number;
}
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
  const { user, isAuditor, isCommercialDirector, isSuperAdmin, isCommercialManager, isOfficeDirector } = useAuth();
  const [userOficina, setUserOficina] = useState<string | null>(null);
  
  // Use server-side pagination hook
  const {
    companies,
    loading: companiesLoading,
    pagination,
    filters,
    setPage,
    setPageSize,
    setFilters,
    refetch,
    statusColors,
    gestores,
    parroquias,
    oficinas,
    products,
    allTags,
  } = useCompaniesServerPagination({
    userId: user?.id,
    userOficina,
    isAuditor,
    isSuperAdmin,
    isCommercialDirector,
    isCommercialManager,
    isOfficeDirector,
  });

  // Lazy loading for photos
  const { getPhoto, loadPhotosForCompanies, isLoading: photosLoading } = useCompanyPhotosLazy();

  // Load photos for current page companies
  useEffect(() => {
    if (companies.length > 0) {
      const companyIds = companies.map(c => c.id);
      loadPhotosForCompanies(companyIds);
    }
  }, [companies, loadPhotosForCompanies]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [importerOpen, setImporterOpen] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0 });
  const [duplicates, setDuplicates] = useState<{ group: CompanyWithDetails[], reason: string }[]>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [detectingDuplicates, setDetectingDuplicates] = useState(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());
  const [visits, setVisits] = useState<Visit[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [detailsCompany, setDetailsCompany] = useState<CompanyWithDetails | null>(null);
  const [isSearchingPhotos, setIsSearchingPhotos] = useState(false);
  const [photoSearchProgress, setPhotoSearchProgress] = useState(0);
  const [sortBy, setSortBy] = useState<string>('name-asc');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [bulkActionDialog, setBulkActionDialog] = useState<'gestor' | 'status' | 'products' | 'oficina' | 'tags' | null>(null);
  const [bulkGestorId, setBulkGestorId] = useState<string>('');
  const [bulkStatusId, setBulkStatusId] = useState<string>('');
  const [bulkProductIds, setBulkProductIds] = useState<string[]>([]);
  const [bulkOficina, setBulkOficina] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [bulkTags, setBulkTags] = useState<string[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});
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
    tags: [] as string[],
  });

  // Debounced search - update filters when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters({ search: searchQuery });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, setFilters]);

  // Update filters when sort or tags change
  useEffect(() => {
    setFilters({ sortBy, tags: selectedTags });
  }, [sortBy, selectedTags, setFilters]);

  useEffect(() => {
    if (user) {
      fetchUserOffice();
    }
  }, [user]);

  const fetchUserOffice = async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('oficina')
        .eq('id', user.id)
        .single();
      if (profile?.oficina) {
        setUserOficina(profile.oficina);
      }
    } catch (error) {
      console.error('Error fetching user office:', error);
    }
  };

  // Check if user can edit a specific company
  const canEditCompany = (company: CompanyWithDetails): boolean => {
    // Auditors cannot edit anything
    if (isAuditor) return false;
    
    // Superadmins, commercial directors, and commercial managers can edit all
    if (isSuperAdmin || isCommercialDirector || isCommercialManager) return true;
    
    // Office directors can edit companies in their office
    if (isOfficeDirector && userOficina) {
      return company.oficina === userOficina;
    }
    
    // Regular gestores can only edit their own assigned companies
    return company.gestor_id === user?.id;
  };

  // Check if user can delete companies
  const canDeleteCompanies = (): boolean => {
    return isSuperAdmin || isCommercialDirector || isCommercialManager;
  };

  // Check if user can add new companies
  const canAddCompany = (): boolean => {
    return !isAuditor;
  };

  // Removed loadCompanyPhotos - now using useCompanyPhotosLazy hook
  // Removed loadAllTags - now using useCompaniesServerPagination hook
  // Removed fetchData - now using useCompaniesServerPagination hook

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
        tags: formData.tags || [],
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
      refetch();
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
      refetch();
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
      tags: (company as any).tags || [],
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
      tags: [],
    });
  };

  const handleBulkGeocode = async () => {
    if (!confirm('¿Desea geocodificar todas las empresas sin coordenadas? Este proceso puede tardar varios minutos.')) {
      return;
    }

    try {
      setGeocoding(true);
      
      // Obtener empresas sin coordenadas válidas
      const companiesWithoutCoords = companies.filter(
        c => !c.latitude || !c.longitude || c.latitude === 0 || c.longitude === 0
      );

      if (companiesWithoutCoords.length === 0) {
        toast.info('Todas las empresas ya tienen coordenadas asignadas');
        return;
      }

      setGeocodingProgress({ current: 0, total: companiesWithoutCoords.length });
      
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < companiesWithoutCoords.length; i++) {
        const company = companiesWithoutCoords[i];
        setGeocodingProgress({ current: i + 1, total: companiesWithoutCoords.length });

        try {
          const { data, error } = await supabase.functions.invoke('geocode-address', {
            body: {
              address: company.address,
              parroquia: company.parroquia
            }
          });

          if (error) throw error;

          if (data.latitude && data.longitude) {
            const { error: updateError } = await supabase
              .from('companies')
              .update({
                latitude: data.latitude,
                longitude: data.longitude
              })
              .eq('id', company.id);

            if (updateError) throw updateError;
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Error geocoding company ${company.name}:`, error);
          failCount++;
        }

        // Pequeña pausa entre solicitudes para no sobrecargar el servicio
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      toast.success(`Geocodificación completada: ${successCount} exitosas, ${failCount} fallidas`);
      await refetch();
    } catch (error: any) {
      console.error('Error in bulk geocoding:', error);
      toast.error('Error en el proceso de geocodificación masiva');
    } finally {
      setGeocoding(false);
      setGeocodingProgress({ current: 0, total: 0 });
    }
  };

  const handleSearchPhotosAll = async () => {
    if (!confirm(`¿Desea buscar fotos para todas las empresas? Este proceso puede tardar varios minutos y consumirá créditos de la API de Bing.`)) {
      return;
    }

    setIsSearchingPhotos(true);
    setPhotoSearchProgress(0);

    try {
      const totalCompanies = companies.length;

      if (totalCompanies === 0) {
        toast.info("No se encontraron empresas en la base de datos");
        return;
      }

      console.log(`Buscando fotos para ${totalCompanies} empresas...`);

      let photosFound = 0;
      let processed = 0;

      for (const company of companies) {
        try {
          const { data: photoData, error: photoError } = await supabase.functions.invoke(
            'search-company-photo',
            {
              body: {
                companyId: company.id,
                companyName: company.name,
                address: company.address,
                parroquia: company.parroquia,
              },
            }
          );

          if (!photoError && photoData?.success) {
            photosFound++;
            console.log(`Foto encontrada para: ${company.name}`);
          }
        } catch (error) {
          console.error(`Error buscando foto para ${company.name}:`, error);
        }

        processed++;
        setPhotoSearchProgress(Math.round((processed / totalCompanies) * 100));
        
        // Pequeña pausa entre solicitudes para no sobrecargar el servicio
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      toast.success(`Búsqueda completada: ${photosFound} fotos encontradas de ${totalCompanies} empresas`);

      // Reload company photos by refetching (lazy loading will load photos for new page)
      await refetch();
    } catch (error) {
      console.error("Error en búsqueda de fotos:", error);
      toast.error("Error al buscar fotos de empresas");
    } finally {
      setIsSearchingPhotos(false);
      setPhotoSearchProgress(0);
    }
  };

  const detectDuplicates = async () => {
    setDetectingDuplicates(true);
    try {
      // Obtener TODAS las empresas de la base de datos
      const { data: allCompanies, error } = await supabase
        .from('companies')
        .select('*, status_colors(*), profiles(*)')
        .order('name');

      if (error) throw error;
      if (!allCompanies || allCompanies.length === 0) {
        toast.info('No hay empresas en la base de datos');
        return;
      }

      const companies = allCompanies as CompanyWithDetails[];
      const duplicateGroups: { group: CompanyWithDetails[], reason: string }[] = [];
      const processed = new Set<string>();

      // Detectar por nombre exacto
      const nameGroups = new Map<string, CompanyWithDetails[]>();
      companies.forEach(company => {
        const normalizedName = company.name.toLowerCase().trim();
        if (!nameGroups.has(normalizedName)) {
          nameGroups.set(normalizedName, []);
        }
        nameGroups.get(normalizedName)!.push(company);
      });

      nameGroups.forEach((group, name) => {
        if (group.length > 1) {
          duplicateGroups.push({ group, reason: `Nombre idéntico: "${name}"` });
          group.forEach(c => processed.add(c.id));
        }
      });

      // Detectar por tax_id
      const taxIdGroups = new Map<string, CompanyWithDetails[]>();
      companies.forEach(company => {
        const taxId = (company as any).tax_id;
        if (taxId && taxId.trim() && !processed.has(company.id)) {
          const normalized = taxId.toLowerCase().trim();
          if (!taxIdGroups.has(normalized)) {
            taxIdGroups.set(normalized, []);
          }
          taxIdGroups.get(normalized)!.push(company);
        }
      });

      taxIdGroups.forEach((group, taxId) => {
        if (group.length > 1) {
          duplicateGroups.push({ group, reason: `NIF/CIF idéntico: "${taxId}"` });
          group.forEach(c => processed.add(c.id));
        }
      });

      if (duplicateGroups.length === 0) {
        toast.info('No se encontraron empresas duplicadas en toda la base de datos');
      } else {
        const totalDuplicates = duplicateGroups.reduce((sum, g) => sum + g.group.length, 0);
        setDuplicates(duplicateGroups);
        setShowDuplicates(true);
        toast.success(`Se encontraron ${duplicateGroups.length} grupos con ${totalDuplicates} empresas duplicadas en total`);
      }
    } catch (error) {
      console.error('Error detecting duplicates:', error);
      toast.error('Error al detectar duplicados');
    } finally {
      setDetectingDuplicates(false);
    }
  };

  const toggleSelection = (companyId: string) => {
    setSelectedForDeletion(prev => {
      const newSet = new Set(prev);
      if (newSet.has(companyId)) {
        newSet.delete(companyId);
      } else {
        newSet.add(companyId);
      }
      return newSet;
    });
  };

  const handleDeleteDuplicates = async () => {
    if (selectedForDeletion.size === 0) {
      toast.error('Selecciona al menos una empresa para eliminar');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar ${selectedForDeletion.size} empresa(s)?`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedForDeletion).map(id =>
        supabase.from('companies').delete().eq('id', id)
      );

      await Promise.all(deletePromises);
      
      toast.success(`Se eliminaron ${selectedForDeletion.size} empresa(s)`);
      setSelectedForDeletion(new Set());
      setShowDuplicates(false);
      setDuplicates([]);
      await refetch();
    } catch (error: any) {
      console.error('Error deleting duplicates:', error);
      toast.error('Error al eliminar duplicados');
    }
  };

  const selectAllInGroup = (group: CompanyWithDetails[]) => {
    setSelectedForDeletion(prev => {
      const newSet = new Set(prev);
      group.forEach(company => newSet.add(company.id));
      return newSet;
    });
  };

  const deselectAllInGroup = (group: CompanyWithDetails[]) => {
    setSelectedForDeletion(prev => {
      const newSet = new Set(prev);
      group.forEach(company => newSet.delete(company.id));
      return newSet;
    });
  };

  const selectAllDuplicates = () => {
    try {
      const allIds = new Set<string>();
      duplicates.forEach(duplicateGroup => {
        duplicateGroup.group.forEach(company => {
          if (company && company.id) {
            allIds.add(company.id);
          }
        });
      });
      
      if (allIds.size === 0) {
        toast.error('No hay empresas para seleccionar');
        return;
      }
      
      setSelectedForDeletion(allIds);
      toast.success(`${allIds.size} empresas seleccionadas para eliminar`);
    } catch (error) {
      console.error('Error al seleccionar todas las empresas:', error);
      toast.error('Error al seleccionar empresas');
    }
  };

  const deselectAll = () => {
    setSelectedForDeletion(new Set());
    toast.info('Selección limpiada');
  };

  const isGroupFullySelected = (group: CompanyWithDetails[]) => {
    return group.every(company => selectedForDeletion.has(company.id));
  };

  const isGeolocated = (company: CompanyWithDetails) => {
    return company.latitude && company.longitude && company.latitude !== 0 && company.longitude !== 0;
  };

  const getAverageLinkage = (company: CompanyWithDetails) => {
    const v1 = (company as any).vinculacion_entidad_1 || 0;
    const v2 = (company as any).vinculacion_entidad_2 || 0;
    const v3 = (company as any).vinculacion_entidad_3 || 0;
    return (v1 + v2 + v3) / 3;
  };

  const toggleCompanySelection = (companyId: string) => {
    setSelectedCompanies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(companyId)) {
        newSet.delete(companyId);
      } else {
        newSet.add(companyId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedCompanies.size === filteredAndSortedCompanies.length) {
      setSelectedCompanies(new Set());
    } else {
      setSelectedCompanies(new Set(filteredAndSortedCompanies.map(c => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCompanies.size === 0) {
      toast.error(t('companyForm.selectCompanies'));
      return;
    }

    if (!confirm(`${t('companyForm.confirmBulkDelete')} (${selectedCompanies.size})?`)) {
      return;
    }

    try {
      setLoading(true);
      const deletePromises = Array.from(selectedCompanies).map(id =>
        supabase.from('companies').delete().eq('id', id)
      );
      await Promise.all(deletePromises);
      
      toast.success(`${t('companyForm.bulkDeleteSuccess')} (${selectedCompanies.size})`);
      setSelectedCompanies(new Set());
      await refetch();
    } catch (error: any) {
      console.error('Error deleting companies:', error);
      toast.error(t('form.errorDeleting'));
    } finally {
      setLoading(false);
    }
  };

  const handleBulkChangeGestor = async () => {
    if (!bulkGestorId) {
      toast.error(t('companyForm.selectGestor'));
      return;
    }

    try {
      setLoading(true);
      const updatePromises = Array.from(selectedCompanies).map(id =>
        supabase.from('companies').update({ gestor_id: bulkGestorId }).eq('id', id)
      );
      await Promise.all(updatePromises);
      
      toast.success(`${t('companyForm.bulkGestorSuccess')} (${selectedCompanies.size})`);
      setSelectedCompanies(new Set());
      setBulkActionDialog(null);
      setBulkGestorId('');
      await refetch();
    } catch (error: any) {
      console.error('Error updating gestor:', error);
      toast.error(t('form.errorSaving'));
    } finally {
      setLoading(false);
    }
  };

  const handleBulkChangeStatus = async () => {
    if (!bulkStatusId) {
      toast.error(t('companyForm.selectStatus'));
      return;
    }

    try {
      setLoading(true);
      const updatePromises = Array.from(selectedCompanies).map(id =>
        supabase.from('companies').update({ status_id: bulkStatusId }).eq('id', id)
      );
      await Promise.all(updatePromises);
      
      toast.success(`${t('companyForm.bulkStatusSuccess')} (${selectedCompanies.size})`);
      setSelectedCompanies(new Set());
      setBulkActionDialog(null);
      setBulkStatusId('');
      await refetch();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(t('form.errorSaving'));
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssignProducts = async () => {
    if (bulkProductIds.length === 0) {
      toast.error(t('companyForm.selectProducts'));
      return;
    }

    try {
      setLoading(true);
      
      for (const companyId of selectedCompanies) {
        // Get existing products for this company
        const { data: existingProducts } = await supabase
          .from('company_products')
          .select('product_id')
          .eq('company_id', companyId);
        
        const existingProductIds = existingProducts?.map(p => p.product_id) || [];
        
        // Only insert products that don't already exist
        const newProducts = bulkProductIds.filter(pid => !existingProductIds.includes(pid));
        
        if (newProducts.length > 0) {
          const productRecords = newProducts.map(productId => ({
            company_id: companyId,
            product_id: productId,
            active: true
          }));
          
          await supabase.from('company_products').insert(productRecords);
        }
      }
      
      toast.success(`${t('companyForm.bulkProductsSuccess')} (${selectedCompanies.size})`);
      setSelectedCompanies(new Set());
      setBulkActionDialog(null);
      setBulkProductIds([]);
      await refetch();
    } catch (error: any) {
      console.error('Error assigning products:', error);
      toast.error(t('form.errorSaving'));
    } finally {
      setLoading(false);
    }
  };

  const handleBulkChangeOficina = async () => {
    if (!bulkOficina) {
      toast.error(t('companyForm.selectOficina'));
      return;
    }

    try {
      setLoading(true);
      const updatePromises = Array.from(selectedCompanies).map(id =>
        supabase.from('companies').update({ oficina: bulkOficina }).eq('id', id)
      );
      await Promise.all(updatePromises);
      
      toast.success(`${t('companyForm.bulkOficinaSuccess')} (${selectedCompanies.size})`);
      setSelectedCompanies(new Set());
      setBulkActionDialog(null);
      setBulkOficina('');
      await refetch();
    } catch (error: any) {
      console.error('Error updating oficina:', error);
      toast.error(t('form.errorSaving'));
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAddTags = async () => {
    if (bulkTags.length === 0) {
      toast.error(t('companyForm.selectTags'));
      return;
    }

    try {
      setLoading(true);
      
      for (const companyId of selectedCompanies) {
        const company = companies.find(c => c.id === companyId);
        const existingTags = (company as any)?.tags || [];
        const newTags = [...new Set([...existingTags, ...bulkTags])];
        
        await supabase
          .from('companies')
          .update({ tags: newTags })
          .eq('id', companyId);
      }
      
      toast.success(`${t('companyForm.bulkTagsSuccess')} (${selectedCompanies.size})`);
      setSelectedCompanies(new Set());
      setBulkActionDialog(null);
      setBulkTags([]);
      await refetch();
    } catch (error: any) {
      console.error('Error adding tags:', error);
      toast.error(t('form.errorSaving'));
    } finally {
      setLoading(false);
    }
  };

  const addTagToCompany = (tag: string) => {
    if (!tag.trim()) return;
    if (formData.tags.includes(tag)) {
      toast.info(t('companyForm.tagAlreadyExists'));
      return;
    }
    setFormData({ ...formData, tags: [...formData.tags, tag] });
    setNewTag('');
  };

  const removeTagFromCompany = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Apply advanced filters client-side (server-side handles basic filters)
  const filteredAndSortedCompanies = useMemo(() => {
    return companies.filter(company => {
      // Status filter
      if (advancedFilters.status && company.status_id !== advancedFilters.status) return false;
      
      // Gestor filter
      if (advancedFilters.gestor && company.gestor_id !== advancedFilters.gestor) return false;
      
      // Parroquia filter
      if (advancedFilters.parroquia && company.parroquia !== advancedFilters.parroquia) return false;
      
      // Oficina filter
      if (advancedFilters.oficina && company.oficina !== advancedFilters.oficina) return false;
      
      // Client type filter
      if (advancedFilters.clientType && (company as any).client_type !== advancedFilters.clientType) return false;
      
      // Has phone filter
      if (advancedFilters.hasPhone && !(company as any).phone) return false;
      
      // Has email filter
      if (advancedFilters.hasEmail && !(company as any).email) return false;
      
      // Has geolocalization filter
      if (advancedFilters.hasGeolocalization && (!company.latitude || !company.longitude || company.latitude === 0)) return false;
      
      // Vinculacion range
      const vinc = (company as any).vinculacion_entidad_1 || 0;
      if (advancedFilters.minVinculacion !== undefined && vinc < advancedFilters.minVinculacion) return false;
      if (advancedFilters.maxVinculacion !== undefined && vinc > advancedFilters.maxVinculacion) return false;
      
      // Employees range
      const employees = (company as any).employees || 0;
      if (advancedFilters.minEmployees !== undefined && employees < advancedFilters.minEmployees) return false;
      if (advancedFilters.maxEmployees !== undefined && employees > advancedFilters.maxEmployees) return false;
      
      // Turnover range
      const turnover = (company as any).turnover || 0;
      if (advancedFilters.minTurnover !== undefined && turnover < advancedFilters.minTurnover) return false;
      if (advancedFilters.maxTurnover !== undefined && turnover > advancedFilters.maxTurnover) return false;
      
      return true;
    });
  }, [companies, advancedFilters]);


  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle>{t('admin.companies')}</CardTitle>
            <CardDescription>{t('companyForm.title')}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {canDeleteCompanies() && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={detectDuplicates}
                disabled={detectingDuplicates}
              >
                {detectingDuplicates ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="ml-2">{t('companyForm.detectDuplicates')}</span>
              </Button>
            )}
            {canDeleteCompanies() && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBulkGeocode}
                disabled={geocoding}
              >
                <MapPin className="h-4 w-4" />
                <span className="ml-2">
                  {geocoding ? `${t('companyForm.geocoding')} ${geocodingProgress.current}/${geocodingProgress.total}...` : t('companyForm.geocodeCompanies')}
                </span>
              </Button>
            )}
            
            {canDeleteCompanies() && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSearchPhotosAll}
                disabled={isSearchingPhotos}
              >
                {isSearchingPhotos ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">{t('companyForm.searchingPhotos')} {photoSearchProgress}%</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    <span className="ml-2">{t('companyForm.searchPhotos')}</span>
                  </>
                )}
              </Button>
            )}
            
            {canDeleteCompanies() && (
              <Button variant="outline" size="sm" onClick={() => setImporterOpen(true)}>
                <Upload className="h-4 w-4" />
                <span className="ml-2">{t('companyForm.importExcel')}</span>
              </Button>
            )}
            <CompanyExportButton 
              companies={companies} 
              selectedCompanies={selectedCompanies} 
            />
            {canAddCompany() && (
              <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
                <Plus className="h-4 w-4" />
                <span className="ml-2">{t('companyForm.addCompany')}</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div className="mb-4 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">{t('companyForm.filterByTags')}</h4>
              {selectedTags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTags([])}
                  className="ml-auto h-6 text-xs"
                >
                  {t('companyForm.clearTagFilters')}
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => toggleTagFilter(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Search Bar, Sort Selector, and View Toggle */}
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1">
            <Input
              placeholder={t('companyForm.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <div className="sm:w-64">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder={t('companyForm.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">{t('companyForm.sortNameAsc')}</SelectItem>
                <SelectItem value="name-desc">{t('companyForm.sortNameDesc')}</SelectItem>
                <SelectItem value="linkage-desc">{t('companyForm.sortLinkageDesc')}</SelectItem>
                <SelectItem value="linkage-asc">{t('companyForm.sortLinkageAsc')}</SelectItem>
                <SelectItem value="visit-desc">{t('companyForm.sortVisitDesc')}</SelectItem>
                <SelectItem value="visit-asc">{t('companyForm.sortVisitAsc')}</SelectItem>
                <SelectItem value="geolocated">{t('companyForm.sortGeolocated')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <AdvancedCompanyFilters
              statusColors={statusColors}
              gestores={gestores}
              parroquias={parroquias}
              oficinas={oficinas}
              onFiltersChange={setAdvancedFilters}
            />
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('cards')}
              title={t('companyForm.cardView')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              title={t('companyForm.listView')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {viewMode === 'cards' ? (
          <ScrollArea className="h-[600px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedCompanies.map((company) => {
              const photoUrl = getPhoto(company.id);
              return (
                <Card 
                  key={company.id} 
                  className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 border-border/50 hover:border-primary/30 cursor-pointer"
                >
                  {/* Background Photo with Blur */}
                  {photoUrl && (
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{
                        backgroundImage: `url(${photoUrl})`,
                        filter: 'blur(20px) brightness(0.3)',
                      }}
                      onClick={() => setSelectedPhoto(photoUrl)}
                    />
                  )}
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/85 to-background/75" />
                  
                  {/* Content */}
                  <CardContent className="relative p-6 space-y-4 z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-xl truncate mb-2 text-foreground drop-shadow-lg">
                          {company.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Status Badge */}
                          <div 
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm"
                            style={{ 
                              backgroundColor: `${company.status?.color_hex || '#gray'}90`,
                              color: '#ffffff',
                              border: `2px solid ${company.status?.color_hex || '#gray'}`
                            }}
                          >
                            <div
                              className="h-2 w-2 rounded-full animate-pulse"
                              style={{ backgroundColor: '#ffffff' }}
                            />
                            {company.status?.status_name || 'N/A'}
                          </div>
                          
                          {/* Geolocation Indicator - Compact */}
                          <div 
                            className="inline-flex items-center justify-center w-7 h-7 rounded-full shadow-lg backdrop-blur-sm border-2"
                            style={{
                              backgroundColor: isGeolocated(company) ? '#10b98190' : '#ef444490',
                              borderColor: isGeolocated(company) ? '#10b981' : '#ef4444'
                            }}
                            title={isGeolocated(company) ? t('companyForm.geolocated') : t('companyForm.notGeolocated')}
                          >
                            <MapPin className="h-4 w-4 text-white" />
                          </div>

                          {/* Client Type Badge */}
                          {(company as any).client_type && (
                            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm ${
                              (company as any).client_type === 'cliente' 
                                ? 'bg-primary/90 text-white border-2 border-primary'
                                : 'bg-muted/90 text-foreground border-2 border-muted-foreground/30'
                            }`}>
                              {(company as any).client_type === 'cliente' ? 'Cliente' : 'Potencial'}
                            </div>
                          )}
                          
                          {/* Data Completeness Indicator */}
                          <CompanyDataCompleteness company={company} />
                        </div>
                      </div>
                    </div>

                    {/* Key Info - Most Important Data */}
                    <div className="space-y-3 text-sm">
                      {/* Address */}
                      <div className="flex items-start gap-2 bg-background/60 backdrop-blur-sm p-3 rounded-lg shadow-sm">
                        <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">{company.address}</p>
                          <p className="text-muted-foreground text-xs mt-0.5">{company.parroquia}</p>
                        </div>
                      </div>

                      {/* Phone - Always visible */}
                      <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm p-3 rounded-lg shadow-sm">
                        <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                        {(company as any).phone ? (
                          <a 
                            href={`tel:${(company as any).phone}`}
                            className="text-foreground font-medium hover:text-primary transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {(company as any).phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">{t('companyForm.noPhone')}</span>
                        )}
                      </div>

                      {/* Vinculación Creand */}
                      {((company as any).vinculacion_entidad_1 || (company as any).vinculacion_entidad_2 || (company as any).vinculacion_entidad_3) && (
                        <div className="flex items-center gap-2 bg-primary/10 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-primary/30">
                          <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-semibold text-primary">
                              {t('companyForm.creandLinkage')}: {
                                Math.round(
                                  (
                                    ((company as any).vinculacion_entidad_1 || 0) +
                                    ((company as any).vinculacion_entidad_2 || 0) +
                                    ((company as any).vinculacion_entidad_3 || 0)
                                  ) / 3
                                )
                              }%
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Email */}
                      {(company as any).email && (
                        <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm p-3 rounded-lg shadow-sm">
                          <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                          <a 
                            href={`mailto:${(company as any).email}`}
                            className="text-foreground truncate hover:text-primary transition-colors text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {(company as any).email}
                          </a>
                        </div>
                      )}

                      {/* Manager */}
                      {company.gestor && (
                        <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm p-3 rounded-lg shadow-sm">
                          <Users className="h-4 w-4 text-primary flex-shrink-0" />
                          <p className="text-foreground truncate font-medium">
                            {company.gestor.full_name || company.gestor.email}
                          </p>
                        </div>
                      )}

                      {/* Tags */}
                      {(company as any).tags && (company as any).tags.length > 0 && (
                        <div className="bg-background/60 backdrop-blur-sm p-3 rounded-lg shadow-sm">
                          <div className="flex flex-wrap gap-1.5">
                            {(company as any).tags.map((tag: string, idx: number) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/20 text-primary border border-primary/30"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1 shadow-lg backdrop-blur-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailsCompany(company);
                          handleEdit(company);
                        }}
                      >
                        {canEditCompany(company) ? (
                          <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {canEditCompany(company) ? 'Editar' : 'Ver'}
                      </Button>
                      {canDeleteCompanies() && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="shadow-lg backdrop-blur-sm bg-background/80 hover:bg-destructive/20 text-destructive hover:text-destructive border-destructive/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(company.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
        ) : (
          <>
            {/* Bulk Actions Bar */}
            {selectedCompanies.size > 0 && (
              <div className="mb-4 p-4 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {t('companyForm.selectedCount')}: {selectedCompanies.size}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedCompanies(new Set())}
                  >
                    {t('companyForm.clearSelection')}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setBulkActionDialog('gestor')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {t('companyForm.changeGestor')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setBulkActionDialog('status')}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    {t('companyForm.changeStatus')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setBulkActionDialog('products')}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    {t('companyForm.assignProducts')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setBulkActionDialog('oficina')}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    {t('companyForm.changeOficina')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setBulkActionDialog('tags')}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    {t('companyForm.addTags')}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('companyForm.deleteSelected')}
                  </Button>
                </div>
              </div>
            )}
            
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedCompanies.size === filteredAndSortedCompanies.length && filteredAndSortedCompanies.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-[30px]"></TableHead>
                    <TableHead>{t('company.name')}</TableHead>
                    <TableHead>{t('company.address')}</TableHead>
                    <TableHead>{t('company.phone')}</TableHead>
                    <TableHead>{t('company.status')}</TableHead>
                    <TableHead>{t('company.manager')}</TableHead>
                    <TableHead>{t('companyForm.tags')}</TableHead>
                    <TableHead className="text-center">{t('companyForm.creandLinkage')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedCompanies.map((company) => {
                    const avgLinkage = getAverageLinkage(company);
                    return (
                      <TableRow key={company.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedCompanies.has(company.id)}
                            onCheckedChange={() => toggleCompanySelection(company.id)}
                          />
                        </TableCell>
                        <TableCell>
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: isGeolocated(company) ? '#10b98150' : '#ef444450',
                          }}
                          title={isGeolocated(company) ? t('companyForm.geolocated') : t('companyForm.notGeolocated')}
                        >
                          <MapPin className="h-3 w-3" style={{ color: isGeolocated(company) ? '#10b981' : '#ef4444' }} />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getPhoto(company.id) && (
                            <div 
                              className="w-8 h-8 rounded bg-cover bg-center cursor-pointer flex-shrink-0"
                              style={{ backgroundImage: `url(${getPhoto(company.id)})` }}
                              onClick={() => setSelectedPhoto(getPhoto(company.id)!)}
                            />
                          )}
                          <span className="truncate max-w-[200px]">{company.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {company.address}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(company as any).phone ? (
                          <a 
                            href={`tel:${(company as any).phone}`}
                            className="text-sm hover:text-primary transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {(company as any).phone}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t('companyForm.noPhone')}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.status && (
                          <div 
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: `${company.status.color_hex}30`,
                              color: company.status.color_hex,
                            }}
                          >
                            {company.status.status_name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px] truncate text-sm">
                          {company.gestor?.full_name || company.gestor?.email || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {(company as any).tags && (company as any).tags.length > 0 ? (
                            (company as any).tags.slice(0, 2).map((tag: string, idx: number) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                          {(company as any).tags && (company as any).tags.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{(company as any).tags.length - 2}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {avgLinkage > 0 ? (
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary font-semibold text-sm">
                            <TrendingUp className="h-3 w-3" />
                            {Math.round(avgLinkage)}%
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setDetailsCompany(company);
                              handleEdit(company);
                            }}
                            title={canEditCompany(company) ? 'Editar' : 'Ver'}
                          >
                            {canEditCompany(company) ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          {canDeleteCompanies() && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(company.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
          </>
        )}

        {/* Pagination */}
        <CompaniesPagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalCount={pagination.totalCount}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          loading={companiesLoading}
        />
      </CardContent>

      {/* Photo Viewer Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
          <div className="relative w-full h-full">
            <img 
              src={selectedPhoto || ''} 
              alt="Foto de empresa" 
              className="w-full h-auto max-h-[85vh] object-contain"
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm"
              onClick={() => setSelectedPhoto(null)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for Create/Edit with Tabs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCompany ? t('companyForm.editCompany') : t('companyForm.addCompany')}</DialogTitle>
            <DialogDescription>
              {t('companyForm.title')}
            </DialogDescription>
          </DialogHeader>

          {/* Data Completeness Indicator for existing company */}
          {editingCompany && (
            <CompanyDataCompleteness company={editingCompany} showDetails />
          )}

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
              <TabsTrigger value="tags" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span>{t('companyForm.tags')}</span>
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

            {/* Tags */}
            <TabsContent value="tags" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    {t('companyForm.manageTags')}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('companyForm.tagsDescription')}
                  </p>
                </div>

                {/* Add New Tag */}
                <div className="flex gap-2">
                  <Input
                    placeholder={t('companyForm.addNewTag')}
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTagToCompany(newTag);
                      }
                    }}
                  />
                  <Button
                    variant="default"
                    onClick={() => addTagToCompany(newTag)}
                    disabled={!newTag.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('common.add')}
                  </Button>
                </div>

                {/* Current Tags */}
                {formData.tags.length > 0 && (
                  <div>
                    <Label className="mb-2 block">{t('companyForm.currentTags')}</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-md border border-primary/30"
                        >
                          <span className="text-sm font-medium">{tag}</span>
                          <button
                            onClick={() => removeTagFromCompany(tag)}
                            className="hover:text-destructive transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Tags from Other Companies */}
                {allTags.length > 0 && (
                  <div>
                    <Label className="mb-2 block">{t('companyForm.suggestedTags')}</Label>
                    <div className="flex flex-wrap gap-2">
                      {allTags
                        .filter(tag => !formData.tags.includes(tag))
                        .map((tag, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => addTagToCompany(tag)}
                            className="h-8"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {tag}
                          </Button>
                        ))}
                    </div>
                  </div>
                )}
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
        onImportComplete={refetch}
        parroquias={parroquias}
      />

      {/* Duplicates Dialog */}
      <Dialog open={showDuplicates} onOpenChange={setShowDuplicates}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Empresas Duplicadas Detectadas
            </DialogTitle>
            <DialogDescription>
              Se encontraron {duplicates.length} grupos de empresas duplicadas. Selecciona las que deseas eliminar.
            </DialogDescription>
          </DialogHeader>

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllDuplicates}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Seleccionar Todos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deselectAll}
                disabled={selectedForDeletion.size === 0}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                Limpiar Selección
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm">
                {selectedForDeletion.size > 0 ? (
                  <span className="text-destructive font-semibold">
                    {selectedForDeletion.size} seleccionada(s)
                  </span>
                ) : (
                  <span className="text-muted-foreground">Ninguna seleccionada</span>
                )}
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteDuplicates}
                disabled={selectedForDeletion.size === 0}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar Seleccionados
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-6">
            {duplicates.map((duplicateGroup, groupIndex) => (
              <Card key={groupIndex} className="border-warning/20 bg-warning/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Copy className="h-4 w-4" />
                      {duplicateGroup.reason}
                      <span className="text-xs text-muted-foreground font-normal">
                        ({duplicateGroup.group.length} empresas)
                      </span>
                    </CardTitle>
                    <div className="flex gap-2">
                      {isGroupFullySelected(duplicateGroup.group) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deselectAllInGroup(duplicateGroup.group)}
                          className="h-8 text-xs gap-1.5"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Deseleccionar Grupo
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => selectAllInGroup(duplicateGroup.group)}
                          className="h-8 text-xs gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Seleccionar Grupo
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {duplicateGroup.group.map((company) => (
                    <div 
                      key={company.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                        selectedForDeletion.has(company.id)
                          ? 'bg-destructive/10 border-destructive/50'
                          : 'bg-background border-border hover:border-primary/30'
                      }`}
                    >
                      <Checkbox
                        checked={selectedForDeletion.has(company.id)}
                        onCheckedChange={() => toggleSelection(company.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{company.name}</p>
                            <p className="text-sm text-muted-foreground">{company.address}, {company.parroquia}</p>
                          </div>
                          {isGeolocated(company) ? (
                            <div className="flex items-center gap-1 text-xs text-success">
                              <CheckCircle2 className="h-3 w-3" />
                              Geolocalizado
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-destructive">
                              <XCircle className="h-3 w-3" />
                              Sin coordenadas
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {(company as any).tax_id && (
                            <span>NIF: {(company as any).tax_id}</span>
                          )}
                          {(company as any).phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {(company as any).phone}
                            </span>
                          )}
                          {(company as any).email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {(company as any).email}
                            </span>
                          )}
                          {company.gestor && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {company.gestor.full_name || company.gestor.email}
                            </span>
                          )}
                          {company.fecha_ultima_visita && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(company.fecha_ultima_visita).toLocaleDateString('es-ES')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDuplicates(false);
                setSelectedForDeletion(new Set());
              }}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Change Gestor Dialog */}
      <Dialog open={bulkActionDialog === 'gestor'} onOpenChange={() => setBulkActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('companyForm.changeGestor')}</DialogTitle>
            <DialogDescription>
              {t('companyForm.bulkGestorDescription')} ({selectedCompanies.size})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-gestor">{t('company.manager')}</Label>
              <Select value={bulkGestorId} onValueChange={setBulkGestorId}>
                <SelectTrigger id="bulk-gestor">
                  <SelectValue placeholder={t('form.selectOption')} />
                </SelectTrigger>
                <SelectContent>
                  {gestores.map((gestor) => (
                    <SelectItem key={gestor.id} value={gestor.id}>
                      {gestor.full_name || gestor.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleBulkChangeGestor} disabled={loading || !bulkGestorId}>
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Change Status Dialog */}
      <Dialog open={bulkActionDialog === 'status'} onOpenChange={() => setBulkActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('companyForm.changeStatus')}</DialogTitle>
            <DialogDescription>
              {t('companyForm.bulkStatusDescription')} ({selectedCompanies.size})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-status">{t('company.status')}</Label>
              <Select value={bulkStatusId} onValueChange={setBulkStatusId}>
                <SelectTrigger id="bulk-status">
                  <SelectValue placeholder={t('form.selectOption')} />
                </SelectTrigger>
                <SelectContent>
                  {statusColors.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.status_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleBulkChangeStatus} disabled={loading || !bulkStatusId}>
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Products Dialog */}
      <Dialog open={bulkActionDialog === 'products'} onOpenChange={() => setBulkActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('companyForm.assignProducts')}</DialogTitle>
            <DialogDescription>
              {t('companyForm.bulkAssignProductsDesc')} ({selectedCompanies.size})
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-3">
              {products.map((product) => (
                <div key={product.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id={`product-${product.id}`}
                    checked={bulkProductIds.includes(product.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setBulkProductIds([...bulkProductIds, product.id]);
                      } else {
                        setBulkProductIds(bulkProductIds.filter(id => id !== product.id));
                      }
                    }}
                  />
                  <label
                    htmlFor={`product-${product.id}`}
                    className="flex-1 text-sm font-medium leading-none cursor-pointer"
                  >
                    {product.name}
                    {product.description && (
                      <span className="block text-xs text-muted-foreground mt-1">{product.description}</span>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleBulkAssignProducts} disabled={loading || bulkProductIds.length === 0}>
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Change Oficina Dialog */}
      <Dialog open={bulkActionDialog === 'oficina'} onOpenChange={() => setBulkActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('companyForm.changeOficina')}</DialogTitle>
            <DialogDescription>
              {t('companyForm.bulkChangeOficinaDesc')} ({selectedCompanies.size})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-oficina">{t('companyForm.office')}</Label>
              <Select value={bulkOficina} onValueChange={setBulkOficina}>
                <SelectTrigger id="bulk-oficina">
                  <SelectValue placeholder={t('form.selectOption')} />
                </SelectTrigger>
                <SelectContent>
                  {oficinas.map((oficina) => (
                    <SelectItem key={oficina.concept_value} value={oficina.concept_value}>
                      {oficina.concept_value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleBulkChangeOficina} disabled={loading || !bulkOficina}>
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Tags Dialog */}
      <Dialog open={bulkActionDialog === 'tags'} onOpenChange={() => setBulkActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('companyForm.addTags')}</DialogTitle>
            <DialogDescription>
              {t('companyForm.bulkTagsDescription')} ({selectedCompanies.size})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('companyForm.selectTagsToAdd')}</Label>
              <ScrollArea className="h-[200px] border rounded-md p-3">
                <div className="space-y-2">
                  {allTags.length > 0 ? (
                    allTags.map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={`bulk-tag-${tag}`}
                          checked={bulkTags.includes(tag)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setBulkTags([...bulkTags, tag]);
                            } else {
                              setBulkTags(bulkTags.filter(t => t !== tag));
                            }
                          }}
                        />
                        <label
                          htmlFor={`bulk-tag-${tag}`}
                          className="text-sm cursor-pointer"
                        >
                          {tag}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t('companyForm.noTagsAvailable')}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleBulkAddTags} disabled={loading || bulkTags.length === 0}>
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}