import { useState } from 'react';
import { useSectors, Sector, SectorFeature, SectorStat, SectorAICapability, SectorRegulation, SectorCaseStudy } from '@/hooks/useSectors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, Star, StarOff, 
  Building2, ShoppingCart, Stethoscope, Factory, Truck, GraduationCap, 
  Landmark, Hotel, RefreshCw, Save, X
} from 'lucide-react';
import { toast } from 'sonner';

const iconOptions = [
  { value: 'ShoppingCart', label: 'Retail', icon: ShoppingCart },
  { value: 'Building2', label: 'Construcción', icon: Building2 },
  { value: 'Stethoscope', label: 'Salud', icon: Stethoscope },
  { value: 'Factory', label: 'Fabricación', icon: Factory },
  { value: 'Truck', label: 'Logística', icon: Truck },
  { value: 'GraduationCap', label: 'Educación', icon: GraduationCap },
  { value: 'Landmark', label: 'Finanzas', icon: Landmark },
  { value: 'Hotel', label: 'Hostelería', icon: Hotel },
];

const statusOptions = [
  { value: 'available', label: 'Disponible', color: 'bg-green-500' },
  { value: 'coming_soon', label: 'Próximamente', color: 'bg-amber-500' },
  { value: 'new', label: 'Nuevo', color: 'bg-blue-500' },
  { value: 'beta', label: 'Beta', color: 'bg-purple-500' },
];

const companySizeOptions = ['startup', 'pyme', 'mediana', 'gran_empresa', 'corporacion'];

interface SectorFormData {
  name: string;
  slug: string;
  description: string;
  short_description: string;
  icon_name: string;
  gradient_from: string;
  gradient_to: string;
  availability_status: 'available' | 'coming_soon' | 'new' | 'beta';
  target_company_sizes: string[];
  is_featured: boolean;
  is_active: boolean;
  order_position: number;
  cnae_codes: string[];
  features: SectorFeature[];
  stats: SectorStat[];
  ai_capabilities: SectorAICapability[];
  regulations: SectorRegulation[];
  case_studies: SectorCaseStudy[];
  landing_page_url: string;
  demo_video_url: string;
  image_url: string;
}

const defaultFormData: SectorFormData = {
  name: '',
  slug: '',
  description: '',
  short_description: '',
  icon_name: 'Building2',
  gradient_from: '#3B82F6',
  gradient_to: '#8B5CF6',
  availability_status: 'available',
  target_company_sizes: [],
  is_featured: false,
  is_active: true,
  order_position: 0,
  cnae_codes: [],
  features: [],
  stats: [],
  ai_capabilities: [],
  regulations: [],
  case_studies: [],
  landing_page_url: '',
  demo_video_url: '',
  image_url: '',
};

