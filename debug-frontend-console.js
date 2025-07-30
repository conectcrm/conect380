// Script para verificar se o frontend está processando os dados corretamente
// Execute este código no console do navegador

// 1. Verificar se a página d// 🆕 FUNÇÃO PARA VERIFICAR STATUS VISUAL NA INTERFACE
window.verificarStatusVisualInterface = function (numeroPropsota = 'PROP-2025-051') {
  console.log(`🔍 Verificando status visual de ${numeroPropsota} na interface...`);

  // Procurar pela proposta na tabela/lista
  const elementos = document.querySelectorAll('*');
  let propostaEncontrada = false;

  elementos.forEach((el) => {
    const texto = el.textContent || '';
    if (texto.includes(numeroPropsota)) {
      propostaEncontrada = true;
      console.log('📋 Elemento encontrado:', {
        tag: el.tagName,
        texto: texto.trim().substring(0, 100) + '...',
        classes: el.className,
        parent: el.parentElement?.tagName
      });

      // Procurar status próximo a este elemento
      const elementoPai = el.closest('tr, div[class*="card"], div[class*="item"]');
      if (elementoPai) {
        const statusElements = elementoPai.querySelectorAll('*');
        statusElements.forEach(statusEl => {
          const statusTexto = statusEl.textContent?.toLowerCase() || '';
          if (statusTexto.includes('visualizada') || statusTexto.includes('rejeitada') ||
            statusTexto.includes('aprovada') || statusTexto.includes('enviada')) {
            console.log('📊 Status visual encontrado:', {
              elemento: statusEl.tagName,
              status: statusTexto.trim(),
              classes: statusEl.className
            });
          }
        });
      }
    }
  });

  if (!propostaEncontrada) {
    console.log('❌ Proposta não encontrada na interface visual');
  }

  return propostaEncontrada;
};

