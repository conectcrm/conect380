import { useState, useCallback } from 'react';
import { TipoConfirmacao } from '../components/common/ModalConfirmacao';
import { useNotificacaoFinanceira } from './useNotificacao';

interface DadosContexto {
  numero?: string;
  valor?: number;
  cliente?: string;
  dataVencimento?: string;
  status?: string;
  quantidadeItens?: number;
  temDependencias?: boolean;
  observacoes?: string;
}

interface UseConfirmacaoInteligenteReturn {
  isOpen: boolean;
  loading: boolean;
  confirmar: (
    tipo: TipoConfirmacao,
    acao: () => Promise<void> | void,
    dados?: DadosContexto
  ) => void;
  fechar: () => void;
  executarConfirmacao: () => void;
  tipo: TipoConfirmacao | null;
  dados: DadosContexto | undefined;
}

export const useConfirmacaoInteligente = (): UseConfirmacaoInteligenteReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acaoPendente, setAcaoPendente] = useState<(() => Promise<void> | void) | null>(null);
  const [tipo, setTipo] = useState<TipoConfirmacao | null>(null);
  const [dados, setDados] = useState<DadosContexto | undefined>(undefined);
  
  // Hook de notificações para feedback de sucesso
  const notificacao = useNotificacaoFinanceira();

  const mostrarNotificacaoSucesso = useCallback((tipo: TipoConfirmacao, dados?: DadosContexto) => {
    switch (tipo) {
      case 'excluir-fatura':
        notificacao.sucesso.faturaExcluida(dados?.numero);
        break;
      case 'excluir-multiplas-faturas':
        notificacao.sucesso.faturasExcluidasEmMassa(dados?.quantidadeItens || 0);
        break;
      case 'cancelar-fatura':
      case 'cancelar-fatura-vencida':
        notificacao.sucesso.faturaCancelada(dados?.numero);
        break;
      case 'estornar-pagamento':
        notificacao.sucesso.pagamentoEstornado(dados?.valor);
        break;
      case 'excluir-pagamento':
        notificacao.sucesso.pagamentoRegistrado(dados?.valor);
        break;
      case 'excluir-transacao':
        if (dados?.cliente) {
          // Se tem cliente, é fornecedor
          notificacao.sucesso.fornecedorExcluido(dados.cliente);
        } else {
          notificacao.mostrarSucesso('Transação Excluída', 'Transação excluída com sucesso.');
        }
        break;
      case 'excluir-categoria-financeira':
        notificacao.mostrarSucesso(
          'Exclusão Concluída', 
          `${dados?.quantidadeItens || 1} item(ns) excluído(s) com sucesso.`
        );
        break;
      default:
        notificacao.mostrarSucesso('Operação Concluída', 'Ação executada com sucesso.');
    }
  }, [notificacao]);

  const confirmar = useCallback((
    tipoConfirmacao: TipoConfirmacao,
    acao: () => Promise<void> | void,
    dadosContexto?: DadosContexto
  ) => {
    setTipo(tipoConfirmacao);
    setDados(dadosContexto);
    setAcaoPendente(() => acao);
    setIsOpen(true);
  }, []);

  const fechar = useCallback(() => {
    setIsOpen(false);
    setLoading(false);
    setAcaoPendente(null);
    setTipo(null);
    setDados(undefined);
  }, []);

  const executarConfirmacao = useCallback(async () => {
    if (!acaoPendente) return;

    try {
      setLoading(true);
      await acaoPendente();
      
      // Mostrar notificação de sucesso baseada no tipo de ação
      if (tipo) {
        mostrarNotificacaoSucesso(tipo, dados);
      }
      
      fechar();
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      setLoading(false);
      
      // Mostrar notificação de erro
      notificacao.erro.operacaoFalhou('executar ação', error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }, [acaoPendente, fechar, tipo, dados]);

  return {
    isOpen,
    loading,
    confirmar,
    fechar,
    executarConfirmacao,
    tipo,
    dados
  };
};

// Hook específico para validações financeiras
interface UseValidacaoFinanceiraReturn {
  validarExclusaoFatura: (fatura: any) => TipoConfirmacao;
  validarExclusaoContrato: (contrato: any) => TipoConfirmacao;
  validarExclusaoPagamento: (pagamento: any) => TipoConfirmacao;
  validarCancelamentoAssinatura: (assinatura: any) => TipoConfirmacao;
  obterDadosContexto: (item: any, tipo: TipoConfirmacao) => DadosContexto;
}

export const useValidacaoFinanceira = (): UseValidacaoFinanceiraReturn => {
  const validarExclusaoFatura = useCallback((fatura: any): TipoConfirmacao => {
    if (fatura.status === 'paga' || fatura.status === 'PAGA') {
      return 'excluir-fatura-paga';
    }
    
    if (fatura.pagamentos && fatura.pagamentos.length > 0) {
      return 'excluir-fatura-com-pagamentos';
    }
    
    return 'excluir-fatura';
  }, []);

  const validarExclusaoContrato = useCallback((contrato: any): TipoConfirmacao => {
    if (contrato.status === 'assinado' || contrato.assinado) {
      return 'excluir-contrato-assinado';
    }
    
    if (contrato.faturas && contrato.faturas.length > 0) {
      return 'excluir-contrato-com-faturas';
    }
    
    return 'excluir-contrato';
  }, []);

  const validarExclusaoPagamento = useCallback((pagamento: any): TipoConfirmacao => {
    if (pagamento.status === 'processado' || pagamento.confirmado) {
      return 'estornar-pagamento';
    }
    
    return 'excluir-pagamento';
  }, []);

  const validarCancelamentoAssinatura = useCallback((assinatura: any): TipoConfirmacao => {
    if (assinatura.status === 'pausada') {
      return 'cancelar-assinatura';
    }
    
    return 'cancelar-assinatura';
  }, []);

  const obterDadosContexto = useCallback((item: any, tipo: TipoConfirmacao): DadosContexto => {
    const dados: DadosContexto = {};

    // Dados específicos por tipo
    switch (tipo) {
      case 'excluir-fatura':
      case 'excluir-fatura-paga':
      case 'excluir-fatura-com-pagamentos':
      case 'cancelar-fatura':
      case 'cancelar-fatura-vencida':
        dados.numero = item.numero || item.id;
        dados.valor = item.valor || item.total;
        dados.cliente = item.cliente?.nome || item.clienteNome || item.cliente;
        dados.status = item.status;
        dados.dataVencimento = item.dataVencimento ? 
          new Date(item.dataVencimento).toLocaleDateString('pt-BR') : undefined;
        break;

      case 'excluir-contrato':
      case 'excluir-contrato-assinado':
      case 'excluir-contrato-com-faturas':
        dados.numero = item.numero || item.id;
        dados.cliente = item.cliente?.nome || item.clienteNome || item.cliente;
        dados.status = item.status;
        dados.valor = item.valorTotal || item.valor;
        break;

      case 'excluir-pagamento':
      case 'estornar-pagamento':
        dados.valor = item.valor || item.total;
        dados.cliente = item.cliente?.nome || item.clienteNome || item.cliente;
        dados.status = item.status;
        break;

      case 'cancelar-assinatura':
      case 'pausar-assinatura':
        dados.cliente = item.cliente?.nome || item.clienteNome || item.cliente;
        dados.valor = item.valorMensal || item.valor;
        dados.status = item.status;
        break;

      case 'excluir-multiplas-faturas':
        dados.quantidadeItens = item.length || item.quantidade;
        break;

      case 'excluir-plano-com-assinaturas':
        dados.quantidadeItens = item.assinaturasAtivas || item.quantidade;
        break;

      default:
        // Dados genéricos
        dados.numero = item.numero || item.id;
        dados.cliente = item.cliente?.nome || item.clienteNome || item.cliente;
        dados.valor = item.valor || item.total;
        dados.status = item.status;
        break;
    }

    return dados;
  }, []);

  return {
    validarExclusaoFatura,
    validarExclusaoContrato,
    validarExclusaoPagamento,
    validarCancelamentoAssinatura,
    obterDadosContexto
  };
};

export default useConfirmacaoInteligente;
