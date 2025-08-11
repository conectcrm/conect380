import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, X, Clock, DollarSign, Lock, FileText, Link, Users } from 'lucide-react';

export type TipoConfirmacao = 
  | 'excluir-fatura'
  | 'excluir-fatura-paga'
  | 'excluir-fatura-com-pagamentos'
  | 'excluir-multiplas-faturas'
  | 'cancelar-fatura'
  | 'cancelar-fatura-vencida'
  | 'excluir-contrato'
  | 'excluir-contrato-assinado'
  | 'excluir-contrato-com-faturas'
  | 'excluir-pagamento'
  | 'estornar-pagamento'
  | 'excluir-transacao'
  | 'excluir-categoria-financeira'
  | 'excluir-plano-cobranca'
  | 'excluir-plano-com-assinaturas'
  | 'cancelar-assinatura'
  | 'pausar-assinatura'
  | 'alterar-plano-assinatura'
  | 'excluir-backup-financeiro'
  | 'restaurar-backup'
  | 'limpar-dados-financeiros'
  | 'resetar-configuracoes';

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

interface ModalConfirmacaoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tipo: TipoConfirmacao;
  dados?: DadosContexto;
  loading?: boolean;
}

const getConfirmationConfig = (tipo: TipoConfirmacao, dados?: DadosContexto) => {
  const configs = {
    'excluir-fatura': {
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      title: 'Excluir Fatura',
      message: `Tem certeza que deseja excluir a fatura ${dados?.numero || ''}?`,
      description: 'Esta ação não pode ser desfeita. A fatura será removida permanentemente do sistema.',
      confirmText: 'Sim, Excluir',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      severity: 'warning' as const
    },
    
    'excluir-fatura-paga': {
      icon: Lock,
      iconColor: 'text-red-500',
      title: 'Não é Possível Excluir',
      message: `A fatura ${dados?.numero || ''} não pode ser excluída`,
      description: 'Faturas já pagas não podem ser excluídas para manter a integridade dos registros financeiros. Você pode cancelá-la se necessário.',
      confirmText: 'Entendi',
      confirmColor: 'bg-blue-600 hover:bg-blue-700',
      severity: 'error' as const,
      showCancel: false
    },

    'excluir-fatura-com-pagamentos': {
      icon: DollarSign,
      iconColor: 'text-red-500',
      title: 'Fatura com Pagamentos',
      message: `A fatura ${dados?.numero || ''} possui pagamentos registrados`,
      description: 'Esta fatura tem pagamentos associados. Excluí-la pode causar inconsistências nos relatórios financeiros. Considere cancelá-la ao invés de excluir.',
      confirmText: 'Excluir Mesmo Assim',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      severity: 'error' as const
    },

    'excluir-multiplas-faturas': {
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      title: 'Excluir Múltiplas Faturas',
      message: `Excluir ${dados?.quantidadeItens || 0} faturas selecionadas?`,
      description: 'Esta ação irá excluir todas as faturas selecionadas permanentemente. Verifique se nenhuma delas possui pagamentos ou está vinculada a contratos importantes.',
      confirmText: `Excluir ${dados?.quantidadeItens || 0} Faturas`,
      confirmColor: 'bg-red-600 hover:bg-red-700',
      severity: 'warning' as const
    },

    'cancelar-fatura': {
      icon: X,
      iconColor: 'text-orange-500',
      title: 'Cancelar Fatura',
      message: `Cancelar a fatura ${dados?.numero || ''}?`,
      description: 'A fatura será marcada como cancelada e não poderá mais receber pagamentos. Esta ação pode ser revertida se necessário.',
      confirmText: 'Cancelar Fatura',
      confirmColor: 'bg-orange-600 hover:bg-orange-700',
      severity: 'warning' as const
    },

    'cancelar-fatura-vencida': {
      icon: Clock,
      iconColor: 'text-red-500',
      title: 'Cancelar Fatura Vencida',
      message: `A fatura ${dados?.numero || ''} está vencida desde ${dados?.dataVencimento || ''}`,
      description: 'Cancelar uma fatura vencida pode impactar relatórios de inadimplência. Certifique-se de que o cliente foi devidamente notificado.',
      confirmText: 'Cancelar Fatura',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      severity: 'error' as const
    },

    'excluir-contrato': {
      icon: FileText,
      iconColor: 'text-amber-500',
      title: 'Excluir Contrato',
      message: `Excluir o contrato ${dados?.numero || ''}?`,
      description: 'Esta ação remove permanentemente o contrato do sistema. Certifique-se de que não há faturas ou pagamentos vinculados.',
      confirmText: 'Excluir Contrato',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      severity: 'warning' as const
    },

    'excluir-contrato-assinado': {
      icon: Lock,
      iconColor: 'text-red-500',
      title: 'Contrato Já Assinado',
      message: `O contrato ${dados?.numero || ''} não pode ser excluído`,
      description: 'Contratos assinados têm valor jurídico e não podem ser excluídos. Você pode cancelá-lo ou marcar como inativo se necessário.',
      confirmText: 'Entendi',
      confirmColor: 'bg-blue-600 hover:bg-blue-700',
      severity: 'error' as const,
      showCancel: false
    },

    'excluir-contrato-com-faturas': {
      icon: Link,
      iconColor: 'text-red-500',
      title: 'Contrato com Faturas',
      message: `O contrato ${dados?.numero || ''} possui faturas vinculadas`,
      description: 'Este contrato tem faturas geradas. Excluí-lo pode causar problemas nos registros financeiros. Exclua primeiro as faturas vinculadas.',
      confirmText: 'Excluir Mesmo Assim',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      severity: 'error' as const
    },

    'excluir-pagamento': {
      icon: DollarSign,
      iconColor: 'text-amber-500',
      title: 'Excluir Pagamento',
      message: 'Excluir este registro de pagamento?',
      description: 'Esta ação remove o pagamento do sistema e pode afetar o status da fatura associada. Use com cuidado para manter a integridade financeira.',
      confirmText: 'Excluir Pagamento',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      severity: 'warning' as const
    },

    'estornar-pagamento': {
      icon: AlertCircle,
      iconColor: 'text-red-500',
      title: 'Estornar Pagamento',
      message: `Estornar pagamento de R$ ${dados?.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}?`,
      description: 'O estorno irá reverter este pagamento e alterar o status da fatura para pendente. Esta ação deve ser usada apenas em casos de erro ou devolução autorizada.',
      confirmText: 'Confirmar Estorno',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      severity: 'error' as const
    },

    'excluir-transacao': {
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      title: 'Excluir Transação',
      message: 'Excluir esta transação financeira?',
      description: 'A transação será removida permanentemente dos registros financeiros. Isso pode afetar relatórios e balanços contábeis.',
      confirmText: 'Excluir Transação',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      severity: 'warning' as const
    },

    'excluir-categoria-financeira': {
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      title: 'Excluir Categoria',
      message: 'Excluir esta categoria financeira?',
      description: 'Todas as transações vinculadas a esta categoria ficarão sem classificação. Considere reclassificar as transações antes de excluir.',
      confirmText: 'Excluir Categoria',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      severity: 'warning' as const
    },

    'excluir-plano-cobranca': {
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      title: 'Excluir Plano de Cobrança',
      message: 'Excluir este plano de cobrança?',
      description: 'O plano será removido permanentemente. Certifique-se de que não há assinaturas ativas utilizando este plano.',
      confirmText: 'Excluir Plano',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      severity: 'warning' as const
    },

    'excluir-plano-com-assinaturas': {
      icon: Users,
      iconColor: 'text-red-500',
      title: 'Plano com Assinaturas Ativas',
      message: 'Este plano possui assinaturas ativas',
      description: `Existem ${dados?.quantidadeItens || 0} assinaturas ativas usando este plano. Cancele ou migre as assinaturas antes de excluir o plano.`,
      confirmText: 'Entendi',
      confirmColor: 'bg-blue-600 hover:bg-blue-700',
      severity: 'error' as const,
      showCancel: false
    },

    'cancelar-assinatura': {
      icon: X,
      iconColor: 'text-orange-500',
      title: 'Cancelar Assinatura',
      message: `Cancelar assinatura de ${dados?.cliente || 'cliente'}?`,
      description: 'A assinatura será cancelada e não gerará mais faturas automáticas. O cliente perderá acesso aos serviços no próximo ciclo.',
      confirmText: 'Cancelar Assinatura',
      confirmColor: 'bg-orange-600 hover:bg-orange-700',
      severity: 'warning' as const
    },

    'pausar-assinatura': {
      icon: Clock,
      iconColor: 'text-blue-500',
      title: 'Pausar Assinatura',
      message: `Pausar assinatura de ${dados?.cliente || 'cliente'}?`,
      description: 'A assinatura será pausada temporariamente. Não serão geradas faturas até que seja reativada.',
      confirmText: 'Pausar Assinatura',
      confirmColor: 'bg-blue-600 hover:bg-blue-700',
      severity: 'info' as const
    },

    'alterar-plano-assinatura': {
      icon: Info,
      iconColor: 'text-blue-500',
      title: 'Alterar Plano da Assinatura',
      message: 'Alterar o plano desta assinatura?',
      description: 'A alteração será aplicada no próximo ciclo de cobrança. O valor e condições seguirão as regras do novo plano.',
      confirmText: 'Alterar Plano',
      confirmColor: 'bg-blue-600 hover:bg-blue-700',
      severity: 'info' as const
    },

    'excluir-backup-financeiro': {
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      title: 'Excluir Backup Financeiro',
      message: 'Excluir este backup dos dados financeiros?',
      description: 'Esta é uma ação irreversível. O backup será permanentemente removido e não poderá ser recuperado.',
      confirmText: 'Excluir Backup',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      severity: 'error' as const
    },

    'restaurar-backup': {
      icon: AlertCircle,
      iconColor: 'text-orange-500',
      title: 'Restaurar Backup',
      message: 'Restaurar dados financeiros do backup?',
      description: 'ATENÇÃO: Esta ação irá substituir todos os dados financeiros atuais pelos dados do backup. Todas as alterações feitas após a data do backup serão perdidas.',
      confirmText: 'Confirmar Restauração',
      confirmColor: 'bg-orange-600 hover:bg-orange-700',
      severity: 'error' as const
    },

    'limpar-dados-financeiros': {
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      title: 'Limpar Dados Financeiros',
      message: 'Limpar todos os dados financeiros?',
      description: 'ATENÇÃO: Esta ação irá remover PERMANENTEMENTE todas as faturas, pagamentos, contratos e transações. Esta ação NÃO PODE ser desfeita.',
      confirmText: 'CONFIRMAR LIMPEZA',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      severity: 'error' as const
    },

    'resetar-configuracoes': {
      icon: Info,
      iconColor: 'text-blue-500',
      title: 'Resetar Configurações',
      message: 'Resetar todas as configurações financeiras?',
      description: 'As configurações voltarão aos valores padrão. Seus dados financeiros não serão afetados, apenas as preferências e personalizações.',
      confirmText: 'Resetar Configurações',
      confirmColor: 'bg-blue-600 hover:bg-blue-700',
      severity: 'info' as const
    }
  };

  return configs[tipo] || configs['excluir-fatura'];
};

const ModalConfirmacao: React.FC<ModalConfirmacaoProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tipo,
  dados,
  loading = false
}) => {
  if (!isOpen) return null;

  const config = getConfirmationConfig(tipo, dados);
  const IconComponent = config.icon;
  const showCancel = config.showCancel !== false;

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className={`px-6 py-4 border-b ${getSeverityColors(config.severity)}`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.severity === 'error' ? 'bg-red-100' : config.severity === 'warning' ? 'bg-amber-100' : 'bg-blue-100'} flex items-center justify-center`}>
                <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {config.title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="ml-auto flex-shrink-0 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-900 mb-2">
                {config.message}
              </p>
              <p className="text-sm text-gray-600">
                {config.description}
              </p>
            </div>

            {/* Dados contextuais adicionais */}
            {dados && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1">
                {dados.cliente && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Cliente:</span> {dados.cliente}
                  </div>
                )}
                {dados.valor && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Valor:</span> R$ {dados.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                )}
                {dados.status && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Status:</span> {dados.status}
                  </div>
                )}
                {dados.observacoes && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Observações:</span> {dados.observacoes}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
            {showCancel && (
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center ${config.confirmColor}`}
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              )}
              {config.confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacao;
