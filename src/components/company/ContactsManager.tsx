import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { CompanyContact } from '@/types/database';
import { companyContactSchema, CompanyContactFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, User, Mail, Phone, Briefcase, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ContactsManagerProps {
  companyId: string;
}

export const ContactsManager = ({ companyId }: ContactsManagerProps) => {
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CompanyContact | null>(null);
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CompanyContactFormData>({
    resolver: zodResolver(companyContactSchema),
    defaultValues: {
      is_primary: false,
    },
  });

  const isPrimary = watch('is_primary');

  useEffect(() => {
    fetchContacts();
  }, [companyId]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_contacts')
        .select('*')
        .eq('company_id', companyId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      toast.error('Error al cargar contactos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CompanyContactFormData) => {
    try {
      if (editingContact) {
        const { error } = await supabase
          .from('company_contacts')
          .update({
            contact_name: data.contact_name,
            position: data.position || null,
            phone: data.phone || null,
            email: data.email || null,
            notes: data.notes || null,
            is_primary: data.is_primary,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingContact.id);

        if (error) throw error;
        toast.success('Contacto actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('company_contacts')
          .insert([{
            company_id: companyId,
            contact_name: data.contact_name,
            position: data.position || null,
            phone: data.phone || null,
            email: data.email || null,
            notes: data.notes || null,
            is_primary: data.is_primary,
          }]);

        if (error) throw error;
        toast.success('Contacto creado correctamente');
      }

      fetchContacts();
      handleCloseDialog();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleEdit = (contact: CompanyContact) => {
    setEditingContact(contact);
    setValue('contact_name', contact.contact_name);
    setValue('position', contact.position || '');
    setValue('phone', contact.phone || '');
    setValue('email', contact.email || '');
    setValue('notes', contact.notes || '');
    setValue('is_primary', contact.is_primary);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteContactId) return;

    try {
      const { error } = await supabase
        .from('company_contacts')
        .delete()
        .eq('id', deleteContactId);

      if (error) throw error;
      toast.success('Contacto eliminado correctamente');
      fetchContacts();
    } catch (error: any) {
      toast.error('Error al eliminar: ' + error.message);
    } finally {
      setDeleteContactId(null);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingContact(null);
    reset({
      contact_name: '',
      position: '',
      phone: '',
      email: '',
      notes: '',
      is_primary: false,
    });
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando contactos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          Contactos ({contacts.length})
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditingContact(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Contacto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="contact_name">Nombre *</Label>
                <Input
                  id="contact_name"
                  {...register('contact_name')}
                  placeholder="Juan Pérez"
                />
                {errors.contact_name && (
                  <p className="text-sm text-destructive mt-1">{errors.contact_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  {...register('position')}
                  placeholder="Director General"
                />
                {errors.position && (
                  <p className="text-sm text-destructive mt-1">{errors.position.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="+34 600 000 000"
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="contacto@empresa.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Información adicional..."
                  rows={3}
                />
                {errors.notes && (
                  <p className="text-sm text-destructive mt-1">{errors.notes.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_primary"
                  checked={isPrimary}
                  onCheckedChange={(checked) => setValue('is_primary', checked as boolean)}
                />
                <Label htmlFor="is_primary" className="cursor-pointer">
                  Contacto principal
                </Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No hay contactos registrados</p>
          <p className="text-sm">Añade el primer contacto de esta empresa</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{contact.contact_name}</h4>
                    {contact.is_primary && (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                  {contact.position && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Briefcase className="h-4 w-4" />
                      {contact.position}
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Phone className="h-4 w-4" />
                      {contact.phone}
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Mail className="h-4 w-4" />
                      {contact.email}
                    </div>
                  )}
                  {contact.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{contact.notes}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(contact)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteContactId(contact.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteContactId} onOpenChange={() => setDeleteContactId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El contacto será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
