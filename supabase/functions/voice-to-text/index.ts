import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audio } = await req.json()
    
    if (!audio) {
      throw new Error('No audio data provided')
    }

    console.log('[VoiceToText] Received audio, base64 length:', audio.length)

    // Decode base64 to binary
    const binaryString = atob(audio)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    console.log('[VoiceToText] Audio size:', bytes.length, 'bytes')

    // Use Lovable AI Gateway for transcription via Gemini
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured')
    }

    // Convert audio to base64 for Gemini multimodal
    const audioBase64 = audio

    // Use Gemini 2.5 Flash for audio transcription
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Transcribe the following audio recording exactly as spoken. Return ONLY the transcribed text, nothing else. If the audio is in Spanish or Catalan, transcribe it in that language. If the audio is unclear or empty, return an empty string.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:audio/webm;base64,${audioBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[VoiceToText] Lovable AI error:', response.status, errorText)
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add credits' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw new Error(`AI API error: ${response.status}`)
    }

    const result = await response.json()
    const transcribedText = result.choices?.[0]?.message?.content?.trim() || ''
    
    console.log('[VoiceToText] Transcription result:', transcribedText)

    return new Response(
      JSON.stringify({ text: transcribedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[VoiceToText] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
