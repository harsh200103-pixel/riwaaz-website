const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return Response.json({}, { headers: corsHeaders });
}

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) return Response.json({ error: 'No URL provided' }, { status: 400, headers: corsHeaders });

    const res = await fetch('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(url));
    if (!res.ok) {
      return Response.json({ error: 'Failed to shorten' }, { status: 500, headers: corsHeaders });
    }
    
    const shortUrl = await res.text();
    return Response.json({ shortUrl }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
