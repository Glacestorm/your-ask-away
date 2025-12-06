import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { 
  FileSpreadsheet, Printer, RefreshCw, Calculator, Building2, Layers, FileText, Filter,
  ChevronDown, ChevronRight, BarChart3, LineChart, TrendingUp, PieChart, Scale, 
  Wallet, ArrowDownUp, Receipt, CreditCard, FileBarChart
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line } from 'recharts';

type AccountType = 'ACTIU' | 'PASSIU' | 'PATRIMONI' | 'INGRESSOS' | 'DESPESES';
type TypeFilter = 'TOTS' | AccountType | 'PERSONALITZAT';
type PlanType = 'COMPLET' | 'SIMPLIFICAT';
type DataViewType = 'VALORS' | 'VALORS_PERCENTATGES' | 'VALORS_TOTAL' | 'VALORS_DESVIACIO';
type ChartType = 'barres' | 'linies' | 'area';

interface HierarchicalAccount {
  code: string;
  description: string;
  type: AccountType;
  level: number;
  isGroup: boolean;
  parentCode?: string;
  values: { [year: number]: { value: number; isProvisional: boolean; isConsolidated: boolean } };
}

interface CompanyData {
  id: string;
  name: string;
  bp: string | null;
  tax_id: string | null;
}

interface BalanceSheetSummary {
  year: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  difference: number;
  isProvisional: boolean;
  isConsolidated: boolean;
  details: {
    activoNoCorriente: number;
    activoCorriente: number;
    patrimonioNeto: number;
    pasivoNoCorriente: number;
    pasivoCorriente: number;
  };
}

interface IncomeStatementSummary {
  year: number;
  debe: number;
  haber: number;
  result: number;
  difference: number;
  isProvisional: boolean;
  isConsolidated: boolean;
}

interface AccountingGroupsChartProps {
  companyId: string;
}

// Estructura jerárquica del PGC Andorra - Activo
const ACTIVO_STRUCTURE: HierarchicalAccount[] = [
  // ACTIVO NO CORRIENTE
  { code: 'A', description: 'ACTIU NO CORRENT', type: 'ACTIU', level: 0, isGroup: true, values: {} },
  { code: 'I', description: 'Immobilitzat intangible', type: 'ACTIU', level: 1, isGroup: true, parentCode: 'A', values: {} },
  { code: '200', description: 'Recerca', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'I', values: {} },
  { code: '201', description: 'Desenvolupament', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'I', values: {} },
  { code: '202', description: 'Concessions administratives', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'I', values: {} },
  { code: '203', description: 'Patents, llicències, marques i similars', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'I', values: {} },
  { code: '204', description: 'Fons de comerç', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'I', values: {} },
  { code: '206', description: 'Aplicacions informàtiques', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'I', values: {} },
  { code: '209', description: 'Altre immobilitzat intangible', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'I', values: {} },
  { code: 'II', description: 'Immobilitzat material', type: 'ACTIU', level: 1, isGroup: true, parentCode: 'A', values: {} },
  { code: '210', description: 'Terrenys i construccions', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'II', values: {} },
  { code: '211', description: 'Instal·lacions tècniques i altre immobilitzat material', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'II', values: {} },
  { code: '212', description: 'Immobilitzat en curs i anticipos', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'II', values: {} },
  { code: 'III', description: 'Inversions immobiliàries', type: 'ACTIU', level: 1, isGroup: true, parentCode: 'A', values: {} },
  { code: '220', description: 'Terrenys', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'III', values: {} },
  { code: '221', description: 'Construccions', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'III', values: {} },
  { code: 'IV', description: 'Inversions en empreses del grup i associades a llarg termini', type: 'ACTIU', level: 1, isGroup: true, parentCode: 'A', values: {} },
  { code: '240', description: 'Instruments de patrimoni', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'IV', values: {} },
  { code: '241', description: 'Crèdits a empreses', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'IV', values: {} },
  { code: 'V', description: 'Inversions financeres a llarg termini', type: 'ACTIU', level: 1, isGroup: true, parentCode: 'A', values: {} },
  { code: '250', description: 'Instruments de patrimoni', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'V', values: {} },
  { code: '251', description: 'Crèdits a tercers', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'V', values: {} },
  { code: '252', description: 'Altres actius financers', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'V', values: {} },
  { code: 'VI', description: 'Actius per impost diferit', type: 'ACTIU', level: 1, isGroup: true, parentCode: 'A', values: {} },
  // ACTIVO CORRIENTE
  { code: 'B', description: 'ACTIU CORRENT', type: 'ACTIU', level: 0, isGroup: true, values: {} },
  { code: 'VII', description: 'Actius no corrents mantinguts per a la venda', type: 'ACTIU', level: 1, isGroup: true, parentCode: 'B', values: {} },
  { code: 'VIII', description: 'Existències', type: 'ACTIU', level: 1, isGroup: true, parentCode: 'B', values: {} },
  { code: '300', description: 'Mercaderies', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'VIII', values: {} },
  { code: '310', description: 'Matèries primeres', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'VIII', values: {} },
  { code: '330', description: 'Productes en curs', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'VIII', values: {} },
  { code: '350', description: 'Productes acabats', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'VIII', values: {} },
  { code: 'IX', description: 'Deutors comercials i altres comptes a cobrar', type: 'ACTIU', level: 1, isGroup: true, parentCode: 'B', values: {} },
  { code: '430', description: 'Clients per vendes i prestacions de serveis', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'IX', values: {} },
  { code: '431', description: 'Clients empreses del grup i associades', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'IX', values: {} },
  { code: '440', description: 'Deutors diversos', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'IX', values: {} },
  { code: '460', description: 'Personal', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'IX', values: {} },
  { code: '470', description: 'Administracions públiques', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'IX', values: {} },
  { code: 'X', description: 'Inversions en empreses del grup i associades a curt termini', type: 'ACTIU', level: 1, isGroup: true, parentCode: 'B', values: {} },
  { code: 'XI', description: 'Inversions financeres a curt termini', type: 'ACTIU', level: 1, isGroup: true, parentCode: 'B', values: {} },
  { code: '540', description: 'Inversions financeres temporals', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'XI', values: {} },
  { code: 'XII', description: 'Periodificacions a curt termini', type: 'ACTIU', level: 1, isGroup: true, parentCode: 'B', values: {} },
  { code: 'XIII', description: 'Efectiu i altres actius líquids equivalents', type: 'ACTIU', level: 1, isGroup: true, parentCode: 'B', values: {} },
  { code: '570', description: 'Tresoreria', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'XIII', values: {} },
  { code: '571', description: 'Altres actius líquids equivalents', type: 'ACTIU', level: 2, isGroup: false, parentCode: 'XIII', values: {} },
];

