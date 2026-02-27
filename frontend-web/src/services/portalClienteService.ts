/**
 * Serviço para Portal do Cliente
 * Gerencia acesso público às propostas e integração com aceite
 */

import { gerarTokenNumerico } from '../utils/tokenUtils';
import { API_BASE_URL } from './api';

const api = {
  get: async (url: string) => {
    const response = await fetch(`${API_BASE_URL}${url}`);
    if (!response.ok) throw new Error('Request failed');
    return { data: await response.json() };
  },
  post: async (url: string, data?: any) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) throw new Error('Request failed');
    return { data: await response.json() };
  },
  put: async (url: string, data?: any) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) throw new Error('Request failed');
    return { data: await response.json() };
  },
};

export interface PropostaPublica {
  id: string;
  numero: string;
  titulo: string;
  status: 'enviada' | 'visualizada' | 'aprovada' | 'rejeitada' | 'expirada';
  dataEnvio: Date;
  dataValidade: Date;
  valorTotal: number;
  token: string; // Token único para acesso público
  empresa: {
    nome: string;
    logo?: string;
    endereco: string;
    telefone: string;
    email: string;
  };
  cliente: {
    nome: string;
    email: string;
  };
  vendedor: {
    nome: string;
    email: string;
    telefone: string;
  };
  produtos: Array<{
    nome: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
  }>;
  condicoes: {
    formaPagamento: string;
    prazoEntrega: string;
    garantia: string;
    observacoes?: string;
  };
}

interface LogVisualizacao {
  propostaId: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
}

interface LogAcao {
  propostaId: string;
  acao: 'visualizada' | 'aprovada' | 'rejeitada' | 'download';
  ip: string;
  userAgent: string;
  timestamp: Date;
  observacoes?: string;
}

