import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const balanceSheetFields = [
  { field: 'intangible_assets', label: 'Immobilitzat intangible', keywords: ['immobilitzat intangible', 'activos intangibles'] },
  { field: 'tangible_assets', label: 'Immobilitzat material', keywords: ['immobilitzat material', 'inmovilizado material'] },
  { field: 'inventory', label: 'Existències', keywords: ['existències', 'existencias', 'inventory'] },
  { field: 'trade_receivables', label: 'Deutors comercials', keywords: ['deutors comercials', 'clientes'] },
  { field: 'cash_equivalents', label: 'Efectiu i equivalents', keywords: ['efectiu', 'caixa', 'efectivo'] },
  { field: 'share_capital', label: 'Capital social', keywords: ['capital social'] },
  { field: 'legal_reserve', label: 'Reserva legal', keywords: ['reserva legal'] },
  { field: 'retained_earnings', label: 'Resultats d\'exercicis anteriors', keywords: ['resultats exercicis anteriors'] },
  { field: 'current_year_result', label: 'Resultat de l\'exercici', keywords: ['resultat exercici'] },
  { field: 'long_term_debts', label: 'Deutes a llarg termini', keywords: ['deutes llarg termini'] },
  { field: 'short_term_debts', label: 'Deutes a curt termini', keywords: ['deutes curt termini'] },
  { field: 'trade_payables', label: 'Creditors comercials', keywords: ['creditors comercials', 'proveedores'] },
];

const incomeStatementFields = [
  { field: 'net_turnover', label: 'Xifra de negocis', keywords: ['xifra de negocis', 'cifra de negocios', 'ingresos', 'ventas'] },
  { field: 'supplies', label: 'Aprovisionaments', keywords: ['aprovisionaments', 'aprovisionamientos', 'compras'] },
  { field: 'personnel_expenses', label: 'Despeses de personal', keywords: ['despeses personal', 'gastos personal'] },
  { field: 'depreciation', label: 'Amortització', keywords: ['amortització', 'amortización', 'depreciation'] },
  { field: 'financial_income', label: 'Ingressos financers', keywords: ['ingressos financers'] },
  { field: 'financial_expenses', label: 'Despeses financeres', keywords: ['despeses financeres'] },
  { field: 'corporate_tax', label: 'Impost sobre beneficis', keywords: ['impost beneficis', 'impuesto sociedades'] },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfContent, companyName, fiscalYear, statementId } = await req.json();
    
    if (!pdfContent) {
      throw new Error('No PDF content provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Parsing financial PDF for ${companyName}, year ${fiscalYear}`);

    const fieldsList = [
      ...balanceSheetFields.map(f => `- ${f.label} (${f.field})`),
      ...incomeStatementFields.map(f => `- ${f.label} (${f.field})`)
    ].join('\n');

    const systemPrompt = `Ets un expert en comptabilitat segons el Pla General de Comptabilitat d'Andorra (PGC).
La teva tasca és extreure valors numèrics d'un document de comptes anuals en PDF.

Has d'identificar i extreure els següents camps:
${fieldsList}

INSTRUCCIONS:
1. Cerca cada camp en el document
2. Extreu el valor numèric corresponent (sense símbols de moneda)
3. Els valors han de ser en euros
4. Si un camp no es troba, no l'incloguis
5. Retorna NOMÉS un JSON vàlid

FORMAT DE RESPOSTA:
{
  "mappedFields": [
    {
      "field": "nom_del_camp",
      "label": "Etiqueta descriptiva",
      "value": 12345.67,
      "confidence": 0.95
    }
  ]
}`;

    const userPrompt = `Analitza aquest document de comptes anuals de l'empresa "${companyName}" per a l'exercici ${fiscalYear}.

Extreu tots els valors numèrics que puguis identificar dels estats financers.

Document PDF (contingut base64):
${pdfContent.substring(0, 50000)}

Retorna un JSON amb els camps trobats.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';
    
    console.log('AI Response received, parsing...');

    let extractedData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return new Response(JSON.stringify({ 
        mappedFields: [],
        message: 'No s\'han pogut extreure dades del document' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mappedFields = (extractedData.mappedFields || [])
      .filter((f: { field: string; value: number; confidence: number }) => 
        f.field && 
        typeof f.value === 'number' && 
        !isNaN(f.value) &&
        f.confidence >= 0.5
      )
      .map((f: { field: string; label?: string; value: number; confidence: number }) => {
        const balanceField = balanceSheetFields.find(bf => bf.field === f.field);
        const incomeField = incomeStatementFields.find(inf => inf.field === f.field);
        
        return {
          field: balanceField ? `balance_${f.field}` : incomeField ? `income_${f.field}` : f.field,
          label: f.label || balanceField?.label || incomeField?.label || f.field,
          value: f.value,
          confidence: f.confidence
        };
      });

    console.log(`Extracted ${mappedFields.length} fields`);

    return new Response(JSON.stringify({ 
      mappedFields,
      message: `S'han extret ${mappedFields.length} camps del document`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-financial-pdf:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      mappedFields: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
