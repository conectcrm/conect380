import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { SearchService } from './search.service';
import { EmpresaGuard } from '../common/guards/empresa.guard';

export interface SearchResultDto {
  id: string;
  title: string;
  subtitle: string;
  type: 'cliente' | 'cotacao' | 'produto' | 'oportunidade' | 'contato';
  path: string;
  highlight?: string;
}

@Controller('search')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * GET /search?q=termo&tipos=cliente,produto
   * Busca global em múltiplas entidades
   */
  @Get()
  async search(
    @Request() req,
    @Query('q') query: string,
    @Query('tipos') tipos?: string,
  ): Promise<SearchResultDto[]> {
    const empresaId = req.user?.empresa_id ?? req.user?.empresaId;
    const tiposArray = tipos ? tipos.split(',') : undefined;

    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      return await this.searchService.searchGlobal(query.trim(), empresaId, tiposArray);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'erro desconhecido durante busca global';
      console.warn('[SearchController] Falha ao processar busca global:', errorMessage);
      return [];
    }
  }
}
