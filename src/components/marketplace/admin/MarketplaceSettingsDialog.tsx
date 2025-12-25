import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { 
  Settings, 
  DollarSign, 
  Shield, 
  Bell, 
  Users,
  Percent,
  Clock,
  Mail,
  Save
} from 'lucide-react';

interface MarketplaceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MarketplaceSettingsDialog({ open, onOpenChange }: MarketplaceSettingsDialogProps) {
  const [settings, setSettings] = useState({
    // Revenue settings
    platformFeePercent: 20,
    minimumPayout: 50,
    payoutFrequency: 'monthly',
    
    // Review settings
    autoApproveApps: false,
    requireManualReview: true,
    maxReviewDays: 7,
    
    // Partner settings
    autoApprovePartners: false,
    requireVerification: true,
    minAppsForGold: 5,
    minAppsForPlatinum: 10,
    
    // Notifications
    notifyOnNewApp: true,
    notifyOnNewPartner: true,
    notifyOnReview: true,
    adminEmails: '',
  });

  const handleSave = () => {
    // In a real app, this would save to the database
    toast.success('Configuración guardada correctamente');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración del Marketplace
          </DialogTitle>
          <DialogDescription>
            Ajusta las políticas y configuraciones del programa de partners
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="revenue" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="revenue" className="text-xs sm:text-sm">
              <DollarSign className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Ingresos</span>
            </TabsTrigger>
            <TabsTrigger value="review" className="text-xs sm:text-sm">
              <Shield className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Revisión</span>
            </TabsTrigger>
            <TabsTrigger value="partners" className="text-xs sm:text-sm">
              <Users className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Partners</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs sm:text-sm">
              <Bell className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Alertas</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="revenue" className="mt-0 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Comisiones</CardTitle>
                  <CardDescription>Configura las tasas de la plataforma</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Comisión de plataforma
                      </Label>
                      <span className="text-sm font-medium">{settings.platformFeePercent}%</span>
                    </div>
                    <Slider
                      value={[settings.platformFeePercent]}
                      onValueChange={([value]) => setSettings(s => ({ ...s, platformFeePercent: value }))}
                      max={50}
                      min={5}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Los partners reciben {100 - settings.platformFeePercent}% de cada venta
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Pago mínimo
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={settings.minimumPayout}
                        onChange={(e) => setSettings(s => ({ ...s, minimumPayout: parseInt(e.target.value) || 0 }))}
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">EUR</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Frecuencia de pago
                    </Label>
                    <Select
                      value={settings.payoutFrequency}
                      onValueChange={(value) => setSettings(s => ({ ...s, payoutFrequency: value }))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="biweekly">Quincenal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="review" className="mt-0 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Proceso de Revisión</CardTitle>
                  <CardDescription>Configura cómo se revisan las apps</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-aprobar apps</Label>
                      <p className="text-xs text-muted-foreground">Las apps se publican automáticamente</p>
                    </div>
                    <Switch
                      checked={settings.autoApproveApps}
                      onCheckedChange={(checked) => setSettings(s => ({ ...s, autoApproveApps: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Requiere revisión manual</Label>
                      <p className="text-xs text-muted-foreground">Un admin debe aprobar cada app</p>
                    </div>
                    <Switch
                      checked={settings.requireManualReview}
                      onCheckedChange={(checked) => setSettings(s => ({ ...s, requireManualReview: checked }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Días máximos para revisión</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={settings.maxReviewDays}
                        onChange={(e) => setSettings(s => ({ ...s, maxReviewDays: parseInt(e.target.value) || 7 }))}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">días</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="partners" className="mt-0 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Programa de Partners</CardTitle>
                  <CardDescription>Configura requisitos y aprobaciones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-aprobar partners</Label>
                      <p className="text-xs text-muted-foreground">Los partners se activan automáticamente</p>
                    </div>
                    <Switch
                      checked={settings.autoApprovePartners}
                      onCheckedChange={(checked) => setSettings(s => ({ ...s, autoApprovePartners: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Requiere verificación</Label>
                      <p className="text-xs text-muted-foreground">Verificar identidad de empresa</p>
                    </div>
                    <Switch
                      checked={settings.requireVerification}
                      onCheckedChange={(checked) => setSettings(s => ({ ...s, requireVerification: checked }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Apps para tier Gold</Label>
                      <Input
                        type="number"
                        value={settings.minAppsForGold}
                        onChange={(e) => setSettings(s => ({ ...s, minAppsForGold: parseInt(e.target.value) || 5 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Apps para tier Platinum</Label>
                      <Input
                        type="number"
                        value={settings.minAppsForPlatinum}
                        onChange={(e) => setSettings(s => ({ ...s, minAppsForPlatinum: parseInt(e.target.value) || 10 }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-0 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Notificaciones</CardTitle>
                  <CardDescription>Configura alertas del sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Nueva app enviada</Label>
                      <p className="text-xs text-muted-foreground">Notificar cuando se envía una app</p>
                    </div>
                    <Switch
                      checked={settings.notifyOnNewApp}
                      onCheckedChange={(checked) => setSettings(s => ({ ...s, notifyOnNewApp: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Nuevo partner</Label>
                      <p className="text-xs text-muted-foreground">Notificar solicitudes de partner</p>
                    </div>
                    <Switch
                      checked={settings.notifyOnNewPartner}
                      onCheckedChange={(checked) => setSettings(s => ({ ...s, notifyOnNewPartner: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Nueva reseña</Label>
                      <p className="text-xs text-muted-foreground">Notificar reseñas de usuarios</p>
                    </div>
                    <Switch
                      checked={settings.notifyOnReview}
                      onCheckedChange={(checked) => setSettings(s => ({ ...s, notifyOnReview: checked }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Emails de administradores
                    </Label>
                    <Input
                      placeholder="admin@example.com, otro@example.com"
                      value={settings.adminEmails}
                      onChange={(e) => setSettings(s => ({ ...s, adminEmails: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Separar múltiples emails con comas
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
