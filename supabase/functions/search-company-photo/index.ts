import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchPhotoRequest {
  companyId: string;
  companyName: string;
  address: string;
  parroquia?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { companyId, companyName, address, parroquia } = await req.json() as SearchPhotoRequest;

    console.log(`Searching photo for: ${companyName}, ${address}`);

    // Construct search query for business facade
    const searchQuery = `${companyName} ${address} ${parroquia || ''} fachada tienda comercio Andorra`.trim();

    // Search for images using Bing Image Search API
    const bingApiKey = Deno.env.get('BING_SEARCH_API_KEY');
    
    if (!bingApiKey) {
      console.log('No Bing API key found, skipping photo search');
      return new Response(
        JSON.stringify({ success: false, error: 'Bing API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Search for images
    const searchResponse = await fetch(
      `https://api.bing.microsoft.com/v7.0/images/search?q=${encodeURIComponent(searchQuery)}&count=5&imageType=Photo&aspect=Square`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': bingApiKey,
        },
      }
    );

    if (!searchResponse.ok) {
      console.error('Bing search failed:', await searchResponse.text());
      return new Response(
        JSON.stringify({ success: false, error: 'Image search failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const searchData = await searchResponse.json();
    const images = searchData.value || [];

    if (images.length === 0) {
      console.log('No images found for:', companyName);
      return new Response(
        JSON.stringify({ success: false, error: 'No images found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get the first image
    const imageUrl = images[0].contentUrl;
    console.log('Found image:', imageUrl);

    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error('Failed to download image');
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to download image' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${companyId}/${timestamp}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('company-photos')
      .upload(fileName, imageBuffer, {
        contentType: imageBlob.type || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ success: false, error: uploadError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('Image uploaded:', uploadData.path);

    // Get current user (for uploaded_by)
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id || null;
    }

    // Create record in company_photos table
    const { error: insertError } = await supabaseClient
      .from('company_photos')
      .insert({
        company_id: companyId,
        photo_url: uploadData.path,
        notes: `Importada automáticamente desde búsqueda web`,
        uploaded_by: userId,
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log('Photo record created for company:', companyId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        photoUrl: uploadData.path,
        companyId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in search-company-photo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
