import { useState, useCallback } from 'react';
import { TipoNotificacao } from '../components/common/NotificacaoSucesso';

interface NotificacaoState {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  autoClose?: boolean;
  duration?: number;
}

interface NotificationPayload {
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  autoClose?: boolean;
  duration?: number;
}

interface UseNotificacaoReturn {
  notificacoes: NotificacaoState[];
  mostrarSucesso: (titulo: string, mensagem: string, autoClose?: boolean) => void;
  mostrarInfo: (titulo: string, mensagem: string, autoClose?: boolean) => void;
  mostrarAviso: (titulo: string, mensagem: string, autoClose?: boolean) => void;
  mostrarErro: (titulo: string, mensagem: string, autoClose?: boolean) => void;
  fecharNotificacao: (id: string) => void;
  limparTodas: () => void;
  showNotification: (payload: NotificationPayload) => void;
}

export const useNotificacao = (): UseNotificacaoReturn => {
  const [notificacoes, setNotificacoes] = useState<NotificacaoState[]>([]);

  const adicionarNotificacao = useCallback((
    tipo: TipoNotificacao,
    titulo: string,
    mensagem: string,
    autoClose: boolean = true,
    duration: number = 3000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const novaNotificacao: NotificacaoState = {
      id,
      tipo,
      titulo,
      mensagem,
      autoClose,
      duration
    };

    setNotificacoes(prev => [...prev, novaNotificacao]);

    // Auto-remover se autoClose estiver ativo
    if (autoClose) {
      setTimeout(() => {
        fecharNotificacao(id);
      }, duration);
    }
  }, []);

  const mostrarSucesso = useCallback((titulo: string, mensagem: string, autoClose: boolean = true) => {
    adicionarNotificacao('sucesso', titulo, mensagem, autoClose);
  }, [adicionarNotificacao]);

  const mostrarInfo = useCallback((titulo: string, mensagem: string, autoClose: boolean = true) => {
    adicionarNotificacao('info', titulo, mensagem, autoClose);
  }, [adicionarNotificacao]);

  const mostrarAviso = useCallback((titulo: string, mensagem: string, autoClose: boolean = true) => {
    adicionarNotificacao('aviso', titulo, mensagem, autoClose);
  }, [adicionarNotificacao]);

  const mostrarErro = useCallback((titulo: string, mensagem: string, autoClose: boolean = false) => {
    adicionarNotificacao('erro', titulo, mensagem, autoClose, 5000);
  }, [adicionarNotificacao]);

  const fecharNotificacao = useCallback((id: string) => {
    setNotificacoes(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const limparTodas = useCallback(() => {
    setNotificacoes([]);
  }, []);

  const showNotification = useCallback((payload: NotificationPayload) => {
    adicionarNotificacao(
      payload.tipo,
      payload.titulo,
      payload.mensagem,
      payload.autoClose,
      payload.duration
    );
  }, [adicionarNotificacao]);

  return {
    notificacoes,
    mostrarSucesso,
    mostrarInfo,
    mostrarAviso,
    mostrarErro,
    fecharNotificacao,
    limparTodas,
    showNotification
  };
};

// Hook específico para ações financeiras
interface UseNotificacaoFinanceiraReturn extends UseNotificacaoReturn {
  sucesso: {
    faturaExcluida: (numero?: string) => void;
    faturasExcluidasEmMassa: (quantidade: number) => void;
    faturaCancelada: (numero?: string) => void;
    pagamentoRegistrado: (valor?: number) => void;
    pagamentoEstornado: (valor?: number) => void;
    contratoCriado: (numero?: string) => void;
    contratoAtualizado: (numero?: string) => void;
    fornecedorCriado: (nome?: string) => void;
    fornecedorAtualizado: (nome?: string) => void;
    fornecedorExcluido: (nome?: string) => void;
    configuracoesAtualizadas: () => void;
    backupCriado: () => void;
    backupRestaurado: () => void;
  };
  erro: {
    operacaoFalhou: (operacao: string, detalhes?: string) => void;
    conexaoFalhou: () => void;
    validacaoFalhou: (campo: string) => void;
    permissaoNegada: (acao: string) => void;
  };
}

export const useNotificacaoFinanceira = (): UseNotificacaoFinanceiraReturn => {
  const notificacao = useNotificacao();

  const sucesso = {
    faturaExcluida: (numero?: string) => {
      notificacao.mostrarSucesso(
        'Fatura Excluída',
        numero ? `A fatura ${numero} foi excluída com sucesso.` : 'Fatura excluída com sucesso.'
      );
    },

    faturasExcluidasEmMassa: (quantidade: number) => {
      notificacao.mostrarSucesso(
        'Faturas Excluídas',
        `${quantidade} fatura${quantidade > 1 ? 's' : ''} excluída${quantidade > 1 ? 's' : ''} com sucesso.`
      );
    },

    faturaCancelada: (numero?: string) => {
      notificacao.mostrarSucesso(
        'Fatura Cancelada',
        numero ? `A fatura ${numero} foi cancelada.` : 'Fatura cancelada com sucesso.'
      );
    },

    pagamentoRegistrado: (valor?: number) => {
      const valorFormatado = valor ? `de R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
      notificacao.mostrarSucesso(
        'Pagamento Registrado',
        `Pagamento ${valorFormatado} registrado com sucesso.`
      );
    },

    pagamentoEstornado: (valor?: number) => {
      const valorFormatado = valor ? `de R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
      notificacao.mostrarSucesso(
        'Pagamento Estornado',
        `Estorno ${valorFormatado} processado com sucesso.`
      );
    },

    contratoCriado: (numero?: string) => {
      notificacao.mostrarSucesso(
        'Contrato Criado',
        numero ? `Contrato ${numero} criado com sucesso.` : 'Contrato criado com sucesso.'
      );
    },

    contratoAtualizado: (numero?: string) => {
      notificacao.mostrarSucesso(
        'Contrato Atualizado',
        numero ? `Contrato ${numero} atualizado com sucesso.` : 'Contrato atualizado com sucesso.'
      );
    },

    fornecedorCriado: (nome?: string) => {
      notificacao.mostrarSucesso(
        'Fornecedor Criado',
        nome ? `Fornecedor ${nome} criado com sucesso.` : 'Fornecedor criado com sucesso.'
      );
    },

    fornecedorAtualizado: (nome?: string) => {
      notificacao.mostrarSucesso(
        'Fornecedor Atualizado',
        nome ? `Fornecedor ${nome} atualizado com sucesso.` : 'Fornecedor atualizado com sucesso.'
      );
    },

    fornecedorExcluido: (nome?: string) => {
      notificacao.mostrarSucesso(
        'Fornecedor Excluído',
        nome ? `Fornecedor ${nome} excluído com sucesso.` : 'Fornecedor excluído com sucesso.'
      );
    },

    configuracoesAtualizadas: () => {
      notificacao.mostrarSucesso(
        'Configurações Atualizadas',
        'As configurações foram salvas com sucesso.'
      );
    },

    backupCriado: () => {
      notificacao.mostrarSucesso(
        'Backup Criado',
        'Backup dos dados financeiros criado com sucesso.'
      );
    },

    backupRestaurado: () => {
      notificacao.mostrarSucesso(
        'Backup Restaurado',
        'Dados financeiros restaurados a partir do backup.'
      );
    }
  };

  const erro = {
    operacaoFalhou: (operacao: string, detalhes?: string) => {
      notificacao.mostrarErro(
        'Operação Falhou',
        detalhes ? `Erro ao ${operacao}: ${detalhes}` : `Erro ao executar ${operacao}. Tente novamente.`
      );
    },

    conexaoFalhou: () => {
      notificacao.mostrarErro(
        'Erro de Conexão',
        'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
      );
    },

    validacaoFalhou: (campo: string) => {
      notificacao.mostrarErro(
        'Dados Inválidos',
        `O campo ${campo} contém dados inválidos. Verifique e tente novamente.`
      );
    },

    permissaoNegada: (acao: string) => {
      notificacao.mostrarErro(
        'Permissão Negada',
        `Você não tem permissão para ${acao}. Entre em contato com o administrador.`
      );
    }
  };

  return {
    ...notificacao,
    sucesso,
    erro
  };
};

export default useNotificacao;
