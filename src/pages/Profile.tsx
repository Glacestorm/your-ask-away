import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

// Validation schemas
const profileSchema = z.object({
  full_name: z.string().trim().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  avatar_url: z.string().trim().url('URL inválida').optional().or(z.literal('')),
  gestor_number: z.string().trim().max(50, 'El número es muy largo').optional().or(z.literal('')),
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
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
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
      toast.error('Error al cargar el perfil');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate input
      const validatedData = profileSchema.parse({
        full_name: fullName,
        avatar_url: avatarUrl,
        gestor_number: gestorNumber,
        oficina: oficina,
        cargo: cargo,
      });

      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: validatedData.full_name,
          avatar_url: validatedData.avatar_url || null,
          gestor_number: validatedData.gestor_number || null,
          oficina: validatedData.oficina || null,
          cargo: validatedData.cargo || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Perfil actualizado correctamente');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error('Error updating profile:', error);
        toast.error('Error al actualizar el perfil');
      }
    } finally {
      setLoading(false);
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
        toast.error('La contraseña actual es incorrecta');
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

      toast.success('Contraseña actualizada correctamente');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error('Error changing password:', error);
        toast.error('Error al cambiar la contraseña');
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
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/map')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Mi Perfil</h1>
            <p className="text-muted-foreground">Gestiona tu información personal</p>
          </div>
        </div>

        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Actualiza tu nombre y foto de perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  El email no se puede modificar
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre completo"
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarUrl">URL del Avatar</Label>
                <Input
                  id="avatarUrl"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://ejemplo.com/avatar.jpg"
                />
                <p className="text-xs text-muted-foreground">
                  URL de tu foto de perfil (opcional)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gestorNumber">Número de Gestor</Label>
                <Input
                  id="gestorNumber"
                  type="text"
                  value={gestorNumber}
                  onChange={(e) => setGestorNumber(e.target.value)}
                  placeholder="Ej: G-001"
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oficina">Oficina Asignada</Label>
                <Input
                  id="oficina"
                  type="text"
                  value={oficina}
                  onChange={(e) => setOficina(e.target.value)}
                  placeholder="Ej: Oficina Central"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo Actual</Label>
                <Input
                  id="cargo"
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ej: Gestor Comercial"
                  maxLength={100}
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
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
              Cambiar Contraseña
            </CardTitle>
            <CardDescription>
              Actualiza tu contraseña de acceso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Tu contraseña actual"
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  minLength={6}
                  required
                />
              </div>

              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cambiar Contraseña
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
