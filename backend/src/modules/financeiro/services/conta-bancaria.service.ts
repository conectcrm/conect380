import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { ContaPagar } from '../entities/conta-pagar.entity';
import { ContaBancaria } from '../entities/conta-bancaria.entity';
import {
  CreateContaBancariaDto,
  QueryContasBancariasDto,
  UpdateContaBancariaDto,
} from '../dto/conta-bancaria.dto';

@Injectable()
export class ContaBancariaService {
  constructor(
    @InjectRepository(ContaBancaria)
    private readonly contaBancariaRepository: Repository<ContaBancaria>,
    @InjectRepository(ContaPagar)
    private readonly contaPagarRepository: Repository<ContaPagar>,
  ) {}

  async create(dto: CreateContaBancariaDto, empresaId: string): Promise<ContaBancaria> {
    await this.validarDuplicidade({
      empresaId,
      banco: dto.banco,
      agencia: dto.agencia,
      conta: dto.conta,
    });

    const contaBancaria = this.contaBancariaRepository.create({
      ...dto,
      empresaId,
      saldo: Number(dto.saldo ?? 0),
      ativo: dto.ativo ?? true,
      criadoPor: 'sistema',
    });

    return this.contaBancariaRepository.save(contaBancaria);
  }

  async findAll(
    empresaId: string,
    filtros: QueryContasBancariasDto = {},
  ): Promise<ContaBancaria[]> {
    const where: any = { empresaId };

    if (filtros.ativo !== undefined) {
      where.ativo = filtros.ativo;
    }

    if (filtros.busca?.trim()) {
      const busca = `%${filtros.busca.trim()}%`;
      return this.contaBancariaRepository.find({
        where: [
          { ...where, nome: Like(busca) },
          { ...where, banco: Like(busca) },
          { ...where, conta: Like(busca) },
          { ...where, agencia: Like(busca) },
          { ...where, chavePix: Like(busca) },
        ],
        order: {
          ativo: 'DESC',
          nome: 'ASC',
        },
      });
    }

    return this.contaBancariaRepository.find({
      where,
      order: {
        ativo: 'DESC',
        nome: 'ASC',
      },
    });
  }

  async findAtivas(empresaId: string): Promise<ContaBancaria[]> {
    return this.findAll(empresaId, { ativo: true });
  }

  async findOne(id: string, empresaId: string): Promise<ContaBancaria> {
    const contaBancaria = await this.contaBancariaRepository.findOne({
      where: { id, empresaId },
    });

    if (!contaBancaria) {
      throw new NotFoundException('Conta bancaria nao encontrada');
    }

    return contaBancaria;
  }

  async update(
    id: string,
    dto: UpdateContaBancariaDto,
    empresaId: string,
  ): Promise<ContaBancaria> {
    const contaBancaria = await this.findOne(id, empresaId);

    const banco = dto.banco ?? contaBancaria.banco;
    const agencia = dto.agencia ?? contaBancaria.agencia;
    const conta = dto.conta ?? contaBancaria.conta;

    await this.validarDuplicidade({ empresaId, banco, agencia, conta, ignoreId: id });

    Object.assign(contaBancaria, {
      ...dto,
      ...(dto.saldo !== undefined ? { saldo: Number(dto.saldo) } : {}),
      atualizadoPor: 'sistema',
    });

    return this.contaBancariaRepository.save(contaBancaria);
  }

  async remove(id: string, empresaId: string): Promise<void> {
    const contaBancaria = await this.findOne(id, empresaId);

    const contasVinculadas = await this.contaPagarRepository
      .createQueryBuilder('conta')
      .where('conta.empresaId = :empresaId', { empresaId })
      .andWhere('conta.contaBancariaId = :contaBancariaId', { contaBancariaId: id })
      .getCount();

    if (contasVinculadas > 0) {
      throw new BadRequestException(
        'Nao e possivel excluir conta bancaria com contas a pagar vinculadas. Desative a conta.',
      );
    }

    await this.contaBancariaRepository.remove(contaBancaria);
  }

  async desativar(id: string, empresaId: string): Promise<ContaBancaria> {
    const contaBancaria = await this.findOne(id, empresaId);
    contaBancaria.ativo = false;
    contaBancaria.atualizadoPor = 'sistema';
    return this.contaBancariaRepository.save(contaBancaria);
  }

  private async validarDuplicidade(params: {
    empresaId: string;
    banco: string;
    agencia: string;
    conta: string;
    ignoreId?: string;
  }): Promise<void> {
    const existente = await this.contaBancariaRepository.findOne({
      where: {
        empresaId: params.empresaId,
        banco: params.banco,
        agencia: params.agencia,
        conta: params.conta,
      },
    });

    if (existente && existente.id !== params.ignoreId) {
      throw new ConflictException(
        'Ja existe uma conta bancaria com banco/agencia/conta informados para a empresa',
      );
    }
  }
}
