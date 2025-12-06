import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Building2 } from 'lucide-react';

interface GestorOption {
  id: string;
  name: string;
  email: string;
  oficina: string | null;
}

interface GestorFilterSelectorProps {
  selectedGestorId: string | null;
  onGestorChange: (gestorId: string | null) => void;
  showAllOption?: boolean;
  selectedOffice?: string | null;
  onOfficeChange?: (office: string | null) => void;
}

export function GestorFilterSelector({ 
  selectedGestorId, 
  onGestorChange,
  showAllOption = true,
  selectedOffice,
  onOfficeChange
}: GestorFilterSelectorProps) {
  const { user, isOfficeDirector, isCommercialDirector, isCommercialManager, isSuperAdmin } = useAuth();
  const [allGestores, setAllGestores] = useState<GestorOption[]>([]);
  const [filteredGestores, setFilteredGestores] = useState<GestorOption[]>([]);
  const [offices, setOffices] = useState<string[]>([]);
  const [internalSelectedOffice, setInternalSelectedOffice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Use external or internal state for office selection
  const currentOffice = selectedOffice !== undefined ? selectedOffice : internalSelectedOffice;
  const setCurrentOffice = onOfficeChange || setInternalSelectedOffice;

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    // Filter gestores based on selected office
    if (currentOffice) {
      setFilteredGestores(allGestores.filter(g => g.oficina === currentOffice));
    } else {
      setFilteredGestores(allGestores);
    }
    // Reset gestor selection when office changes
    if (currentOffice && selectedGestorId) {
      const gestorInOffice = allGestores.find(g => g.id === selectedGestorId && g.oficina === currentOffice);
      if (!gestorInOffice) {
        onGestorChange(null);
      }
    }
  }, [currentOffice, allGestores]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch all gestores
      const { data: gestoresData } = await supabase
        .from('profiles')
        .select('id, full_name, email, oficina')
        .order('full_name');

      if (gestoresData) {
        const formatted = gestoresData.map(g => ({
          id: g.id,
          name: g.full_name || g.email || 'Sin nombre',
          email: g.email || '',
          oficina: g.oficina
        }));
        
        // Extract unique offices
        const uniqueOffices = [...new Set(gestoresData
          .map(g => g.oficina)
          .filter((o): o is string => o !== null && o !== '')
        )].sort();
        
        setOffices(uniqueOffices);
        setAllGestores(formatted);
        
        // For office directors without higher roles, default to their office
        if (isOfficeDirector && !isSuperAdmin && !isCommercialDirector && !isCommercialManager) {
          const { data: myProfile } = await supabase
            .from('profiles')
            .select('oficina')
            .eq('id', user.id)
            .single();
          
          if (myProfile?.oficina) {
            setCurrentOffice(myProfile.oficina);
            setFilteredGestores(formatted.filter(g => g.oficina === myProfile.oficina));
          } else {
            setFilteredGestores(formatted);
          }
        } else {
          setFilteredGestores(formatted);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Regular gestores don't see the selector
  const isRegularGestor = !isOfficeDirector && !isCommercialDirector && !isCommercialManager && !isSuperAdmin;
  
  if (isRegularGestor) {
    return null;
  }

  // Show office filter for office directors and higher roles
  const showOfficeFilter = isOfficeDirector || isCommercialDirector || isCommercialManager || isSuperAdmin;

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {showOfficeFilter && offices.length > 0 && (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select
            value={currentOffice || 'all'}
            onValueChange={(value) => setCurrentOffice(value === 'all' ? null : value)}
            disabled={loading}
          >
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Seleccionar oficina..." />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="all">Totes les oficines</SelectItem>
              {offices.map((office) => (
                <SelectItem key={office} value={office}>
                  {office}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
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
            {filteredGestores.map((gestor) => (
              <SelectItem key={gestor.id} value={gestor.id}>
                {gestor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
