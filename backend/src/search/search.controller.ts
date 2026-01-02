import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { SearchService } from './search.service';

export interface SearchResultDto {
  id: string;
  title: string;
  subtitle: string;
  type: 'cliente' | 'cotacao' | 'produto' | 'oportunidade' | 'contato';
  path: string;
  highlight?: string;
}

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) { }

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
    const empresaId = req.user?.empresa_id;
    const tiposArray = tipos ? tipos.split(',') : undefined;

    if (!query || query.trim().length < 2) {
      return [];
    }

    return await this.searchService.searchGlobal(
      query.trim(),
      empresaId,
      tiposArray,
    );
  }
}
