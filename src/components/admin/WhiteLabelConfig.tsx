import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Palette, Building2, Globe, Image, Save, RotateCcw, Eye, Download, Upload } from "lucide-react";

interface WhiteLabelSettings {
  // Branding
  companyName: string;
  companyLogo: string;
  companyFavicon: string;
  companyTagline: string;
  
  // Colors
  primaryColor: string;
  primaryHover: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  
  // Typography
  fontFamily: string;
  headingFont: string;
  
  // Features
  hideObelixiaBranding: boolean;
  customDomain: string;
  customFooter: string;
  supportEmail: string;
  supportPhone: string;
  
  // Legal
  privacyPolicyUrl: string;
  termsUrl: string;
  cookiePolicyUrl: string;
}

const defaultSettings: WhiteLabelSettings = {
  companyName: "ObelixIA",
  companyLogo: "",
  companyFavicon: "",
  companyTagline: "CRM Bancario Inteligente",
  primaryColor: "224 76% 40%",
  primaryHover: "224 76% 35%",
  secondaryColor: "160 84% 39%",
  accentColor: "160 84% 95%",
  backgroundColor: "210 40% 98%",
  foregroundColor: "222 47% 11%",
  fontFamily: "Inter, system-ui, sans-serif",
  headingFont: "Inter, system-ui, sans-serif",
  hideObelixiaBranding: false,
  customDomain: "",
  customFooter: "",
  supportEmail: "support@obelixia.com",
  supportPhone: "",
  privacyPolicyUrl: "",
  termsUrl: "",
  cookiePolicyUrl: ""
};

