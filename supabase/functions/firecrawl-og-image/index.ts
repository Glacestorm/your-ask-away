/**
 * firecrawl-og-image
 * Fetch the OG image from a given URL using Firecrawl (handles JS-rendered pages).
 * Returns { image_url, credit } or null values if not found.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured', image_url: null, credit: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Firecrawl scraping OG image from:', formattedUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        // Use rawHtml so we keep <head> metadata (og:image is usually there)
        formats: ['rawHtml'],
        onlyMainContent: false,
        waitFor: 2000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.text();
      console.error('Firecrawl API error:', response.status, errData);
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl error', image_url: null, credit: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const html: string =
      data?.data?.rawHtml ||
      data?.rawHtml ||
      data?.data?.html ||
      data?.html ||
      '';

    // Extract og:image and og:site_name
    const ogMatch =
      html.match(/<meta[^>]*property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image:secure_url["'][^>]*>/i) ||
      html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i);

    const twitterMatch =
      html.match(/<meta[^>]*name=["']twitter:image:src["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image:src["'][^>]*>/i) ||
      html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["'][^>]*>/i);

    const rawUrl = (ogMatch?.[1] || twitterMatch?.[1] || '').trim().replace(/&amp;/g, '&');

    let imageUrl: string | null = null;

    if (rawUrl) {
      try {
        if (rawUrl.startsWith('//')) {
          const base = new URL(formattedUrl);
          imageUrl = `${base.protocol}${rawUrl}`;
        } else if (rawUrl.startsWith('/')) {
          imageUrl = new URL(rawUrl, formattedUrl).toString();
        } else {
          imageUrl = new URL(rawUrl).toString();
        }
      } catch {
        console.warn('Invalid image URL:', rawUrl);
      }
    }

    const siteMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const credit = siteMatch?.[1]?.trim() || null;

    console.log('Extracted image:', imageUrl, 'credit:', credit);

    return new Response(
      JSON.stringify({ success: true, image_url: imageUrl, credit }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in firecrawl-og-image:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to scrape', image_url: null, credit: null }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
