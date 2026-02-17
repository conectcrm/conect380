import { isAxiosError } from 'axios';
import { api } from './api';

const EMPRESA_EVENT_NAME = 'empresaAtivaChanged';
const AUTH_TOKEN_EVENT_NAME = 'authTokenChanged';

const dispatchEmpresaAtivaChanged = (empresaId?: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(EMPRESA_EVENT_NAME, {
      detail: { empresaId: empresaId || null },
    }),
  );
};

const dispatchAuthTokenChanged = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_TOKEN_EVENT_NAME));
};

export interface EmpresaCoresConfig {
  primaria: string;
  secundaria: string;
  accent: string;
}

export interface EmpresaRestricaoHorarioConfig {
  habilitado: boolean;
  inicio: string;
  fim: string;
  diasSemana: number[];
}

export interface EmpresaSegurancaConfig {
  autenticacao2FA: boolean;
  sessaoExpiracaoMinutos: number;
  tentativasLoginMax: number;
  senhaComplexidade: 'baixa' | 'media' | 'alta';
  auditoriaNivel: 'basico' | 'medio' | 'completo';
  ipsBloqueados: string[];
  restricaoHorario: EmpresaRestricaoHorarioConfig;
}

export interface EmpresaLimitesUsuariosConfig {
  total: number;
  administradores: number;
  vendedores: number;
  supervisores: number;
}

export interface EmpresaPermissoesDefaultConfig {
  vendedor: string[];
  supervisor: string[];
  administrador: string[];
}

export interface EmpresaUsuariosConfig {
  limitesUsuarios: EmpresaLimitesUsuariosConfig;
  permissoesDefault: EmpresaPermissoesDefaultConfig;
  aprovacaoNovoUsuario: boolean;
  dominiosPermitidos: string[];
}

export interface EmpresaServidorEmailConfig {
  tipo: string;
  servidor: string;
  porta: number;
  ssl: boolean;
  usuario: string;
  senha: string;
}

export interface EmpresaTemplateEmailConfig {
  cabecalho: string;
  rodape: string;
  assinatura: string;
}

export interface EmpresaNotificacoesConfig {
  emailsHabilitados: boolean;
  servidorEmail: EmpresaServidorEmailConfig;
  templateEmail: EmpresaTemplateEmailConfig;
  tiposNotificacao: Record<string, boolean>;
}

export interface EmpresaIntegracoesApiConfig {
  habilitada: boolean;
  chaveApi: string;
  webhooks: string[];
  limitesRequisicao: {
    por_minuto: number;
    por_dia: number;
  };
}

export interface EmpresaServicoIntegracaoConfig {
  habilitado: boolean;
  token?: string;
  numero?: string;
  client_id?: string;
  client_secret?: string;
  [key: string]: string | boolean | undefined;
}

export interface EmpresaIntegracoesConfig {
  api: EmpresaIntegracoesApiConfig;
  servicos: Record<string, EmpresaServicoIntegracaoConfig>;
}

export interface EmpresaBackupConfig {
  automatico: boolean;
  frequencia: 'diario' | 'semanal' | 'mensal';
  retencaoDias: number;
  incluirAnexos: boolean;
  sincronizacaoNuvem: {
    habilitada: boolean;
    provedor: string;
    configuracao: Record<string, unknown>;
  };
}

export interface EmpresaConfiguracoes {
  geral?: {
    nome?: string;
    descricao?: string;
    site?: string;
    telefone?: string;
    email?: string;
    endereco?: string;
    timezone?: string;
    logo?: string;
    cores?: Partial<EmpresaCoresConfig>;
  };
  site?: string;
  timezone?: string;
  logo?: string;
  cores?: Partial<EmpresaCoresConfig>;
  seguranca?: Partial<EmpresaSegurancaConfig>;
  usuarios?: Partial<EmpresaUsuariosConfig>;
  notificacoes?: Partial<EmpresaNotificacoesConfig>;
  integracoes?: Partial<EmpresaIntegracoesConfig>;
  backup?: Partial<EmpresaBackupConfig>;
  // Campos legados
  notificacoesEmail?: boolean;
  notificacoesSMS?: boolean;
  backupAutomatico?: boolean;
  integracaoAPI?: boolean;
  suportePersonalizado?: boolean;
  whiteLabel?: boolean;
  relatoriosAvancados?: boolean;
}

