const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy for Sammy Labs API
  app.use(
    '/validate',
    createProxyMiddleware({
      target: 'https://app.sammylabs.com',
      changeOrigin: true,
      secure: true,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('[Proxy] Forwarding request to:', proxyReq.path);
        // Remove any problematic headers that might cause CORS issues
        proxyReq.removeHeader('Origin');
      },
      onProxyRes: (proxyRes, req, res) => {
        // Add CORS headers to the response
        proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
      },
      onError: (err, req, res) => {
        console.error('[Proxy] Error:', err);
      },
    })
  );

  // Generic proxy for any other Sammy Labs API endpoints
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://app.sammylabs.com',
      changeOrigin: true,
      secure: true,
      pathRewrite: {
        '^/api': '', // Remove /api prefix when forwarding
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('[Proxy] API request to:', proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        // Add CORS headers
        proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      },
    })
  );
};