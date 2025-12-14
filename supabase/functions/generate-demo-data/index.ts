import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Demo data generators
const generateCompanyNames = (): string[] => [
  "DEMO_Inmobiliaria Andorrana SL",
  "DEMO_Gestió Patrimonial SA",
  "DEMO_Turisme Vallnord SL",
  "DEMO_Construccions Pirineus SA",
  "DEMO_Hotel Grandvalira SL",
  "DEMO_Assegurances Escaldes SA",
  "DEMO_Tecnologies Andorra SL",
  "DEMO_Farmàcia Central SA",
  "DEMO_Restaurant La Massana SL",
  "DEMO_Joieria Andorrana SA",
  "DEMO_Esports d'Hivern SL",
  "DEMO_Consultoria Fiscal SA",
  "DEMO_Clínica Dental Andorra SL",
  "DEMO_Mobiliari Modern SA",
  "DEMO_Supermercats Pyrenees SL",
  "DEMO_Agència de Viatges SA",
  "DEMO_Centre Wellness SL",
  "DEMO_Electrònica i Més SA",
  "DEMO_Moda i Complements SL",
  "DEMO_Serveis Financers SA",
  "DEMO_Arquitectura i Disseny SL",
  "DEMO_Transport Logístic SA",
  "DEMO_Alimentació Gourmet SL",
  "DEMO_Energia Renovable SA",
  "DEMO_Publicitat i Màrqueting SL",
  "DEMO_Assessoria Legal SA",
  "DEMO_Formació Professional SL",
  "DEMO_Automoció Andorra SA",
  "DEMO_Jardineria i Paisatgisme SL",
  "DEMO_Seguretat Privada SA",
  "DEMO_Perruqueria i Estètica SL",
  "DEMO_Papereria i Oficina SA",
  "DEMO_Óptica Visual SL",
  "DEMO_Veterinària Andorra SA",
  "DEMO_Floristeria Natura SL",
  "DEMO_Cafeteria Aroma SA",
  "DEMO_Ferreteria Industrial SL",
  "DEMO_Tèxtil i Confecció SA",
  "DEMO_Impremta Digital SL",
  "DEMO_Música i Instruments SA",
  "DEMO_Fotografia Professional SL",
  "DEMO_Decoració Interior SA",
  "DEMO_Bricolatge i Llar SL",
  "DEMO_Rellotgeria Luxe SA",
  "DEMO_Òptica i Audiologia SL",
  "DEMO_Laboratori Anàlisis SA",
  "DEMO_Fisioteràpia Salut SL",
  "DEMO_Notaria Andorra SA",
  "DEMO_Gestoria Administrativa SL",
  "DEMO_Immobiliària Premium SA"
];

const addresses = [
  { address: "Avinguda Meritxell 45, Andorra la Vella", lat: 42.5078, lng: 1.5211, parroquia: "Andorra la Vella" },
  { address: "Carrer Major 12, Escaldes-Engordany", lat: 42.5103, lng: 1.5347, parroquia: "Escaldes-Engordany" },
  { address: "Plaça del Poble 8, La Massana", lat: 42.5459, lng: 1.5147, parroquia: "La Massana" },
  { address: "Carrer de la Unió 23, Sant Julià de Lòria", lat: 42.4636, lng: 1.4917, parroquia: "Sant Julià de Lòria" },
  { address: "Avinguda del Pessebre 5, Encamp", lat: 42.5347, lng: 1.5803, parroquia: "Encamp" },
  { address: "Carrer dels Cavallers 18, Ordino", lat: 42.5567, lng: 1.5333, parroquia: "Ordino" },
  { address: "Plaça Major 3, Canillo", lat: 42.5678, lng: 1.5978, parroquia: "Canillo" },
  { address: "Carrer Prat de la Creu 15, Andorra la Vella", lat: 42.5064, lng: 1.5247, parroquia: "Andorra la Vella" },
  { address: "Avinguda Carlemany 67, Escaldes-Engordany", lat: 42.5089, lng: 1.5389, parroquia: "Escaldes-Engordany" },
  { address: "Carrer de Sant Antoni 9, La Massana", lat: 42.5478, lng: 1.5178, parroquia: "La Massana" },
];

