import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { X, UserPlus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Gestor {
  id: string;
  full_name: string | null;
  email: string;
}

interface ParticipantsSelectorProps {
  selectedParticipants: string[];
  onParticipantsChange: (participants: string[]) => void;
  currentUserId: string;
}

export function ParticipantsSelector({ 
  selectedParticipants, 
  onParticipantsChange,
  currentUserId 
}: ParticipantsSelectorProps) {
  const [gestores, setGestores] = useState<Gestor[]>([]);
  const [loading, setLoading] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  useEffect(() => {
    fetchGestores();
  }, []);

  const fetchGestores = async () => {
    try {
      setLoading(true);
      
      // Fetch all users except auditors and the current user
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .neq('role', 'auditor')
        .neq('user_id', currentUserId);

      if (rolesError) throw rolesError;

      if (rolesData && rolesData.length > 0) {
        const userIds = rolesData.map(r => r.user_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)
          .order('full_name');

        if (profilesError) throw profilesError;
        setGestores(profilesData || []);
      }
    } catch (error: any) {
      console.error('Error fetching gestores:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = (userId: string) => {
    if (selectedParticipants.length >= 3) {
      toast.error('Máximo 3 participantes adicionales permitidos');
      return;
    }
    if (!selectedParticipants.includes(userId)) {
      onParticipantsChange([...selectedParticipants, userId]);
    }
    setComboboxOpen(false);
  };

  const removeParticipant = (userId: string) => {
    onParticipantsChange(selectedParticipants.filter(id => id !== userId));
  };

  const getGestorName = (id: string) => {
    const gestor = gestores.find(g => g.id === id);
    return gestor?.full_name || gestor?.email || 'Usuario';
  };

  return (
    <div className="space-y-2">
      <Label>Participantes Adicionales (Opcional)</Label>
      <p className="text-sm text-muted-foreground">
        Añade hasta 3 gestores adicionales para visitas conjuntas
      </p>
      
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedParticipants.map(participantId => (
          <Badge key={participantId} variant="secondary" className="pl-2 pr-1 py-1">
            {getGestorName(participantId)}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto p-0 ml-1 hover:bg-transparent"
              onClick={() => removeParticipant(participantId)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>

      {selectedParticipants.length < 3 && (
        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start"
              disabled={loading}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {loading ? 'Cargando...' : 'Añadir participante'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar usuario..." />
              <CommandList>
                <CommandEmpty>No se encontraron usuarios.</CommandEmpty>
                <CommandGroup>
                  {gestores
                    .filter(g => !selectedParticipants.includes(g.id))
                    .map((gestor) => (
                      <CommandItem
                        key={gestor.id}
                        value={gestor.full_name || gestor.email}
                        onSelect={() => addParticipant(gestor.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedParticipants.includes(gestor.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {gestor.full_name || 'Sin nombre'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {gestor.email}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}