import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriaProduto } from './entities/categoria-produto.entity';
import { SubcategoriaProduto } from './entities/subcategoria-produto.entity';
import { ConfiguracaoProduto } from './entities/configuracao-produto.entity';
import {
  AtualizarCategoriaProdutoDto,
  AtualizarConfiguracaoProdutoDto,
  AtualizarSubcategoriaProdutoDto,
  CriarCategoriaProdutoDto,
  CriarConfiguracaoProdutoDto,
  CriarSubcategoriaProdutoDto,
  DuplicarCategoriaDto,
  FiltrosCategoriasDto,
  FiltrosConfiguracoesDto,
  FiltrosSubcategoriasDto,
  ReordenarCategoriasDto,
} from './dto/categorias-produtos.dto';

@Injectable()
export class CategoriasProdutosService {
  constructor(
    @InjectRepository(CategoriaProduto)
    private readonly categoriaRepository: Repository<CategoriaProduto>,
    @InjectRepository(SubcategoriaProduto)
    private readonly subcategoriaRepository: Repository<SubcategoriaProduto>,
    @InjectRepository(ConfiguracaoProduto)
    private readonly configuracaoRepository: Repository<ConfiguracaoProduto>,
  ) {}

  private normalizeConfiguracao(configuracao: ConfiguracaoProduto): ConfiguracaoProduto {
    return {
      ...configuracao,
      multiplicador: Number(configuracao.multiplicador || 0),
    };
  }

  private normalizeSubcategoria(subcategoria: SubcategoriaProduto): SubcategoriaProduto {
    return {
      ...subcategoria,
      precoBase: Number(subcategoria.precoBase || 0),
      configuracoes: Array.isArray(subcategoria.configuracoes)
        ? subcategoria.configuracoes.map((configuracao) =>
            this.normalizeConfiguracao(configuracao),
          )
        : [],
    };
  }

  private normalizeCategoria(categoria: CategoriaProduto): CategoriaProduto {
    return {
      ...categoria,
      subcategorias: Array.isArray(categoria.subcategorias)
        ? categoria.subcategorias.map((subcategoria) => this.normalizeSubcategoria(subcategoria))
        : [],
    };
  }

  private resolveCategoryOrderField(field?: string): string {
    if (field === 'created_at') return 'criado_em';
    if (field === 'ordem') return 'ordem';
    return 'nome';
  }

  private resolveDirection(direction?: string): 'ASC' | 'DESC' {
    return direction?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  }

  private async findCategoriaOrFail(id: string, empresaId: string): Promise<CategoriaProduto> {
    const categoria = await this.categoriaRepository.findOne({
      where: { id, empresaId },
      relations: {
        subcategorias: {
          configuracoes: true,
        },
      },
    });

    if (!categoria) {
      throw new NotFoundException('Categoria não encontrada');
    }

    return categoria;
  }

  private async findSubcategoriaOrFail(id: string, empresaId: string): Promise<SubcategoriaProduto> {
    const subcategoria = await this.subcategoriaRepository.findOne({
      where: { id, empresaId },
      relations: {
        configuracoes: true,
      },
    });

    if (!subcategoria) {
      throw new NotFoundException('Subcategoria não encontrada');
    }

    return subcategoria;
  }

  private async findConfiguracaoOrFail(id: string, empresaId: string): Promise<ConfiguracaoProduto> {
    const configuracao = await this.configuracaoRepository.findOne({
      where: { id, empresaId },
    });

    if (!configuracao) {
      throw new NotFoundException('Configuração não encontrada');
    }

    return configuracao;
  }

  async listarCategorias(empresaId: string, filtros?: FiltrosCategoriasDto): Promise<CategoriaProduto[]> {
    const qb = this.categoriaRepository
      .createQueryBuilder('categoria')
      .leftJoinAndSelect('categoria.subcategorias', 'subcategoria', 'subcategoria.empresa_id = :empresaId', {
        empresaId,
      })
      .leftJoinAndSelect(
        'subcategoria.configuracoes',
        'configuracao',
        'configuracao.empresa_id = :empresaId',
        { empresaId },
      )
      .where('categoria.empresa_id = :empresaId', { empresaId });

    if (filtros?.ativo !== undefined) {
      qb.andWhere('categoria.ativo = :ativo', { ativo: filtros.ativo });
    }

    if (filtros?.busca) {
      qb.andWhere(
        '(categoria.nome ILIKE :busca OR COALESCE(categoria.descricao, \'\') ILIKE :busca)',
        { busca: `%${filtros.busca}%` },
      );
    }

    const orderField = this.resolveCategoryOrderField(filtros?.ordenacao);
    qb.orderBy(`categoria.${orderField}`, this.resolveDirection(filtros?.direcao))
      .addOrderBy('subcategoria.ordem', 'ASC')
      .addOrderBy('subcategoria.nome', 'ASC')
      .addOrderBy('configuracao.ordem', 'ASC')
      .addOrderBy('configuracao.nome', 'ASC');

    const categorias = await qb.getMany();
    return categorias.map((categoria) => this.normalizeCategoria(categoria));
  }

