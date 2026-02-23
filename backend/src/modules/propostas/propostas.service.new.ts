import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proposta as PropostaEntity } from './proposta.entity';
import { User } from '../users/user.entity';

export interface Proposta {
  id: string;
  numero: string;
  titulo?: string;
  cliente: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    documento?: string;
    status?: string;
  };
  produtos: Array<{
    id: string;
    nome: string;
    precoUnitario: number;
    quantidade: number;
    desconto: number;
    subtotal: number;
  }>;
  subtotal: number;
  descontoGlobal: number;
  impostos: number;
  total: number;
  valor: number; // Alias para total (compatibilidade com DTO)
  formaPagamento: 'avista' | 'boleto' | 'cartao' | 'pix' | 'recorrente';
  validadeDias: number;
  observacoes?: string;
  incluirImpostosPDF: boolean;
  status: 'rascunho' | 'enviada' | 'visualizada' | 'aprovada' | 'rejeitada' | 'expirada';
  dataVencimento?: string;
  criadaEm: string;
  atualizadaEm: string;
  createdAt: string; // Alias para criadaEm (compatibilidade com DTO)
  updatedAt: string; // Alias para atualizadaEm (compatibilidade com DTO)
  source?: string;
  vendedor?: string;
  portalAccess?: {
    accessedAt?: string;
    ip?: string;
    userAgent?: string;
  };
  emailDetails?: {
    sentAt?: string;
    emailCliente?: string;
    linkPortal?: string;
  };
}

@Injectable()
export class PropostasService {
  private readonly logger = new Logger(PropostasService.name);
  private contadorId = 1;

  constructor(
    @InjectRepository(PropostaEntity)
    private propostaRepository: Repository<PropostaEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    // Inicializar contador baseado nas propostas existentes
    this.inicializarContador();
  }

  private async inicializarContador() {
    try {
      const ultimaProposta = await this.propostaRepository.findOne({
        order: { criadaEm: 'DESC' },
      });

      if (ultimaProposta?.numero) {
        const numeroMatch = ultimaProposta.numero.match(/(\d+)$/);
        if (numeroMatch) {
          this.contadorId = parseInt(numeroMatch[1]) + 1;
        }
      }
    } catch (error) {
      this.logger.warn('⚠️ Erro ao inicializar contador de propostas:', error.message);
    }
  }

  /**
   * Converter entidade para interface de retorno
   */
  private entityToInterface(entity: PropostaEntity): Proposta {
    return {
      id: entity.id,
      numero: entity.numero,
      titulo: entity.titulo,
      cliente: entity.cliente,
      produtos: entity.produtos,
      subtotal: Number(entity.subtotal),
      descontoGlobal: Number(entity.descontoGlobal),
      impostos: Number(entity.impostos),
      total: Number(entity.total),
      valor: Number(entity.valor),
      formaPagamento: entity.formaPagamento as any,
      validadeDias: entity.validadeDias,
      observacoes: entity.observacoes,
      incluirImpostosPDF: entity.incluirImpostosPDF,
      status: entity.status as any,
      dataVencimento: entity.dataVencimento?.toISOString(),
      criadaEm: entity.criadaEm?.toISOString(),
      atualizadaEm: entity.atualizadaEm?.toISOString(),
      createdAt: entity.criadaEm?.toISOString(),
      updatedAt: entity.atualizadaEm?.toISOString(),
      source: entity.source,
      vendedor: entity.vendedor_id,
      portalAccess: entity.portalAccess
        ? {
            accessedAt: entity.portalAccess.accessedAt,
            ip: entity.portalAccess.ip,
            userAgent: entity.portalAccess.userAgent,
          }
        : undefined,
      emailDetails: entity.emailDetails
        ? {
            sentAt: entity.emailDetails.sentAt,
            emailCliente: entity.emailDetails.emailCliente,
            linkPortal: entity.emailDetails.linkPortal,
          }
        : undefined,
    };
  }

