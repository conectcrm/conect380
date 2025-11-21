import api from './api';

export interface MessageTemplate {
  id: string;
  nome: string;
  conteudo: string;
  categoria?: string;
  atalho?: string;
  variaveis?: string[]; // ['{{nome}}', '{{ticket}}', '{{empresa}}']
  ativo: boolean;
  empresaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageTemplateDto {
  nome: string;
  conteudo: string;
  categoria?: string;
  atalho?: string;
  variaveis?: string[];
}

export interface UpdateMessageTemplateDto {
  nome?: string;
  conteudo?: string;
  categoria?: string;
  atalho?: string;
  ativo?: boolean;
  variaveis?: string[];
}

export interface ProcessarTemplateDto {
  nome?: string;
  email?: string;
  telefone?: string;
  ticket?: string;
  atendente?: string;
  empresa?: string;
  data?: string;
  hora?: string;
  protocolo?: string;
  assunto?: string;
  prioridade?: string;
  status?: string;
  fila?: string;
  departamento?: string;
  [key: string]: any; // Permitir outras variáveis customizadas
}

const messageTemplateService = {
  /**
   * Lista todos os templates
   * 🔐 empresaId extraído automaticamente do JWT no backend
   * @param apenasAtivos - Se true, retorna apenas templates ativos
   */
  async listar(apenasAtivos = false): Promise<MessageTemplate[]> {
    try {
      const params: any = {};
      if (apenasAtivos) {
        params.apenasAtivos = 'true';
      }

      const response = await api.get('/atendimento/templates', { params });

      // Backend retorna { success, message, data: [] }
      const templates = response.data?.data || response.data || [];
      return templates;
    } catch (error: unknown) {
      console.error('Erro ao listar templates:', error);
      throw error;
    }
  },

  /**
   * Busca um template por ID
   * 🔐 empresaId extraído automaticamente do JWT no backend
   */
  async buscarPorId(id: string): Promise<MessageTemplate> {
    try {
      const response = await api.get(`/atendimento/templates/${id}`);
      return response.data.data;
    } catch (error: unknown) {
      console.error('Erro ao buscar template:', error);
      throw error;
    }
  },

  /**
   * Lista todas as variáveis disponíveis para templates
   */
  async listarVariaveis(): Promise<Record<string, string>> {
    try {
      const response = await api.get('/atendimento/templates/variaveis');
      return response.data.data;
    } catch (error: unknown) {
      console.error('Erro ao listar variáveis:', error);
      throw error;
    }
  },

  /**
   * Cria um novo template
   * 🔐 empresaId extraído automaticamente do JWT no backend
   */
  async criar(data: CreateMessageTemplateDto): Promise<MessageTemplate> {
    try {
      const response = await api.post(`/atendimento/templates`, data);
      return response.data.data;
    } catch (error: unknown) {
      console.error('Erro ao criar template:', error);
      throw error;
    }
  },

  /**
   * Atualiza um template existente
   * 🔐 empresaId extraído automaticamente do JWT no backend
   */
  async atualizar(id: string, data: UpdateMessageTemplateDto): Promise<MessageTemplate> {
    try {
      const response = await api.put(`/atendimento/templates/${id}`, data);
      return response.data.data;
    } catch (error: unknown) {
      console.error('Erro ao atualizar template:', error);
      throw error;
    }
  },

  /**
   * Deleta um template
   * 🔐 empresaId extraído automaticamente do JWT no backend
   */
  async deletar(id: string): Promise<void> {
    try {
      await api.delete(`/atendimento/templates/${id}`);
    } catch (error: unknown) {
      console.error('Erro ao deletar template:', error);
      throw error;
    }
  },

  /**
   * Processa um template (substitui variáveis)
   * @param idOuAtalho - ID ou atalho do template
   * @param dados - Dados para substituir nas variáveis
   * @param empresaId - ID da empresa
   * @returns Mensagem processada com variáveis substituídas
   */
  async processar(
    idOuAtalho: string,
    dados: ProcessarTemplateDto,
    empresaId: string,
  ): Promise<string> {
    try {
      const response = await api.post(
        `/atendimento/templates/processar/${idOuAtalho}?empresaId=${empresaId}`,
        dados,
      );
      return response.data.data.mensagem;
    } catch (error: unknown) {
      console.error('Erro ao processar template:', error);
      throw error;
    }
  },

  /**
   * Substituição local de variáveis (sem chamar API)
   * Útil para preview antes de enviar
   */
  substituirVariaveisLocal(conteudo: string, dados: ProcessarTemplateDto): string {
    let resultado = conteudo;

    Object.keys(dados).forEach((chave) => {
      const regex = new RegExp(`{{\\s*${chave}\\s*}}`, 'gi');
      resultado = resultado.replace(regex, String(dados[chave] || ''));
    });

    return resultado;
  },
};

export default messageTemplateService;