// 🆕 FUNÇÃO PARA TESTAR CICLO COMPLETO COM VERIFICAÇÃO VISUAL
window.testarCicloCompletoComVerificacao = function (numeroPropsota = 'PROP-2025-051') {
  console.log('🧪 Testando ciclo completo com verificação visual...');

  // 1. Verificar status visual inicial
  console.log('\n📊 Status visual INICIAL:');
  verificarStatusVisualInterface(numeroPropsota);

  // 2. Testar ação e verificar mudança visual
  function testarAcaoComVerificacao(acao, delay = 0) {
    setTimeout(() => {
      console.log(`\n🎯 Testando ${acao}...`);

      fetch(`http://localhost:3001/api/portal/proposta/${numeroPropsota}/acao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ acao })
      })
        .then(response => response.json())
        .then(data => {
          console.log(`✅ Resposta para ${acao}:`, data);

          if (data.success) {
            // Disparar evento de atualização
            window.dispatchEvent(new CustomEvent('propostaAtualizada', {
              detail: {
                propostaId: numeroPropsota,
                novoStatus: acao,
                fonte: 'teste-completo',
                timestamp: new Date().toISOString()
              }
            }));

            // Verificar mudança visual após delay
            setTimeout(() => {
              console.log(`\n📊 Status visual APÓS ${acao}:`);
              verificarStatusVisualInterface(numeroPropsota);
            }, 1500);

            // ✨ NOVO: Forçar recarregamento da página para verificar persistência
            setTimeout(() => {
              console.log(`\n🔄 Forçando atualização das propostas...`);
              window.dispatchEvent(new CustomEvent('atualizarPropostas', {
                detail: { fonte: `apos-${acao}` }
              }));
            }, 2000);
          }
        })
        .catch(error => {
          console.error(`❌ Erro ao testar ${acao}:`, error);
        });
    }, delay);
  }

  // Testar sequencialmente
  testarAcaoComVerificacao('visualizada', 1000);
  testarAcaoComVerificacao('rejeitada', 6000);
  testarAcaoComVerificacao('aprovada', 12000);
};

// 🆕 FUNÇÃO PARA SINCRONIZAR FRONTEND COM BACKEND
window.sincronizarFrontendComBackend = function (numeroPropsota = 'PROP-2025-051') {
  console.log(`🔄 Sincronizando frontend com backend para ${numeroPropsota}...`);

  // 1. Buscar status atual no backend
  fetch('http://localhost:3001/propostas')
    .then(response => response.json())
    .then(data => {
      if (data.success && data.propostas) {
        const proposta = data.propostas.find(p => p.numero === numeroPropsota);

        if (proposta) {
          console.log(`📊 Status no backend: ${proposta.status}`);
          console.log(`📅 Última atualização: ${proposta.updatedAt}`);

          // 2. Disparar eventos para forçar atualização do frontend
          window.dispatchEvent(new CustomEvent('propostaAtualizada', {
            detail: {
              propostaId: numeroPropsota,
              novoStatus: proposta.status,
              fonte: 'sincronizacao-manual',
              timestamp: proposta.updatedAt
            }
          }));

          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('atualizarPropostas', {
              detail: { fonte: 'sincronizacao-backend' }
            }));
          }, 500);

          // 3. Verificar interface após sincronização
          setTimeout(() => {
            console.log('\n🔍 Verificando interface após sincronização...');
            verificarStatusVisualInterface(numeroPropsota);
          }, 2000);

        } else {
          console.log(`❌ Proposta ${numeroPropsota} não encontrada no backend`);
        }
      }
    })
    .catch(error => {
      console.error('❌ Erro ao buscar propostas:', error);
    });
};

// 🆕 FUNÇÃO PARA FORÇAR RECARREGAMENTO DAS PROPOSTAS
window.forcarAtualizacaoPropostas = function () {
  console.log('🔄 Forçando atualização das propostas...');

  // Tentar vários métodos para forçar atualização

  // 1. Evento customizado
  window.dispatchEvent(new CustomEvent('atualizarPropostas', {
    detail: { fonte: 'manual-refresh' }
  }));

  // 2. Verificar se atualizou visualmente
  setTimeout(() => {
    console.log('🔍 Verificando se a interface atualizou...');
    verificarStatusVisualInterface('PROP-2025-051');
  }, 1000);

  // 3. Reload da página (último recurso)
  setTimeout(() => {
    const confirmar = confirm('Deseja recarregar a página para ver as mudanças?');
    if (confirmar) {
      window.location.reload();
    }
  }, 3000);
}; u
console.log('=== DEBUG FRONTEND PROPOSTAS ===');

// 2. Verificar se há dados na tabela
const tabela = document.querySelector('table');
console.log('Tabela encontrada:', tabela ? 'SIM' : 'NÃO');

// 3. Verificar células da coluna vendedor
const colunasVendedor = document.querySelectorAll('td:nth-child(3)'); // Assumindo que vendedor é a 3ª coluna
console.log('Células de vendedor encontradas:', colunasVendedor.length);

colunasVendedor.forEach((celula, index) => {
  console.log(`Célula ${index + 1}:`, celula.textContent);
});

// 4. Verificar se há chamadas de API no Network
console.log('Verificar no Network tab se a chamada para /propostas está sendo feita');

// 5. Verificar console errors
console.log('Verificar se há erros no console');

// 6. Verificar local storage
console.log('Auth token:', localStorage.getItem('auth_token') ? 'EXISTE' : 'NÃO EXISTE');

// 7. TESTE ESPECÍFICO: Botão de Email
console.log('\n=== TESTE BOTÃO DE EMAIL ===');

// Encontrar botões de email na página
const botoesEmail = document.querySelectorAll('[data-testid*="email"], button[title*="email"], button[title*="Email"]');
console.log('Botões de email encontrados:', botoesEmail.length);

botoesEmail.forEach((botao, index) => {
  console.log(`Botão ${index + 1}:`, {
    texto: botao.textContent.trim(),
    classes: botao.className,
    testId: botao.getAttribute('data-testid'),
    title: botao.getAttribute('title'),
    disabled: botao.disabled,
    onclick: !!botao.onclick
  });
});

// 8. Testar API diretamente do console
console.log('\n=== TESTE API DIRETO ===');

// Função para testar envio de email
window.testarEnvioEmail = function (numeroPropsota = 'PROP-2025-038') {
  console.log(`🧪 Testando envio para ${numeroPropsota}...`);

  const emailData = {
    proposta: {
      id: numeroPropsota,
      numero: numeroPropsota,
      titulo: 'Teste Frontend'
    },
    emailCliente: 'teste@exemplo.com',
    linkPortal: `https://portal.conectcrm.com/${numeroPropsota}`
  };

  fetch('http://localhost:3001/email/enviar-proposta', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailData)
  })
    .then(response => response.json())
    .then(data => {
      console.log('✅ Resposta da API:', data);
      if (data.success) {
        console.log('🎉 Email enviado com sucesso! Disparando eventos de atualização...');

        // 🔄 TESTAR EVENTOS DE ATUALIZAÇÃO EM TEMPO REAL
        const eventoAtualizacao = new CustomEvent('propostaAtualizada', {
          detail: {
            propostaId: numeroPropsota,
            novoStatus: 'enviada',
            fonte: 'teste-console',
            timestamp: new Date().toISOString()
          }
        });

        window.dispatchEvent(eventoAtualizacao);
        console.log('📡 Evento propostaAtualizada disparado!');

        // Segundo evento após 1 segundo
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('atualizarPropostas', {
            detail: { fonte: 'teste-console-delayed' }
          }));
          console.log('📡 Evento atualizarPropostas disparado!');
        }, 1000);

      } else {
        console.log('❌ Erro no envio:', data.message);
      }
    })
    .catch(error => {
      console.error('❌ Erro na requisição:', error);
    });
};

