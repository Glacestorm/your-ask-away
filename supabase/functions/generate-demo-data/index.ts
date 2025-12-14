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

const generateRandomDate = (daysBack: number, daysForward: number = 0): string => {
  const now = new Date();
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const future = new Date(now.getTime() + daysForward * 24 * 60 * 60 * 1000);
  const random = new Date(past.getTime() + Math.random() * (future.getTime() - past.getTime()));
  return random.toISOString();
};

const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

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
    };

    console.log(`Generating demo data for role: ${role}, session: ${sessionId}`);

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

    // 4. Get existing status colors
    const { data: statusColors } = await supabase.from('status_colors').select('id').limit(5);
    const statusIds = statusColors?.map(s => s.id) || [];

    // 5. Generate 50 companies
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
        vinculacion_entidad_1: randomNumber(0, 100),
        vinculacion_entidad_2: randomNumber(0, 100),
        vinculacion_entidad_3: randomNumber(0, 100),
        pl_banco: randomNumber(1000, 100000),
        email: `contacto@${name.toLowerCase().replace(/demo_/i, '').replace(/\s+/g, '').slice(0, 15)}.ad`,
        phone: `+376 ${randomNumber(300000, 899999)}`,
        fecha_ultima_visita: generateRandomDate(180, 0).split('T')[0],
        is_vip: Math.random() > 0.8,
        observaciones: 'Empresa generada para demostración'
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
    const positions = ['Director General', 'Director Financer', 'Gerent', 'Responsable Comercial', 'Administrador'];
    
    for (const companyId of dataIds.companies) {
      const numContacts = randomNumber(1, 3);
      for (let i = 0; i < numContacts; i++) {
        contactsData.push({
          company_id: companyId,
          contact_name: `DEMO_Contacte ${i + 1}`,
          position: randomElement(positions),
          email: `contacte${i + 1}@demo.ad`,
          phone: `+376 ${randomNumber(300000, 899999)}`,
          is_primary: i === 0
        });
      }
    }

    const { data: contacts } = await supabase.from('company_contacts').insert(contactsData).select('id');
    dataIds.contacts = contacts?.map(c => c.id) || [];
    console.log(`Created ${dataIds.contacts.length} contacts`);

    // 7. Generate 100 visits
    const visitTypes = ['commercial', 'follow_up', 'presentation', 'negotiation', 'closing'];
    const visitStatuses = ['scheduled', 'completed', 'cancelled'];
    const visitsData: any[] = [];

    for (let i = 0; i < 100; i++) {
      const companyId = randomElement(dataIds.companies);
      const visitDate = generateRandomDate(180, 30);
      const isPast = new Date(visitDate) < new Date();
      
      visitsData.push({
        company_id: companyId,
        gestor_id: demoUserId,
        visit_date: visitDate,
        visit_type: randomElement(visitTypes),
        status: isPast ? (Math.random() > 0.2 ? 'completed' : 'cancelled') : 'scheduled',
        notes: `DEMO - Visita de demostración ${i + 1}`,
        objectives: 'Objetivos de demostración para la visita',
        duration_minutes: randomNumber(30, 120)
      });
    }

    const { data: visits } = await supabase.from('visits').insert(visitsData).select('id');
    dataIds.visits = visits?.map(v => v.id) || [];
    console.log(`Created ${dataIds.visits.length} visits`);

    // 8. Generate visit sheets for completed visits
    const completedVisitIds = dataIds.visits.slice(0, 30);
    const visitSheetsData = completedVisitIds.map(visitId => ({
      visit_id: visitId,
      gestor_id: demoUserId,
      summary: 'DEMO - Resumen de la visita realizada correctamente',
      action_items: ['Seguimiento comercial', 'Preparar propuesta', 'Agendar próxima reunión'],
      next_steps: 'Próximos pasos definidos en la reunión',
      client_feedback: 'Feedback positivo del cliente',
      opportunities_identified: ['Nueva línea de crédito', 'Productos de inversión'],
      challenges: ['Competencia activa', 'Proceso de decisión largo'],
      products_discussed: ['Cuenta corriente', 'Línea de crédito', 'TPV'],
      estimated_value: randomNumber(10000, 500000),
      follow_up_date: generateRandomDate(0, 30).split('T')[0],
      status: 'completed'
    }));

    const { data: visitSheets } = await supabase.from('visit_sheets').insert(visitSheetsData).select('id');
    dataIds.visitSheets = visitSheets?.map(v => v.id) || [];
    console.log(`Created ${dataIds.visitSheets.length} visit sheets`);

    // 9. Generate 15 goals
    const goalTypes = ['revenue', 'visits', 'new_clients', 'products_sold', 'portfolio_growth'];
    const goalsData = goalTypes.flatMap(type => [
      {
        title: `DEMO - Objetivo ${type} Mensual`,
        description: `Objetivo de demostración para ${type}`,
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
      }
    ]);

    const { data: goals } = await supabase.from('goals').insert(goalsData).select('id');
    dataIds.goals = goals?.map(g => g.id) || [];
    console.log(`Created ${dataIds.goals.length} goals`);

    // 10. Generate notifications
    const notificationTypes = ['info', 'warning', 'success', 'reminder'];
    const notificationsData = Array(25).fill(null).map((_, i) => ({
      user_id: demoUserId,
      title: `DEMO - Notificación ${i + 1}`,
      message: `Esta es una notificación de demostración número ${i + 1}`,
      type: randomElement(notificationTypes),
      is_read: Math.random() > 0.5,
      created_at: generateRandomDate(7, 0)
    }));

    const { data: notifications } = await supabase.from('notifications').insert(notificationsData).select('id');
    dataIds.notifications = notifications?.map(n => n.id) || [];
    console.log(`Created ${dataIds.notifications.length} notifications`);

    // 11. Update demo session with data IDs
    await supabase.from('demo_sessions').update({
      demo_user_id: demoUserId,
      data_ids: dataIds,
      created_companies: dataIds.companies.length,
      created_visits: dataIds.visits.length,
      created_goals: dataIds.goals.length
    }).eq('id', sessionId);

    return new Response(
      JSON.stringify({
        success: true,
        demoUserId,
        demoEmail,
        dataIds,
        stats: {
          companies: dataIds.companies.length,
          contacts: dataIds.contacts.length,
          visits: dataIds.visits.length,
          visitSheets: dataIds.visitSheets.length,
          goals: dataIds.goals.length,
          notifications: dataIds.notifications.length
        }
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
