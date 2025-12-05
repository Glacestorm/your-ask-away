import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MINIMUM_PRODUCTS_OFFICE = 3; // Minimum products per office per month
const MINIMUM_PRODUCTS_GESTOR = 1; // Minimum products per gestor per month

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthLabel = monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    console.log(`Checking low performance for ${monthLabel}`);

    // Get all contracted products this month with company info
    const { data: monthProducts, error: productsError } = await supabase
      .from('company_products')
      .select(`
        id, contract_date,
        company:companies(oficina, gestor_id)
      `)
      .gte('contract_date', monthStart.toISOString().split('T')[0])
      .lte('contract_date', monthEnd.toISOString().split('T')[0])
      .eq('active', true);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw productsError;
    }

    // Count products by office
    const officeProducts: Record<string, number> = {};
    // Count products by gestor
    const gestorProducts: Record<string, number> = {};

    for (const product of monthProducts || []) {
      const company = product.company as unknown as { oficina: string; gestor_id: string } | null;
      if (company?.oficina) {
        officeProducts[company.oficina] = (officeProducts[company.oficina] || 0) + 1;
      }
      if (company?.gestor_id) {
        gestorProducts[company.gestor_id] = (gestorProducts[company.gestor_id] || 0) + 1;
      }
    }

    // Get all offices from companies
    const { data: allCompanies } = await supabase
      .from('companies')
      .select('oficina')
      .not('oficina', 'is', null);

    const allOffices = [...new Set((allCompanies || []).map(c => c.oficina).filter(Boolean))];

    // Get all gestores
    const { data: allGestores } = await supabase
      .from('profiles')
      .select('id, full_name, oficina');

    // Get directors for notifications
    const { data: directors } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['director_comercial', 'superadmin', 'director_oficina', 'responsable_comercial']);

    const alertsCreated: string[] = [];

    // Check offices below minimum
    for (const oficina of allOffices) {
      const productCount = officeProducts[oficina as string] || 0;
      
      if (productCount < MINIMUM_PRODUCTS_OFFICE) {
        // Get office directors
        const officeDirectors = (directors || []).filter(d => {
          if (d.role === 'director_comercial' || d.role === 'superadmin' || d.role === 'responsable_comercial') {
            return true;
          }
          if (d.role === 'director_oficina') {
            const directorProfile = (allGestores || []).find(g => g.id === d.user_id);
            return directorProfile?.oficina === oficina;
          }
          return false;
        });

        for (const director of officeDirectors) {
          // Check if notification already exists this month
          const { data: existingNotif } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', director.user_id)
            .ilike('title', '%Bajo Rendimiento de Oficina%')
            .ilike('message', `%${oficina}%`)
            .gte('created_at', monthStart.toISOString())
            .maybeSingle();

          if (!existingNotif) {
            await supabase.from('notifications').insert({
              user_id: director.user_id,
              title: '⚠️ Bajo Rendimiento de Oficina',
              message: `La oficina ${oficina} solo tiene ${productCount} producto(s) contratado(s) en ${monthLabel}. Mínimo requerido: ${MINIMUM_PRODUCTS_OFFICE}`,
              severity: productCount === 0 ? 'error' : 'warning'
            });
            alertsCreated.push(`Office: ${oficina}`);
          }
        }
      }
    }

    // Check gestores below minimum
    for (const gestor of allGestores || []) {
      const productCount = gestorProducts[gestor.id] || 0;
      
      if (productCount < MINIMUM_PRODUCTS_GESTOR) {
        // Notify the gestor
        const { data: existingGestorNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', gestor.id)
          .ilike('title', '%Productos Contratados%')
          .gte('created_at', monthStart.toISOString())
          .maybeSingle();

        if (!existingGestorNotif) {
          await supabase.from('notifications').insert({
            user_id: gestor.id,
            title: '📊 Alerta de Productos Contratados',
            message: `Este mes tienes ${productCount} producto(s) contratado(s). El objetivo mínimo es ${MINIMUM_PRODUCTS_GESTOR} producto(s) mensuales.`,
            severity: productCount === 0 ? 'error' : 'warning'
          });
          alertsCreated.push(`Gestor: ${gestor.full_name}`);
        }

        // Notify office director
        if (gestor.oficina) {
          const officeDirector = (directors || []).find(d => {
            if (d.role === 'director_oficina') {
              const directorProfile = (allGestores || []).find(g => g.id === d.user_id);
              return directorProfile?.oficina === gestor.oficina;
            }
            return false;
          });

          if (officeDirector) {
            const { data: existingDirNotif } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', officeDirector.user_id)
              .ilike('message', `%${gestor.full_name}%`)
              .ilike('title', '%Gestor Bajo Mínimo%')
              .gte('created_at', monthStart.toISOString())
              .maybeSingle();

            if (!existingDirNotif) {
              await supabase.from('notifications').insert({
                user_id: officeDirector.user_id,
                title: '👤 Gestor Bajo Mínimo de Productos',
                message: `${gestor.full_name} tiene ${productCount} producto(s) contratado(s) en ${monthLabel}. Mínimo: ${MINIMUM_PRODUCTS_GESTOR}`,
                severity: productCount === 0 ? 'error' : 'warning'
              });
            }
          }
        }

        // Notify commercial directors and superadmins
        const commercialDirectors = (directors || []).filter(d => 
          d.role === 'director_comercial' || d.role === 'superadmin'
        );

        for (const cd of commercialDirectors) {
          const { data: existingCdNotif } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', cd.user_id)
            .ilike('message', `%${gestor.full_name}%`)
            .ilike('title', '%Gestor Bajo Mínimo%')
            .gte('created_at', monthStart.toISOString())
            .maybeSingle();

          if (!existingCdNotif) {
            await supabase.from('notifications').insert({
              user_id: cd.user_id,
              title: '👤 Gestor Bajo Mínimo de Productos',
              message: `${gestor.full_name} (${gestor.oficina || 'Sin oficina'}) tiene ${productCount} producto(s) en ${monthLabel}. Mínimo: ${MINIMUM_PRODUCTS_GESTOR}`,
              severity: productCount === 0 ? 'error' : 'warning'
            });
          }
        }
      }
    }

    console.log(`Alerts created: ${alertsCreated.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsCreated: alertsCreated.length,
        details: alertsCreated 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
