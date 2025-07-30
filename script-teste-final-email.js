/**
 * SCRIPT DE TESTE FINAL - DEBUGGING BOTÕES EMAIL
 * 
 * Execute este script no console do navegador (F12 > Console)
 * após navegar para a página de propostas
 */

console.log('🚀 === TESTE DE DEBUG DOS BOTÕES DE EMAIL ===');

// Aguardar carregamento completo
setTimeout(() => {
  console.log('\n📊 1. VERIFICANDO DADOS NO CONSOLE...');

  // Verificar se há logs de conversão
  console.log('Procure por logs que começam com:');
  console.log('  🔄 [CONVERTER] Processando proposta...');
  console.log('  🔍 DEBUG getClienteData...');

  console.log('\n📧 2. ANALISANDO BOTÕES DE EMAIL...');

  // Encontrar todos os botões de email
  const emailButtons = document.querySelectorAll('button[title*="email"], button[title*="Email"]');

  if (emailButtons.length === 0) {
    console.log('❌ Nenhum botão de email encontrado!');

    // Procurar por ícones que podem ser botões
    const possibleButtons = document.querySelectorAll('button svg[class*="mail"], button svg[class*="envelope"]');
    console.log(`🔍 Possíveis botões encontrados: ${possibleButtons.length}`);

    possibleButtons.forEach((btn, i) => {
      const button = btn.closest('button');
      console.log(`Possível botão ${i + 1}:`, {
        disabled: button?.disabled,
        title: button?.title,
        className: button?.className
      });
    });
  } else {
    console.log(`✅ Encontrados ${emailButtons.length} botões de email`);

    emailButtons.forEach((btn, i) => {
      console.log(`\n📧 Botão ${i + 1}:`);
      console.log(`   Disabled: ${btn.disabled}`);
      console.log(`   Title: "${btn.title}"`);
      console.log(`   ClassName: "${btn.className}"`);
      console.log(`   Clicável: ${!btn.disabled ? 'SIM ✅' : 'NÃO ❌'}`);

      if (btn.disabled) {
        console.log(`   🔍 Analisando motivo do disabled...`);
        if (btn.title.includes('sem email')) {
          console.log(`   ❌ Motivo: Cliente sem email`);
        }
      }
    });
  }

  console.log('\n💾 3. VERIFICANDO DADOS ARMAZENADOS...');

  // Verificar se há dados de propostas
  const localKeys = Object.keys(localStorage);
  const sessionKeys = Object.keys(sessionStorage);

  console.log('LocalStorage keys:', localKeys.filter(k => k.includes('proposta') || k.includes('cliente')));
  console.log('SessionStorage keys:', sessionKeys.filter(k => k.includes('proposta') || k.includes('cliente')));

  console.log('\n🔄 4. INSTRUÇÕES:');
  console.log('1. Verifique se apareceram logs de conversão acima');
  console.log('2. Verifique se os botões estão habilitados');
  console.log('3. Se ainda estão disabled, pode ser um problema de cache');
  console.log('4. Tente: Ctrl+Shift+R para reload completo');

}, 2000);

console.log('⏳ Aguardando 2 segundos para análise...');
