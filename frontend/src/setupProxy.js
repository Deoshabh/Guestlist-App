const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy API requests to avoid CORS issues in development
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_URL || 'https://api.bhaujanvypar.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/',
      },
      onProxyReq: (proxyReq) => {
        // Log proxy requests
        console.log('Proxying request:', proxyReq.path);
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ 
          message: 'Proxy error, application running in offline mode',
          error: err.message
        }));
      }
    })
  );
};
