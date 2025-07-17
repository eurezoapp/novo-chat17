// This file serves as a redirect to the Supabase Edge Function
// Place this in your public folder or configure your web server to redirect /api/webhook to the Supabase function

// For Netlify, create a _redirects file with:
// /api/webhook https://your-project.supabase.co/functions/v1/whatsapp-webhook 200

// For Vercel, configure in vercel.json:
// {
//   "rewrites": [
//     {
//       "source": "/api/webhook",
//       "destination": "https://your-project.supabase.co/functions/v1/whatsapp-webhook"
//     }
//   ]
// }

// For Apache, use .htaccess:
// RewriteRule ^api/webhook$ https://your-project.supabase.co/functions/v1/whatsapp-webhook [P,L]

// For Nginx:
// location /api/webhook {
//     proxy_pass https://your-project.supabase.co/functions/v1/whatsapp-webhook;
// }

console.log('Webhook endpoint should be configured at server level to redirect to Supabase Edge Function');