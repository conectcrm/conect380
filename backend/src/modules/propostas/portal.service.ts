import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { EmailIntegradoService } from './email-integrado.service';
import { Proposta as PropostaEntity } from './proposta.entity';
import { PropostaPortalToken } from './proposta-portal-token.entity';
import { PropostasService } from './propostas.service';

interface TokenData {
  token: string;
  propostaId: string;
  empresaId: string;
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

  constructor(
    private readonly propostasService: PropostasService,
    private readonly emailService: EmailIntegradoService,
    @InjectRepository(PropostaPortalToken)
    private readonly portalTokenRepository: Repository<PropostaPortalToken>,
    @InjectRepository(PropostaEntity)
    private readonly propostaRepository: Repository<PropostaEntity>,
  ) {}

  private readonly uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private isUuid(value?: string | null): boolean {
    return Boolean(value && this.uuidRegex.test(String(value)));
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(String(token)).digest('hex');
  }

  private maskToken(token?: string): string {
    if (!token) return '[token]';
    const value = String(token);
    if (value.length <= 8) return `${value.slice(0, 2)}***`;
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
  }

  private sanitizePortalMetadata(metadata?: unknown): unknown {
    if (!metadata || typeof metadata !== 'object') return metadata ?? null;

    const clone: Record<string, unknown> = { ...(metadata as Record<string, unknown>) };
    if (typeof clone.ip === 'string') {
      const parts = clone.ip.split('.');
      clone.ip = parts.length === 4 ? `${parts[0]}.${parts[1]}.*.*` : '[ip-redacted]';
    }
    if (typeof clone.userAgent === 'string') {
      const ua = clone.userAgent;
      clone.userAgent = `${ua.slice(0, 60)}${ua.length > 60 ? '...' : ''}`;
    }
    return clone;
  }

  private buildTokenData(rawToken: string, entity: PropostaPortalToken): TokenData {
    return {
      token: rawToken,
      propostaId: entity.propostaId,
      empresaId: entity.empresaId,
      createdAt: entity.criadoEm?.toISOString?.() ?? new Date().toISOString(),
      expiresAt: entity.expiraEm ? entity.expiraEm.toISOString() : undefined,
      isActive: Boolean(entity.isActive && !entity.revogadoEm),
    };
  }

  private async touchToken(tokenId: string): Promise<void> {
    try {
      await this.portalTokenRepository.update(tokenId, { ultimoAcessoEm: new Date() });
    } catch (error) {
      this.logger.warn(`Portal: falha ao atualizar ultimo acesso do token (${tokenId})`);
    }
  }

  private async expireToken(entity: PropostaPortalToken): Promise<void> {
    try {
      await this.portalTokenRepository.update(entity.id, {
        isActive: false,
        revogadoEm: entity.revogadoEm ?? new Date(),
      });
    } catch (error) {
      this.logger.warn(`Portal: falha ao expirar token ${this.maskToken(entity.tokenHint || '')}`);
    }
  }

  private async findTokenEntity(rawToken: string): Promise<PropostaPortalToken | null> {
    const tokenHash = this.hashToken(rawToken);
    return this.portalTokenRepository.findOne({
      where: { tokenHash },
    });
  }

  private async resolvePropostaEntity(
    propostaIdOuNumero: string,
    empresaId?: string,
  ): Promise<PropostaEntity | null> {
    if (!propostaIdOuNumero) return null;

    if (this.isUuid(propostaIdOuNumero)) {
      const byId = await this.propostaRepository.findOne({
        where: empresaId ? { id: propostaIdOuNumero, empresaId } : { id: propostaIdOuNumero },
      });
      if (byId) return byId;
    }

    return this.propostaRepository.findOne({
      where: empresaId ? { numero: propostaIdOuNumero, empresaId } : { numero: propostaIdOuNumero },
    });
  }

  private async persistTokenForProposta(
    rawToken: string,
    proposta: PropostaEntity,
    expiresInDays = 30,
  ): Promise<{ token: string; expiresAt: string }> {
    const empresaId = proposta.empresaId || (proposta as any).empresa_id;
    if (!empresaId) {
      throw new Error('Proposta sem empresa_id. Nao e possivel gerar token de portal com seguranca.');
    }

    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + Math.max(1, expiresInDays) * 24 * 60 * 60 * 1000);
    const tokenHint = this.maskToken(rawToken);

    // Revoga tokens ativos anteriores desta proposta para reduzir superficie de exposicao.
    await this.portalTokenRepository
      .createQueryBuilder()
      .update(PropostaPortalToken)
      .set({
        isActive: false,
        revogadoEm: new Date(),
      })
      .where('proposta_id = :propostaId', { propostaId: proposta.id })
      .andWhere('is_active = true')
      .execute();

