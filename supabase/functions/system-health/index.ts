import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting system health check...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create client with anon key for user authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated and has admin role
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin or superadmin role
    const { data: roles, error: rolesError } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'superadmin', 'director_comercial']);

    if (rolesError || !roles || roles.length === 0) {
      console.log('User does not have required role:', user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authorized:', user.id, 'with roles:', roles.map(r => r.role));
    
    // Use service role for actual health checks
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check database connectivity
    const startTime = Date.now();
    const { error: pingError } = await supabase.from('profiles').select('count').limit(1);
    const dbResponseTime = Date.now() - startTime;

    const dbStatus = {
      connected: !pingError,
      responseTime: dbResponseTime,
      status: !pingError ? 'healthy' : 'error',
      error: pingError?.message || null,
    };

    console.log('Database status:', dbStatus);

    // Get table statistics
    const tables = [
      'companies',
      'profiles', 
      'visits',
      'products',
      'company_products',
      'status_colors',
      'notifications',
      'alerts',
    ];

    const tableStats: Record<string, any> = {};
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        tableStats[table] = {
          count: count || 0,
          status: error ? 'error' : 'healthy',
          error: error?.message || null,
        };
      } catch (err: any) {
        console.error(`Error checking table ${table}:`, err);
        tableStats[table] = {
          count: 0,
          status: 'error',
          error: err.message,
        };
      }
    }

    console.log('Table statistics:', tableStats);

    // Check storage buckets
    const buckets = ['avatars', 'company-photos', 'company-documents'];
    const storageStats: Record<string, any> = {};

    for (const bucket of buckets) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .list('', { limit: 1 });
        
        storageStats[bucket] = {
          accessible: !error,
          status: error ? 'error' : 'healthy',
          error: error?.message || null,
        };
      } catch (err: any) {
        console.error(`Error checking bucket ${bucket}:`, err);
        storageStats[bucket] = {
          accessible: false,
          status: 'error',
          error: err.message,
        };
      }
    }

    console.log('Storage statistics:', storageStats);

    // Get recent errors from audit logs
    const { data: recentErrors, error: errorsError } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Check authentication service
    const authStartTime = Date.now();
    const { error: authServiceError } = await supabase.auth.getUser();
    const authResponseTime = Date.now() - authStartTime;

    const authStatus = {
      status: authServiceError ? 'degraded' : 'healthy',
      responseTime: authResponseTime,
      error: authServiceError?.message || null,
    };

    console.log('Auth status:', authStatus);

    // Calculate overall system health
    const allHealthy = 
      dbStatus.status === 'healthy' &&
      authStatus.status === 'healthy' &&
      Object.values(tableStats).every((t: any) => t.status === 'healthy') &&
      Object.values(storageStats).every((s: any) => s.status === 'healthy');

    const overallStatus = allHealthy ? 'healthy' : 'degraded';

    const healthData = {
      overall: {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Deno.memoryUsage(),
      },
      database: dbStatus,
      authentication: authStatus,
      tables: tableStats,
      storage: storageStats,
      recentErrors: recentErrors || [],
      metrics: {
        totalCompanies: tableStats.companies?.count || 0,
        totalUsers: tableStats.profiles?.count || 0,
        totalVisits: tableStats.visits?.count || 0,
        totalProducts: tableStats.products?.count || 0,
      },
    };

    console.log('Health check completed successfully');

    return new Response(
      JSON.stringify(healthData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('System health check error:', error);
    
    return new Response(
      JSON.stringify({
        overall: {
          status: 'error',
          timestamp: new Date().toISOString(),
        },
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
