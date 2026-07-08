// Vercel Serverless — прокси для quick_replies из Supabase
// GET /api/support/quick-replies?platform=ggsel

const CONNECT_URL = process.env.CONNECT_URL || 'https://connect-4va6.vercel.app';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const { platform } = req.query;
  try {
    const response = await fetch(
      `${CONNECT_URL}/api/support/quick-replies?platform=${platform || 'all'}`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Proxy failed', details: err.message });
  }
}
