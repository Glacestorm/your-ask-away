import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Building2, CreditCard, FileText, Briefcase, Calendar, CheckCircle, XCircle, AlertTriangle, Hash } from 'lucide-react';
import { getCnaeDescription } from '@/lib/cnaeDescriptions';

interface Company {
  id: string;
  name: string;
  bp: string | null;
  tax_id: string | null;
  cnae: string | null;
  legal_form: string | null;
  client_type: string | null;
  created_at: string | null;
}

interface BalanceStatus {
  is_balanced: boolean;
  difference: number;
  total_assets: number;
  total_liabilities_equity: number;
}

interface EnhancedCompanyHeaderProps {
  companyId: string;
}

const EnhancedCompanyHeader = ({ companyId }: EnhancedCompanyHeaderProps) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [balanceStatus, setBalanceStatus] = useState<BalanceStatus | null>(null);
  const [firstStatement, setFirstStatement] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      fetchCompanyData();
    }
  }, [companyId]);

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      // Fetch company details
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name, bp, tax_id, cnae, legal_form, client_type, created_at')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      // Fetch first financial statement date
      const { data: stmtData } = await supabase
        .from('company_financial_statements')
        .select('created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (stmtData) {
        setFirstStatement(new Date(stmtData.created_at).toLocaleDateString('ca-AD'));
      }

      // Fetch latest balance for status check
      const { data: latestStmt } = await supabase
        .from('company_financial_statements')
        .select('id')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('fiscal_year', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestStmt) {
        const { data: balance } = await supabase
          .from('balance_sheets')
          .select('*')
          .eq('statement_id', latestStmt.id)
          .maybeSingle();

        if (balance) {
          const assets = (balance.tangible_assets || 0) + (balance.intangible_assets || 0) +
            (balance.goodwill || 0) + (balance.real_estate_investments || 0) +
            (balance.long_term_financial_investments || 0) + (balance.deferred_tax_assets || 0) +
            (balance.inventory || 0) + (balance.trade_receivables || 0) +
            (balance.short_term_financial_investments || 0) + (balance.cash_equivalents || 0);

          const equity = (balance.share_capital || 0) + (balance.share_premium || 0) +
            (balance.legal_reserve || 0) + (balance.voluntary_reserves || 0) +
            (balance.retained_earnings || 0) + (balance.current_year_result || 0);

          const liabilities = (balance.long_term_debts || 0) + (balance.short_term_debts || 0) +
            (balance.trade_payables || 0) + (balance.other_creditors || 0);

          const total = equity + liabilities;
          const difference = Math.abs(assets - total);

          setBalanceStatus({
            is_balanced: difference < 1,
            difference,
            total_assets: assets,
            total_liabilities_equity: total
          });
        }
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !company) {
    return (
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/20 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-primary/20 rounded w-1/3" />
            <div className="h-4 bg-primary/10 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const cnaeDescription = getCnaeDescription(company.cnae);

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
      <div className="flex items-start gap-4">
        {/* Company Icon */}
        <div className="p-3 bg-primary/20 rounded-full">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        
        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold truncate">{company.name}</h2>
            
            {/* Balance Status Badge */}
            {balanceStatus && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge 
                      variant="outline" 
                      className={balanceStatus.is_balanced 
                        ? 'bg-green-500/10 text-green-600 border-green-500/30' 
                        : 'bg-red-500/10 text-red-600 border-red-500/30'
                      }
                    >
                      {balanceStatus.is_balanced ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Quadrat
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Descuadrat
                        </>
                      )}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      <p>Total Actiu: {balanceStatus.total_assets.toLocaleString('ca-AD')} €</p>
                      <p>Passiu + PN: {balanceStatus.total_liabilities_equity.toLocaleString('ca-AD')} €</p>
                      {!balanceStatus.is_balanced && (
                        <p className="text-red-400">Diferència: {balanceStatus.difference.toLocaleString('ca-AD')} €</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Client Type */}
            {company.client_type && (
              <Badge variant="secondary" className="text-xs">
                {company.client_type === 'cliente' ? 'Client' : 'Potencial'}
              </Badge>
            )}
          </div>

          {/* Details Row 1 */}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
            {company.bp && (
              <span className="flex items-center gap-1">
                <CreditCard className="w-4 h-4" />
                BP: {company.bp}
              </span>
            )}
            {company.tax_id && (
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                NRT: {company.tax_id}
              </span>
            )}
            {company.legal_form && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {company.legal_form}
              </span>
            )}
            {firstStatement && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Des de: {firstStatement}
              </span>
            )}
          </div>

          {/* Details Row 2 - CNAE */}
          {company.cnae && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-primary/5">
                <Hash className="w-3 h-3 mr-1" />
                CNAE {company.cnae}
              </Badge>
              {cnaeDescription && (
                <span className="text-sm text-muted-foreground truncate">
                  {cnaeDescription}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedCompanyHeader;
