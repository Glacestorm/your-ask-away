import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MetricAnalysis {
  metric: string;
  personal: number;
  office: number;
  team: number;
  gap_office: number;
  gap_team: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { metricAnalyses, language = 'es' } = await req.json();

    if (!metricAnalyses || !Array.isArray(metricAnalyses) || metricAnalyses.length === 0) {
      return new Response(JSON.stringify({ error: "Missing or invalid metric analyses" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find metrics that need improvement (below office or team average)
    const metricsNeedingImprovement = metricAnalyses.filter((m: MetricAnalysis) => 
      m.gap_office < 0 || m.gap_team < 0
    );

    if (metricsNeedingImprovement.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No metrics need improvement", 
        message: "All metrics are performing above average" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sort by priority (worst performing first)
    metricsNeedingImprovement.sort((a: MetricAnalysis, b: MetricAnalysis) => {
      const avgGapA = (a.gap_office + a.gap_team) / 2;
      const avgGapB = (b.gap_office + b.gap_team) / 2;
      return avgGapA - avgGapB;
    });

    // Get the top priority metric
    const topPriorityMetric = metricsNeedingImprovement[0];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert business performance coach specializing in sales and client relationship management. 
Create a detailed, actionable improvement plan for a sales manager (gestor) who needs to improve their performance in a specific metric.

The plan should:
- Be realistic and achievable within 30 days
- Include 4-6 specific action steps
- Each step should have a clear timeline (e.g., Week 1, Days 1-5, etc.)
- Focus on practical, concrete actions rather than generic advice
- Consider the specific context of banking/financial services
- Be motivating and encouraging while being direct about what needs improvement

Return a JSON object with this exact structure:
{
  "title": "Short, motivating title for the plan (max 60 characters)",
  "description": "Brief description of what this plan will achieve (max 200 characters)",
  "steps": [
    {
      "step_number": 1,
      "title": "Clear action step title (max 80 characters)",
      "description": "Detailed description of how to execute this step, why it's important, and what success looks like (max 300 characters)",
      "days_from_now": 7
    }
  ]
}`;

    const metricLabels: Record<string, Record<string, string>> = {
      es: {
        visits: "Visitas Totales",
        successful_visits: "Visitas Exitosas",
        companies: "Empresas Asignadas",
        products_offered: "Productos Ofrecidos",
        average_vinculacion: "Vinculación Promedio"
      },
      en: {
        visits: "Total Visits",
        successful_visits: "Successful Visits",
        companies: "Assigned Companies",
        products_offered: "Products Offered",
        average_vinculacion: "Average Linkage"
      }
    };

    const metricLabel = metricLabels[language]?.[topPriorityMetric.metric] || topPriorityMetric.metric;

    const userPrompt = `Create a 30-day improvement plan for a sales manager who needs to improve their performance in: ${metricLabel}

Current Performance:
- Personal average: ${topPriorityMetric.personal.toFixed(1)}%
- Office average: ${topPriorityMetric.office.toFixed(1)}%
- Team average: ${topPriorityMetric.team.toFixed(1)}%
- Gap vs office: ${topPriorityMetric.gap_office.toFixed(1)}%
- Gap vs team: ${topPriorityMetric.gap_team.toFixed(1)}%
- Status: ${topPriorityMetric.status}

The plan should respond in ${language === 'es' ? 'Spanish' : language === 'ca' ? 'Catalan' : language === 'fr' ? 'French' : 'English'}.

Create a realistic, achievable plan that will help close this performance gap.`;

    console.log("Calling Lovable AI for action plan generation...");
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const generatedPlan = JSON.parse(aiData.choices[0].message.content);

    console.log("AI generated plan:", generatedPlan);

    // Calculate target date (30 days from now)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);

    // Insert action plan
    const { data: planData, error: planError } = await supabase
      .from("action_plans")
      .insert({
        user_id: user.id,
        title: generatedPlan.title,
        description: generatedPlan.description,
        status: "active",
        target_metric: topPriorityMetric.metric,
        current_value: topPriorityMetric.personal,
        target_value: Math.max(topPriorityMetric.office, topPriorityMetric.team),
        gap_percentage: (topPriorityMetric.gap_office + topPriorityMetric.gap_team) / 2,
        target_date: targetDate.toISOString().split('T')[0],
      })
      .select()
      .single();

    if (planError) {
      console.error("Error creating action plan:", planError);
      return new Response(JSON.stringify({ error: "Failed to create action plan" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert action steps
    const stepsToInsert = generatedPlan.steps.map((step: any, index: number) => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (step.days_from_now || (index + 1) * 5));
      
      return {
        plan_id: planData.id,
        step_number: step.step_number || index + 1,
        title: step.title,
        description: step.description,
        due_date: dueDate.toISOString().split('T')[0],
        completed: false,
      };
    });

    const { error: stepsError } = await supabase
      .from("action_plan_steps")
      .insert(stepsToInsert);

    if (stepsError) {
      console.error("Error creating action steps:", stepsError);
      // Delete the plan if steps failed
      await supabase.from("action_plans").delete().eq("id", planData.id);
      return new Response(JSON.stringify({ error: "Failed to create action steps" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Action plan created successfully:", planData.id);

    return new Response(JSON.stringify({ 
      success: true, 
      plan_id: planData.id,
      plan: planData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-action-plan:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
