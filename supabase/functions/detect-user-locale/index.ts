import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Country to language mapping with regional support for Spain
const COUNTRY_TO_LANGUAGE: Record<string, string> = {
  // Spain - default to Spanish, but frontend will handle regional detection
  'ES': 'es',
  // Andorra - Catalan
  'AD': 'ca',
  // France
  'FR': 'fr',
  // UK, Ireland, US, Canada, Australia, New Zealand
  'GB': 'en',
  'IE': 'en',
  'US': 'en',
  'CA': 'en',
  'AU': 'en',
  'NZ': 'en',
  // Portugal
  'PT': 'pt',
  // Brazil
  'BR': 'pt-BR',
  // Germany, Austria, Switzerland (German)
  'DE': 'de',
  'AT': 'de',
  'CH': 'de',
  // Italy
  'IT': 'it',
  // Netherlands, Belgium (Dutch)
  'NL': 'nl',
  'BE': 'nl',
  // Poland
  'PL': 'pl',
  // Russia
  'RU': 'ru',
  // Arabic countries
  'SA': 'ar',
  'AE': 'ar',
  'EG': 'ar',
  'MA': 'ar',
  // China
  'CN': 'zh-CN',
  'TW': 'zh-TW',
  'HK': 'zh-TW',
  // Japan
  'JP': 'ja',
  // Korea
  'KR': 'ko',
  // Nordic countries
  'SE': 'sv',
  'NO': 'no',
  'DK': 'da',
  'FI': 'fi',
  // Others
  'GR': 'el',
  'IL': 'he',
  'IN': 'hi',
  'ID': 'id',
  'MY': 'ms',
  'PH': 'tl',
  'RO': 'ro',
  'HU': 'hu',
  'CZ': 'cs',
  'TR': 'tr',
  'TH': 'th',
  'VN': 'vi',
  'UA': 'uk',
  // Latin America - Spanish
  'MX': 'es',
  'AR': 'es',
  'CO': 'es',
  'PE': 'es',
  'CL': 'es',
  'VE': 'es',
  'EC': 'es',
  'GT': 'es',
  'CU': 'es',
  'BO': 'es',
  'DO': 'es',
  'HN': 'es',
  'PY': 'es',
  'SV': 'es',
  'NI': 'es',
  'CR': 'es',
  'PA': 'es',
  'UY': 'es',
};

// Spanish regions to language mapping
const SPAIN_REGIONS: Record<string, string> = {
  // Catalonia
  'CT': 'ca',
  // Basque Country
  'PV': 'eu',
  // Galicia
  'GA': 'gl',
  // Balearic Islands
  'IB': 'ca',
  // Valencia (Valencian = Catalan variant)
  'VC': 'ca',
  // Aragon (some Catalan speaking areas)
  'AR': 'es', // Default to Spanish, Aragonese is tier 3
  // Asturias
  'AS': 'es', // Default to Spanish, Asturian is tier 2
  // Rest of Spain
  'AN': 'es', // Andalusia
  'MD': 'es', // Madrid
  'CL': 'es', // Castile and León
  'CM': 'es', // Castile-La Mancha
  'EX': 'es', // Extremadura
  'MU': 'es', // Murcia
  'RI': 'es', // La Rioja
  'NC': 'es', // Navarre
  'CB': 'es', // Cantabria
  'CN': 'es', // Canary Islands
  'CE': 'es', // Ceuta
  'ML': 'es', // Melilla
};

// Language display names for toast messages
const LANGUAGE_NAMES: Record<string, { name: string; nativeName: string }> = {
  'es': { name: 'Spanish', nativeName: 'Español' },
  'en': { name: 'English', nativeName: 'English' },
  'ca': { name: 'Catalan', nativeName: 'Català' },
  'eu': { name: 'Basque', nativeName: 'Euskara' },
  'gl': { name: 'Galician', nativeName: 'Galego' },
  'fr': { name: 'French', nativeName: 'Français' },
  'pt': { name: 'Portuguese', nativeName: 'Português' },
  'pt-BR': { name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
  'de': { name: 'German', nativeName: 'Deutsch' },
  'it': { name: 'Italian', nativeName: 'Italiano' },
  'nl': { name: 'Dutch', nativeName: 'Nederlands' },
  'pl': { name: 'Polish', nativeName: 'Polski' },
  'ru': { name: 'Russian', nativeName: 'Русский' },
  'ar': { name: 'Arabic', nativeName: 'العربية' },
  'zh-CN': { name: 'Chinese (Simplified)', nativeName: '简体中文' },
  'zh-TW': { name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  'ja': { name: 'Japanese', nativeName: '日本語' },
  'ko': { name: 'Korean', nativeName: '한국어' },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get country from Cloudflare header (available in Supabase Edge Functions)
    const country = req.headers.get('cf-ipcountry') || req.headers.get('CF-IPCountry') || '';
    const region = req.headers.get('cf-region') || req.headers.get('CF-Region') || '';
    
    console.log(`[detect-user-locale] Country: ${country}, Region: ${region}`);

    let detectedLocale = 'es'; // Default to Spanish
    let isRegionalLanguage = false;

    if (country) {
      // Check if it's Spain and we have regional info
      if (country === 'ES' && region) {
        const regionalLanguage = SPAIN_REGIONS[region.toUpperCase()];
        if (regionalLanguage && regionalLanguage !== 'es') {
          detectedLocale = regionalLanguage;
          isRegionalLanguage = true;
        } else {
          detectedLocale = 'es';
        }
      } else {
        // Use country mapping
        detectedLocale = COUNTRY_TO_LANGUAGE[country.toUpperCase()] || 'es';
      }
    }

    const languageInfo = LANGUAGE_NAMES[detectedLocale] || { name: 'Spanish', nativeName: 'Español' };

    const response = {
      success: true,
      detectedLocale,
      country: country || 'unknown',
      region: region || 'unknown',
      isRegionalLanguage,
      languageName: languageInfo.name,
      languageNativeName: languageInfo.nativeName,
      timestamp: new Date().toISOString(),
    };

    console.log(`[detect-user-locale] Response:`, JSON.stringify(response));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[detect-user-locale] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      detectedLocale: 'es', // Fallback
      languageName: 'Spanish',
      languageNativeName: 'Español',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
