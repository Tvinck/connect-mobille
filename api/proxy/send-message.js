// Vercel Serverless Function — proxy to avoid CORS
// connect-mobille.vercel.app/api/proxy/send-message → connect-4va6.vercel.app/api/shop/ggsel/send-message

const CONNECT_URL = process.env.CONNECT_URL || 'https://connect-4va6.vercel.app';

export default async function handler(req, res) {
  // Allow CORS from anywhere (this function is on the same origin as the client anyway)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`${CONNECT_URL}/api/shop/ggsel/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SHOP_API_KEY}` },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Proxy failed', details: err.message });
  }
}
