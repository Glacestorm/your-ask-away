/**
 * SettingsPage - Página de configuración del usuario
 * Permite gestionar preferencias, notificaciones y cuenta
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { supabase } from '@/integrations/supabase/client';

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
  const [isSaving, setIsSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: user?.user_metadata?.full_name || '',
    company: user?.user_metadata?.company || '',
    phone: user?.user_metadata?.phone || '',
  });

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileForm.full_name,
          company: profileForm.company,
          phone: profileForm.phone,
        }
      });

      if (error) throw error;
      
      // También actualizar el perfil en la tabla profiles si existe
      await (supabase
        .from('profiles' as any)
        .update({
          full_name: profileForm.full_name,
          company: profileForm.company,
          phone: profileForm.phone,
        })
        .eq('id', user.id) as any);

      toast.success(language === 'es' ? 'Perfil actualizado correctamente' : 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(language === 'es' ? 'Error al guardar el perfil' : 'Error saving profile');
    } finally {
      setIsSaving(false);
    }
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
          <Input 
            id="name" 
            value={profileForm.full_name}
            onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{language === 'es' ? 'Correo electrónico' : 'Email'}</Label>
          <Input id="email" type="email" defaultValue={user?.email || ''} disabled />
          <p className="text-xs text-muted-foreground">
            {language === 'es' ? 'El email no se puede modificar' : 'Email cannot be changed'}
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company">{language === 'es' ? 'Empresa' : 'Company'}</Label>
          <Input 
            id="company" 
            value={profileForm.company}
            onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{language === 'es' ? 'Teléfono' : 'Phone'}</Label>
          <Input 
            id="phone" 
            value={profileForm.phone}
            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            placeholder="+34 600 000 000"
          />
        </div>
      </div>
      <Button onClick={handleSaveProfile} disabled={isSaving}>
        {isSaving 
          ? (language === 'es' ? 'Guardando...' : 'Saving...') 
          : (language === 'es' ? 'Guardar cambios' : 'Save Changes')}
      </Button>
    </div>
  );

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      if (user) {
        await supabase.auth.updateUser({
          data: {
            email_notifications: emailNotifications,
            push_notifications: pushNotifications,
            marketing_emails: marketingEmails,
          }
        });
      }
      toast.success(language === 'es' ? 'Preferencias de notificación guardadas' : 'Notification preferences saved');
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast.error(language === 'es' ? 'Error al guardar las preferencias' : 'Error saving preferences');
    } finally {
      setIsSaving(false);
    }
  };

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
      <Separator />
      <Button onClick={handleSaveNotifications} disabled={isSaving}>
        {isSaving 
          ? (language === 'es' ? 'Guardando...' : 'Saving...') 
          : (language === 'es' ? 'Guardar preferencias' : 'Save Preferences')}
      </Button>
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

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(language === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error(language === 'es' ? 'La contraseña debe tener al menos 6 caracteres' : 'Password must be at least 6 characters');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      toast.success(language === 'es' ? 'Contraseña actualizada correctamente' : 'Password updated successfully');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(language === 'es' ? 'Error al cambiar la contraseña' : 'Error changing password');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{language === 'es' ? 'Cambiar contraseña' : 'Change Password'}</p>
              <p className="text-sm text-muted-foreground">
                {language === 'es' ? 'Actualiza tu contraseña de acceso' : 'Update your access password'}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
            {showPasswordForm 
              ? (language === 'es' ? 'Cancelar' : 'Cancel')
              : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {showPasswordForm && (
          <div className="pt-4 border-t space-y-4">
            <div className="space-y-2">
              <Label>{language === 'es' ? 'Nueva contraseña' : 'New Password'}</Label>
              <Input 
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'es' ? 'Confirmar contraseña' : 'Confirm Password'}</Label>
              <Input 
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <Button onClick={handleChangePassword} disabled={isSaving}>
              {isSaving 
                ? (language === 'es' ? 'Guardando...' : 'Saving...')
                : (language === 'es' ? 'Actualizar contraseña' : 'Update Password')}
            </Button>
          </div>
        )}
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
        <Badge variant="outline">{language === 'es' ? 'Próximamente' : 'Coming Soon'}</Badge>
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
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">Pro</p>
              <p className="text-sm text-muted-foreground">€99/mes</p>
            </div>
            <Link to="/store/modules">
              <Button variant="outline">
                {language === 'es' ? 'Ver módulos' : 'View Modules'}
              </Button>
            </Link>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">{language === 'es' ? 'Próxima facturación' : 'Next Billing'}</p>
            <p className="text-sm text-muted-foreground">15 de Febrero, 2025 - €99.00</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">{language === 'es' ? 'Método de pago' : 'Payment Method'}</p>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">•••• •••• •••• 4242</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{language === 'es' ? 'Historial de facturas' : 'Invoice History'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">Enero 2025</p>
                <p className="text-xs text-muted-foreground">Plan Pro - €99.00</p>
              </div>
              <Button variant="ghost" size="sm">
                {language === 'es' ? 'Descargar' : 'Download'}
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">Diciembre 2024</p>
                <p className="text-xs text-muted-foreground">Plan Pro - €99.00</p>
              </div>
              <Button variant="ghost" size="sm">
                {language === 'es' ? 'Descargar' : 'Download'}
              </Button>
            </div>
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
