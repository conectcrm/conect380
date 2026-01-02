import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Cliente } from '../modules/clientes/cliente.entity';
import { Produto } from '../modules/produtos/produto.entity';
import { SearchResultDto } from './search.controller';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,

    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
  ) { }

  /**
   * Busca global em múltiplas entidades
   * Retorna resultados limitados e formatados para o frontend
   */
  async searchGlobal(
    query: string,
    empresaId: string,
    tipos?: string[],
  ): Promise<SearchResultDto[]> {
    const results: SearchResultDto[] = [];
    const limit = 5; // Limite por tipo

    // Buscar clientes
    if (!tipos || tipos.includes('cliente')) {
      const clientes = await this.clienteRepository.find({
        where: [
          { nome: Like(`%${query}%`), empresa_id: empresaId },
          { email: Like(`%${query}%`), empresa_id: empresaId },
          { telefone: Like(`%${query}%`), empresa_id: empresaId },
        ],
        take: limit,
        order: { nome: 'ASC' },
      });

      results.push(
        ...clientes.map((c) => ({
          id: c.id,
          title: c.nome,
          subtitle: c.email || c.telefone || 'Cliente',
          type: 'cliente' as const,
          path: `/clientes/${c.id}`,
        })),
      );
    }

    // Buscar produtos
    if (!tipos || tipos.includes('produto')) {
      const produtos = await this.produtoRepository.find({
        where: [
          { nome: Like(`%${query}%`), empresa_id: empresaId },
          { descricao: Like(`%${query}%`), empresa_id: empresaId },
        ],
        take: limit,
        order: { nome: 'ASC' },
      });

      results.push(
        ...produtos.map((p) => ({
          id: p.id,
          title: p.nome,
          subtitle: `R$ ${p.preco?.toFixed(2) || '0.00'}`,
          type: 'produto' as const,
          path: `/produtos/${p.id}`,
        })),
      );
    }

    // Ordenar por relevância (clientes primeiro, depois produtos)
    return results.slice(0, 10); // Máximo 10 resultados totais
  }
}
