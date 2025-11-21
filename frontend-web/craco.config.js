const webpack = require('webpack');
const path = require('path');

module.exports = {
  eslint: {
    enable: false, // Desabilitar ESLint no build (usar apenas TypeScript)
  },
  webpack: {
    configure: (webpackConfig) => {
      // Configurar aliases
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@': path.resolve(__dirname, 'src'),
        '@/components': path.resolve(__dirname, 'src/components'),
        '@/features': path.resolve(__dirname, 'src/features'),
        '@/contexts': path.resolve(__dirname, 'src/contexts'),
        '@/assets': path.resolve(__dirname, 'src/assets'),
        '@/utils': path.resolve(__dirname, 'src/utils'),
        '@/types': path.resolve(__dirname, 'src/types'),
        '@/services': path.resolve(__dirname, 'src/services'),
        '@/hooks': path.resolve(__dirname, 'src/hooks')
      };

      // Configurar fallbacks para módulos Node.js
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "buffer": require.resolve("buffer"),
        "util": require.resolve("util"),
        "url": require.resolve("url"),
        "assert": require.resolve("assert"),
        "process": require.resolve("process/browser.js")
      };

      // Adicionar plugins necessários
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser.js',
        })
      ];

      return webpackConfig;
    },
  },
  devServer: {
    historyApiFallback: {
      // Redirecionar todas as rotas para index.html (SPA behavior)
      index: '/index.html',
      // Configuração específica para o portal
      rewrites: [
        { from: /^\/portal\/.*$/, to: '/index.html' }
      ]
    }
  },
};
