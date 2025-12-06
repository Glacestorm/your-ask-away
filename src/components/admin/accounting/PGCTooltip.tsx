import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Info } from 'lucide-react';

interface CompositionItem {
  code?: string;
  description: string;
  value?: number;
}

interface PGCTooltipProps {
  children: React.ReactNode;
  title: string;
  composition: CompositionItem[];
  formatValue?: (value: number) => string;
  showThousands?: boolean;
}

// Definiciones de composición para el Balance - ACTIVO
export const ACTIVO_COMPOSITIONS: Record<string, CompositionItem[]> = {
  // ACTIVO NO CORRIENTE
  'A': [
    { code: 'I', description: 'Immobilitzat intangible' },
    { code: 'II', description: 'Immobilitzat material' },
    { code: 'III', description: 'Inversions immobiliàries' },
    { code: 'IV', description: 'Inversions en empreses del grup i associades a llarg termini' },
    { code: 'V', description: 'Inversions financeres a llarg termini' },
    { code: 'VI', description: 'Actius per impost diferit' },
  ],
  'I': [
    { code: '200', description: 'Recerca' },
    { code: '201', description: 'Desenvolupament' },
    { code: '202', description: 'Concessions administratives' },
    { code: '203', description: 'Patents, llicències, marques i similars' },
    { code: '204', description: 'Fons de comerç' },
    { code: '206', description: 'Aplicacions informàtiques' },
    { code: '209', description: 'Altre immobilitzat intangible' },
  ],
  'II': [
    { code: '210', description: 'Terrenys i construccions' },
    { code: '211', description: 'Instal·lacions tècniques i altre immobilitzat material' },
    { code: '212', description: 'Immobilitzat en curs i anticipos' },
  ],
  'III': [
    { code: '220', description: 'Terrenys' },
    { code: '221', description: 'Construccions' },
  ],
  'IV': [
    { code: '240', description: 'Instruments de patrimoni' },
    { code: '241', description: 'Crèdits a empreses' },
  ],
  'V': [
    { code: '250', description: 'Instruments de patrimoni' },
    { code: '251', description: 'Crèdits a tercers' },
    { code: '252', description: 'Altres actius financers' },
  ],
  // ACTIVO CORRIENTE
  'B': [
    { code: 'VII', description: 'Actius no corrents mantinguts per a la venda' },
    { code: 'VIII', description: 'Existències' },
    { code: 'IX', description: 'Deutors comercials i altres comptes a cobrar' },
    { code: 'X', description: 'Inversions en empreses del grup i associades a curt termini' },
    { code: 'XI', description: 'Inversions financeres a curt termini' },
    { code: 'XII', description: 'Periodificacions a curt termini' },
    { code: 'XIII', description: 'Efectiu i altres actius líquids equivalents' },
  ],
  'VIII': [
    { code: '300', description: 'Mercaderies' },
    { code: '310', description: 'Matèries primeres' },
    { code: '330', description: 'Productes en curs' },
    { code: '350', description: 'Productes acabats' },
  ],
  'IX': [
    { code: '430', description: 'Clients per vendes i prestacions de serveis' },
    { code: '431', description: 'Clients empreses del grup i associades' },
    { code: '440', description: 'Deutors diversos' },
    { code: '460', description: 'Personal' },
    { code: '470', description: 'Administracions públiques' },
  ],
  'XI': [
    { code: '540', description: 'Inversions financeres temporals' },
  ],
  'XIII': [
    { code: '570', description: 'Tresoreria' },
    { code: '571', description: 'Altres actius líquids equivalents' },
  ],
};