  async obterCategoria(id: string, empresaId: string): Promise<CategoriaProduto> {
    const categoria = await this.findCategoriaOrFail(id, empresaId);
    return this.normalizeCategoria(categoria);
  }

  async criarCategoria(
    empresaId: string,
    payload: CriarCategoriaProdutoDto,
  ): Promise<CategoriaProduto> {
    const categoria = this.categoriaRepository.create({
      empresaId,
      nome: payload.nome.trim(),
      descricao: payload.descricao?.trim() || '',
      icone: payload.icone?.trim() || '📁',
      cor: payload.cor?.trim() || 'blue',
      ordem: payload.ordem ?? 0,
      ativo: payload.ativo ?? true,
    });

    const saved = await this.categoriaRepository.save(categoria);
    return this.obterCategoria(saved.id, empresaId);
  }

  async atualizarCategoria(
    id: string,
    empresaId: string,
    payload: AtualizarCategoriaProdutoDto,
  ): Promise<CategoriaProduto> {
    const categoria = await this.findCategoriaOrFail(id, empresaId);

    if (payload.nome !== undefined) categoria.nome = payload.nome.trim();
    if (payload.descricao !== undefined) categoria.descricao = payload.descricao?.trim() || '';
    if (payload.icone !== undefined) categoria.icone = payload.icone?.trim() || '📁';
    if (payload.cor !== undefined) categoria.cor = payload.cor?.trim() || 'blue';
    if (payload.ordem !== undefined) categoria.ordem = payload.ordem;
    if (payload.ativo !== undefined) categoria.ativo = payload.ativo;

    await this.categoriaRepository.save(categoria);
    return this.obterCategoria(id, empresaId);
  }

  async excluirCategoria(id: string, empresaId: string): Promise<void> {
    const categoria = await this.findCategoriaOrFail(id, empresaId);

    const subcategorias = await this.subcategoriaRepository.find({
      where: { categoriaId: categoria.id, empresaId },
      select: ['id'],
    });

    const subcategoriasIds = subcategorias.map((subcategoria) => subcategoria.id);
    if (subcategoriasIds.length > 0) {
      await this.configuracaoRepository
        .createQueryBuilder()
        .delete()
        .from(ConfiguracaoProduto)
        .where('empresa_id = :empresaId', { empresaId })
        .andWhere('subcategoria_id IN (:...ids)', { ids: subcategoriasIds })
        .execute();

      await this.subcategoriaRepository
        .createQueryBuilder()
        .delete()
        .from(SubcategoriaProduto)
        .where('empresa_id = :empresaId', { empresaId })
        .andWhere('categoria_id = :categoriaId', { categoriaId: categoria.id })
        .execute();
    }

    await this.categoriaRepository.remove(categoria);
  }

  async reordenarCategorias(
    empresaId: string,
    payload: ReordenarCategoriasDto,
  ): Promise<void> {
    if (!Array.isArray(payload.categorias) || payload.categorias.length === 0) {
      return;
    }

    await this.categoriaRepository.manager.transaction(async (manager) => {
      for (const categoria of payload.categorias) {
        await manager.update(
          CategoriaProduto,
          { id: categoria.id, empresaId },
          { ordem: Number(categoria.ordem) || 0 },
        );
      }
    });
  }

