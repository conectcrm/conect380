const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  const target = process.env.REACT_APP_PROXY_TARGET || 'http://localhost:3001';

  // Core Admin no backend nao usa prefixo /api.
  app.use(
    '/api/core-admin',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        '^/api/core-admin': '/core-admin',
      },
      logLevel: 'warn',
    }),
  );

  // Compatibilidade transitoria para clientes/automacoes que ainda usam /api/admin.
  app.use(
    '/api/admin',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        '^/api/admin': '/core-admin',
      },
      logLevel: 'warn',
    }),
  );

  // Compatibilidade transitoria para clientes/automacoes que ainda usam /api/guardian.
  app.use(
    '/api/guardian',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        '^/api/guardian': '/core-admin',
      },
      logLevel: 'warn',
    }),
  );
};
