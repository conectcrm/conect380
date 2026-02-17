import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateMensagem } from '../entities/template-mensagem.entity';
import { CreateTemplateMensagemDto } from '../dto/create-template-mensagem.dto';
import { UpdateTemplateMensagemDto } from '../dto/update-template-mensagem.dto';

@Injectable()
export class TemplateMensagemService {
  constructor(
    @InjectRepository(TemplateMensagem)
    private readonly templateRepository: Repository<TemplateMensagem>,
  ) {}

  async criar(dto: CreateTemplateMensagemDto, empresaId: string): Promise<TemplateMensagem> {
    if (dto.atalho) {
      const existente = await this.templateRepository.findOne({
        where: {
          empresaId,
          atalho: dto.atalho,
        },
      });

      if (existente) {
        throw new ConflictException(`Atalho "${dto.atalho}" ja esta em uso`);
      }
    }

    const template = this.templateRepository.create({
      ...dto,
      empresaId,
    });

    return await this.templateRepository.save(template);
  }

  async listar(empresaId: string): Promise<TemplateMensagem[]> {
    return await this.templateRepository.find({
      where: { empresaId, ativo: true },
      order: { nome: 'ASC', createdAt: 'DESC' },
    });
  }

  async listarTodos(empresaId: string): Promise<TemplateMensagem[]> {
    return await this.templateRepository.find({
      where: { empresaId },
      order: { nome: 'ASC', createdAt: 'DESC' },
    });
  }

  async buscarPorId(id: string, empresaId: string): Promise<TemplateMensagem> {
    const template = await this.templateRepository.findOne({
      where: { id, empresaId },
    });

    if (!template) {
      throw new NotFoundException(`Template ${id} nao encontrado`);
    }

    return template;
  }

  async buscarPorAtalho(atalho: string, empresaId: string): Promise<TemplateMensagem | null> {
    return await this.templateRepository.findOne({
      where: { atalho, empresaId, ativo: true },
    });
  }

  async atualizar(
    id: string,
    empresaId: string,
    dto: UpdateTemplateMensagemDto,
  ): Promise<TemplateMensagem> {
    const template = await this.buscarPorId(id, empresaId);

    if (dto.atalho && dto.atalho !== template.atalho) {
      const existente = await this.templateRepository.findOne({
        where: {
          empresaId,
          atalho: dto.atalho,
        },
      });

      if (existente && existente.id !== id) {
        throw new ConflictException(`Atalho "${dto.atalho}" ja esta em uso`);
      }
    }

    const { empresaId: _ignoredEmpresaId, ...safeDto } = dto as UpdateTemplateMensagemDto & {
      empresaId?: string;
    };

    Object.assign(template, safeDto);
    return await this.templateRepository.save(template);
  }

  async deletar(id: string, empresaId: string): Promise<void> {
    const template = await this.buscarPorId(id, empresaId);
    await this.templateRepository.remove(template);
  }

  async buscar(termo: string, empresaId: string): Promise<TemplateMensagem[]> {
    return await this.templateRepository
      .createQueryBuilder('template')
      .where('template.empresaId = :empresaId', { empresaId })
      .andWhere('template.ativo = :ativo', { ativo: true })
      .andWhere(
        '(template.nome ILIKE :termo OR template.conteudo ILIKE :termo OR template.atalho ILIKE :termo)',
        { termo: `%${termo}%` },
      )
      .orderBy('template.ordem', 'ASC')
      .addOrderBy('template.nome', 'ASC')
      .getMany();
  }
}