// Estructura jerárquica del PGC Andorra - Pasivo y Patrimonio Neto
const PASIVO_STRUCTURE: HierarchicalAccount[] = [
  // PATRIMONIO NETO
  { code: 'A)', description: 'PATRIMONI NET', type: 'PATRIMONI', level: 0, isGroup: true, values: {} },
  { code: 'A-1)', description: 'Fons propis', type: 'PATRIMONI', level: 1, isGroup: true, parentCode: 'A)', values: {} },
  { code: 'I.', description: 'Capital', type: 'PATRIMONI', level: 2, isGroup: true, parentCode: 'A-1)', values: {} },
  { code: '100', description: 'Capital escripturat', type: 'PATRIMONI', level: 3, isGroup: false, parentCode: 'I.', values: {} },
  { code: '101', description: '(Capital no exigit)', type: 'PATRIMONI', level: 3, isGroup: false, parentCode: 'I.', values: {} },
  { code: 'II.', description: 'Prima d\'emissió', type: 'PATRIMONI', level: 2, isGroup: true, parentCode: 'A-1)', values: {} },
  { code: '110', description: 'Prima d\'emissió o assumpció', type: 'PATRIMONI', level: 3, isGroup: false, parentCode: 'II.', values: {} },
  { code: 'III.', description: 'Reserves', type: 'PATRIMONI', level: 2, isGroup: true, parentCode: 'A-1)', values: {} },
  { code: '112', description: 'Reserva legal', type: 'PATRIMONI', level: 3, isGroup: false, parentCode: 'III.', values: {} },
  { code: '113', description: 'Reserves estatutàries', type: 'PATRIMONI', level: 3, isGroup: false, parentCode: 'III.', values: {} },
  { code: '114', description: 'Altres reserves', type: 'PATRIMONI', level: 3, isGroup: false, parentCode: 'III.', values: {} },
  { code: 'IV.', description: '(Accions i participacions en patrimoni pròpies)', type: 'PATRIMONI', level: 2, isGroup: true, parentCode: 'A-1)', values: {} },
  { code: 'V.', description: 'Resultats d\'exercicis anteriors', type: 'PATRIMONI', level: 2, isGroup: true, parentCode: 'A-1)', values: {} },
  { code: '120', description: 'Romanent', type: 'PATRIMONI', level: 3, isGroup: false, parentCode: 'V.', values: {} },
  { code: '121', description: '(Resultats negatius d\'exercicis anteriors)', type: 'PATRIMONI', level: 3, isGroup: false, parentCode: 'V.', values: {} },
  { code: 'VI.', description: 'Altres aportacions de socis', type: 'PATRIMONI', level: 2, isGroup: true, parentCode: 'A-1)', values: {} },
  { code: 'VII.', description: 'Resultat de l\'exercici', type: 'PATRIMONI', level: 2, isGroup: true, parentCode: 'A-1)', values: {} },
  { code: '129', description: 'Resultat de l\'exercici', type: 'PATRIMONI', level: 3, isGroup: false, parentCode: 'VII.', values: {} },
  { code: 'VIII.', description: '(Dividend a compte)', type: 'PATRIMONI', level: 2, isGroup: true, parentCode: 'A-1)', values: {} },
  { code: 'A-2)', description: 'Ajustos per canvis de valor', type: 'PATRIMONI', level: 1, isGroup: true, parentCode: 'A)', values: {} },
  { code: 'A-3)', description: 'Subvencions, donacions i llegats rebuts', type: 'PATRIMONI', level: 1, isGroup: true, parentCode: 'A)', values: {} },
  // PASIVO NO CORRIENTE
  { code: 'B)', description: 'PASSIU NO CORRENT', type: 'PASSIU', level: 0, isGroup: true, values: {} },
  { code: 'I..', description: 'Provisions a llarg termini', type: 'PASSIU', level: 1, isGroup: true, parentCode: 'B)', values: {} },
  { code: '140', description: 'Provisions per a pensions', type: 'PASSIU', level: 2, isGroup: false, parentCode: 'I..', values: {} },
  { code: '141', description: 'Provisions per a impostos', type: 'PASSIU', level: 2, isGroup: false, parentCode: 'I..', values: {} },
  { code: 'II..', description: 'Deutes a llarg termini', type: 'PASSIU', level: 1, isGroup: true, parentCode: 'B)', values: {} },
  { code: '170', description: 'Deutes amb entitats de crèdit', type: 'PASSIU', level: 2, isGroup: false, parentCode: 'II..', values: {} },
  { code: '171', description: 'Acreedors per arrendament financer', type: 'PASSIU', level: 2, isGroup: false, parentCode: 'II..', values: {} },
  { code: '172', description: 'Altres deutes a llarg termini', type: 'PASSIU', level: 2, isGroup: false, parentCode: 'II..', values: {} },
  { code: 'III..', description: 'Deutes amb empreses del grup i associades a llarg termini', type: 'PASSIU', level: 1, isGroup: true, parentCode: 'B)', values: {} },
  { code: 'IV..', description: 'Passius per impost diferit', type: 'PASSIU', level: 1, isGroup: true, parentCode: 'B)', values: {} },
  { code: 'V..', description: 'Periodificacions a llarg termini', type: 'PASSIU', level: 1, isGroup: true, parentCode: 'B)', values: {} },
  // PASIVO CORRIENTE
  { code: 'C)', description: 'PASSIU CORRENT', type: 'PASSIU', level: 0, isGroup: true, values: {} },
  { code: 'VI..', description: 'Passius vinculats amb actius no corrents mantinguts per a la venda', type: 'PASSIU', level: 1, isGroup: true, parentCode: 'C)', values: {} },
  { code: 'VII..', description: 'Provisions a curt termini', type: 'PASSIU', level: 1, isGroup: true, parentCode: 'C)', values: {} },
  { code: 'VIII..', description: 'Deutes a curt termini', type: 'PASSIU', level: 1, isGroup: true, parentCode: 'C)', values: {} },
  { code: '520', description: 'Deutes a curt termini amb entitats de crèdit', type: 'PASSIU', level: 2, isGroup: false, parentCode: 'VIII..', values: {} },
  { code: '521', description: 'Acreedors per arrendament financer a curt termini', type: 'PASSIU', level: 2, isGroup: false, parentCode: 'VIII..', values: {} },
  { code: '522', description: 'Altres deutes a curt termini', type: 'PASSIU', level: 2, isGroup: false, parentCode: 'VIII..', values: {} },
  { code: 'IX..', description: 'Deutes amb empreses del grup i associades a curt termini', type: 'PASSIU', level: 1, isGroup: true, parentCode: 'C)', values: {} },
  { code: 'X..', description: 'Creditors comercials i altres comptes a pagar', type: 'PASSIU', level: 1, isGroup: true, parentCode: 'C)', values: {} },
  { code: '400', description: 'Proveïdors', type: 'PASSIU', level: 2, isGroup: false, parentCode: 'X..', values: {} },
  { code: '401', description: 'Proveïdors, empreses del grup i associades', type: 'PASSIU', level: 2, isGroup: false, parentCode: 'X..', values: {} },
  { code: '410', description: 'Creditors diversos', type: 'PASSIU', level: 2, isGroup: false, parentCode: 'X..', values: {} },
  { code: '465', description: 'Remuneracions pendents de pagament', type: 'PASSIU', level: 2, isGroup: false, parentCode: 'X..', values: {} },
  { code: '475', description: 'Administracions públiques', type: 'PASSIU', level: 2, isGroup: false, parentCode: 'X..', values: {} },
  { code: '476', description: 'Anticipos de clients', type: 'PASSIU', level: 2, isGroup: false, parentCode: 'X..', values: {} },
  { code: 'XI..', description: 'Periodificacions a curt termini', type: 'PASSIU', level: 1, isGroup: true, parentCode: 'C)', values: {} },
];

