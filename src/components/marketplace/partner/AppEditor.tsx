import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, 
  Upload, 
  Image, 
  FileText, 
  Settings, 
  Code,
  DollarSign,
  Save,
  Send,
  X,
  Plus,
  Trash2,
  ExternalLink,
  Shield
} from 'lucide-react';
import { APP_CATEGORY_LABELS, PERMISSION_SCOPES, type AppCategory, type PriceType, type BillingPeriod, type PartnerApplication } from '@/types/marketplace';
import { useCreatePartnerApplication, useUpdatePartnerApplication, useSubmitAppForReview } from '@/hooks/usePartnerPortal';
import { toast } from 'sonner';

interface AppEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app?: PartnerApplication | null;
  partnerCompanyId: string;
}

const initialFormData = {
  app_name: '',
  app_key: '',
  short_description: '',
  description: '',
  category: 'other' as AppCategory,
  subcategory: '',
  icon_url: '',
  banner_url: '',
  screenshots: [] as string[],
  video_url: '',
  version: '1.0.0',
  price_type: 'free' as PriceType,
  price_amount: 0,
  price_currency: 'EUR',
  billing_period: null as BillingPeriod | null,
  trial_days: 0,
  documentation_url: '',
  support_url: '',
  privacy_policy_url: '',
  terms_url: '',
  webhook_url: '',
  api_scopes: [] as string[],
  min_plan: '',
  tags: [] as string[],
  is_premium: false,
};

