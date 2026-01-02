import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Voice IDs for different languages
const VOICE_MAP: Record<string, string> = {
  es: 'JBFqnCBsd6RMkjVDRZzb', // George - Spanish
  ca: 'JBFqnCBsd6RMkjVDRZzb', // George - Catalan (uses Spanish voice)
  en: 'onwK4e9ZLuTAKqWW03F9', // Daniel - English
  fr: 'TX3LPaxmHKxFdv7VOQHJ', // Liam - French
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY no está configurada");
    }

    const { text, language, voiceId, speechRate } = await req.json();

    if (!text) {
      throw new Error("text es requerido");
    }

    const selectedVoiceId = voiceId || VOICE_MAP[language || 'es'] || VOICE_MAP.es;
    const rate = speechRate || 1.0;

    console.log("[erp-voice-tts] Generating speech for language:", language || 'es');
    console.log("[erp-voice-tts] Using voice ID:", selectedVoiceId);
    console.log("[erp-voice-tts] Text length:", text.length);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
            speed: rate,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[erp-voice-tts] API error:", response.status, errorText);
      throw new Error(`ElevenLabs TTS error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64 using btoa with chunking for large files
    const uint8Array = new Uint8Array(audioBuffer);
    let binaryString = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const audioBase64 = btoa(binaryString);

    console.log("[erp-voice-tts] Audio generated successfully, size:", audioBuffer.byteLength);

    return new Response(
      JSON.stringify({ 
        audioContent: audioBase64,
        format: 'mp3',
        language: language || 'es',
        voiceId: selectedVoiceId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[erp-voice-tts] Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