// Definiciones de composición para el Balance - PASIVO Y PATRIMONIO
export const PASIVO_COMPOSITIONS: Record<string, CompositionItem[]> = {
  // PATRIMONIO NETO
  'A)': [
    { code: 'A-1)', description: 'Fons propis' },
    { code: 'A-2)', description: 'Ajustos per canvis de valor' },
    { code: 'A-3)', description: 'Subvencions, donacions i llegats rebuts' },
  ],
  'A-1)': [
    { code: 'I.', description: 'Capital' },
    { code: 'II.', description: 'Prima d\'emissió' },
    { code: 'III.', description: 'Reserves' },
    { code: 'IV.', description: '(Accions i participacions en patrimoni pròpies)' },
    { code: 'V.', description: 'Resultats d\'exercicis anteriors' },
    { code: 'VI.', description: 'Altres aportacions de socis' },
    { code: 'VII.', description: 'Resultat de l\'exercici' },
    { code: 'VIII.', description: '(Dividend a compte)' },
  ],
  'I.': [
    { code: '100', description: 'Capital escripturat' },
    { code: '101', description: '(Capital no exigit)' },
  ],
  'II.': [
    { code: '110', description: 'Prima d\'emissió o assumpció' },
  ],
  'III.': [
    { code: '112', description: 'Reserva legal' },
    { code: '113', description: 'Reserves estatutàries' },
    { code: '114', description: 'Altres reserves' },
  ],
  'V.': [
    { code: '120', description: 'Romanent' },
    { code: '121', description: '(Resultats negatius d\'exercicis anteriors)' },
  ],
  'VII.': [
    { code: '129', description: 'Resultat de l\'exercici' },
  ],
  // PASIVO NO CORRIENTE
  'B)': [
    { code: 'I..', description: 'Provisions a llarg termini' },
    { code: 'II..', description: 'Deutes a llarg termini' },
    { code: 'III..', description: 'Deutes amb empreses del grup i associades a llarg termini' },
    { code: 'IV..', description: 'Passius per impost diferit' },
    { code: 'V..', description: 'Periodificacions a llarg termini' },
  ],
  'I..': [
    { code: '140', description: 'Provisions per a pensions' },
    { code: '141', description: 'Provisions per a impostos' },
  ],
  'II..': [
    { code: '170', description: 'Deutes amb entitats de crèdit' },
    { code: '171', description: 'Acreedors per arrendament financer' },
    { code: '172', description: 'Altres deutes a llarg termini' },
  ],
  // PASIVO CORRIENTE
  'C)': [
    { code: 'VI..', description: 'Passius vinculats amb actius no corrents mantinguts per a la venda' },
    { code: 'VII..', description: 'Provisions a curt termini' },
    { code: 'VIII..', description: 'Deutes a curt termini' },
    { code: 'IX..', description: 'Deutes amb empreses del grup i associades a curt termini' },
    { code: 'X..', description: 'Creditors comercials i altres comptes a pagar' },
    { code: 'XI..', description: 'Periodificacions a curt termini' },
  ],
  'VIII..': [
    { code: '520', description: 'Deutes a curt termini amb entitats de crèdit' },
    { code: '521', description: 'Acreedors per arrendament financer a curt termini' },
    { code: '522', description: 'Altres deutes a curt termini' },
  ],
  'X..': [
    { code: '400', description: 'Proveïdors' },
    { code: '401', description: 'Proveïdors, empreses del grup i associades' },
    { code: '410', description: 'Creditors diversos' },
    { code: '465', description: 'Remuneracions pendents de pagament' },
    { code: '475', description: 'Administracions públiques' },
    { code: '476', description: 'Anticipos de clients' },
  ],
};

