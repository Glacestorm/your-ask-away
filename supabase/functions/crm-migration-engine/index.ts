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