export function SectorsManager() {
  const { sectors, loading, refetch, createSector, updateSector, deleteSector } = useSectors();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [formData, setFormData] = useState<SectorFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  const handleEdit = (sector: Sector) => {
    setEditingSector(sector);
    setFormData({
      name: sector.name,
      slug: sector.slug,
      description: sector.description || '',
      short_description: sector.short_description || '',
      icon_name: sector.icon_name || 'Building2',
      gradient_from: sector.gradient_from || '#3B82F6',
      gradient_to: sector.gradient_to || '#8B5CF6',
      availability_status: sector.availability_status,
      target_company_sizes: sector.target_company_sizes || [],
      is_featured: sector.is_featured,
      is_active: sector.is_active,
      order_position: sector.order_position,
      cnae_codes: sector.cnae_codes || [],
      features: sector.features,
      stats: sector.stats,
      ai_capabilities: sector.ai_capabilities,
      regulations: sector.regulations,
      case_studies: sector.case_studies,
      landing_page_url: sector.landing_page_url || '',
      demo_video_url: sector.demo_video_url || '',
      image_url: sector.image_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingSector(null);
    setFormData({
      ...defaultFormData,
      order_position: sectors.length + 1,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Nombre y slug son obligatorios');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        features: formData.features,
        stats: formData.stats,
        ai_capabilities: formData.ai_capabilities,
        regulations: formData.regulations,
        case_studies: formData.case_studies,
      };

      if (editingSector) {
        await updateSector(editingSector.id, dataToSave);
      } else {
        await createSector(dataToSave);
      }
      setIsDialogOpen(false);
      setEditingSector(null);
      setFormData(defaultFormData);
    } catch (error) {
      console.error('Error saving sector:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este sector?')) {
      await deleteSector(id);
    }
  };

  const toggleFeatured = async (sector: Sector) => {
    await updateSector(sector.id, { is_featured: !sector.is_featured });
  };

  const toggleActive = async (sector: Sector) => {
    await updateSector(sector.id, { is_active: !sector.is_active });
  };

  const addFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, { title: '', description: '' }],
    });
  };

  const updateFeature = (index: number, field: keyof SectorFeature, value: string) => {
    const updated = [...formData.features];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, features: updated });
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const addStat = () => {
    setFormData({
      ...formData,
      stats: [...formData.stats, { value: 0, label: '', prefix: '', suffix: '' }],
    });
  };

  const updateStat = (index: number, field: keyof SectorStat, value: string | number) => {
    const updated = [...formData.stats];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, stats: updated });
  };

  const removeStat = (index: number) => {
    setFormData({
      ...formData,
      stats: formData.stats.filter((_, i) => i !== index),
    });
  };

  const addAICapability = () => {
    setFormData({
      ...formData,
      ai_capabilities: [...formData.ai_capabilities, { name: '', description: '' }],
    });
  };

  const updateAICapability = (index: number, field: keyof SectorAICapability, value: string) => {
    const updated = [...formData.ai_capabilities];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, ai_capabilities: updated });
  };

  const removeAICapability = (index: number) => {
    setFormData({
      ...formData,
      ai_capabilities: formData.ai_capabilities.filter((_, i) => i !== index),
    });
  };

  const addRegulation = () => {
    setFormData({
      ...formData,
      regulations: [...formData.regulations, { code: '', name: '' }],
    });
  };

  const updateRegulation = (index: number, field: keyof SectorRegulation, value: string) => {
    const updated = [...formData.regulations];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, regulations: updated });
  };

  const removeRegulation = (index: number) => {
    setFormData({
      ...formData,
      regulations: formData.regulations.filter((_, i) => i !== index),
    });
  };

  const getIconComponent = (iconName: string | null) => {
    const icon = iconOptions.find(i => i.value === iconName);
    if (icon) {
      const IconComponent = icon.icon;
      return <IconComponent className="h-5 w-5" />;
    }
    return <Building2 className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestió de Sectors</h2>
          <p className="text-muted-foreground">Administra els sectors de la plataforma</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualitzar
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nou Sector
          </Button>
        </div>
      </div>

      {/* Sectors List */}
      <div className="grid gap-4">
        {sectors.map((sector) => (
          <Card key={sector.id} className={`${!sector.is_active ? 'opacity-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="cursor-move text-muted-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>
                
                <div 
                  className="h-12 w-12 rounded-lg flex items-center justify-center text-white"
                  style={{ 
                    background: `linear-gradient(135deg, ${sector.gradient_from || '#3B82F6'}, ${sector.gradient_to || '#8B5CF6'})` 
                  }}
                >
                  {getIconComponent(sector.icon_name)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{sector.name}</h3>
                    <Badge variant={sector.availability_status === 'available' ? 'default' : 'secondary'}>
                      {statusOptions.find(s => s.value === sector.availability_status)?.label}
                    </Badge>
                    {sector.is_featured && (
                      <Badge variant="outline" className="border-amber-500 text-amber-500">
                        <Star className="h-3 w-3 mr-1" />
                        Destacat
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {sector.short_description || sector.description}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {sector.features.length} funcionalitats
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {sector.cnae_codes?.length || 0} CNAEs
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFeatured(sector)}
                    title={sector.is_featured ? 'Treure destacat' : 'Destacar'}
                  >
                    {sector.is_featured ? (
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    ) : (
                      <StarOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleActive(sector)}
                    title={sector.is_active ? 'Desactivar' : 'Activar'}
                  >
                    {sector.is_active ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(sector)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(sector.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sectors.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No hi ha sectors configurats</p>
            <Button onClick={handleCreate} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Crear primer sector
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingSector ? `Editar: ${editingSector.name}` : 'Nou Sector'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="basic">Bàsic</TabsTrigger>
              <TabsTrigger value="features">Funcionalitats</TabsTrigger>
              <TabsTrigger value="stats">Estadístiques</TabsTrigger>
              <TabsTrigger value="ai">IA i Regulacions</TabsTrigger>
              <TabsTrigger value="config">Configuració</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 pr-4">
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Retail y eCommerce"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="retail"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short_description">Descripció curta</Label>
                  <Input
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    placeholder="Solucions per al comerç minorista"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripció completa</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    placeholder="Descripció detallada del sector..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Icona</Label>
                    <Select
                      value={formData.icon_name}
                      onValueChange={(value) => setFormData({ ...formData, icon_name: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((icon) => (
                          <SelectItem key={icon.value} value={icon.value}>
                            <div className="flex items-center gap-2">
                              <icon.icon className="h-4 w-4" />
                              {icon.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gradient_from">Color gradient (inici)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.gradient_from}
                        onChange={(e) => setFormData({ ...formData, gradient_from: e.target.value })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.gradient_from}
                        onChange={(e) => setFormData({ ...formData, gradient_from: e.target.value })}
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gradient_to">Color gradient (fi)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.gradient_to}
                        onChange={(e) => setFormData({ ...formData, gradient_to: e.target.value })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.gradient_to}
                        onChange={(e) => setFormData({ ...formData, gradient_to: e.target.value })}
                        placeholder="#8B5CF6"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <Label>Funcionalitats</Label>
                  <Button variant="outline" size="sm" onClick={addFeature}>
                    <Plus className="h-4 w-4 mr-1" />
                    Afegir
                  </Button>
                </div>
                {formData.features.map((feature, index) => (
                  <Card key={index}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={feature.title}
                          onChange={(e) => updateFeature(index, 'title', e.target.value)}
                          placeholder="Títol de la funcionalitat"
                          className="flex-1"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeFeature(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={feature.description}
                        onChange={(e) => updateFeature(index, 'description', e.target.value)}
                        placeholder="Descripció de la funcionalitat"
                        rows={2}
                      />
                    </CardContent>
                  </Card>
                ))}
                {formData.features.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hi ha funcionalitats. Fes clic a "Afegir" per crear-ne una.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="stats" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <Label>Estadístiques</Label>
                  <Button variant="outline" size="sm" onClick={addStat}>
                    <Plus className="h-4 w-4 mr-1" />
                    Afegir
                  </Button>
                </div>
                {formData.stats.map((stat, index) => (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <div className="grid grid-cols-5 gap-2 items-center">
                        <Input
                          value={stat.prefix || ''}
                          onChange={(e) => updateStat(index, 'prefix', e.target.value)}
                          placeholder="Prefix"
                        />
                        <Input
                          type="number"
                          value={stat.value}
                          onChange={(e) => updateStat(index, 'value', Number(e.target.value))}
                          placeholder="Valor"
                        />
                        <Input
                          value={stat.suffix || ''}
                          onChange={(e) => updateStat(index, 'suffix', e.target.value)}
                          placeholder="Sufix (%)"
                        />
                        <Input
                          value={stat.label}
                          onChange={(e) => updateStat(index, 'label', e.target.value)}
                          placeholder="Etiqueta"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeStat(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="ai" className="space-y-6 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Capacitats IA</Label>
                    <Button variant="outline" size="sm" onClick={addAICapability}>
                      <Plus className="h-4 w-4 mr-1" />
                      Afegir
                    </Button>
                  </div>
                  {formData.ai_capabilities.map((cap, index) => (
                    <Card key={index}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            value={cap.name}
                            onChange={(e) => updateAICapability(index, 'name', e.target.value)}
                            placeholder="Nom de la capacitat"
                            className="flex-1"
                          />
                          <Button variant="ghost" size="icon" onClick={() => removeAICapability(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          value={cap.description}
                          onChange={(e) => updateAICapability(index, 'description', e.target.value)}
                          placeholder="Descripció"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Regulacions</Label>
                    <Button variant="outline" size="sm" onClick={addRegulation}>
                      <Plus className="h-4 w-4 mr-1" />
                      Afegir
                    </Button>
                  </div>
                  {formData.regulations.map((reg, index) => (
                    <Card key={index}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={reg.code}
                            onChange={(e) => updateRegulation(index, 'code', e.target.value)}
                            placeholder="Codi (ex: RGPD)"
                            className="w-32"
                          />
                          <Input
                            value={reg.name}
                            onChange={(e) => updateRegulation(index, 'name', e.target.value)}
                            placeholder="Nom complet"
                            className="flex-1"
                          />
                          <Button variant="ghost" size="icon" onClick={() => removeRegulation(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="config" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estat</Label>
                    <Select
                      value={formData.availability_status}
                      onValueChange={(value: any) => setFormData({ ...formData, availability_status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order">Ordre</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order_position}
                      onChange={(e) => setFormData({ ...formData, order_position: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Codis CNAE (separats per comes)</Label>
                  <Input
                    value={formData.cnae_codes.join(', ')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      cnae_codes: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    placeholder="47, 4711, 4719"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mida d'empresa objectiu</Label>
                  <div className="flex flex-wrap gap-2">
                    {companySizeOptions.map((size) => (
                      <Badge
                        key={size}
                        variant={formData.target_company_sizes.includes(size) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const updated = formData.target_company_sizes.includes(size)
                            ? formData.target_company_sizes.filter(s => s !== size)
                            : [...formData.target_company_sizes, size];
                          setFormData({ ...formData, target_company_sizes: updated });
                        }}
                      >
                        {size}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Destacat</Label>
                      <p className="text-xs text-muted-foreground">Mostrar a la pàgina principal</p>
                    </div>
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Actiu</Label>
                      <p className="text-xs text-muted-foreground">Visible al públic</p>
                    </div>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="landing_url">URL Landing Page</Label>
                    <Input
                      id="landing_url"
                      value={formData.landing_page_url}
                      onChange={(e) => setFormData({ ...formData, landing_page_url: e.target.value })}
                      placeholder="/sectors/retail"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demo_url">URL Vídeo Demo</Label>
                    <Input
                      id="demo_url"
                      value={formData.demo_video_url}
                      onChange={(e) => setFormData({ ...formData, demo_video_url: e.target.value })}
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image_url">URL Imatge</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel·lar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editingSector ? 'Guardar canvis' : 'Crear sector'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
