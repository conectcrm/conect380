import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotaCliente } from '../entities/nota-cliente.entity';
import { CreateNotaClienteDto } from '../dto/create-nota-cliente.dto';
import { UpdateNotaClienteDto } from '../dto/update-nota-cliente.dto';

@Injectable()
export class NotaClienteService {
  private readonly logger = new Logger(NotaClienteService.name);

  constructor(
    @InjectRepository(NotaCliente)
    private readonly notaRepository: Repository<NotaCliente>,
  ) {}

  async criar(dto: CreateNotaClienteDto, autorId: string, empresaId: string): Promise<NotaCliente> {
    this.logger.log(`Criando nota para ${dto.clienteId || dto.contatoTelefone || dto.ticketId}`);

    if (!dto.clienteId && !dto.contatoTelefone && !dto.ticketId) {
      throw new Error('E necessario fornecer clienteId, contatoTelefone ou ticketId');
    }

    const nota = this.notaRepository.create({
      ...dto,
      autorId,
      empresaId,
      importante: dto.importante ?? false,
    });

    const notaSalva = await this.notaRepository.save(nota);
    this.logger.log(`Nota criada: ${notaSalva.id}`);

    return await this.buscarPorId(notaSalva.id, empresaId);
  }

  async buscarPorId(id: string, empresaId: string): Promise<NotaCliente> {
    const nota = await this.notaRepository.findOne({
      where: { id, empresaId },
      relations: ['autor'],
    });

    if (!nota) {
      throw new NotFoundException(`Nota ${id} nao encontrada`);
    }

    return nota;
  }

  async buscarPorCliente(clienteId: string, empresaId: string): Promise<NotaCliente[]> {
    this.logger.log(`Buscando notas do cliente ${clienteId}`);

    const notas = await this.notaRepository.find({
      where: { clienteId, empresaId },
      relations: ['autor'],
      order: {
        importante: 'DESC',
        createdAt: 'DESC',
      },
    });

    this.logger.log(`${notas.length} notas encontradas`);
    return notas;
  }

  async buscarPorTelefone(contatoTelefone: string, empresaId: string): Promise<NotaCliente[]> {
    this.logger.log(`Buscando notas do telefone ${contatoTelefone}`);

    const notas = await this.notaRepository.find({
      where: { contatoTelefone, empresaId },
      relations: ['autor'],
      order: {
        importante: 'DESC',
        createdAt: 'DESC',
      },
    });

    this.logger.log(`${notas.length} notas encontradas`);
    return notas;
  }

  async buscarPorTicket(ticketId: string, empresaId: string): Promise<NotaCliente[]> {
    this.logger.log(`Buscando notas do ticket ${ticketId}`);

    const notas = await this.notaRepository.find({
      where: { ticketId, empresaId },
      relations: ['autor'],
      order: {
        importante: 'DESC',
        createdAt: 'DESC',
      },
    });

    this.logger.log(`${notas.length} notas encontradas`);
    return notas;
  }

  async atualizar(id: string, dto: UpdateNotaClienteDto, empresaId: string): Promise<NotaCliente> {
    const nota = await this.buscarPorId(id, empresaId);

    if (dto.conteudo !== undefined) {
      nota.conteudo = dto.conteudo;
    }

    if (dto.importante !== undefined) {
      nota.importante = dto.importante;
    }

    const notaAtualizada = await this.notaRepository.save(nota);
    this.logger.log(`Nota ${id} atualizada`);

    return await this.buscarPorId(notaAtualizada.id, empresaId);
  }

  async marcarImportante(id: string, empresaId: string): Promise<NotaCliente> {
    return await this.atualizar(id, { importante: true }, empresaId);
  }

  async desmarcarImportante(id: string, empresaId: string): Promise<NotaCliente> {
    return await this.atualizar(id, { importante: false }, empresaId);
  }

  async deletar(id: string, empresaId: string): Promise<void> {
    const nota = await this.buscarPorId(id, empresaId);
    await this.notaRepository.remove(nota);
    this.logger.log(`Nota ${id} deletada`);
  }

  async contarPorCliente(clienteId: string, empresaId: string): Promise<number> {
    return await this.notaRepository.count({ where: { clienteId, empresaId } });
  }

  async contarImportantesPorCliente(clienteId: string, empresaId: string): Promise<number> {
    return await this.notaRepository.count({
      where: { clienteId, importante: true, empresaId },
    });
  }
}
