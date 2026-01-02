/**
 * 💬 Atendimento Service - Comunicação com API
 *
 * Gerencia todas as operações relacionadas ao atendimento omnichannel:
 * - Conversações (tickets)
 * - Mensagens
 * - Contatos
 * - Transferências
 * - Encerramentos
 */

import { api, API_BASE_URL } from '../../../../services/api';
import {
  Ticket,
  Mensagem,
  Contato,
  CanalTipo,
  StatusAtendimentoType,
  Demanda,
  NotaCliente,
  HistoricoAtendimento,
} from '../types';
import { NovoAtendimentoData } from '../modals/NovoAtendimentoModal';
import { TransferenciaData } from '../modals/TransferirAtendimentoModal';
import { EncerramentoData } from '../modals/EncerrarAtendimentoModal';
import { ContatoEditado } from '../modals/EditarContatoModal';
import { NovaDemanda } from '../modals/AbrirDemandaModal';
import { resolveAvatarUrl } from '../../../../utils/avatar';

export interface CanalAtendimento {
  id: string;
  nome: string;
  tipo: CanalTipo;
  origem?: string;
  ativo?: boolean;
  configuracao?: Record<string, unknown> | null;
}

export interface ContatoResumo {
  id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  clienteId?: string | null;
  clienteNome?: string | null;
}

const normalizarString = (valor?: string | null): string | undefined => {
  if (!valor) {
    return undefined;
  }
  const texto = valor.toString().trim();
  return texto.length > 0 ? texto : undefined;
};

const normalizarTelefone = (valor?: string | null): string | undefined => {
  const texto = normalizarString(valor);
  if (!texto) {
    return undefined;
  }
  const digits = texto.replace(/\D/g, '');
  return digits.length > 0 ? digits : undefined;
};

const normalizarCanalTipo = (valor: string): CanalTipo => {
  const tipoNormalizado = valor?.toLowerCase() as CanalTipo;
  if (['whatsapp', 'telegram', 'email', 'chat', 'telefone'].includes(tipoNormalizado)) {
    return tipoNormalizado;
  }
  return 'chat';
};

const construirIdentificadorContato = (dados: NovoAtendimentoData): string => {
  const telefoneNormalizado = normalizarTelefone(dados.contatoTelefone);
  if (telefoneNormalizado) {
    return telefoneNormalizado;
  }

  const emailNormalizado = normalizarString(dados.contatoEmail)?.replace(/\s+/g, '');
  if (emailNormalizado) {
    return emailNormalizado.slice(0, 20);
  }

  const nomeNormalizado = normalizarString(dados.contatoNome)?.replace(/\s+/g, '_');
  if (nomeNormalizado) {
    return nomeNormalizado.slice(0, 20);
  }

  return `CONTATO_${Date.now()}`;
};

const extrairTicketDaResposta = (payload: any): Ticket | null => {
  if (!payload) {
    return null;
  }

  if (payload.data) {
    if (payload.data.ticket) {
      return payload.data.ticket as Ticket;
    }
    return payload.data as Ticket;
  }

  if (payload.ticket) {
    return payload.ticket as Ticket;
  }

  return payload as Ticket;
};

export const normalizarMidiaUrl = (valor?: string | null): string | null => {
  if (!valor) return null;
  const urlBruta = valor.toString().trim();
  if (!urlBruta) return null;

  // URLs completas (http/https), data URIs ou blobs devem ser retornadas como estão
  if (/^(https?:\/\/|data:|blob:)/i.test(urlBruta)) {
    return urlBruta;
  }

  // URLs relativas: normalizar com base na API_BASE_URL
  try {
    const urlNormalizada = new URL(urlBruta, API_BASE_URL);
    return urlNormalizada.toString();
  } catch (error) {
    console.warn(
      '⚠️ [AtendimentoService] Não foi possível normalizar URL de mídia:',
      urlBruta,
      error,
    );
    return urlBruta;
  }
};