class PortalClienteService {
  /**
   * Obtém uma proposta pelo token público ou número da proposta
   * Inclui fallback para tokens armazenados localmente
   */
  async obterPropostaPublica(identificador: string): Promise<PropostaPublica | null> {
    // Se o identificador for numérico e tem mais de 6 dígitos, é provável que seja um número de proposta
    // Se for alfanumérico ou tem 6 dígitos, é um token
    const isNumeroPropostaPossivel = /^\d{7,}$/.test(identificador);

    try {
      let endpoint = `/api/portal/proposta/${identificador}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Erro ao carregar proposta');
      }

      const data = await response.json();

      // Registrar visualização
      await this.registrarVisualizacao(identificador);

      return {
        ...data,
        dataEnvio: new Date(data.dataEnvio),
        dataValidade: new Date(data.dataValidade),
      };
    } catch (error) {
      console.warn('API não disponível, verificando tokens locais:', error);

      // Fallback: buscar em dados mock baseado no identificador
      if (process.env.NODE_ENV === 'production') {
        throw error instanceof Error ? error : new Error('Erro ao carregar proposta do portal');
      }

      return this.obterPropostaMock(identificador);
    }
  }

  /**
   * Gera dados mock para desenvolvimento quando a API não está disponível
   */
  private obterPropostaMock(identificador: string): PropostaPublica | null {
    // Simular dados baseados no identificador
    const numeroMock = identificador.length > 6 ? identificador : `PROP-${identificador}`;

    return {
      id: `mock-${identificador}`,
      numero: numeroMock,
      titulo: `Proposta Comercial - ${numeroMock}`,
      cliente: {
        nome: 'João Silva',
        email: 'joao@exemplo.com',
      },
      empresa: {
        nome: 'ConectCRM',
        endereco: 'Goiânia/GO',
        telefone: '(62) 99668-9991',
        email: 'conectcrm@gmail.com',
      },
      vendedor: {
        nome: 'Vendedor Demo',
        email: 'vendedor@conectcrm.com',
        telefone: '(62) 99668-9991',
      },
      produtos: [
        {
          nome: 'Sistema CRM Premium',
          descricao: 'Solução completa de gestão de relacionamento com cliente',
          quantidade: 1,
          valorUnitario: 2500.0,
          valorTotal: 2500.0,
        },
        {
          nome: 'Treinamento e Suporte',
          descricao: 'Capacitação da equipe e suporte técnico por 12 meses',
          quantidade: 1,
          valorUnitario: 800.0,
          valorTotal: 800.0,
        },
      ],
      valorTotal: 3000.0,
      status: 'enviada',
      dataEnvio: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ontem
      dataValidade: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
      token: identificador.length <= 6 ? identificador : 'DEMO123',
      condicoes: {
        formaPagamento: 'Cartão de Crédito ou Boleto (12x sem juros)',
        prazoEntrega: '15 dias úteis após aprovação',
        garantia: '12 meses',
        observacoes: 'Proposta válida por 15 dias. Entre em contato para esclarecimentos.',
      },
    };
  }

  /**
   * Gera um token único para acesso público a uma proposta
   * Usa tokens numéricos de 6 dígitos para facilitar o acesso do cliente
   */
  async gerarTokenPublico(propostaId: string): Promise<string> {
    try {
      // Primeiro tenta gerar via API (pode retornar token personalizado do backend)
      const response = await api.post(`/propostas/${propostaId}/gerar-token`);
      return response.data.token;
    } catch (error) {
      console.warn('API não disponível, gerando token local:', error);

      // Fallback: gera token numérico de 6 dígitos localmente
      if (process.env.NODE_ENV === 'production') {
        throw error instanceof Error ? error : new Error('Erro ao gerar token publico');
      }

      const tokenLocal = gerarTokenNumerico();

      // Simula armazenamento local para desenvolvimento
      const tokenData = {
        token: tokenLocal,
        propostaId,
        criadoEm: new Date().toISOString(),
        validoAte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
      };

      // Armazena no localStorage para simulação
      const tokensLocal = JSON.parse(localStorage.getItem('portal_tokens') || '[]');
      tokensLocal.push(tokenData);
      localStorage.setItem('portal_tokens', JSON.stringify(tokensLocal));

      console.log(`Token gerado localmente: ${tokenLocal} para proposta ${propostaId}`);
      return tokenLocal;
    }
  }

  /**
   * Atualiza o status de uma proposta através do portal
   */
  async atualizarStatus(token: string, novoStatus: 'aprovada' | 'rejeitada'): Promise<void> {
    console.log('🔄 Iniciando atualização de status:', { token, novoStatus });

    try {
      const API_URL = API_BASE_URL;

      // 1. Atualizar via endpoint do portal
      console.log('📡 Atualizando via portal endpoint...');
      const portalResponse = await fetch(`${API_URL}/api/portal/proposta/${token}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: novoStatus,
          timestamp: new Date().toISOString(),
          ip: await this.obterIP(),
          userAgent: navigator.userAgent,
        }),
      });

      // 2. Atualizar também no CRM principal usando o token como ID
      console.log('📡 Sincronizando com CRM principal...');
      const crmResponse = await fetch(`${API_URL}/propostas/${token}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: novoStatus,
          observacoes: `Proposta ${novoStatus} via portal do cliente`,
          dataAceite: new Date().toISOString(),
          fonte: 'portal',
        }),
      });

      if (portalResponse.ok && crmResponse.ok) {
        console.log('✅ Status sincronizado com portal e CRM principal');
        // Registrar ação
        await this.registrarAcao(token, novoStatus);

        // Emitir evento para atualizar o grid em tempo real
        window.dispatchEvent(
          new CustomEvent('propostaAtualizada', {
            detail: { propostaId: token, novoStatus, fonte: 'portal' },
          }),
        );

        return;
      }

      if (!portalResponse.ok && !crmResponse.ok) {
        throw new Error('Ambos endpoints falharam');
      }

      // Se pelo menos um funcionou, considerar sucesso parcial
      console.warn('⚠️ Sincronização parcial - alguns endpoints falharam');
      await this.registrarAcao(token, novoStatus);
    } catch (error) {
      console.warn('❌ Erro na API, usando fallback local:', error);
      await this.atualizarStatusLocal(token, novoStatus);
    }
  }

  /**
   * Atualiza status localmente como fallback
   */
  private async atualizarStatusLocal(
    token: string,
    novoStatus: 'aprovada' | 'rejeitada',
  ): Promise<void> {
    try {
      // Atualizar no localStorage como simulação
      const propostas = JSON.parse(localStorage.getItem('propostas') || '[]');
      const tokenData = JSON.parse(localStorage.getItem('portal_tokens') || '[]');

      // Encontrar proposta pelo token
      const tokenInfo = tokenData.find((t: any) => t.token === token);
      if (tokenInfo) {
        const propostaIndex = propostas.findIndex(
          (p: any) => p.numero === tokenInfo.propostaId || p.id === tokenInfo.propostaId,
        );

        if (propostaIndex >= 0) {
          propostas[propostaIndex].status = novoStatus;
          propostas[propostaIndex].updatedAt = new Date().toISOString();
          localStorage.setItem('propostas', JSON.stringify(propostas));
          console.log('✅ Status atualizado localmente');
        }
      }

      // Registrar para sincronização futura
      await this.registrarParaSincronizacao(token, novoStatus);
    } catch (error) {
      console.error('Erro na atualização local:', error);
    }
  }

  /**
   * Sincroniza com o CRM principal
   */
  async sincronizarComCRM(propostaId: string, novoStatus: string): Promise<any> {
    try {
      const CRM_API_URL = API_BASE_URL;

      const response = await fetch(`${CRM_API_URL}/propostas/${propostaId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: novoStatus,
          updatedAt: new Date().toISOString(),
          source: 'portal-cliente',
        }),
      });

      if (!response.ok) {
        console.warn('CRM API indisponível, status será sincronizado posteriormente');
        return { success: false, pendingSync: true };
      }

      console.log('✅ Status sincronizado com CRM principal');
      return await response.json();
    } catch (error) {
      console.error('Erro ao sincronizar com CRM:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Registra ação para sincronização futura
   */
  private async registrarParaSincronizacao(token: string, status: string): Promise<void> {
    try {
      const pending = JSON.parse(localStorage.getItem('pendentSync') || '[]');
      pending.push({
        token,
        status,
        timestamp: Date.now(),
        type: 'status_update',
      });
      localStorage.setItem('pendentSync', JSON.stringify(pending));
      console.log('📋 Ação registrada para sincronização futura');
    } catch (error) {
      console.error('Erro ao registrar para sync:', error);
    }
  }

  /**
   * Registra uma visualização da proposta
   */
  private async registrarVisualizacao(token: string): Promise<void> {
    try {
      const API_URL = API_BASE_URL;

      const log: LogVisualizacao = {
        propostaId: token,
        ip: await this.obterIP(),
        userAgent: navigator.userAgent,
        timestamp: new Date(),
      };

      // ✅ CORRIGIDO: Usar o endpoint correto do portal
      await fetch(`${API_URL}/api/portal/proposta/${token}/view`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip: log.ip,
          userAgent: log.userAgent,
          timestamp: log.timestamp.toISOString(),
          resolucaoTela: `${window.screen.width}x${window.screen.height}`,
          referrer: document.referrer,
        }),
      });

      console.log(`✅ Visualização registrada para token: ${token}`);
    } catch (error) {
      // Log de visualização não deve bloquear a experiência
      console.warn('⚠️ Erro ao registrar visualização:', error);
    }
  }

  /**
   * Registra uma ação realizada na proposta
   */
  private async registrarAcao(
    token: string,
    acao: LogAcao['acao'],
    observacoes?: string,
  ): Promise<void> {
    try {
      const log: LogAcao = {
        propostaId: token,
        acao,
        ip: await this.obterIP(),
        userAgent: navigator.userAgent,
        timestamp: new Date(),
        observacoes,
      };

      await fetch('/api/portal/log/acao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(log),
      });
    } catch (error) {
      console.warn('Erro ao registrar ação:', error);
    }
  }

  /**
   * Obtém o IP do cliente
   */
  private async obterIP(): Promise<string> {
    try {
      const response = await fetch('/api/portal/ip');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Valida se uma proposta ainda pode ser aceita
   */
  validarPropostaAceite(proposta: PropostaPublica): {
    podeAceitar: boolean;
    motivo?: string;
  } {
    const agora = new Date();
    const dataValidade = new Date(proposta.dataValidade);

    if (proposta.status === 'aprovada') {
      return { podeAceitar: false, motivo: 'Proposta já foi aprovada' };
    }

    if (proposta.status === 'rejeitada') {
      return { podeAceitar: false, motivo: 'Proposta foi rejeitada' };
    }

    if (proposta.status === 'expirada' || agora > dataValidade) {
      return { podeAceitar: false, motivo: 'Proposta expirada' };
    }

    return { podeAceitar: true };
  }

  /**
   * Gera URL pública para uma proposta
   */
  gerarURLPublica(token: string): string {
    const baseURL = window.location.origin;
    return `${baseURL}/portal/proposta/${token}`;
  }

  /**
   * Envia proposta por email com link do portal
   */
  async enviarPropostaPorEmail(
    propostaId: string,
    dadosEnvio: {
      emailDestino: string;
      mensagemPersonalizada?: string;
      incluirAnexo?: boolean;
    },
  ): Promise<void> {
    try {
      // Gerar token se necessário
      const token = await this.gerarTokenPublico(propostaId);
      const urlPortal = this.gerarURLPublica(token);

      // Enviar email através do serviço de email
      const response = await api.post('/email/enviar-proposta', {
        propostaId,
        token,
        urlPortal,
        ...dadosEnvio,
      });

      if (!response.data.sucesso) {
        throw new Error(response.data.erro || 'Erro ao enviar email');
      }
    } catch (error) {
      console.error('Erro ao enviar proposta por email:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de uma proposta
   */
  async obterEstatisticasProposta(propostaId: string): Promise<{
    totalVisualizacoes: number;
    ultimaVisualizacao?: Date;
    tempoMedioVisualizacao: number;
    dispositivosUtilizados: string[];
    acoes: LogAcao[];
  }> {
    try {
      const response = await api.get(`/propostas/${propostaId}/estatisticas`);
      return {
        ...response.data,
        ultimaVisualizacao: response.data.ultimaVisualizacao
          ? new Date(response.data.ultimaVisualizacao)
          : undefined,
        acoes: response.data.acoes.map((acao: any) => ({
          ...acao,
          timestamp: new Date(acao.timestamp),
        })),
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  /**
   * Agenda lembrete para propostas não respondidas
   */
  async agendarLembrete(propostaId: string, diasApos: number = 7): Promise<void> {
    try {
      await api.post(`/propostas/${propostaId}/agendar-lembrete`, {
        diasApos,
      });
    } catch (error) {
      console.error('Erro ao agendar lembrete:', error);
      throw error;
    }
  }

  /**
   * Obtém propostas expiradas para reativação
   */
  async obterPropostasExpiradas(vendedorId?: string): Promise<PropostaPublica[]> {
    try {
      const params = vendedorId ? `?vendedorId=${vendedorId}` : '';
      const response = await api.get(`/propostas/expiradas${params}`);

      return response.data.map((proposta: any) => ({
        ...proposta,
        dataEnvio: new Date(proposta.dataEnvio),
        dataValidade: new Date(proposta.dataValidade),
      }));
    } catch (error) {
      console.error('Erro ao obter propostas expiradas:', error);
      throw error;
    }
  }

  /**
   * Reativa uma proposta expirada com nova validade
   */
  async reativarProposta(propostaId: string, novaDataValidade: Date): Promise<string> {
    try {
      const response = await api.post(`/propostas/${propostaId}/reativar`, {
        novaDataValidade: novaDataValidade.toISOString(),
      });

      return response.data.novoToken;
    } catch (error) {
      console.error('Erro ao reativar proposta:', error);
      throw error;
    }
  }

  /**
   * Obtém histórico completo de uma proposta
   */
  async obterHistoricoProposta(propostaId: string): Promise<{
    criacaoEm: Date;
    envioEm?: Date;
    primeiraVisualizacaoEm?: Date;
    decisaoEm?: Date;
    statusAtual: string;
    log: Array<{
      data: Date;
      evento: string;
      detalhes: string;
      ip?: string;
    }>;
  }> {
    try {
      const response = await api.get(`/propostas/${propostaId}/historico`);

      return {
        ...response.data,
        criacaoEm: new Date(response.data.criacaoEm),
        envioEm: response.data.envioEm ? new Date(response.data.envioEm) : undefined,
        primeiraVisualizacaoEm: response.data.primeiraVisualizacaoEm
          ? new Date(response.data.primeiraVisualizacaoEm)
          : undefined,
        decisaoEm: response.data.decisaoEm ? new Date(response.data.decisaoEm) : undefined,
        log: response.data.log.map((item: any) => ({
          ...item,
          data: new Date(item.data),
        })),
      };
    } catch (error) {
      console.error('Erro ao obter histórico:', error);
      throw error;
    }
  }
}

export const portalClienteService = new PortalClienteService();
