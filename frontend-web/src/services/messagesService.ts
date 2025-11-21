import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Tipos de mensagem
 */
export enum TipoMensagem {
  TEXTO = 'texto',
  IMAGEM = 'imagem',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENTO = 'documento',
  LOCALIZACAO = 'localizacao',
  CONTATO = 'contato',
  SISTEMA = 'sistema',
}

/**
 * Status de mensagem
 */
export enum StatusMensagem {
  ENVIANDO = 'enviando',
  ENVIADA = 'enviada',
  ENTREGUE = 'entregue',
  LIDA = 'lida',
  ERRO = 'erro',
}

/**
 * Direção da mensagem
 */
export enum DirecaoMensagem {
  ENTRADA = 'entrada',
  SAIDA = 'saida',
}

/**
 * Interface de mensagem
 */
export interface Mensagem {
  id: string;
  ticketId: string;
  conteudo: string;
  tipo: TipoMensagem;
  direcao: DirecaoMensagem;
  status: StatusMensagem;
  remetenteId?: string;
  createdAt: string;
  updatedAt: string;
  lida?: boolean;
  lidaEm?: string;

  // Metadados opcionais
  metadata?: {
    nomeArquivo?: string;
    urlArquivo?: string;
    mimeType?: string;
    tamanho?: number;
    duracao?: number; // Para áudio/vídeo
    latitude?: number; // Para localização
    longitude?: number; // Para localização
  };
}

/**
 * Filtros para buscar mensagens
 */
export interface BuscarMensagensFiltros {
  ticketId: string;
  limit?: number;
  offset?: number;
}

/**
 * Resposta ao listar mensagens
 */
export interface ListarMensagensResposta {
  success: boolean;
  data: Mensagem[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * DTO para criar uma nova mensagem
 */
export interface CriarMensagemDto {
  ticketId: string;
  conteudo: string;
  tipo?: TipoMensagem;
  metadata?: Mensagem['metadata'];
}

/**
 * Resposta ao criar uma mensagem
 */
export interface CriarMensagemResposta {
  success: boolean;
  data: Mensagem;
  message?: string;
}

/**
 * DTO para marcar mensagens como lidas
 */
export interface MarcarComoLidaDto {
  mensagemIds: string[];
}

/**
 * Service para interagir com a API de mensagens
 */
class MessagesService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    };
  }

  /**
   * Lista mensagens de um ticket
   */
  async listar(filtros: BuscarMensagensFiltros): Promise<ListarMensagensResposta> {
    try {
      const params = new URLSearchParams();
      params.append('ticketId', filtros.ticketId);

      if (filtros.limit) {
        params.append('limit', filtros.limit.toString());
      }

      if (filtros.offset) {
        params.append('offset', filtros.offset.toString());
      }

      const response = await axios.get<ListarMensagensResposta>(
        `${API_URL}/atendimento/mensagens?${params.toString()}`,
        this.getAuthHeaders()
      );

      console.log('✅ Mensagens listadas:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar mensagens:', error);
      throw error;
    }
  }

  /**
   * Envia uma nova mensagem
   */
  async enviar(dados: CriarMensagemDto): Promise<CriarMensagemResposta> {
    try {
      const payload = {
        ...dados,
        tipo: dados.tipo || TipoMensagem.TEXTO,
      };

      const response = await axios.post<CriarMensagemResposta>(
        `${API_URL}/atendimento/mensagens`,
        payload,
        this.getAuthHeaders()
      );

      console.log('✅ Mensagem enviada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  /**
   * Marca mensagens como lidas
   */
  async marcarComoLida(dados: MarcarComoLidaDto): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.patch<{ success: boolean; message: string }>(
        `${API_URL}/atendimento/mensagens/marcar-lida`,
        dados,
        this.getAuthHeaders()
      );

      console.log('✅ Mensagens marcadas como lidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao marcar mensagens como lidas:', error);
      throw error;
    }
  }

  /**
   * Upload de arquivo (imagem, áudio, vídeo, documento)
   */
  async uploadArquivo(ticketId: string, arquivo: File): Promise<CriarMensagemResposta> {
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('ticketId', ticketId);

      // Determinar tipo baseado no MIME type do arquivo
      let tipo: TipoMensagem = TipoMensagem.DOCUMENTO;
      if (arquivo.type.startsWith('image/')) {
        tipo = TipoMensagem.IMAGEM;
      } else if (arquivo.type.startsWith('audio/')) {
        tipo = TipoMensagem.AUDIO;
      } else if (arquivo.type.startsWith('video/')) {
        tipo = TipoMensagem.VIDEO;
      }
      formData.append('tipo', tipo);

      const token = localStorage.getItem('authToken');
      const response = await axios.post<CriarMensagemResposta>(
        `${API_URL}/atendimento/mensagens/upload`,
        formData,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('✅ Arquivo enviado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao fazer upload do arquivo:', error);
      throw error;
    }
  }

  /**
   * Busca uma mensagem específica por ID
   */
  async buscar(mensagemId: string): Promise<{ success: boolean; data: Mensagem }> {
    try {
      const response = await axios.get<{ success: boolean; data: Mensagem }>(
        `${API_URL}/atendimento/mensagens/${mensagemId}`,
        this.getAuthHeaders()
      );

      console.log('✅ Mensagem encontrada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar mensagem:', error);
      throw error;
    }
  }
}

// Exportar instância única (singleton)
export const messagesService = new MessagesService();
