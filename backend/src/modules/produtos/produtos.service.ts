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

  async findAll(): Promise<Produto[]> {
    return this.produtoRepository.find({
      order: {
        criadoEm: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Produto> {
    const produto = await this.produtoRepository.findOne({
      where: { id },
    });

    if (!produto) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado`);
    }

    return produto;
  }

  async create(createProdutoDto: CreateProdutoDto): Promise<Produto> {
    try {
      // Gerar SKU único se não fornecido
      if (!createProdutoDto.sku) {
        createProdutoDto.sku = await this.generateUniqueSku(createProdutoDto.nome, createProdutoDto.tipoItem);
      } else {
        // Verificar se SKU já existe
        const existingSku = await this.produtoRepository.findOne({
          where: { sku: createProdutoDto.sku },
        });
        if (existingSku) {
          throw new ConflictException(`SKU ${createProdutoDto.sku} já existe`);
        }
      }

      // Calcular custo unitário padrão se não fornecido (70% do preço)
      if (!createProdutoDto.custoUnitario) {
        createProdutoDto.custoUnitario = createProdutoDto.preco * 0.7;
      }

      // Configurar valores padrão para estoque baseado no tipo
      if (createProdutoDto.tipoItem === 'produto' || !createProdutoDto.tipoItem) {
        createProdutoDto.estoqueAtual = createProdutoDto.estoqueAtual ?? 10;
        createProdutoDto.estoqueMinimo = createProdutoDto.estoqueMinimo ?? 5;
        createProdutoDto.estoqueMaximo = createProdutoDto.estoqueMaximo ?? 100;
      } else {
        // Serviços, licenças, etc. não têm estoque físico
        createProdutoDto.estoqueAtual = 0;
        createProdutoDto.estoqueMinimo = 0;
        createProdutoDto.estoqueMaximo = 0;
      }

      const produto = this.produtoRepository.create(createProdutoDto);
      return await this.produtoRepository.save(produto);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Erro ao criar produto');
    }
  }

  async update(id: string, updateProdutoDto: UpdateProdutoDto): Promise<Produto> {
    const produto = await this.findOne(id);

    // Se SKU está sendo atualizado, verificar se não conflita
    if (updateProdutoDto.sku && updateProdutoDto.sku !== produto.sku) {
      const existingSku = await this.produtoRepository.findOne({
        where: { sku: updateProdutoDto.sku },
      });
      if (existingSku) {
        throw new ConflictException(`SKU ${updateProdutoDto.sku} já existe`);
      }
    }

    Object.assign(produto, updateProdutoDto);
    return await this.produtoRepository.save(produto);
  }

  async remove(id: string): Promise<void> {
    const produto = await this.findOne(id);
    await this.produtoRepository.remove(produto);
  }

  async findByCategoria(categoria: string): Promise<Produto[]> {
    return this.produtoRepository.find({
      where: { categoria },
      order: { nome: 'ASC' },
    });
  }

  async findByStatus(status: string): Promise<Produto[]> {
    return this.produtoRepository.find({
      where: { status },
      order: { nome: 'ASC' },
    });
  }

  async getEstatisticas() {
    const totalProdutos = await this.produtoRepository.count();
    const produtosAtivos = await this.produtoRepository.count({
      where: { status: 'ativo' },
    });
    
    const vendasMes = await this.produtoRepository
      .createQueryBuilder('produto')
      .select('SUM(produto.vendasMes)', 'total')
      .getRawOne();

    const valorTotal = await this.produtoRepository
      .createQueryBuilder('produto')
      .select('SUM(produto.preco * produto.vendasMes)', 'total')
      .getRawOne();

    const estoquesBaixos = await this.produtoRepository
      .createQueryBuilder('produto')
      .where('produto.estoqueAtual <= produto.estoqueMinimo')
      .andWhere('produto.tipoItem = :tipo', { tipo: 'produto' })
      .getCount();

    return {
      totalProdutos,
      produtosAtivos,
      vendasMes: Number(vendasMes.total) || 0,
      valorTotal: Number(valorTotal.total) || 0,
      estoquesBaixos,
    };
  }

  private async generateUniqueSku(nome: string, tipoItem: string = 'produto'): Promise<string> {
    const prefix = tipoItem.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const nomeParte = nome.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
    
    let tentativa = 1;
    let sku = `${prefix}-${nomeParte}-${timestamp}`;
    
    while (await this.produtoRepository.findOne({ where: { sku } })) {
      sku = `${prefix}-${nomeParte}-${timestamp}-${tentativa}`;
      tentativa++;
    }
    
    return sku;
  }
}
