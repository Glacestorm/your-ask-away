import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, Building2, Hash, Mail, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface TradePartner {
  id: string;
  partner_code: string;
  legal_name: string;
  tax_id?: string | null;
  email?: string | null;
  country?: string | null;
  partner_type?: string | null;
  is_active?: boolean | null;
}

interface TradePartnerSearchSelectProps {
  partners: TradePartner[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  partnerTypeFilter?: 'customer' | 'supplier' | 'both' | null;
}

type SearchMode = 'all' | 'name' | 'code' | 'taxId' | 'email';

export function TradePartnerSearchSelect({
  partners,
  value,
  onValueChange,
  placeholder = "Seleccionar cliente...",
  disabled = false,
  loading = false,
  required = false,
  partnerTypeFilter = null,
}: TradePartnerSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('all');

  // Filter partners by type if specified
  const filteredByType = useMemo(() => {
    if (!partnerTypeFilter || partnerTypeFilter === 'both') return partners;
    return partners.filter(p => p.partner_type === partnerTypeFilter);
  }, [partners, partnerTypeFilter]);

  // Filter partners based on search query and mode
  const filteredPartners = useMemo(() => {
    if (!searchQuery.trim()) return filteredByType;

    const query = searchQuery.toLowerCase().trim();

    return filteredByType.filter(partner => {
      switch (searchMode) {
        case 'name':
          return partner.legal_name.toLowerCase().includes(query);
        case 'code':
          return partner.partner_code.toLowerCase().includes(query);
        case 'taxId':
          return partner.tax_id?.toLowerCase().includes(query);
        case 'email':
          return partner.email?.toLowerCase().includes(query);
        case 'all':
        default:
          return (
            partner.legal_name.toLowerCase().includes(query) ||
            partner.partner_code.toLowerCase().includes(query) ||
            partner.tax_id?.toLowerCase().includes(query) ||
            partner.email?.toLowerCase().includes(query)
          );
      }
    });
  }, [filteredByType, searchQuery, searchMode]);

  const selectedPartner = partners.find(p => p.id === value);

  const getSearchModeIcon = (mode: SearchMode) => {
    switch (mode) {
      case 'name': return <Building2 className="h-3 w-3" />;
      case 'code': return <Hash className="h-3 w-3" />;
      case 'taxId': return <FileText className="h-3 w-3" />;
      case 'email': return <Mail className="h-3 w-3" />;
      default: return <Search className="h-3 w-3" />;
    }
  };

  const getSearchPlaceholder = () => {
    switch (searchMode) {
      case 'name': return 'Buscar por nombre...';
      case 'code': return 'Buscar por código...';
      case 'taxId': return 'Buscar por NIF/CIF...';
      case 'email': return 'Buscar por email...';
      default: return 'Buscar por cualquier campo...';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-required={required}
          disabled={disabled || loading}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground"
          )}
        >
          {loading ? (
            <span className="text-muted-foreground">Cargando clientes...</span>
          ) : selectedPartner ? (
            <div className="flex items-center gap-2 truncate">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{selectedPartner.legal_name}</span>
              <Badge variant="outline" className="text-xs shrink-0">
                {selectedPartner.partner_code}
              </Badge>
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="border-b p-2">
            <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as SearchMode)}>
              <TabsList className="grid w-full grid-cols-5 h-8">
                <TabsTrigger value="all" className="text-xs px-2 gap-1">
                  <Search className="h-3 w-3" />
                  Todo
                </TabsTrigger>
                <TabsTrigger value="name" className="text-xs px-2 gap-1">
                  <Building2 className="h-3 w-3" />
                  Nombre
                </TabsTrigger>
                <TabsTrigger value="code" className="text-xs px-2 gap-1">
                  <Hash className="h-3 w-3" />
                  Código
                </TabsTrigger>
                <TabsTrigger value="taxId" className="text-xs px-2 gap-1">
                  <FileText className="h-3 w-3" />
                  NIF
                </TabsTrigger>
                <TabsTrigger value="email" className="text-xs px-2 gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <CommandInput
            placeholder={getSearchPlaceholder()}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-6 text-center text-sm">
                <p className="text-muted-foreground">No se encontraron clientes</p>
                {searchQuery && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Prueba cambiando el modo de búsqueda
                  </p>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredPartners.map((partner) => (
                <CommandItem
                  key={partner.id}
                  value={partner.id}
                  onSelect={() => {
                    onValueChange(partner.id === value ? '' : partner.id);
                    setOpen(false);
                    setSearchQuery('');
                  }}
                  className="flex flex-col items-start py-2"
                >
                  <div className="flex w-full items-center gap-2">
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        value === partner.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{partner.legal_name}</span>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {partner.partner_code}
                        </Badge>
                        {partner.partner_type && (
                          <Badge 
                            variant={partner.partner_type === 'customer' ? 'default' : 'outline'} 
                            className="text-xs shrink-0"
                          >
                            {partner.partner_type === 'customer' ? 'Cliente' : 
                             partner.partner_type === 'supplier' ? 'Proveedor' : 'Ambos'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {partner.tax_id && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {partner.tax_id}
                          </span>
                        )}
                        {partner.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3" />
                            {partner.email}
                          </span>
                        )}
                        {partner.country && (
                          <span className="shrink-0">{partner.country}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default TradePartnerSearchSelect;