  private gerarId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    return `PROP-2025-${timestamp}-${random}`;
  }

  private gerarNumero(): string {
    return `PROP-2025-${this.contadorId.toString().padStart(3, '0')}`;
  }

  /**
   * Lista todas as propostas
   */
  async listarPropostas(): Promise<Proposta[]> {
    try {
      const entities = await this.propostaRepository.find({
        order: { criadaEm: 'DESC' },
        relations: ['vendedor'],
      });

      this.logger.log(`📊 ${entities.length} propostas encontradas no banco`);
      return entities.map((entity) => this.entityToInterface(entity));
    } catch (error) {
      this.logger.error('❌ Erro ao listar propostas:', error);
      return [];
    }
  }

  /**
   * Obtém uma proposta específica
   */
  async obterProposta(id: string): Promise<Proposta | null> {
    try {
      const entity = await this.propostaRepository.findOne({
        where: { id },
        relations: ['vendedor'],
      });

      return entity ? this.entityToInterface(entity) : null;
    } catch (error) {
      this.logger.error('❌ Erro ao obter proposta:', error);
      return null;
    }
  }

  /**
   * Cria uma nova proposta
   */
  async criarProposta(dadosProposta: Partial<Proposta>): Promise<Proposta> {
    try {
      const numero = this.gerarNumero();
      this.contadorId++;

      const novaProposta = this.propostaRepository.create({
        numero,
        titulo: dadosProposta.titulo || `Proposta ${numero}`,
        cliente: dadosProposta.cliente || {
          id: 'cliente-default',
          nome: 'Cliente Temporário',
          email: 'temp@exemplo.com',
        },
        produtos: dadosProposta.produtos || [],
        subtotal: dadosProposta.subtotal || 0,
        descontoGlobal: dadosProposta.descontoGlobal || 0,
        impostos: dadosProposta.impostos || 0,
        total: dadosProposta.total || 0,
        valor: dadosProposta.valor || dadosProposta.total || 0,
        formaPagamento: dadosProposta.formaPagamento || 'avista',
        validadeDias: dadosProposta.validadeDias || 30,
        observacoes: dadosProposta.observacoes,
        incluirImpostosPDF: dadosProposta.incluirImpostosPDF || false,
        status: dadosProposta.status || 'rascunho',
        dataVencimento: dadosProposta.dataVencimento
          ? new Date(dadosProposta.dataVencimento)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        source: dadosProposta.source || 'api',
        vendedor_id: dadosProposta.vendedor,
      });

      const propostaSalva = await this.propostaRepository.save(novaProposta);
      this.logger.log(`✅ Proposta criada no banco: ${propostaSalva.id} - ${propostaSalva.numero}`);

      return this.entityToInterface(propostaSalva);
    } catch (error) {
      this.logger.error('❌ Erro ao criar proposta:', error);
      throw error;
    }
  }

  /**
   * Remove uma proposta
   */
  async removerProposta(id: string): Promise<boolean> {
    try {
      const resultado = await this.propostaRepository.delete(id);
      return resultado.affected > 0;
    } catch (error) {
      this.logger.error('❌ Erro ao remover proposta:', error);
      return false;
    }
  }

  /**
   * Atualiza o status de uma proposta
   */
  async atualizarStatus(
    propostaId: string,
    status: string,
    source?: string,
    observacoes?: string,
  ): Promise<Proposta> {
    try {
      const proposta = await this.propostaRepository.findOne({
        where: { id: propostaId },
      });

      if (!proposta) {
        throw new Error(`Proposta com ID ${propostaId} não encontrada`);
      }

      proposta.status = status;
      if (source) proposta.source = source;
      if (observacoes) proposta.observacoes = observacoes;

      const propostaAtualizada = await this.propostaRepository.save(proposta);
      this.logger.log(`✅ Status da proposta ${propostaId} atualizado para: ${status}`);

      return this.entityToInterface(propostaAtualizada);
    } catch (error) {
      this.logger.error('❌ Erro ao atualizar status:', error);
      throw error;
    }
  }

  /**
   * Marca proposta como visualizada via portal
   */
  async marcarComoVisualizada(
    propostaId: string,
    ip?: string,
    userAgent?: string,
  ): Promise<Proposta> {
    try {
      const proposta = await this.propostaRepository.findOne({
        where: { id: propostaId },
      });

      if (!proposta) {
        throw new Error(`Proposta com ID ${propostaId} não encontrada`);
      }

      proposta.status = 'visualizada';
      proposta.portalAccess = {
        accessedAt: new Date().toISOString(),
        ip,
        userAgent,
      };

      const propostaAtualizada = await this.propostaRepository.save(proposta);
      this.logger.log(`👁️ Proposta ${propostaId} marcada como visualizada`);

      return this.entityToInterface(propostaAtualizada);
    } catch (error) {
      this.logger.error('❌ Erro ao marcar como visualizada:', error);
      throw error;
    }
  }

  /**
   * Registra envio de email
   */
  async registrarEnvioEmail(
    propostaId: string,
    emailCliente: string,
    linkPortal?: string,
  ): Promise<Proposta> {
    try {
      const proposta = await this.propostaRepository.findOne({
        where: { id: propostaId },
      });

      if (!proposta) {
        throw new Error(`Proposta com ID ${propostaId} não encontrada`);
      }

      proposta.status = 'enviada';
      proposta.emailDetails = {
        sentAt: new Date().toISOString(),
        emailCliente,
        linkPortal,
      };

      const propostaAtualizada = await this.propostaRepository.save(proposta);
      this.logger.log(`📧 Email registrado para proposta ${propostaId}`);

      return this.entityToInterface(propostaAtualizada);
    } catch (error) {
      this.logger.error('❌ Erro ao registrar envio de email:', error);
      throw error;
    }
  }
}
