import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Demanda } from '../entities/demanda.entity';
import { CreateDemandaDto } from '../dto/create-demanda.dto';
import { UpdateDemandaDto } from '../dto/update-demanda.dto';

/**
 * Service para gerenciar demandas dos clientes
 *
 * Funcionalidades:
 * - CRUD completo de demandas
 * - Buscar demandas por cliente
 * - Buscar demandas por telefone (fallback)
 * - Buscar demandas por ticket
 * - Filtrar por status, prioridade, tipo
 * - Atualizar status (abrir, iniciar, concluir, cancelar)
 * - Atribuir responsável
 */
@Injectable()
export class DemandaService {
  private readonly logger = new Logger(DemandaService.name);

  constructor(
    @InjectRepository(Demanda)
    private readonly demandaRepository: Repository<Demanda>,
  ) {}

  /**
   * Criar nova demanda
   */
  async criar(dto: CreateDemandaDto, autorId: string, empresaId: string): Promise<Demanda> {
    this.logger.log(`📋 Criando demanda: ${dto.titulo}`);

    // Validar que pelo menos um identificador foi fornecido
    if (!dto.clienteId && !dto.contatoTelefone && !dto.ticketId) {
      throw new Error('É necessário fornecer clienteId, contatoTelefone ou ticketId');
    }

    const demanda = this.demandaRepository.create({
      ...dto,
      autorId,
      empresaId: dto.empresaId || empresaId,
      tipo: dto.tipo || 'outros',
      prioridade: dto.prioridade || 'media',
      status: dto.status || 'aberta',
    });

    const demandaSalva = await this.demandaRepository.save(demanda);
    this.logger.log(`✅ Demanda criada: ${demandaSalva.id}`);

    // Retornar com relações preenchidas
    return await this.buscarPorId(demandaSalva.id);
  }

  /**
   * Buscar demanda por ID
   */
  async buscarPorId(id: string): Promise<Demanda> {
    const demanda = await this.demandaRepository.findOne({
      where: { id },
      relations: ['autor', 'responsavel'],
    });

    if (!demanda) {
      throw new NotFoundException(`Demanda ${id} não encontrada`);
    }

    return demanda;
  }

  /**
   * Buscar todas as demandas de um cliente
   * Ordena por: urgente primeiro, depois por data de criação (mais recente)
   */
  async buscarPorCliente(clienteId: string, empresaId?: string): Promise<Demanda[]> {
    this.logger.log(`📋 Buscando demandas do cliente ${clienteId}`);

    const where: any = { clienteId };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    const demandas = await this.demandaRepository.find({
      where,
      relations: ['autor', 'responsavel'],
      order: {
        prioridade: 'DESC', // urgente > alta > media > baixa
        createdAt: 'DESC',
      },
    });

    this.logger.log(`✅ ${demandas.length} demandas encontradas`);
    return demandas;
  }

  /**
   * Buscar demandas por telefone do contato
   */
  async buscarPorTelefone(contatoTelefone: string, empresaId?: string): Promise<Demanda[]> {
    this.logger.log(`📋 Buscando demandas do telefone ${contatoTelefone}`);

    const where: any = { contatoTelefone };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    const demandas = await this.demandaRepository.find({
      where,
      relations: ['autor', 'responsavel'],
      order: {
        prioridade: 'DESC',
        createdAt: 'DESC',
      },
    });

    this.logger.log(`✅ ${demandas.length} demandas encontradas`);
    return demandas;
  }

  /**
   * Buscar demandas de um ticket específico
   */
  async buscarPorTicket(ticketId: string, empresaId?: string): Promise<Demanda[]> {
    this.logger.log(`📋 Buscando demandas do ticket ${ticketId}`);

    const where: any = { ticketId };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    const demandas = await this.demandaRepository.find({
      where,
      relations: ['autor', 'responsavel'],
      order: {
        prioridade: 'DESC',
        createdAt: 'DESC',
      },
    });

    this.logger.log(`✅ ${demandas.length} demandas encontradas`);
    return demandas;
  }

  /**
   * Buscar demandas por status
   */
  async buscarPorStatus(status: Demanda['status'], empresaId?: string): Promise<Demanda[]> {
    const where: any = { status };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    return await this.demandaRepository.find({
      where,
      relations: ['autor', 'responsavel'],
      order: {
        prioridade: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Atualizar demanda
   */
  async atualizar(id: string, dto: UpdateDemandaDto): Promise<Demanda> {
    const demanda = await this.buscarPorId(id);

    // Atualizar campos permitidos
    if (dto.titulo !== undefined) demanda.titulo = dto.titulo;
    if (dto.descricao !== undefined) demanda.descricao = dto.descricao;
    if (dto.tipo !== undefined) demanda.tipo = dto.tipo;
    if (dto.prioridade !== undefined) demanda.prioridade = dto.prioridade;
    if (dto.status !== undefined) demanda.status = dto.status;
    if (dto.dataVencimento !== undefined) demanda.dataVencimento = new Date(dto.dataVencimento);
    if (dto.responsavelId !== undefined) demanda.responsavelId = dto.responsavelId;

    // Se status mudou para 'concluida', registrar data de conclusão
    if (dto.status === 'concluida' && demanda.status !== 'concluida') {
      demanda.dataConclusao = new Date();
    }

    const demandaAtualizada = await this.demandaRepository.save(demanda);
    this.logger.log(`✅ Demanda ${id} atualizada`);

    return await this.buscarPorId(demandaAtualizada.id);
  }

  /**
   * Atribuir responsável
   */
  async atribuirResponsavel(id: string, responsavelId: string): Promise<Demanda> {
    return await this.atualizar(id, { responsavelId });
  }

  /**
   * Alterar status
   */
  async alterarStatus(id: string, status: Demanda['status']): Promise<Demanda> {
    return await this.atualizar(id, { status });
  }

  /**
   * Iniciar demanda (status → em_andamento)
   */
  async iniciar(id: string): Promise<Demanda> {
    return await this.alterarStatus(id, 'em_andamento');
  }

  /**
   * Concluir demanda (status → concluida + registrar data)
   */
  async concluir(id: string): Promise<Demanda> {
    return await this.alterarStatus(id, 'concluida');
  }

  /**
   * Cancelar demanda
   */
  async cancelar(id: string): Promise<Demanda> {
    return await this.alterarStatus(id, 'cancelada');
  }

  /**
   * Deletar demanda
   */
  async deletar(id: string): Promise<void> {
    const demanda = await this.buscarPorId(id);
    await this.demandaRepository.remove(demanda);
    this.logger.log(`🗑️ Demanda ${id} deletada`);
  }

  /**
   * Contar demandas de um cliente
   */
  async contarPorCliente(clienteId: string, empresaId?: string): Promise<number> {
    const where: any = { clienteId };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    return await this.demandaRepository.count({ where });
  }

  /**
   * Contar demandas abertas de um cliente
   */
  async contarAbertasPorCliente(clienteId: string, empresaId?: string): Promise<number> {
    const where: any = { clienteId, status: 'aberta' };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    return await this.demandaRepository.count({ where });
  }

  /**
   * Contar demandas urgentes de um cliente
   */
  async contarUrgentesPorCliente(clienteId: string, empresaId?: string): Promise<number> {
    const where: any = { clienteId, prioridade: 'urgente' };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    return await this.demandaRepository.count({ where });
  }
}