export const normalizarMensagemPayload = (mensagem: Mensagem): Mensagem => {
  const statusNormalizado = ((): Mensagem['status'] => {
    const raw = (mensagem as any)?.status?.toString().toLowerCase();
    if (raw === 'entregue') return 'entregue';
    if (raw === 'lido') return 'lido';
    if (raw === 'enviado') return 'enviado';
    if (raw === 'enviando') return 'enviando';
    return 'enviado';
  })();

  const remetenteBruto: any = (mensagem as any).remetente;
  const remetenteNormalizado = (() => {
    if (remetenteBruto && typeof remetenteBruto === 'object' && !Array.isArray(remetenteBruto)) {
      const tipo = (remetenteBruto.tipo || remetenteBruto.remetente || '').toString().toLowerCase();
      return {
        id: remetenteBruto.id,
        nome: remetenteBruto.nome || (tipo === 'atendente' ? 'Atendente' : 'Cliente'),
        foto: resolveAvatarUrl(remetenteBruto.foto || null) || undefined,
        tipo: tipo === 'atendente' ? 'atendente' : 'cliente',
      } as Mensagem['remetente'];
    }

    if (typeof remetenteBruto === 'string') {
      const tipo = remetenteBruto.toLowerCase();
      return {
        id: mensagem.id,
        nome: tipo === 'atendente' ? 'Atendente' : 'Cliente',
        foto: undefined,
        tipo: tipo === 'atendente' ? 'atendente' : 'cliente',
      } as Mensagem['remetente'];
    }

    return {
      id: mensagem.id,
      nome: 'Cliente',
      foto: undefined,
      tipo: 'cliente',
    } as Mensagem['remetente'];
  })();

  const anexosNormalizados = (mensagem.anexos || []).map((anexo) => {
    const urlPrincipal = normalizarMidiaUrl(
      anexo.url ?? anexo.downloadUrl ?? anexo.originalUrl ?? null,
    );
    const urlDownload = normalizarMidiaUrl(
      anexo.downloadUrl ?? anexo.url ?? anexo.originalUrl ?? null,
    );

    return {
      ...anexo,
      url: urlPrincipal,
      downloadUrl: urlDownload,
      originalUrl: anexo.originalUrl ?? null,
      tipo: anexo.tipo ?? null,
      tamanho: anexo.tamanho ?? null,
      duracao: anexo.duracao ?? null,
    };
  });

  const audioNormalizado = mensagem.audio
    ? {
      ...mensagem.audio,
      url:
        normalizarMidiaUrl(mensagem.audio.url ?? mensagem.audio.downloadUrl ?? null) ||
        mensagem.audio.url,
      downloadUrl:
        normalizarMidiaUrl(mensagem.audio.downloadUrl ?? mensagem.audio.url ?? null) ||
        mensagem.audio.downloadUrl ||
        null,
      tipo: mensagem.audio.tipo ?? null,
      duracao: mensagem.audio.duracao ?? null,
      nome: mensagem.audio.nome ?? null,
    }
    : undefined;

  return {
    ...mensagem,
    status: statusNormalizado,
    anexos: anexosNormalizados,
    audio: audioNormalizado,
    remetente: remetenteNormalizado,
  };
};

// ===== INTERFACES DE REQUEST/RESPONSE =====

export interface ListarTicketsParams {
  status?: StatusAtendimentoType;
  canal?: CanalTipo;
  atendenteId?: string;
  busca?: string;
  page?: number;
  limit?: number;
}

