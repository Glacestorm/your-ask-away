import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Lock, Loader2, Upload, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { EmailReminderPreferences } from '@/components/dashboard/EmailReminderPreferences';
import { GlobalNavHeader } from '@/components/GlobalNavHeader';

// Validation schemas
const profileSchema = z.object({
  full_name: z.string().trim().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  gestor_number: z.string().trim().regex(/^\d{4}$/, 'El número de gestor debe tener exactamente 4 dígitos').optional().or(z.literal('')),
  oficina: z.string().trim().max(100, 'El nombre de la oficina es muy largo').optional().or(z.literal('')),
  cargo: z.string().trim().max(100, 'El nombre del cargo es muy largo').optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const Profile = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Profile form state
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [gestorNumber, setGestorNumber] = useState('');
  const [oficina, setOficina] = useState('');
  const [cargo, setCargo] = useState('');
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, gestor_number, oficina, cargo')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url || '');
        setGestorNumber(data.gestor_number || '');
        setOficina(data.oficina || '');
        setCargo(data.cargo || '');
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error(t('profile.errorLoading'));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate input
      const validatedData = profileSchema.parse({
        full_name: fullName,
        gestor_number: gestorNumber,
        oficina: oficina,
        cargo: cargo,
      });

      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: validatedData.full_name,
          gestor_number: validatedData.gestor_number || null,
          oficina: validatedData.oficina || null,
          cargo: validatedData.cargo || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success(t('profile.profileUpdated'));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error('Error updating profile:', error);
        toast.error(t('profile.errorUpdating'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.selectValidImage'));
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('profile.imageTooLarge'));
      return;
    }

    try {
      setUploadingAvatar(true);

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user?.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success(t('profile.avatarUpdated'));
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(t('profile.errorAvatar'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate input
      const validatedData = passwordSchema.parse({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setPasswordLoading(true);

      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: validatedData.currentPassword,
      });

      if (signInError) {
        toast.error(t('profile.wrongPassword'));
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: validatedData.newPassword,
      });

      if (updateError) throw updateError;

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      toast.success(t('profile.passwordUpdated'));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error('Error changing password:', error);
        toast.error(t('profile.errorPassword'));
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <GlobalNavHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />

        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('profile.personalInfo')}
            </CardTitle>
            <CardDescription>
              {t('profile.personalInfoDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl} alt={fullName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {fullName.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Upload className="h-4 w-4" />
                      {t('profile.changePhoto')}
                    </div>
                  </Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('profile.photoFormat')}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="email">{t('profile.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {t('profile.emailCannotChange')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userRole" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {t('profile.role')}
                </Label>
                <Input
                  id="userRole"
                  type="text"
                  value={userRole || 'usuario'}
                  disabled
                  className="bg-muted capitalize"
                />
                <p className="text-xs text-muted-foreground">
                  {t('profile.roleAssigned')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">{t('profile.fullNameRequired')}</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('profile.fullNamePlaceholder')}
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gestorNumber">{t('profile.managerNumber')}</Label>
                <Input
                  id="gestorNumber"
                  type="text"
                  value={gestorNumber}
                  onChange={(e) => {
                    // Only allow 4 digits
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setGestorNumber(value);
                  }}
                  placeholder="0000"
                  maxLength={4}
                  pattern="\d{4}"
                />
                <p className="text-xs text-muted-foreground">
                  {t('profile.managerNumberFormat')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="oficina">{t('profile.officeAssigned')}</Label>
                <Input
                  id="oficina"
                  type="text"
                  value={oficina}
                  onChange={(e) => setOficina(e.target.value)}
                  placeholder={t('profile.officePlaceholder')}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo">{t('profile.currentPosition')}</Label>
                <Input
                  id="cargo"
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder={t('profile.positionPlaceholder')}
                  maxLength={100}
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('profile.saveChanges')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator />

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {t('profile.changePassword')}
            </CardTitle>
            <CardDescription>
              {t('profile.changePasswordDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('profile.currentPassword')}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('profile.currentPasswordPlaceholder')}
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('profile.newPassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('profile.newPasswordPlaceholder')}
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('profile.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('profile.confirmPasswordPlaceholder')}
                  minLength={6}
                  required
                />
              </div>

              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('profile.updatePassword')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Email Reminder Preferences Card */}
        <EmailReminderPreferences />
      </div>
    </div>
  );
};

export default Profile;
