import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the request is from an authenticated superadmin
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      throw new Error('No autorizado');
    }

    // Check if user is superadmin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roles || roles.role !== 'superadmin') {
      throw new Error('Solo superadministradores pueden gestionar usuarios');
    }

    const { action, userData } = await req.json();

    switch (action) {
      case 'create': {
        // Create user with email and password
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            full_name: userData.full_name,
          }
        });

        if (createError) throw createError;

        // Update profile with additional data
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            full_name: userData.full_name,
            cargo: userData.cargo || null,
            oficina: userData.oficina || null,
            gestor_number: userData.gestor_number || null,
          })
          .eq('id', newUser.user.id);

        if (profileError) throw profileError;

        // Set user role
        if (userData.role) {
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .update({ role: userData.role })
            .eq('user_id', newUser.user.id);

          if (roleError) throw roleError;
        }

        return new Response(
          JSON.stringify({ success: true, user: newUser.user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        // Update user email if provided
        if (userData.email) {
          const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(
            userData.id,
            { email: userData.email }
          );
          if (emailError) throw emailError;
        }

        // Update password if provided
        if (userData.password) {
          const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
            userData.id,
            { password: userData.password }
          );
          if (passwordError) throw passwordError;
        }

        // Update profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            full_name: userData.full_name,
            cargo: userData.cargo || null,
            oficina: userData.oficina || null,
            gestor_number: userData.gestor_number || null,
          })
          .eq('id', userData.id);

        if (profileError) throw profileError;

        // Update role if provided
        if (userData.role) {
          // Delete existing roles
          await supabaseAdmin
            .from('user_roles')
            .delete()
            .eq('user_id', userData.id);

          // Insert new role
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: userData.id, role: userData.role });

          if (roleError) throw roleError;
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        // Delete user from auth
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
          userData.id
        );

        if (deleteError) throw deleteError;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Acción no válida');
    }
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});