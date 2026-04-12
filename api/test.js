module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('[OAuth-Test] Endpoint hit - method:', req.method);
  return res.status(200).json({ 
    status: 'ok',
    message: 'OAuth test endpoint is working',
    method: req.method,
    timestamp: new Date().toISOString()
  });
};
