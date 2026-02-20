import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permission } from '../../../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CreateFornecedorDto, UpdateFornecedorDto } from '../dto/fornecedor.dto';
import { FornecedorRemovalResponse } from '../dto/fornecedor-response.dto';
import { FornecedorService } from '../services/fornecedor.service';

@Controller('fornecedores')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.FINANCEIRO_PAGAMENTOS_READ)
export class FornecedorController {
  private readonly logger = new Logger(FornecedorController.name);

  constructor(private readonly fornecedorService: FornecedorService) {}

  @Post()
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async create(@Body() createFornecedorDto: CreateFornecedorDto, @EmpresaId() empresaId: string) {
    this.logger.log('[FornecedorController] Criacao de fornecedor', createFornecedorDto);
    return this.fornecedorService.create(createFornecedorDto, empresaId);
  }

  @Get()
  async findAll(
    @EmpresaId() empresaId: string,
    @Query('busca') busca: string,
    @Query('ativo') ativo: string,
  ) {
    const filtros: { busca?: string; ativo?: boolean } = {};

    if (busca) {
      filtros.busca = busca;
    }

    if (ativo !== undefined && ativo !== '') {
      filtros.ativo = ativo === 'true';
    }

    return this.fornecedorService.findAll(empresaId, filtros);
  }

  @Get('ativos')
  async findAtivos(@EmpresaId() empresaId: string) {
    return this.fornecedorService.findAtivos(empresaId);
  }

  @Get(':id')
  async findOne(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.fornecedorService.findOne(id, empresaId);
  }

  @Put(':id')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async update(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() updateFornecedorDto: UpdateFornecedorDto,
  ) {
    return this.fornecedorService.update(id, updateFornecedorDto, empresaId);
  }

  @Delete(':id')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async remove(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
  ): Promise<FornecedorRemovalResponse> {
    try {
      await this.fornecedorService.remove(id, empresaId);

      return {
        success: true,
        message: 'Fornecedor excluido com sucesso',
      };
    } catch (error) {
      if (error.status === 400 && error.response?.details) {
        return {
          success: false,
          message: error.response.message,
          error: error.response,
          alternative: {
            action: 'desativar',
            endpoint: `/fornecedores/${id}/desativar`,
            description: 'Desativar fornecedor mantendo o historico',
          },
        };
      }

      throw error;
    }
  }

  @Patch(':id/desativar')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async desativar(@EmpresaId() empresaId: string, @Param('id') id: string) {
    const fornecedor = await this.fornecedorService.desativar(id, empresaId);
    return {
      message: 'Fornecedor desativado com sucesso',
      fornecedor,
    };
  }

  @Post(':id/limpar-contas-pagas')
  @Permissions(Permission.FINANCEIRO_PAGAMENTOS_MANAGE)
  async limparContasPagas(@EmpresaId() empresaId: string, @Param('id') id: string) {
    try {
      const result = await this.fornecedorService.limparContasPagas(id, empresaId);

      return {
        success: true,
        message: 'Historico de contas pagas removido com sucesso',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: error.message || 'Erro ao limpar historico de contas pagas',
        error: error.code || 'CLEANUP_ERROR',
      });
    }
  }
}
