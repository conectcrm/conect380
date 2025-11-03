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
   * Lista TODOS os contatos da empresa
   * Ordenados por: cliente.nome ASC, principal DESC, nome ASC
   */
  async listarTodos(empresaId: string): Promise<ResponseContatoDto[]> {
    const contatos = await this.contatoRepository.find({
      where: { ativo: true },
      relations: ['cliente'],
      order: { nome: 'ASC' },
    });

    const contatosDaEmpresa = contatos.filter(
      (contato) => contato.cliente?.empresa_id === empresaId,
    );

    const contatosNormalizados = await Promise.all(
      contatosDaEmpresa.map((contato) => this.garantirTelefoneNormalizado(contato)),
    );

    return contatosNormalizados.map(
      (contato) => new ResponseContatoDto(contato),
    );
  }

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

    const contatosNormalizados = await Promise.all(
      contatos.map((contato) => this.garantirTelefoneNormalizado(contato)),
    );

    return contatosNormalizados.map(
      (contato) => new ResponseContatoDto(contato),
    );
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

    const contatoNormalizado = await this.garantirTelefoneNormalizado(contato);

    return new ResponseContatoDto(contatoNormalizado);
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

    const telefoneNormalizado = this.normalizarTelefoneEntrada(createContatoDto.telefone);

    await this.validarTelefone(telefoneNormalizado, clienteId);

    // Se marcar como principal, remove flag de outros contatos
    if (createContatoDto.principal) {
      await this.removerPrincipalDeOutros(clienteId);
    }

    // Cria o contato
    const contato = this.contatoRepository.create({
      ...createContatoDto,
      telefone: telefoneNormalizado,
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

    let telefoneNormalizado: string | undefined;
    const { telefone, ...dadosRestantes } = updateContatoDto;

    if (telefone && telefone !== contato.telefone) {
      telefoneNormalizado = this.normalizarTelefoneEntrada(telefone);
      await this.validarTelefone(telefoneNormalizado, contato.clienteId, id);
      contato.telefone = telefoneNormalizado;
    }

    // Se marcar como principal, remove flag de outros contatos
    if (updateContatoDto.principal) {
      await this.removerPrincipalDeOutros(contato.clienteId, id);
    }

    // Atualiza
    Object.assign(contato, dadosRestantes);
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
    telefoneNormalizado: string,
    clienteId: string,
    contatoIdIgnorar?: string,
  ): Promise<void> {
    const telefoneDigitos = telefoneNormalizado.replace(/\D/g, '');

    const query = this.contatoRepository
      .createQueryBuilder('contato')
      .where('contato.clienteId = :clienteId', { clienteId })
      .andWhere('contato.ativo = TRUE')
      .andWhere(
        "regexp_replace(contato.telefone, '\\D', '', 'g') = :telefone",
        { telefone: telefoneDigitos },
      );

    if (contatoIdIgnorar) {
      query.andWhere('contato.id != :contatoIdIgnorar', {
        contatoIdIgnorar,
      });
    }

    const contatoExistente = await query.getOne();

    if (contatoExistente) {
      throw new BadRequestException(
        'Já existe um contato com este telefone para este cliente',
      );
    }
  }

  private async garantirTelefoneNormalizado(contato: Contato): Promise<Contato> {
    if (!contato?.telefone) {
      return contato;
    }

    const telefoneNormalizado = this.converterTelefoneParaE164(contato.telefone);

    if (telefoneNormalizado && telefoneNormalizado !== contato.telefone) {
      contato.telefone = telefoneNormalizado;
      await this.contatoRepository.update(contato.id, {
        telefone: telefoneNormalizado,
      });
    }

    return contato;
  }

  private normalizarTelefoneEntrada(telefone: string): string {
    const telefoneNormalizado = this.converterTelefoneParaE164(telefone);

    if (!telefoneNormalizado) {
      throw new BadRequestException(
        'Telefone em formato inválido. Utilize o padrão internacional (E.164).',
      );
    }

    return telefoneNormalizado;
  }

  private converterTelefoneParaE164(telefone: string | null | undefined): string | null {
    if (!telefone) {
      return null;
    }

    let valor = telefone.trim();

    if (!valor) {
      return null;
    }

    if (valor.startsWith('00')) {
      valor = `+${valor.slice(2)}`;
    }

    valor = valor.replace(/\s+/g, '').replace(/[()\-]/g, '');

    if (valor.startsWith('+')) {
      const digits = valor.slice(1).replace(/\D/g, '');
      if (!digits) {
        return null;
      }

      if (digits.length < 8) {
        return null;
      }

      const limited = digits.slice(0, 15);
      return `+${limited}`;
    }

    const digitsOnly = valor.replace(/\D/g, '');

    if (!digitsOnly) {
      return null;
    }

    if (digitsOnly.length > 15) {
      return `+${digitsOnly.slice(0, 15)}`;
    }

    if (digitsOnly.length > 11) {
      return `+${digitsOnly}`;
    }

    if (digitsOnly.length >= 8) {
      return `+55${digitsOnly}`;
    }

    return null;
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