export interface ListarTicketsResponse {
  data: Ticket[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ListarMensagensParams {
  ticketId: string;
  page?: number;
  limit?: number;
}

export interface ListarMensagensResponse {
  data: Mensagem[];
  total: number;
  page: number;
}

export interface EnviarMensagemParams {
  ticketId: string;
  conteudo: string;
  anexos?: File[];
  audio?: {
    blob: Blob;
    duracao: number;
  };
  onUploadProgress?: (progress: number) => void; // 🆕 Callback para progress bar
}

export interface TransferirTicketResponse {
  ticket: Ticket;
  notificado: boolean;
}

export interface EncerrarTicketResponse {
  ticket: Ticket;
  followUp?: {
    id: string;
    dataAgendamento: Date;
  };
  csatEnviado: boolean;
}

export interface BuscarContatosParams {
  busca: string;
  limit?: number;
}

export interface BuscarClientesParams {
  busca: string;
  limit?: number;
}

export interface Cliente {
  id: string;
  nome: string;
  documento: string;
  email?: string;
  telefone?: string;
  contatosVinculados: number;
}

// ===== SERVIÇO =====

class AtendimentoService {
  private baseUrl = '/api/atendimento';

  /**
   * Lista canais de atendimento configurados para a empresa logada
   */
  async listarCanais(): Promise<CanalAtendimento[]> {
    try {
      const response = await api.get<any>(`${this.baseUrl}/canais`);
      const data = response.data?.data ?? response.data ?? [];

      return (Array.isArray(data) ? data : []).map(
        (item: any): CanalAtendimento => ({
          id: item.id,
          nome: item.nome || item.tipo?.toUpperCase() || 'Canal',
          tipo: normalizarCanalTipo(item.tipo || 'chat'),
          origem: item.origem || item.tipo?.toString().toUpperCase() || undefined,
          ativo: item.ativo ?? true,
          configuracao: item.configuracao ?? null,
        }),
      );
    } catch (error) {
      console.error('❌ Erro ao listar canais:', error);
      throw error;
    }
  }

  /**
   * Lista contatos disponíveis no CRM para associação rápida ao atendimento
   */
  async listarContatos(): Promise<ContatoResumo[]> {
    try {
      const response = await api.get<any>('/api/crm/contatos');
      const data = response.data?.data ?? response.data ?? [];

      return (Array.isArray(data) ? data : []).map(
        (item: any): ContatoResumo => ({
          id: item.id,
          nome: item.nome || 'Contato sem nome',
          telefone: normalizarString(item.telefone) ?? undefined,
          email: normalizarString(item.email) ?? undefined,
          clienteId: item.clienteId || item.cliente_id || item.cliente?.id || null,
          clienteNome: item.clienteNome || item.cliente_nome || item.cliente?.nome || null,
        }),
      );
    } catch (error) {
      console.error('❌ Erro ao listar contatos:', error);
      throw error;
    }
  }

  // ========== TICKETS ==========

  /**
   * Lista todos os tickets com filtros
   */
  async listarTickets(params: ListarTicketsParams = {}): Promise<ListarTicketsResponse> {
    try {
      // Converter status para UPPERCASE (backend espera enum em maiúsculo)
      const paramsBackend = {
        ...params,
        status: params.status ? params.status.toUpperCase() : undefined,
      };

      const response = await api.get<ListarTicketsResponse>(`${this.baseUrl}/tickets`, {
        params: paramsBackend
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar tickets:', error);
      throw error;
    }
  }

  /**
   * Busca um ticket específico por ID
   */
  async buscarTicket(ticketId: string): Promise<Ticket> {
    try {
      const response = await api.get<any>(`${this.baseUrl}/tickets/${ticketId}`);

      // 🔧 Transformar dados do backend para o formato do frontend
      // Backend retorna: { success: true, data: {...} }
      const ticket = response.data.data || response.data;
      const contatoBackend = ticket.contato || {};

      const ticketTransformado: Ticket = {
        ...ticket,
        numero: ticket.numero, // ✅ Garantir que numero seja preservado
        contato: {
          telefone:
            contatoBackend.telefone || ticket.contatoTelefone || ticket.contato_telefone || '',
          nome: contatoBackend.nome || ticket.contatoNome || ticket.contato_nome || 'Sem nome',
          email: contatoBackend.email || ticket.contatoEmail || ticket.contato_email || '',
          foto: resolveAvatarUrl(
            contatoBackend.foto || ticket.contatoFoto || ticket.contato_foto || null,
          ),
          online:
            typeof contatoBackend.online === 'boolean'
              ? contatoBackend.online
              : Boolean(ticket.contatoOnline ?? ticket.contato_online ?? false),
          clienteVinculado: contatoBackend.clienteVinculado || null,
        },
        canal: ticket.canal || {
          id: ticket.canalId || ticket.canal_id || '',
          nome: 'Canal desconhecido',
          tipo: 'whatsapp' as any,
        },
        ultimaMensagem: ticket.ultimaMensagem || 'Sem mensagens',
        tempoAtendimento: ticket.tempoAtendimento || 0,
      };

      return {
        ...ticketTransformado,
        atendente: ticketTransformado.atendente
          ? {
            ...ticketTransformado.atendente,
            foto: resolveAvatarUrl(ticketTransformado.atendente.foto || null),
          }
          : ticketTransformado.atendente,
      };
    } catch (error) {
      console.error('❌ Erro ao buscar ticket:', error);
      throw error;
    }
  }

  /**
   * Cria um novo ticket de atendimento
   */
  async criarTicket(dados: NovoAtendimentoData): Promise<Ticket> {
    try {
      const clienteNumero = construirIdentificadorContato(dados);
      const contatoNome = normalizarString(dados.contatoNome);
      const contatoEmail = normalizarString(dados.contatoEmail);
      const descricao = normalizarString(dados.descricao);
      const assunto = normalizarString(dados.assunto);
      const telefoneNormalizado = normalizarTelefone(dados.contatoTelefone);

      const payload: Record<string, unknown> = {
        canalId: dados.canalId,
        clienteNumero,
        clienteNome: contatoNome ?? clienteNumero,
        origem: dados.origem,
      };

      if (contatoEmail) {
        payload.clienteEmail = contatoEmail;
      }

      if (assunto) {
        payload.assunto = assunto;
      }

      if (dados.prioridade) {
        payload.prioridade = dados.prioridade.toUpperCase();
      }

      if (descricao) {
        payload.descricao = descricao;
      }

      if (dados.tags?.length) {
        payload.tags = dados.tags;
      }

      const metadata: Record<string, unknown> = {};

      metadata.canalTipo = dados.canalTipo;
      metadata.canalNome = dados.canalNome;

      if (contatoEmail) {
        metadata.contatoEmail = contatoEmail;
      }

      if (telefoneNormalizado) {
        metadata.contatoTelefone = telefoneNormalizado;
      }

      if (descricao) {
        metadata.descricao = descricao;
      }

      if (dados.tags?.length) {
        metadata.tags = dados.tags;
      }

      if (dados.clienteId) {
        metadata.clienteId = dados.clienteId;
      }

      if (dados.contatoId) {
        metadata.contatoId = dados.contatoId;
      }

      const metadataKeys = Object.keys(metadata);
      if (metadataKeys.length > 0) {
        payload.metadata = metadata;
      }

      const response = await api.post<any>(`${this.baseUrl}/tickets`, payload);
      const ticket = extrairTicketDaResposta(response.data);

      if (!ticket) {
        throw new Error('Resposta da API não contém o ticket recém-criado.');
      }

      console.log('✅ Ticket criado:', ticket);
      return ticket;
    } catch (error) {
      console.error('❌ Erro ao criar ticket:', error);
      throw error;
    }
  }

  /**
   * Transfere ticket para outro atendente
   */
  async transferirTicket(
    ticketId: string,
    dados: TransferenciaData,
  ): Promise<TransferirTicketResponse> {
    try {
      const response = await api.post<TransferirTicketResponse>(
        `${this.baseUrl}/tickets/${ticketId}/transferir`,
        dados,
      );
      console.log('✅ Ticket transferido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao transferir ticket:', error);
      throw error;
    }
  }

  /**
   * Encerra um ticket
   */
  async encerrarTicket(ticketId: string, dados: EncerramentoData): Promise<EncerrarTicketResponse> {
    try {
      const response = await api.post<EncerrarTicketResponse>(
        `${this.baseUrl}/tickets/${ticketId}/encerrar`,
        dados,
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao encerrar ticket:', error);
      throw error;
    }
  }

  /**
   * Reabre um ticket encerrado
   */
  async reabrirTicket(ticketId: string): Promise<Ticket> {
    try {
      const response = await api.post<Ticket>(`${this.baseUrl}/tickets/${ticketId}/reabrir`);
      console.log('✅ Ticket reaberto:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao reabrir ticket:', error);
      throw error;
    }
  }

  /**
   * 🆕 Atualiza apenas o status do ticket (sem encerramento formal)
   * Usado para transições rápidas: aberto → em_atendimento, em_atendimento → aguardando, etc.
   */
  async atualizarStatusTicket(
    ticketId: string,
    novoStatus: StatusAtendimentoType,
  ): Promise<Ticket> {
    try {
      const response = await api.patch<Ticket>(
        `${this.baseUrl}/tickets/${ticketId}/status`,
        { status: novoStatus.toUpperCase() }, // Backend espera UPPERCASE
      );
      console.log('✅ Status do ticket atualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar status do ticket:', error);
      throw error;
    }
  }

  /**
   * Atualiza um ticket (campos gerais como filaId, atendenteId, etc)
   * 🆕 Sistema de Filas
   */
  async atualizarTicket(
    ticketId: string,
    dados: Partial<{ filaId?: string | null; atendenteId?: string | null;[key: string]: any }>,
  ): Promise<Ticket> {
    try {
      const response = await api.patch<Ticket>(`${this.baseUrl}/tickets/${ticketId}`, dados);
      console.log('✅ Ticket atualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar ticket:', error);
      throw error;
    }
  }

  // ========== MENSAGENS ==========

  /**
   * Lista mensagens de um ticket
   */
  async listarMensagens(params: ListarMensagensParams): Promise<ListarMensagensResponse> {
    try {
      const response = await api.get<ListarMensagensResponse>(`${this.baseUrl}/mensagens`, {
        params: { ticketId: params.ticketId, page: params.page, limit: params.limit },
      });
      const mensagensNormalizadas = response.data.data.map((mensagem: Mensagem) =>
        normalizarMensagemPayload(mensagem),
      );

      return {
        ...response.data,
        data: mensagensNormalizadas,
      };
    } catch (error) {
      console.error('❌ Erro ao listar mensagens:', error);
      throw error;
    }
  }

  /**
   * Envia uma mensagem
   */
  async enviarMensagem(params: EnviarMensagemParams): Promise<Mensagem> {
    try {
      // ✅ Se NÃO tem anexos nem áudio, usar JSON puro (mais confiável)
      if (!params.anexos?.length && !params.audio) {
        const response = await api.post<any>(
          `${this.baseUrl}/tickets/${params.ticketId}/mensagens`,
          { conteudo: params.conteudo }, // JSON simples
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        const mensagem = response.data.data || response.data;
        return normalizarMensagemPayload(mensagem);
      }

      // ✅ Se TEM anexos ou áudio, usar FormData

      const formData = new FormData();
      formData.append('conteudo', params.conteudo ?? '');

      // Anexos de arquivo
      if (params.anexos && params.anexos.length > 0) {
        params.anexos.forEach((arquivo, index) => {
          formData.append('anexos', arquivo);
        });
      }

      // Áudio
      if (params.audio) {
        const audioBlob = params.audio.blob;
        const mimeType = audioBlob.type || 'audio/webm';
        const extensao = mimeType.includes('ogg')
          ? 'ogg'
          : mimeType.includes('mpeg')
            ? 'mp3'
            : mimeType.includes('wav')
              ? 'wav'
              : mimeType.includes('aac')
                ? 'aac'
                : mimeType.includes('mp4')
                  ? 'm4a'
                  : 'webm';

        // ✨ Enviar áudio sem nome de arquivo visível (apenas tipo de mídia)
        formData.append('anexos', audioBlob, `audio.${extensao}`);
        formData.append('duracaoAudio', params.audio.duracao.toString());
        formData.append('tipoMidia', 'audio'); // Flag para identificar que é áudio
      }

      const response = await api.post<any>(
        `${this.baseUrl}/tickets/${params.ticketId}/mensagens`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && params.onUploadProgress) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              params.onUploadProgress(percentCompleted);
            }
          },
        },
      );

      const mensagem = response.data.data || response.data;
      console.log('✅ Mensagem enviada:', mensagem);
      return normalizarMensagemPayload(mensagem);
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  /**
   * Marca mensagens como lidas
   */
  async marcarComoLidas(ticketId: string, mensagemIds: string[]): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/tickets/${ticketId}/mensagens/marcar-lidas`, {
        mensagemIds,
      });
      console.log('✅ Mensagens marcadas como lidas');
    } catch (error) {
      console.error('❌ Erro ao marcar mensagens como lidas:', error);
      throw error;
    }
  }

  // ========== CONTATOS ==========

  /**
   * Busca contatos por nome/telefone
   */
  async buscarContatos(params: BuscarContatosParams): Promise<Contato[]> {
    try {
      const response = await api.get<Contato[]>(`${this.baseUrl}/contatos/buscar`, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar contatos:', error);
      throw error;
    }
  }

  /**
   * Cria um novo contato
   */
  async criarContato(dados: Omit<Contato, 'id' | 'online'>): Promise<Contato> {
    try {
      const response = await api.post<Contato>(`${this.baseUrl}/contatos`, dados);
      console.log('✅ Contato criado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar contato:', error);
      throw error;
    }
  }

  /**
   * Atualiza dados de um contato
   */
  async atualizarContato(contatoId: string, dados: ContatoEditado): Promise<Contato> {
    try {
      const response = await api.put<Contato>(`${this.baseUrl}/contatos/${contatoId}`, dados);
      console.log('✅ Contato atualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar contato:', error);
      throw error;
    }
  }

  /**
   * Vincula contato a um cliente CRM
   */
  async vincularCliente(contatoId: string, clienteId: string): Promise<Contato> {
    try {
      const response = await api.post<Contato>(
        `${this.baseUrl}/contatos/${contatoId}/vincular-cliente`,
        { clienteId },
      );
      console.log('✅ Cliente vinculado ao contato:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao vincular cliente:', error);
      throw error;
    }
  }

  // ========== CLIENTES CRM ==========

  /**
   * Busca clientes CRM por nome/CNPJ
   */
  async buscarClientes(params: BuscarClientesParams): Promise<Cliente[]> {
    try {
      const response = await api.get<Cliente[]>(`/api/clientes/buscar`, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      throw error;
    }
  }

  // ========== HISTÓRICO ==========

  /**
   * Busca histórico de atendimentos de um contato
   */
  async buscarHistorico(contatoId: string): Promise<HistoricoAtendimento[]> {
    try {
      const response = await api.get<HistoricoAtendimento[]>(
        `${this.baseUrl}/contatos/${contatoId}/historico`,
      );
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      throw error;
    }
  }

  // ========== DEMANDAS ==========

  /**
   * Cria uma demanda vinculada ao ticket
   */
  async criarDemanda(ticketId: string, dados: NovaDemanda): Promise<Demanda> {
    try {
      const response = await api.post<Demanda>(
        `${this.baseUrl}/tickets/${ticketId}/demandas`,
        dados,
      );
      console.log('✅ Demanda criada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar demanda:', error);
      throw error;
    }
  }

  /**
   * Lista demandas de um contato
   */
  async listarDemandas(contatoId: string): Promise<Demanda[]> {
    try {
      const response = await api.get<Demanda[]>(`${this.baseUrl}/contatos/${contatoId}/demandas`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar demandas:', error);
      throw error;
    }
  }

  // ========== NOTAS ==========

  /**
   * Cria uma nota no atendimento
   */
  async criarNota(ticketId: string, conteudo: string, importante: boolean): Promise<NotaCliente> {
    try {
      const response = await api.post<NotaCliente>(`${this.baseUrl}/tickets/${ticketId}/notas`, {
        conteudo,
        importante,
      });
      console.log('✅ Nota criada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar nota:', error);
      throw error;
    }
  }

  /**
   * Lista notas de um contato
   */
  async listarNotas(contatoId: string): Promise<NotaCliente[]> {
    try {
      const response = await api.get<NotaCliente[]>(`${this.baseUrl}/contatos/${contatoId}/notas`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar notas:', error);
      throw error;
    }
  }

  /**
   * Exclui uma nota
   */
  async excluirNota(notaId: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/notas/${notaId}`);
      console.log('✅ Nota excluída');
    } catch (error) {
      console.error('❌ Erro ao excluir nota:', error);
      throw error;
    }
  }

  // ========== ATENDENTES ==========

  /**
   * Lista atendentes disponíveis para transferência
   */
  async listarAtendentes(): Promise<
    Array<{
      id: string;
      nome: string;
      foto?: string;
      status: 'online' | 'ocupado' | 'offline';
      atendimentosAtivos: number;
    }>
  > {
    try {
      const response = await api.get(`${this.baseUrl}/atendentes`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar atendentes:', error);
      throw error;
    }
  }

  // ========== TEMPLATES E RESPOSTAS RÁPIDAS ==========

  /**
   * Lista templates de mensagem
   */
  async listarTemplates(): Promise<
    Array<{
      id: string;
      titulo: string;
      conteudo: string;
      categoria: string;
    }>
  > {
    try {
      const response = await api.get(`${this.baseUrl}/templates`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar templates:', error);
      throw error;
    }
  }

  // ========== ESTATÍSTICAS ==========

  /**
   * Busca estatísticas do atendimento
   */
  async buscarEstatisticas(): Promise<{
    totalAbertos: number;
    totalResolvidos: number;
    totalRetornos: number;
    tempoMedioAtendimento: number;
    satisfacaoMedia: number;
  }> {
    try {
      const response = await api.get(`${this.baseUrl}/estatisticas`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  // ========== CONTEXTO DO CLIENTE ==========

  /**
   * Busca histórico completo de atendimentos do cliente
   */
  async buscarHistoricoCliente(clienteId: string): Promise<HistoricoAtendimento[]> {
    try {
      const response = await api.get<any>(`/api/atendimento/clientes/${clienteId}/historico`);

      // ✅ CORREÇÃO: Backend retorna { propostas, faturas, tickets }, não array direto
      const historico = response.data;
      const tickets = historico?.tickets || [];

      // Transformar tickets do backend para formato do frontend
      return tickets.map((t: any) => ({
        id: t.id,
        numero: t.numero,
        status: t.status,
        assunto: t.assunto || 'Sem assunto',
        criadoEm: t.criadoEm || t.createdAt,
        canalId: t.canalId,
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar histórico do cliente:', error);
      return []; // Retorna array vazio em caso de erro
    }
  }

  /**
   * Busca contexto completo do cliente (dados + estatísticas + histórico)
   */
  async buscarContextoCliente(clienteId: string): Promise<{
    cliente: {
      id: string;
      nome: string;
      telefone: string;
      email?: string;
      documento?: string;
    };
    estatisticas: {
      totalAtendimentos: number;
      atendimentosResolvidos: number;
      atendimentosAbertos: number;
      tempoMedioResposta: number;
      ultimaInteracao?: Date;
    };
    faturas?: Array<{
      id: string;
      numero: string;
      valor: number;
      vencimento: Date;
      status: string;
    }>;
    contratos?: Array<{
      id: string;
      plano: string;
      status: string;
      dataInicio: Date;
    }>;
  }> {
    try {
      const response = await api.get(`/api/atendimento/clientes/${clienteId}/contexto`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar contexto do cliente:', error);
      // Retorna estrutura vazia em caso de erro
      return {
        cliente: {
          id: clienteId,
          nome: 'Desconhecido',
          telefone: '',
        },
        estatisticas: {
          totalAtendimentos: 0,
          atendimentosResolvidos: 0,
          atendimentosAbertos: 0,
          tempoMedioResposta: 0,
        },
      };
    }
  }

  /**
   * Busca contexto do cliente por telefone (quando não temos o UUID)
   */
  async buscarContextoPorTelefone(telefone: string): Promise<{
    cliente: {
      id: string;
      nome: string;
      telefone: string;
      email?: string;
      documento?: string;
    };
    estatisticas: {
      totalAtendimentos: number;
      atendimentosResolvidos: number;
      atendimentosAbertos: number;
      tempoMedioResposta: number;
      ultimaInteracao?: Date;
    };
    faturas?: Array<{
      id: string;
      numero: string;
      valor: number;
      vencimento: Date;
      status: string;
    }>;
    contratos?: Array<{
      id: string;
      plano: string;
      status: string;
      dataInicio: Date;
    }>;
  }> {
    try {
      const response = await api.get(`/api/atendimento/clientes/por-telefone/${telefone}/contexto`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar contexto por telefone:', error);
      return {
        cliente: {
          id: '',
          nome: 'Desconhecido',
          telefone: telefone,
        },
        estatisticas: {
          totalAtendimentos: 0,
          atendimentosResolvidos: 0,
          atendimentosAbertos: 0,
          tempoMedioResposta: 0,
        },
      };
    }
  }
}

export const atendimentoService = new AtendimentoService();
