/**
 * Exemplo de Uso - Sistema de E-mail ConectCRM
 * Este arquivo mostra como usar o sistema de e-mail na prática
 */

import React, { useState } from 'react';
import { emailServiceReal } from '../services/emailServiceReal';
import { gerarTokenNumerico, formatarTokenParaExibicao } from '../utils/tokenUtils';

// Para demonstração - em um projeto real você usaria react-hot-toast ou similar
const toast = {
  success: (msg: string) => alert('✅ ' + msg),
  error: (msg: string) => alert('❌ ' + msg)
};

// ============================================
// EXEMPLO 1: ENVIO MANUAL DE PROPOSTA
// ============================================

export const exemploEnvioProposta = async () => {
  // 1. Gerar token para a proposta
  const token = gerarTokenNumerico();
  console.log('Token gerado:', formatarTokenParaExibicao(token));

  // 2. Preparar dados da proposta
  const dadosProposta = {
    cliente: {
      nome: 'João Silva',
      email: 'joao@exemplo.com'
    },
    proposta: {
      numero: '2024-001',
      valorTotal: 5000.00,
      dataValidade: '31/12/2024',
      token: token
    },
    vendedor: {
      nome: 'Maria Santos',
      email: 'maria@conectcrm.com',
      telefone: '(11) 99999-9999'
    },
    empresa: {
      nome: 'ConectCRM',
      email: 'contato@conectcrm.com',
      telefone: '(11) 88888-8888',
      endereco: 'Rua das Empresas, 123 - São Paulo/SP'
    },
    portalUrl: 'http://localhost:3000/portal'
  };

  // 3. Enviar e-mail
  try {
    const resultado = await emailServiceReal.enviarPropostaParaCliente(dadosProposta);

    if (resultado.success) {
      console.log('✅ E-mail enviado com sucesso!');
      console.log('📧 ID da mensagem:', resultado.messageId);
      console.log('⚙️ Provedor usado:', resultado.provider);
    } else {
      console.log('❌ Erro no envio:', resultado.error);
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }
};

// ============================================
// EXEMPLO 2: TESTE DE CONFIGURAÇÃO
// ============================================

export const exemploTesteConfiguracao = async () => {
  try {
    // Testar com seu próprio e-mail
    const resultado = await emailServiceReal.testarConfiguracao('seu-email@exemplo.com');

    console.log('Resultado do teste:', resultado);

    if (resultado.success) {
      console.log('✅ Configuração está funcionando!');
      console.log('📧 Verifique sua caixa de entrada');
    } else {
      console.log('❌ Problema na configuração:', resultado.error);
    }
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

// ============================================
// EXEMPLO 3: VERIFICAR STATUS DO PROVEDOR
// ============================================

export const exemploVerificarStatus = () => {
  const info = emailServiceReal.getProviderInfo();

  console.log('📊 Informações do provedor atual:');
  console.log('  Provedor:', info.provider);
  console.log('  Debug ativo:', info.isDebug);
  console.log('  Modo teste:', info.isTest);
  console.log('  Configuração:', info.info);
};

// ============================================
// EXEMPLO 4: USO NO COMPONENTE REACT
// ============================================

export const ExemploComponenteEmail: React.FC = () => {
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const enviarPropostaTeste = async () => {
    setEnviando(true);
    setResultado(null);

    try {
      const token = gerarTokenNumerico();

      const dados = {
        cliente: {
          nome: 'Cliente Teste',
          email: 'cliente@teste.com'
        },
        proposta: {
          numero: 'TESTE-001',
          valorTotal: 1500.00,
          dataValidade: '31/12/2024',
          token: token
        },
        vendedor: {
          nome: 'Vendedor Teste',
          email: 'vendedor@conectcrm.com',
          telefone: '(11) 99999-9999'
        },
        empresa: {
          nome: 'ConectCRM',
          email: 'contato@conectcrm.com',
          telefone: '(11) 88888-8888',
          endereco: 'São Paulo/SP'
        },
        portalUrl: window.location.origin + '/portal'
      };

      const resultado = await emailServiceReal.enviarPropostaParaCliente(dados);
      setResultado(resultado);

      if (resultado.success) {
        toast.success('E-mail enviado com sucesso!');
      } else {
        toast.error('Erro ao enviar: ' + resultado.error);
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro no envio do e-mail');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Teste de E-mail</h3>

      <button
        onClick={enviarPropostaTeste}
        disabled={enviando}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {enviando ? 'Enviando...' : 'Enviar E-mail Teste'}
      </button>

      {resultado && (
        <div className={`mt-4 p-4 rounded ${resultado.success ? 'bg-green-100' : 'bg-red-100'}`}>
          <h4 className="font-bold">Resultado:</h4>
          <pre>{JSON.stringify(resultado, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

// ============================================
// EXEMPLO 5: CONFIGURAÇÃO PARA PRODUÇÃO
// ============================================

export const configuracaoProducao = {
  // Variáveis de ambiente para produção
  envVars: {
    // Gmail
    REACT_APP_EMAIL_PROVIDER: 'gmail',
    REACT_APP_EMAIL_USER: 'contato@suaempresa.com',
    REACT_APP_EMAIL_PASSWORD: 'senha-de-app-do-gmail',

    // Empresa
    REACT_APP_EMPRESA_NOME: 'Sua Empresa LTDA',
    REACT_APP_EMPRESA_EMAIL: 'contato@suaempresa.com',
    REACT_APP_EMPRESA_TELEFONE: '(11) 99999-9999',
    REACT_APP_EMPRESA_ENDERECO: 'Rua da Empresa, 123 - Cidade/SP',

    // Portal
    REACT_APP_PORTAL_URL: 'https://seudominio.com/portal',

    // Debug (desligar em produção)
    REACT_APP_EMAIL_DEBUG: 'false',
    REACT_APP_EMAIL_TEST_MODE: 'false'
  },

  // Configurações recomendadas
  recomendacoes: [
    '🔒 Use senhas de app do Gmail, não senha normal',
    '🌐 Configure domínio próprio no SendGrid',
    '📧 Teste com e-mails reais antes de usar',
    '📊 Monitor logs de envio em produção',
    '🔄 Configure backup de provedores',
    '🛡️ Use HTTPS em produção sempre'
  ]
};

// Para usar os exemplos, chame as funções:
/*
// Testar envio de proposta
exemploEnvioProposta();

// Testar configuração
exemploTesteConfiguracao();

// Verificar status
exemploVerificarStatus();
*/

export default {
  exemploEnvioProposta,
  exemploTesteConfiguracao,
  exemploVerificarStatus,
  ExemploComponenteEmail,
  configuracaoProducao
};
