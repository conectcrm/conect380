import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Proposta as PropostaEntity } from './proposta.entity';
import { User } from '../users/user.entity';
import { Cliente } from '../clientes/cliente.entity';

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
  vendedor?:
    | {
        id: string;
        nome: string;
        email: string;
        tipo: string;
        ativo: boolean;
      }
    | string;
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
  private contadorId = 1;

  constructor(
    @InjectRepository(PropostaEntity)
    private propostaRepository: Repository<PropostaEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {
    // Inicializar contador baseado nas propostas existentes
    this.inicializarContador();
  }

  private async inicializarContador() {
    try {
      // Importante: não usar findOne() aqui.
      // Em ambientes com schema legado, o entity atual pode conter colunas ainda não existentes
      // (ex.: cliente/produtos em JSONB). Então buscamos apenas o campo `numero`.
      const ultima = await this.propostaRepository
        .createQueryBuilder('p')
        .select('p.numero', 'numero')
        .orderBy('p.numero', 'DESC')
        .limit(1)
        .getRawOne<{ numero?: string }>();

      if (ultima?.numero) {
        const numeroMatch = ultima.numero.match(/(\d+)$/);
        if (numeroMatch) {
          this.contadorId = parseInt(numeroMatch[1]) + 1;
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao inicializar contador de propostas:', error.message);
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
      vendedor: entity.vendedor
        ? {
            id: entity.vendedor.id,
            nome: entity.vendedor.nome,
            email: entity.vendedor.email,
            tipo:
              entity.vendedor.role === 'admin'
                ? 'admin'
                : entity.vendedor.role === 'manager'
                  ? 'gerente'
                  : 'vendedor',
            ativo: entity.vendedor.ativo,
          }
        : entity.vendedor_id,
      portalAccess: entity.portalAccess || undefined,
      emailDetails: entity.emailDetails || undefined,
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
  async listarPropostas(empresaId?: string): Promise<Proposta[]> {
    try {
      const entities = await this.propostaRepository.find({
        where: empresaId ? { empresaId } : undefined,
        order: { criadaEm: 'DESC' },
        relations: ['vendedor'],
      });

      console.log(`📊 ${entities.length} propostas encontradas no banco`);
      return entities.map((entity) => this.entityToInterface(entity));
    } catch (error) {
      console.error('❌ Erro ao listar propostas:', error);
      return [];
    }
  }

  /**
   * Obtém uma proposta específica
   */
  async obterProposta(id: string, empresaId?: string): Promise<Proposta | null> {
    try {
      const entity = await this.propostaRepository.findOne({
        where: empresaId ? { id, empresaId } : { id },
        relations: ['vendedor'],
      });

      return entity ? this.entityToInterface(entity) : null;
    } catch (error) {
      console.error('❌ Erro ao obter proposta:', error);
      return null;
    }
  }

  /**
   * Cria uma nova proposta
   */
  async criarProposta(dadosProposta: Partial<Proposta>, empresaId?: string): Promise<Proposta> {
    try {
      const numero = this.gerarNumero();
      this.contadorId++;
      const empresaIdProposta =
        empresaId ?? (dadosProposta as any).empresaId ?? (dadosProposta as any).empresa_id;

      // Buscar vendedor pelo nome para obter o UUID
      let vendedorId = null;
      if (dadosProposta.vendedor) {
        // Se vendedor for um objeto, usar o ID direto
        if (typeof dadosProposta.vendedor === 'object' && dadosProposta.vendedor.id) {
          vendedorId = dadosProposta.vendedor.id;
          console.log(
            `👤 Vendedor recebido como objeto: ${dadosProposta.vendedor.nome} -> ${vendedorId}`,
          );
        } else {
          // Se vendedor for uma string, buscar pelo nome
          const nomeVendedor =
            typeof dadosProposta.vendedor === 'string'
              ? dadosProposta.vendedor
              : dadosProposta.vendedor.nome;

          const vendedor = await this.userRepository.findOne({
            where: empresaIdProposta
              ? { nome: nomeVendedor, empresa_id: empresaIdProposta }
              : { nome: nomeVendedor },
          });

          if (vendedor) {
            vendedorId = vendedor.id;
            console.log(`👤 Vendedor encontrado por nome: ${nomeVendedor} -> ${vendedorId}`);
          } else {
            console.warn(`⚠️ Vendedor não encontrado: ${nomeVendedor}`);
          }
        }
      }

      // Processar cliente baseado no tipo de dados recebido
      let clienteProcessado;
      if (typeof dadosProposta.cliente === 'string') {
        // 🔍 BUSCAR CLIENTE REAL NO BANCO ao invés de gerar email fictício
        const nomeCliente = dadosProposta.cliente as string;
        console.log(`🔍 Buscando cliente real: "${nomeCliente}"`);

        try {
          // Buscar cliente real pelo nome (busca flexível)
          const clienteReal = await this.clienteRepository.findOne({
            where: empresaIdProposta
              ? [
                  { nome: Like(`%${nomeCliente}%`), empresaId: empresaIdProposta },
                  { nome: nomeCliente, empresaId: empresaIdProposta },
                ]
              : [{ nome: Like(`%${nomeCliente}%`) }, { nome: nomeCliente }],
          });

          if (clienteReal) {
            console.log(`✅ Cliente real encontrado: ${clienteReal.nome} - ${clienteReal.email}`);
            clienteProcessado = {
              id: clienteReal.id,
              nome: clienteReal.nome,
              email: clienteReal.email, // ✅ USAR EMAIL REAL
              telefone: clienteReal.telefone, // ✅ USAR TELEFONE REAL
              documento: clienteReal.documento || '',
              status: clienteReal.status || 'lead',
            };
          } else {
            console.warn(`⚠️ Cliente "${nomeCliente}" não encontrado no cadastro`);
            // ✅ NÃO gerar email fictício - deixar vazio para busca posterior
            clienteProcessado = {
              id: 'cliente-temp',
              nome: nomeCliente,
              email: '', // ← DEIXAR VAZIO ao invés de gerar fictício
              telefone: '',
              documento: '',
              status: 'lead',
            };
          }
        } catch (error) {
          console.error('❌ Erro ao buscar cliente no banco:', error);
          // Fallback sem email fictício
          clienteProcessado = {
            id: 'cliente-temp',
            nome: nomeCliente,
            email: '', // ← NÃO gerar email fictício
            telefone: '',
            documento: '',
            status: 'lead',
          };
        }
      } else if (dadosProposta.cliente && typeof dadosProposta.cliente === 'object') {
        // Se é objeto, usar como está
        clienteProcessado = dadosProposta.cliente;
      } else {
        // Fallback para cliente padrão SEM EMAIL FICTÍCIO
        clienteProcessado = {
          id: 'cliente-default',
          nome: 'Cliente Temporário',
          email: '', // ✅ NÃO gerar email fictício
          telefone: '',
          documento: '',
          status: 'lead',
        };
      }

      const novaProposta = this.propostaRepository.create({
        empresaId: empresaIdProposta,
        numero,
        titulo: dadosProposta.titulo || `Proposta ${numero}`,
        cliente: clienteProcessado,
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
        vendedor_id: vendedorId,
      });

      const propostaSalva = await this.propostaRepository.save(novaProposta);
      console.log(`✅ Proposta criada no banco: ${propostaSalva.id} - ${propostaSalva.numero}`);

      return this.entityToInterface(propostaSalva);
    } catch (error) {
      console.error('❌ Erro ao criar proposta:', error);
      throw error;
    }
  }

  /**
   * Remove uma proposta
   */
  async removerProposta(id: string, empresaId?: string): Promise<boolean> {
    try {
      const resultado = await this.propostaRepository.delete(
        empresaId ? { id, empresaId } : { id },
      );
      return resultado.affected > 0;
    } catch (error) {
      console.error('❌ Erro ao remover proposta:', error);
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
    empresaId?: string,
  ): Promise<Proposta> {
    try {
      console.log(
        `🔧 DEBUG: atualizarStatus chamado com propostaId: "${propostaId}" (tipo: ${typeof propostaId})`,
      );
      console.log(`🔧 DEBUG: Tentando buscar proposta por ID: ${propostaId}`);

      const proposta = await this.propostaRepository.findOne({
        where: empresaId ? { id: propostaId, empresaId } : { id: propostaId },
      });

      if (!proposta) {
        throw new Error(`Proposta com ID ${propostaId} não encontrada`);
      }

      proposta.status = status;
      if (source) proposta.source = source;
      if (observacoes) proposta.observacoes = observacoes;

      const propostaAtualizada = await this.propostaRepository.save(proposta);
      console.log(`✅ Status da proposta ${propostaId} atualizado para: ${status}`);

      return this.entityToInterface(propostaAtualizada);
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      throw error;
    }
  }

  /**
   * Atualiza o status de uma proposta com validação automática
   */
  async atualizarStatusComValidacao(
    propostaId: string,
    status: string,
    source?: string,
    observacoes?: string,
    empresaId?: string,
  ): Promise<Proposta> {
    try {
      const proposta = await this.propostaRepository.findOne({
        where: empresaId ? { id: propostaId, empresaId } : { id: propostaId },
      });

      if (!proposta) {
        throw new Error(`Proposta com ID ${propostaId} não encontrada`);
      }

      // Validações específicas para transições automáticas
      if (status === 'aprovada' || status === 'rejeitada') {
        if (proposta.status !== 'visualizada' && proposta.status !== 'enviada') {
          console.warn(
            `⚠️ Transição automática de '${proposta.status}' para '${status}' pode não ser válida`,
          );
        }
      }

      proposta.status = status;
      if (source) proposta.source = source;
      if (observacoes) proposta.observacoes = observacoes;

      const propostaAtualizada = await this.propostaRepository.save(proposta);
      console.log(`✅ Status da proposta ${propostaId} atualizado com validação para: ${status}`);

      return this.entityToInterface(propostaAtualizada);
    } catch (error) {
      console.error('❌ Erro ao atualizar status com validação:', error);
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
    empresaId?: string,
  ): Promise<Proposta> {
    try {
      const proposta = await this.propostaRepository.findOne({
        where: empresaId ? { id: propostaId, empresaId } : { id: propostaId },
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
      console.log(`👁️ Proposta ${propostaId} marcada como visualizada`);

      return this.entityToInterface(propostaAtualizada);
    } catch (error) {
      console.error('❌ Erro ao marcar como visualizada:', error);
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
    empresaId?: string,
  ): Promise<Proposta> {
    try {
      const proposta = await this.propostaRepository.findOne({
        where: empresaId ? { id: propostaId, empresaId } : { id: propostaId },
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
      console.log(`📧 Email registrado para proposta ${propostaId}`);

      return this.entityToInterface(propostaAtualizada);
    } catch (error) {
      console.error('❌ Erro ao registrar envio de email:', error);
      throw error;
    }
  }

  /**
   * Marca proposta como enviada (usado pela sincronização automática)
   */
  async marcarComoEnviada(
    propostaIdOuNumero: string,
    emailCliente: string,
    linkPortal?: string,
    empresaId?: string,
  ): Promise<Proposta> {
    try {
      console.log(`🔄 Marcando proposta ${propostaIdOuNumero} como enviada automaticamente`);

      // Tentar encontrar por ID (UUID) primeiro, depois por número
      let proposta = await this.propostaRepository
        .findOne({
          where: empresaId
            ? { id: propostaIdOuNumero, empresaId }
            : { id: propostaIdOuNumero },
        })
        .catch(() => null); // Capturar erro de UUID inválido

      // Se não encontrou por ID, tentar por número
      if (!proposta) {
        proposta = await this.propostaRepository.findOne({
          where: empresaId
            ? { numero: propostaIdOuNumero, empresaId }
            : { numero: propostaIdOuNumero },
        });
      }

      if (!proposta) {
        throw new Error(`Proposta com ID/Número ${propostaIdOuNumero} não encontrada`);
      }

      // Atualizar status para enviada
      proposta.status = 'enviada';
      proposta.emailDetails = {
        sentAt: new Date().toISOString(),
        emailCliente,
        linkPortal,
      };

      const propostaAtualizada = await this.propostaRepository.save(proposta);
      console.log(`✅ Proposta ${proposta.numero} marcada como enviada automaticamente`);

      return this.entityToInterface(propostaAtualizada);
    } catch (error) {
      console.error('❌ Erro ao marcar proposta como enviada:', error);
      throw error;
    }
  }
}