    const existente = await this.portalTokenRepository.findOne({ where: { tokenHash } });
    if (existente && existente.propostaId !== proposta.id) {
      throw new Error('Token ja associado a outra proposta');
    }

    const entity = existente ?? this.portalTokenRepository.create();
    entity.empresaId = empresaId;
    entity.propostaId = proposta.id;
    entity.tokenHash = tokenHash;
    entity.tokenHint = tokenHint;
    entity.isActive = true;
    entity.expiraEm = expiresAt;
    entity.revogadoEm = null;
    entity.ultimoAcessoEm = null;

    await this.portalTokenRepository.save(entity);

    this.logger.log(
      `Portal: token registrado para proposta ${proposta.id} (${this.maskToken(rawToken)})`,
    );

    return { token: rawToken, expiresAt: expiresAt.toISOString() };
  }

  private async validarToken(token: string): Promise<TokenData | null> {
    this.logger.debug(`Portal: validando token ${this.maskToken(token)}`);

    const tokenEntity = await this.findTokenEntity(token);
    if (!tokenEntity) {
      this.logger.warn(`Portal: token nao encontrado ${this.maskToken(token)}`);
      return null;
    }

    if (!tokenEntity.isActive || tokenEntity.revogadoEm) {
      this.logger.warn(`Portal: token inativo ${this.maskToken(token)}`);
      return null;
    }

    if (tokenEntity.expiraEm && tokenEntity.expiraEm.getTime() < Date.now()) {
      this.logger.warn(`Portal: token expirado ${this.maskToken(token)}`);
      await this.expireToken(tokenEntity);
      return null;
    }

    await this.touchToken(tokenEntity.id);
    return this.buildTokenData(token, tokenEntity);
  }

  async atualizarStatusPorToken(
    token: string,
    novoStatus: string,
    metadata?: ViewData,
  ): Promise<any> {
    this.logger.log(`Portal: processando status via token ${this.maskToken(token)} -> ${novoStatus}`);

    const tokenData = await this.validarToken(token);
    if (!tokenData || !tokenData.isActive) {
      throw new Error('Token invalido ou expirado');
    }

    await this.registrarAcaoPortal(token, 'status_update', { novoStatus, ...metadata });

    let resultado;
    if (novoStatus === 'aprovada' || novoStatus === 'rejeitada') {
      resultado = await this.propostasService.atualizarStatusComValidacao(
        tokenData.propostaId,
        novoStatus,
        'portal-auto',
        `Cliente ${novoStatus} a proposta via portal (token: ${this.maskToken(token)})`,
        tokenData.empresaId,
      );
    } else {
      resultado = await this.propostasService.atualizarStatus(
        tokenData.propostaId,
        novoStatus,
        'portal-cliente',
        `Atualizado via portal do cliente (token: ${this.maskToken(token)})`,
        tokenData.empresaId,
      );
    }

    if (novoStatus === 'aprovada') {
      try {
        await this.emailService.notificarPropostaAceita({
          numero: tokenData.propostaId,
          titulo: resultado.titulo || 'Proposta sem titulo',
          cliente: resultado.cliente || 'Cliente',
          valor: resultado.valor || 0,
          status: 'aprovada',
          dataAceite: new Date().toISOString(),
        });
      } catch (error) {
        this.logger.warn('Portal: erro ao enviar notificacao de aceite (proposta ja atualizada)');
      }
    } else if (novoStatus === 'rejeitada') {
      try {
        await this.emailService.notificarPropostaRejeitada({
          numero: tokenData.propostaId,
          titulo: resultado.titulo || 'Proposta sem titulo',
          cliente: resultado.cliente || 'Cliente',
          valor: resultado.valor || 0,
          status: 'rejeitada',
          dataRejeicao: new Date().toISOString(),
        });
      } catch (error) {
        this.logger.warn('Portal: erro ao enviar notificacao de rejeicao (proposta ja atualizada)');
      }
    }

    return {
      ...resultado,
      tokenInfo: {
        token: this.maskToken(token),
        source: 'portal-cliente',
      },
    };
  }

  async obterPropostaPorToken(token: string): Promise<any> {
    this.logger.log(`Portal: buscando proposta por token ${this.maskToken(token)}`);

    const tokenData = await this.validarToken(token);
    if (!tokenData || !tokenData.isActive) {
      throw new Error('Token invalido ou expirado');
    }

    const proposta = await this.propostasService.obterProposta(tokenData.propostaId, tokenData.empresaId);
    if (!proposta) {
      throw new Error('Proposta nao encontrada');
    }

    if (proposta.status === 'enviada') {
      try {
        await this.propostasService.marcarComoVisualizada(
          tokenData.propostaId,
          undefined,
          metadataUserAgentFallback(),
          tokenData.empresaId,
        );
        proposta.status = 'visualizada';
        (proposta as any).updatedAt = new Date().toISOString();
      } catch (error) {
        this.logger.warn('Portal: erro ao atualizar status automaticamente para visualizada');
      }
    }

    await this.registrarAcaoPortal(token, 'view', {
      timestamp: new Date().toISOString(),
      statusAtual: proposta.status,
    });

    return {
      ...proposta,
      portalAccess: {
        token: this.maskToken(token),
        accessedAt: new Date().toISOString(),
      },
    };
  }

  async registrarAcaoPortal(token: string, acao: string, metadata?: any): Promise<void> {
    this.logger.log(`Portal: acao "${acao}" em ${this.maskToken(token)}`);
    this.logger.debug(
      `Portal action: ${JSON.stringify({
        token: this.maskToken(token),
        acao,
        timestamp: new Date().toISOString(),
        metadata: this.sanitizePortalMetadata(metadata),
      })}`,
    );
  }

  async registrarVisualizacao(token: string, viewData: ViewData): Promise<void> {
    await this.registrarAcaoPortal(token, 'view', {
      ip: viewData.ip,
      userAgent: viewData.userAgent,
      timestamp: viewData.timestamp || new Date().toISOString(),
    });
  }

  async registrarAcaoCliente(
    token: string,
    acao: string,
    metadata?: any,
  ): Promise<{ sucesso: boolean; mensagem: string; status?: string }> {
    this.logger.log(`Portal: registrando acao "${acao}" do cliente`);

    try {
      const tokenData = await this.validarToken(token);
      if (!tokenData || !tokenData.isActive) {
        return { sucesso: false, mensagem: 'Token invalido ou expirado' };
      }

      await this.registrarAcaoPortal(token, acao, {
        ...metadata,
        timestamp: new Date().toISOString(),
        source: 'cliente-portal',
      });

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
          break;
      }

      if (novoStatus) {
        await this.atualizarStatusPorToken(token, novoStatus, metadata);
        return {
          sucesso: true,
          mensagem: `Acao "${acao}" registrada e status atualizado para "${novoStatus}"`,
          status: novoStatus,
        };
      }

      return {
        sucesso: true,
        mensagem: `Acao "${acao}" registrada com sucesso`,
      };
    } catch (error) {
      this.logger.error('Portal: erro ao registrar acao do cliente', error);
      return {
        sucesso: false,
        mensagem: `Erro ao registrar acao: ${error.message}`,
      };
    }
  }

  async registrarTokenProposta(
    token: string,
    propostaIdOuNumero: string,
    empresaId?: string,
    expiresInDays = 30,
  ): Promise<void> {
    if (!token) {
      throw new Error('Token do portal e obrigatorio');
    }

    const proposta = await this.resolvePropostaEntity(propostaIdOuNumero, empresaId);
    if (!proposta) {
      throw new Error(`Proposta ${propostaIdOuNumero} nao encontrada para registrar token`);
    }

    await this.persistTokenForProposta(token, proposta, expiresInDays);
  }

  async gerarToken(
    propostaId: string,
    expiresInDays: number = 30,
    empresaId?: string,
  ): Promise<string> {
    const { token } = await this.gerarTokenParaProposta(propostaId, empresaId, expiresInDays);
    return token;
  }

  async gerarTokenParaProposta(
    propostaIdOuNumero: string,
    empresaId?: string,
    expiresInDays = 30,
  ): Promise<{ token: string; expiresAt: string; propostaId: string }> {
    const proposta = await this.resolvePropostaEntity(propostaIdOuNumero, empresaId);
    if (!proposta) {
      throw new Error(`Proposta ${propostaIdOuNumero} nao encontrada`);
    }

    const rawToken = randomBytes(24).toString('hex');
    const persisted = await this.persistTokenForProposta(rawToken, proposta, expiresInDays);
    this.logger.log(
      `Portal: token gerado para proposta ${proposta.id} (${this.maskToken(rawToken)})`,
    );

    return {
      token: persisted.token,
      expiresAt: persisted.expiresAt,
      propostaId: proposta.id,
    };
  }
}

function metadataUserAgentFallback(): string {
  return 'Portal-Client';
}
