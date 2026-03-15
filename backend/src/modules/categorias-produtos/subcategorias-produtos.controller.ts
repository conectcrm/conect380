import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { CategoriasProdutosService } from './categorias-produtos.service';
import {
  AtualizarSubcategoriaProdutoDto,
  CriarSubcategoriaProdutoDto,
  FiltrosSubcategoriasDto,
} from './dto/categorias-produtos.dto';

@Controller('subcategorias-produtos')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.CRM_PRODUTOS_READ)
export class SubcategoriasProdutosController {
  constructor(private readonly categoriasProdutosService: CategoriasProdutosService) {}

  @Get()
  async listar(@EmpresaId() empresaId: string, @Query() filtros: FiltrosSubcategoriasDto) {
    return this.categoriasProdutosService.listarSubcategorias(empresaId, filtros);
  }

  @Post()
  @Permissions(Permission.CRM_PRODUTOS_CREATE)
  async criar(@EmpresaId() empresaId: string, @Body() payload: CriarSubcategoriaProdutoDto) {
    return this.categoriasProdutosService.criarSubcategoria(empresaId, payload);
  }

  @Put(':id')
  @Permissions(Permission.CRM_PRODUTOS_UPDATE)
  async atualizar(
    @Param('id') id: string,
    @EmpresaId() empresaId: string,
    @Body() payload: AtualizarSubcategoriaProdutoDto,
  ) {
    return this.categoriasProdutosService.atualizarSubcategoria(id, empresaId, payload);
  }

  @Delete(':id')
  @Permissions(Permission.CRM_PRODUTOS_DELETE)
  async excluir(@Param('id') id: string, @EmpresaId() empresaId: string) {
    await this.categoriasProdutosService.excluirSubcategoria(id, empresaId);
    return { message: 'Subcategoria excluída com sucesso' };
  }
}

