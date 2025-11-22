import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Profile, UserRole, AppRole } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';

interface ProfileWithRole extends Profile {
  roles?: AppRole[];
}

export function UsersManager() {
  const { isSuperAdmin } = useAuth();
  const [profiles, setProfiles] = useState<ProfileWithRole[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Usuarios</CardTitle>
        <CardDescription>
          {isSuperAdmin
            ? 'Gestionar roles y permisos de usuarios'
            : 'Visualización de usuarios (requiere permisos de superadministrador para editar)'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol Actual</TableHead>
                {isSuperAdmin && <TableHead>Cambiar Rol</TableHead>}
                <TableHead>Fecha Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.email}</TableCell>
                  <TableCell>{profile.full_name || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {profile.roles && profile.roles.length > 0 ? (
                        profile.roles.map((role) => (
                          <Badge key={role} className={getRoleBadgeColor(role)}>
                            {role}
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
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuario</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="superadmin">Superadmin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}
                  <TableCell>
                    {new Date(profile.created_at).toLocaleDateString('es-ES')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
