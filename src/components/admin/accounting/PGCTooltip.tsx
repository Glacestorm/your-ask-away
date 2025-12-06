import React from 'react';
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
    { code: '203', description: 'Patents, llicencies, marques i similars' },
    { code: '204', description: 'Fons de comerc' },
    { code: '206', description: 'Aplicacions informatiques' },
    { code: '209', description: 'Altre immobilitzat intangible' },
  ],
  'II': [
    { code: '210', description: 'Terrenys i construccions' },
    { code: '211', description: 'Installacions tecniques i altre immobilitzat material' },
    { code: '212', description: 'Immobilitzat en curs i anticipos' },
  ],
  'III': [
    { code: '220', description: 'Terrenys' },
    { code: '221', description: 'Construccions' },
  ],
  'IV': [
    { code: '240', description: 'Instruments de patrimoni' },
    { code: '241', description: 'Credits a empreses' },
  ],
  'V': [
    { code: '250', description: 'Instruments de patrimoni' },
    { code: '251', description: 'Credits a tercers' },
    { code: '252', description: 'Altres actius financers' },
  ],
  'B': [
    { code: 'VII', description: 'Actius no corrents mantinguts per a la venda' },
    { code: 'VIII', description: 'Existencies' },
    { code: 'IX', description: 'Deutors comercials i altres comptes a cobrar' },
    { code: 'X', description: 'Inversions en empreses del grup i associades a curt termini' },
    { code: 'XI', description: 'Inversions financeres a curt termini' },
    { code: 'XII', description: 'Periodificacions a curt termini' },
    { code: 'XIII', description: 'Efectiu i altres actius liquids equivalents' },
  ],
  'VIII': [
    { code: '300', description: 'Mercaderies' },
    { code: '310', description: 'Materies primeres' },
    { code: '330', description: 'Productes en curs' },
    { code: '350', description: 'Productes acabats' },
  ],
  'IX': [
    { code: '430', description: 'Clients per vendes i prestacions de serveis' },
    { code: '431', description: 'Clients empreses del grup i associades' },
    { code: '440', description: 'Deutors diversos' },
    { code: '460', description: 'Personal' },
    { code: '470', description: 'Administracions publiques' },
  ],
  'XI': [
    { code: '540', description: 'Inversions financeres temporals' },
  ],
  'XIII': [
    { code: '570', description: 'Tresoreria' },
    { code: '571', description: 'Altres actius liquids equivalents' },
  ],
};

// Definiciones de composicion para el Balance - PASIVO Y PATRIMONIO
export const PASIVO_COMPOSITIONS: Record<string, CompositionItem[]> = {
  'A)': [
    { code: 'A-1)', description: 'Fons propis' },
    { code: 'A-2)', description: 'Ajustos per canvis de valor' },
    { code: 'A-3)', description: 'Subvencions, donacions i llegats rebuts' },
  ],
  'A-1)': [
    { code: 'I.', description: 'Capital' },
    { code: 'II.', description: 'Prima d emissio' },
    { code: 'III.', description: 'Reserves' },
    { code: 'IV.', description: '(Accions i participacions en patrimoni propies)' },
    { code: 'V.', description: 'Resultats d exercicis anteriors' },
    { code: 'VI.', description: 'Altres aportacions de socis' },
    { code: 'VII.', description: 'Resultat de l exercici' },
    { code: 'VIII.', description: '(Dividend a compte)' },
  ],
  'B)': [
    { code: 'I..', description: 'Provisions a llarg termini' },
    { code: 'II..', description: 'Deutes a llarg termini' },
    { code: 'III..', description: 'Deutes amb empreses del grup i associades a llarg termini' },
    { code: 'IV..', description: 'Passius per impost diferit' },
    { code: 'V..', description: 'Periodificacions a llarg termini' },
  ],
  'C)': [
    { code: 'VI..', description: 'Passius vinculats amb actius no corrents mantinguts per a la venda' },
    { code: 'VII..', description: 'Provisions a curt termini' },
    { code: 'VIII..', description: 'Deutes a curt termini' },
    { code: 'IX..', description: 'Deutes amb empreses del grup i associades a curt termini' },
    { code: 'X..', description: 'Creditors comercials i altres comptes a pagar' },
    { code: 'XI..', description: 'Periodificacions a curt termini' },
  ],
};

// Definiciones de composicion para la Cuenta de Resultados
export const INCOME_COMPOSITIONS: Record<string, CompositionItem[]> = {
  'netTurnover': [
    { description: 'Vendes de mercaderies' },
    { description: 'Prestacions de serveis' },
    { description: 'Devolucions i rapels sobre vendes' },
  ],
  'supplies': [
    { description: 'Consum de mercaderies' },
    { description: 'Consum de materies primeres i altres materials consumibles' },
    { description: 'Treballs realitzats per altres empreses' },
  ],
  'personnelExpenses': [
    { description: 'Sous i salaris' },
    { description: 'Carregues socials' },
    { description: 'Provisions' },
  ],
  'depreciation': [
    { description: 'Amortitzacio de l immobilitzat intangible' },
    { description: 'Amortitzacio de l immobilitzat material' },
    { description: 'Amortitzacio de les inversions immobiliaries' },
  ],
  'operatingResult': [
    { description: 'Import net de la xifra de negocis' },
    { description: 'Aprovisionaments' },
    { description: 'Despeses de personal' },
    { description: 'Amortitzacio de l immobilitzat' },
  ],
  'financialIncome': [
    { description: 'De participacions en instruments de patrimoni' },
    { description: 'De valors negociables i altres instruments financers' },
  ],
  'financialExpenses': [
    { description: 'Per deutes amb empreses del grup i associades' },
    { description: 'Per deutes amb tercers' },
  ],
  'financialResult': [
    { description: 'Ingressos financers' },
    { description: 'Despeses financeres' },
    { description: 'Diferencies de canvi' },
  ],
  'resultBeforeTax': [
    { description: 'Resultat d explotacio' },
    { description: 'Resultat financer' },
  ],
  'netResult': [
    { description: 'Resultat abans d impostos' },
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
    { description: 'Existencies' },
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
    { description: 'Ingressos d explotacio' },
    { description: 'Despeses d explotacio' },
  ],
  'financialResult': [
    { description: 'Ingressos financers' },
    { description: 'Despeses financeres' },
  ],
  'netResult': [
    { description: 'Resultat d explotacio' },
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
            <span>Composicio i desglossament: {title}</span>
          </div>
          <ul className="space-y-1 text-xs">
            {composition.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-foreground">
                <span className="text-amber-600 dark:text-amber-400 mt-0.5">*</span>
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

// Funcion helper para obtener la composicion segun el tipo de plan
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