export default function WhiteLabelConfig() {
  const [settings, setSettings] = useState<WhiteLabelSettings>(defaultSettings);
  const [previewMode, setPreviewMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load saved settings from localStorage
    const saved = localStorage.getItem("whitelabel_settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved settings");
      }
    }
  }, []);

  const handleChange = (field: keyof WhiteLabelSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const applyTheme = () => {
    const root = document.documentElement;
    root.style.setProperty("--primary", settings.primaryColor);
    root.style.setProperty("--primary-hover", settings.primaryHover);
    root.style.setProperty("--secondary", settings.secondaryColor);
    root.style.setProperty("--accent", settings.accentColor);
    root.style.setProperty("--background", settings.backgroundColor);
    root.style.setProperty("--foreground", settings.foregroundColor);
    
    if (settings.companyName) {
      document.title = settings.companyName;
    }
  };

  const saveSettings = () => {
    localStorage.setItem("whitelabel_settings", JSON.stringify(settings));
    applyTheme();
    setHasChanges(false);
    toast.success("Configuración white-label guardada correctamente");
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast.info("Configuración restaurada a valores por defecto");
  };

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whitelabel-config-${settings.companyName.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Configuración exportada");
  };

  const importSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setSettings({ ...defaultSettings, ...imported });
        setHasChanges(true);
        toast.success("Configuración importada correctamente");
      } catch (error) {
        toast.error("Error al importar configuración");
      }
    };
    reader.readAsText(file);
  };

  const togglePreview = () => {
    if (!previewMode) {
      applyTheme();
    } else {
      // Restore original theme
      const root = document.documentElement;
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-hover");
      root.style.removeProperty("--secondary");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--background");
      root.style.removeProperty("--foreground");
    }
    setPreviewMode(!previewMode);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuración White-Label</h2>
          <p className="text-muted-foreground">Personaliza la apariencia para revendedores y clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={hasChanges ? "destructive" : "secondary"}>
            {hasChanges ? "Cambios sin guardar" : "Guardado"}
          </Badge>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button onClick={saveSettings} disabled={!hasChanges}>
          <Save className="h-4 w-4 mr-2" />
          Guardar Configuración
        </Button>
        <Button variant="outline" onClick={togglePreview}>
          <Eye className="h-4 w-4 mr-2" />
          {previewMode ? "Desactivar Preview" : "Preview en Vivo"}
        </Button>
        <Button variant="outline" onClick={exportSettings}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
        <label>
          <Button variant="outline" asChild>
            <span>
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </span>
          </Button>
          <input type="file" accept=".json" onChange={importSettings} className="hidden" />
        </label>
        <Button variant="ghost" onClick={resetSettings}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Restaurar
        </Button>
      </div>

      <Tabs defaultValue="branding" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="branding">
            <Building2 className="h-4 w-4 mr-2" />
            Marca
          </TabsTrigger>
          <TabsTrigger value="colors">
            <Palette className="h-4 w-4 mr-2" />
            Colores
          </TabsTrigger>
          <TabsTrigger value="domain">
            <Globe className="h-4 w-4 mr-2" />
            Dominio
          </TabsTrigger>
          <TabsTrigger value="legal">
            <Image className="h-4 w-4 mr-2" />
            Legal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Identidad de Marca</CardTitle>
              <CardDescription>Configura el nombre, logo y elementos de identidad visual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre de la Empresa</Label>
                  <Input
                    value={settings.companyName}
                    onChange={(e) => handleChange("companyName", e.target.value)}
                    placeholder="Mi Banco CRM"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tagline / Eslogan</Label>
                  <Input
                    value={settings.companyTagline}
                    onChange={(e) => handleChange("companyTagline", e.target.value)}
                    placeholder="Tu CRM Bancario"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>URL Logo (PNG/SVG)</Label>
                  <Input
                    value={settings.companyLogo}
                    onChange={(e) => handleChange("companyLogo", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL Favicon</Label>
                  <Input
                    value={settings.companyFavicon}
                    onChange={(e) => handleChange("companyFavicon", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fuente Principal</Label>
                  <Input
                    value={settings.fontFamily}
                    onChange={(e) => handleChange("fontFamily", e.target.value)}
                    placeholder="Inter, system-ui, sans-serif"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fuente Títulos</Label>
                  <Input
                    value={settings.headingFont}
                    onChange={(e) => handleChange("headingFont", e.target.value)}
                    placeholder="Inter, system-ui, sans-serif"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Ocultar Branding ObelixIA</Label>
                  <p className="text-sm text-muted-foreground">Elimina referencias a ObelixIA en la interfaz</p>
                </div>
                <Switch
                  checked={settings.hideObelixiaBranding}
                  onCheckedChange={(checked) => handleChange("hideObelixiaBranding", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paleta de Colores</CardTitle>
              <CardDescription>Define los colores HSL para tu tema personalizado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color Primario (HSL)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      placeholder="224 76% 40%"
                    />
                    <div 
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: `hsl(${settings.primaryColor})` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Primario Hover (HSL)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={settings.primaryHover}
                      onChange={(e) => handleChange("primaryHover", e.target.value)}
                      placeholder="224 76% 35%"
                    />
                    <div 
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: `hsl(${settings.primaryHover})` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color Secundario (HSL)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={settings.secondaryColor}
                      onChange={(e) => handleChange("secondaryColor", e.target.value)}
                      placeholder="160 84% 39%"
                    />
                    <div 
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: `hsl(${settings.secondaryColor})` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Color Acento (HSL)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={settings.accentColor}
                      onChange={(e) => handleChange("accentColor", e.target.value)}
                      placeholder="160 84% 95%"
                    />
                    <div 
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: `hsl(${settings.accentColor})` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fondo (HSL)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={settings.backgroundColor}
                      onChange={(e) => handleChange("backgroundColor", e.target.value)}
                      placeholder="210 40% 98%"
                    />
                    <div 
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: `hsl(${settings.backgroundColor})` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Texto (HSL)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={settings.foregroundColor}
                      onChange={(e) => handleChange("foregroundColor", e.target.value)}
                      placeholder="222 47% 11%"
                    />
                    <div 
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: `hsl(${settings.foregroundColor})` }}
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-lg border space-y-3" style={{
                backgroundColor: `hsl(${settings.backgroundColor})`,
                color: `hsl(${settings.foregroundColor})`
              }}>
                <p className="font-semibold">Vista Previa de Colores</p>
                <div className="flex gap-2">
                  <button 
                    className="px-4 py-2 rounded text-white"
                    style={{ backgroundColor: `hsl(${settings.primaryColor})` }}
                  >
                    Botón Primario
                  </button>
                  <button 
                    className="px-4 py-2 rounded text-white"
                    style={{ backgroundColor: `hsl(${settings.secondaryColor})` }}
                  >
                    Botón Secundario
                  </button>
                  <span 
                    className="px-3 py-2 rounded"
                    style={{ backgroundColor: `hsl(${settings.accentColor})` }}
                  >
                    Acento
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domain" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Dominio</CardTitle>
              <CardDescription>Configura dominio personalizado y contacto de soporte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Dominio Personalizado</Label>
                <Input
                  value={settings.customDomain}
                  onChange={(e) => handleChange("customDomain", e.target.value)}
                  placeholder="crm.tubanco.com"
                />
                <p className="text-xs text-muted-foreground">
                  Requiere configuración DNS CNAME apuntando a tu instancia
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email de Soporte</Label>
                  <Input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => handleChange("supportEmail", e.target.value)}
                    placeholder="soporte@tubanco.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono de Soporte</Label>
                  <Input
                    value={settings.supportPhone}
                    onChange={(e) => handleChange("supportPhone", e.target.value)}
                    placeholder="+376 xxx xxx"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pie de Página Personalizado</Label>
                <Textarea
                  value={settings.customFooter}
                  onChange={(e) => handleChange("customFooter", e.target.value)}
                  placeholder="© 2024 Tu Banco. Todos los derechos reservados."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentos Legales</CardTitle>
              <CardDescription>URLs a políticas y términos legales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Política de Privacidad</Label>
                <Input
                  value={settings.privacyPolicyUrl}
                  onChange={(e) => handleChange("privacyPolicyUrl", e.target.value)}
                  placeholder="https://tubanco.com/privacidad"
                />
              </div>
              <div className="space-y-2">
                <Label>Términos y Condiciones</Label>
                <Input
                  value={settings.termsUrl}
                  onChange={(e) => handleChange("termsUrl", e.target.value)}
                  placeholder="https://tubanco.com/terminos"
                />
              </div>
              <div className="space-y-2">
                <Label>Política de Cookies</Label>
                <Input
                  value={settings.cookiePolicyUrl}
                  onChange={(e) => handleChange("cookiePolicyUrl", e.target.value)}
                  placeholder="https://tubanco.com/cookies"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
