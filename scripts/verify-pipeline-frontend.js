const puppeteer = require('puppeteer');

(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const waitForText = async (text, timeoutMs = 60000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const found = await page.evaluate((needle) => document.body.innerText.includes(needle), text);
      if (found) {
        return true;
      }
      await sleep(500);
    }
    throw new Error(`Texto "${text}" não apareceu após ${timeoutMs}ms.`);
  };
  const baseFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const loginUrl = `${baseFrontendUrl}/login`;
  const pipelineUrl = `${baseFrontendUrl}/pipeline`;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--window-size=1440,900', '--no-sandbox']
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  const apiResponses = [];
  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('/oportunidades')) {
      apiResponses.push({ url, status: response.status() });
    }
  });

  try {
    console.log('🌐 Abrindo página de login:', loginUrl);
    await page.goto(loginUrl, { waitUntil: 'networkidle0' });

    console.log('✍️  Preenchendo credenciais padrão...');
    await page.waitForSelector('input[type="email"]', { visible: true });
    await page.type('input[type="email"]', 'admin@conectsuite.com.br', { delay: 25 });

    await page.waitForSelector('input[type="password"]', { visible: true });
    await page.type('input[type="password"]', 'admin123', { delay: 25 });

    console.log('🔐 Enviando formulário de login...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);

    const authToken = await page.evaluate(() => localStorage.getItem('authToken'));
    if (!authToken) {
      throw new Error('Token de autenticação não foi salvo no localStorage.');
    }
    console.log('✅ Login bem-sucedido e token presente no browser.');

    console.log('📈 Acessando PipelinePage...');
    await page.goto(pipelineUrl, { waitUntil: 'networkidle0' });
    console.log('📍 URL atual após navegar para pipeline:', page.url());

    await waitForText('Pipeline de Vendas');

    let metricasVisiveis = false;
    try {
      await waitForText('Total de Oportunidades', 15000);
      metricasVisiveis = true;
    } catch (metricError) {
      console.warn('⚠️  Métricas visuais não apareceram (provável falta de dados ou módulo incompleto).');
      console.warn(metricError.message);
    }

    const summary = await page.evaluate(() => {
      const getCardValue = (label) => {
        const labelElement = Array.from(document.querySelectorAll('p')).find(
          (p) => p.textContent?.trim() === label
        );
        if (!labelElement) {
          return null;
        }
        const parent = labelElement.parentElement;
        if (!parent) {
          return null;
        }
        const paragraphs = parent.querySelectorAll('p');
        return paragraphs[1]?.textContent?.trim() || null;
      };

      const totalCards = Array.from(document.querySelectorAll('[data-column-id]')).length || null;

      return {
        headerVisible: document.body.innerText.includes('Pipeline de Vendas'),
        totalOportunidades: getCardValue('Total de Oportunidades'),
        valorTotal: getCardValue('Valor Total'),
        ticketMedio: getCardValue('Ticket Médio'),
        taxaConversao: getCardValue('Taxa de Conversão'),
        totalColunasKanban: totalCards,
      };
    });

    console.log('📊 Métricas renderizadas no frontend:');
    console.log(JSON.stringify(summary, null, 2));

    if (!metricasVisiveis) {
      console.warn('ℹ️  Continuando mesmo sem cards de métricas visíveis, pois o objetivo principal é validar os endpoints.');
    }

    console.log('🔎 Respostas capturadas das chamadas /oportunidades*:');
    console.table(apiResponses);

    const temErro = apiResponses.some((resp) => resp.status >= 400);
    if (temErro) {
      throw new Error('Detectado status de erro ao carregar dados do pipeline.');
    }

    if (!summary.totalOportunidades || summary.totalOportunidades === '0') {
      console.warn('⚠️  Pipeline carregou, mas não há oportunidades na UI.');
    } else {
      console.log('✅ Pipeline exibiu oportunidades e métricas corretamente.');
    }
  } catch (error) {
    try {
      const pageDump = await page.content();
      console.error('📝 HTML atual da página:', pageDump.slice(0, 1500));
      const textDump = await page.evaluate(() => document.body.innerText);
      console.error('📄 Texto atual da página:', textDump.slice(0, 1200));
    } catch (dumpError) {
      console.error('⚠️  Não foi possível capturar estado da página:', dumpError.message);
    }

    console.error('❌ Falha ao validar PipelinePage:', error.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
