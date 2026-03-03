import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { CategoriasProdutosService } from './categorias-produtos.service';
import {
  AtualizarConfiguracaoProdutoDto,
  CriarConfiguracaoProdutoDto,
  FiltrosConfiguracoesDto,
} from './dto/categorias-produtos.dto';

@Controller('configuracoes-produtos')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.CRM_PRODUTOS_READ)
export class ConfiguracoesProdutosController {
  constructor(private readonly categoriasProdutosService: CategoriasProdutosService) {}

  @Get()
  async listar(@EmpresaId() empresaId: string, @Query() filtros: FiltrosConfiguracoesDto) {
    return this.categoriasProdutosService.listarConfiguracoes(empresaId, filtros);
  }

  @Post()
  @Permissions(Permission.CRM_PRODUTOS_CREATE)
  async criar(@EmpresaId() empresaId: string, @Body() payload: CriarConfiguracaoProdutoDto) {
    return this.categoriasProdutosService.criarConfiguracao(empresaId, payload);
  }

  @Put(':id')
  @Permissions(Permission.CRM_PRODUTOS_UPDATE)
  async atualizar(
    @Param('id') id: string,
    @EmpresaId() empresaId: string,
    @Body() payload: AtualizarConfiguracaoProdutoDto,
  ) {
    return this.categoriasProdutosService.atualizarConfiguracao(id, empresaId, payload);
  }

  @Delete(':id')
  @Permissions(Permission.CRM_PRODUTOS_DELETE)
  async excluir(@Param('id') id: string, @EmpresaId() empresaId: string) {
    await this.categoriasProdutosService.excluirConfiguracao(id, empresaId);
    return { message: 'Configuração excluída com sucesso' };
  }
}

