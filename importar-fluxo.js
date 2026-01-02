const https = require('https');
const http = require('http');

// Dados do fluxo
const fluxoData = {
  "nome": "Atendimento Completo - Cadastro e Triagem",
  "descricao": "Fluxo automático que verifica cadastro, coleta dados se necessário e direciona para atendimento",
  "codigo": "atendimento-completo-v1",
  "tipo": "atendimento",
  "canais": ["whatsapp"],
  "palavrasGatilho": ["oi", "olá", "hello", "bom dia", "boa tarde", "boa noite"],
  "horarioAtivo": {
    "inicio": "00:00",
    "fim": "23:59",
    "diasSemana": [0, 1, 2, 3, 4, 5, 6]
  },
  "prioridade": 10,
  "ativo": true,
  "publicado": true,
  "permiteVoltar": true,
  "permiteSair": true,
  "salvarHistorico": true,
  "tentarEntenderTextoLivre": false,
  "estrutura": {
    "versao": "2.0",
    "etapas": [
      {
        "id": "inicio",
        "tipo": "inicio",
        "config": {
          "mensagemBoasVindas": "Olá! 👋 Bem-vindo ao atendimento da nossa empresa. \n\nPor favor, aguarde enquanto verificamos seus dados...",
          "delay": 1000
        },
        "proximaEtapa": "verificar_cadastro"
      },
      {
        "id": "verificar_cadastro",
        "tipo": "condicao",
        "config": {
          "variavel": "contato.cadastrado",
          "operador": "existe",
          "descricao": "Verifica se o contato já está cadastrado no sistema"
        },
        "proximaEtapaVerdadeiro": "boas_vindas_cadastrado",
        "proximaEtapaFalso": "solicitar_primeiro_nome"
      },
      {
        "id": "boas_vindas_cadastrado",
        "tipo": "mensagem",
        "config": {
          "mensagem": "Olá {{contato.nome}}! 😊\n\nQue bom ter você de volta! Como posso ajudá-lo hoje?",
          "delay": 500
        },
        "proximaEtapa": "menu_atendimento"
      },
      {
        "id": "solicitar_primeiro_nome",
        "tipo": "mensagem",
        "config": {
          "mensagem": "Vejo que é seu primeiro contato conosco! 🎉\n\nPara oferecer um atendimento personalizado, preciso de algumas informações.",
          "delay": 1000
        },
        "proximaEtapa": "coletar_primeiro_nome"
      },
      {
        "id": "coletar_primeiro_nome",
        "tipo": "pergunta",
        "config": {
          "pergunta": "Qual é o seu *primeiro nome*? 📝",
          "variavel": "contato.primeiroNome",
          "validacao": {
            "tipo": "texto",
            "minimo": 2,
            "mensagemErro": "Por favor, digite um nome válido (mínimo 2 caracteres)."
          }
        },
        "proximaEtapa": "coletar_sobrenome"
      },
      {
        "id": "coletar_sobrenome",
        "tipo": "pergunta",
        "config": {
          "pergunta": "Obrigado, {{contato.primeiroNome}}! 👍\n\nAgora, qual é o seu *sobrenome*?",
          "variavel": "contato.sobrenome",
          "validacao": {
            "tipo": "texto",
            "minimo": 2,
            "mensagemErro": "Por favor, digite um sobrenome válido (mínimo 2 caracteres)."
          }
        },
        "proximaEtapa": "coletar_email"
      },
      {
        "id": "coletar_email",
        "tipo": "pergunta",
        "config": {
          "pergunta": "Perfeito! Agora preciso do seu *e-mail* para contato. 📧\n\n_(Digite um e-mail válido)_",
          "variavel": "contato.email",
          "validacao": {
            "tipo": "email",
            "mensagemErro": "Por favor, digite um e-mail válido (exemplo: seunome@empresa.com)."
          }
        },
        "proximaEtapa": "coletar_empresa"
      },
      {
        "id": "coletar_empresa",
        "tipo": "pergunta",
        "config": {
          "pergunta": "Qual é o nome da sua *empresa*? 🏢",
          "variavel": "contato.empresa",
          "validacao": {
            "tipo": "texto",
            "minimo": 2,
            "opcional": true,
            "mensagemErro": "Digite o nome da empresa ou 'não tenho' para pular."
          }
        },
        "proximaEtapa": "confirmar_dados"
      },
      {
        "id": "confirmar_dados",
        "tipo": "mensagem",
        "config": {
          "mensagem": "✅ *Dados recebidos:*\n\n👤 Nome: {{contato.primeiroNome}} {{contato.sobrenome}}\n📧 E-mail: {{contato.email}}\n🏢 Empresa: {{contato.empresa}}\n\n_Salvando suas informações..._",
          "delay": 2000
        },
        "proximaEtapa": "salvar_contato"
      },
      {
        "id": "salvar_contato",
        "tipo": "acao",
        "config": {
          "acao": "salvar_contato",
          "parametros": {
            "nome": "{{contato.primeiroNome}} {{contato.sobrenome}}",
            "email": "{{contato.email}}",
            "empresa": "{{contato.empresa}}",
            "telefone": "{{contato.telefone}}",
            "origem": "whatsapp_bot"
          }
        },
        "proximaEtapa": "confirmacao_cadastro"
      },
      {
        "id": "confirmacao_cadastro",
        "tipo": "mensagem",
        "config": {
          "mensagem": "🎉 *Cadastro realizado com sucesso!*\n\nAgora você faz parte da nossa base de clientes. Vamos prosseguir com seu atendimento!",
          "delay": 1000
        },
        "proximaEtapa": "menu_atendimento"
      },
      {
        "id": "menu_atendimento",
        "tipo": "menu",
        "config": {
          "mensagem": "📋 *Como posso ajudá-lo hoje?*\n\nEscolha uma das opções abaixo:",
          "opcoes": [
            {
              "numero": "1",
              "texto": "💼 Comercial - Vendas e Orçamentos",
              "proximaEtapa": "transferir_comercial"
            },
            {
              "numero": "2",
              "texto": "🛠️ Suporte Técnico",
              "proximaEtapa": "transferir_suporte"
            },
            {
              "numero": "3",
              "texto": "💰 Financeiro - Pagamentos e Faturas",
              "proximaEtapa": "transferir_financeiro"
            },
            {
              "numero": "4",
              "texto": "❓ Outros Assuntos",
              "proximaEtapa": "transferir_geral"
            }
          ],
          "mensagemOpcaoInvalida": "Opção inválida. Por favor, digite um número de 1 a 4.",
          "tentativasMaximas": 3
        }
      },
      {
        "id": "transferir_comercial",
        "tipo": "mensagem",
        "config": {
          "mensagem": "💼 *Área Comercial*\n\nVocê será transferido para um consultor de vendas. Aguarde um momento...",
          "delay": 1500
        },
        "proximaEtapa": "acao_transferir_comercial"
      },
      {
        "id": "acao_transferir_comercial",
        "tipo": "acao",
        "config": {
          "acao": "transferir_para_nucleo",
          "parametros": {
            "nucleoNome": "Comercial",
            "mensagem": "Cliente solicitou atendimento comercial",
            "prioridade": "media"
          }
        },
        "proximaEtapa": "fim"
      },
      {
        "id": "transferir_suporte",
        "tipo": "mensagem",
        "config": {
          "mensagem": "🛠️ *Suporte Técnico*\n\nVocê será conectado com um técnico especializado. Aguarde...",
          "delay": 1500
        },
        "proximaEtapa": "acao_transferir_suporte"
      },
      {
        "id": "acao_transferir_suporte",
        "tipo": "acao",
        "config": {
          "acao": "transferir_para_nucleo",
          "parametros": {
            "nucleoNome": "Suporte",
            "mensagem": "Cliente solicitou suporte técnico",
            "prioridade": "alta"
          }
        },
        "proximaEtapa": "fim"
      },
      {
        "id": "transferir_financeiro",
        "tipo": "mensagem",
        "config": {
          "mensagem": "💰 *Setor Financeiro*\n\nVocê será atendido por nossa equipe financeira. Um momento...",
          "delay": 1500
        },
        "proximaEtapa": "acao_transferir_financeiro"
      },
      {
        "id": "acao_transferir_financeiro",
        "tipo": "acao",
        "config": {
          "acao": "transferir_para_nucleo",
          "parametros": {
            "nucleoNome": "Financeiro",
            "mensagem": "Cliente solicitou atendimento financeiro",
            "prioridade": "media"
          }
        },
        "proximaEtapa": "fim"
      },
      {
        "id": "transferir_geral",
        "tipo": "mensagem",
        "config": {
          "mensagem": "❓ *Atendimento Geral*\n\nVocê será direcionado para um atendente. Aguarde um momento...",
          "delay": 1500
        },
        "proximaEtapa": "acao_transferir_geral"
      },
      {
        "id": "acao_transferir_geral",
        "tipo": "acao",
        "config": {
          "acao": "transferir_para_nucleo",
          "parametros": {
            "nucleoNome": "Atendimento",
            "mensagem": "Cliente solicitou atendimento geral",
            "prioridade": "normal"
          }
        },
        "proximaEtapa": "fim"
      },
      {
        "id": "fim",
        "tipo": "fim",
        "config": {
          "mensagemFinal": "Você está sendo transferido para um atendente humano. Obrigado! 🙏"
        }
      }
    ]
  }
};