export interface EmpresaCompleta {
  id: string;
  nome: string;
  descricao?: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco:
  | string
  | {
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  plano: {
    id: string;
    nome: 'Starter' | 'Professional' | 'Enterprise';
    preco: number;
    features: string[];
    limitesUsuarios: number;
    limitesClientes: number;
    limitesArmazenamento: string; // "5GB", "50GB", "Ilimitado"
    limites?: {
      usuarios: number;
      clientes: number;
      armazenamento: string;
    };
  };
  status: 'ativa' | 'trial' | 'suspensa' | 'inativa';
  isActive: boolean;
  dataVencimento: string;
  dataCriacao: string;
  ultimoAcesso: string;
  configuracoes: EmpresaConfiguracoes;
  estatisticas: {
    usuariosAtivos: number;
    totalUsuarios: number;
    clientesCadastrados: number;
    propostasEsteAno: number;
    propostasEsteMes: number;
    faturaAcumulada: number;
    crescimentoMensal: number;
    armazenamentoUsado: string; // "2.1GB"
    armazenamentoTotal: string; // "5GB"
    ultimasAtividades: Array<{
      id: string;
      tipo: 'login' | 'proposta' | 'cliente' | 'configuracao';
      descricao: string;
      usuario: string;
      data: string;
    }>;
  };
  permissoes: {
    podeEditarConfiguracoes: boolean;
    podeGerenciarUsuarios: boolean;
    podeVerRelatorios: boolean;
    podeExportarDados: boolean;
    podeAlterarPlano: boolean;
  };
}

export interface NovaEmpresaRequest {
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: {
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  planoId: string;
  usuarioAdmin: {
    nome: string;
    email: string;
    telefone: string;
  };
}

export interface EmpresaUpdate {
  nome?: string;
  descricao?: string;
  email?: string;
  telefone?: string;
  endereco?: EmpresaCompleta['endereco'];
  configuracoes?: Partial<EmpresaConfiguracoes>;
}

export interface SwitchEmpresaResponse {
  success: boolean;
  empresaId: string;
  token?: string; // Novo token com contexto da empresa
  configuracoes: EmpresaConfiguracoes;
}

class MinhasEmpresasService {
  /**
   * Buscar todas as empresas do usuário atual
   */
  async getMinhasEmpresas(): Promise<EmpresaCompleta[]> {
    try {
      const response = await api.get<{ empresas: EmpresaCompleta[] }>('/minhas-empresas');
      return response.data.empresas;
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
      throw new Error('Não foi possível carregar suas empresas');
    }
  }

