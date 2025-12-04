import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, CalendarIcon, Edit, Trash2, Eye, Building2, Search, Filter, X, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ca, es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Company {
  id: string;
  name: string;
  address: string;
}

interface Visit {
  id: string;
  company_id: string;
  gestor_id: string;
  visit_date: string;
  notes: string | null;
  result: string | null;
  productos_ofrecidos: string[] | null;
  companies?: { name: string };
}

interface Product {
  id: string;
  name: string;
}

interface QuickVisitManagerProps {
  gestorId?: string;
  onVisitCreated?: () => void;
}

export function QuickVisitManager({ gestorId, onVisitCreated }: QuickVisitManagerProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [visitDate, setVisitDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  // Data
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [companySearch, setCompanySearch] = useState('');
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);
  const [showRecentVisits, setShowRecentVisits] = useState(true);
  
  // Filters for recent visits
  const [filterResult, setFilterResult] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>(undefined);
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>(undefined);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [visitsPerPage, setVisitsPerPage] = useState(10);

  const effectiveGestorId = gestorId || user?.id;

  // Get selected company object
  const selectedCompanyData = companies.find(c => c.id === selectedCompany);

  useEffect(() => {
    loadCompanies();
    loadProducts();
    loadRecentVisits();
  }, [effectiveGestorId]);

  const loadCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, address')
      .order('name');
    
    if (!error && data) {
      setCompanies(data);
    }
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .eq('active', true)
      .order('name');
    
    if (!error && data) {
      setProducts(data);
    }
  };

  const loadRecentVisits = async () => {
    const query = supabase
      .from('visits')
      .select('*, companies(name)')
      .order('visit_date', { ascending: false })
      .limit(100);
    
    if (effectiveGestorId) {
      query.eq('gestor_id', effectiveGestorId);
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      setRecentVisits(data);
      setCurrentPage(1);
    }
  };

  const resetForm = () => {
    setSelectedCompany('');
    setVisitDate(new Date());
    setNotes('');
    setResult('');
    setSelectedProducts([]);
    setIsEditing(false);
    setEditingVisit(null);
    setCompanySearch('');
  };

  const handleEditVisit = (visit: Visit) => {
    setIsEditing(true);
    setEditingVisit(visit);
    setSelectedCompany(visit.company_id);
    setVisitDate(new Date(visit.visit_date));
    setNotes(visit.notes || '');
    setResult(visit.result || '');
    setSelectedProducts(visit.productos_ofrecidos || []);
    setShowRecentVisits(false);
  };

  const handleDeleteVisit = async (visitId: string) => {
    if (!confirm('Estàs segur que vols eliminar aquesta visita?')) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('visits')
      .delete()
      .eq('id', visitId);
    
    if (error) {
      toast.error('Error eliminant la visita');
      console.error(error);
    } else {
      toast.success('Visita eliminada correctament');
      loadRecentVisits();
      onVisitCreated?.();
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedCompany || !visitDate || !effectiveGestorId) {
      toast.error('Si us plau, selecciona una empresa i una data');
      return;
    }

    setLoading(true);

    const visitData = {
      company_id: selectedCompany,
      gestor_id: effectiveGestorId,
      visit_date: format(visitDate, 'yyyy-MM-dd'),
      notes: notes || null,
      result: result || null,
      productos_ofrecidos: selectedProducts.length > 0 ? selectedProducts : null,
    };

    let error;

    if (isEditing && editingVisit) {
      const { error: updateError } = await supabase
        .from('visits')
        .update(visitData)
        .eq('id', editingVisit.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('visits')
        .insert(visitData);
      error = insertError;
    }

    if (error) {
      toast.error(isEditing ? 'Error actualitzant la visita' : 'Error creant la visita');
      console.error(error);
    } else {
      toast.success(isEditing ? 'Visita actualitzada correctament' : 'Visita creada correctament');
      resetForm();
      loadRecentVisits();
      setShowRecentVisits(true);
      onVisitCreated?.();
    }

    setLoading(false);
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
    c.address.toLowerCase().includes(companySearch.toLowerCase())
  );

  const resultOptions = [
    { value: 'exitosa', label: 'Exitosa' },
    { value: 'pendiente', label: 'Pendent' },
    { value: 'fallida', label: 'Fallida' },
    { value: 'reprogramada', label: 'Reprogramada' },
  ];

  // Filter recent visits
  const filteredRecentVisits = recentVisits.filter(visit => {
    // Filter by company search
    if (companySearch && showRecentVisits) {
      const companyName = visit.companies?.name?.toLowerCase() || '';
      if (!companyName.includes(companySearch.toLowerCase())) {
        return false;
      }
    }
    // Filter by result
    if (filterResult !== 'all' && visit.result !== filterResult) {
      return false;
    }
    // Filter by date from
    if (filterDateFrom && new Date(visit.visit_date) < filterDateFrom) {
      return false;
    }
    // Filter by date to
    if (filterDateTo && new Date(visit.visit_date) > filterDateTo) {
      return false;
    }
    return true;
  });

  const clearFilters = () => {
    setFilterResult('all');
    setFilterDateFrom(undefined);
    setFilterDateTo(undefined);
    setCompanySearch('');
  };

  const hasActiveFilters = filterResult !== 'all' || filterDateFrom || filterDateTo || (companySearch && showRecentVisits);

  // Pagination calculations
  const totalFilteredVisits = filteredRecentVisits.length;
  const totalPages = Math.ceil(totalFilteredVisits / visitsPerPage);
  const startIndex = (currentPage - 1) * visitsPerPage;
  const paginatedVisits = filteredRecentVisits.slice(startIndex, startIndex + visitsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterResult, filterDateFrom, filterDateTo]);

  const toggleProduct = (productName: string) => {
    setSelectedProducts(prev => 
      prev.includes(productName)
        ? prev.filter(p => p !== productName)
        : [...prev, productName]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with selected company */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestió de Visites</h2>
          <p className="text-muted-foreground">Crea, edita i gestiona les teves visites comercials</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={showRecentVisits ? "default" : "outline"} 
            size="sm"
            onClick={() => { setShowRecentVisits(true); if (!isEditing) resetForm(); }}
          >
            <Eye className="h-4 w-4 mr-1" />
            Llistat ({recentVisits.length})
          </Button>
          <Button 
            variant={!showRecentVisits ? "default" : "outline"} 
            size="sm"
            onClick={() => { setShowRecentVisits(false); if (!isEditing) resetForm(); }}
          >
            <Plus className="h-4 w-4 mr-1" />
            {isEditing ? 'Editant' : 'Nova Visita'}
          </Button>
        </div>
      </div>

      {/* Selected company chip */}
      {selectedCompanyData && !showRecentVisits && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-medium">{selectedCompanyData.name}</p>
                <p className="text-sm text-muted-foreground truncate">{selectedCompanyData.address}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCompany('')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showRecentVisits ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Visites Recents
            </CardTitle>
            <CardDescription>Les teves últimes visites comercials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Company filter for recent visits */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtra per empresa..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Filter className="h-4 w-4 text-muted-foreground" />
              
              {/* Result filter */}
              <Select value={filterResult} onValueChange={setFilterResult}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Resultat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tots els resultats</SelectItem>
                  {resultOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Date from filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-9 w-[130px] justify-start text-left font-normal",
                      !filterDateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {filterDateFrom ? format(filterDateFrom, "dd/MM/yy") : "Des de"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterDateFrom}
                    onSelect={setFilterDateFrom}
                    locale={ca}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              {/* Date to filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-9 w-[130px] justify-start text-left font-normal",
                      !filterDateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {filterDateTo ? format(filterDateTo, "dd/MM/yy") : "Fins a"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterDateTo}
                    onSelect={setFilterDateTo}
                    locale={ca}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              {/* Clear filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4 mr-1" />
                  Netejar
                </Button>
              )}
            </div>
            
            {/* Statistics summary */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                Total: {filteredRecentVisits.length}
              </Badge>
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                Exitoses: {filteredRecentVisits.filter(v => v.result === 'exitosa').length}
              </Badge>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                Pendents: {filteredRecentVisits.filter(v => v.result === 'pendiente').length}
              </Badge>
              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                Fallides: {filteredRecentVisits.filter(v => v.result === 'fallida').length}
              </Badge>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                Reprog.: {filteredRecentVisits.filter(v => v.result === 'reprogramada').length}
              </Badge>
            </div>
            
            {/* Results count */}
            <p className="text-sm text-muted-foreground">
              {totalFilteredVisits === 0 
                ? 'Cap visita' 
                : `${startIndex + 1}-${Math.min(startIndex + visitsPerPage, totalFilteredVisits)} de ${totalFilteredVisits} visites`}
              {hasActiveFilters && ` (filtrat de ${recentVisits.length})`}
            </p>
            
            {/* Visits list */}
            <div className="space-y-2">
              {paginatedVisits.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {recentVisits.length === 0 
                    ? 'No hi ha visites recents' 
                    : 'Cap visita coincideix amb els filtres'}
                </div>
              ) : (
                paginatedVisits.map((visit) => (
                  <div 
                    key={visit.id} 
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">
                          {visit.companies?.name || 'Empresa desconeguda'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>{format(new Date(visit.visit_date), 'dd/MM/yyyy')}</span>
                        {visit.result && (
                          <Badge variant="outline" className="text-xs">
                            {visit.result}
                          </Badge>
                        )}
                      </div>
                      {visit.notes && (
                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                          {visit.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => handleEditVisit(visit)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteVisit(visit.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Pàgina {currentPage} de {totalPages}
                  </span>
                  <Select value={String(visitsPerPage)} onValueChange={(v) => { setVisitsPerPage(Number(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Següent
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isEditing ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {isEditing ? 'Editar Visita' : 'Nova Visita'}
            </CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Modifica els detalls de la visita'
                : 'Crea una nova visita comercial'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Selection */}
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca empresa..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-40 border rounded-md">
                <div className="p-2 space-y-1">
                  {filteredCompanies.slice(0, 50).map((company) => (
                    <div
                      key={company.id}
                      className={cn(
                        "p-3 rounded cursor-pointer transition-colors",
                        selectedCompany === company.id 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-accent"
                      )}
                      onClick={() => setSelectedCompany(company.id)}
                    >
                      <div className="font-medium">{company.name}</div>
                      <div className="text-sm opacity-70 truncate">{company.address}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Visit Date */}
              <div className="space-y-2">
                <Label>Data de la visita *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !visitDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {visitDate ? format(visitDate, "PPP", { locale: ca }) : "Selecciona data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={visitDate}
                      onSelect={setVisitDate}
                      locale={ca}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Result */}
              <div className="space-y-2">
                <Label>Resultat</Label>
                <Select value={result} onValueChange={setResult}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona resultat" />
                  </SelectTrigger>
                  <SelectContent>
                    {resultOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Products */}
            <div className="space-y-2">
              <Label>Productes oferts</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[80px]">
                {products.map((product) => (
                  <Badge
                    key={product.id}
                    variant={selectedProducts.includes(product.name) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleProduct(product.name)}
                  >
                    {product.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Afegeix notes sobre la visita..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => { resetForm(); setShowRecentVisits(true); }}
              >
                Cancel·lar
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Guardant...' : (isEditing ? 'Actualitzar' : 'Crear Visita')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
