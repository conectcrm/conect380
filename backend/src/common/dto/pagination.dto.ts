/**
 * Interface padronizada para respostas paginadas
 *
 * Uso:
 * async listar(): Promise<PaginatedResponse<Lead>> {
 *   const [data, total] = await this.repository.findAndCount(...);
 *
 *   return {
 *     data,
 *     total,
 *     page: 1,
 *     limit: 20,
 *     totalPages: Math.ceil(total / 20),
 *   };
 * }
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * DTO para parâmetros de paginação
 *
 * Uso em controller:
 * @Get()
 * async listar(@Query() params: PaginationDto) {
 *   return this.service.findAll(params);
 * }
 */
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  sortBy?: string = 'criadoEm';

  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

/**
 * Helper function para calcular skip/take
 */
export function getPaginationParams(params: PaginationDto) {
  const { page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;
  const take = limit;

  return { skip, take };
}

/**
 * Helper function para criar resposta paginada
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
