// Netlify function to proxy webhook calls to Supabase Edge Function
exports.handler = async (event, context) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const functionUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;
  
  try {
    const response = await fetch(functionUrl, {
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json',
        ...event.headers
      },
      body: event.body
    });
    
    const data = await response.text();
    
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: data
    };
  } catch (error) {
    console.error('Webhook proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};