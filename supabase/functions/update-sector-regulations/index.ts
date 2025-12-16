import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Starting sector regulations update check...');

    // Step 1: Get all unique sectors from cnae_sector_mapping and companies
    const { data: sectors } = await supabase
      .from('cnae_sector_mapping')
      .select('sector, sector_name')
      .not('sector', 'is', null);

    const uniqueSectors = [...new Map((sectors || []).map(s => [s.sector, s])).values()];
    console.log(`Found ${uniqueSectors.length} unique sectors to check`);

    const newRegulations: any[] = [];
    const updatedRegulations: any[] = [];

    // Step 2: For each sector, use AI to check for new regulations
    if (lovableApiKey) {
      for (const sectorInfo of uniqueSectors.slice(0, 5)) { // Limit to 5 sectors per run
        console.log(`Checking regulations for sector: ${sectorInfo.sector}`);
        
        // Get existing regulations for this sector
        const { data: existingRegs } = await supabase
          .from('organization_compliance_documents')
          .select('title, metadata')
          .eq('sector', sectorInfo.sector)
          .eq('document_type', 'official_regulation');

        const existingTitles = (existingRegs || []).map(r => r.title);

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lovableApiKey}`
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            max_tokens: 4000,
            messages: [
              {
                role: 'system',
                content: `Eres un experto en normativa empresarial y bancaria española y europea.
Busca las ÚLTIMAS normativas publicadas en el BOE y DOUE que afecten al sector indicado.
Solo incluye normativas de los últimos 6 meses que NO estén ya en la lista proporcionada.

Responde SIEMPRE en formato JSON:
{
  "new_regulations": [
    {
      "name": "Nombre completo de la normativa",
      "source": "BOE/DOUE",
      "reference": "Referencia oficial",
      "publication_date": "2024-01-15",
      "effective_date": "2024-03-01",
      "is_mandatory": true,
      "summary": "Resumen breve",
      "key_requirements": ["Requisito 1", "Requisito 2"],
      "affected_areas": ["Área 1", "Área 2"]
    }
  ],
  "updates_to_existing": [
    {
      "original_name": "Nombre de normativa existente",
      "update_type": "amendment/clarification/extension",
      "update_description": "Descripción del cambio"
    }
  ]
}`
              },
              {
                role: 'user',
                content: `Sector: ${sectorInfo.sector_name}
Normativas existentes (NO incluir estas):
${existingTitles.slice(0, 10).join('\n')}

Busca nuevas normativas publicadas en los últimos 6 meses que afecten a este sector y no estén en la lista.`
              }
            ]
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiContent = aiData.choices?.[0]?.message?.content;
          
          if (aiContent) {
            try {
              const cleanContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              const aiParsed = JSON.parse(cleanContent);

              // Process new regulations
              for (const newReg of (aiParsed.new_regulations || [])) {
                // Check if already exists
                const exists = existingTitles.some(t => 
                  t.toLowerCase().includes(newReg.name.toLowerCase().slice(0, 30))
                );

                if (!exists) {
                  // Insert new regulation document
                  const { data: regDoc, error } = await supabase
                    .from('organization_compliance_documents')
                    .insert({
                      document_type: 'official_regulation',
                      title: newReg.name,
                      description: newReg.summary,
                      sector: sectorInfo.sector,
                      sector_key: sectorInfo.sector,
                      regulation_source: newReg.source || 'BOE',
                      effective_date: newReg.effective_date,
                      is_mandatory: newReg.is_mandatory !== false,
                      requires_acknowledgment: true,
                      status: 'active',
                      metadata: {
                        reference: newReg.reference,
                        publication_date: newReg.publication_date,
                        affected_areas: newReg.affected_areas,
                        auto_detected: true,
                        detected_at: new Date().toISOString()
                      }
                    })
                    .select()
                    .single();

                  if (regDoc && !error) {
                    newRegulations.push(regDoc);

                    // Create requirements
                    for (let i = 0; i < (newReg.key_requirements || []).length; i++) {
                      await supabase.from('compliance_requirements').insert({
                        document_id: regDoc.id,
                        requirement_key: `${sectorInfo.sector}_auto_${Date.now()}_${i}`,
                        requirement_title: newReg.key_requirements[i],
                        requirement_description: `Requisito automático de ${newReg.name}`,
                        category: 'regulatory',
                        priority: newReg.is_mandatory ? 'high' : 'medium',
                        status: 'pending'
                      });
                    }

                    // Create review task
                    await supabase.from('compliance_review_tasks').insert({
                      document_id: regDoc.id,
                      task_type: 'review',
                      title: `Revisar nueva normativa: ${newReg.name}`,
                      description: `Nueva normativa detectada automáticamente. Revisar aplicabilidad y crear plan de cumplimiento.`,
                      priority: 'high',
                      status: 'pending',
                      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    });
                  }
                }
              }

              // Process updates to existing regulations
              for (const update of (aiParsed.updates_to_existing || [])) {
                updatedRegulations.push({
                  sector: sectorInfo.sector,
                  ...update
                });
              }

            } catch (parseError) {
              console.error(`Failed to parse AI response for sector ${sectorInfo.sector}:`, parseError);
            }
          }
        }
      }
    }

    // Step 3: Get admin users to notify
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('role', ['superadmin', 'director_comercial', 'responsable_comercial']);

    const adminIds = (adminProfiles || []).map(p => p.id);

    // Step 4: Create notifications for new regulations
    if (newRegulations.length > 0) {
      // Get affected organizations by sector
      for (const reg of newRegulations) {
        const { data: affectedOrgs } = await supabase
          .from('companies')
          .select('id')
          .or(`sector.eq.${reg.sector},cnae.like.${reg.sector}%`);

        const orgIds = (affectedOrgs || []).map(o => o.id);

        await supabase.from('regulation_update_notifications').insert({
          regulation_id: reg.id,
          sector: reg.sector,
          notification_type: 'new_regulation',
          title: `Nueva normativa detectada: ${reg.title}`,
          message: `Se ha detectado una nueva normativa aplicable al sector ${reg.sector}: ${reg.title}. Por favor, revise los requisitos de cumplimiento.`,
          affected_organizations: orgIds,
          notified_users: adminIds
        });

        // Also create a regular notification
        for (const adminId of adminIds) {
          await supabase.from('notifications').insert({
            user_id: adminId,
            type: 'regulatory_update',
            title: 'Nueva normativa detectada',
            message: `${reg.title} - Sector: ${reg.sector}`,
            data: {
              regulation_id: reg.id,
              sector: reg.sector
            }
          });
        }
      }
    }

    console.log(`Update check completed. New regulations: ${newRegulations.length}, Updates: ${updatedRegulations.length}`);

    return new Response(JSON.stringify({
      success: true,
      new_regulations_count: newRegulations.length,
      updates_count: updatedRegulations.length,
      new_regulations: newRegulations.map(r => ({ id: r.id, title: r.title, sector: r.sector })),
      updates: updatedRegulations,
      admins_notified: adminIds.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in update-sector-regulations:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
