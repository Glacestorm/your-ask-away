import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';

interface GestorOption {
  id: string;
  name: string;
  email: string;
}

interface GestorFilterSelectorProps {
  selectedGestorId: string | null;
  onGestorChange: (gestorId: string | null) => void;
  showAllOption?: boolean;
}

export function GestorFilterSelector({ 
  selectedGestorId, 
  onGestorChange,
  showAllOption = true 
}: GestorFilterSelectorProps) {
  const { user, isOfficeDirector, isCommercialDirector, isCommercialManager, isSuperAdmin } = useAuth();
  const [gestores, setGestores] = useState<GestorOption[]>([]);
  const [userOffice, setUserOffice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserOfficeAndGestores();
  }, [user]);

  const fetchUserOfficeAndGestores = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get current user's office if they are an office director
      if (isOfficeDirector) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('oficina')
          .eq('id', user.id)
          .single();
        
        if (profileData?.oficina) {
          setUserOffice(profileData.oficina);
        }
      }

      // Fetch gestores based on role
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, oficina')
        .order('full_name');

      // Office directors only see their office's gestores
      if (isOfficeDirector && !isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('oficina')
          .eq('id', user.id)
          .single();
        
        if (myProfile?.oficina) {
          query = query.eq('oficina', myProfile.oficina);
        }
      }

      const { data: gestoresData } = await query;

      if (gestoresData) {
        const formatted = gestoresData.map(g => ({
          id: g.id,
          name: g.full_name || g.email || 'Sin nombre',
          email: g.email || ''
        }));
        setGestores(formatted);
      }
    } catch (error) {
      console.error('Error fetching gestores:', error);
    } finally {
      setLoading(false);
    }
  };

  // Regular gestores don't see the selector
  const isRegularGestor = !isOfficeDirector && !isCommercialDirector && !isCommercialManager && !isSuperAdmin;
  
  if (isRegularGestor) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedGestorId || 'all'}
        onValueChange={(value) => onGestorChange(value === 'all' ? null : value)}
        disabled={loading}
      >
        <SelectTrigger className="w-[220px] bg-background">
          <SelectValue placeholder="Seleccionar gestor..." />
        </SelectTrigger>
        <SelectContent className="bg-background border shadow-lg z-50">
          {showAllOption && (
            <SelectItem value="all">Tots els gestors</SelectItem>
          )}
          {gestores.map((gestor) => (
            <SelectItem key={gestor.id} value={gestor.id}>
              {gestor.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