// 🆕 FUNÇÃO PARA TESTAR PORTAL DO CLIENTE COMPLETO
window.testarPortalCompleto = function (numeroPropsota = 'PROP-2025-045') {
  console.log('� Testando portal do cliente completo...');

  // Testar cada ação do portal
  const acoes = ['visualizada', 'rejeitada', 'aprovada'];

  function testarAcao(acao, delay = 0) {
    setTimeout(() => {
      console.log(`\n📝 Testando ação: ${acao}`);

      fetch(`http://localhost:3001/api/portal/proposta/${numeroPropsota}/acao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ acao })
      })
        .then(response => response.json())
        .then(data => {
          console.log(`✅ Resposta para ${acao}:`, data);

          if (data.success) {
            // Forçar atualização da lista de propostas no frontend
            console.log('📡 Disparando evento de atualização...');
            window.dispatchEvent(new CustomEvent('propostaAtualizada', {
              detail: {
                propostaId: numeroPropsota,
                novoStatus: acao,
                fonte: 'teste-portal',
                timestamp: new Date().toISOString()
              }
            }));

            // Verificar se a página atualizou
            setTimeout(() => {
              console.log('🔍 Verificando se a página refletiu a mudança...');
              // Aqui você pode adicionar código para verificar se a UI foi atualizada
            }, 500);
          }
        })
        .catch(error => {
          console.error(`❌ Erro ao testar ${acao}:`, error);
        });
    }, delay);
  }

  // Testar as ações em sequência
  acoes.forEach((acao, index) => {
    testarAcao(acao, index * 3000);
  });
};

// 🆕 FUNÇÃO PARA FORÇAR RECARREGAMENTO DAS PROPOSTAS
window.forcarAtualizacaoPropostas = function () {
  console.log('� Forçando atualização das propostas...');

  // Tentar vários métodos para forçar atualização

  // 1. Evento customizado
  window.dispatchEvent(new CustomEvent('atualizarPropostas', {
    detail: { fonte: 'manual-refresh' }
  }));

  // 2. Reload da página (último recurso)
  setTimeout(() => {
    const confirmar = confirm('Deseja recarregar a página para ver as mudanças?');
    if (confirmar) {
      window.location.reload();
    }
  }, 2000);
};

// 🆕 FUNÇÃO PARA FORÇAR RECARREGAMENTO
window.forcarRecarregamento = function () {
  console.log('🔄 Forçando recarregamento das propostas...');

  window.dispatchEvent(new CustomEvent('atualizarPropostas', {
    detail: { fonte: 'recarregamento-manual' }
  }));

  console.log('📡 Evento de recarregamento disparado!');
};

console.log('💡 Para testar manualmente, execute:');
console.log('   sincronizarFrontendComBackend("PROP-2025-051") - ✨ Sincroniza frontend com backend');
console.log('   verificarStatusVisualInterface("PROP-2025-051") - Verifica status visual na interface');
console.log('   testarCicloCompletoComVerificacao("PROP-2025-051") - Teste completo com verificação visual');
console.log('   testarPortalCompleto("PROP-2025-051") - Testa todas as ações do portal');
console.log('   testarEnvioEmail("PROP-2025-051") - Testa envio + atualização automática');
console.log('   forcarAtualizacaoPropostas() - Força atualização da lista');
console.log('   forcarRecarregamento() - Força recarregamento da lista');

// 9. Verificar se PropostaActions está carregado
if (typeof window.React !== 'undefined') {
  console.log('✅ React está disponível');
} else {
  console.log('❌ React não encontrado');
}

// 10. Monitorar cliques em botões E eventos de atualização
document.addEventListener('click', function (event) {
  if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
    const botao = event.target.closest('button') || event.target;
    console.log('🖱️ Clique detectado:', {
      texto: botao.textContent.trim(),
      classes: botao.className,
      disabled: botao.disabled
    });
  }
});

// 🆕 12. Monitorar estado do React (se disponível)
window.monitorarEstadoReact = function () {
  console.log('⚛️ Tentando acessar estado do React...');

  // Procurar por componentes React na página
  const elementos = document.querySelectorAll('*');
  let componentesReact = [];

  elementos.forEach(el => {
    // Verificar se o elemento tem propriedades React
    const keys = Object.keys(el);
    const reactKey = keys.find(key => key.startsWith('__reactInternalInstance') || key.startsWith('_reactInternalFiber'));

    if (reactKey && el.textContent?.includes('PROP-2025')) {
      componentesReact.push({
        elemento: el.tagName,
        texto: el.textContent.substring(0, 50) + '...',
        reactKey: reactKey
      });
    }
  });

  console.log('⚛️ Componentes React encontrados:', componentesReact.length);

  // Tentar acessar estado global
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('🔧 React DevTools detectado - estado pode ser inspecionado');
  }

  return componentesReact;
};

// 🆕 13. Verificar requisições de rede
window.monitorarRequisicoes = function () {
  console.log('🌐 Monitorando requisições de rede...');

  const originalFetch = window.fetch;
  let contador = 0;

  window.fetch = function (...args) {
    contador++;
    const url = args[0];
    console.log(`📡 Requisição ${contador}:`, url);

    return originalFetch.apply(this, args)
      .then(response => {
        console.log(`✅ Resposta ${contador}:`, response.status, url);
        return response;
      })
      .catch(error => {
        console.log(`❌ Erro ${contador}:`, error, url);
        throw error;
      });
  };

  console.log('👂 Monitor de requisições ativado');
};

// 🆕 11. Monitorar eventos de atualização em tempo real
window.addEventListener('propostaAtualizada', function (event) {
  console.log('📡 Evento propostaAtualizada detectado:', event.detail);

  // Verificar se a mudança foi aplicada visualmente após o evento
  setTimeout(() => {
    console.log('🔍 Verificando interface 1 segundo após evento...');
    verificarStatusVisualInterface(event.detail.propostaId);
  }, 1000);
});

window.addEventListener('atualizarPropostas', function (event) {
  console.log('📡 Evento atualizarPropostas detectado:', event.detail);

  // Verificar se a lista foi recarregada
  setTimeout(() => {
    console.log('🔍 Verificando interface após recarregamento...');
    verificarStatusVisualInterface('PROP-2025-051');
  }, 2000);
});

console.log('👂 Monitor de cliques e eventos ativado - clique em qualquer botão para ver os detalhes');
console.log('📡 Monitor de eventos de atualização ativado - eventos serão logados automaticamente');
console.log('⚛️ Execute monitorarEstadoReact() para inspecionar componentes React');
console.log('🌐 Execute monitorarRequisicoes() para monitorar chamadas de API');

// Ativar monitoramento automático
setTimeout(() => {
  console.log('🚀 Ativando monitoramento automático...');
  monitorarRequisicoes();
  monitorarEstadoReact();
}, 1000);