// Definiciones de composición para la Cuenta de Resultados
export const INCOME_COMPOSITIONS: Record<string, CompositionItem[]> = {
  // INGRESOS DE EXPLOTACIÓN
  'netTurnover': [
    { description: 'Vendes de mercaderies' },
    { description: 'Prestacions de serveis' },
    { description: 'Devolucions i ràpels sobre vendes' },
  ],
  'otherOperatingIncome': [
    { description: 'Ingressos accessoris i altres de gestió corrent' },
    { description: 'Subvencions d\'explotació incorporades al resultat de l\'exercici' },
  ],
  // GASTOS DE EXPLOTACIÓN
  'supplies': [
    { description: 'Consum de mercaderies' },
    { description: 'Consum de matèries primeres i altres materials consumibles' },
    { description: 'Treballs realitzats per altres empreses' },
    { description: 'Deteriorament de mercaderies, matèries primeres i altres aprovisionaments' },
  ],
  'personnelExpenses': [
    { description: 'Sous i salaris' },
    { description: 'Càrregues socials' },
    { description: 'Provisions' },
  ],
  'otherOperatingExpenses': [
    { description: 'Serveis exteriors' },
    { description: 'Tributs' },
    { description: 'Pèrdues, deteriorament i variació de provisions per operacions comercials' },
    { description: 'Altres despeses de gestió corrent' },
  ],
  'depreciation': [
    { description: 'Amortització de l\'immobilitzat intangible' },
    { description: 'Amortització de l\'immobilitzat material' },
    { description: 'Amortització de les inversions immobiliàries' },
  ],
  'grantImputation': [
    { description: 'Subvencions, donacions i llegats de capital traspassats al resultat de l\'exercici' },
    { description: 'Altres subvencions, donacions i llegats traspassats al resultat de l\'exercici' },
  ],
  'excessProvisions': [
    { description: 'Provisions per a operacions comercials' },
    { description: 'Altres provisions' },
  ],
  'impairmentDisposals': [
    { description: 'Deteriorament i pèrdues' },
    { description: 'Resultats per alienacions i altres' },
    { description: 'Deteriorament de l\'immobilitzat intangible' },
    { description: 'Deteriorament de l\'immobilitzat material' },
    { description: 'Deteriorament de les inversions immobiliàries' },
  ],
  'operatingResult': [
    { description: 'Import net de la xifra de negocis' },
    { description: 'Variació d\'existències de productes acabats i en curs' },
    { description: 'Treballs realitzats per l\'empresa per al seu actiu' },
    { description: 'Aprovisionaments' },
    { description: 'Altres ingressos d\'explotació' },
    { description: 'Despeses de personal' },
    { description: 'Altres despeses d\'explotació' },
    { description: 'Amortització de l\'immobilitzat' },
    { description: 'Imputació de subvencions d\'immobilitzat no financer i altres' },
    { description: 'Excessos de provisions' },
    { description: 'Deteriorament i resultat per alienacions de l\'immobilitzat' },
  ],
  // RESULTADOS FINANCIEROS
  'financialIncome': [
    { description: 'De participacions en instruments de patrimoni' },
    { description: 'De valors negociables i altres instruments financers' },
    { description: 'Ingressos d\'empreses del grup i associades' },
    { description: 'Ingressos de tercers' },
  ],
  'financialExpenses': [
    { description: 'Per deutes amb empreses del grup i associades' },
    { description: 'Per deutes amb tercers' },
    { description: 'Per actualització de provisions' },
  ],
  'exchangeDifferences': [
    { description: 'Diferències de canvi positives' },
    { description: 'Diferències de canvi negatives' },
  ],
  'impairmentFinancial': [
    { description: 'Deterioraments en instruments de patrimoni' },
    { description: 'Deterioraments en valors representatius de deute' },
    { description: 'Deterioraments en crèdits' },
    { description: 'Resultats per alienacions i altres' },
  ],
  'financialResult': [
    { description: 'Ingressos financers' },
    { description: 'Despeses financeres' },
    { description: 'Variació de valor raonable en instruments financers' },
    { description: 'Diferències de canvi' },
    { description: 'Deteriorament i resultat per alienacions d\'instruments financers' },
  ],
  // RESULTADOS
  'resultBeforeTax': [
    { description: 'Resultat d\'explotació' },
    { description: 'Resultat financer' },
  ],
  'corporateTax': [
    { description: 'Impost corrent' },
    { description: 'Impost diferit' },
  ],
  'netResult': [
    { description: 'Resultat abans d\'impostos' },
    { description: 'Impost sobre societats' },
  ],
};

// Composiciones simplificadas para Plan Simplificado
export const ACTIVO_COMPOSITIONS_SIMPLIFIED: Record<string, CompositionItem[]> = {
  'A': [
    { description: 'Immobilitzat' },
    { description: 'Inversions financeres a llarg termini' },
  ],
  'B': [
    { description: 'Existències' },
    { description: 'Realitzable' },
    { description: 'Disponible' },
  ],
};

