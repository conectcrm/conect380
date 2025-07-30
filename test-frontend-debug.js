/**
 * Script para testar o debug do frontend
 * Execute este script após acessar a página de propostas no navegador
 */

console.log('🔧 Iniciando teste de debug do frontend...');

// Aguardar carregamento da página
setTimeout(() => {
  console.log('📊 Verificando dados das propostas...');

  // Tentar encontrar elementos de email na página
  const emailButtons = document.querySelectorAll('[title*="email"], [title*="Email"], [title*="enviar"]');
  console.log(`📧 Encontrados ${emailButtons.length} botões de email na página`);

  emailButtons.forEach((button, index) => {
    console.log(`📧 Botão ${index + 1}:`, {
      title: button.title,
      disabled: button.disabled,
      className: button.className,
      innerText: button.innerText
    });
  });

  // Verificar se há dados no localStorage ou sessionStorage
  const localStorageKeys = Object.keys(localStorage);
  const sessionStorageKeys = Object.keys(sessionStorage);

  console.log('💾 LocalStorage keys:', localStorageKeys);
  console.log('💾 SessionStorage keys:', sessionStorageKeys);

}, 3000);

console.log('✅ Script de debug carregado. Aguardando 3 segundos para análise...');
