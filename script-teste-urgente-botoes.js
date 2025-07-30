/**
 * SCRIPT DE TESTE URGENTE - BOTÕES EMAIL E WHATSAPP
 * 
 * Cole este script no console do navegador (F12 > Console)
 * após navegar para a página de propostas
 */

console.log('🚨 === TESTE URGENTE DOS BOTÕES ===');

// Aguardar carregamento
setTimeout(() => {
  console.log('\n🔍 ANALISANDO TODOS OS BOTÕES DE AÇÃO...');

  // Encontrar todos os botões possíveis
  const allButtons = document.querySelectorAll('button');
  console.log(`Total de botões na página: ${allButtons.length}`);

  // Filtrar botões que podem ser email ou WhatsApp
  const actionButtons = Array.from(allButtons).filter(btn => {
    const hasMailIcon = btn.querySelector('svg') && btn.innerHTML.includes('mail');
    const hasMessageIcon = btn.querySelector('svg') && btn.innerHTML.includes('message');
    const hasEmailTitle = btn.title && btn.title.toLowerCase().includes('email');
    const hasWhatsAppTitle = btn.title && btn.title.toLowerCase().includes('whatsapp');

    return hasMailIcon || hasMessageIcon || hasEmailTitle || hasWhatsAppTitle;
  });

  console.log(`\n📧 Botões de ação encontrados: ${actionButtons.length}`);

  actionButtons.forEach((btn, i) => {
    console.log(`\n🔹 Botão ${i + 1}:`);
    console.log(`   Title: "${btn.title}"`);
    console.log(`   Disabled: ${btn.disabled}`);
    console.log(`   ClassName: "${btn.className}"`);
    console.log(`   InnerHTML: ${btn.innerHTML.substring(0, 100)}...`);

    // Verificar se tem classe de disabled
    const hasDisabledClass = btn.className.includes('opacity-50') || btn.className.includes('cursor-not-allowed');
    console.log(`   Tem classe disabled: ${hasDisabledClass}`);

    // Tentar clicar no botão se não estiver disabled
    if (!btn.disabled && !hasDisabledClass) {
      console.log(`   ✅ Botão parece clicável!`);
    } else {
      console.log(`   ❌ Botão está desabilitado`);

      // Analisar motivo
      if (btn.title.includes('sem email')) {
        console.log(`   Motivo: Cliente sem email`);
      } else if (btn.title.includes('sem telefone')) {
        console.log(`   Motivo: Cliente sem telefone`);
      }
    }
  });

  console.log('\n💡 FORÇA HABILITAÇÃO DOS BOTÕES (TESTE):');

  actionButtons.forEach((btn, i) => {
    if (btn.disabled) {
      console.log(`Forçando habilitação do botão ${i + 1}...`);
      btn.disabled = false;
      btn.className = btn.className.replace('opacity-50', '').replace('cursor-not-allowed', '');
      console.log(`Botão ${i + 1} forçadamente habilitado!`);
    }
  });

  console.log('\n✅ Teste de força concluído. Tente clicar nos botões agora!');

}, 2000);

console.log('⏳ Aguardando 2 segundos para análise...');
