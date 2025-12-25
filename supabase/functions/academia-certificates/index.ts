import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CertificateRequest {
  action: 'generate' | 'verify' | 'get_user_certificates' | 'get_certificate_details';
  userId?: string;
  courseId?: string;
  enrollmentId?: string;
  certificateCode?: string;
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

    const { action, userId, courseId, enrollmentId, certificateCode } = await req.json() as CertificateRequest;

    console.log(`[academia-certificates] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'generate':
        systemPrompt = `Eres un sistema de generación de certificados académicos.

CONTEXTO:
- Generar certificados personalizados para estudiantes que completaron cursos
- Incluir información relevante del logro
- Crear código de verificación único

FORMATO DE RESPUESTA (JSON estricto):
{
  "certificate": {
    "title": "Certificado de Finalización",
    "subtitle": "Nombre del curso",
    "studentName": "Nombre del estudiante",
    "completionDate": "Fecha de finalización",
    "instructorName": "Nombre del instructor",
    "courseDuration": "Duración en horas",
    "skills": ["habilidad1", "habilidad2"],
    "grade": "Calificación obtenida",
    "certificateId": "ID único",
    "verificationUrl": "URL de verificación",
    "congratulatoryMessage": "Mensaje personalizado de felicitación"
  },
  "metadata": {
    "generatedAt": "timestamp",
    "isValid": true,
    "expiresAt": null
  }
}`;

        userPrompt = `Genera un certificado para:
- Usuario ID: ${userId}
- Curso ID: ${courseId}
- Enrollment ID: ${enrollmentId}

Crea un mensaje de felicitación personalizado y profesional.`;
        break;

      case 'verify':
        systemPrompt = `Eres un sistema de verificación de certificados.

FORMATO DE RESPUESTA (JSON estricto):
{
  "isValid": true,
  "certificate": {
    "studentName": "Nombre",
    "courseName": "Curso",
    "completionDate": "Fecha",
    "issuer": "Emisor"
  },
  "verificationDetails": {
    "verifiedAt": "timestamp",
    "checksPerformed": ["check1", "check2"],
    "status": "verified" | "invalid" | "expired"
  }
}`;

        userPrompt = `Verifica el certificado con código: ${certificateCode}`;
        break;

      case 'get_user_certificates':
        systemPrompt = `Eres un sistema de gestión de certificados.

FORMATO DE RESPUESTA (JSON estricto):
{
  "certificates": [
    {
      "id": "uuid",
      "courseName": "Nombre del curso",
      "completionDate": "Fecha",
      "certificateCode": "Código",
      "status": "active" | "expired",
      "downloadUrl": "URL"
    }
  ],
  "totalCertificates": 0,
  "recentAchievements": ["logro1", "logro2"]
}`;

        userPrompt = `Obtén todos los certificados del usuario: ${userId}`;
        break;

      case 'get_certificate_details':
        systemPrompt = `Eres un sistema de consulta de certificados.

FORMATO DE RESPUESTA (JSON estricto):
{
  "certificate": {
    "id": "uuid",
    "studentName": "Nombre",
    "courseName": "Curso",
    "instructorName": "Instructor",
    "completionDate": "Fecha",
    "grade": "Calificación",
    "skills": ["skill1"],
    "duration": "Horas",
    "certificateCode": "Código",
    "verificationUrl": "URL",
    "pdfUrl": "URL del PDF"
  },
  "courseDetails": {
    "category": "Categoría",
    "level": "Nivel",
    "description": "Descripción"
  }
}`;

        userPrompt = `Obtén detalles del certificado: ${certificateCode}`;
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
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: 'Demasiadas solicitudes. Intenta más tarde.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error('No content in AI response');

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('[academia-certificates] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[academia-certificates] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[academia-certificates] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
