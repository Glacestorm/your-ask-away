import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkflowRequest {
  action: 'suggest_automation' | 'optimize_workflow' | 'analyze_bottlenecks' | 'generate_workflow';
  context?: {
    currentProcess?: string;
    painPoints?: string[];
    goals?: string[];
    existingWorkflows?: string[];
  };
  workflowId?: string;
  description?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { action, context, workflowId, description } = await req.json() as WorkflowRequest;
    console.log(`[workflow-automation-ia] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'suggest_automation':
        systemPrompt = `Eres un experto en automatización de procesos empresariales y BPM.

ANALIZA el proceso actual y sugiere automatizaciones.

RESPONDE EN JSON ESTRICTO:
{
  "automationOpportunities": [
    {
      "name": string,
      "description": string,
      "trigger": string,
      "actions": string[],
      "estimatedTimeSaved": string,
      "complexity": "low" | "medium" | "high",
      "priority": number
    }
  ],
  "quickWins": string[],
  "longTermImprovements": string[]
}`;
        userPrompt = `Proceso actual: ${context?.currentProcess}
Pain points: ${context?.painPoints?.join(', ')}
Objetivos: ${context?.goals?.join(', ')}`;
        break;

      case 'optimize_workflow':
        systemPrompt = `Eres un especialista en optimización de workflows empresariales.

RESPONDE EN JSON ESTRICTO:
{
  "currentInefficiencies": string[],
  "optimizations": [
    {
      "step": string,
      "currentState": string,
      "optimizedState": string,
      "improvement": string
    }
  ],
  "estimatedImprovement": {
    "timeReduction": string,
    "costSavings": string,
    "errorReduction": string
  },
  "implementationSteps": string[]
}`;
        userPrompt = `Optimiza el workflow: ${workflowId}
Descripción: ${description}`;
        break;

      case 'analyze_bottlenecks':
        systemPrompt = `Eres un analista de procesos especializado en identificar cuellos de botella.

RESPONDE EN JSON ESTRICTO:
{
  "bottlenecks": [
    {
      "location": string,
      "severity": "critical" | "high" | "medium" | "low",
      "cause": string,
      "impact": string,
      "solution": string
    }
  ],
  "flowAnalysis": {
    "avgProcessTime": string,
    "waitTimePercentage": number,
    "valueAddedPercentage": number
  },
  "recommendations": string[]
}`;
        userPrompt = `Analiza cuellos de botella en: ${context?.currentProcess}`;
        break;

      case 'generate_workflow':
        systemPrompt = `Eres un arquitecto de workflows que diseña procesos automatizados.

RESPONDE EN JSON ESTRICTO:
{
  "workflow": {
    "name": string,
    "description": string,
    "trigger": { "type": string, "conditions": string[] },
    "steps": [
      {
        "id": string,
        "type": "action" | "decision" | "wait" | "notification",
        "name": string,
        "config": object,
        "next": string | { "condition": string, "yes": string, "no": string }
      }
    ]
  },
  "requiredIntegrations": string[],
  "estimatedSetupTime": string
}`;
        userPrompt = `Genera un workflow para: ${description}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

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
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      result = { rawContent: content, parseError: true };
    }

    console.log(`[workflow-automation-ia] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[workflow-automation-ia] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