export const PASIVO_COMPOSITIONS_SIMPLIFIED: Record<string, CompositionItem[]> = {
  'A)': [
    { description: 'Fons propis' },
    { description: 'Subvencions, donacions i llegats rebuts' },
  ],
  'B)': [
    { description: 'Provisions a llarg termini' },
    { description: 'Deutes a llarg termini' },
  ],
  'C)': [
    { description: 'Provisions a curt termini' },
    { description: 'Deutes a curt termini' },
    { description: 'Creditors comercials' },
  ],
};

export const INCOME_COMPOSITIONS_SIMPLIFIED: Record<string, CompositionItem[]> = {
  'netTurnover': [
    { description: 'Vendes' },
    { description: 'Prestacions de serveis' },
  ],
  'supplies': [
    { description: 'Compres' },
    { description: 'Treballs realitzats per altres empreses' },
  ],
  'personnelExpenses': [
    { description: 'Sous i salaris' },
    { description: 'Seguretat social' },
  ],
  'depreciation': [
    { description: 'Amortitzacions' },
  ],
  'operatingResult': [
    { description: 'Ingressos d\'explotació' },
    { description: 'Despeses d\'explotació' },
  ],
  'financialResult': [
    { description: 'Ingressos financers' },
    { description: 'Despeses financeres' },
  ],
  'netResult': [
    { description: 'Resultat d\'explotació' },
    { description: 'Resultat financer' },
    { description: 'Impost sobre societats' },
  ],
};

export const PGCTooltip = ({ children, title, composition, formatValue, showThousands = true }: PGCTooltipProps) => {
  if (!composition || composition.length === 0) {
    return <>{children}</>;
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span className="cursor-help inline-flex items-center gap-1 hover:text-primary transition-colors">
          {children}
          <Info className="h-3 w-3 text-blue-500 opacity-60" />
        </span>
      </HoverCardTrigger>
      <HoverCardContent 
        side="top" 
        align="start" 
        className="w-auto max-w-md p-3 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 shadow-lg z-[100]"
        sideOffset={5}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm border-b border-amber-200 dark:border-amber-700 pb-2">
            <Info className="h-4 w-4" />
            <span>Composició i desglossament: {title}</span>
          </div>
          <ul className="space-y-1 text-xs">
            {composition.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-foreground">
                <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                <span className="flex-1">
                  {item.code && <span className="font-medium text-muted-foreground">{item.code}: </span>}
                  {item.description}
                  {item.value !== undefined && formatValue && (
                    <span className="ml-2 text-muted-foreground font-mono">
                      {formatValue(showThousands ? item.value / 1000 : item.value)} u.m.
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

// Función helper para obtener la composición según el tipo de plan
export const getComposition = (
  code: string, 
  type: 'activo' | 'pasivo' | 'income',
  planType: 'COMPLET' | 'SIMPLIFICAT' | 'ABREUJAT'
): CompositionItem[] => {
  const isSimplified = planType === 'SIMPLIFICAT' || planType === 'ABREUJAT';
  
  switch (type) {
    case 'activo':
      return isSimplified 
        ? (ACTIVO_COMPOSITIONS_SIMPLIFIED[code] || ACTIVO_COMPOSITIONS[code] || [])
        : (ACTIVO_COMPOSITIONS[code] || []);
    case 'pasivo':
      return isSimplified 
        ? (PASIVO_COMPOSITIONS_SIMPLIFIED[code] || PASIVO_COMPOSITIONS[code] || [])
        : (PASIVO_COMPOSITIONS[code] || []);
    case 'income':
      return isSimplified 
        ? (INCOME_COMPOSITIONS_SIMPLIFIED[code] || INCOME_COMPOSITIONS[code] || [])
        : (INCOME_COMPOSITIONS[code] || []);
    default:
      return [];
  }
};

export default PGCTooltip;