  async duplicarCategoria(
    id: string,
    empresaId: string,
    payload?: DuplicarCategoriaDto,
  ): Promise<CategoriaProduto> {
    const categoriaOriginal = await this.findCategoriaOrFail(id, empresaId);

    const novaCategoria = await this.categoriaRepository.save(
      this.categoriaRepository.create({
        empresaId,
        nome: payload?.novoNome?.trim() || `${categoriaOriginal.nome} (Cópia)`,
        descricao: categoriaOriginal.descricao || '',
        icone: categoriaOriginal.icone || '📁',
        cor: categoriaOriginal.cor || 'blue',
        ordem: (categoriaOriginal.ordem || 0) + 1,
        ativo: categoriaOriginal.ativo,
      }),
    );

    for (const subcategoriaOriginal of categoriaOriginal.subcategorias || []) {
      const novaSubcategoria = await this.subcategoriaRepository.save(
        this.subcategoriaRepository.create({
          empresaId,
          categoriaId: novaCategoria.id,
          nome: subcategoriaOriginal.nome,
          descricao: subcategoriaOriginal.descricao || '',
          precoBase: Number(subcategoriaOriginal.precoBase || 0),
          unidade: subcategoriaOriginal.unidade || 'unidade',
          camposPersonalizados: subcategoriaOriginal.camposPersonalizados || null,
          ordem: subcategoriaOriginal.ordem || 0,
          ativo: subcategoriaOriginal.ativo,
        }),
      );

      for (const configuracaoOriginal of subcategoriaOriginal.configuracoes || []) {
        await this.configuracaoRepository.save(
          this.configuracaoRepository.create({
            empresaId,
            subcategoriaId: novaSubcategoria.id,
            nome: configuracaoOriginal.nome,
            descricao: configuracaoOriginal.descricao || '',
            multiplicador: Number(configuracaoOriginal.multiplicador || 1),
            ordem: configuracaoOriginal.ordem || 0,
            ativo: configuracaoOriginal.ativo,
          }),
        );
      }
    }

    return this.obterCategoria(novaCategoria.id, empresaId);
  }

  async listarSubcategorias(
    empresaId: string,
    filtros?: FiltrosSubcategoriasDto,
  ): Promise<SubcategoriaProduto[]> {
    const qb = this.subcategoriaRepository
      .createQueryBuilder('subcategoria')
      .leftJoinAndSelect(
        'subcategoria.configuracoes',
        'configuracao',
        'configuracao.empresa_id = :empresaId',
        { empresaId },
      )
      .where('subcategoria.empresa_id = :empresaId', { empresaId });

    if (filtros?.categoria_id) {
      qb.andWhere('subcategoria.categoria_id = :categoriaId', { categoriaId: filtros.categoria_id });
    }
    if (filtros?.ativo !== undefined) {
      qb.andWhere('subcategoria.ativo = :ativo', { ativo: filtros.ativo });
    }
    if (filtros?.busca) {
      qb.andWhere(
        '(subcategoria.nome ILIKE :busca OR COALESCE(subcategoria.descricao, \'\') ILIKE :busca)',
        { busca: `%${filtros.busca}%` },
      );
    }

    const orderField = filtros?.ordenacao === 'ordem' ? 'ordem' : 'nome';
    qb.orderBy(`subcategoria.${orderField}`, this.resolveDirection(filtros?.direcao))
      .addOrderBy('configuracao.ordem', 'ASC')
      .addOrderBy('configuracao.nome', 'ASC');

    const subcategorias = await qb.getMany();
    return subcategorias.map((subcategoria) => this.normalizeSubcategoria(subcategoria));
  }

  async criarSubcategoria(
    empresaId: string,
    payload: CriarSubcategoriaProdutoDto,
  ): Promise<SubcategoriaProduto> {
    await this.findCategoriaOrFail(payload.categoria_id, empresaId);

    const subcategoria = this.subcategoriaRepository.create({
      empresaId,
      categoriaId: payload.categoria_id,
      nome: payload.nome.trim(),
      descricao: payload.descricao?.trim() || '',
      precoBase: payload.precoBase ?? 0,
      unidade: payload.unidade?.trim() || 'unidade',
      camposPersonalizados: payload.camposPersonalizados || null,
      ordem: payload.ordem ?? 0,
      ativo: payload.ativo ?? true,
    });

    const saved = await this.subcategoriaRepository.save(subcategoria);
    const loaded = await this.findSubcategoriaOrFail(saved.id, empresaId);
    return this.normalizeSubcategoria(loaded);
  }

