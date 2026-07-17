// Vercel Serverless — прокси для получения деталей заказа GGSel
// GET /api/order/details?userId=00000000-0000-0000-0000-000037603757

const CONNECT_URL = process.env.CONNECT_URL || 'https://connect-4va6.vercel.app';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const response = await fetch(
      `${CONNECT_URL}/api/shop/ggsel/order-details?userId=${encodeURIComponent(userId)}`,
      { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SHOP_API_KEY}` } }
    );
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Proxy failed', details: err.message });
  }
}
