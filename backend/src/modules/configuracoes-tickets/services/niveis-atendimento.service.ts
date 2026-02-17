import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NivelAtendimento } from '../entities/nivel-atendimento.entity';
import { CreateNivelAtendimentoDto } from '../dto/create-nivel-atendimento.dto';
import { UpdateNivelAtendimentoDto } from '../dto/update-nivel-atendimento.dto';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class NiveisAtendimentoService {
  private readonly logger = new Logger(NiveisAtendimentoService.name);

  constructor(
    @InjectRepository(NivelAtendimento)
    private readonly nivelRepository: Repository<NivelAtendimento>,
    @Inject(REQUEST) private readonly request: any,
  ) {}

  private getEmpresaId(): string {
    const empresaId = this.request.user?.empresa_id;
    if (!empresaId) {
      throw new BadRequestException('Empresa ID não encontrado no contexto da requisição');
    }
    return empresaId;
  }

  async listarTodos(): Promise<NivelAtendimento[]> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`📋 Listando todos os níveis de atendimento da empresa ${empresaId}`);

    return await this.nivelRepository.find({
      where: { empresaId },
      order: { ordem: 'ASC' },
    });
  }

  async listarAtivos(): Promise<NivelAtendimento[]> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`📋 Listando níveis de atendimento ativos da empresa ${empresaId}`);

    return await this.nivelRepository.find({
      where: { empresaId, ativo: true },
      order: { ordem: 'ASC' },
    });
  }

  async buscarPorId(id: string): Promise<NivelAtendimento> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`🔍 Buscando nível de atendimento ${id} da empresa ${empresaId}`);

    const nivel = await this.nivelRepository.findOne({
      where: { id, empresaId },
    });

    if (!nivel) {
      throw new NotFoundException(`Nível de atendimento com ID ${id} não encontrado`);
    }

    return nivel;
  }

  async buscarPorCodigo(codigo: string): Promise<NivelAtendimento> {
    const empresaId = this.getEmpresaId();
    this.logger.log(
      `🔍 Buscando nível de atendimento por código ${codigo} da empresa ${empresaId}`,
    );

    const nivel = await this.nivelRepository.findOne({
      where: { codigo, empresaId },
    });

    if (!nivel) {
      throw new NotFoundException(`Nível de atendimento com código ${codigo} não encontrado`);
    }

    return nivel;
  }

  async criar(dto: CreateNivelAtendimentoDto): Promise<NivelAtendimento> {
    const empresaId = this.getEmpresaId();
    this.logger.log(
      `➕ Criando novo nível de atendimento: ${dto.nome} (${dto.codigo}) para empresa ${empresaId}`,
    );

    // Validar se código já existe para essa empresa
    const codigoExistente = await this.nivelRepository.findOne({
      where: { codigo: dto.codigo, empresaId },
    });

    if (codigoExistente) {
      throw new BadRequestException(`Já existe um nível com o código ${dto.codigo} nesta empresa`);
    }

    const nivel = this.nivelRepository.create({
      ...dto,
      empresaId,
    });

    const salvo = await this.nivelRepository.save(nivel);
    this.logger.log(`✅ Nível de atendimento criado com sucesso: ${salvo.id}`);

    return salvo;
  }

  async atualizar(id: string, dto: UpdateNivelAtendimentoDto): Promise<NivelAtendimento> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`📝 Atualizando nível de atendimento ${id} da empresa ${empresaId}`);

    const nivel = await this.buscarPorId(id);

    // Se estiver mudando o código, validar duplicação
    if (dto.codigo && dto.codigo !== nivel.codigo) {
      const codigoExistente = await this.nivelRepository.findOne({
        where: { codigo: dto.codigo, empresaId },
      });

      if (codigoExistente) {
        throw new BadRequestException(
          `Já existe um nível com o código ${dto.codigo} nesta empresa`,
        );
      }
    }

    Object.assign(nivel, dto);
    const atualizado = await this.nivelRepository.save(nivel);

    this.logger.log(`✅ Nível de atendimento atualizado com sucesso: ${atualizado.id}`);
    return atualizado;
  }

  async deletar(id: string): Promise<void> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`🗑️ Deletando nível de atendimento ${id} da empresa ${empresaId}`);

    const nivel = await this.buscarPorId(id);

    await this.nivelRepository.remove(nivel);
    this.logger.log(`✅ Nível de atendimento deletado com sucesso: ${id}`);
  }

  async inativar(id: string): Promise<NivelAtendimento> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`❌ Inativando nível de atendimento ${id} da empresa ${empresaId}`);

    const nivel = await this.buscarPorId(id);
    nivel.ativo = false;

    const atualizado = await this.nivelRepository.save(nivel);
    this.logger.log(`✅ Nível de atendimento inativado com sucesso: ${id}`);

    return atualizado;
  }

  async ativar(id: string): Promise<NivelAtendimento> {
    const empresaId = this.getEmpresaId();
    this.logger.log(`✅ Ativando nível de atendimento ${id} da empresa ${empresaId}`);

    const nivel = await this.buscarPorId(id);
    nivel.ativo = true;

    const atualizado = await this.nivelRepository.save(nivel);
    this.logger.log(`✅ Nível de atendimento ativado com sucesso: ${id}`);

    return atualizado;
  }
}