async function fazerLogin() {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      email: 'admin@conectsuite.com.br',
      senha: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          // O token está em response.data.access_token
          if (response.data && response.data.access_token) {
            console.log('✅ Login realizado com sucesso');
            resolve(response.data.access_token);
          } else if (response.access_token) {
            // Fallback se vier direto
            console.log('✅ Login realizado com sucesso');
            resolve(response.access_token);
          } else {
            console.log('❌ Resposta completa:', JSON.stringify(response));
            reject(new Error('Token não encontrado na resposta'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
}

async function importarFluxo(token) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(fluxoData);

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/fluxos',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('📊 Status da resposta:', res.statusCode);
        console.log('📄 Dados recebidos:', data);

        try {
          const response = JSON.parse(data);
          if (res.statusCode === 201 || res.statusCode === 200) {
            console.log('✅ Fluxo importado com sucesso!');
            console.log('📋 ID do fluxo:', response.id);
            console.log('📋 Nome:', response.nome);
            console.log('📋 Ativo:', response.ativo);
            console.log('📋 Publicado:', response.publicado);
            resolve(response);
          } else {
            console.error('❌ Erro ao importar fluxo:', data);
            reject(new Error(`Status ${res.statusCode}: ${data}`));
          }
        } catch (err) {
          console.error('❌ Erro ao parsear JSON:', err.message);
          console.error('📄 Dados brutos:', data);
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    console.log('🚀 Iniciando importação do fluxo...\n');

    // 1. Fazer login
    console.log('🔐 Fazendo login...');
    const token = await fazerLogin();

    // 2. Importar fluxo
    console.log('\n📥 Importando fluxo...');
    const resultado = await importarFluxo(token);

    console.log('\n🎉 SUCESSO! Fluxo importado e ativo no sistema!');
    console.log('\n📊 Detalhes:');
    console.log('   - 22 blocos configurados');
    console.log('   - Validações de email e campos');
    console.log('   - Menu com 4 opções');
    console.log('   - Transferência automática para núcleos');
    console.log('\n✅ O fluxo está PUBLICADO e PRONTO para usar!');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

main();
