import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UserPlus, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Profile, UserRole, AppRole } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProfileWithRole extends Profile {
  roles?: AppRole[];
}

export function UsersManager() {
  const { isSuperAdmin } = useAuth();
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState<ProfileWithRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<ProfileWithRole | null>(null);
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    cargo: '',
    oficina: '',
    gestor_number: '',
    role: 'user' as AppRole,
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for each profile
      const profilesWithRoles = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id);

          return {
            ...profile,
            roles: rolesData?.map((r: any) => r.role as AppRole) || [],
          };
        })
      );

      setProfiles(profilesWithRoles);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast.error('Error al cargar usuarios');
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    if (!isSuperAdmin) {
      toast.error('Solo los superadministradores pueden cambiar roles');
      return;
    }

    try {
      setLoading(true);

      // Delete existing roles for this user
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      toast.success('Rol actualizado correctamente');
      fetchProfiles();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error('Error al actualizar el rol');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUserForm({
      email: '',
      password: '',
      full_name: '',
      cargo: '',
      oficina: '',
      gestor_number: '',
      role: 'user',
    });
    setEditingUser(null);
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    setUserDialogOpen(true);
  };

  const handleOpenEditDialog = (profile: ProfileWithRole) => {
    setEditingUser(profile);
    setUserForm({
      email: profile.email,
      password: '',
      full_name: profile.full_name || '',
      cargo: profile.cargo || '',
      oficina: profile.oficina || '',
      gestor_number: profile.gestor_number || '',
      role: profile.roles?.[0] || 'user',
    });
    setUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!isSuperAdmin) {
      toast.error('Solo los superadministradores pueden gestionar usuarios');
      return;
    }

    if (!userForm.email || !userForm.full_name) {
      toast.error('Email y nombre son requeridos');
      return;
    }

    if (!editingUser && !userForm.password) {
      toast.error('La contraseña es requerida para nuevos usuarios');
      return;
    }

    try {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error('Sesión no válida');
        return;
      }

      const action = editingUser ? 'update' : 'create';
      const userData = editingUser
        ? {
            id: editingUser.id,
            email: userForm.email !== editingUser.email ? userForm.email : undefined,
            password: userForm.password || undefined,
            full_name: userForm.full_name,
            cargo: userForm.cargo,
            oficina: userForm.oficina,
            gestor_number: userForm.gestor_number,
            role: userForm.role,
          }
        : {
            email: userForm.email,
            password: userForm.password,
            full_name: userForm.full_name,
            cargo: userForm.cargo,
            oficina: userForm.oficina,
            gestor_number: userForm.gestor_number,
            role: userForm.role,
          };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action, userData }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar usuario');
      }

      toast.success(editingUser ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
      setUserDialogOpen(false);
      resetForm();
      fetchProfiles();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast.error(error.message || 'Error al guardar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!isSuperAdmin || !selectedUserId) return;

    try {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error('Sesión no válida');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'delete',
            userData: { id: selectedUserId },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar usuario');
      }

      toast.success('Usuario eliminado correctamente');
      setDeleteDialogOpen(false);
      setSelectedUserId(null);
      fetchProfiles();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Error al eliminar usuario');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: AppRole) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-500 text-white';
      case 'admin':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case 'superadmin':
        return 'Superadministrador';
      case 'admin':
        return 'Administrador';
      default:
        return 'Usuario';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>
                {isSuperAdmin
                  ? 'Gestionar usuarios, roles y permisos del sistema'
                  : 'Visualización de usuarios (requiere permisos de superadministrador para editar)'}
              </CardDescription>
            </div>
            {isSuperAdmin && (
              <Button onClick={handleOpenCreateDialog}>
                <UserPlus className="mr-2 h-4 w-4" />
                Crear Usuario
              </Button>
            )}
          </div>
        </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Oficina</TableHead>
                <TableHead>Nº Gestor</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Fecha Registro</TableHead>
                {isSuperAdmin && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.email}</TableCell>
                  <TableCell>{profile.full_name || 'N/A'}</TableCell>
                  <TableCell>{profile.cargo || '-'}</TableCell>
                  <TableCell>{profile.oficina || '-'}</TableCell>
                  <TableCell>{profile.gestor_number || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {profile.roles && profile.roles.length > 0 ? (
                        profile.roles.map((role) => (
                          <Badge key={role} className={getRoleBadgeColor(role)}>
                            {getRoleLabel(role)}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline">Sin rol</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(profile.created_at).toLocaleDateString('es-ES')}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditDialog(profile)}
                          disabled={loading}
                          title="Editar usuario"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUserId(profile.id);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={loading}
                          title="Eliminar usuario"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>

    {/* Create/Edit User Dialog */}
    <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</DialogTitle>
          <DialogDescription>
            {editingUser 
              ? 'Modifica los datos del usuario. Deja la contraseña vacía si no quieres cambiarla.'
              : 'Introduce los datos del nuevo usuario del sistema.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Contraseña {!editingUser && '*'}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={editingUser ? 'Dejar vacío para no cambiar' : 'Contraseña segura'}
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre Completo *</Label>
            <Input
              id="full_name"
              placeholder="Nombre completo del usuario"
              value={userForm.full_name}
              onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                placeholder="Ej: Director, Gestor..."
                value={userForm.cargo}
                onChange={(e) => setUserForm({ ...userForm, cargo: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oficina">Oficina</Label>
              <Input
                id="oficina"
                placeholder="Ej: Oficina Central"
                value={userForm.oficina}
                onChange={(e) => setUserForm({ ...userForm, oficina: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gestor_number">Número de Gestor</Label>
              <Input
                id="gestor_number"
                placeholder="Ej: G001"
                value={userForm.gestor_number}
                onChange={(e) => setUserForm({ ...userForm, gestor_number: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select
                value={userForm.role}
                onValueChange={(value) => setUserForm({ ...userForm, role: value as AppRole })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Usuario
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      Administrador
                    </div>
                  </SelectItem>
                  <SelectItem value="superadmin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-500" />
                      Superadministrador
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setUserDialogOpen(false);
              resetForm();
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSaveUser} disabled={loading}>
            {loading ? 'Guardando...' : (editingUser ? 'Actualizar' : 'Crear Usuario')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete User Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar usuario permanentemente?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará completamente el usuario del sistema, incluyendo su cuenta de autenticación, perfil y roles. 
            <strong className="block mt-2 text-destructive">Esta acción no se puede deshacer.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteUser}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Eliminando...' : 'Eliminar Usuario'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}
