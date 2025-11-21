import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';
import { CreateTagDto } from '../dto/create-tag.dto';
import { UpdateTagDto } from '../dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) { }

  /**
   * Criar nova tag
   */
  async criar(createTagDto: CreateTagDto, empresaId?: string): Promise<Tag> {
    // Validar se já existe tag com o mesmo nome (case-insensitive)
    const existente = await this.tagRepository.findOne({
      where: {
        nome: createTagDto.nome,
        empresaId: empresaId || null,
      },
    });

    if (existente) {
      throw new BadRequestException(`Já existe uma tag com o nome "${createTagDto.nome}"`);
    }

    const tag = this.tagRepository.create({
      ...createTagDto,
      empresaId: empresaId || null,
      ativo: createTagDto.ativo !== undefined ? createTagDto.ativo : true,
    });

    return await this.tagRepository.save(tag);
  }

  /**
   * Listar todas as tags
   */
  async listar(empresaId?: string, apenasAtivas: boolean = false): Promise<Tag[]> {
    const where: any = {
      empresaId: empresaId || null,
    };

    if (apenasAtivas) {
      where.ativo = true;
    }

    return await this.tagRepository.find({
      where,
      order: { nome: 'ASC' },
    });
  }

  /**
   * Buscar tag por ID
   */
  async buscarPorId(id: string, empresaId?: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({
      where: {
        id,
        empresaId: empresaId || null,
      },
    });

    if (!tag) {
      throw new NotFoundException(`Tag com ID "${id}" não encontrada`);
    }

    return tag;
  }

  /**
   * Atualizar tag
   */
  async atualizar(id: string, updateTagDto: UpdateTagDto, empresaId?: string): Promise<Tag> {
    const tag = await this.buscarPorId(id, empresaId);

    // Se estiver mudando o nome, validar unicidade
    if (updateTagDto.nome && updateTagDto.nome !== tag.nome) {
      const existente = await this.tagRepository.findOne({
        where: {
          nome: updateTagDto.nome,
          empresaId: empresaId || null,
        },
      });

      if (existente && existente.id !== id) {
        throw new BadRequestException(`Já existe uma tag com o nome "${updateTagDto.nome}"`);
      }
    }

    Object.assign(tag, updateTagDto);
    return await this.tagRepository.save(tag);
  }

  /**
   * Deletar tag
   */
  async deletar(id: string, empresaId?: string): Promise<void> {
    const tag = await this.buscarPorId(id, empresaId);

    // Soft delete: apenas marcar como inativa
    tag.ativo = false;
    await this.tagRepository.save(tag);

    // Para hard delete, usar:
    // await this.tagRepository.remove(tag);
  }

  /**
   * Buscar tags por IDs (útil para adicionar múltiplas tags a um ticket)
   */
  async buscarPorIds(ids: string[], empresaId?: string): Promise<Tag[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    return await this.tagRepository
      .createQueryBuilder('tag')
      .where('tag.id IN (:...ids)', { ids })
      .andWhere('tag.empresaId = :empresaId OR tag.empresaId IS NULL', {
        empresaId: empresaId || null,
      })
      .andWhere('tag.ativo = :ativo', { ativo: true })
      .getMany();
  }

  /**
   * Contar quantos tickets usam cada tag (para exibir "usage count" no frontend)
   */
  async contarUso(empresaId?: string): Promise<{ [tagId: string]: number }> {
    const query = `
      SELECT 
        t.id as "tagId",
        COUNT(tt."ticketId")::integer as count
      FROM tags t
      LEFT JOIN ticket_tags tt ON t.id = tt."tagId"
      WHERE (t."empresaId" = $1 OR t."empresaId" IS NULL)
      GROUP BY t.id
    `;

    const results = await this.tagRepository.query(query, [empresaId || null]);

    const countMap: { [tagId: string]: number } = {};
    results.forEach((row: any) => {
      countMap[row.tagId] = parseInt(row.count, 10);
    });

    return countMap;
  }

  /**
   * Listar tags com contagem de uso
   */
  async listarComContagem(empresaId?: string, apenasAtivas: boolean = false): Promise<any[]> {
    const tags = await this.listar(empresaId, apenasAtivas);
    const countMap = await this.contarUso(empresaId);

    return tags.map((tag) => ({
      ...tag,
      usageCount: countMap[tag.id] || 0,
    }));
  }
}
