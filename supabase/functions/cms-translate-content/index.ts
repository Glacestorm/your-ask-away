import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type GatewayErrorPayload = {
  error?: {
    type?: string;
    message?: string;
    details?: string;
  };
  type?: string;
  message?: string;
  details?: string;
};

function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function mapGatewayErrorToStatus(status: number, bodyText: string) {
  if (status === 429) return { status: 429, msg: "Rate limits exceeded, please try again later." };
  if (status === 402) return { status: 402, msg: "Payment required, please add funds to your Lovable AI workspace." };

  const parsed = safeJsonParse(bodyText) as GatewayErrorPayload | null;
  const t = parsed?.error?.type ?? parsed?.type;
  if (t === "rate_limited") return { status: 429, msg: "Rate limits exceeded, please try again later." };

  return { status: 503, msg: "Translation service unavailable" };
}

// Sleep helper for exponential backoff
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // If rate limited, wait and retry
      if (response.status === 429 && attempt < maxRetries - 1) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter 
          ? parseInt(retryAfter) * 1000 
          : baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
        console.log(`Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text, sourceLocale, targetLocale, contentType } = await req.json();

    if (!text || !targetLocale) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip translation for very short text or same locale
    if (text.trim().length < 2 || sourceLocale === targetLocale) {
      return new Response(
        JSON.stringify({
          success: true,
          translatedText: text,
          sourceLocale,
          targetLocale,
          skipped: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const languageNames: Record<string, string> = {
      en: "English",
      es: "Spanish",
      ca: "Catalan",
      eu: "Basque",
      gl: "Galician",
      fr: "French",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
    };

    const sourceLang = languageNames[sourceLocale] || sourceLocale;
    const targetLang = languageNames[targetLocale] || targetLocale;

    const prompt = `Translate the following ${contentType || "text"} from ${sourceLang} to ${targetLang}.
Maintain the original formatting, tone, and style.
If there are technical terms or proper nouns, keep them as is unless there's a well-known translation.
Only return the translated text, nothing else.

Text to translate:
${text}`;

    const response = await fetchWithRetry(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content:
                "You are a professional translator. Provide accurate, natural-sounding translations while preserving the original meaning and tone.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      },
      3,
      2000
    );

    if (!response.ok) {
      const bodyText = await response.text();
      console.error("AI translation error:", response.status, bodyText);
      const mapped = mapGatewayErrorToStatus(response.status, bodyText);

      return new Response(JSON.stringify({ error: mapped.msg }), {
        status: mapped.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const translatedText = String(data?.choices?.[0]?.message?.content ?? "").trim();

    console.log(`Translated content from ${sourceLocale} to ${targetLocale}`);

    return new Response(
      JSON.stringify({
        success: true,
        translatedText,
        sourceLocale,
        targetLocale,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error translating content:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