export function AppEditor({ open, onOpenChange, app, partnerCompanyId }: AppEditorProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [newTag, setNewTag] = useState('');
  const [newScreenshot, setNewScreenshot] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  const createApp = useCreatePartnerApplication();
  const updateApp = useUpdatePartnerApplication();
  const submitForReview = useSubmitAppForReview();

  useEffect(() => {
    if (app) {
      setFormData({
        app_name: app.app_name || '',
        app_key: app.app_key || '',
        short_description: app.short_description || '',
        description: app.description || '',
        category: app.category || 'other',
        subcategory: app.subcategory || '',
        icon_url: app.icon_url || '',
        banner_url: app.banner_url || '',
        screenshots: app.screenshots || [],
        video_url: app.video_url || '',
        version: app.version || '1.0.0',
        price_type: app.price_type || 'free',
        price_amount: app.price_amount || 0,
        price_currency: app.price_currency || 'EUR',
        billing_period: app.billing_period,
        trial_days: app.trial_days || 0,
        documentation_url: app.documentation_url || '',
        support_url: app.support_url || '',
        privacy_policy_url: app.privacy_policy_url || '',
        terms_url: app.terms_url || '',
        webhook_url: app.webhook_url || '',
        api_scopes: app.api_scopes || [],
        min_plan: app.min_plan || '',
        tags: app.tags || [],
        is_premium: app.is_premium || false,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [app]);

  const generateAppKey = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      app_name: name,
      app_key: prev.app_key || generateAppKey(name),
    }));
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const addScreenshot = () => {
    if (newScreenshot && !formData.screenshots.includes(newScreenshot)) {
      setFormData(prev => ({ ...prev, screenshots: [...prev.screenshots, newScreenshot] }));
      setNewScreenshot('');
    }
  };

  const removeScreenshot = (url: string) => {
    setFormData(prev => ({ ...prev, screenshots: prev.screenshots.filter(s => s !== url) }));
  };

  const toggleScope = (scope: string) => {
    setFormData(prev => ({
      ...prev,
      api_scopes: prev.api_scopes.includes(scope)
        ? prev.api_scopes.filter(s => s !== scope)
        : [...prev.api_scopes, scope],
    }));
  };

  const handleSave = async (asDraft = true) => {
    if (!formData.app_name || !formData.app_key) {
      toast.error('El nombre y key de la app son obligatorios');
      return;
    }

    try {
      if (app?.id) {
        await updateApp.mutateAsync({
          id: app.id,
          ...formData,
          status: asDraft ? 'draft' : app.status,
        } as any);
      } else {
        await createApp.mutateAsync({
          partner_company_id: partnerCompanyId,
          ...formData,
          status: 'draft',
        } as any);
      }
      if (asDraft) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error saving app:', error);
    }
  };

  const handleSubmitForReview = async () => {
    if (!app?.id) {
      toast.error('Guarda la app primero');
      return;
    }

    await handleSave(false);
    await submitForReview.mutateAsync(app.id);
    onOpenChange(false);
  };

  const isLoading = createApp.isPending || updateApp.isPending || submitForReview.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {app ? 'Editar App' : 'Nueva App'}
          </DialogTitle>
          <DialogDescription>
            {app ? 'Modifica los detalles de tu aplicación' : 'Crea una nueva aplicación para el marketplace'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              General
            </TabsTrigger>
            <TabsTrigger value="media" className="text-xs">
              <Image className="h-3 w-3 mr-1" />
              Media
            </TabsTrigger>
            <TabsTrigger value="pricing" className="text-xs">
              <DollarSign className="h-3 w-3 mr-1" />
              Precios
            </TabsTrigger>
            <TabsTrigger value="technical" className="text-xs">
              <Code className="h-3 w-3 mr-1" />
              Técnico
            </TabsTrigger>
            <TabsTrigger value="permissions" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Permisos
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <div className="pr-4">
              <TabsContent value="general" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre de la App *</Label>
                    <Input
                      value={formData.app_name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Mi App Increíble"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>App Key *</Label>
                    <Input
                      value={formData.app_key}
                      onChange={(e) => setFormData(prev => ({ ...prev, app_key: e.target.value }))}
                      placeholder="mi-app-increible"
                    />
                    <p className="text-xs text-muted-foreground">Identificador único (solo letras, números y guiones)</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descripción corta</Label>
                  <Input
                    value={formData.short_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                    placeholder="Una breve descripción de tu app (max 160 caracteres)"
                    maxLength={160}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descripción completa</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe tu app en detalle..."
                    rows={5}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: AppCategory) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(APP_CATEGORY_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subcategoría</Label>
                    <Input
                      value={formData.subcategory}
                      onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                      placeholder="Ej: Facturación"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Versión</Label>
                    <Input
                      value={formData.version}
                      onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                      placeholder="1.0.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Plan mínimo requerido</Label>
                    <Select
                      value={formData.min_plan || '__none__'}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, min_plan: value === '__none__' ? '' : value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ninguno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Ninguno</SelectItem>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Añadir tag..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>URL del Icono</Label>
                    <Input
                      value={formData.icon_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon_url: e.target.value }))}
                      placeholder="https://..."
                    />
                    {formData.icon_url && (
                      <img src={formData.icon_url} alt="Icon preview" className="h-16 w-16 rounded-lg object-cover" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>URL del Banner</Label>
                    <Input
                      value={formData.banner_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, banner_url: e.target.value }))}
                      placeholder="https://..."
                    />
                    {formData.banner_url && (
                      <img src={formData.banner_url} alt="Banner preview" className="h-20 w-full rounded-lg object-cover" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>URL del Video (opcional)</Label>
                  <Input
                    value={formData.video_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Screenshots</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newScreenshot}
                      onChange={(e) => setNewScreenshot(e.target.value)}
                      placeholder="URL de la imagen..."
                    />
                    <Button type="button" variant="outline" onClick={addScreenshot}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {formData.screenshots.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img src={url} alt={`Screenshot ${idx + 1}`} className="h-24 w-full rounded-lg object-cover" />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeScreenshot(url)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de precio</Label>
                  <Select
                    value={formData.price_type}
                    onValueChange={(value: PriceType) => setFormData(prev => ({ ...prev, price_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Gratis</SelectItem>
                      <SelectItem value="one_time">Pago único</SelectItem>
                      <SelectItem value="subscription">Suscripción</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.price_type !== 'free' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Precio</Label>
                        <Input
                          type="number"
                          value={formData.price_amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, price_amount: parseFloat(e.target.value) || 0 }))}
                          min={0}
                          step={0.01}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Moneda</Label>
                        <Select
                          value={formData.price_currency}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, price_currency: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {formData.price_type === 'subscription' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Período de facturación</Label>
                          <Select
                            value={formData.billing_period || ''}
                            onValueChange={(value: BillingPeriod) => setFormData(prev => ({ ...prev, billing_period: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Mensual</SelectItem>
                              <SelectItem value="yearly">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Días de prueba gratis</Label>
                          <Input
                            type="number"
                            value={formData.trial_days}
                            onChange={(e) => setFormData(prev => ({ ...prev, trial_days: parseInt(e.target.value) || 0 }))}
                            min={0}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-center space-x-2 pt-4">
                  <Switch
                    id="premium"
                    checked={formData.is_premium}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_premium: checked }))}
                  />
                  <Label htmlFor="premium">Marcar como App Premium</Label>
                </div>
              </TabsContent>

              <TabsContent value="technical" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label>URL de documentación</Label>
                  <Input
                    value={formData.documentation_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, documentation_url: e.target.value }))}
                    placeholder="https://docs.mi-app.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>URL de soporte</Label>
                  <Input
                    value={formData.support_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, support_url: e.target.value }))}
                    placeholder="https://soporte.mi-app.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Política de privacidad</Label>
                    <Input
                      value={formData.privacy_policy_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, privacy_policy_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Términos y condiciones</Label>
                    <Input
                      value={formData.terms_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, terms_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Webhook URL (para notificaciones)</Label>
                  <Input
                    value={formData.webhook_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                    placeholder="https://api.mi-app.com/webhook"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recibirás notificaciones de instalaciones, desinstalaciones y eventos
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="mt-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Permisos de API</CardTitle>
                    <CardDescription>
                      Selecciona los permisos que necesita tu aplicación
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(PERMISSION_SCOPES).map(([scope, description]) => (
                        <div
                          key={scope}
                          className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                            formData.api_scopes.includes(scope) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                          }`}
                          onClick={() => toggleScope(scope)}
                        >
                          <Switch
                            checked={formData.api_scopes.includes(scope)}
                            onCheckedChange={() => toggleScope(scope)}
                          />
                          <div>
                            <p className="text-sm font-mono">{scope}</p>
                            <p className="text-xs text-muted-foreground">{description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave(true)} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              Guardar borrador
            </Button>
            {app?.id && app.status === 'draft' && (
              <Button onClick={handleSubmitForReview} disabled={isLoading}>
                <Send className="h-4 w-4 mr-2" />
                Enviar a revisión
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AppEditor;
