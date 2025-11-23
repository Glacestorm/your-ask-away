import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Building2, Navigation, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { CompanyWithDetails } from '@/types/database';
import { Badge } from '@/components/ui/badge';

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  class: string;
  importance: number;
}

interface SearchResult {
  id: string;
  type: 'company' | 'place';
  name: string;
  address: string;
  lat: number;
  lon: number;
  company?: CompanyWithDetails;
  placeType?: string;
}

interface GeoSearchProps {
  companies: CompanyWithDetails[];
  onSelectResult: (result: SearchResult) => void;
  onClose: () => void;
}

export function GeoSearch({ companies, onSelectResult, onClose }: GeoSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, companies]);

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true);
    const searchLower = searchQuery.toLowerCase();
    const allResults: SearchResult[] = [];

    // Search in companies database
    const companyResults = companies
      .filter(company => 
        company.name.toLowerCase().includes(searchLower) ||
        company.address.toLowerCase().includes(searchLower) ||
        company.parroquia.toLowerCase().includes(searchLower) ||
        company.cnae?.toLowerCase().includes(searchLower)
      )
      .slice(0, 5)
      .map(company => ({
        id: `company-${company.id}`,
        type: 'company' as const,
        name: company.name,
        address: company.address,
        lat: company.latitude,
        lon: company.longitude,
        company,
      }));

    allResults.push(...companyResults);

    // Search using Nominatim (OpenStreetMap geocoding)
    try {
      const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
      nominatimUrl.searchParams.set('format', 'json');
      nominatimUrl.searchParams.set('q', `${searchQuery}, Andorra`);
      nominatimUrl.searchParams.set('limit', '5');
      nominatimUrl.searchParams.set('addressdetails', '1');
      nominatimUrl.searchParams.set('countrycodes', 'ad');

      const response = await fetch(nominatimUrl.toString(), {
        headers: {
          'User-Agent': 'LovableMapApp/1.0',
        },
      });

      if (response.ok) {
        const data: NominatimResult[] = await response.json();
        
        const placeResults = data.map(place => ({
          id: `place-${place.place_id}`,
          type: 'place' as const,
          name: place.display_name.split(',')[0],
          address: place.display_name,
          lat: parseFloat(place.lat),
          lon: parseFloat(place.lon),
          placeType: place.type,
        }));

        allResults.push(...placeResults);
      }
    } catch (error) {
      console.error('Error searching places:', error);
    }

    // Sort by relevance (companies first, then by importance)
    allResults.sort((a, b) => {
      if (a.type === 'company' && b.type !== 'company') return -1;
      if (a.type !== 'company' && b.type === 'company') return 1;
      return 0;
    });

    setResults(allResults.slice(0, 10));
    setIsSearching(false);
    setSelectedIndex(-1);
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelectResult(result);
    setQuery('');
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectResult(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (query) {
        setQuery('');
        setResults([]);
      } else {
        onClose();
      }
    }
  };

  return (
    <Card className="absolute top-20 left-4 z-20 w-96 shadow-2xl">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Buscar dirección, empresa, calle..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9 pr-9"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  inputRef.current?.focus();
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {isSearching && (
          <div className="mt-2 text-xs text-muted-foreground">
            Buscando...
          </div>
        )}
      </div>

      {results.length > 0 && (
        <ScrollArea className="max-h-96">
          <div className="p-2">
            {results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => handleSelectResult(result)}
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors ${
                  index === selectedIndex ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 shrink-0">
                    {result.type === 'company' ? (
                      <Building2 className="h-4 w-4 text-primary" />
                    ) : (
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">
                        {result.name}
                      </p>
                      {result.type === 'company' && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          Empresa
                        </Badge>
                      )}
                      {result.placeType && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {result.placeType}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {result.address}
                    </p>
                    {result.company && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {result.company.parroquia}
                        </Badge>
                        {result.company.sector && (
                          <Badge variant="outline" className="text-xs">
                            {result.company.sector}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <Navigation className="h-3 w-3 text-muted-foreground mt-1 shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}

      {query.trim().length >= 2 && results.length === 0 && !isSearching && (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No se encontraron resultados
        </div>
      )}

      {query.trim().length === 0 && (
        <div className="p-6 text-center">
          <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Busca empresas, direcciones o lugares en Andorra
          </p>
        </div>
      )}
    </Card>
  );
}
