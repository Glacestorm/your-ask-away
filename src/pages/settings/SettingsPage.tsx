/**
 * SettingsPage - Página de configuración del usuario
 * Permite gestionar preferencias, notificaciones y cuenta
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  CreditCard,
  Key,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';
import { GlobalNavHeader } from '@/components/GlobalNavHeader';

interface SettingSection {
  id: string;
  label: string;
  labelEs: string;
  icon: React.ElementType;
  description: string;
  descriptionEs: string;
}

const sections: SettingSection[] = [
  { 
    id: 'profile', 
    label: 'Profile', 
    labelEs: 'Perfil',
    icon: User, 
    description: 'Manage your personal information',
    descriptionEs: 'Gestiona tu información personal'
  },
  { 
    id: 'notifications', 
    label: 'Notifications', 
    labelEs: 'Notificaciones',
    icon: Bell, 
    description: 'Configure your notification preferences',
    descriptionEs: 'Configura tus preferencias de notificación'
  },
  { 
    id: 'appearance', 
    label: 'Appearance', 
    labelEs: 'Apariencia',
    icon: Palette, 
    description: 'Customize the look and feel',
    descriptionEs: 'Personaliza el aspecto visual'
  },
  { 
    id: 'language', 
    label: 'Language', 
    labelEs: 'Idioma',
    icon: Globe, 
    description: 'Set your preferred language',
    descriptionEs: 'Establece tu idioma preferido'
  },
  { 
    id: 'security', 
    label: 'Security', 
    labelEs: 'Seguridad',
    icon: Shield, 
    description: 'Manage security settings',
    descriptionEs: 'Gestiona la configuración de seguridad'
  },
  { 
    id: 'billing', 
    label: 'Billing', 
    labelEs: 'Facturación',
    icon: CreditCard, 
    description: 'Manage your subscription and billing',
    descriptionEs: 'Gestiona tu suscripción y facturación'
  },
];

const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('profile');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const handleSaveProfile = () => {
    toast.success(language === 'es' ? 'Perfil actualizado' : 'Profile updated');
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success(language === 'es' ? 'Sesión cerrada' : 'Signed out successfully');
  };

  const renderProfileSection = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">{language === 'es' ? 'Nombre completo' : 'Full Name'}</Label>
          <Input id="name" defaultValue={user?.user_metadata?.full_name || ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{language === 'es' ? 'Correo electrónico' : 'Email'}</Label>
          <Input id="email" type="email" defaultValue={user?.email || ''} disabled />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="company">{language === 'es' ? 'Empresa' : 'Company'}</Label>
        <Input id="company" defaultValue={user?.user_metadata?.company || ''} />
      </div>
      <Button onClick={handleSaveProfile}>
        {language === 'es' ? 'Guardar cambios' : 'Save Changes'}
      </Button>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{language === 'es' ? 'Notificaciones por email' : 'Email Notifications'}</Label>
          <p className="text-sm text-muted-foreground">
            {language === 'es' ? 'Recibe actualizaciones por correo' : 'Receive updates via email'}
          </p>
        </div>
        <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{language === 'es' ? 'Notificaciones push' : 'Push Notifications'}</Label>
          <p className="text-sm text-muted-foreground">
            {language === 'es' ? 'Recibe notificaciones en el navegador' : 'Receive browser notifications'}
          </p>
        </div>
        <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>{language === 'es' ? 'Emails de marketing' : 'Marketing Emails'}</Label>
          <p className="text-sm text-muted-foreground">
            {language === 'es' ? 'Recibe ofertas y novedades' : 'Receive offers and news'}
          </p>
        </div>
        <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
      </div>
    </div>
  );

  const renderAppearanceSection = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>{language === 'es' ? 'Tema' : 'Theme'}</Label>
        <div className="flex gap-3">
          <Button 
            variant={theme === 'light' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTheme('light')}
            className="flex items-center gap-2"
          >
            <Sun className="h-4 w-4" />
            {language === 'es' ? 'Claro' : 'Light'}
          </Button>
          <Button 
            variant={theme === 'dark' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTheme('dark')}
            className="flex items-center gap-2"
          >
            <Moon className="h-4 w-4" />
            {language === 'es' ? 'Oscuro' : 'Dark'}
          </Button>
          <Button 
            variant={theme === 'system' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTheme('system')}
            className="flex items-center gap-2"
          >
            <Monitor className="h-4 w-4" />
            {language === 'es' ? 'Sistema' : 'System'}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderLanguageSection = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>{language === 'es' ? 'Idioma de la interfaz' : 'Interface Language'}</Label>
        <Select value={language} onValueChange={(value: 'es' | 'en') => setLanguage(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="es">Español</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          <Key className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">{language === 'es' ? 'Cambiar contraseña' : 'Change Password'}</p>
            <p className="text-sm text-muted-foreground">
              {language === 'es' ? 'Actualiza tu contraseña de acceso' : 'Update your access password'}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">{language === 'es' ? 'Autenticación de dos factores' : 'Two-Factor Authentication'}</p>
            <p className="text-sm text-muted-foreground">
              {language === 'es' ? 'Añade una capa extra de seguridad' : 'Add an extra layer of security'}
            </p>
          </div>
        </div>
        <Badge variant="outline">{language === 'es' ? 'Desactivado' : 'Disabled'}</Badge>
      </div>
      <Separator />
      <Button variant="destructive" onClick={handleSignOut} className="flex items-center gap-2">
        <LogOut className="h-4 w-4" />
        {language === 'es' ? 'Cerrar sesión' : 'Sign Out'}
      </Button>
    </div>
  );

  const renderBillingSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{language === 'es' ? 'Plan actual' : 'Current Plan'}</CardTitle>
          <CardDescription>
            {language === 'es' ? 'Gestiona tu suscripción' : 'Manage your subscription'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">Pro</p>
              <p className="text-sm text-muted-foreground">€99/mes</p>
            </div>
            <Button variant="outline">
              {language === 'es' ? 'Cambiar plan' : 'Change Plan'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile': return renderProfileSection();
      case 'notifications': return renderNotificationsSection();
      case 'appearance': return renderAppearanceSection();
      case 'language': return renderLanguageSection();
      case 'security': return renderSecuritySection();
      case 'billing': return renderBillingSection();
      default: return renderProfileSection();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GlobalNavHeader />
      
      <div className="container mx-auto px-4 py-8 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8" />
            {language === 'es' ? 'Configuración' : 'Settings'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === 'es' ? 'Gestiona tu cuenta y preferencias' : 'Manage your account and preferences'}
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar Navigation */}
          <Card className="lg:col-span-1 h-fit">
            <CardContent className="p-2">
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      activeSection === section.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <section.icon className="h-5 w-5" />
                    <span className="font-medium">
                      {language === 'es' ? section.labelEs : section.label}
                    </span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>
                {language === 'es' 
                  ? sections.find(s => s.id === activeSection)?.labelEs 
                  : sections.find(s => s.id === activeSection)?.label}
              </CardTitle>
              <CardDescription>
                {language === 'es' 
                  ? sections.find(s => s.id === activeSection)?.descriptionEs 
                  : sections.find(s => s.id === activeSection)?.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderSectionContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
