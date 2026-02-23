import { Injectable, Logger } from '@nestjs/common';
import { PropostasService } from './propostas.service';
import { EmailIntegradoService } from './email-integrado.service';

interface TokenData {
  token: string;
  propostaId: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

interface ViewData {
  ip?: string;
  userAgent?: string;
  timestamp?: string;
}

@Injectable()
export class PortalService {
  private readonly logger = new Logger(PortalService.name);
  private tokenMappings: Record<string, string> = {
    // Tokens pré-definidos para desenvolvimento
    'test-token-123': '1',
    'token-teste-workflow-999': '1',
    'portal-token-1': '1',
    'portal-token-2': '2',
    'PROP-001': '1',
    'PROP-002': '2',
    'TEST-001': '1',
    'TEST-002': '2',
    // ✨ ADICIONANDO PROPOSTAS REAIS PARA TESTE
    'PROP-2025-049': 'bff61bbe-b645-4581-a3d1-d8447b8c2b75',
    'PROP-2025-051': 'e0003dcb-f81a-4ac5-9661-76233446bfa8',
  };

  constructor(
    private readonly propostasService: PropostasService,
    private readonly emailService: EmailIntegradoService,
  ) {}


  private maskToken(token?: string): string {
    if (!token) return '[token]';
    if (token.length <= 8) return `${token.slice(0, 2)}***`;
    return `${token.slice(0, 4)}...${token.slice(-4)}`;
  }

  private sanitizePortalMetadata(metadata?: any): any {
    if (!metadata || typeof metadata !== 'object') return metadata ?? null;

    const clone: Record<string, unknown> = { ...metadata };
    if (typeof clone.ip === 'string') {
      const ip = clone.ip as string;
      const parts = ip.split('.');
      clone.ip = parts.length === 4 ? `${parts[0]}.${parts[1]}.*.*` : '[ip-redacted]';
    }
    if (typeof clone.userAgent === 'string') {
      const ua = clone.userAgent as string;
      clone.userAgent = `${ua.slice(0, 60)}${ua.length > 60 ? '...' : ''}`;
    }

    return clone;
  }

  /**
   * Atualiza status de proposta usando token do portal
   */
  async atualizarStatusPorToken(
    token: string,
    novoStatus: string,
    metadata?: ViewData,
  ): Promise<any> {
    this.logger.log(`🔐 Portal: Processando token ${this.maskToken(token)}`);

    // 1. Validar token e obter proposta ID
    const tokenData = await this.validarToken(token);

    if (!tokenData || !tokenData.isActive) {
      throw new Error('Token inválido ou expirado');
    }

    this.logger.log(`✅ Token válido para proposta: ${tokenData.propostaId}`);
    this.logger.log(
      `🔧 DEBUG: tokenData.propostaId = "${tokenData.propostaId}" (tipo: ${typeof tokenData.propostaId})`,
    );

    // 2. Registrar ação no log do portal
    await this.registrarAcaoPortal(token, 'status_update', {
      novoStatus,
      ...metadata,
    });

    // 3. Atualizar status da proposta via service principal com validação automática
    let resultado;

    if (novoStatus === 'aprovada' || novoStatus === 'rejeitada') {
      this.logger.log(`🔄 Portal: Aplicando transição automática para ${novoStatus}`);
      this.logger.log(
        `🔧 DEBUG: Chamando atualizarStatusComValidacao com ID: "${tokenData.propostaId}"`,
      );
      resultado = await this.propostasService.atualizarStatusComValidacao(
        tokenData.propostaId,
        novoStatus,
        'portal-auto',
        `Cliente ${novoStatus} a proposta via portal (token: ${token.substring(0, 8)}...)`,
      );
    } else {
      this.logger.log(`🔧 DEBUG: Chamando atualizarStatus com ID: "${tokenData.propostaId}"`);
      resultado = await this.propostasService.atualizarStatus(
        tokenData.propostaId,
        novoStatus,
        'portal-cliente',
        `Atualizado via portal do cliente (token: ${token.substring(0, 8)}...)`,
      );
    }

    // 4. Enviar notificação por email se foi aceita ou rejeitada
    if (novoStatus === 'aprovada') {
      try {
        await this.emailService.notificarPropostaAceita({
          numero: tokenData.propostaId,
          titulo: resultado.titulo || 'Proposta sem título',
          cliente: resultado.cliente || 'Cliente',
          valor: resultado.valor || 0,
          status: 'aprovada',
          dataAceite: new Date().toISOString(),
        });
        this.logger.log('📧 Email de notificação de aceitação enviado com sucesso');
      } catch (emailError) {        this.logger.warn('Portal: erro ao enviar email de aceita??o (proposta j? atualizada)');
      }
    } else if (novoStatus === 'rejeitada') {
      try {
        await this.emailService.notificarPropostaRejeitada({
          numero: tokenData.propostaId,
          titulo: resultado.titulo || 'Proposta sem título',
          cliente: resultado.cliente || 'Cliente',
          valor: resultado.valor || 0,
          status: 'rejeitada',
          dataRejeicao: new Date().toISOString(),
        });
        this.logger.log('📧 Email de notificação de rejeição enviado com sucesso');
      } catch (emailError) {        this.logger.warn('Portal: erro ao enviar email de rejei??o (proposta j? atualizada)');
      }
    }

    this.logger.log(`✅ Portal: Status atualizado com sucesso`);

    return {
      ...resultado,
      tokenInfo: {
        token: token.substring(0, 8) + '...',
        source: 'portal-cliente',
      },
    };
  }

