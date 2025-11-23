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
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    full_name: '',
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

  const handleInviteUser = async () => {
    if (!isSuperAdmin) {
      toast.error('Solo los superadministradores pueden invitar usuarios');
      return;
    }

    if (!inviteForm.email || !inviteForm.full_name) {
      toast.error('Email y nombre son requeridos');
      return;
    }

    try {
      setLoading(true);

      // Create user via Supabase Admin API (requires service role)
      // For now, we'll create an invitation that the user needs to complete
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(inviteForm.email, {
        data: {
          full_name: inviteForm.full_name,
          initial_role: inviteForm.role,
        },
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        // If admin invite fails (requires service role), create a standard signup
        toast.error('No se pudo enviar la invitación. El usuario debe registrarse manualmente.');
        return;
      }

      toast.success('Invitación enviada correctamente');
      setInviteDialogOpen(false);
      setInviteForm({ email: '', full_name: '', role: 'user' });
      fetchProfiles();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast.error('Error al invitar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!isSuperAdmin || !selectedUserId) return;

    try {
      setLoading(true);

      // Delete user roles first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUserId);

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUserId);

      if (profileError) throw profileError;

      // Note: Deleting from auth.users requires service role
      // For now, we only delete the profile and roles
      toast.success('Usuario dado de baja correctamente');
      setDeleteDialogOpen(false);
      setSelectedUserId(null);
      fetchProfiles();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Error al dar de baja usuario');
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
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invitar Usuario
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
                <TableHead>Rol</TableHead>
                {isSuperAdmin && <TableHead>Cambiar Rol</TableHead>}
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
                  {isSuperAdmin && (
                    <TableCell>
                      <Select
                        value={profile.roles?.[0] || 'user'}
                        onValueChange={(value) => handleRoleChange(profile.id, value as AppRole)}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-[180px]">
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
                    </TableCell>
                  )}
                  <TableCell>
                    {new Date(profile.created_at).toLocaleDateString('es-ES')}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedUserId(profile.id);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>

    {/* Invite User Dialog */}
    <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Introduce los datos del nuevo usuario. Se le enviará un correo de invitación.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre Completo *</Label>
            <Input
              id="full_name"
              placeholder="Nombre del usuario"
              value={inviteForm.full_name}
              onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Rol Inicial</Label>
            <Select
              value={inviteForm.role}
              onValueChange={(value) => setInviteForm({ ...inviteForm, role: value as AppRole })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuario</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="superadmin">Superadministrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleInviteUser} disabled={loading}>
            Enviar Invitación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete User Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Dar de baja usuario?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará el perfil y los roles del usuario. 
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteUser}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Dar de Baja
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}
