const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  const target = process.env.REACT_APP_PROXY_TARGET || 'http://localhost:3001';

  // Guardian BFF no backend nao usa prefixo /api.
  app.use(
    '/api/guardian',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        '^/api/guardian': '/guardian',
      },
      logLevel: 'warn',
    }),
  );
};