  async atualizarSubcategoria(
    id: string,
    empresaId: string,
    payload: AtualizarSubcategoriaProdutoDto,
  ): Promise<SubcategoriaProduto> {
    const subcategoria = await this.findSubcategoriaOrFail(id, empresaId);

    if (payload.categoria_id !== undefined) {
      await this.findCategoriaOrFail(payload.categoria_id, empresaId);
      subcategoria.categoriaId = payload.categoria_id;
    }
    if (payload.nome !== undefined) subcategoria.nome = payload.nome.trim();
    if (payload.descricao !== undefined) subcategoria.descricao = payload.descricao?.trim() || '';
    if (payload.precoBase !== undefined) subcategoria.precoBase = payload.precoBase;
    if (payload.unidade !== undefined) subcategoria.unidade = payload.unidade?.trim() || 'unidade';
    if (payload.camposPersonalizados !== undefined) {
      subcategoria.camposPersonalizados = payload.camposPersonalizados || null;
    }
    if (payload.ordem !== undefined) subcategoria.ordem = payload.ordem;
    if (payload.ativo !== undefined) subcategoria.ativo = payload.ativo;

    await this.subcategoriaRepository.save(subcategoria);
    const loaded = await this.findSubcategoriaOrFail(id, empresaId);
    return this.normalizeSubcategoria(loaded);
  }

  async excluirSubcategoria(id: string, empresaId: string): Promise<void> {
    const subcategoria = await this.findSubcategoriaOrFail(id, empresaId);

    await this.configuracaoRepository
      .createQueryBuilder()
      .delete()
      .from(ConfiguracaoProduto)
      .where('empresa_id = :empresaId', { empresaId })
      .andWhere('subcategoria_id = :subcategoriaId', { subcategoriaId: subcategoria.id })
      .execute();

    await this.subcategoriaRepository.remove(subcategoria);
  }

  async listarConfiguracoes(
    empresaId: string,
    filtros?: FiltrosConfiguracoesDto,
  ): Promise<ConfiguracaoProduto[]> {
    const qb = this.configuracaoRepository
      .createQueryBuilder('configuracao')
      .where('configuracao.empresa_id = :empresaId', { empresaId });

    if (filtros?.subcategoria_id) {
      qb.andWhere('configuracao.subcategoria_id = :subcategoriaId', {
        subcategoriaId: filtros.subcategoria_id,
      });
    }
    if (filtros?.ativo !== undefined) {
      qb.andWhere('configuracao.ativo = :ativo', { ativo: filtros.ativo });
    }
    if (filtros?.busca) {
      qb.andWhere(
        '(configuracao.nome ILIKE :busca OR COALESCE(configuracao.descricao, \'\') ILIKE :busca)',
        { busca: `%${filtros.busca}%` },
      );
    }

    const orderField = filtros?.ordenacao === 'ordem' ? 'ordem' : 'nome';
    qb.orderBy(`configuracao.${orderField}`, this.resolveDirection(filtros?.direcao));

    const configuracoes = await qb.getMany();
    return configuracoes.map((configuracao) => this.normalizeConfiguracao(configuracao));
  }

  async criarConfiguracao(
    empresaId: string,
    payload: CriarConfiguracaoProdutoDto,
  ): Promise<ConfiguracaoProduto> {
    await this.findSubcategoriaOrFail(payload.subcategoria_id, empresaId);

    const configuracao = this.configuracaoRepository.create({
      empresaId,
      subcategoriaId: payload.subcategoria_id,
      nome: payload.nome.trim(),
      descricao: payload.descricao?.trim() || '',
      multiplicador: payload.multiplicador ?? 1,
      ordem: payload.ordem ?? 0,
      ativo: payload.ativo ?? true,
    });

    const saved = await this.configuracaoRepository.save(configuracao);
    const loaded = await this.findConfiguracaoOrFail(saved.id, empresaId);
    return this.normalizeConfiguracao(loaded);
  }

  async atualizarConfiguracao(
    id: string,
    empresaId: string,
    payload: AtualizarConfiguracaoProdutoDto,
  ): Promise<ConfiguracaoProduto> {
    const configuracao = await this.findConfiguracaoOrFail(id, empresaId);

    if (payload.subcategoria_id !== undefined) {
      await this.findSubcategoriaOrFail(payload.subcategoria_id, empresaId);
      configuracao.subcategoriaId = payload.subcategoria_id;
    }
    if (payload.nome !== undefined) configuracao.nome = payload.nome.trim();
    if (payload.descricao !== undefined) configuracao.descricao = payload.descricao?.trim() || '';
    if (payload.multiplicador !== undefined) configuracao.multiplicador = payload.multiplicador;
    if (payload.ordem !== undefined) configuracao.ordem = payload.ordem;
    if (payload.ativo !== undefined) configuracao.ativo = payload.ativo;

    await this.configuracaoRepository.save(configuracao);
    const loaded = await this.findConfiguracaoOrFail(id, empresaId);
    return this.normalizeConfiguracao(loaded);
  }

