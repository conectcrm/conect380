#!/usr/bin/env node
/**
 * Webhook Receiver para Alertmanager
 * Recebe alertas do Alertmanager e exibe no console (para testes)
 * 
 * Uso: node webhook-receiver.js
 * Porta: 8080
 */

const http = require('http');
const PORT = 8080;

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const alert = JSON.parse(body);

        console.log('\n' + '='.repeat(80));
        console.log('🔔 ALERT RECEIVED:', new Date().toISOString());
        console.log('='.repeat(80));

        // Header info
        console.log('\n📍 Source:', req.url);
        console.log('📊 Status:', alert.status);
        console.log('🏷️  Receiver:', alert.receiver);
        console.log('📈 Version:', alert.version);

        // Group info
        if (alert.groupKey) {
          console.log('🔗 Group Key:', alert.groupKey);
        }

        // Alerts details
        if (alert.alerts && alert.alerts.length > 0) {
          console.log(`\n🚨 ALERTS (${alert.alerts.length}):`);

          alert.alerts.forEach((a, idx) => {
            console.log(`\n  [${idx + 1}] ${a.labels.alertname || 'Unknown'}`);
            console.log(`      Status: ${a.status}`);
            console.log(`      Severity: ${a.labels.severity || 'N/A'}`);
            console.log(`      StartsAt: ${a.startsAt}`);
            if (a.endsAt) {
              console.log(`      EndsAt: ${a.endsAt}`);
            }

            // Annotations
            if (a.annotations) {
              if (a.annotations.summary) {
                console.log(`      📝 Summary: ${a.annotations.summary}`);
              }
              if (a.annotations.description) {
                console.log(`      📄 Description: ${a.annotations.description}`);
              }
              if (a.annotations.runbook) {
                console.log(`      📖 Runbook: ${a.annotations.runbook}`);
              }
            }

            // Labels (except common ones)
            const excludeLabels = ['alertname', 'severity', 'prometheus'];
            const otherLabels = Object.entries(a.labels)
              .filter(([key]) => !excludeLabels.includes(key))
              .map(([key, value]) => `${key}=${value}`)
              .join(', ');

            if (otherLabels) {
              console.log(`      🏷️  Labels: ${otherLabels}`);
            }
          });
        }

        // Common labels
        if (alert.commonLabels && Object.keys(alert.commonLabels).length > 0) {
          console.log('\n🏷️  Common Labels:');
          Object.entries(alert.commonLabels).forEach(([key, value]) => {
            console.log(`      ${key}: ${value}`);
          });
        }

        // Common annotations
        if (alert.commonAnnotations && Object.keys(alert.commonAnnotations).length > 0) {
          console.log('\n📝 Common Annotations:');
          Object.entries(alert.commonAnnotations).forEach(([key, value]) => {
            console.log(`      ${key}: ${value}`);
          });
        }

        // External URL
        if (alert.externalURL) {
          console.log('\n🔗 Alertmanager URL:', alert.externalURL);
        }

        console.log('\n' + '='.repeat(80) + '\n');

        // Respond OK
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', message: 'Alert received' }));

      } catch (error) {
        console.error('❌ Error parsing alert:', error.message);
        console.error('Body:', body);

        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: error.message }));
      }
    });

  } else if (req.method === 'GET') {
    // Health check
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'Webhook receiver is running',
      port: PORT,
      timestamp: new Date().toISOString()
    }));

  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
  }
});

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🎯 WEBHOOK RECEIVER FOR ALERTMANAGER                       ║
║                                                               ║
║   Server running on: http://localhost:${PORT}                    ║
║   Ready to receive alerts from Alertmanager                  ║
║                                                               ║
║   Test with:                                                  ║
║   curl http://localhost:${PORT}                                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down webhook receiver...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down webhook receiver...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
