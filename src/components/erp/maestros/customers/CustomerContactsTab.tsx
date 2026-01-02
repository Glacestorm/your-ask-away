/**
 * Tab de Contactos del Cliente
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Plus, Phone, Mail, Trash2 } from 'lucide-react';
import { CustomerContact } from '@/hooks/erp/useMaestros';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomerContactsTabProps {
  customerId: string;
  contacts: CustomerContact[];
  onRefresh: () => void;
}

const emptyContact = {
  name: '',
  email: '',
  phone: '',
  role: '',
  is_primary: false
};

export const CustomerContactsTab: React.FC<CustomerContactsTabProps> = ({
  customerId,
  contacts,
  onRefresh
}) => {
  const [newContact, setNewContact] = useState(emptyContact);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddContact = async () => {
    if (!newContact.name) return;
    setIsAdding(true);

    try {
      const { error } = await supabase
        .from('customer_contacts')
        .insert([{ customer_id: customerId, ...newContact }] as any);
      
      if (error) throw error;
      
      toast.success('Contacto añadido');
      onRefresh();
      setNewContact(emptyContact);
    } catch {
      toast.error('Error al añadir contacto');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    const { error } = await supabase
      .from('customer_contacts')
      .delete()
      .eq('id', contactId);
    
    if (!error) {
      toast.success('Contacto eliminado');
      onRefresh();
    } else {
      toast.error('Error al eliminar contacto');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {contacts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 text-muted-foreground"
            >
              <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay contactos registrados</p>
            </motion.div>
          ) : (
            contacts.map((contact, index) => (
              <motion.div 
                key={contact.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 border rounded-lg flex items-start justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{contact.name}</span>
                    {contact.is_primary && (
                      <Badge variant="outline" className="text-xs">Principal</Badge>
                    )}
                  </div>
                  {contact.role && <p className="text-sm text-muted-foreground">{contact.role}</p>}
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    {contact.email && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="h-3 w-3" /> {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" /> {contact.phone}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteContact(contact.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="font-medium">Añadir Contacto</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              placeholder="Juan García"
            />
          </div>
          <div className="space-y-2">
            <Label>Cargo</Label>
            <Input
              value={newContact.role}
              onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
              placeholder="Director Comercial"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={newContact.email}
              onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              placeholder="contacto@empresa.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              placeholder="+34 600 123 456"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={newContact.is_primary}
              onCheckedChange={(checked) => setNewContact({ ...newContact, is_primary: checked })}
            />
            <Label>Contacto principal</Label>
          </div>
          <Button onClick={handleAddContact} disabled={!newContact.name || isAdding}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerContactsTab;