  /**
   * Buscar detalhes de uma empresa específica
   */
  async getEmpresaById(empresaId: string): Promise<EmpresaCompleta> {
    try {
      const response = await api.get<EmpresaCompleta>(`/minhas-empresas/${empresaId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
      throw new Error('Não foi possível carregar os dados da empresa');
    }
  }

  /**
   * Alternar para uma empresa (switch de contexto)
   */
  async switchEmpresa(empresaId: string): Promise<SwitchEmpresaResponse> {
    try {
      const response = await api.post<SwitchEmpresaResponse>('/minhas-empresas/switch', {
        empresaId,
      });

      // Atualizar token se fornecido
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        dispatchAuthTokenChanged();
      }

      // Salvar empresa ativa
      localStorage.setItem('empresaAtiva', empresaId);
      dispatchEmpresaAtivaChanged(empresaId);

      return response.data;
    } catch (error) {
      console.error('Erro ao alternar empresa:', error);
      throw new Error('Não foi possível alternar para esta empresa');
    }
  }

  /**
   * Criar uma nova empresa
   */
  async criarEmpresa(dadosEmpresa: NovaEmpresaRequest): Promise<EmpresaCompleta> {
    try {
      const response = await api.post<EmpresaCompleta>('/minhas-empresas', dadosEmpresa);
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao criar empresa:', error);
      if (isAxiosError(error)) {
        if (error.response?.status === 409) {
          throw new Error('CNPJ já cadastrado no sistema');
        }
        if (error.response?.status === 422) {
          throw new Error('Dados inválidos. Verifique as informações fornecidas');
        }
      }
      throw new Error('Não foi possível criar a empresa');
    }
  }

  /**
   * Atualizar dados da empresa
   */
  async atualizarEmpresa(empresaId: string, dados: EmpresaUpdate): Promise<EmpresaCompleta> {
    try {
      const response = await api.put<EmpresaCompleta>(`/minhas-empresas/${empresaId}`, dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      throw new Error('Não foi possível atualizar os dados da empresa');
    }
  }

  /**
   * Atualizar configurações específicas da empresa
   */
  async atualizarConfiguracoes(
    empresaId: string,
    configuracoes: Partial<EmpresaCompleta['configuracoes']>,
  ): Promise<EmpresaCompleta['configuracoes']> {
    try {
      const response = await api.patch<{ configuracoes: EmpresaCompleta['configuracoes'] }>(
        `/minhas-empresas/${empresaId}/configuracoes`,
        { configuracoes },
      );
      return response.data.configuracoes;
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      throw new Error('Não foi possível atualizar as configurações');
    }
  }

  /**
   * Buscar estatísticas detalhadas da empresa
   */
  async getEstatisticasEmpresa(
    empresaId: string,
    periodo?: 'mes' | 'trimestre' | 'ano',
  ): Promise<EmpresaCompleta['estatisticas']> {
    try {
      const response = await api.get<{ estatisticas: EmpresaCompleta['estatisticas'] }>(
        `/minhas-empresas/${empresaId}/estatisticas`,
        { params: { periodo: periodo || 'mes' } },
      );
      return response.data.estatisticas;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new Error('Não foi possível carregar as estatísticas');
    }
  }

  /**
   * Suspender empresa (apenas admin master)
   */
  async suspenderEmpresa(empresaId: string, motivo: string): Promise<void> {
    try {
      await api.post(`/minhas-empresas/${empresaId}/suspender`, { motivo });
    } catch (error) {
      console.error('Erro ao suspender empresa:', error);
      throw new Error('Não foi possível suspender a empresa');
    }
  }

  /**
   * Reativar empresa (apenas admin master)
   */
  async reativarEmpresa(empresaId: string): Promise<void> {
    try {
      await api.post(`/minhas-empresas/${empresaId}/reativar`);
    } catch (error) {
      console.error('Erro ao reativar empresa:', error);
      throw new Error('Não foi possível reativar a empresa');
    }
  }

  /**
   * Excluir empresa (apenas owner)
   */
  async excluirEmpresa(empresaId: string, confirmacao: string): Promise<void> {
    try {
      await api.delete(`/minhas-empresas/${empresaId}`, {
        data: { confirmacao },
      });
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      throw new Error('Não foi possível excluir a empresa');
    }
  }

  /**
   * Buscar planos disponíveis
   */
  async getPlanosDisponiveis(): Promise<EmpresaCompleta['plano'][]> {
    try {
      const response = await api.get<{ planos: EmpresaCompleta['plano'][] }>('/planos');
      return response.data.planos;
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      throw new Error('Não foi possível carregar os planos disponíveis');
    }
  }

  /**
   * Alterar plano da empresa
   */
  async alterarPlano(empresaId: string, novoPlanoId: string): Promise<EmpresaCompleta> {
    try {
      const response = await api.post<EmpresaCompleta>(
        `/minhas-empresas/${empresaId}/alterar-plano`,
        { planoId: novoPlanoId },
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao alterar plano:', error);
      throw new Error('Não foi possível alterar o plano');
    }
  }

  /**
   * Buscar atividades recentes da empresa
   */
  async getAtividadesRecentes(
    empresaId: string,
    limit: number = 10,
  ): Promise<EmpresaCompleta['estatisticas']['ultimasAtividades']> {
    try {
      const response = await api.get<{
        atividades: EmpresaCompleta['estatisticas']['ultimasAtividades'];
      }>(`/minhas-empresas/${empresaId}/atividades`, { params: { limit } });
      return response.data.atividades;
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
      throw new Error('Não foi possível carregar as atividades');
    }
  }

  /**
   * Gerar backup da empresa
   */
  async gerarBackup(empresaId: string): Promise<{ backupId: string; downloadUrl: string }> {
    try {
      const response = await api.post<{ backupId: string; downloadUrl: string }>(
        `/minhas-empresas/${empresaId}/backup`,
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar backup:', error);
      throw new Error('Não foi possível gerar o backup');
    }
  }

  /**
   * Validar CNPJ
   */
  async validarCNPJ(cnpj: string): Promise<{ valido: boolean; empresa?: Record<string, unknown> }> {
    try {
      const response = await api.post<{ valido: boolean; empresa?: Record<string, unknown> }>(
        '/validar-cnpj',
        {
          cnpj: cnpj.replace(/\D/g, ''),
        },
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao validar CNPJ:', error);
      return { valido: false };
    }
  }
}

export const minhasEmpresasService = new MinhasEmpresasService();
