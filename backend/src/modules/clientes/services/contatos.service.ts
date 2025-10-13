import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contato } from '../contato.entity';
import { Cliente } from '../cliente.entity';
import { CreateContatoDto, UpdateContatoDto, ResponseContatoDto } from '../dto/contato.dto';

/**
 * Service para gerenciar contatos vinculados a clientes
 */
@Injectable()
export class ContatosService {
  constructor(
    @InjectRepository(Contato)
    private contatoRepository: Repository<Contato>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) { }

  /**
   * Lista todos os contatos de um cliente
   * Ordenados por: principal DESC, nome ASC
   */
  async listarPorCliente(clienteId: string, empresaId?: string): Promise<ResponseContatoDto[]> {
    // Verifica se o cliente existe e pertence à empresa
    const cliente = await this.clienteRepository.findOne({
      where: { id: clienteId, ...(empresaId && { empresa_id: empresaId }) },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const contatos = await this.contatoRepository.find({
      where: { clienteId, ativo: true },
      order: { principal: 'DESC', nome: 'ASC' },
    });

    return contatos.map((contato) => new ResponseContatoDto(contato));
  }

  /**
   * Busca um contato por ID
   */
  async buscarPorId(id: string, clienteId?: string): Promise<ResponseContatoDto> {
    const where: any = { id };
    if (clienteId) {
      where.clienteId = clienteId;
    }

    const contato = await this.contatoRepository.findOne({ where });

    if (!contato) {
      throw new NotFoundException('Contato não encontrado');
    }

    return new ResponseContatoDto(contato);
  }

  /**
   * Cria um novo contato para um cliente
   */
  async criar(
    clienteId: string,
    createContatoDto: CreateContatoDto,
    empresaId?: string,
  ): Promise<ResponseContatoDto> {
    // Verifica se o cliente existe
    const cliente = await this.clienteRepository.findOne({
      where: { id: clienteId, ...(empresaId && { empresa_id: empresaId }) },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Validações
    await this.validarTelefone(createContatoDto.telefone, clienteId);

    // Se marcar como principal, remove flag de outros contatos
    if (createContatoDto.principal) {
      await this.removerPrincipalDeOutros(clienteId);
    }

    // Cria o contato
    const contato = this.contatoRepository.create({
      ...createContatoDto,
      clienteId,
    });

    const contatoSalvo = await this.contatoRepository.save(contato);

    return new ResponseContatoDto(contatoSalvo);
  }

  /**
   * Atualiza um contato existente
   */
  async atualizar(
    id: string,
    updateContatoDto: UpdateContatoDto,
    clienteId?: string,
  ): Promise<ResponseContatoDto> {
    const where: any = { id };
    if (clienteId) {
      where.clienteId = clienteId;
    }

    const contato = await this.contatoRepository.findOne({ where });

    if (!contato) {
      throw new NotFoundException('Contato não encontrado');
    }

    // Validações
    if (updateContatoDto.telefone && updateContatoDto.telefone !== contato.telefone) {
      await this.validarTelefone(updateContatoDto.telefone, contato.clienteId, id);
    }

    // Se marcar como principal, remove flag de outros contatos
    if (updateContatoDto.principal) {
      await this.removerPrincipalDeOutros(contato.clienteId, id);
    }

    // Atualiza
    Object.assign(contato, updateContatoDto);
    const contatoAtualizado = await this.contatoRepository.save(contato);

    return new ResponseContatoDto(contatoAtualizado);
  }

  /**
   * Remove (soft delete) um contato
   */
  async remover(id: string, clienteId?: string): Promise<void> {
    const where: any = { id };
    if (clienteId) {
      where.clienteId = clienteId;
    }

    const contato = await this.contatoRepository.findOne({ where });

    if (!contato) {
      throw new NotFoundException('Contato não encontrado');
    }

    // Soft delete
    await this.contatoRepository.update(id, { ativo: false });
  }

  /**
   * Define um contato como principal
   */
  async definirComoPrincipal(id: string, clienteId?: string): Promise<ResponseContatoDto> {
    const where: any = { id };
    if (clienteId) {
      where.clienteId = clienteId;
    }

    const contato = await this.contatoRepository.findOne({ where });

    if (!contato) {
      throw new NotFoundException('Contato não encontrado');
    }

    // Remove principal de outros contatos
    await this.removerPrincipalDeOutros(contato.clienteId, id);

    // Define como principal
    contato.principal = true;
    const contatoAtualizado = await this.contatoRepository.save(contato);

    return new ResponseContatoDto(contatoAtualizado);
  }

  // ========== Métodos Auxiliares ==========

  /**
   * Valida se o telefone já está cadastrado para outro contato do mesmo cliente
   */
  private async validarTelefone(
    telefone: string,
    clienteId: string,
    contatoIdIgnorar?: string,
  ): Promise<void> {
    const where: any = {
      telefone,
      clienteId,
      ativo: true,
    };

    if (contatoIdIgnorar) {
      where.id = Not(contatoIdIgnorar);
    }

    const contatoExistente = await this.contatoRepository.findOne({ where });

    if (contatoExistente) {
      throw new BadRequestException(
        'Já existe um contato com este telefone para este cliente',
      );
    }
  }

  /**
   * Remove a flag 'principal' de todos os outros contatos do cliente
   */
  private async removerPrincipalDeOutros(
    clienteId: string,
    contatoIdIgnorar?: string,
  ): Promise<void> {
    const where: any = {
      clienteId,
      principal: true,
    };

    if (contatoIdIgnorar) {
      where.id = Not(contatoIdIgnorar);
    }

    await this.contatoRepository.update(where, { principal: false });
  }
}

// Import necessário para o Not
import { Not } from 'typeorm';
