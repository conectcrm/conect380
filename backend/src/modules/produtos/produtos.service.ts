import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produto } from './produto.entity';
import { CreateProdutoDto, UpdateProdutoDto } from './dto/produto.dto';

@Injectable()
export class ProdutosService {
  constructor(
    @InjectRepository(Produto)
    private produtoRepository: Repository<Produto>,
  ) {}

  private normalizeProduto(produto: Produto, tipoItemFallback = 'produto'): Produto {
    if (!produto) {
      return produto;
    }

    (produto as any).empresa_id = produto.empresaId;
    (produto as any).tipoItem = produto.tipoItem ?? tipoItemFallback;
    (produto as any).status = produto.status ?? 'ativo';
    (produto as any).ativo = (produto.status ?? 'ativo') === 'ativo';
    return produto;
  }

  async findAll(empresaId: string): Promise<Produto[]> {
    const produtos = await this.produtoRepository.find({
      where: { empresaId },
      order: {
        criadoEm: 'DESC',
      },
    });

    return produtos.map((produto) => this.normalizeProduto(produto));
  }

  async findOne(id: string, empresaId: string): Promise<Produto> {
    const produto = await this.produtoRepository.findOne({
      where: { id, empresaId },
    });

    if (!produto) {
      throw new NotFoundException(`Produto com ID ${id} nao encontrado`);
    }

    return this.normalizeProduto(produto);
  }

  async create(createProdutoDto: CreateProdutoDto, empresaId: string): Promise<Produto> {
    try {
      const payload = { ...createProdutoDto } as any;
      const tipoItem = payload.tipoItem || 'produto';

      if (!payload.sku) {
        payload.sku = await this.generateUniqueSku(payload.nome, tipoItem, empresaId);
      } else {
        const existingSku = await this.produtoRepository.findOne({
          where: { sku: payload.sku, empresaId },
        });
        if (existingSku) {
          throw new ConflictException(`SKU ${payload.sku} ja existe para esta empresa`);
        }
      }

      const produto = this.produtoRepository.create({
        nome: payload.nome,
        categoria: payload.categoria || 'geral',
        preco: payload.preco,
        custoUnitario: payload.custoUnitario ?? payload.preco ?? 0,
        tipoItem,
        frequencia: payload.frequencia || 'unico',
        unidadeMedida: payload.unidadeMedida || 'unidade',
        status: payload.status || 'ativo',
        descricao: payload.descricao,
        sku: payload.sku,
        fornecedor: payload.fornecedor || 'Nao informado',
        estoqueAtual: payload.estoqueAtual ?? payload.estoque ?? 0,
        estoqueMinimo: payload.estoqueMinimo ?? 0,
        estoqueMaximo: payload.estoqueMaximo ?? 0,
        vendasMes: payload.vendasMes ?? 0,
        vendasTotal: payload.vendasTotal ?? 0,
        tags: payload.tags ?? null,
        variacoes: payload.variacoes ?? null,
        empresaId,
      });

      const saved = await this.produtoRepository.save(produto);
      return this.normalizeProduto(saved, tipoItem);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Erro ao criar produto');
    }
  }

  async update(
    id: string,
    updateProdutoDto: UpdateProdutoDto,
    empresaId: string,
  ): Promise<Produto> {
    const produto = await this.findOne(id, empresaId);

    const payload = { ...updateProdutoDto } as any;
    if (payload.sku && payload.sku !== produto.sku) {
      const existingSku = await this.produtoRepository.findOne({
        where: { sku: payload.sku, empresaId },
      });
      if (existingSku) {
        throw new ConflictException(`SKU ${payload.sku} ja existe para esta empresa`);
      }
    }

    if (payload.nome !== undefined) {
      produto.nome = payload.nome;
    }
    if (payload.categoria !== undefined) {
      produto.categoria = payload.categoria;
    }
    if (payload.preco !== undefined) {
      produto.preco = payload.preco;
    }
    if (payload.descricao !== undefined) {
      produto.descricao = payload.descricao;
    }
    if (payload.sku !== undefined) {
      produto.sku = payload.sku;
    }
    if (payload.tipoItem !== undefined) {
      produto.tipoItem = payload.tipoItem;
    }
    if (payload.frequencia !== undefined) {
      produto.frequencia = payload.frequencia;
    }
    if (payload.unidadeMedida !== undefined) {
      produto.unidadeMedida = payload.unidadeMedida;
    }
    if (payload.custoUnitario !== undefined) {
      produto.custoUnitario = payload.custoUnitario;
    }
    if (payload.fornecedor !== undefined) {
      produto.fornecedor = payload.fornecedor;
    }
    if (payload.status !== undefined) {
      produto.status = payload.status;
    }
    if (payload.estoqueAtual !== undefined) {
      produto.estoqueAtual = payload.estoqueAtual;
    }
    if (payload.estoqueMinimo !== undefined) {
      produto.estoqueMinimo = payload.estoqueMinimo;
    }
    if (payload.estoqueMaximo !== undefined) {
      produto.estoqueMaximo = payload.estoqueMaximo;
    }
    if (payload.tags !== undefined) {
      produto.tags = payload.tags;
    }
    if (payload.variacoes !== undefined) {
      produto.variacoes = payload.variacoes;
    }

    const updated = await this.produtoRepository.save(produto);
    return this.normalizeProduto(updated, payload.tipoItem ?? (produto as any).tipoItem ?? 'produto');
  }

  async remove(id: string, empresaId: string): Promise<void> {
    const produto = await this.findOne(id, empresaId);
    await this.produtoRepository.remove(produto);
  }

  async findByCategoria(categoria: string, empresaId: string): Promise<Produto[]> {
    const produtos = await this.produtoRepository.find({
      where: { categoria, empresaId },
      order: { nome: 'ASC' },
    });
    return produtos.map((produto) => this.normalizeProduto(produto));
  }

  async findByStatus(status: string, empresaId: string): Promise<Produto[]> {
    const produtos = await this.produtoRepository.find({
      where: { status, empresaId },
      order: { nome: 'ASC' },
    });
    return produtos.map((produto) => this.normalizeProduto(produto));
  }

  async getEstatisticas(empresaId: string) {
    const totalProdutos = await this.produtoRepository.count({
      where: { empresaId },
    });

    const produtosAtivos = await this.produtoRepository.count({
      where: { status: 'ativo', empresaId },
    });

    const valorTotal = await this.produtoRepository
      .createQueryBuilder('produto')
      .where('produto.empresa_id = :empresaId', { empresaId })
      .select('SUM(produto.preco)', 'total')
      .getRawOne();

    const estoquesBaixos = await this.produtoRepository
      .createQueryBuilder('produto')
      .where('produto.empresa_id = :empresaId', { empresaId })
      .andWhere('COALESCE(produto.estoqueAtual, 0) <= 5')
      .getCount();

    return {
      totalProdutos,
      produtosAtivos,
      vendasMes: 0,
      valorTotal: Number(valorTotal.total) || 0,
      estoquesBaixos,
    };
  }

  private async generateUniqueSku(
    nome: string,
    tipoItem: string = 'produto',
    empresaId: string,
  ): Promise<string> {
    const prefix = tipoItem.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const nomeParte = nome
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, '');

    let tentativa = 1;
    let sku = `${prefix}-${nomeParte}-${timestamp}`;

    while (await this.produtoRepository.findOne({ where: { sku, empresaId } })) {
      sku = `${prefix}-${nomeParte}-${timestamp}-${tentativa}`;
      tentativa++;
    }

    return sku;
  }
}
