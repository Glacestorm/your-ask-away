/**
 * Gestión de Roles y Permisos
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Shield, Plus, Pencil, Trash2, Loader2, Users } from 'lucide-react';
import { useERPRoles } from '@/hooks/erp/useERPRoles';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { ERPRole, ERPPermission, CreateRoleForm } from '@/types/erp';
import { toast } from 'sonner';

const initialForm: CreateRoleForm = {
  name: '',
  description: '',
  permission_ids: [],
};

export function ERPRolesManager() {
  const { currentCompany, hasPermission } = useERPContext();
  const { roles, permissions, isLoading, fetchRoles, fetchPermissions, createRole, updateRole, deleteRole } = useERPRoles();
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<ERPRole | null>(null);
  const [form, setForm] = useState<CreateRoleForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  const canWrite = hasPermission('admin.all');

  useEffect(() => {
    fetchPermissions();
    if (currentCompany?.id) {
      fetchRoles(currentCompany.id);
    }
  }, [currentCompany?.id, fetchRoles, fetchPermissions]);

  // Agrupar permisos por módulo
  const permissionsByModule = permissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, ERPPermission[]>);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setForm(initialForm);
    setShowDialog(true);
  };

  const handleOpenEdit = (role: ERPRole) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description || '',
      permission_ids: role.permissions?.map(p => p.id) || [],
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (!currentCompany?.id) return;

    setIsSaving(true);
    try {
      if (editingRole) {
        await updateRole(editingRole.id, form);
        toast.success('Rol actualizado');
      } else {
        await createRole(currentCompany.id, form);
        toast.success('Rol creado');
      }
      setShowDialog(false);
      fetchRoles(currentCompany.id);
    } catch (err) {
      toast.error('Error al guardar rol');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (role: ERPRole) => {
    if (role.is_system) {
      toast.error('No se pueden eliminar roles de sistema');
      return;
    }
    if (!confirm(`¿Eliminar el rol "${role.name}"?`)) return;
    
    try {
      await deleteRole(role.id);
      toast.success('Rol eliminado');
      if (currentCompany?.id) fetchRoles(currentCompany.id);
    } catch (err) {
      toast.error('Error al eliminar rol');
    }
  };

  const togglePermission = (permId: string) => {
    setForm(prev => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permId)
        ? prev.permission_ids.filter(id => id !== permId)
        : [...prev.permission_ids, permId],
    }));
  };

  const toggleModule = (module: string, perms: ERPPermission[]) => {
    const permIds = perms.map(p => p.id);
    const allSelected = permIds.every(id => form.permission_ids.includes(id));
    
    setForm(prev => ({
      ...prev,
      permission_ids: allSelected
        ? prev.permission_ids.filter(id => !permIds.includes(id))
        : [...new Set([...prev.permission_ids, ...permIds])],
    }));
  };

  const getModuleLabel = (module: string) => {
    const labels: Record<string, string> = {
      admin: 'Administración',
      masters: 'Maestros',
      sales: 'Ventas',
      purchases: 'Compras',
      inventory: 'Almacén',
      accounting: 'Contabilidad',
      treasury: 'Tesorería',
      tax: 'Fiscal',
    };
    return labels[module] || module;
  };

  if (!currentCompany) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Selecciona una empresa para gestionar roles
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Roles y Permisos
            </CardTitle>
            <CardDescription>
              Gestión de roles y control de acceso (RBAC)
            </CardDescription>
          </div>
          {canWrite && (
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Rol
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : roles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay roles configurados.
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Permisos</TableHead>
                  <TableHead>Tipo</TableHead>
                  {canWrite && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {role.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {role.permissions?.length || 0} permisos
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {role.is_system ? (
                        <Badge variant="outline">Sistema</Badge>
                      ) : (
                        <Badge>Personalizado</Badge>
                      )}
                    </TableCell>
                    {canWrite && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(role)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {!role.is_system && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(role)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Dialog Crear/Editar */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Administrador de Ventas"
                    disabled={editingRole?.is_system}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Acceso completo al módulo de ventas"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Permisos</Label>
                <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(permissionsByModule).map(([module, perms]) => {
                      const selectedCount = perms.filter(p => form.permission_ids.includes(p.id)).length;
                      const allSelected = selectedCount === perms.length;
                      
                      return (
                        <AccordionItem key={module} value={module}>
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={allSelected}
                                onCheckedChange={() => toggleModule(module, perms)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span>{getModuleLabel(module)}</span>
                              <Badge variant="secondary" className="ml-2">
                                {selectedCount}/{perms.length}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="grid gap-2 ml-6">
                              {perms.map((perm) => (
                                <div key={perm.id} className="flex items-center gap-3">
                                  <Checkbox
                                    checked={form.permission_ids.includes(perm.id)}
                                    onCheckedChange={() => togglePermission(perm.id)}
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{perm.key}</p>
                                    {perm.description && (
                                      <p className="text-xs text-muted-foreground">{perm.description}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingRole ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default ERPRolesManager;
