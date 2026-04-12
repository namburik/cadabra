/**
 * Returns blog auth configuration based on BLOG_AUTH_REQUIRED env var.
 * GET /api/auth/blog-config
 */
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const authRequired = process.env.BLOG_AUTH_REQUIRED !== 'N';
  return res.status(200).json({ authRequired });
};