  async excluirConfiguracao(id: string, empresaId: string): Promise<void> {
    const configuracao = await this.findConfiguracaoOrFail(id, empresaId);
    await this.configuracaoRepository.remove(configuracao);
  }

  async obterEstatisticas(empresaId: string) {
    const [totalCategorias, totalSubcategorias, totalConfiguracoes, precoMedio, categoriaMaisUsadaRaw] =
      await Promise.all([
        this.categoriaRepository.count({ where: { empresaId } }),
        this.subcategoriaRepository.count({ where: { empresaId } }),
        this.configuracaoRepository.count({ where: { empresaId } }),
        this.subcategoriaRepository
          .createQueryBuilder('subcategoria')
          .select('AVG(subcategoria.preco_base)', 'precoMedio')
          .where('subcategoria.empresa_id = :empresaId', { empresaId })
          .getRawOne(),
        this.subcategoriaRepository
          .createQueryBuilder('subcategoria')
          .innerJoin('categorias_produtos', 'categoria', 'categoria.id = subcategoria.categoria_id')
          .select('categoria.nome', 'nome')
          .addSelect('COUNT(subcategoria.id)', 'quantidade')
          .where('subcategoria.empresa_id = :empresaId', { empresaId })
          .groupBy('categoria.nome')
          .orderBy('COUNT(subcategoria.id)', 'DESC')
          .limit(1)
          .getRawOne(),
      ]);

    return {
      totalCategorias,
      totalSubcategorias,
      totalConfiguracoes,
      categoriaMaisUsada: categoriaMaisUsadaRaw?.nome || undefined,
      precoMedio: Number(precoMedio?.precoMedio || 0),
    };
  }

  async exportarCategorias(empresaId: string): Promise<CategoriaProduto[]> {
    return this.listarCategorias(empresaId);
  }

  async importarCategorias(empresaId: string, categoriasImportadas: any[]) {
    let importadas = 0;
    const erros: string[] = [];

    if (!Array.isArray(categoriasImportadas)) {
      return { importadas, erros: ['Arquivo de importação inválido'] };
    }

    for (const [index, categoriaInput] of categoriasImportadas.entries()) {
      try {
        if (!categoriaInput?.nome || typeof categoriaInput.nome !== 'string') {
          erros.push(`Linha ${index + 1}: nome da categoria é obrigatório`);
          continue;
        }

        const categoria = await this.criarCategoria(empresaId, {
          nome: categoriaInput.nome,
          descricao: categoriaInput.descricao || '',
          icone: categoriaInput.icone || '📁',
          cor: categoriaInput.cor || 'blue',
          ordem: categoriaInput.ordem ?? 0,
          ativo: categoriaInput.ativo ?? true,
        });

        for (const subcategoriaInput of categoriaInput.subcategorias || []) {
          const subcategoria = await this.criarSubcategoria(empresaId, {
            categoria_id: categoria.id,
            nome: subcategoriaInput.nome || 'Subcategoria',
            descricao: subcategoriaInput.descricao || '',
            precoBase: Number(subcategoriaInput.precoBase || 0),
            unidade: subcategoriaInput.unidade || 'unidade',
            camposPersonalizados: subcategoriaInput.camposPersonalizados || null,
            ordem: subcategoriaInput.ordem ?? 0,
            ativo: subcategoriaInput.ativo ?? true,
          });

          for (const configuracaoInput of subcategoriaInput.configuracoes || []) {
            await this.criarConfiguracao(empresaId, {
              subcategoria_id: subcategoria.id,
              nome: configuracaoInput.nome || 'Configuração',
              descricao: configuracaoInput.descricao || '',
              multiplicador: Number(configuracaoInput.multiplicador || 1),
              ordem: configuracaoInput.ordem ?? 0,
              ativo: configuracaoInput.ativo ?? true,
            });
          }
        }

        importadas += 1;
      } catch (error) {
        erros.push(`Linha ${index + 1}: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
      }
    }

    return { importadas, erros };
  }
}

