import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoServico } from '../entities/tipo-servico.entity';
import { CreateTipoServicoDto } from '../dto/create-tipo-servico.dto';
import { UpdateTipoServicoDto } from '../dto/update-tipo-servico.dto';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class TiposServicoService {
  private readonly logger = new Logger(TiposServicoService.name);

  constructor(
    @InjectRepository(TipoServico)
    private readonly tipoRepository: Repository<TipoServico>,
    @Inject(REQUEST) private readonly request: any,
  ) {}

  private getEmpresaId(): string {
    const empresaId = this.request.user?.empresa_id;
    if (!empresaId) {
      throw new BadRequestException('Empresa ID não encontrado no contexto da requisição');
    }
    return empresaId;
  }

  async listarTodos(): Promise<TipoServico[]> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`📋 Listando todos os tipos de serviço da empresa ${empresaId}`);

    return await this.tipoRepository.find({
      where: { empresaId },
      order: { ordem: 'ASC' },
    });
  }

  async listarAtivos(): Promise<TipoServico[]> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`📋 Listando tipos de serviço ativos da empresa ${empresaId}`);

    return await this.tipoRepository.find({
      where: { empresaId, ativo: true },
      order: { ordem: 'ASC' },
    });
  }

  async buscarPorId(id: string): Promise<TipoServico> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`🔍 Buscando tipo de serviço ${id} da empresa ${empresaId}`);

    const tipo = await this.tipoRepository.findOne({
      where: { id, empresaId },
    });

    if (!tipo) {
      throw new NotFoundException(`Tipo de serviço com ID ${id} não encontrado`);
    }

    return tipo;
  }

  async criar(dto: CreateTipoServicoDto): Promise<TipoServico> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`➕ Criando novo tipo de serviço: ${dto.nome} para empresa ${empresaId}`);

    // Validar se nome já existe para essa empresa
    const nomeExistente = await this.tipoRepository.findOne({
      where: { nome: dto.nome, empresaId },
    });

    if (nomeExistente) {
      throw new BadRequestException(
        `Já existe um tipo de serviço com o nome ${dto.nome} nesta empresa`,
      );
    }

    const tipo = this.tipoRepository.create({
      ...dto,
      empresaId,
    });

    const salvo = await this.tipoRepository.save(tipo);
    this.logger.log(`✅ Tipo de serviço criado com sucesso: ${salvo.id}`);

    return salvo;
  }

  async atualizar(id: string, dto: UpdateTipoServicoDto): Promise<TipoServico> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`📝 Atualizando tipo de serviço ${id} da empresa ${empresaId}`);

    const tipo = await this.buscarPorId(id);

    // Se estiver mudando o nome, validar duplicação
    if (dto.nome && dto.nome !== tipo.nome) {
      const nomeExistente = await this.tipoRepository.findOne({
        where: { nome: dto.nome, empresaId },
      });

      if (nomeExistente) {
        throw new BadRequestException(
          `Já existe um tipo de serviço com o nome ${dto.nome} nesta empresa`,
        );
      }
    }

    Object.assign(tipo, dto);
    const atualizado = await this.tipoRepository.save(tipo);

    this.logger.log(`✅ Tipo de serviço atualizado com sucesso: ${atualizado.id}`);
    return atualizado;
  }

  async deletar(id: string): Promise<void> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`🗑️ Deletando tipo de serviço ${id} da empresa ${empresaId}`);

    const tipo = await this.buscarPorId(id);
    await this.tipoRepository.remove(tipo);

    this.logger.log(`✅ Tipo de serviço deletado com sucesso: ${id}`);
  }

  async inativar(id: string): Promise<TipoServico> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`❌ Inativando tipo de serviço ${id} da empresa ${empresaId}`);

    const tipo = await this.buscarPorId(id);
    tipo.ativo = false;

    const atualizado = await this.tipoRepository.save(tipo);
    this.logger.log(`✅ Tipo de serviço inativado com sucesso: ${id}`);

    return atualizado;
  }

  async ativar(id: string): Promise<TipoServico> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`✅ Ativando tipo de serviço ${id} da empresa ${empresaId}`);

    const tipo = await this.buscarPorId(id);
    tipo.ativo = true;

    const atualizado = await this.tipoRepository.save(tipo);
    this.logger.log(`✅ Tipo de serviço ativado com sucesso: ${id}`);

    return atualizado;
  }
}