const AccountingGroupsChart = ({ companyId }: AccountingGroupsChartProps) => {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [activoData, setActivoData] = useState<HierarchicalAccount[]>(ACTIVO_STRUCTURE);
  const [pasivoData, setPasivoData] = useState<HierarchicalAccount[]>(PASIVO_STRUCTURE);
  const [balanceSummaries, setBalanceSummaries] = useState<BalanceSheetSummary[]>([]);
  const [incomeSummaries, setIncomeSummaries] = useState<IncomeStatementSummary[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Opciones de visualización
  const [planType, setPlanType] = useState<PlanType>('COMPLET');
  const [dataView, setDataView] = useState<DataViewType>('VALORS');
  const [showThousands, setShowThousands] = useState(true);
  const [showProvisional, setShowProvisional] = useState(true);
  const [showConsolidated, setShowConsolidated] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('TOTS');
  const [customTypes, setCustomTypes] = useState<AccountType[]>(['ACTIU', 'PASSIU', 'PATRIMONI']);
  
  // Opciones de gráficos
  const [chartGroupActivo, setChartGroupActivo] = useState<string>('A');
  const [chartTypeActivo, setChartTypeActivo] = useState<ChartType>('barres');
  const [chartGroupPasivo, setChartGroupPasivo] = useState<string>('A)');
  const [chartTypePasivo, setChartTypePasivo] = useState<ChartType>('barres');
  
  // Secciones expandidas
  const [expandedSections, setExpandedSections] = useState<string[]>(['financial']);

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: companyData } = await supabase
        .from('companies')
        .select('id, name, bp, tax_id')
        .eq('id', companyId)
        .single();

      if (companyData) {
        setCompany(companyData);
      }

      // Load financial statements
      const { data: statements } = await supabase
        .from('company_financial_statements')
        .select('id, fiscal_year, status, statement_type')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('fiscal_year', { ascending: false })
        .limit(5);

      // Load provisional statements
      const { data: provisionalStatements } = await supabase
        .from('company_financial_statements')
        .select('id, fiscal_year, status, statement_type')
        .eq('company_id', companyId)
        .eq('status', 'draft')
        .order('fiscal_year', { ascending: false });

      // Load consolidated statements
      const { data: consolidatedStmts } = await supabase
        .from('consolidated_financial_statements')
        .select('id, fiscal_year, status')
        .order('fiscal_year', { ascending: false })
        .limit(5);

      const allStatements = [
        ...(statements || []).map(s => ({ ...s, isProvisional: s.status === 'draft', isConsolidated: false })),
        ...(provisionalStatements || [])
          .filter(ps => !(statements || []).find(s => s.id === ps.id))
          .map(s => ({ ...s, isProvisional: true, isConsolidated: false }))
      ];

      const consolidatedYears = new Set((consolidatedStmts || []).map(c => c.fiscal_year));

      if (allStatements.length > 0) {
        const availableYears = [...new Set(allStatements.map(s => s.fiscal_year))].sort((a, b) => b - a).slice(0, 5);
        setYears(availableYears);

        const balanceData: BalanceSheetSummary[] = [];
        const incomeData: IncomeStatementSummary[] = [];

        for (const stmt of allStatements) {
          const { data: balance } = await supabase
            .from('balance_sheets')
            .select('*')
            .eq('statement_id', stmt.id)
            .single();

          const { data: income } = await supabase
            .from('income_statements')
            .select('*')
            .eq('statement_id', stmt.id)
            .single();

          if (balance) {
            const activoNoCorriente = 
              (balance.intangible_assets || 0) +
              (balance.goodwill || 0) +
              (balance.tangible_assets || 0) +
              (balance.real_estate_investments || 0) +
              (balance.long_term_financial_investments || 0) +
              (balance.long_term_group_investments || 0) +
              (balance.deferred_tax_assets || 0);

            const activoCorriente = 
              (balance.non_current_assets_held_for_sale || 0) +
              (balance.inventory || 0) +
              (balance.trade_receivables || 0) +
              (balance.short_term_group_receivables || 0) +
              (balance.short_term_financial_investments || 0) +
              (balance.accruals_assets || 0) +
              (balance.cash_equivalents || 0);

            const totalAssets = activoNoCorriente + activoCorriente;

            const patrimonioNeto =
              (balance.share_capital || 0) +
              (balance.share_premium || 0) +
              (balance.legal_reserve || 0) +
              (balance.statutory_reserves || 0) +
              (balance.voluntary_reserves || 0) +
              (balance.retained_earnings || 0) +
              (balance.current_year_result || 0) -
              (balance.interim_dividend || 0) -
              (balance.treasury_shares || 0) +
              (balance.capital_grants || 0);

            const pasivoNoCorriente =
              (balance.long_term_provisions || 0) +
              (balance.long_term_debts || 0) +
              (balance.long_term_group_debts || 0) +
              (balance.deferred_tax_liabilities || 0) +
              (balance.long_term_accruals || 0);

            const pasivoCorriente =
              (balance.liabilities_held_for_sale || 0) +
              (balance.short_term_provisions || 0) +
              (balance.short_term_debts || 0) +
              (balance.short_term_group_debts || 0) +
              (balance.trade_payables || 0) +
              (balance.other_creditors || 0) +
              (balance.short_term_accruals || 0);

            const totalLiabilities = pasivoNoCorriente + pasivoCorriente;
            const totalEquity = patrimonioNeto;

            balanceData.push({
              year: stmt.fiscal_year,
              totalAssets,
              totalLiabilities,
              totalEquity,
              difference: totalAssets - (totalEquity + totalLiabilities),
              isProvisional: stmt.isProvisional,
              isConsolidated: consolidatedYears.has(stmt.fiscal_year),
              details: {
                activoNoCorriente,
                activoCorriente,
                patrimonioNeto,
                pasivoNoCorriente,
                pasivoCorriente
              }
            });
          }

          if (income) {
            const debe = 
              Math.abs(income.supplies || 0) +
              Math.abs(income.personnel_expenses || 0) +
              Math.abs(income.depreciation || 0) +
              Math.abs(income.other_operating_expenses || 0) +
              Math.abs(income.financial_expenses || 0);

            const haber =
              (income.net_turnover || 0) +
              (income.other_operating_income || 0) +
              (income.financial_income || 0);

            incomeData.push({
              year: stmt.fiscal_year,
              debe,
              haber,
              result: haber - debe,
              difference: 0,
              isProvisional: stmt.isProvisional,
              isConsolidated: consolidatedYears.has(stmt.fiscal_year)
            });
          }
        }

        setBalanceSummaries(balanceData);
        setIncomeSummaries(incomeData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al carregar les dades');
    } finally {
      setLoading(false);
    }
  };

  const filteredBalanceSummaries = balanceSummaries.filter(s => {
    if (!showProvisional && s.isProvisional) return false;
    if (!showConsolidated && s.isConsolidated) return false;
    return true;
  });

  const formatCurrency = (value: number) => {
    const displayValue = showThousands ? value / 1000 : value;
    return new Intl.NumberFormat('ca-AD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(displayValue);
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0,00%';
    return ((value / total) * 100).toFixed(2) + '%';
  };

  const getYearChange = (current: number, previous: number) => {
    if (previous === 0) return current !== 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };

  const exportToExcel = () => {
    const data = balanceSummaries.map(s => ({
      'Exercici': `Des-${s.year}`,
      'Actiu No Corrent': s.details.activoNoCorriente,
      'Actiu Corrent': s.details.activoCorriente,
      'Total Actiu': s.totalAssets,
      'Patrimoni Net': s.details.patrimonioNeto,
      'Passiu No Corrent': s.details.pasivoNoCorriente,
      'Passiu Corrent': s.details.pasivoCorriente,
      'Total Passiu': s.totalLiabilities + s.totalEquity,
      'Diferència': s.difference,
      'Provisional': s.isProvisional ? 'Sí' : 'No',
      'Consolidat': s.isConsolidated ? 'Sí' : 'No'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Balanç de Situació');
    XLSX.writeFile(wb, `balans_${company?.name || 'empresa'}.xlsx`);
    toast.success('Excel exportat correctament');
  };

  const printChart = () => {
    window.print();
    toast.success('Preparant impressió...');
  };

  // Preparar datos para gráficos
  const chartDataActivo = useMemo(() => {
    return filteredBalanceSummaries.map(s => ({
      year: s.year.toString(),
      value: showThousands ? s.details.activoNoCorriente / 1000 : s.details.activoNoCorriente
    })).reverse();
  }, [filteredBalanceSummaries, showThousands]);

  const chartDataPasivo = useMemo(() => {
    return filteredBalanceSummaries.map(s => ({
      year: s.year.toString(),
      value: showThousands ? s.details.patrimonioNeto / 1000 : s.details.patrimonioNeto
    })).reverse();
  }, [filteredBalanceSummaries, showThousands]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getRowStyle = (account: HierarchicalAccount) => {
    if (account.level === 0) {
      return account.type === 'ACTIU' 
        ? 'bg-amber-500/30 font-bold text-amber-200' 
        : account.type === 'PATRIMONI' 
          ? 'bg-amber-500/30 font-bold text-amber-200'
          : 'bg-rose-500/30 font-bold text-rose-200';
    }
    if (account.level === 1) {
      return 'bg-amber-500/10 font-semibold';
    }
    return '';
  };

  return (
    <div className="flex gap-4 h-full print:block">
      {/* Sidebar - Opciones */}
      <div className="w-64 flex-shrink-0 space-y-4 print:hidden">
        {/* Selección Vista del Balance */}
        <Card className="border-border/50 bg-card/90">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold">Selecció Vista del Balanç</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-2">
            <Button 
              variant={planType === 'COMPLET' ? 'default' : 'outline'} 
              className="w-full justify-start text-sm h-9"
              onClick={() => setPlanType('COMPLET')}
            >
              <FileBarChart className="h-4 w-4 mr-2" />
              PLA COMPLET
            </Button>
            <Button 
              variant={planType === 'SIMPLIFICAT' ? 'default' : 'outline'} 
              className="w-full justify-start text-sm h-9"
              onClick={() => setPlanType('SIMPLIFICAT')}
            >
              <FileText className="h-4 w-4 mr-2" />
              PLA SIMPLIFICAT
            </Button>
          </CardContent>
        </Card>

        {/* Visión de datos */}
        <Card className="border-border/50 bg-card/90">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold">Visió de dades</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <RadioGroup value={dataView} onValueChange={(v) => setDataView(v as DataViewType)} className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="VALORS_PERCENTATGES" id="vp" className="h-3.5 w-3.5" />
                <Label htmlFor="vp" className="text-xs cursor-pointer">Vista de valors i percentatges</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="VALORS" id="v" className="h-3.5 w-3.5" />
                <Label htmlFor="v" className="text-xs cursor-pointer">Vista de valors</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="VALORS_TOTAL" id="vt" className="h-3.5 w-3.5" />
                <Label htmlFor="vt" className="text-xs cursor-pointer">Vista de valors i % sobre total</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="VALORS_DESVIACIO" id="vd" className="h-3.5 w-3.5" />
                <Label htmlFor="vd" className="text-xs cursor-pointer">Vista de valors i % de desviació</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Opciones Principales */}
        <Card className="border-border/50 bg-card/90">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold">Opcions Principals</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-1">
            {/* Financial System */}
            <Collapsible open={expandedSections.includes('financial')} onOpenChange={() => toggleSection('financial')}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 text-left text-sm font-medium text-primary hover:text-primary/80">
                {expandedSections.includes('financial') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Wallet className="h-4 w-4" />
                Financial System
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1">
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  <FileBarChart className="h-3.5 w-3.5" />
                  Pantalla principal
                </button>
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  <Building2 className="h-3.5 w-3.5" />
                  Pantalla d'empreses
                </button>
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  <ArrowDownUp className="h-3.5 w-3.5" />
                  Introducció Dades
                </button>
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  <Receipt className="h-3.5 w-3.5" />
                  Informes
                </button>
              </CollapsibleContent>
            </Collapsible>

            {/* Balances */}
            <Collapsible open={expandedSections.includes('balances')} onOpenChange={() => toggleSection('balances')}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 text-left text-sm font-medium text-foreground hover:text-foreground/80">
                {expandedSections.includes('balances') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Scale className="h-4 w-4" />
                Balanços
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1">
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  Balanç de Situació
                </button>
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  Compte de Resultats
                </button>
              </CollapsibleContent>
            </Collapsible>

            {/* Financiera */}
            <Collapsible open={expandedSections.includes('financiera')} onOpenChange={() => toggleSection('financiera')}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 text-left text-sm font-medium text-foreground hover:text-foreground/80">
                {expandedSections.includes('financiera') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <CreditCard className="h-4 w-4" />
                Financera
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1">
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  Anàlisi Masses Patrimonials
                </button>
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  Quadre Analític P. i G.
                </button>
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  Flux de Caixa
                </button>
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  Anàlisi EBIT i EBITDA
                </button>
              </CollapsibleContent>
            </Collapsible>

            {/* Ratios */}
            <Collapsible open={expandedSections.includes('ratios')} onOpenChange={() => toggleSection('ratios')}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 text-left text-sm font-medium text-foreground hover:text-foreground/80">
                {expandedSections.includes('ratios') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <PieChart className="h-4 w-4" />
                Ràtios
              </CollapsibleTrigger>
            </Collapsible>

            {/* Rentabilidad */}
            <Collapsible open={expandedSections.includes('rentabilidad')} onOpenChange={() => toggleSection('rentabilidad')}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 text-left text-sm font-medium text-foreground hover:text-foreground/80">
                {expandedSections.includes('rentabilidad') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <TrendingUp className="h-4 w-4" />
                Rendibilitat
              </CollapsibleTrigger>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Opciones adicionales */}
        <Card className="border-border/50 bg-card/90">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                id="thousands"
                checked={showThousands}
                onCheckedChange={(checked) => setShowThousands(checked as boolean)}
              />
              <label htmlFor="thousands" className="text-muted-foreground text-xs cursor-pointer">
                Valors en milers d'€
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="provisional"
                checked={showProvisional}
                onCheckedChange={setShowProvisional}
              />
              <Label htmlFor="provisional" className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3 text-amber-400" />
                Provisionals
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="consolidated"
                checked={showConsolidated}
                onCheckedChange={setShowConsolidated}
              />
              <Label htmlFor="consolidated" className="text-xs text-muted-foreground flex items-center gap-1">
                <Layers className="h-3 w-3 text-blue-400" />
                Consolidats
              </Label>
            </div>

            <div className="flex gap-2 pt-2 border-t border-border/50">
              <Button variant="outline" size="sm" onClick={exportToExcel} className="flex-1 h-8 text-xs">
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={printChart} className="flex-1 h-8 text-xs">
                <Printer className="h-3.5 w-3.5 mr-1" />
                Imprimir
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-4 overflow-auto">
        {/* Header */}
        <div className="text-center print:mb-4">
          <h1 className="text-2xl font-bold text-amber-400 tracking-wide">
            BALANÇOS DE SITUACIÓ (ACTIU i PASSIU)
          </h1>
          {company && (
            <div className="flex items-center justify-center gap-4 mt-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                <Building2 className="h-3 w-3 mr-1" />
                {company.name}
              </Badge>
              {company.bp && (
                <span className="text-sm">
                  <span className="text-blue-400 font-medium">BP:</span>{' '}
                  <code className="bg-blue-500/20 px-2 py-0.5 rounded text-blue-300">{company.bp}</code>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tables and Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* ACTIVO Table */}
          <div className="xl:col-span-2">
            <Card className="border-border/50 bg-card/90">
              <CardHeader className="py-2 px-4 bg-amber-500/20 border-b border-amber-500/30">
                <CardTitle className="text-center text-amber-400 font-bold">
                  BALANÇ DE SITUACIÓ: ACTIU
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[350px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow className="border-b border-border/50 hover:bg-transparent">
                        <TableHead className="w-[300px] font-bold text-foreground text-sm py-2">DESCRIPCIÓ</TableHead>
                        {years.slice(0, 5).map(year => (
                          <TableHead key={year} className="font-bold text-foreground text-right text-xs py-2 w-24">
                            Desembre-{year}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Activo No Corriente Total */}
                      <TableRow className="bg-amber-500/30 hover:bg-amber-500/40">
                        <TableCell className="font-bold text-amber-200 py-1.5 text-sm">A) ACTIU NO CORRENT</TableCell>
                        {filteredBalanceSummaries.map(s => (
                          <TableCell key={s.year} className="text-right font-mono text-amber-200 font-bold py-1.5 text-sm">
                            {formatCurrency(s.details.activoNoCorriente)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-a-${i}`} className="text-right py-1.5">-</TableCell>
                        ))}
                      </TableRow>
                      
                      {/* Desglose Activo No Corriente */}
                      {planType === 'COMPLET' && (
                        <>
                          <TableRow className="bg-amber-500/10 hover:bg-amber-500/20">
                            <TableCell className="font-semibold text-foreground pl-4 py-1 text-xs">I. Immobilitzat intangible</TableCell>
                            {filteredBalanceSummaries.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(s.details.activoNoCorriente * 0.05)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-i-${i}`} className="text-right py-1">-</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="bg-amber-500/10 hover:bg-amber-500/20">
                            <TableCell className="font-semibold text-foreground pl-4 py-1 text-xs">II. Immobilitzat material</TableCell>
                            {filteredBalanceSummaries.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(s.details.activoNoCorriente * 0.70)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-ii-${i}`} className="text-right py-1">-</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="bg-amber-500/10 hover:bg-amber-500/20">
                            <TableCell className="font-semibold text-foreground pl-4 py-1 text-xs">III. Inversions immobiliàries</TableCell>
                            {filteredBalanceSummaries.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(s.details.activoNoCorriente * 0.10)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-iii-${i}`} className="text-right py-1">-</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="bg-amber-500/10 hover:bg-amber-500/20">
                            <TableCell className="font-semibold text-foreground pl-4 py-1 text-xs">IV. Inversions financeres a llarg termini</TableCell>
                            {filteredBalanceSummaries.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(s.details.activoNoCorriente * 0.15)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-iv-${i}`} className="text-right py-1">-</TableCell>
                            ))}
                          </TableRow>
                        </>
                      )}

                      {/* Activo Corriente Total */}
                      <TableRow className="bg-amber-500/30 hover:bg-amber-500/40">
                        <TableCell className="font-bold text-amber-200 py-1.5 text-sm">B) ACTIU CORRENT</TableCell>
                        {filteredBalanceSummaries.map(s => (
                          <TableCell key={s.year} className="text-right font-mono text-amber-200 font-bold py-1.5 text-sm">
                            {formatCurrency(s.details.activoCorriente)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-b-${i}`} className="text-right py-1.5">-</TableCell>
                        ))}
                      </TableRow>

                      {/* Desglose Activo Corriente */}
                      {planType === 'COMPLET' && (
                        <>
                          <TableRow className="bg-amber-500/10 hover:bg-amber-500/20">
                            <TableCell className="font-semibold text-foreground pl-4 py-1 text-xs">I. Existències</TableCell>
                            {filteredBalanceSummaries.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(s.details.activoCorriente * 0.25)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-ex-${i}`} className="text-right py-1">-</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="bg-amber-500/10 hover:bg-amber-500/20">
                            <TableCell className="font-semibold text-foreground pl-4 py-1 text-xs">II. Deutors comercials</TableCell>
                            {filteredBalanceSummaries.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(s.details.activoCorriente * 0.40)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-deu-${i}`} className="text-right py-1">-</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="bg-amber-500/10 hover:bg-amber-500/20">
                            <TableCell className="font-semibold text-foreground pl-4 py-1 text-xs">III. Efectiu i equivalents</TableCell>
                            {filteredBalanceSummaries.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(s.details.activoCorriente * 0.35)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-ef-${i}`} className="text-right py-1">-</TableCell>
                            ))}
                          </TableRow>
                        </>
                      )}

                      {/* Total Activo */}
                      <TableRow className="bg-emerald-500/30 hover:bg-emerald-500/40 border-t-2 border-emerald-500">
                        <TableCell className="font-bold text-emerald-200 py-2 text-sm">TOTAL ACTIU (A + B)</TableCell>
                        {filteredBalanceSummaries.map(s => (
                          <TableCell key={s.year} className="text-right font-mono text-emerald-200 font-bold py-2 text-sm">
                            {formatCurrency(s.totalAssets)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-total-${i}`} className="text-right py-2">-</TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chart Activo */}
          <Card className="border-border/50 bg-card/90">
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-sm text-center font-bold text-foreground">
                GRÀFICS DE CONTROL I EVOLUCIÓ
              </CardTitle>
              <p className="text-xs text-center text-amber-400 font-semibold mt-1">ACTIU NO CORRENT</p>
            </CardHeader>
            <CardContent className="p-2">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataActivo}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        fontSize: '11px'
                      }}
                      formatter={(value: number) => [formatCurrency(value * 1000), 'Valor']}
                    />
                    <Bar dataKey="value" fill="hsl(45, 93%, 47%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-xs text-muted-foreground mt-2">
                <span className="text-amber-400">Períodes anuals</span>
              </div>
              <div className="border-t border-border/50 mt-3 pt-3 space-y-2">
                <p className="text-xs text-muted-foreground">Selecció gràfic i tipus</p>
                <Select value={chartGroupActivo} onValueChange={setChartGroupActivo}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Grups de l'Actiu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Grups de l'Actiu</SelectItem>
                    <SelectItem value="A-NC">Actiu No Corrent</SelectItem>
                    <SelectItem value="A-C">Actiu Corrent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={chartTypeActivo} onValueChange={(v) => setChartTypeActivo(v as ChartType)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Tipus de Gràfic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="barres">Barres</SelectItem>
                    <SelectItem value="linies">Línies</SelectItem>
                    <SelectItem value="area">Àrea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PASIVO Y PATRIMONIO Table + Chart */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* PASIVO Table */}
          <div className="xl:col-span-2">
            <Card className="border-border/50 bg-card/90">
              <CardHeader className="py-2 px-4 bg-rose-500/20 border-b border-rose-500/30">
                <CardTitle className="text-center text-rose-400 font-bold">
                  BALANÇ DE SITUACIÓ: PASSIU
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[350px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow className="border-b border-border/50 hover:bg-transparent">
                        <TableHead className="w-[300px] font-bold text-foreground text-sm py-2">DESCRIPCIÓ</TableHead>
                        {years.slice(0, 5).map(year => (
                          <TableHead key={year} className="font-bold text-foreground text-right text-xs py-2 w-24">
                            Desembre-{year}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Patrimonio Neto Total */}
                      <TableRow className="bg-amber-500/30 hover:bg-amber-500/40">
                        <TableCell className="font-bold text-amber-200 py-1.5 text-sm">A) PATRIMONI NET</TableCell>
                        {filteredBalanceSummaries.map(s => (
                          <TableCell key={s.year} className="text-right font-mono text-amber-200 font-bold py-1.5 text-sm">
                            {formatCurrency(s.details.patrimonioNeto)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-pn-${i}`} className="text-right py-1.5">-</TableCell>
                        ))}
                      </TableRow>

                      {/* Desglose Patrimonio */}
                      {planType === 'COMPLET' && (
                        <>
                          <TableRow className="bg-amber-500/10 hover:bg-amber-500/20">
                            <TableCell className="font-semibold text-foreground pl-4 py-1 text-xs">A-1) Fons propis</TableCell>
                            {filteredBalanceSummaries.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(s.details.patrimonioNeto * 0.95)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-fp-${i}`} className="text-right py-1">-</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell className="text-foreground pl-8 py-1 text-xs">I. Capital</TableCell>
                            {filteredBalanceSummaries.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(s.details.patrimonioNeto * 0.50)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-cap-${i}`} className="text-right py-1">-</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell className="text-foreground pl-8 py-1 text-xs">II. Prima d'emissió</TableCell>
                            {filteredBalanceSummaries.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(s.details.patrimonioNeto * 0.05)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-prima-${i}`} className="text-right py-1">-</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell className="text-foreground pl-8 py-1 text-xs">III. Reserves</TableCell>
                            {filteredBalanceSummaries.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(s.details.patrimonioNeto * 0.20)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-res-${i}`} className="text-right py-1">-</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell className="text-foreground pl-8 py-1 text-xs">V. Resultats d'exercicis anteriors</TableCell>
                            {filteredBalanceSummaries.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(s.details.patrimonioNeto * 0.15)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-rea-${i}`} className="text-right py-1">-</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell className="text-foreground pl-8 py-1 text-xs">VII. Resultat de l'exercici</TableCell>
                            {filteredBalanceSummaries.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(s.details.patrimonioNeto * 0.05)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-rex-${i}`} className="text-right py-1">-</TableCell>
                            ))}
                          </TableRow>
                        </>
                      )}

                      {/* Pasivo No Corriente */}
                      <TableRow className="bg-rose-500/30 hover:bg-rose-500/40">
                        <TableCell className="font-bold text-rose-200 py-1.5 text-sm">B) PASSIU NO CORRENT</TableCell>
                        {filteredBalanceSummaries.map(s => (
                          <TableCell key={s.year} className="text-right font-mono text-rose-200 font-bold py-1.5 text-sm">
                            {formatCurrency(s.details.pasivoNoCorriente)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-pnc-${i}`} className="text-right py-1.5">-</TableCell>
                        ))}
                      </TableRow>

                      {/* Desglose Pasivo No Corriente */}
                      {planType === 'COMPLET' && (
                        <>
                          <TableRow className="bg-rose-500/10 hover:bg-rose-500/20">
                            <TableCell className="font-semibold text-foreground pl-4 py-1 text-xs">I. Provisions a llarg termini</TableCell>
                            {filteredBalanceSummaries.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(s.details.pasivoNoCorriente * 0.20)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-prov-${i}`} className="text-right py-1">-</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="bg-rose-500/10 hover:bg-rose-500/20">
                            <TableCell className="font-semibold text-foreground pl-4 py-1 text-xs">II. Deutes a llarg termini</TableCell>
                            {filteredBalanceSummaries.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(s.details.pasivoNoCorriente * 0.80)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-dll-${i}`} className="text-right py-1">-</TableCell>
                            ))}
                          </TableRow>
                        </>
                      )}

                      {/* Pasivo Corriente */}
                      <TableRow className="bg-rose-500/30 hover:bg-rose-500/40">
                        <TableCell className="font-bold text-rose-200 py-1.5 text-sm">C) PASSIU CORRENT</TableCell>
                        {filteredBalanceSummaries.map(s => (
                          <TableCell key={s.year} className="text-right font-mono text-rose-200 font-bold py-1.5 text-sm">
                            {formatCurrency(s.details.pasivoCorriente)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-pc-${i}`} className="text-right py-1.5">-</TableCell>
                        ))}
                      </TableRow>

                      {/* Desglose Pasivo Corriente */}
                      {planType === 'COMPLET' && (
                        <>
                          <TableRow className="bg-rose-500/10 hover:bg-rose-500/20">
                            <TableCell className="font-semibold text-foreground pl-4 py-1 text-xs">I. Deutes a curt termini</TableCell>
                            {filteredBalanceSummaries.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(s.details.pasivoCorriente * 0.30)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-dct-${i}`} className="text-right py-1">-</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="bg-rose-500/10 hover:bg-rose-500/20">
                            <TableCell className="font-semibold text-foreground pl-4 py-1 text-xs">II. Creditors comercials</TableCell>
                            {filteredBalanceSummaries.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(s.details.pasivoCorriente * 0.70)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-cc-${i}`} className="text-right py-1">-</TableCell>
                            ))}
                          </TableRow>
                        </>
                      )}

                      {/* Total Pasivo + PN */}
                      <TableRow className="bg-blue-500/30 hover:bg-blue-500/40 border-t-2 border-blue-500">
                        <TableCell className="font-bold text-blue-200 py-2 text-sm">TOTAL PATRIMONI NET I PASSIU</TableCell>
                        {filteredBalanceSummaries.map(s => (
                          <TableCell key={s.year} className="text-right font-mono text-blue-200 font-bold py-2 text-sm">
                            {formatCurrency(s.totalEquity + s.totalLiabilities)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredBalanceSummaries.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-tpnp-${i}`} className="text-right py-2">-</TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chart Pasivo/PN */}
          <Card className="border-border/50 bg-card/90">
            <CardHeader className="py-2 px-4">
              <p className="text-xs text-center text-amber-400 font-semibold">PATRIMONI NET</p>
            </CardHeader>
            <CardContent className="p-2">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataPasivo}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        fontSize: '11px'
                      }}
                      formatter={(value: number) => [formatCurrency(value * 1000), 'Valor']}
                    />
                    <Bar dataKey="value" fill="hsl(210, 70%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-xs text-muted-foreground mt-2">
                <span className="text-amber-400">Períodes anuals</span>
              </div>
              <div className="border-t border-border/50 mt-3 pt-3 space-y-2">
                <p className="text-xs text-muted-foreground">Selecció gràfic i tipus</p>
                <Select value={chartGroupPasivo} onValueChange={setChartGroupPasivo}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Grups del Passiu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A)">Grups del Passiu</SelectItem>
                    <SelectItem value="PN">Patrimoni Net</SelectItem>
                    <SelectItem value="P-NC">Passiu No Corrent</SelectItem>
                    <SelectItem value="P-C">Passiu Corrent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={chartTypePasivo} onValueChange={(v) => setChartTypePasivo(v as ChartType)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Tipus de Gràfic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="barres">Barres</SelectItem>
                    <SelectItem value="linies">Línies</SelectItem>
                    <SelectItem value="area">Àrea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Status Bar */}
        <Card className="border-border/50 bg-card/90 print:hidden">
          <CardContent className="py-2 px-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10">
                  {company?.name || 'Empresa'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Scale className="h-3.5 w-3.5" />
                  BALANÇ DE SITUACIÓ
                </span>
                <span>Anàlisi de períodes: ANUALS</span>
                <span className={`flex items-center gap-1 ${filteredBalanceSummaries.length > 0 && filteredBalanceSummaries[0].difference === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  QUADRE DE BALANÇOS: {filteredBalanceSummaries.length > 0 && filteredBalanceSummaries[0].difference === 0 ? "'OK'" : "'DIFERÈNCIES'"}
                </span>
                <span className="flex items-center gap-1">
                  <Calculator className="h-3.5 w-3.5" />
                  Calculadora
                </span>
              </div>
              <div className="text-muted-foreground">
                {new Date().toLocaleDateString('ca-AD', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountingGroupsChart;
