// 🧪 TESTE COMPLETO - Integração de Propostas
// Execute este script no console do navegador

console.log(`
🎯 TESTE DE INTEGRAÇÃO DE PROPOSTAS
===================================

Vamos testar o fluxo completo:
1. ✅ Página de lista carrega propostas
2. ✅ Criação de nova proposta salva no serviço
3. ✅ Navegação de volta para lista
4. ✅ Nova proposta aparece na lista

Iniciando teste...
`);

// Função para testar a integração
async function testarIntegracaoPropostas() {
  try {
    console.log('📋 ETAPA 1: Verificando página atual...');
    const currentUrl = window.location.href;
    console.log('🔗 URL atual:', currentUrl);
    
    if (currentUrl.includes('/propostas')) {
      console.log('✅ Estamos na página de criação de proposta');
      
      // Verificar se elementos estão presentes
      const clienteField = document.querySelector('input[placeholder*="cliente"]') || 
                          document.querySelector('[name*="cliente"]') ||
                          document.querySelector('input[placeholder*="Buscar cliente"]');
      
      const submitButton = document.querySelector('button[type="submit"]') ||
                          document.querySelector('button:contains("Gerar")') ||
                          document.querySelector('[class*="submit"]');
      
      console.log('📝 Campo cliente encontrado:', !!clienteField);
      console.log('🚀 Botão submit encontrado:', !!submitButton);
      
      if (clienteField && submitButton) {
        console.log(`
✅ PÁGINA DE CRIAÇÃO OK!

🎯 Para testar a integração:

1. Preencha os campos obrigatórios:
   - Selecione um cliente
   - Adicione pelo menos um produto
   - Configure forma de pagamento

2. Clique em "Gerar Proposta"

3. Aguarde o toast de sucesso

4. Será redirecionado para /propostas

5. A nova proposta deve aparecer na lista!

📊 Execute este script novamente na página /propostas após criar!
        `);
      } else {
        console.log('❌ Elementos não encontrados. Página pode não ter carregado completamente.');
      }
      
    } else if (currentUrl.includes('/propostas') && !currentUrl.includes('/nova')) {
      console.log('✅ Estamos na página de lista de propostas');
      
      // Verificar elementos da lista
      const headerTitle = document.querySelector('h1');
      const novaPropostaBtn = document.querySelector('button:contains("Nova")') || 
                             document.querySelector('[href*="nova"]') ||
                             document.querySelector('button[onclick*="nova"]');
      
      const propostas = document.querySelectorAll('tbody tr') ||
                       document.querySelectorAll('[class*="proposta"]') ||
                       document.querySelectorAll('table tr:not(:first-child)');
      
      console.log('📋 Título da página:', headerTitle?.textContent);
      console.log('➕ Botão "Nova Proposta" encontrado:', !!novaPropostaBtn);
      console.log('📊 Propostas na lista:', propostas.length);
      
      // Verificar se há indicador de loading
      const isLoading = document.querySelector('[class*="spin"]') || 
                       document.querySelector('[class*="loading"]');
      
      if (isLoading) {
        console.log('🔄 Carregando propostas...');
        setTimeout(() => {
          console.log('♻️ Execute o teste novamente em 2 segundos!');
        }, 2000);
      } else {
        console.log('✅ Propostas carregadas!');
        
        if (propostas.length > 0) {
          console.log(`
✅ LISTA DE PROPOSTAS OK!

📊 Encontradas ${propostas.length} propostas na lista.

🎯 Para completar o teste:
1. Clique em "Nova Proposta"
2. Crie uma proposta completa
3. Volte para esta lista
4. Verifique se aparece uma proposta nova

Se você acabou de criar uma proposta e ela NÃO apareceu:
❌ Há um problema na integração que precisa ser corrigido.
          `);
        } else {
          console.log(`
⚠️ NENHUMA PROPOSTA ENCONTRADA

Isso pode significar:
1. 📋 Ainda não foram criadas propostas
2. 🔄 Lista ainda está carregando
3. ❌ Problema na integração com o serviço

💡 Tente criar uma proposta e voltar aqui!
          `);
        }
      }
      
    } else {
      console.log('❓ Página desconhecida. Navegue para /propostas');
      console.log('📋 Uso: Use o botão "Nova Proposta" na página de propostas');
    }
    
    // Verificar console por erros
    console.log(`
🔍 VERIFICAÇÃO ADICIONAL:

Procure no console por:
✅ Logs com ✅ (sucessos)
❌ Logs com ❌ (erros)
📝 Mensagens de "Proposta criada"
🔄 Mensagens de "Propostas carregadas"

Se houver erros vermelhos, isso indica problemas na integração.
    `);
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
}

// Executar teste
testarIntegracaoPropostas();

// Disponibilizar funções para teste manual
window.testarPropostas = testarIntegracaoPropostas;

console.log(`
🎮 COMANDOS DISPONÍVEIS:

testarPropostas() - Execute este teste novamente
window.location.href = '/propostas' - Ir para lista
window.location.href = '/propostas' - Ir para página de propostas (usar botão "Nova Proposta")

🎯 Execute testarPropostas() em qualquer página para diagnosticar!
`);
