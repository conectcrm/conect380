import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { CategoriasProdutosService } from './categorias-produtos.service';
import {
  AtualizarCategoriaProdutoDto,
  CriarCategoriaProdutoDto,
  DuplicarCategoriaDto,
  FiltrosCategoriasDto,
  ReordenarCategoriasDto,
} from './dto/categorias-produtos.dto';

@Controller('categorias-produtos')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.CRM_PRODUTOS_READ)
export class CategoriasProdutosController {
  constructor(private readonly categoriasProdutosService: CategoriasProdutosService) {}

  @Get()
  async listar(@EmpresaId() empresaId: string, @Query() filtros: FiltrosCategoriasDto) {
    return this.categoriasProdutosService.listarCategorias(empresaId, filtros);
  }

  @Get('estatisticas')
  async estatisticas(@EmpresaId() empresaId: string) {
    return this.categoriasProdutosService.obterEstatisticas(empresaId);
  }

  @Get('exportar')
  async exportar(@EmpresaId() empresaId: string) {
    return this.categoriasProdutosService.exportarCategorias(empresaId);
  }

  @Get(':id')
  async obter(@Param('id') id: string, @EmpresaId() empresaId: string) {
    return this.categoriasProdutosService.obterCategoria(id, empresaId);
  }

  @Post()
  @Permissions(Permission.CRM_PRODUTOS_CREATE)
  async criar(@EmpresaId() empresaId: string, @Body() payload: CriarCategoriaProdutoDto) {
    return this.categoriasProdutosService.criarCategoria(empresaId, payload);
  }

  @Put('reordenar')
  @Permissions(Permission.CRM_PRODUTOS_UPDATE)
  async reordenar(@EmpresaId() empresaId: string, @Body() payload: ReordenarCategoriasDto) {
    await this.categoriasProdutosService.reordenarCategorias(empresaId, payload);
    return { message: 'Categorias reordenadas com sucesso' };
  }


  @Put(':id')
  @Permissions(Permission.CRM_PRODUTOS_UPDATE)
  async atualizar(
    @Param('id') id: string,
    @EmpresaId() empresaId: string,
    @Body() payload: AtualizarCategoriaProdutoDto,
  ) {
    return this.categoriasProdutosService.atualizarCategoria(id, empresaId, payload);
  }

  @Delete(':id')
  @Permissions(Permission.CRM_PRODUTOS_DELETE)
  async excluir(@Param('id') id: string, @EmpresaId() empresaId: string) {
    await this.categoriasProdutosService.excluirCategoria(id, empresaId);
    return { message: 'Categoria excluida com sucesso' };
  }

  @Post(':id/duplicar')
  @Permissions(Permission.CRM_PRODUTOS_CREATE)
  async duplicar(
    @Param('id') id: string,
    @EmpresaId() empresaId: string,
    @Body() payload: DuplicarCategoriaDto,
  ) {
    return this.categoriasProdutosService.duplicarCategoria(id, empresaId, payload);
  }

  @Post('importar')
  @Permissions(Permission.CRM_PRODUTOS_CREATE)
  @UseInterceptors(FileInterceptor('arquivo'))
  async importar(
    @EmpresaId() empresaId: string,
    @UploadedFile() arquivo?: Express.Multer.File,
    @Body('categorias') categoriasBody?: unknown,
  ) {
    let categorias: any[] = [];

    if (arquivo?.buffer) {
      const content = arquivo.buffer.toString('utf-8');
      const parsed = JSON.parse(content);
      categorias = Array.isArray(parsed) ? parsed : parsed?.categorias;
    } else if (typeof categoriasBody === 'string') {
      const parsed = JSON.parse(categoriasBody);
      categorias = Array.isArray(parsed) ? parsed : parsed?.categorias;
    } else if (Array.isArray(categoriasBody)) {
      categorias = categoriasBody as any[];
    }

    return this.categoriasProdutosService.importarCategorias(empresaId, categorias);
  }
}

