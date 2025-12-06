import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Building2, CreditCard, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Company {
  id: string;
  name: string;
  bp: string | null;
  tax_id: string | null;
}

interface CompanySearchBarProps {
  onSelectCompany: (company: Company) => void;
  selectedCompanyId: string;
}

const CompanySearchBar = ({ onSelectCompany, selectedCompanyId }: CompanySearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchSelectedCompany();
    }
  }, [selectedCompanyId]);

  const fetchSelectedCompany = async () => {
    const { data } = await supabase
      .from('companies')
      .select('id, name, bp, tax_id')
      .eq('id', selectedCompanyId)
      .single();
    
    if (data) {
      setSelectedCompany(data);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        searchCompanies();
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const searchCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, bp, tax_id')
        .or(`name.ilike.%${searchTerm}%,bp.ilike.%${searchTerm}%,tax_id.ilike.%${searchTerm}%`)
        .order('name')
        .limit(10);

      if (error) throw error;
      setResults(data || []);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (company: Company) => {
    setSelectedCompany(company);
    onSelectCompany(company);
    setSearchTerm('');
    setShowResults(false);
  };

  const handleClear = () => {
    setSelectedCompany(null);
    setSearchTerm('');
    setResults([]);
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cercar per nom, BP o NRT..."
            className="pl-10 pr-4"
            onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </div>

      {selectedCompany && (
        <Card className="mt-2 border-primary/30 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold text-lg">{selectedCompany.name}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {selectedCompany.bp && (
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        BP: {selectedCompany.bp}
                      </span>
                    )}
                    {selectedCompany.tax_id && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        NRT: {selectedCompany.tax_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClear}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showResults && results.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-[300px] overflow-auto shadow-lg">
          <CardContent className="p-0">
            {results.map((company) => (
              <button
                key={company.id}
                onClick={() => handleSelect(company)}
                className={cn(
                  "w-full px-4 py-3 text-left hover:bg-accent/50 transition-colors border-b last:border-0",
                  company.id === selectedCompanyId && "bg-primary/10"
                )}
              >
                <div className="font-medium">{company.name}</div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  {company.bp && (
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      BP: {company.bp}
                    </span>
                  )}
                  {company.tax_id && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      NRT: {company.tax_id}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {showResults && results.length === 0 && searchTerm.length >= 2 && !loading && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg">
          <CardContent className="p-4 text-center text-muted-foreground">
            No s'han trobat empreses amb "{searchTerm}"
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompanySearchBar;
