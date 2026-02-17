import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOperator, Repository, Raw } from 'typeorm';
import { Cliente } from '../modules/clientes/cliente.entity';
import { Produto } from '../modules/produtos/produto.entity';
import { SearchResultDto } from './search.controller';

const ACCENTED_CHARS =
  '\u00E1\u00E0\u00E2\u00E3\u00E4\u00E9\u00E8\u00EA\u00EB\u00ED\u00EC\u00EE\u00EF\u00F3\u00F2\u00F4\u00F5\u00F6\u00FA\u00F9\u00FB\u00FC\u00E7\u00F1';
const PLAIN_CHARS = 'aaaaaeeeeiiiiooooouuuucn';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,

    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
  ) {}

  private formatPreco(value: unknown): string {
    const numeric = Number(value ?? 0);
    return Number.isFinite(numeric) ? numeric.toFixed(2) : '0.00';
  }

  private normalizeSearchText(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private createAccentInsensitiveLike(query: string): FindOperator<string> {
    const normalizedQuery = `%${this.normalizeSearchText(query)}%`;
    const accentMap = ACCENTED_CHARS.split('').map((accentedChar, index) => ({
      accentedChar,
      plainChar: PLAIN_CHARS[index],
    }));

    return Raw(
      (alias) => {
        const normalizedColumnExpression = accentMap.reduce(
          (expression, { accentedChar, plainChar }) =>
            `REPLACE(${expression}, '${accentedChar}', '${plainChar}')`,
          `LOWER(COALESCE(${alias}, ''))`,
        );

        return `${normalizedColumnExpression} LIKE :query`;
      },
      { query: normalizedQuery },
    );
  }

  /**
   * Busca global em multiplas entidades.
   * Retorna resultados limitados e formatados para o frontend.
   */
  async searchGlobal(
    query: string,
    empresaId: string,
    tipos?: string[],
  ): Promise<SearchResultDto[]> {
    if (!query || query.trim().length < 2 || !empresaId) {
      return [];
    }

    const results: SearchResultDto[] = [];
    const limit = 5;
    const accentInsensitiveLike = this.createAccentInsensitiveLike(query);

    if (!tipos || tipos.includes('cliente')) {
      try {
        const clientes = await this.clienteRepository.find({
          where: [
            { nome: accentInsensitiveLike, empresaId },
            { email: accentInsensitiveLike, empresaId },
            { telefone: accentInsensitiveLike, empresaId },
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
            path: `/crm/clientes?highlight=${encodeURIComponent(c.id)}`,
          })),
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'erro desconhecido ao consultar clientes';
        console.warn('[SearchService] Falha na busca de clientes:', errorMessage);
      }
    }

    if (!tipos || tipos.includes('produto')) {
      try {
        const produtos = await this.produtoRepository.find({
          where: [
            { nome: accentInsensitiveLike, empresaId },
            { descricao: accentInsensitiveLike, empresaId },
          ],
          take: limit,
          order: { nome: 'ASC' },
        });

        results.push(
          ...produtos.map((p) => ({
            id: p.id,
            title: p.nome,
            subtitle: `R$ ${this.formatPreco(p.preco)}`,
            type: 'produto' as const,
            path: `/vendas/produtos?highlight=${encodeURIComponent(p.id)}`,
          })),
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'erro desconhecido ao consultar produtos';
        console.warn('[SearchService] Falha na busca de produtos:', errorMessage);
      }
    }

    return results.slice(0, 10);
  }
}
