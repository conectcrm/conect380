import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './index.css';
import App from './App';

// ============================================================================
// SENTRY (Error Tracking + Performance Monitoring)
// ============================================================================
const isProduction = process.env.NODE_ENV === 'production';
const enableSentry = process.env.REACT_APP_ENABLE_SENTRY === 'true';

if (enableSentry && process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.REACT_APP_VERSION || '1.0.0',

    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Amostragem de performance (10% em prod, 100% em dev)
    tracesSampleRate: isProduction ? 0.1 : 1.0,

    // Session Replay (apenas em prod para economizar)
    replaysSessionSampleRate: isProduction ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0, // Sempre capturar quando há erro

    // Filtros de erro
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection',
      'ChunkLoadError',
      'Loading chunk',
    ],

    // Contexto adicional
    beforeSend(event, hint) {
      // Não enviar erros de desenvolvimento
      if (event.exception?.values?.[0]?.value?.includes('HMR')) {
        return null;
      }

      // Log local para debug
      console.error('📤 [Sentry] Enviando erro do frontend:', event.exception?.values?.[0]?.value);

      return event;
    },
  });

  // Sentry habilitado
} else {
  // Sentry desabilitado
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
