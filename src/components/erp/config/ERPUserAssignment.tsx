/**
 * Gestión de Usuarios y Asignación a Empresas
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Plus, Pencil, Trash2, Search, Loader2, Building2, Shield, UserPlus } from 'lucide-react';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserCompanyAssignment {
  id: string;
  user_id: string;
  company_id: string;
  role_id: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
  company?: {
    id: string;
    name: string;
  };
  role?: {
    id: string;
    name: string;
  };
}

interface Company {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  company_id: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

export function ERPUserAssignment() {
  const { currentCompany, hasPermission } = useERPContext();
  
  const [assignments, setAssignments] = useState<UserCompanyAssignment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<UserCompanyAssignment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({
    user_id: '',
    company_id: '',
    role_id: '',
    is_default: false,
  });

  const canWrite = hasPermission('admin.all');

  // Cargar datos
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Cargar asignaciones con relaciones
      const { data: assignData, error: assignError } = await supabase
        .from('erp_user_companies')
        .select(`
          *,
          company:erp_companies(id, name),
          role:erp_roles(id, name)
        `)
        .order('created_at', { ascending: false });

      if (assignError) throw assignError;

      // Obtener información de usuarios
      const userIds = [...new Set((assignData || []).map(a => a.user_id))];
      let profilesData: Profile[] = [];
      
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        profilesData = (profs || []) as Profile[];
      }

      // Mapear usuarios a asignaciones
      const enrichedAssignments = (assignData || []).map(a => ({
        ...a,
        user: profilesData.find(p => p.id === a.user_id),
      })) as UserCompanyAssignment[];

      setAssignments(enrichedAssignments);

      // Cargar empresas
      const { data: compData } = await supabase
        .from('erp_companies')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      setCompanies((compData || []) as Company[]);

      // Cargar roles
      const { data: roleData } = await supabase
        .from('erp_roles')
        .select('id, name, company_id')
        .order('name');
      setRoles((roleData || []) as Role[]);

      // Cargar perfiles
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');
      setProfiles((allProfiles || []) as Profile[]);

    } catch (err) {
      console.error('[ERPUserAssignment] Error fetching data:', err);
      toast.error('Error cargando datos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrar roles por empresa seleccionada
  const filteredRoles = form.company_id 
    ? roles.filter(r => r.company_id === form.company_id)
    : roles;

  // Filtrar asignaciones por búsqueda
  const filteredAssignments = assignments.filter(a => {
    const searchLower = search.toLowerCase();
    return (
      a.user?.full_name?.toLowerCase().includes(searchLower) ||
      a.user?.email?.toLowerCase().includes(searchLower) ||
      a.company?.name?.toLowerCase().includes(searchLower) ||
      a.role?.name?.toLowerCase().includes(searchLower)
    );
  });

  const handleOpenCreate = () => {
    setEditingAssignment(null);
    setForm({
      user_id: '',
      company_id: currentCompany?.id || '',
      role_id: '',
      is_default: false,
    });
    setShowDialog(true);
  };

  const handleOpenEdit = (assignment: UserCompanyAssignment) => {
    setEditingAssignment(assignment);
    setForm({
      user_id: assignment.user_id,
      company_id: assignment.company_id,
      role_id: assignment.role_id,
      is_default: assignment.is_default,
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.user_id || !form.company_id || !form.role_id) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    setIsSaving(true);
    try {
      if (editingAssignment) {
        const { error } = await supabase
          .from('erp_user_companies')
          .update({
            role_id: form.role_id,
            is_default: form.is_default,
          })
          .eq('id', editingAssignment.id);

        if (error) throw error;
        toast.success('Asignación actualizada');
      } else {
        // Verificar si ya existe
        const { data: existing } = await supabase
          .from('erp_user_companies')
          .select('id')
          .eq('user_id', form.user_id)
          .eq('company_id', form.company_id)
          .single();

        if (existing) {
          toast.error('Este usuario ya está asignado a esta empresa');
          setIsSaving(false);
          return;
        }

        const { error } = await supabase
          .from('erp_user_companies')
          .insert([{
            user_id: form.user_id,
            company_id: form.company_id,
            role_id: form.role_id,
            is_default: form.is_default,
            is_active: true,
          }]);

        if (error) throw error;
        toast.success('Usuario asignado correctamente');
      }

      setShowDialog(false);
      fetchData();
    } catch (err) {
      console.error('[ERPUserAssignment] Error saving:', err);
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (assignment: UserCompanyAssignment) => {
    try {
      const { error } = await supabase
        .from('erp_user_companies')
        .update({ is_active: !assignment.is_active })
        .eq('id', assignment.id);

      if (error) throw error;
      toast.success(assignment.is_active ? 'Usuario desactivado' : 'Usuario activado');
      fetchData();
    } catch (err) {
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async (assignment: UserCompanyAssignment) => {
    if (!confirm('¿Eliminar esta asignación?')) return;

    try {
      const { error } = await supabase
        .from('erp_user_companies')
        .delete()
        .eq('id', assignment.id);

      if (error) throw error;
      toast.success('Asignación eliminada');
      fetchData();
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuarios y Accesos
            </CardTitle>
            <CardDescription>
              Gestiona la asignación de usuarios a empresas y sus roles
            </CardDescription>
          </div>
          {canWrite && (
            <Button onClick={handleOpenCreate} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Asignar Usuario
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuario, empresa o rol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Por defecto</TableHead>
                  <TableHead>Estado</TableHead>
                  {canWrite && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canWrite ? 6 : 5} className="text-center py-8 text-muted-foreground">
                      No hay asignaciones de usuarios
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {assignment.user?.full_name || 'Sin nombre'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {assignment.user?.email || assignment.user_id.slice(0, 8)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {assignment.company?.name || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Shield className="h-3 w-3" />
                          {assignment.role?.name || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assignment.is_default && (
                          <Badge variant="secondary">Sí</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={assignment.is_active ? 'default' : 'secondary'}>
                          {assignment.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      {canWrite && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleToggleActive(assignment)}
                              title={assignment.is_active ? 'Desactivar' : 'Activar'}
                            >
                              <Switch checked={assignment.is_active} className="pointer-events-none" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleOpenEdit(assignment)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(assignment)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Dialog Crear/Editar */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAssignment ? 'Editar Asignación' : 'Asignar Usuario'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Usuario *</Label>
                <Select 
                  value={form.user_id} 
                  onValueChange={(v) => setForm({ ...form, user_id: v })}
                  disabled={!!editingAssignment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name || profile.email || profile.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Empresa *</Label>
                <Select 
                  value={form.company_id} 
                  onValueChange={(v) => setForm({ ...form, company_id: v, role_id: '' })}
                  disabled={!!editingAssignment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rol *</Label>
                <Select 
                  value={form.role_id} 
                  onValueChange={(v) => setForm({ ...form, role_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.company_id && filteredRoles.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No hay roles para esta empresa. Crea uno primero.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Empresa por defecto</Label>
                  <p className="text-xs text-muted-foreground">
                    Se seleccionará automáticamente al iniciar sesión
                  </p>
                </div>
                <Switch
                  checked={form.is_default}
                  onCheckedChange={(v) => setForm({ ...form, is_default: v })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingAssignment ? 'Guardar' : 'Asignar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default ERPUserAssignment;
