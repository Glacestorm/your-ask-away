import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extended language names for AI translation
const languageNames: Record<string, string> = {
  en: "English",
  es: "Spanish",
  ca: "Catalan",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  "pt-BR": "Brazilian Portuguese",
  "zh-CN": "Simplified Chinese",
  "zh-TW": "Traditional Chinese",
  ja: "Japanese",
  ko: "Korean",
  ru: "Russian",
  ar: "Arabic",
  he: "Hebrew",
  nl: "Dutch",
  pl: "Polish",
  cs: "Czech",
  ro: "Romanian",
  hu: "Hungarian",
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian",
  fi: "Finnish",
  el: "Greek",
  tr: "Turkish",
  uk: "Ukrainian",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  ms: "Malay",
  hi: "Hindi",
  bn: "Bengali",
  tl: "Filipino",
  ur: "Urdu",
  fa: "Persian",
  bg: "Bulgarian",
  hr: "Croatian",
  sk: "Slovak",
  sl: "Slovenian",
  et: "Estonian",
  lv: "Latvian",
  lt: "Lithuanian",
  af: "Afrikaans",
  "es-MX": "Mexican Spanish",
  "es-AR": "Argentinian Spanish",
  "en-US": "American English",
  "fr-CA": "Canadian French",
  ga: "Irish",
  is: "Icelandic",
  mt: "Maltese",
  lb: "Luxembourgish",
  bs: "Bosnian",
  sr: "Serbian",
  mk: "Macedonian",
  sq: "Albanian",
  ka: "Georgian",
  hy: "Armenian",
  az: "Azerbaijani",
  kk: "Kazakh",
  uz: "Uzbek",
  ne: "Nepali",
  si: "Sinhala",
  my: "Burmese",
  km: "Khmer",
  lo: "Lao",
  am: "Amharic",
  sw: "Swahili",
  ha: "Hausa",
  yo: "Yoruba",
  ig: "Igbo",
};

interface TranslationItem {
  key: string;
  text: string;
  namespace?: string;
}

interface BatchTranslateRequest {
  items: TranslationItem[];
  sourceLocale: string;
  targetLocale: string;
  saveToDb?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { items, sourceLocale, targetLocale, saveToDb = false }: BatchTranslateRequest = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or empty items array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!targetLocale) {
      return new Response(
        JSON.stringify({ error: "Missing targetLocale" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit batch size to avoid timeout
    const MAX_BATCH_SIZE = 50;
    const batchItems = items.slice(0, MAX_BATCH_SIZE);

    const sourceLang = languageNames[sourceLocale] || sourceLocale;
    const targetLang = languageNames[targetLocale] || targetLocale;

    // Build prompt for batch translation
    const textsToTranslate = batchItems.map((item, idx) => `[${idx}] ${item.text}`).join("\n");

    const prompt = `Translate the following UI texts from ${sourceLang} to ${targetLang}.
Maintain the original formatting, tone, and style.
Keep technical terms, proper nouns, and placeholders like {{variable}} as is.
Return ONLY a JSON array with the translated texts in the same order.
Each item should be an object with "index" and "translation" keys.

Texts to translate:
${textsToTranslate}

Return format (JSON only, no markdown):
[{"index": 0, "translation": "translated text"}, ...]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a professional translator specialized in UI/UX texts for enterprise software. Provide accurate, natural-sounding translations while preserving the original meaning, tone, and any placeholders. Always respond with valid JSON only, no markdown formatting.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      console.error("AI translation error:", response.status, bodyText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Translation service unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let rawContent = data?.choices?.[0]?.message?.content ?? "";

    // Clean markdown code blocks if present
    rawContent = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let translations: Array<{ index: number; translation: string }> = [];
    try {
      translations = JSON.parse(rawContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", rawContent);
      return new Response(
        JSON.stringify({ error: "Failed to parse translation response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map translations back to original items
    const results = batchItems.map((item, idx) => {
      const translated = translations.find(t => t.index === idx);
      return {
        key: item.key,
        namespace: item.namespace || "common",
        original: item.text,
        translation: translated?.translation || item.text,
      };
    });

    // Optionally save to database
    if (saveToDb) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const insertData = results.map(r => ({
        translation_key: r.key,
        namespace: r.namespace,
        locale: targetLocale,
        value: r.translation,
        is_machine_translated: true,
        source_locale: sourceLocale,
        is_reviewed: false,
      }));

      // Upsert translations
      const { error: upsertError } = await supabase
        .from("cms_translations")
        .upsert(insertData, {
          onConflict: "translation_key,namespace,locale",
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error("Error saving translations:", upsertError);
      }
    }

    console.log(`Batch translated ${results.length} items from ${sourceLocale} to ${targetLocale}`);

    return new Response(
      JSON.stringify({
        success: true,
        sourceLocale,
        targetLocale,
        count: results.length,
        results,
        truncated: items.length > MAX_BATCH_SIZE,
        remaining: Math.max(0, items.length - MAX_BATCH_SIZE),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in batch translation:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
