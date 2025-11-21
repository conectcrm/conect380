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
  ) { }

  async findAll(empresaId: string): Promise<Produto[]> {
    return this.produtoRepository.find({
      where: { empresa_id: empresaId },
      order: {
        criadoEm: 'DESC',
      },
    });
  }

  async findOne(id: string, empresaId: string): Promise<Produto> {
    const produto = await this.produtoRepository.findOne({
      where: { id, empresa_id: empresaId },
    });

    if (!produto) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado`);
    }

    return produto;
  }

  async create(createProdutoDto: CreateProdutoDto, empresaId: string): Promise<Produto> {
    try {
      const payload = { ...createProdutoDto };

      if (!payload.sku) {
        payload.sku = await this.generateUniqueSku(
          payload.nome,
          payload.tipoItem,
          empresaId,
        );
      } else {
        // Verificar se SKU já existe dentro da mesma empresa
        const existingSku = await this.produtoRepository.findOne({
          where: { sku: payload.sku, empresa_id: empresaId },
        });
        if (existingSku) {
          throw new ConflictException(`SKU ${payload.sku} já existe para esta empresa`);
        }
      }

      if (!payload.custoUnitario) {
        payload.custoUnitario = payload.preco * 0.7;
      }

      if (payload.tipoItem === 'produto' || !payload.tipoItem) {
        payload.estoqueAtual = payload.estoqueAtual ?? 10;
        payload.estoqueMinimo = payload.estoqueMinimo ?? 5;
        payload.estoqueMaximo = payload.estoqueMaximo ?? 100;
      } else {
        payload.estoqueAtual = 0;
        payload.estoqueMinimo = 0;
        payload.estoqueMaximo = 0;
      }

      const produto = this.produtoRepository.create({
        ...payload,
        empresa_id: empresaId,
      });
      return await this.produtoRepository.save(produto);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Erro ao criar produto');
    }
  }

  async update(id: string, updateProdutoDto: UpdateProdutoDto, empresaId: string): Promise<Produto> {
    const produto = await this.findOne(id, empresaId);

    if (updateProdutoDto.sku && updateProdutoDto.sku !== produto.sku) {
      const existingSku = await this.produtoRepository.findOne({
        where: { sku: updateProdutoDto.sku, empresa_id: empresaId },
      });
      if (existingSku) {
        throw new ConflictException(`SKU ${updateProdutoDto.sku} já existe para esta empresa`);
      }
    }

    Object.assign(produto, updateProdutoDto);
    return await this.produtoRepository.save(produto);
  }

  async remove(id: string, empresaId: string): Promise<void> {
    const produto = await this.findOne(id, empresaId);
    await this.produtoRepository.remove(produto);
  }

  async findByCategoria(categoria: string, empresaId: string): Promise<Produto[]> {
    return this.produtoRepository.find({
      where: { categoria, empresa_id: empresaId },
      order: { nome: 'ASC' },
    });
  }

  async findByStatus(status: string, empresaId: string): Promise<Produto[]> {
    return this.produtoRepository.find({
      where: { status, empresa_id: empresaId },
      order: { nome: 'ASC' },
    });
  }

  async getEstatisticas(empresaId: string) {
    const totalProdutos = await this.produtoRepository.count({
      where: { empresa_id: empresaId },
    });

    const produtosAtivos = await this.produtoRepository.count({
      where: { status: 'ativo', empresa_id: empresaId },
    });

    const vendasMes = await this.produtoRepository
      .createQueryBuilder('produto')
      .where('produto.empresa_id = :empresaId', { empresaId })
      .select('SUM(produto.vendasMes)', 'total')
      .getRawOne();

    const valorTotal = await this.produtoRepository
      .createQueryBuilder('produto')
      .where('produto.empresa_id = :empresaId', { empresaId })
      .select('SUM(produto.preco * produto.vendasMes)', 'total')
      .getRawOne();

    const estoquesBaixos = await this.produtoRepository
      .createQueryBuilder('produto')
      .where('produto.estoqueAtual <= produto.estoqueMinimo')
      .andWhere('produto.tipoItem = :tipo', { tipo: 'produto' })
      .andWhere('produto.empresa_id = :empresaId', { empresaId })
      .getCount();

    return {
      totalProdutos,
      produtosAtivos,
      vendasMes: Number(vendasMes.total) || 0,
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

    while (
      await this.produtoRepository.findOne({ where: { sku, empresa_id: empresaId } })
    ) {
      sku = `${prefix}-${nomeParte}-${timestamp}-${tentativa}`;
      tentativa++;
    }

    return sku;
  }
}