  /**
   * Obtém proposta por token do portal
   */
  async obterPropostaPorToken(token: string): Promise<any> {
    this.logger.log(`🔍 Portal: Buscando proposta por token ${this.maskToken(token)}`);

    // 1. Validar token
    const tokenData = await this.validarToken(token);

    if (!tokenData || !tokenData.isActive) {
      throw new Error('Token inválido ou expirado');
    }

    // 2. Buscar proposta
    const proposta = await this.propostasService.obterProposta(tokenData.propostaId);

    if (!proposta) {
      throw new Error('Proposta não encontrada');
    }

    // 3. 🔄 SINCRONIZAÇÃO AUTOMÁTICA: Atualizar status para "visualizada" se ainda estiver "enviada"
    if (proposta.status === 'enviada') {
      this.logger.log(`🔄 Portal: Auto-atualizando status ${proposta.status} → visualizada`);

      try {
        await this.propostasService.marcarComoVisualizada(
          tokenData.propostaId,
          '127.0.0.1', // IP do cliente seria capturado em produção
          'Portal-Client',
        );

        // Atualizar objeto local
        proposta.status = 'visualizada';
        proposta.updatedAt = new Date().toISOString();

        this.logger.log(`✅ Portal: Status atualizado automaticamente para "visualizada"`);
      } catch (error) {        this.logger.warn('Portal: erro ao atualizar status automaticamente para visualizada');
      }
    }

    // 4. Registrar acesso
    await this.registrarAcaoPortal(token, 'view', {
      timestamp: new Date().toISOString(),
      statusAnterior: proposta.status === 'visualizada' ? 'enviada' : proposta.status,
      statusAtual: proposta.status,
    });

    this.logger.log(`✅ Portal: Proposta encontrada para token`);

    return {
      ...proposta,
      portalAccess: {
        token: token.substring(0, 8) + '...',
        accessedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Valida token do portal
   */
  private async validarToken(token: string): Promise<TokenData | null> {    this.logger.debug(`Portal: Validando token ${this.maskToken(token)}`);

    // ✅ CORREÇÃO: Usar método centralizado para obter mapeamentos
    const tokenMappings = this.getTokenMappings();

    // 🔧 CORREÇÃO: Remover validação por tamanho, apenas verificar se existe proposta
    // A validação real será feita ao buscar a proposta no banco

    // Obter ID real da proposta ou usar mapeamento padrão
    let propostaId = tokenMappings[token];

    if (!propostaId) {
      // 🔧 CORREÇÃO: Buscar proposta pelo NÚMERO (token)
      try {
        const propostas = await this.propostasService.listarPropostas();        this.logger.debug(`Portal: ${propostas.length} propostas encontradas no banco`);        this.logger.debug(`Portal: procurando proposta por n?mero/token ${this.maskToken(token)}`);

        // Tentar encontrar proposta pelo número (token)
        const propostaEncontrada = propostas.find((p) => p.numero === token);

        if (propostaEncontrada) {
          propostaId = propostaEncontrada.id;
          this.logger.log(`✅ Token ${this.maskToken(token)} mapeado para proposta existente ID: ${propostaId}`);
          this.logger.log(
            `🔧 DEBUG: propostaEncontrada.id = "${propostaEncontrada.id}" (tipo: ${typeof propostaEncontrada.id})`,
          );
          this.logger.log(`🔧 DEBUG: propostaEncontrada.numero = "${propostaEncontrada.numero}"`);
        } else {
          this.logger.log(`❌ Proposta com número ${this.maskToken(token)} não encontrada no banco`);
          this.logger.log(`🔍 Buscou entre ${propostas.length} propostas. Token rejeitado.`);
          return null; // Token inválido se proposta não existe
        }
      } catch (error) {        this.logger.warn('Portal: erro ao buscar propostas para validar token');
        return null; // Falhar se não conseguir buscar
      }
    } else {
      this.logger.log(`✅ Token ${this.maskToken(token)} encontrado no mapeamento: ${propostaId}`);
    }

    // Simular dados do token para desenvolvimento
    const tokenMock: TokenData = {
      token,
      propostaId, // AGORA USA O ID CORRETO DA PROPOSTA REAL
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
      isActive: true,
    };

    this.logger.log(`✅ Token ${this.maskToken(token)} validado → Proposta ID real: ${propostaId}`);
    return tokenMock;
  }

  /**
   * Registra ação no portal
   */
  async registrarAcaoPortal(token: string, acao: string, metadata?: any): Promise<void> {
    this.logger.log(`📝 Portal: Registrando ação "${acao}" para token ${this.maskToken(token)}`);

    const logEntry = {
      token: token.substring(0, 8) + '...',
      acao,
      timestamp: new Date().toISOString(),
      metadata,
    };

    // Em um ambiente real, isso seria salvo no banco de dados
    this.logger.debug(`Portal log entry: ${JSON.stringify({ ...logEntry, metadata: this.sanitizePortalMetadata(logEntry.metadata) })}`);
  }

  /**
   * Registra visualização da proposta
   */
  async registrarVisualizacao(token: string, viewData: ViewData): Promise<void> {
    await this.registrarAcaoPortal(token, 'view', {
      ip: viewData.ip,
      userAgent: viewData.userAgent,
      timestamp: viewData.timestamp || new Date().toISOString(),
    });
  }

  /**
   * Registra ação do cliente na proposta
   */
  async registrarAcaoCliente(
    token: string,
    acao: string,
    metadata?: any,
  ): Promise<{ sucesso: boolean; mensagem: string; status?: string }> {
    this.logger.log(`🎯 Portal: Registrando ação "${acao}" do cliente`);

    try {
      // 1. Validar token
      const tokenData = await this.validarToken(token);
      if (!tokenData || !tokenData.isActive) {
        return { sucesso: false, mensagem: 'Token inválido ou expirado' };
      }

      // 2. Registrar ação no log
      await this.registrarAcaoPortal(token, acao, {
        ...metadata,
        timestamp: new Date().toISOString(),
        source: 'cliente-portal',
      });

      // 3. Atualizar status baseado na ação
      let novoStatus: string | null = null;

      switch (acao) {
        case 'visualizada':
          novoStatus = 'visualizada';
          break;
        case 'aprovada':
        case 'aceita':
          novoStatus = 'aprovada';
          break;
        case 'rejeitada':
        case 'recusada':
          novoStatus = 'rejeitada';
          break;
        case 'em_analise':
          novoStatus = 'em_analise';
          break;
        default:
          // Para outras ações, apenas registrar sem alterar status
          this.logger.log(`📝 Ação "${acao}" registrada sem alteração de status`);
          break;
      }

      // 4. Se há mudança de status, aplicar via método centralizado
      if (novoStatus) {
        await this.atualizarStatusPorToken(token, novoStatus, metadata);
        this.logger.log(`✅ Status atualizado para: ${novoStatus}`);

        return {
          sucesso: true,
          mensagem: `Ação "${acao}" registrada e status atualizado para "${novoStatus}"`,
          status: novoStatus,
        };
      }

      return {
        sucesso: true,
        mensagem: `Ação "${acao}" registrada com sucesso`,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao registrar ação do cliente:`, error);
      return {
        sucesso: false,
        mensagem: `Erro ao registrar ação: ${error.message}`,
      };
    }
  }

  /**
   * Registra um token para uma proposta específica
   */
  async registrarTokenProposta(token: string, propostaId: string): Promise<void> {
    this.logger.log(`🎫 Portal: Registrando token ${this.maskToken(token)} para proposta ${propostaId}`);

    // Adicionar ao mapeamento em memória
    this.tokenMappings[token] = propostaId;

    this.logger.log(`✅ Token ${this.maskToken(token)} registrado com sucesso para proposta ${propostaId}`);
  }

  /**
   * Obtém mapeamentos de tokens (método auxiliar)
   */
  private getTokenMappings(): Record<string, string> {
    return this.tokenMappings;
  }

  /**
   * Gera novo token para proposta (para futuras funcionalidades)
   */
  async gerarToken(propostaId: string, expiresInDays: number = 30): Promise<string> {
    const token = `${propostaId}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const tokenData: TokenData = {
      token,
      propostaId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
    };

    // Em um ambiente real, salvar no banco de dados
    this.logger.log(`🎫 Token gerado para proposta ${propostaId}:`, token);

    return token;
  }
}
