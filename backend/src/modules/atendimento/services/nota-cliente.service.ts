import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotaCliente } from '../entities/nota-cliente.entity';
import { CreateNotaClienteDto } from '../dto/create-nota-cliente.dto';
import { UpdateNotaClienteDto } from '../dto/update-nota-cliente.dto';

/**
 * Service para gerenciar notas dos clientes
 * 
 * Funcionalidades:
 * - CRUD completo de notas
 * - Buscar notas por cliente
 * - Buscar notas por telefone (fallback)
 * - Buscar notas por ticket
 * - Marcar/desmarcar como importante
 */
@Injectable()
export class NotaClienteService {
  private readonly logger = new Logger(NotaClienteService.name);

  constructor(
    @InjectRepository(NotaCliente)
    private readonly notaRepository: Repository<NotaCliente>,
  ) { }

  /**
   * Criar nova nota
   */
  async criar(
    dto: CreateNotaClienteDto,
    autorId: string,
    empresaId: string,
  ): Promise<NotaCliente> {
    this.logger.log(`📝 Criando nota para ${dto.clienteId || dto.contatoTelefone || dto.ticketId}`);

    // Validar que pelo menos um identificador foi fornecido
    if (!dto.clienteId && !dto.contatoTelefone && !dto.ticketId) {
      throw new Error('É necessário fornecer clienteId, contatoTelefone ou ticketId');
    }

    const nota = this.notaRepository.create({
      ...dto,
      autorId,
      empresaId: dto.empresaId || empresaId,
      importante: dto.importante ?? false,
    });

    const notaSalva = await this.notaRepository.save(nota);
    this.logger.log(`✅ Nota criada: ${notaSalva.id}`);

    // Retornar com relação autor preenchida
    return await this.buscarPorId(notaSalva.id);
  }

  /**
   * Buscar nota por ID
   */
  async buscarPorId(id: string): Promise<NotaCliente> {
    const nota = await this.notaRepository.findOne({
      where: { id },
      relations: ['autor'],
    });

    if (!nota) {
      throw new NotFoundException(`Nota ${id} não encontrada`);
    }

    return nota;
  }

  /**
   * Buscar todas as notas de um cliente
   * Ordena por: importantes primeiro, depois por data (mais recente primeiro)
   */
  async buscarPorCliente(
    clienteId: string,
    empresaId?: string,
  ): Promise<NotaCliente[]> {
    this.logger.log(`📋 Buscando notas do cliente ${clienteId}`);

    const where: any = { clienteId };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    const notas = await this.notaRepository.find({
      where,
      relations: ['autor'],
      order: {
        importante: 'DESC', // Importantes primeiro
        createdAt: 'DESC',  // Mais recentes primeiro
      },
    });

    this.logger.log(`✅ ${notas.length} notas encontradas`);
    return notas;
  }

  /**
   * Buscar notas por telefone do contato
   * Útil quando não há clienteId cadastrado
   */
  async buscarPorTelefone(
    contatoTelefone: string,
    empresaId?: string,
  ): Promise<NotaCliente[]> {
    this.logger.log(`📋 Buscando notas do telefone ${contatoTelefone}`);

    const where: any = { contatoTelefone };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    const notas = await this.notaRepository.find({
      where,
      relations: ['autor'],
      order: {
        importante: 'DESC',
        createdAt: 'DESC',
      },
    });

    this.logger.log(`✅ ${notas.length} notas encontradas`);
    return notas;
  }

  /**
   * Buscar notas de um ticket específico
   */
  async buscarPorTicket(
    ticketId: string,
    empresaId?: string,
  ): Promise<NotaCliente[]> {
    this.logger.log(`📋 Buscando notas do ticket ${ticketId}`);

    const where: any = { ticketId };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    const notas = await this.notaRepository.find({
      where,
      relations: ['autor'],
      order: {
        importante: 'DESC',
        createdAt: 'DESC',
      },
    });

    this.logger.log(`✅ ${notas.length} notas encontradas`);
    return notas;
  }

  /**
   * Atualizar nota
   */
  async atualizar(
    id: string,
    dto: UpdateNotaClienteDto,
  ): Promise<NotaCliente> {
    const nota = await this.buscarPorId(id);

    // Atualizar campos permitidos
    if (dto.conteudo !== undefined) {
      nota.conteudo = dto.conteudo;
    }

    if (dto.importante !== undefined) {
      nota.importante = dto.importante;
    }

    const notaAtualizada = await this.notaRepository.save(nota);
    this.logger.log(`✅ Nota ${id} atualizada`);

    return await this.buscarPorId(notaAtualizada.id);
  }

  /**
   * Marcar nota como importante
   */
  async marcarImportante(id: string): Promise<NotaCliente> {
    return await this.atualizar(id, { importante: true });
  }

  /**
   * Desmarcar nota como importante
   */
  async desmarcarImportante(id: string): Promise<NotaCliente> {
    return await this.atualizar(id, { importante: false });
  }

  /**
   * Deletar nota
   */
  async deletar(id: string): Promise<void> {
    const nota = await this.buscarPorId(id);
    await this.notaRepository.remove(nota);
    this.logger.log(`🗑️ Nota ${id} deletada`);
  }

  /**
   * Contar notas de um cliente
   */
  async contarPorCliente(clienteId: string, empresaId?: string): Promise<number> {
    const where: any = { clienteId };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    return await this.notaRepository.count({ where });
  }

  /**
   * Contar notas importantes de um cliente
   */
  async contarImportantesPorCliente(
    clienteId: string,
    empresaId?: string,
  ): Promise<number> {
    const where: any = { clienteId, importante: true };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    return await this.notaRepository.count({ where });
  }
}
