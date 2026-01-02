/**
 * 🎛️ Service de Configuração de Inatividade
 *
 * Comunicação com API de fechamento automático por inatividade
 * Suporta configurações globais (empresa) e específicas (departamento)
 */

import api from './api';

export interface Departamento {
  id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
}

export interface ConfiguracaoInatividade {
  id?: string;
  empresaId: string;
  departamentoId?: string | null;
  departamento?: Departamento | null;
  timeoutMinutos: number;
  enviarAviso: boolean;
  avisoMinutosAntes: number;
  mensagemAviso: string | null;
  mensagemFechamento: string | null;
  ativo: boolean;
  statusAplicaveis: string[] | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ConfiguracaoInactivityDto {
  departamentoId?: string | null;
  timeoutMinutos: number;
  enviarAviso?: boolean;
  avisoMinutosAntes?: number;
  mensagemAviso?: string | null;
  mensagemFechamento?: string | null;
  ativo?: boolean;
  statusAplicaveis?: string[] | null;
}

export interface ConfiguracaoResponse {
  sucesso: boolean;
  dados?: ConfiguracaoInatividade;
  mensagem?: string;
  erro?: string;
  sugestoes?: {
    timeouts: Array<{ valor: number; label: string }>;
    mensagemAvisoPadrao: string;
    mensagemFechamentoPadrao: string;
  };
}

/**
 * Busca configuração da empresa
 * 🔐 empresaId extraído automaticamente do JWT no backend
 * @param departamentoId (Opcional) ID do departamento específico, null para global
 */
export const buscarConfiguracao = async (
  departamentoId?: string | null,
): Promise<ConfiguracaoResponse> => {
  const params = departamentoId !== undefined ? `?departamentoId=${departamentoId || ''}` : '';

  // 🔐 empresaId removido do path - backend pega do JWT
  const response = await api.get(`/atendimento/configuracao-inatividade${params}`);
  return response.data;
};

/**
 * Salva ou atualiza configuração
 * 🔐 empresaId extraído automaticamente do JWT no backend
 */
export const salvarConfiguracao = async (
  dto: ConfiguracaoInactivityDto,
): Promise<ConfiguracaoResponse> => {
  try {
    // 🔐 empresaId removido do path - backend pega do JWT
    const response = await api.post(`/atendimento/configuracao-inatividade`, dto);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao salvar configuração:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Atualiza configuração parcialmente
 * 🔐 empresaId extraído automaticamente do JWT no backend
 */
export const atualizarConfiguracao = async (
  dto: Partial<ConfiguracaoInactivityDto>,
): Promise<ConfiguracaoResponse> => {
  // 🔐 empresaId removido do path - backend pega do JWT
  const response = await api.put(`/atendimento/configuracao-inatividade`, dto);
  return response.data;
};

/**
 * Força verificação manual de tickets inativos
 * @param empresaId (Opcional) ID da empresa específica
 * @param departamentoId (Opcional) ID do departamento específico
 */
export const verificarAgora = async (
  empresaId?: string,
  departamentoId?: string | null,
): Promise<{
  sucesso: boolean;
  resultado: { processados: number; fechados: number; avisados: number };
}> => {
  const params = new URLSearchParams();
  if (empresaId) params.append('empresaId', empresaId);
  if (departamentoId !== undefined) params.append('departamentoId', departamentoId || '');

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await api.post(
    `/atendimento/configuracao-inatividade/verificar-agora${queryString}`,
  );
  return response.data;
};

/**
 * Lista departamentos de uma empresa (para seleção)
 */
export const listarDepartamentos = async (
  empresaId: string,
): Promise<{ sucesso: boolean; dados: Departamento[] }> => {
  const response = await api.get(
    `/atendimento/configuracao-inatividade/departamentos/${empresaId}`,
  );
  return response.data;
};

/**
 * Lista TODAS as configurações de uma empresa (global + departamentos)
 */
export const listarConfiguracoes = async (
  empresaId: string,
): Promise<{ sucesso: boolean; dados: ConfiguracaoInatividade[] }> => {
  const response = await api.get(`/atendimento/configuracao-inatividade/lista/${empresaId}`);
  return response.data;
};

// Export default object para compatibilidade
const configuracaoInactividadeService = {
  buscarConfiguracao,
  salvarConfiguracao,
  atualizarConfiguracao,
  verificarAgora,
  listarDepartamentos,
  listarConfiguracoes,
  buscar: buscarConfiguracao,
  criar: salvarConfiguracao,
  atualizar: atualizarConfiguracao,
};

export default configuracaoInactividadeService;
