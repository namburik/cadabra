/**
 * Track authenticated user blog post views
 * POST /api/track
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) return res.status(200).json({ status: 'skipped' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch(e) { body = {}; } }

  const payload = {
    event: 'page_view',
    login: body.login || '',
    email: body.email || '',
    provider: body.provider || '',
    page: body.page || '',
    referrer: body.referrer || '',
    timestamp: new Date().toISOString()
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
    return res.status(200).json({ status: 'ok' });
  } catch(e) {
    return res.status(200).json({ status: 'error', message: e.message });
  }
};
