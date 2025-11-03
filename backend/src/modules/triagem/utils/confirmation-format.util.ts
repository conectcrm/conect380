/**
 * 📋 Utilitário para formatação de mensagens de confirmação de dados
 */

/**
 * Formata mensagem de confirmação de dados cadastrados
 * @param contexto Contexto da sessão com dados do cliente
 * @returns Mensagem formatada com emojis
 */
export function formatarConfirmacaoDados(contexto: Record<string, any>): string {
  const linhas: string[] = [];

  linhas.push('✅ *Dados Cadastrados*');
  linhas.push('');

  // Nome
  if (contexto.nome) {
    linhas.push(`👤 *Nome:* ${contexto.nome}`);
  }

  // Email
  if (contexto.email) {
    linhas.push(`📧 *E-mail:* ${contexto.email}`);
  }

  // Empresa
  if (contexto.empresa) {
    linhas.push(`🏢 *Empresa:* ${contexto.empresa}`);
  }

  // Telefone (opcional, geralmente já conhecido)
  if (contexto.telefone && contexto.telefone !== contexto.__telefoneOriginal) {
    linhas.push(`📞 *Telefone:* ${contexto.telefone}`);
  }

  // Cargo (se preenchido)
  if (contexto.cargo) {
    linhas.push(`💼 *Cargo:* ${contexto.cargo}`);
  }

  linhas.push('');
  linhas.push('*Os dados estão corretos?*');
  linhas.push('');
  linhas.push('✅ Digite *SIM* para confirmar');
  linhas.push('❌ Digite *NÃO* para corrigir');

  return linhas.join('\n');
}

/**
 * Valida se resposta é confirmação (sim/yes/ok/correto)
 */
export function eConfirmacao(resposta: string): boolean {
  if (!resposta) return false;

  const respostaNormalizada = resposta.toLowerCase().trim();

  const confirmacoesValidas = [
    'sim',
    'yes',
    's',
    'ok',
    'correto',
    'confirmo',
    'confirmar',
    'certo',
    '1',
    'verdade',
  ];

  return confirmacoesValidas.includes(respostaNormalizada);
}

/**
 * Valida se resposta é negação (não/no/errado/incorreto)
 */
export function eNegacao(resposta: string): boolean {
  if (!resposta) return false;

  const respostaNormalizada = resposta.toLowerCase().trim();

  const negacoesValidas = [
    'não',
    'nao',
    'no',
    'n',
    'errado',
    'incorreto',
    'corrigir',
    'mudar',
    'alterar',
    '0',
    'falso',
  ];

  return negacoesValidas.includes(respostaNormalizada);
}

/**
 * Formata mensagem para solicitar correção
 */
export function formatarMensagemCorrecao(): string {
  return (
    '🔄 *Vamos corrigir seus dados*\n\n' +
    'Por favor, informe novamente:\n' +
    '👤 Seu nome completo'
  );
}
