import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MigrationRequest {
  action: string;
  migration_id?: string;
  template_id?: string;
  source_crm?: string;
  file_content?: string;
  file_type?: string;
  name?: string;
  mappings?: Array<Record<string, unknown>>;
  status?: string;
  limit?: number;
  is_public?: boolean;
  // Phase 5: Scheduling & Templates
  schedule_config?: {
    enabled: boolean;
    cron_expression?: string;
    next_run?: string;
    timezone?: string;
    max_retries?: number;
    retry_delay_minutes?: number;
  };
  template_config?: {
    name: string;
    description?: string;
    is_public?: boolean;
    tags?: string[];
  };
  rollback_options?: {
    dry_run?: boolean;
    preserve_logs?: boolean;
  };
  export_format?: 'json' | 'csv';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const body = await req.json() as MigrationRequest;
    const { action } = body;

    console.log(`[crm-migration-engine] Action: ${action}, User: ${userId}`);

    switch (action) {
      // === LIST CONNECTORS ===
      case 'list_connectors': {
        const { data: connectors, error } = await supabase
          .from('crm_connectors')
          .select('*')
          .eq('is_active', true)
          .order('popularity_rank', { ascending: true });

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          connectors
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === LIST MIGRATIONS ===
      case 'list_migrations': {
        const limit = body.limit || 50;
        
        const { data: migrations, error } = await supabase
          .from('crm_migrations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          migrations
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === LIST TEMPLATES ===
      case 'list_templates': {
        let query = supabase
          .from('crm_mapping_templates')
          .select('*');
        
        if (body.source_crm) {
          query = query.eq('source_crm', body.source_crm);
        }

        const { data: templates, error } = await query
          .order('usage_count', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          templates
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === ANALYZE FILE ===
      case 'analyze_file': {
        const { file_content, file_type, source_crm } = body;

        if (!file_content || !file_type) {
          throw new Error('file_content and file_type are required');
        }

        // Parse file content
        let parsedData: Array<Record<string, unknown>> = [];
        
        if (file_type === 'json') {
          try {
            parsedData = JSON.parse(file_content);
            if (!Array.isArray(parsedData)) {
              parsedData = [parsedData];
            }
          } catch {
            throw new Error('Invalid JSON format');
          }
        } else if (file_type === 'csv') {
          parsedData = parseCSV(file_content);
        }

        // Detect fields
        const detectedFields = analyzeFields(parsedData);

        // Get connector field definitions for auto-mapping
        let connectorFields: Record<string, unknown> = {};
        if (source_crm) {
          const { data: connector } = await supabase
            .from('crm_connectors')
            .select('field_definitions')
            .eq('connector_key', source_crm)
            .single();
          
          if (connector) {
            connectorFields = connector.field_definitions;
          }
        }

        // Use AI for smart mapping suggestions
        let suggestedMappings: Array<Record<string, unknown>> = [];
        
        if (LOVABLE_API_KEY && detectedFields.length > 0) {
          try {
            const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                  {
                    role: 'system',
                    content: `Eres un experto en migración de datos CRM. Tu tarea es sugerir mapeos de campos desde un CRM origen hacia tablas de destino estándar.

Las tablas de destino disponibles son:
- companies (id, nombre, cif, direccion, localidad, provincia, codigo_postal, telefono, email, sector, estado)
- company_contacts (id, company_id, nombre, cargo, telefono, email, is_primary)
- visits (id, company_id, fecha, tipo, resultado, notas)
- company_products (id, company_id, product_id, fecha_contratacion, importe)

Responde SOLO con un JSON array de mapeos. Cada mapeo debe tener:
{
  "source_field": "nombre del campo origen",
  "target_table": "nombre tabla destino",
  "target_field": "nombre campo destino",
  "confidence": 0.0-1.0,
  "transform": "none|lowercase|uppercase|trim|date|number|null"
}`
                  },
                  {
                    role: 'user',
                    content: `CRM Origen: ${source_crm || 'Desconocido'}
Campos detectados:
${detectedFields.map(f => `- ${f.name} (${f.type}): ejemplos: ${f.sample_values.slice(0, 3).join(', ')}`).join('\n')}

Sugiere los mejores mapeos para estos campos.`
                  }
                ],
                temperature: 0.3,
                max_tokens: 2000,
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const content = aiData.choices?.[0]?.message?.content;
              
              if (content) {
                const jsonMatch = content.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                  suggestedMappings = JSON.parse(jsonMatch[0]);
                }
              }
            }
          } catch (aiError) {
            console.error('[crm-migration-engine] AI mapping error:', aiError);
          }
        }

        // Calculate data quality score
        const qualityScore = calculateDataQuality(parsedData, detectedFields);

        const analysis = {
          detected_crm: source_crm || detectCRM(detectedFields),
          detected_format: file_type,
          total_records: parsedData.length,
          detected_fields: detectedFields,
          suggested_mappings: suggestedMappings,
          data_quality_score: qualityScore,
          warnings: generateWarnings(parsedData, detectedFields),
          recommendations: generateRecommendations(detectedFields, suggestedMappings)
        };

        return new Response(JSON.stringify({
          success: true,
          analysis
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === CREATE MIGRATION ===
      case 'create_migration': {
        const { name, source_crm, file_content, file_type, mappings } = body;

        if (!name || !source_crm || !file_content) {
          throw new Error('name, source_crm, and file_content are required');
        }

        // Parse and count records
        let parsedData: Array<Record<string, unknown>> = [];
        
        if (file_type === 'json') {
          parsedData = JSON.parse(file_content);
          if (!Array.isArray(parsedData)) parsedData = [parsedData];
        } else if (file_type === 'csv') {
          parsedData = parseCSV(file_content);
        }

        // Create migration record
        const { data: migration, error: migrationError } = await supabase
          .from('crm_migrations')
          .insert({
            migration_name: name,
            source_crm,
            source_file_type: file_type,
            total_records: parsedData.length,
            status: 'pending',
            performed_by: userId,
            config: { raw_content: file_content.substring(0, 10000) } // Store preview
          })
          .select()
          .single();

        if (migrationError) throw migrationError;

        // Create field mappings if provided
        if (mappings && mappings.length > 0) {
          const mappingsToInsert = mappings.map(m => ({
            ...m,
            migration_id: migration.id
          }));

          const { error: mappingsError } = await supabase
            .from('crm_field_mappings')
            .insert(mappingsToInsert);

          if (mappingsError) {
            console.error('[crm-migration-engine] Mappings insert error:', mappingsError);
          }
        }

        // Insert records for processing
        const recordsToInsert = parsedData.slice(0, 1000).map((record, index) => ({
          migration_id: migration.id,
          record_index: index,
          source_data: record,
          status: 'pending'
        }));

        const { error: recordsError } = await supabase
          .from('crm_migration_records')
          .insert(recordsToInsert);

        if (recordsError) {
          console.error('[crm-migration-engine] Records insert error:', recordsError);
        }

        return new Response(JSON.stringify({
          success: true,
          migration
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === UPDATE MAPPINGS ===
      case 'update_mappings': {
        const { migration_id, mappings } = body;

        if (!migration_id || !mappings) {
          throw new Error('migration_id and mappings are required');
        }

        // Delete existing mappings
        await supabase
          .from('crm_field_mappings')
          .delete()
          .eq('migration_id', migration_id);

        // Insert new mappings
        const mappingsToInsert = mappings.map(m => ({
          ...m,
          migration_id
        }));

        const { data: newMappings, error } = await supabase
          .from('crm_field_mappings')
          .insert(mappingsToInsert)
          .select();

        if (error) throw error;

        // Update migration status
        await supabase
          .from('crm_migrations')
          .update({ status: 'mapping', updated_at: new Date().toISOString() })
          .eq('id', migration_id);

        return new Response(JSON.stringify({
          success: true,
          mappings: newMappings
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === RUN MIGRATION ===
      case 'run_migration': {
        const { migration_id } = body;

        if (!migration_id) {
          throw new Error('migration_id is required');
        }

        // Get migration and mappings
        const { data: migration } = await supabase
          .from('crm_migrations')
          .select('*')
          .eq('id', migration_id)
          .single();

        if (!migration) {
          throw new Error('Migration not found');
        }

        const { data: mappings } = await supabase
          .from('crm_field_mappings')
          .select('*')
          .eq('migration_id', migration_id);

        if (!mappings || mappings.length === 0) {
          throw new Error('No field mappings defined');
        }

        // Update status to running
        await supabase
          .from('crm_migrations')
          .update({ 
            status: 'running', 
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', migration_id);

        // Process records in background (simulated - in production use queue)
        processRecordsAsync(supabase, migration_id, mappings);

        return new Response(JSON.stringify({
          success: true,
          message: 'Migration started'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === PAUSE MIGRATION ===
      case 'pause_migration': {
        const { migration_id } = body;

        const { error } = await supabase
          .from('crm_migrations')
          .update({ status: 'paused', updated_at: new Date().toISOString() })
          .eq('id', migration_id);

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === RESUME MIGRATION ===
      case 'resume_migration': {
        const { migration_id } = body;
        
        if (!migration_id) {
          return new Response(JSON.stringify({
            success: false,
            error: 'migration_id is required'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get mappings
        const { data: mappings } = await supabase
          .from('crm_field_mappings')
          .select('*')
          .eq('migration_id', migration_id);

        await supabase
          .from('crm_migrations')
          .update({ status: 'running', updated_at: new Date().toISOString() })
          .eq('id', migration_id);

        // Resume processing
        processRecordsAsync(supabase, migration_id, mappings || []);

        return new Response(JSON.stringify({
          success: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === CANCEL MIGRATION ===
      case 'cancel_migration': {
        const { migration_id } = body;

        const { error } = await supabase
          .from('crm_migrations')
          .update({ 
            status: 'cancelled', 
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', migration_id);

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === ROLLBACK MIGRATION ===
      case 'rollback_migration': {
        const { migration_id } = body;

        // Get migration with rollback data
        const { data: migration } = await supabase
          .from('crm_migrations')
          .select('*')
          .eq('id', migration_id)
          .single();

        if (!migration?.can_rollback) {
          throw new Error('This migration cannot be rolled back');
        }

        // Get migrated records
        const { data: records } = await supabase
          .from('crm_migration_records')
          .select('*')
          .eq('migration_id', migration_id)
          .eq('status', 'success');

        // Delete migrated records from target tables
        for (const record of records || []) {
          if (record.target_table && record.target_record_id) {
            await supabase
              .from(record.target_table)
              .delete()
              .eq('id', record.target_record_id);
          }
        }

        // Update records status
        await supabase
          .from('crm_migration_records')
          .update({ status: 'rolled_back' })
          .eq('migration_id', migration_id)
          .eq('status', 'success');

        // Update migration status
        await supabase
          .from('crm_migrations')
          .update({ 
            status: 'rollback',
            can_rollback: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', migration_id);

        return new Response(JSON.stringify({
          success: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === LIST RECORDS ===
      case 'list_records': {
        const { migration_id, status, limit = 100 } = body;

        let query = supabase
          .from('crm_migration_records')
          .select('*')
          .eq('migration_id', migration_id);
        
        if (status) {
          query = query.eq('status', status);
        }

        const { data: records, error } = await query
          .order('record_index', { ascending: true })
          .limit(limit);

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          records
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === GET STATUS ===
      case 'get_status': {
        const { migration_id } = body;

        const { data: migration, error } = await supabase
          .from('crm_migrations')
          .select('*')
          .eq('id', migration_id)
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          migration
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === GET STATS ===
      case 'get_stats': {
        const { data: migrations } = await supabase
          .from('crm_migrations')
          .select('*');

        const total = migrations?.length || 0;
        const completed = migrations?.filter(m => m.status === 'completed').length || 0;
        const failed = migrations?.filter(m => m.status === 'failed').length || 0;
        const totalRecords = migrations?.reduce((sum, m) => sum + (m.migrated_records || 0), 0) || 0;

        const migrationsByCrm: Record<string, number> = {};
        migrations?.forEach(m => {
          migrationsByCrm[m.source_crm] = (migrationsByCrm[m.source_crm] || 0) + 1;
        });

        const stats = {
          total_migrations: total,
          completed_migrations: completed,
          failed_migrations: failed,
          total_records_migrated: totalRecords,
          success_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
          avg_migration_time_ms: 0, // Would calculate from actual data
          migrations_by_crm: migrationsByCrm
        };

        return new Response(JSON.stringify({
          success: true,
          stats
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === SAVE TEMPLATE ===
      case 'save_template': {
        const { name, source_crm, mappings, is_public } = body;

        const { data: template, error } = await supabase
          .from('crm_mapping_templates')
          .insert({
            template_name: name,
            source_crm,
            field_mappings: mappings,
            is_public: is_public || false,
            created_by: userId
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          template
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === APPLY TEMPLATE ===
      case 'apply_template': {
        const { migration_id, template_id } = body;

        const { data: template } = await supabase
          .from('crm_mapping_templates')
          .select('*')
          .eq('id', template_id)
          .single();

        if (!template) {
          throw new Error('Template not found');
        }

        // Delete existing mappings
        await supabase
          .from('crm_field_mappings')
          .delete()
          .eq('migration_id', migration_id);

        // Apply template mappings
        const mappingsToInsert = (template.field_mappings as unknown[]).map((m: unknown) => ({
          ...(m as Record<string, unknown>),
          migration_id
        }));

        const { data: newMappings, error } = await supabase
          .from('crm_field_mappings')
          .insert(mappingsToInsert)
          .select();

        if (error) throw error;

        // Update template usage count
        await supabase
          .from('crm_mapping_templates')
          .update({ usage_count: (template.usage_count || 0) + 1 })
          .eq('id', template_id);

        return new Response(JSON.stringify({
          success: true,
          mappings: newMappings
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === GENERATE AI MAPPINGS ===
      case 'generate_ai_mappings': {
        const detectedFields = (body as any).detected_fields as Array<{
          name: string;
          type: string;
          sample_values: unknown[];
          null_count: number;
        }>;
        const sourceCrm = body.source_crm;

        if (!LOVABLE_API_KEY) {
          // Fallback: generate basic mappings without AI
          const targetFields = ['name', 'email', 'phone', 'address', 'city', 'country', 'cif', 'sector', 'notes'];
          const mappings = detectedFields.map(field => {
            const fieldLower = field.name.toLowerCase();
            let targetField = 'notes';
            let confidence = 0.3;

            // Basic matching
            if (fieldLower.includes('name') || fieldLower.includes('nombre')) {
              targetField = 'name';
              confidence = 0.85;
            } else if (fieldLower.includes('email') || fieldLower.includes('correo')) {
              targetField = 'email';
              confidence = 0.9;
            } else if (fieldLower.includes('phone') || fieldLower.includes('telefono') || fieldLower.includes('tel')) {
              targetField = 'phone';
              confidence = 0.85;
            } else if (fieldLower.includes('address') || fieldLower.includes('direccion')) {
              targetField = 'address';
              confidence = 0.8;
            } else if (fieldLower.includes('city') || fieldLower.includes('ciudad')) {
              targetField = 'city';
              confidence = 0.85;
            } else if (fieldLower.includes('country') || fieldLower.includes('pais')) {
              targetField = 'country';
              confidence = 0.85;
            } else if (fieldLower.includes('cif') || fieldLower.includes('nif') || fieldLower.includes('tax')) {
              targetField = 'cif';
              confidence = 0.8;
            } else if (fieldLower.includes('sector') || fieldLower.includes('industry')) {
              targetField = 'sector';
              confidence = 0.75;
            }

            return {
              source_field: field.name,
              target_table: 'companies',
              target_field: targetField,
              ai_confidence: confidence,
              is_auto_mapped: true
            };
          });

          return new Response(JSON.stringify({
            success: true,
            mappings
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Use AI for intelligent mapping
        const systemPrompt = `Eres un experto en migración de datos CRM. Tu tarea es mapear campos de origen a campos destino.

CAMPOS DESTINO DISPONIBLES:
- name: Nombre de la empresa/contacto
- email: Correo electrónico
- phone: Teléfono
- address: Dirección completa
- city: Ciudad
- country: País
- cif: CIF/NIF/Tax ID
- sector: Sector/Industria
- notes: Notas adicionales
- website: Sitio web
- contact_name: Nombre del contacto principal
- contact_position: Cargo del contacto

INSTRUCCIONES:
1. Analiza cada campo de origen por nombre, tipo y valores de ejemplo
2. Asigna el campo destino más apropiado
3. Asigna un nivel de confianza (0-1) basado en la claridad del mapeo
4. Considera el CRM de origen si se proporciona

RESPONDE EN JSON:
{
  "mappings": [
    {
      "source_field": "nombre_original",
      "target_table": "companies",
      "target_field": "campo_destino",
      "ai_confidence": 0.95,
      "transform_function": null,
      "reasoning": "breve explicación"
    }
  ]
}`;

        const userPrompt = `CRM de origen: ${sourceCrm || 'Desconocido'}

Campos detectados:
${JSON.stringify(detectedFields, null, 2)}

Genera los mapeos óptimos para estos campos.`;

        try {
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              temperature: 0.3,
              max_tokens: 2000,
            }),
          });

          if (!response.ok) {
            throw new Error(`AI API error: ${response.status}`);
          }

          const aiData = await response.json();
          const content = aiData.choices?.[0]?.message?.content;

          if (!content) throw new Error('No AI response');

          // Parse JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return new Response(JSON.stringify({
              success: true,
              mappings: parsed.mappings.map((m: any) => ({
                source_field: m.source_field,
                target_table: m.target_table || 'companies',
                target_field: m.target_field,
                ai_confidence: m.ai_confidence || 0.7,
                transform_function: m.transform_function,
                is_auto_mapped: true
              }))
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          throw new Error('Could not parse AI response');
        } catch (aiError) {
          console.error('[crm-migration-engine] AI mapping error:', aiError);
          // Fallback to basic mapping on AI error
          const mappings = detectedFields.map(field => ({
            source_field: field.name,
            target_table: 'companies',
            target_field: 'notes',
            ai_confidence: 0.3,
            is_auto_mapped: true
          }));

          return new Response(JSON.stringify({
            success: true,
            mappings
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // === VALIDATE MIGRATION (FASE 4) ===
      case 'validate_migration': {
        const { migration_id } = body;

        if (!migration_id) {
          throw new Error('migration_id is required');
        }

        // Get migration and records
        const { data: migration } = await supabase
          .from('crm_migrations')
          .select('*')
          .eq('id', migration_id)
          .single();

        if (!migration) {
          throw new Error('Migration not found');
        }

        const { data: records } = await supabase
          .from('crm_migration_records')
          .select('*')
          .eq('migration_id', migration_id)
          .eq('status', 'pending')
          .limit(500);

        const { data: mappings } = await supabase
          .from('crm_field_mappings')
          .select('*')
          .eq('migration_id', migration_id);

        // Update status to validating
        await supabase
          .from('crm_migrations')
          .update({ status: 'validating', updated_at: new Date().toISOString() })
          .eq('id', migration_id);

        // Run validations
        const validationResults = await runValidations(
          records || [],
          mappings || [],
          supabase
        );

        // Update records with validation results
        for (const result of validationResults.recordResults) {
          await supabase
            .from('crm_migration_records')
            .update({
              validation_errors: result.errors,
              warnings: result.warnings,
              is_duplicate: result.isDuplicate,
              duplicate_of: result.duplicateOf
            })
            .eq('id', result.recordId);
        }

        // Update migration with validation summary
        await supabase
          .from('crm_migrations')
          .update({
            status: validationResults.hasBlockingErrors ? 'failed' : 'mapping',
            warnings: validationResults.warnings,
            statistics: {
              ...(migration.statistics || {}),
              validation_completed_at: new Date().toISOString(),
              total_validated: validationResults.totalValidated,
              passed_validation: validationResults.passedCount,
              failed_validation: validationResults.failedCount,
              duplicates_found: validationResults.duplicatesFound,
              warnings_count: validationResults.warningsCount
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', migration_id);

        return new Response(JSON.stringify({
          success: true,
          validation: {
            totalValidated: validationResults.totalValidated,
            passed: validationResults.passedCount,
            failed: validationResults.failedCount,
            duplicates: validationResults.duplicatesFound,
            warnings: validationResults.warnings,
            hasBlockingErrors: validationResults.hasBlockingErrors,
            canProceed: !validationResults.hasBlockingErrors
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === CHECK DUPLICATES ===
      case 'check_duplicates': {
        const { migration_id, duplicate_fields, threshold = 0.85 } = body as any;

        if (!migration_id) {
          throw new Error('migration_id is required');
        }

        const { data: records } = await supabase
          .from('crm_migration_records')
          .select('id, source_data')
          .eq('migration_id', migration_id)
          .eq('status', 'pending');

        if (!records || records.length === 0) {
          return new Response(JSON.stringify({
            success: true,
            duplicates: [],
            summary: { internal: 0, external: 0 }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const fieldsToCheck = duplicate_fields || ['email', 'name', 'phone', 'cif'];
        
        // Check internal duplicates (within import)
        const internalDuplicates = findInternalDuplicates(records, fieldsToCheck, threshold);

        // Check external duplicates (against existing data)
        const externalDuplicates = await findExternalDuplicates(
          supabase,
          records,
          fieldsToCheck,
          threshold
        );

        // Update records with duplicate info
        for (const dup of [...internalDuplicates, ...externalDuplicates]) {
          await supabase
            .from('crm_migration_records')
            .update({
              is_duplicate: true,
              duplicate_of: dup.duplicateOf,
              warnings: [{ field: dup.field, message: `Posible duplicado: ${dup.reason}` }]
            })
            .eq('id', dup.recordId);
        }

        return new Response(JSON.stringify({
          success: true,
          duplicates: {
            internal: internalDuplicates,
            external: externalDuplicates
          },
          summary: {
            internal: internalDuplicates.length,
            external: externalDuplicates.length,
            total: internalDuplicates.length + externalDuplicates.length
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === GET VALIDATION RULES ===
      case 'get_validation_rules': {
        const rules = getDefaultValidationRules();
        
        return new Response(JSON.stringify({
          success: true,
          rules
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === APPLY TRANSFORMATIONS ===
      case 'apply_transformations': {
        const { migration_id, transformations } = body as any;

        if (!migration_id || !transformations) {
          throw new Error('migration_id and transformations are required');
        }

        const { data: records } = await supabase
          .from('crm_migration_records')
          .select('*')
          .eq('migration_id', migration_id)
          .eq('status', 'pending')
          .limit(500);

        if (!records) {
          return new Response(JSON.stringify({
            success: true,
            transformed: 0
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let transformedCount = 0;

        for (const record of records) {
          const transformedData = applyAdvancedTransformations(
            record.source_data as Record<string, unknown>,
            transformations
          );

          await supabase
            .from('crm_migration_records')
            .update({ source_data: transformedData })
            .eq('id', record.id);
          
          transformedCount++;
        }

        return new Response(JSON.stringify({
          success: true,
          transformed: transformedCount
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === PREVIEW TRANSFORMATION ===
      case 'preview_transformation': {
        const { source_data, transformation } = body as any;

        if (!source_data || !transformation) {
          throw new Error('source_data and transformation are required');
        }

        const result = applyAdvancedTransformations(source_data, [transformation]);

        return new Response(JSON.stringify({
          success: true,
          original: source_data,
          transformed: result,
          field: transformation.field,
          newValue: result[transformation.target_field || transformation.field]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === SKIP DUPLICATES ===
      case 'skip_duplicates': {
        const { migration_id } = body;

        if (!migration_id) {
          throw new Error('migration_id is required');
        }

        const { data: updateResult, error } = await supabase
          .from('crm_migration_records')
          .update({ status: 'skipped' })
          .eq('migration_id', migration_id)
          .eq('is_duplicate', true)
          .eq('status', 'pending')
          .select();

        if (error) throw error;

        // Update migration skipped count
        await supabase
          .from('crm_migrations')
          .update({
            skipped_records: (updateResult?.length || 0),
            updated_at: new Date().toISOString()
          })
          .eq('id', migration_id);

        return new Response(JSON.stringify({
          success: true,
          skipped: updateResult?.length || 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === FASE 5: ROLLBACK MIGRATION ===
      case 'rollback_migration': {
        const { migration_id, rollback_options } = body;

        if (!migration_id) {
          throw new Error('migration_id is required');
        }

        const dryRun = rollback_options?.dry_run ?? false;
        const preserveLogs = rollback_options?.preserve_logs ?? true;

        // Get migration and its successfully migrated records
        const { data: migration, error: migError } = await supabase
          .from('crm_migrations')
          .select('*')
          .eq('id', migration_id)
          .single();

        if (migError) throw migError;

        if (!migration.can_rollback) {
          throw new Error('Esta migración no permite rollback');
        }

        // Get records that were successfully migrated
        const { data: successRecords, error: recError } = await supabase
          .from('crm_migration_records')
          .select('*')
          .eq('migration_id', migration_id)
          .eq('status', 'success');

        if (recError) throw recError;

        const rollbackSummary = {
          total: successRecords?.length || 0,
          rolledBack: 0,
          failed: 0,
          errors: [] as Array<{ recordId: string; error: string }>
        };

        if (dryRun) {
          return new Response(JSON.stringify({
            success: true,
            dryRun: true,
            summary: {
              ...rollbackSummary,
              message: `Se encontraron ${rollbackSummary.total} registros para rollback`
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Execute rollback for each record
        for (const record of (successRecords || [])) {
          try {
            const targetTable = record.target_table || 'companies';
            const targetRecordId = record.target_record_id;

            if (targetRecordId) {
              // Delete the migrated record from target table
              const { error: delError } = await supabase
                .from(targetTable)
                .delete()
                .eq('id', targetRecordId);

              if (delError) {
                rollbackSummary.failed++;
                rollbackSummary.errors.push({
                  recordId: record.id,
                  error: delError.message
                });
              } else {
                // Update migration record status
                await supabase
                  .from('crm_migration_records')
                  .update({ status: 'rolled_back' })
                  .eq('id', record.id);
                
                rollbackSummary.rolledBack++;
              }
            }
          } catch (err) {
            rollbackSummary.failed++;
            rollbackSummary.errors.push({
              recordId: record.id,
              error: err instanceof Error ? err.message : 'Unknown error'
            });
          }
        }

        // Update migration status
        await supabase
          .from('crm_migrations')
          .update({
            status: 'rollback',
            rollback_data: {
              executed_at: new Date().toISOString(),
              summary: rollbackSummary,
              performed_by: userId
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', migration_id);

        return new Response(JSON.stringify({
          success: true,
          summary: rollbackSummary
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === FASE 5: SCHEDULE MIGRATION ===
      case 'schedule_migration': {
        const { migration_id, schedule_config } = body;

        if (!migration_id) {
          throw new Error('migration_id is required');
        }

        if (!schedule_config) {
          throw new Error('schedule_config is required');
        }

        // Calculate next run time based on cron or explicit time
        let nextRun = schedule_config.next_run;
        if (!nextRun && schedule_config.cron_expression) {
          // Simple next run calculation (add 24 hours by default)
          const now = new Date();
          now.setHours(now.getHours() + 24);
          nextRun = now.toISOString();
        }

        // Update migration with schedule config
        const { data: updated, error } = await supabase
          .from('crm_migrations')
          .update({
            config: {
              ...((migration_id as any)?.config || {}),
              schedule: {
                enabled: schedule_config.enabled,
                cron_expression: schedule_config.cron_expression,
                next_run: nextRun,
                timezone: schedule_config.timezone || 'Europe/Madrid',
                max_retries: schedule_config.max_retries || 3,
                retry_delay_minutes: schedule_config.retry_delay_minutes || 15,
                created_at: new Date().toISOString()
              }
            },
            status: schedule_config.enabled ? 'pending' : 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', migration_id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          migration: updated,
          nextRun
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === FASE 5: CREATE TEMPLATE FROM MIGRATION ===
      case 'create_template_from_migration': {
        const { migration_id, template_config } = body;

        if (!migration_id) {
          throw new Error('migration_id is required');
        }

        if (!template_config?.name) {
          throw new Error('template_config.name is required');
        }

        // Get migration and its mappings
        const { data: migration, error: migError } = await supabase
          .from('crm_migrations')
          .select('*')
          .eq('id', migration_id)
          .single();

        if (migError) throw migError;

        const { data: mappings, error: mapError } = await supabase
          .from('crm_field_mappings')
          .select('*')
          .eq('migration_id', migration_id);

        if (mapError) throw mapError;

        // Create template
        const { data: template, error: tmplError } = await supabase
          .from('crm_mapping_templates')
          .insert({
            template_name: template_config.name,
            source_crm: migration.source_crm,
            description: template_config.description || `Template generado desde migración "${migration.migration_name}"`,
            field_mappings: mappings || [],
            transform_rules: (mappings || [])
              .filter((m: any) => m.transform_function)
              .map((m: any) => ({
                source_field: m.source_field,
                target_field: m.target_field,
                transform: m.transform_function,
                params: m.transform_params
              })),
            validation_rules: (mappings || [])
              .flatMap((m: any) => m.validation_rules || []),
            is_default: false,
            is_public: template_config.is_public ?? false,
            usage_count: 0,
            success_rate: migration.status === 'completed' 
              ? Math.round((migration.migrated_records / migration.total_records) * 100) 
              : null,
            created_by: userId
          })
          .select()
          .single();

        if (tmplError) throw tmplError;

        return new Response(JSON.stringify({
          success: true,
          template
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === FASE 5: EXPORT MIGRATION DATA ===
      case 'export_migration': {
        const { migration_id, export_format = 'json' } = body;

        if (!migration_id) {
          throw new Error('migration_id is required');
        }

        // Get migration details
        const { data: migration, error: migError } = await supabase
          .from('crm_migrations')
          .select('*')
          .eq('id', migration_id)
          .single();

        if (migError) throw migError;

        // Get all records
        const { data: records, error: recError } = await supabase
          .from('crm_migration_records')
          .select('*')
          .eq('migration_id', migration_id);

        if (recError) throw recError;

        // Get mappings
        const { data: mappings, error: mapError } = await supabase
          .from('crm_field_mappings')
          .select('*')
          .eq('migration_id', migration_id);

        if (mapError) throw mapError;

        const exportData = {
          migration: {
            id: migration.id,
            name: migration.migration_name,
            source_crm: migration.source_crm,
            status: migration.status,
            statistics: migration.statistics,
            created_at: migration.created_at,
            completed_at: migration.completed_at
          },
          summary: {
            total_records: migration.total_records,
            migrated: migration.migrated_records,
            failed: migration.failed_records,
            skipped: migration.skipped_records
          },
          mappings: mappings?.map((m: any) => ({
            source_field: m.source_field,
            target_field: m.target_field,
            target_table: m.target_table,
            transform: m.transform_function,
            is_required: m.is_required
          })),
          records: records?.map((r: any) => ({
            index: r.record_index,
            status: r.status,
            source_data: r.source_data,
            target_data: r.target_data,
            error: r.error_message
          })),
          exported_at: new Date().toISOString()
        };

        if (export_format === 'csv') {
          // Convert to CSV format for records
          const csvHeaders = ['index', 'status', 'error'];
          const sourceFields = Object.keys(records?.[0]?.source_data || {});
          const allHeaders = [...csvHeaders, ...sourceFields.map(f => `source_${f}`)];
          
          const csvRows = [
            allHeaders.join(','),
            ...(records || []).map((r: any) => {
              const row = [
                r.record_index,
                r.status,
                r.error_message || ''
              ];
              sourceFields.forEach(f => {
                row.push(String(r.source_data?.[f] || '').replace(/,/g, ';'));
              });
              return row.join(',');
            })
          ];

          return new Response(JSON.stringify({
            success: true,
            format: 'csv',
            data: csvRows.join('\n'),
            filename: `migration_${migration_id}_export.csv`
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({
          success: true,
          format: 'json',
          data: exportData,
          filename: `migration_${migration_id}_export.json`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === FASE 5: GET MIGRATION HISTORY ===
      case 'get_migration_history': {
        const { migration_id } = body;

        if (!migration_id) {
          throw new Error('migration_id is required');
        }

        // Get migration with all related data
        const { data: migration, error: migError } = await supabase
          .from('crm_migrations')
          .select('*')
          .eq('id', migration_id)
          .single();

        if (migError) throw migError;

        // Build history timeline
        const history: Array<{ event: string; timestamp: string; details: Record<string, unknown> }> = [
          {
            event: 'created',
            timestamp: migration.created_at,
            details: { name: migration.migration_name, source: migration.source_crm }
          }
        ];

        if (migration.started_at) {
          history.push({
            event: 'started',
            timestamp: migration.started_at,
            details: { total_records: migration.total_records }
          });
        }

        if (migration.completed_at) {
          history.push({
            event: migration.status === 'completed' ? 'completed' : 'finished',
            timestamp: migration.completed_at,
            details: {
              migrated: migration.migrated_records,
              failed: migration.failed_records,
              skipped: migration.skipped_records
            }
          });
        }

        if (migration.rollback_data?.executed_at) {
          history.push({
            event: 'rollback',
            timestamp: migration.rollback_data.executed_at,
            details: migration.rollback_data.summary
          });
        }

        // Add error log entries
        (migration.error_log || []).forEach((err: any) => {
          history.push({
            event: 'error',
            timestamp: err.timestamp,
            details: { message: err.message, record_index: err.record_index }
          });
        });

        // Sort by timestamp
        history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        return new Response(JSON.stringify({
          success: true,
          migration_id,
          history,
          current_status: migration.status,
          can_rollback: migration.can_rollback
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // === FASE 5: CLONE MIGRATION ===
      case 'clone_migration': {
        const { migration_id, name } = body;

        if (!migration_id) {
          throw new Error('migration_id is required');
        }

        // Get original migration
        const { data: original, error: origError } = await supabase
          .from('crm_migrations')
          .select('*')
          .eq('id', migration_id)
          .single();

        if (origError) throw origError;

        // Get original mappings
        const { data: origMappings, error: mapError } = await supabase
          .from('crm_field_mappings')
          .select('*')
          .eq('migration_id', migration_id);

        if (mapError) throw mapError;

        // Create new migration
        const { data: newMigration, error: newError } = await supabase
          .from('crm_migrations')
          .insert({
            migration_name: name || `${original.migration_name} (copia)`,
            source_crm: original.source_crm,
            source_version: original.source_version,
            status: 'pending',
            total_records: 0,
            migrated_records: 0,
            failed_records: 0,
            skipped_records: 0,
            config: original.config,
            source_file_url: original.source_file_url,
            source_file_type: original.source_file_type,
            error_log: [],
            warnings: [],
            statistics: {},
            can_rollback: true,
            performed_by: userId
          })
          .select()
          .single();

        if (newError) throw newError;

        // Clone mappings
        if (origMappings && origMappings.length > 0) {
          const newMappings = origMappings.map((m: any) => ({
            migration_id: newMigration.id,
            source_field: m.source_field,
            source_field_type: m.source_field_type,
            target_table: m.target_table,
            target_field: m.target_field,
            target_field_type: m.target_field_type,
            transform_function: m.transform_function,
            transform_params: m.transform_params,
            default_value: m.default_value,
            is_required: m.is_required,
            is_primary_key: m.is_primary_key,
            is_auto_mapped: false,
            validation_rules: m.validation_rules,
            sample_values: []
          }));

          await supabase
            .from('crm_field_mappings')
            .insert(newMappings);
        }

        return new Response(JSON.stringify({
          success: true,
          migration: newMigration,
          mappings_cloned: origMappings?.length || 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('[crm-migration-engine] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// === HELPER FUNCTIONS ===

function parseCSV(content: string): Array<Record<string, unknown>> {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    return record;
  });
}

function analyzeFields(data: Array<Record<string, unknown>>): Array<{
  name: string;
  type: string;
  sample_values: unknown[];
  null_count: number;
}> {
  if (data.length === 0) return [];

  const fields = Object.keys(data[0]);
  
  return fields.map(field => {
    const values = data.map(r => r[field]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    const samples = nonNullValues.slice(0, 5);
    
    // Detect type
    let type = 'string';
    if (nonNullValues.length > 0) {
      const sample = nonNullValues[0];
      if (typeof sample === 'number') {
        type = 'number';
      } else if (typeof sample === 'boolean') {
        type = 'boolean';
      } else if (typeof sample === 'string') {
        if (/^\d{4}-\d{2}-\d{2}/.test(sample)) {
          type = 'date';
        } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sample)) {
          type = 'email';
        } else if (/^(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(sample)) {
          type = 'phone';
        }
      }
    }

    return {
      name: field,
      type,
      sample_values: samples,
      null_count: values.length - nonNullValues.length
    };
  });
}

function detectCRM(fields: Array<{ name: string }>): string {
  const fieldNames = fields.map(f => f.name.toLowerCase());
  
  // Salesforce patterns
  if (fieldNames.some(f => f.includes('sfdc') || f.includes('salesforce'))) {
    return 'salesforce';
  }
  
  // HubSpot patterns
  if (fieldNames.some(f => f.includes('hubspot') || f.includes('hs_'))) {
    return 'hubspot';
  }
  
  // Pipedrive patterns
  if (fieldNames.some(f => f.includes('pipedrive') || f.includes('org_id'))) {
    return 'pipedrive';
  }

  return 'universal';
}

function calculateDataQuality(
  data: Array<Record<string, unknown>>,
  fields: Array<{ name: string; null_count: number }>
): number {
  if (data.length === 0) return 0;

  let score = 100;
  
  // Penalize for null values
  fields.forEach(field => {
    const nullPercentage = (field.null_count / data.length) * 100;
    if (nullPercentage > 50) score -= 10;
    else if (nullPercentage > 25) score -= 5;
    else if (nullPercentage > 10) score -= 2;
  });

  // Penalize for duplicate rows
  const uniqueRows = new Set(data.map(r => JSON.stringify(r)));
  const duplicatePercentage = ((data.length - uniqueRows.size) / data.length) * 100;
  if (duplicatePercentage > 20) score -= 15;
  else if (duplicatePercentage > 10) score -= 8;
  else if (duplicatePercentage > 5) score -= 3;

  return Math.max(0, Math.min(100, score));
}

function generateWarnings(
  data: Array<Record<string, unknown>>,
  fields: Array<{ name: string; null_count: number }>
): string[] {
  const warnings: string[] = [];

  fields.forEach(field => {
    const nullPercentage = (field.null_count / data.length) * 100;
    if (nullPercentage > 50) {
      warnings.push(`Campo "${field.name}" tiene ${nullPercentage.toFixed(0)}% de valores vacíos`);
    }
  });

  const uniqueRows = new Set(data.map(r => JSON.stringify(r)));
  if (uniqueRows.size < data.length) {
    warnings.push(`Se detectaron ${data.length - uniqueRows.size} registros duplicados`);
  }

  return warnings;
}

function generateRecommendations(
  fields: Array<{ name: string; type: string }>,
  mappings: Array<Record<string, unknown>>
): string[] {
  const recommendations: string[] = [];

  const unmappedFields = fields.filter(
    f => !mappings.some(m => m.source_field === f.name)
  );

  if (unmappedFields.length > 0) {
    recommendations.push(`${unmappedFields.length} campos no tienen mapeo sugerido. Revísalos manualmente.`);
  }

  const lowConfidence = mappings.filter(m => (m.confidence as number) < 0.7);
  if (lowConfidence.length > 0) {
    recommendations.push(`${lowConfidence.length} mapeos tienen baja confianza. Verifica antes de migrar.`);
  }

  return recommendations;
}

async function processRecordsAsync(
  supabase: any,
  migrationId: string,
  mappings: Array<Record<string, unknown>>
): Promise<void> {
  // This would be a background job in production
  // For now, process a batch
  
  const { data: records } = await supabase
    .from('crm_migration_records')
    .select('*')
    .eq('migration_id', migrationId)
    .eq('status', 'pending')
    .limit(50);

  if (!records || records.length === 0) {
    // Mark migration as completed
    await supabase
      .from('crm_migrations')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', migrationId);
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const record of records as any[]) {
    try {
      // Apply mappings to transform data
      const targetData = applyMappings(record.source_data, mappings);
      
      // Determine target table (default to companies)
      const targetTable = 'companies';
      
      // Insert into target table
      const { data: inserted, error } = await supabase
        .from(targetTable)
        .insert(targetData as any)
        .select()
        .single();

      if (error) {
        await supabase
          .from('crm_migration_records')
          .update({ 
            status: 'failed',
            error_message: error.message
          } as any)
          .eq('id', record.id);
        failCount++;
      } else {
        await supabase
          .from('crm_migration_records')
          .update({ 
            status: 'success',
            target_data: targetData,
            target_table: targetTable,
            target_record_id: (inserted as any).id
          } as any)
          .eq('id', record.id);
        successCount++;
      }
    } catch (err) {
      await supabase
        .from('crm_migration_records')
        .update({ 
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Unknown error'
        } as any)
        .eq('id', record.id);
      failCount++;
    }
  }

  // Update migration counts
  const { data: migration } = await supabase
    .from('crm_migrations')
    .select('migrated_records, failed_records')
    .eq('id', migrationId)
    .single();

  await supabase
    .from('crm_migrations')
    .update({
      migrated_records: ((migration as any)?.migrated_records || 0) + successCount,
      failed_records: ((migration as any)?.failed_records || 0) + failCount,
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', migrationId);
}

function applyMappings(
  sourceData: Record<string, unknown>,
  mappings: Array<Record<string, unknown>>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  mappings.forEach(mapping => {
    const sourceField = mapping.source_field as string;
    const targetField = mapping.target_field as string;
    const transform = mapping.transform_function as string;
    const defaultValue = mapping.default_value;

    let value = sourceData[sourceField];

    // Apply transform
    if (value !== null && value !== undefined) {
      switch (transform) {
        case 'lowercase':
          value = String(value).toLowerCase();
          break;
        case 'uppercase':
          value = String(value).toUpperCase();
          break;
        case 'trim':
          value = String(value).trim();
          break;
        case 'number':
          value = Number(value) || 0;
          break;
        case 'date':
          value = new Date(String(value)).toISOString();
          break;
      }
    } else if (defaultValue !== undefined) {
      value = defaultValue;
    }

    if (value !== undefined) {
      result[targetField] = value;
    }
  });

  return result;
}

// === FASE 4: VALIDATION FUNCTIONS ===

interface ValidationResult {
  totalValidated: number;
  passedCount: number;
  failedCount: number;
  duplicatesFound: number;
  warningsCount: number;
  hasBlockingErrors: boolean;
  warnings: Array<{ message: string; field?: string }>;
  recordResults: Array<{
    recordId: string;
    errors: Array<{ field: string; message: string }>;
    warnings: Array<{ field: string; message: string }>;
    isDuplicate: boolean;
    duplicateOf?: string;
  }>;
}

async function runValidations(
  records: Array<Record<string, unknown>>,
  mappings: Array<Record<string, unknown>>,
  supabase: any
): Promise<ValidationResult> {
  const result: ValidationResult = {
    totalValidated: records.length,
    passedCount: 0,
    failedCount: 0,
    duplicatesFound: 0,
    warningsCount: 0,
    hasBlockingErrors: false,
    warnings: [],
    recordResults: []
  };

  const rules = getDefaultValidationRules();

  for (const record of records) {
    const recordResult = {
      recordId: record.id as string,
      errors: [] as Array<{ field: string; message: string }>,
      warnings: [] as Array<{ field: string; message: string }>,
      isDuplicate: false,
      duplicateOf: undefined as string | undefined
    };

    const sourceData = record.source_data as Record<string, unknown>;

    // Validate each mapped field
    for (const mapping of mappings) {
      const sourceField = mapping.source_field as string;
      const targetField = mapping.target_field as string;
      const isRequired = mapping.is_required as boolean;
      const value = sourceData[sourceField];

      // Required field check
      if (isRequired && (value === null || value === undefined || value === '')) {
        recordResult.errors.push({
          field: sourceField,
          message: `Campo requerido "${sourceField}" está vacío`
        });
      }

      // Apply field-specific validation rules
      const fieldRules = rules.filter(r => 
        r.targetField === targetField || r.applies_to_all
      );

      for (const rule of fieldRules) {
        const validationError = validateField(value, rule);
        if (validationError) {
          if (rule.severity === 'error') {
            recordResult.errors.push({ field: sourceField, message: validationError });
          } else {
            recordResult.warnings.push({ field: sourceField, message: validationError });
          }
        }
      }
    }

    // Update counts
    if (recordResult.errors.length > 0) {
      result.failedCount++;
      result.hasBlockingErrors = true;
    } else {
      result.passedCount++;
    }

    result.warningsCount += recordResult.warnings.length;
    result.recordResults.push(recordResult);
  }

  return result;
}

function getDefaultValidationRules(): Array<{
  name: string;
  targetField: string;
  type: string;
  pattern?: string;
  min?: number;
  max?: number;
  severity: 'error' | 'warning';
  message: string;
  applies_to_all?: boolean;
}> {
  return [
    {
      name: 'email_format',
      targetField: 'email',
      type: 'regex',
      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      severity: 'error',
      message: 'Formato de email inválido'
    },
    {
      name: 'phone_format',
      targetField: 'phone',
      type: 'regex',
      pattern: '^[+]?[0-9\\s\\-().]{6,20}$',
      severity: 'warning',
      message: 'Formato de teléfono posiblemente inválido'
    },
    {
      name: 'cif_format',
      targetField: 'cif',
      type: 'regex',
      pattern: '^[A-Za-z][0-9]{7,8}[A-Za-z0-9]?$',
      severity: 'warning',
      message: 'Formato de CIF/NIF posiblemente inválido'
    },
    {
      name: 'name_length',
      targetField: 'name',
      type: 'length',
      min: 2,
      max: 200,
      severity: 'error',
      message: 'Nombre debe tener entre 2 y 200 caracteres'
    },
    {
      name: 'postal_code',
      targetField: 'codigo_postal',
      type: 'regex',
      pattern: '^[0-9]{4,10}$',
      severity: 'warning',
      message: 'Código postal posiblemente inválido'
    },
    {
      name: 'website_format',
      targetField: 'website',
      type: 'regex',
      pattern: '^(https?:\\/\\/)?([\\da-z.-]+)\\.([a-z.]{2,6})([\\/\\w .-]*)*\\/?$',
      severity: 'warning',
      message: 'URL de sitio web posiblemente inválida'
    }
  ];
}

function validateField(
  value: unknown,
  rule: { type: string; pattern?: string; min?: number; max?: number; message: string }
): string | null {
  if (value === null || value === undefined || value === '') {
    return null; // Empty values handled by required check
  }

  const strValue = String(value);

  switch (rule.type) {
    case 'regex':
      if (rule.pattern) {
        const regex = new RegExp(rule.pattern, 'i');
        if (!regex.test(strValue)) {
          return rule.message;
        }
      }
      break;

    case 'length':
      if (rule.min !== undefined && strValue.length < rule.min) {
        return rule.message;
      }
      if (rule.max !== undefined && strValue.length > rule.max) {
        return rule.message;
      }
      break;

    case 'range':
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return 'Valor numérico inválido';
      }
      if (rule.min !== undefined && numValue < rule.min) {
        return rule.message;
      }
      if (rule.max !== undefined && numValue > rule.max) {
        return rule.message;
      }
      break;
  }

  return null;
}

interface DuplicateInfo {
  recordId: string;
  duplicateOf: string;
  field: string;
  reason: string;
  similarity: number;
}

function findInternalDuplicates(
  records: Array<{ id: string; source_data: Record<string, unknown> }>,
  fieldsToCheck: string[],
  threshold: number
): DuplicateInfo[] {
  const duplicates: DuplicateInfo[] = [];
  const seen = new Map<string, string>();

  for (const record of records) {
    const data = record.source_data as Record<string, unknown>;

    for (const field of fieldsToCheck) {
      const value = data[field];
      if (!value) continue;

      const normalizedValue = normalizeValue(String(value));
      const key = `${field}:${normalizedValue}`;

      if (seen.has(key)) {
        duplicates.push({
          recordId: record.id,
          duplicateOf: seen.get(key)!,
          field,
          reason: `Valor duplicado en "${field}": ${value}`,
          similarity: 1.0
        });
      } else {
        seen.set(key, record.id);
      }
    }
  }

  return duplicates;
}

async function findExternalDuplicates(
  supabase: any,
  records: Array<{ id: string; source_data: Record<string, unknown> }>,
  fieldsToCheck: string[],
  threshold: number
): Promise<DuplicateInfo[]> {
  const duplicates: DuplicateInfo[] = [];

  // Get existing companies for comparison
  const { data: existingCompanies } = await supabase
    .from('companies')
    .select('id, nombre, email, telefono, cif')
    .limit(1000);

  if (!existingCompanies || existingCompanies.length === 0) {
    return duplicates;
  }

  const fieldMap: Record<string, string> = {
    'name': 'nombre',
    'nombre': 'nombre',
    'email': 'email',
    'phone': 'telefono',
    'telefono': 'telefono',
    'cif': 'cif',
    'nif': 'cif'
  };

  for (const record of records) {
    const data = record.source_data as Record<string, unknown>;

    for (const sourceField of fieldsToCheck) {
      const value = data[sourceField];
      if (!value) continue;

      const targetField = fieldMap[sourceField.toLowerCase()];
      if (!targetField) continue;

      const normalizedValue = normalizeValue(String(value));

      for (const existing of existingCompanies) {
        const existingValue = existing[targetField];
        if (!existingValue) continue;

        const normalizedExisting = normalizeValue(String(existingValue));

        // Check exact match or similarity
        if (normalizedValue === normalizedExisting) {
          duplicates.push({
            recordId: record.id,
            duplicateOf: existing.id,
            field: sourceField,
            reason: `Ya existe en BD: ${sourceField}="${value}"`,
            similarity: 1.0
          });
          break; // Only report first match per record
        }

        // Fuzzy match for names
        if (targetField === 'nombre' && threshold < 1.0) {
          const similarity = calculateSimilarity(normalizedValue, normalizedExisting);
          if (similarity >= threshold) {
            duplicates.push({
              recordId: record.id,
              duplicateOf: existing.id,
              field: sourceField,
              reason: `Similar en BD (${Math.round(similarity * 100)}%): "${existingValue}"`,
              similarity
            });
            break;
          }
        }
      }
    }
  }

  return duplicates;
}

function normalizeValue(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longerLength - distance) / longerLength;
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const matrix: number[][] = [];

  for (let i = 0; i <= m; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= n; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[m][n];
}

interface Transformation {
  field: string;
  target_field?: string;
  type: string;
  params?: Record<string, unknown>;
}

function applyAdvancedTransformations(
  data: Record<string, unknown>,
  transformations: Transformation[]
): Record<string, unknown> {
  const result = { ...data };

  for (const transform of transformations) {
    const sourceValue = result[transform.field];
    const targetField = transform.target_field || transform.field;

    switch (transform.type) {
      case 'trim':
        if (typeof sourceValue === 'string') {
          result[targetField] = sourceValue.trim();
        }
        break;

      case 'lowercase':
        if (typeof sourceValue === 'string') {
          result[targetField] = sourceValue.toLowerCase();
        }
        break;

      case 'uppercase':
        if (typeof sourceValue === 'string') {
          result[targetField] = sourceValue.toUpperCase();
        }
        break;

      case 'capitalize':
        if (typeof sourceValue === 'string') {
          result[targetField] = sourceValue
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
        break;

      case 'replace':
        if (typeof sourceValue === 'string' && transform.params) {
          const { search, replace } = transform.params as { search: string; replace: string };
          result[targetField] = sourceValue.replace(new RegExp(search, 'g'), replace);
        }
        break;

      case 'extract':
        if (typeof sourceValue === 'string' && transform.params?.pattern) {
          const match = sourceValue.match(new RegExp(transform.params.pattern as string));
          result[targetField] = match ? match[1] || match[0] : sourceValue;
        }
        break;

      case 'concat':
        if (transform.params?.fields) {
          const fields = transform.params.fields as string[];
          const separator = (transform.params.separator as string) || ' ';
          result[targetField] = fields
            .map(f => result[f])
            .filter(v => v !== null && v !== undefined)
            .join(separator);
        }
        break;

      case 'split':
        if (typeof sourceValue === 'string' && transform.params) {
          const separator = (transform.params.separator as string) || ',';
          const index = (transform.params.index as number) || 0;
          const parts = sourceValue.split(separator);
          result[targetField] = parts[index]?.trim() || sourceValue;
        }
        break;

      case 'date_format':
        if (sourceValue && transform.params?.format) {
          try {
            const date = new Date(String(sourceValue));
            result[targetField] = date.toISOString();
          } catch {
            result[targetField] = sourceValue;
          }
        }
        break;

      case 'number':
        if (sourceValue !== null && sourceValue !== undefined) {
          const num = Number(String(sourceValue).replace(/[^0-9.-]/g, ''));
          result[targetField] = isNaN(num) ? 0 : num;
        }
        break;

      case 'default':
        if (sourceValue === null || sourceValue === undefined || sourceValue === '') {
          result[targetField] = transform.params?.value;
        }
        break;

      case 'map':
        if (transform.params?.mapping) {
          const mapping = transform.params.mapping as Record<string, unknown>;
          const key = String(sourceValue).toLowerCase();
          result[targetField] = mapping[key] ?? sourceValue;
        }
        break;

      case 'normalize_phone':
        if (typeof sourceValue === 'string') {
          const cleaned = sourceValue.replace(/[^0-9+]/g, '');
          if (cleaned.length >= 9 && !cleaned.startsWith('+')) {
            result[targetField] = '+34' + cleaned;
          } else {
            result[targetField] = cleaned;
          }
        }
        break;

      case 'normalize_cif':
        if (typeof sourceValue === 'string') {
          result[targetField] = sourceValue.toUpperCase().replace(/[^A-Z0-9]/g, '');
        }
        break;
    }
  }

  return result;
}
