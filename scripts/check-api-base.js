const path = require('path');

const puppeteer = require(
  require.resolve('puppeteer', {
    paths: [path.join(__dirname, '..', 'frontend-web', 'node_modules')],
  })
);

(async () => {
  const targetUrl = 'http://192.168.200.44:3000/login';
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const logs = [];

  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(text);
    console.log('[browser]', text);
  });

  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise((resolve) => setTimeout(resolve, 4000));
  } finally {
    await browser.close();
  }

  const apiLog = logs.find((line) => line.includes('[API] Base URL configurada'));

  if (!apiLog) {
    console.error('❌ Não foi possível capturar o log da API no console.');
    process.exit(1);
  }

  console.log('\n[check] Log identificado:', apiLog);
})();
