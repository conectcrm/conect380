export interface FornecedorDependencyError {
  message: string;
  details: {
    totalContas: number;
    contasAbertas: number;
    contasPagas: number;
    valorEmAberto: number;
    valorPago: number;
    contasDetalhes?: Array<{
      descricao: string;
      valor: number;
      status: string;
      vencimento: Date;
    }>;
  };
}

export interface FornecedorRemovalResponse {
  success: boolean;
  message: string;
  alternative?: {
    action: 'desativar';
    endpoint: string;
    description: string;
  };
  error?: FornecedorDependencyError;
}
