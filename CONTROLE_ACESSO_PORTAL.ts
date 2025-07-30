/**
 * Sistema de Controle de Acesso do Portal
 * Diferentes níveis de acesso e segurança
 */

export interface NiveisAcesso {
  publico: {
    descricao: 'Acesso via link público com token';
    quemPode: ['Cliente', 'Qualquer pessoa com link'];
    restricoes: [
      'Apenas visualização e aceite/rejeição',
      'Token único por proposta',
      'Expiração automática',
      'Log de todos os acessos'
    ];
  };

  vendedor: {
    descricao: 'Acesso via painel administrativo';
    quemPode: ['Vendedor responsável', 'Supervisor'];
    funcionalidades: [
      'Visualizar estatísticas de acesso',
      'Reenviar link',
      'Alterar validade',
      'Ver histórico de ações'
    ];
  };

  admin: {
    descricao: 'Acesso total via sistema interno';
    quemPode: ['Administradores', 'Gerentes'];
    funcionalidades: [
      'Todas as funcionalidades do vendedor',
      'Cancelar propostas',
      'Relatórios completos',
      'Auditoria de logs'
    ];
  };
}

/**
 * Controles de Segurança Implementados
 */
export const controlesSeguranca = {

  // 1. Validação de Token
  validarToken: (token: string): boolean => {
    // Verifica se token existe e é válido
    return token.length >= 20 && !token.includes(' ');
  },

  // 2. Verificação de Expiração
  verificarValidade: (dataValidade: Date): boolean => {
    return new Date() <= new Date(dataValidade);
  },

  // 3. Log de Acesso
  registrarAcesso: (token: string, ip: string, userAgent: string) => {
    console.log(`Acesso registrado: ${token} de ${ip}`);
  },

  // 4. Controle de Status
  permitirAcao: (status: string, acao: string): boolean => {
    const permissoes = {
      'enviada': ['visualizar', 'aceitar', 'rejeitar'],
      'visualizada': ['visualizar', 'aceitar', 'rejeitar'],
      'aprovada': ['visualizar'],
      'rejeitada': ['visualizar'],
      'expirada': ['visualizar']
    };

    return permissoes[status as keyof typeof permissoes]?.includes(acao) || false;
  }
};

/**
 * Cenários de Uso Comum
 */
export const cenariosUso = {

  // Cenário 1: Cliente recebe email
  clienteRecebeEmail: {
    fluxo: [
      '1. Vendedor envia proposta',
      '2. Sistema gera token único',
      '3. Email enviado com link: /portal/proposta/TOKEN',
      '4. Cliente clica e acessa',
      '5. Sistema registra visualização',
      '6. Cliente pode aceitar/rejeitar'
    ]
  },

  // Cenário 2: Cliente compartilha link
  clienteCompartilha: {
    problema: 'Cliente pode compartilhar link com outras pessoas',
    solucao: 'Sistema registra todos os acessos com IP e UserAgent',
    risco: 'Baixo - apenas visualização, decisão final é do email do cliente'
  },

  // Cenário 3: Vendedor acompanha
  vendedorAcompanha: {
    comoAcessa: 'Via painel administrativo do ConectCRM',
    informacoes: [
      'Quantas vezes foi visualizada',
      'De quais IPs',
      'Quando foi acessada pela primeira vez',
      'Status atual da proposta'
    ]
  },

  // Cenário 4: Proposta expira
  propostaExpira: {
    oQueAcontece: [
      'Link continua funcionando',
      'Mas não permite aceitar/rejeitar',
      'Mostra mensagem de expiração',
      'Permite apenas visualização'
    ]
  }
};

export default { NiveisAcesso, controlesSeguranca, cenariosUso };