const cnaes = ["6419", "6920", "7022", "4110", "5510", "6512", "6201", "4773", "5610", "4777"];
const sectors = ["Banca", "Serveis", "Comerç", "Construcció", "Turisme", "Tecnologia", "Salut", "Alimentació"];
const legalForms = ["SL", "SA", "SLU", "SAU"];
const clientTypes = ["cliente", "potencial_cliente"];
const bankNames = ["Creand", "MoraBanc", "Andbank", "Credit Andorrà"];

const generateRandomDate = (daysBack: number, daysForward: number = 0): string => {
  const now = new Date();
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const future = new Date(now.getTime() + daysForward * 24 * 60 * 60 * 1000);
  const random = new Date(past.getTime() + Math.random() * (future.getTime() - past.getTime()));
  return random.toISOString();
};

const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDecimal = (min: number, max: number): number => Math.random() * (max - min) + min;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { role, sessionId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const dataIds: Record<string, string[]> = {
      companies: [],
      visits: [],
      goals: [],
      contacts: [],
      products: [],
      notifications: [],
      visitSheets: [],
      financialStatements: [],
      balanceSheets: [],
      incomeStatements: [],
      opportunities: [],
      companyProducts: [],
      bankAffiliations: [],
      actionPlans: [],
      bestPractices: [],
      alerts: [],
    };

    console.log(`Generating comprehensive demo data for role: ${role}, session: ${sessionId}`);

    // 1. Create demo user profile
    const demoEmail = `demo_${sessionId.slice(0, 8)}@obelixia.demo`;
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: demoEmail,
      password: `Demo${sessionId.slice(0, 8)}!`,
      email_confirm: true,
      user_metadata: { is_demo: true, demo_session: sessionId }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      throw authError;
    }

    const demoUserId = authUser.user.id;

    // 2. Create profile
    await supabase.from('profiles').insert({
      id: demoUserId,
      email: demoEmail,
      first_name: 'Usuario',
      last_name: 'Demo',
      oficina: 'Andorra la Vella',
      is_active: true
    });

    // 3. Assign role
    await supabase.from('user_roles').insert({
      user_id: demoUserId,
      role: role
    });

    // 4. Get existing status colors and products
    const { data: statusColors } = await supabase.from('status_colors').select('id').limit(5);
    const statusIds = statusColors?.map(s => s.id) || [];
    
    const { data: existingProducts } = await supabase.from('products').select('id').limit(10);
    const productIds = existingProducts?.map(p => p.id) || [];

    // 5. Generate 50 companies with all fields
    const companyNames = generateCompanyNames();
    const companiesData = companyNames.map((name, idx) => {
      const addr = addresses[idx % addresses.length];
      return {
        name,
        address: addr.address,
        latitude: addr.lat + (Math.random() - 0.5) * 0.02,
        longitude: addr.lng + (Math.random() - 0.5) * 0.02,
        parroquia: addr.parroquia,
        gestor_id: demoUserId,
        status_id: statusIds.length > 0 ? randomElement(statusIds) : null,
        cnae: randomElement(cnaes),
        sector: randomElement(sectors),
        legal_form: randomElement(legalForms),
        client_type: randomElement(clientTypes),
        employees: randomNumber(1, 500),
        turnover: randomNumber(50000, 5000000),
        facturacion_anual: randomNumber(100000, 10000000),
        beneficios: randomNumber(-50000, 500000),
        ingresos_creand: randomNumber(5000, 200000),
        vinculacion_entidad_1: randomNumber(0, 100),
        vinculacion_entidad_2: randomNumber(0, 100),
        vinculacion_entidad_3: randomNumber(0, 100),
        vinculacion_modo: randomElement(['manual', 'automatica']),
        pl_banco: randomNumber(1000, 100000),
        bp: `AD${randomNumber(10, 99)}${randomNumber(1000, 9999)}${randomNumber(100000000000, 999999999999)}`,
        email: `contacto@${name.toLowerCase().replace(/demo_/i, '').replace(/\s+/g, '').slice(0, 15)}.ad`,
        phone: `+376 ${randomNumber(300000, 899999)}`,
        website: `https://www.${name.toLowerCase().replace(/demo_/i, '').replace(/\s+/g, '').slice(0, 10)}.ad`,
        tax_id: `A${randomNumber(10000000, 99999999)}`,
        registration_number: `RM-${randomNumber(1000, 9999)}-AD`,
        fecha_ultima_visita: generateRandomDate(180, 0).split('T')[0],
        is_vip: Math.random() > 0.8,
        vip_notes: Math.random() > 0.8 ? 'Cliente VIP con prioridad alta' : null,
        observaciones: 'Empresa generada para demostración del sistema ObelixIA',
        tags: ['demo', randomElement(['prioritario', 'potencial', 'activo', 'seguimiento'])]
      };
    });

    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .insert(companiesData)
      .select('id');

    if (companyError) {
      console.error('Company creation error:', companyError);
      throw companyError;
    }

    dataIds.companies = companies?.map(c => c.id) || [];
    console.log(`Created ${dataIds.companies.length} companies`);

    // 6. Generate contacts (2-3 per company)
    const contactsData: any[] = [];
    const positions = ['Director General', 'Director Financer', 'Gerent', 'Responsable Comercial', 'Administrador', 'CFO', 'CEO', 'COO'];
    const firstNames = ['Joan', 'Maria', 'Pere', 'Anna', 'Marc', 'Laia', 'Carles', 'Núria', 'David', 'Laura'];
    const lastNames = ['García', 'Martínez', 'López', 'Fernández', 'González', 'Rodríguez', 'Sánchez', 'Pérez'];
    
    for (const companyId of dataIds.companies) {
      const numContacts = randomNumber(2, 4);
      for (let i = 0; i < numContacts; i++) {
        const firstName = randomElement(firstNames);
        const lastName = randomElement(lastNames);
        contactsData.push({
          company_id: companyId,
          contact_name: `DEMO_${firstName} ${lastName}`,
          position: randomElement(positions),
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@demo.ad`,
          phone: `+376 ${randomNumber(300000, 899999)}`,
          is_primary: i === 0,
          notes: i === 0 ? 'Contacto principal de la empresa' : null
        });
      }
    }

    const { data: contacts } = await supabase.from('company_contacts').insert(contactsData).select('id');
    dataIds.contacts = contacts?.map(c => c.id) || [];
    console.log(`Created ${dataIds.contacts.length} contacts`);

    // 7. Generate bank affiliations for each company
    const bankAffiliationsData: any[] = [];
    for (const companyId of dataIds.companies) {
      const numBanks = randomNumber(1, 4);
      let totalPercentage = 100;
      for (let i = 0; i < numBanks && totalPercentage > 0; i++) {
        const percentage = i === numBanks - 1 ? totalPercentage : randomNumber(10, Math.min(60, totalPercentage - 10));
        totalPercentage -= percentage;
        bankAffiliationsData.push({
          company_id: companyId,
          bank_name: bankNames[i % bankNames.length],
          bank_code: `B${randomNumber(100, 999)}`,
          affiliation_percentage: percentage,
          affiliation_type: randomElement(['Principal', 'Secundario', 'Operativo']),
          is_primary: i === 0,
          priority_order: i + 1,
          active: true,
          notes: i === 0 ? 'Banco principal de operaciones' : null
        });
      }
    }

    const { data: bankAffiliations } = await supabase.from('company_bank_affiliations').insert(bankAffiliationsData).select('id');
    dataIds.bankAffiliations = bankAffiliations?.map(b => b.id) || [];
    console.log(`Created ${dataIds.bankAffiliations.length} bank affiliations`);

    // 8. Assign products to companies
    if (productIds.length > 0) {
      const companyProductsData: any[] = [];
      for (const companyId of dataIds.companies) {
        const numProducts = randomNumber(1, Math.min(5, productIds.length));
        const selectedProducts = [...productIds].sort(() => Math.random() - 0.5).slice(0, numProducts);
        for (const productId of selectedProducts) {
          companyProductsData.push({
            company_id: companyId,
            product_id: productId,
            active: Math.random() > 0.1,
            contract_date: generateRandomDate(365, 0).split('T')[0]
          });
        }
      }
      const { data: companyProducts } = await supabase.from('company_products').insert(companyProductsData).select('id');
      dataIds.companyProducts = companyProducts?.map(cp => cp.id) || [];
      console.log(`Created ${dataIds.companyProducts.length} company-product assignments`);
    }

    // 9. Generate 150 visits with detailed data - ALL fields populated
    const visitTypes = ['commercial', 'follow_up', 'presentation', 'negotiation', 'closing', 'support', 'onboarding'];
    const visitResults = ['positive', 'neutral', 'negative', 'pending'];
    const visitsData: any[] = [];

    for (let i = 0; i < 150; i++) {
      const companyId = randomElement(dataIds.companies);
      const visitDate = generateRandomDate(180, 60);
      const isPast = new Date(visitDate) < new Date();
      const status = isPast ? (Math.random() > 0.15 ? 'completed' : 'cancelled') : 'scheduled';
      const startHour = randomNumber(8, 18);
      const durationMins = randomNumber(30, 180);
      
      visitsData.push({
        company_id: companyId,
        gestor_id: demoUserId,
        visit_date: visitDate,
        visit_type: randomElement(visitTypes),
        status: status,
        result: status === 'completed' ? randomElement(visitResults) : null,
        notes: `DEMO - Visita de demostración ${i + 1}. ${randomElement([
          'Reunión muy productiva con el equipo directivo de la empresa.',
          'Presentación de nuevos productos financieros y servicios bancarios.',
          'Seguimiento comercial del último trimestre con análisis detallado.',
          'Negociación de condiciones especiales para cliente VIP.',
          'Primera visita de prospección a potencial cliente.',
          'Revisión de cartera y propuesta de optimización.',
          'Cierre de operación de financiación importante.',
          'Onboarding de nuevo cliente con configuración de servicios.'
        ])}`,
        objectives: `DEMO - Objetivos principales: ${randomElement([
          '1) Presentar nuevos productos de inversión 2) Revisar condiciones actuales 3) Identificar oportunidades de cross-selling',
          '1) Revisar cartera de productos 2) Proponer mejoras en condiciones 3) Agendar próxima reunión',
          '1) Negociar condiciones de financiación 2) Cerrar operación pendiente 3) Fidelizar cliente',
          '1) Analizar necesidades del cliente 2) Preparar propuesta personalizada 3) Definir plan de acción',
          '1) Seguimiento de propuesta enviada 2) Resolver dudas 3) Avanzar hacia el cierre'
        ])}`,
        duration_minutes: durationMins,
        location: randomElement(['Oficina cliente', 'Oficina banco', 'Videoconferencia', 'Restaurante de negocios', 'Sala de reuniones'])
      });
    }

    const { data: visits } = await supabase.from('visits').insert(visitsData).select('id, status');
    dataIds.visits = visits?.map(v => v.id) || [];
    console.log(`Created ${dataIds.visits.length} visits`);

    // 10. Generate detailed visit sheets for completed visits
    const completedVisitIds = visits?.filter(v => v.status === 'completed').map(v => v.id).slice(0, 60) || [];
    const visitSheetsData = completedVisitIds.map((visitId, idx) => ({
      visit_id: visitId,
      gestor_id: demoUserId,
      summary: `DEMO - Resumen visita #${idx + 1}: ${randomElement([
        'Reunión muy productiva con el equipo directivo.',
        'Cliente interesado en ampliar productos contratados.',
        'Se revisaron las condiciones actuales y se propusieron mejoras.',
        'Presentación de nuevas soluciones de inversión.',
        'Seguimiento de operación en curso con buenas perspectivas.'
      ])}`,
      action_items: [
        randomElement(['Enviar propuesta comercial', 'Preparar simulación de inversión', 'Solicitar documentación adicional']),
        randomElement(['Agendar siguiente reunión', 'Coordinar con departamento de riesgos', 'Revisar límites de crédito']),
        randomElement(['Actualizar CRM', 'Informar a dirección', 'Preparar contrato'])
      ],
      next_steps: randomElement([
        'Enviar propuesta formal antes del viernes',
        'Agendar reunión de seguimiento en 2 semanas',
        'Esperar respuesta del comité de riesgos',
        'Preparar presentación para el consejo'
      ]),
      client_feedback: randomElement([
        'El cliente mostró alto interés en nuestras propuestas',
        'Feedback positivo sobre el servicio recibido',
        'Algunas reservas sobre las condiciones, pero abierto a negociar',
        'Muy satisfecho con la atención personalizada',
        'Requiere más tiempo para evaluar las opciones'
      ]),
      opportunities_identified: [
        randomElement(['Nueva línea de crédito', 'Productos de inversión', 'Seguros empresariales']),
        randomElement(['Financiación de proyectos', 'Leasing de equipos', 'Factoring'])
      ],
      challenges: [
        randomElement(['Competencia activa en el cliente', 'Proceso de decisión largo', 'Condiciones actuales competitivas']),
        randomElement(['Limitaciones de riesgo', 'Documentación pendiente', 'Situación económica del sector'])
      ],
      products_discussed: [
        randomElement(['Cuenta corriente empresarial', 'Línea de crédito', 'TPV']),
        randomElement(['Depósitos a plazo', 'Fondos de inversión', 'Seguros']),
        randomElement(['Banca online', 'Confirming', 'Renting'])
      ],
      estimated_value: randomNumber(25000, 2000000),
      follow_up_date: generateRandomDate(0, 45).split('T')[0],
      status: 'completed',
      sentiment: randomElement(['positive', 'neutral', 'negative']),
      key_decisions: [
        randomElement(['Aprobación de propuesta', 'Solicitud de mejora de condiciones', 'Ampliación de productos']),
        randomElement(['Revisión de límites', 'Cambio de gestor', 'Reestructuración de deuda'])
      ],
      attendees: [
        randomElement(['Director General', 'Director Financiero', 'Gerente']),
        randomElement(['Responsable Comercial', 'Administrador', 'Asesor externo'])
      ]
    }));

    const { data: visitSheets } = await supabase.from('visit_sheets').insert(visitSheetsData).select('id');
    dataIds.visitSheets = visitSheets?.map(v => v.id) || [];
    console.log(`Created ${dataIds.visitSheets.length} visit sheets`);

    // 11. Generate financial statements (PGC) for companies
    const fiscalYears = [2022, 2023, 2024];
    const financialStatementsData: any[] = [];
    
    for (const companyId of dataIds.companies.slice(0, 30)) { // 30 companies with financials
      for (const year of fiscalYears) {
        financialStatementsData.push({
          company_id: companyId,
          fiscal_year: year,
          statement_type: 'normal',
          source: 'manual',
          status: year === 2024 ? 'draft' : 'approved',
          created_by: demoUserId,
          approved_by: year !== 2024 ? demoUserId : null,
          approved_at: year !== 2024 ? new Date().toISOString() : null
        });
      }
    }

    const { data: financialStatements } = await supabase
      .from('company_financial_statements')
      .insert(financialStatementsData)
      .select('id, fiscal_year');
    dataIds.financialStatements = financialStatements?.map(f => f.id) || [];
    console.log(`Created ${dataIds.financialStatements.length} financial statements`);

    // 12. Generate balance sheets for financial statements
    const balanceSheetsData = financialStatements?.map(stmt => {
      const baseMultiplier = stmt.fiscal_year === 2022 ? 1 : stmt.fiscal_year === 2023 ? 1.1 : 1.2;
      return {
        statement_id: stmt.id,
        // Activo No Corriente
        intangible_assets: randomNumber(50000, 500000) * baseMultiplier,
        goodwill: randomNumber(0, 200000) * baseMultiplier,
        tangible_assets: randomNumber(200000, 2000000) * baseMultiplier,
        real_estate_investments: randomNumber(0, 500000) * baseMultiplier,
        long_term_financial_investments: randomNumber(100000, 1000000) * baseMultiplier,
        long_term_group_investments: randomNumber(0, 300000) * baseMultiplier,
        deferred_tax_assets: randomNumber(10000, 100000) * baseMultiplier,
        long_term_trade_receivables: randomNumber(0, 200000) * baseMultiplier,
        // Activo Corriente
        inventory: randomNumber(50000, 800000) * baseMultiplier,
        trade_receivables: randomNumber(100000, 1500000) * baseMultiplier,
        short_term_group_receivables: randomNumber(0, 200000) * baseMultiplier,
        short_term_financial_investments: randomNumber(50000, 500000) * baseMultiplier,
        cash_equivalents: randomNumber(100000, 2000000) * baseMultiplier,
        accruals_assets: randomNumber(5000, 50000) * baseMultiplier,
        // Patrimonio Neto
        share_capital: randomNumber(100000, 1000000),
        share_premium: randomNumber(0, 500000),
        legal_reserve: randomNumber(20000, 200000),
        voluntary_reserves: randomNumber(50000, 500000) * baseMultiplier,
        retained_earnings: randomNumber(-100000, 800000) * baseMultiplier,
        current_year_result: randomNumber(-50000, 500000) * baseMultiplier,
        // Pasivo No Corriente
        long_term_provisions: randomNumber(10000, 200000) * baseMultiplier,
        long_term_debts: randomNumber(100000, 2000000) * baseMultiplier,
        long_term_group_debts: randomNumber(0, 500000) * baseMultiplier,
        deferred_tax_liabilities: randomNumber(5000, 100000) * baseMultiplier,
        long_term_accruals: randomNumber(0, 50000) * baseMultiplier,
        // Pasivo Corriente
        short_term_provisions: randomNumber(5000, 100000) * baseMultiplier,
        short_term_debts: randomNumber(50000, 500000) * baseMultiplier,
        short_term_group_debts: randomNumber(0, 200000) * baseMultiplier,
        trade_payables: randomNumber(100000, 1000000) * baseMultiplier,
        other_creditors: randomNumber(20000, 200000) * baseMultiplier,
        short_term_accruals: randomNumber(5000, 50000) * baseMultiplier
      };
    }) || [];

    const { data: balanceSheets } = await supabase.from('balance_sheets').insert(balanceSheetsData).select('id');
    dataIds.balanceSheets = balanceSheets?.map(b => b.id) || [];
    console.log(`Created ${dataIds.balanceSheets.length} balance sheets`);

    // 13. Generate income statements for financial statements
    const incomeStatementsData = financialStatements?.map(stmt => {
      const baseMultiplier = stmt.fiscal_year === 2022 ? 1 : stmt.fiscal_year === 2023 ? 1.08 : 1.15;
      const revenue = randomNumber(500000, 10000000) * baseMultiplier;
      const cogs = revenue * randomDecimal(0.4, 0.7);
      const grossProfit = revenue - cogs;
      const operatingExpenses = grossProfit * randomDecimal(0.3, 0.6);
      const operatingProfit = grossProfit - operatingExpenses;
      const financialResult = randomNumber(-50000, 50000);
      const ebt = operatingProfit + financialResult;
      const taxes = ebt > 0 ? ebt * 0.25 : 0;
      
      return {
        statement_id: stmt.id,
        // Ingresos
        revenue: revenue,
        other_operating_income: randomNumber(10000, 200000) * baseMultiplier,
        own_work_capitalized: randomNumber(0, 50000) * baseMultiplier,
        // Gastos
        supplies: cogs * 0.6,
        other_operating_expenses: cogs * 0.4,
        personnel_expenses: operatingExpenses * 0.5,
        depreciation: operatingExpenses * 0.15,
        impairment_trade_receivables: randomNumber(0, 50000),
        other_results: randomNumber(-20000, 20000),
        // Resultado Financiero
        financial_income: Math.max(0, financialResult),
        financial_expenses: Math.abs(Math.min(0, financialResult)),
        exchange_differences: randomNumber(-10000, 10000),
        impairment_financial_instruments: randomNumber(0, 20000),
        // Impuestos y Resultado
        corporate_tax: taxes,
        result_discontinued_operations: 0
      };
    }) || [];

    const { data: incomeStatements } = await supabase.from('income_statements').insert(incomeStatementsData).select('id');
    dataIds.incomeStatements = incomeStatements?.map(i => i.id) || [];
    console.log(`Created ${dataIds.incomeStatements.length} income statements`);

    // 14. Generate opportunities
    const opportunityStages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    const opportunitiesData: any[] = [];
    
    for (const companyId of dataIds.companies.slice(0, 40)) {
      const numOpps = randomNumber(1, 3);
      for (let i = 0; i < numOpps; i++) {
        opportunitiesData.push({
          company_id: companyId,
          gestor_id: demoUserId,
          title: `DEMO_Oportunidad ${randomElement(['Financiación', 'Inversión', 'Seguros', 'Leasing', 'Factoring'])} ${i + 1}`,
          description: 'Oportunidad de negocio identificada durante visita comercial',
          estimated_value: randomNumber(50000, 2000000),
          probability: randomNumber(10, 90),
          stage: randomElement(opportunityStages),
          expected_close_date: generateRandomDate(0, 180).split('T')[0],
          product_interest: randomElement(['Crédito', 'Depósitos', 'Fondos', 'Seguros', 'TPV', 'Leasing']),
          notes: 'Oportunidad generada para demostración'
        });
      }
    }

    const { data: opportunities } = await supabase.from('opportunities').insert(opportunitiesData).select('id');
    dataIds.opportunities = opportunities?.map(o => o.id) || [];
    console.log(`Created ${dataIds.opportunities.length} opportunities`);

    // 15. Generate 20 goals
    const goalTypes = ['revenue', 'visits', 'new_clients', 'products_sold', 'portfolio_growth'];
    const goalsData = goalTypes.flatMap(type => [
      {
        title: `DEMO - Objetivo ${type} Mensual`,
        description: `Objetivo mensual de demostración para ${type}`,
        goal_type: type,
        target_value: randomNumber(10, 100),
        current_value: randomNumber(3, 95),
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        status: 'active',
        created_by: demoUserId,
        office: 'Andorra la Vella'
      },
      {
        title: `DEMO - Objetivo ${type} Trimestral`,
        description: `Objetivo trimestral de demostración para ${type}`,
        goal_type: type,
        target_value: randomNumber(50, 300),
        current_value: randomNumber(10, 250),
        start_date: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1).toISOString().split('T')[0],
        end_date: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3 + 3, 0).toISOString().split('T')[0],
        status: 'active',
        created_by: demoUserId,
        office: 'Andorra la Vella'
      },
      {
        title: `DEMO - Objetivo ${type} Anual`,
        description: `Objetivo anual de demostración para ${type}`,
        goal_type: type,
        target_value: randomNumber(200, 1000),
        current_value: randomNumber(50, 800),
        start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end_date: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
        status: 'active',
        created_by: demoUserId,
        office: 'Andorra la Vella'
      },
      {
        title: `DEMO - Objetivo ${type} Anterior`,
        description: `Objetivo histórico completado para ${type}`,
        goal_type: type,
        target_value: randomNumber(50, 150),
        current_value: randomNumber(45, 160),
        start_date: new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date: new Date(new Date().getFullYear() - 1, new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        status: 'completed',
        created_by: demoUserId,
        office: 'Andorra la Vella'
      }
    ]);

    const { data: goals } = await supabase.from('goals').insert(goalsData).select('id');
    dataIds.goals = goals?.map(g => g.id) || [];
    console.log(`Created ${dataIds.goals.length} goals`);

    // 16. Generate action plans
    const actionPlansData = Array(10).fill(null).map((_, i) => ({
      user_id: demoUserId,
      title: `DEMO - Plan de Acción ${i + 1}`,
      description: randomElement([
        'Plan para incrementar cartera de clientes',
        'Estrategia de retención de clientes VIP',
        'Plan de captación de nuevos productos',
        'Mejora de ratio de conversión'
      ]),
      target_metric: randomElement(goalTypes),
      target_value: randomNumber(50, 200),
      current_value: randomNumber(20, 150),
      gap_percentage: randomDecimal(10, 50),
      status: randomElement(['pending', 'in_progress', 'completed']),
      target_date: generateRandomDate(0, 90).split('T')[0]
    }));

    const { data: actionPlans } = await supabase.from('action_plans').insert(actionPlansData).select('id');
    dataIds.actionPlans = actionPlans?.map(a => a.id) || [];
    console.log(`Created ${dataIds.actionPlans.length} action plans`);

    // 17. Generate best practices
    const bestPracticesData = Array(8).fill(null).map((_, i) => ({
      gestor_id: demoUserId,
      title: `DEMO - Buena Práctica ${i + 1}`,
      content: randomElement([
        'Estrategia efectiva para primera visita comercial: preparar análisis previo del cliente y sus necesidades potenciales.',
        'Técnica de seguimiento post-visita: enviar resumen por email en las primeras 24 horas.',
        'Método para identificar oportunidades de cross-selling durante reuniones.',
        'Proceso de cualificación de leads antes de agendar visita comercial.',
        'Framework para presentación de productos financieros complejos.',
        'Estrategia de recuperación de clientes inactivos.',
        'Técnicas de negociación de condiciones con clientes corporativos.',
        'Metodología de análisis financiero rápido para visitas comerciales.'
      ]),
      category: randomElement(['Ventas', 'Negociación', 'Seguimiento', 'Análisis', 'Presentación']),
      tags: ['demo', randomElement(['efectivo', 'probado', 'recomendado'])],
      views_count: randomNumber(10, 200),
      likes_count: randomNumber(2, 50)
    }));

    const { data: bestPractices } = await supabase.from('best_practices').insert(bestPracticesData).select('id');
    dataIds.bestPractices = bestPractices?.map(b => b.id) || [];
    console.log(`Created ${dataIds.bestPractices.length} best practices`);

    // 18. Generate alerts
    const alertsData = Array(6).fill(null).map((_, i) => ({
      alert_name: `DEMO - Alerta ${i + 1}`,
      metric_type: randomElement(['visits', 'revenue', 'goals', 'clients']),
      condition_type: randomElement(['below', 'above', 'equals']),
      threshold_value: randomNumber(50, 100),
      period_type: randomElement(['daily', 'weekly', 'monthly']),
      target_type: 'gestor',
      target_gestor_id: demoUserId,
      active: true,
      created_by: demoUserId,
      escalation_enabled: Math.random() > 0.5,
      escalation_hours: 24,
      max_escalation_level: 2
    }));

    const { data: alerts } = await supabase.from('alerts').insert(alertsData).select('id');
    dataIds.alerts = alerts?.map(a => a.id) || [];
    console.log(`Created ${dataIds.alerts.length} alerts`);

    // 19. Generate notifications
    const notificationTypes = ['info', 'warning', 'success', 'reminder', 'alert'];
    const notificationsData = Array(40).fill(null).map((_, i) => ({
      user_id: demoUserId,
      title: `DEMO - ${randomElement(['Recordatorio de visita', 'Objetivo actualizado', 'Nueva oportunidad', 'Alerta de seguimiento', 'Informe disponible'])}`,
      message: `Notificación de demostración ${i + 1}: ${randomElement([
        'Tienes una visita programada para mañana',
        'Has alcanzado el 80% de tu objetivo mensual',
        'Nueva oportunidad identificada en cliente VIP',
        'Seguimiento pendiente de propuesta enviada',
        'El informe trimestral está disponible'
      ])}`,
      type: randomElement(notificationTypes),
      is_read: Math.random() > 0.4,
      created_at: generateRandomDate(14, 0)
    }));

    const { data: notifications } = await supabase.from('notifications').insert(notificationsData).select('id');
    dataIds.notifications = notifications?.map(n => n.id) || [];
    console.log(`Created ${dataIds.notifications.length} notifications`);

    // 20. Update demo session with all data IDs
    await supabase.from('demo_sessions').update({
      demo_user_id: demoUserId,
      data_ids: dataIds,
      created_companies: dataIds.companies.length,
      created_visits: dataIds.visits.length,
      created_goals: dataIds.goals.length
    }).eq('id', sessionId);

    const stats = {
      companies: dataIds.companies.length,
      contacts: dataIds.contacts.length,
      visits: dataIds.visits.length,
      visitSheets: dataIds.visitSheets.length,
      financialStatements: dataIds.financialStatements.length,
      balanceSheets: dataIds.balanceSheets.length,
      incomeStatements: dataIds.incomeStatements.length,
      opportunities: dataIds.opportunities.length,
      bankAffiliations: dataIds.bankAffiliations.length,
      companyProducts: dataIds.companyProducts.length,
      goals: dataIds.goals.length,
      actionPlans: dataIds.actionPlans.length,
      bestPractices: dataIds.bestPractices.length,
      alerts: dataIds.alerts.length,
      notifications: dataIds.notifications.length
    };

    console.log('Demo data generation complete:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        demoUserId,
        demoEmail,
        dataIds,
        stats
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating demo data:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
