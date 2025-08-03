import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { CreateFornecedorDto, UpdateFornecedorDto } from '../dto/fornecedor.dto';
import { Fornecedor } from '../entities/fornecedor.entity';

@Injectable()
export class FornecedorService {
  constructor(
    @InjectRepository(Fornecedor)
    private fornecedorRepository: Repository<Fornecedor>,
  ) {}

  async create(createFornecedorDto: CreateFornecedorDto, empresaId: string): Promise<Fornecedor> {
    // Verificar se já existe fornecedor com este CNPJ/CPF na empresa
    const fornecedorExistente = await this.fornecedorRepository.findOne({
      where: {
        cnpjCpf: createFornecedorDto.cnpjCpf,
        empresaId: empresaId,
      },
    });

    if (fornecedorExistente) {
      throw new ConflictException('Já existe um fornecedor com este CNPJ/CPF cadastrado.');
    }

    const fornecedor = this.fornecedorRepository.create({
      ...createFornecedorDto,
      empresaId,
      ativo: createFornecedorDto.ativo ?? true,
    });

    return await this.fornecedorRepository.save(fornecedor);
  }

  async findAll(empresaId: string, filtros?: { busca?: string; ativo?: boolean }): Promise<Fornecedor[]> {
    const where: any = { empresaId };

    if (filtros?.ativo !== undefined) {
      where.ativo = filtros.ativo;
    }

    if (filtros?.busca) {
      const busca = `%${filtros.busca}%`;
      return await this.fornecedorRepository.find({
        where: [
          { ...where, nome: Like(busca) },
          { ...where, cnpjCpf: Like(busca) },
          { ...where, email: Like(busca) },
          { ...where, contato: Like(busca) },
          { ...where, cidade: Like(busca) },
        ],
        order: {
          nome: 'ASC',
        },
      });
    }

    return await this.fornecedorRepository.find({
      where,
      order: {
        nome: 'ASC',
      },
    });
  }

  async findAtivos(empresaId: string): Promise<Fornecedor[]> {
    return await this.fornecedorRepository.find({
      where: {
        empresaId,
        ativo: true,
      },
      order: {
        nome: 'ASC',
      },
    });
  }

  async findOne(id: string, empresaId: string): Promise<Fornecedor> {
    const fornecedor = await this.fornecedorRepository.findOne({
      where: {
        id,
        empresaId,
      },
    });

    if (!fornecedor) {
      throw new NotFoundException('Fornecedor não encontrado.');
    }

    return fornecedor;
  }

  async update(id: string, updateFornecedorDto: UpdateFornecedorDto, empresaId: string): Promise<Fornecedor> {
    const fornecedor = await this.findOne(id, empresaId);

    // Se estiver atualizando CNPJ/CPF, verificar se não existe outro com o mesmo
    if (updateFornecedorDto.cnpjCpf && updateFornecedorDto.cnpjCpf !== fornecedor.cnpjCpf) {
      const fornecedorExistente = await this.fornecedorRepository.findOne({
        where: {
          cnpjCpf: updateFornecedorDto.cnpjCpf,
          empresaId: empresaId,
        },
      });

      if (fornecedorExistente) {
        throw new ConflictException('Já existe um fornecedor com este CNPJ/CPF cadastrado.');
      }
    }

    Object.assign(fornecedor, updateFornecedorDto);
    return await this.fornecedorRepository.save(fornecedor);
  }

  async remove(id: string, empresaId: string): Promise<void> {
    const fornecedor = await this.findOne(id, empresaId);
    await this.fornecedorRepository.remove(fornecedor);
  }
}