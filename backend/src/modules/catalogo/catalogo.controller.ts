import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateCatalogItemDto,
  ListCatalogItemsDto,
  ListCatalogTemplatesDto,
  ReplaceCatalogItemComponentsDto,
  UpdateCatalogItemDto,
  UpdateCatalogItemStatusDto,
} from './dto/catalogo.dto';
import { CatalogoService } from './catalogo.service';

@Controller('catalog')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.CRM_PRODUTOS_READ)
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  @Get('items')
  async listItems(@EmpresaId() empresaId: string, @Query() filtros: ListCatalogItemsDto) {
    return this.catalogoService.listItems(empresaId, filtros);
  }

  @Get('items/:id')
  async getItem(@Param('id', ParseUUIDPipe) id: string, @EmpresaId() empresaId: string) {
    return this.catalogoService.getItem(id, empresaId);
  }

  @Get('items/:id/components')
  async getItemComponents(
    @Param('id', ParseUUIDPipe) id: string,
    @EmpresaId() empresaId: string,
  ) {
    return this.catalogoService.getItemComponents(id, empresaId);
  }

  @Post('items')
  @Permissions(Permission.CRM_PRODUTOS_CREATE)
  async createItem(@EmpresaId() empresaId: string, @Body() payload: CreateCatalogItemDto) {
    return this.catalogoService.createItem(empresaId, payload);
  }

  @Put('items/:id')
  @Permissions(Permission.CRM_PRODUTOS_UPDATE)
  async updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @EmpresaId() empresaId: string,
    @Body() payload: UpdateCatalogItemDto,
  ) {
    return this.catalogoService.updateItem(id, empresaId, payload);
  }

  @Patch('items/:id/status')
  @Permissions(Permission.CRM_PRODUTOS_UPDATE)
  async updateItemStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @EmpresaId() empresaId: string,
    @Body() payload: UpdateCatalogItemStatusDto,
  ) {
    return this.catalogoService.updateStatus(id, empresaId, payload);
  }

  @Put('items/:id/components')
  @Permissions(Permission.CRM_PRODUTOS_UPDATE)
  async replaceItemComponents(
    @Param('id', ParseUUIDPipe) id: string,
    @EmpresaId() empresaId: string,
    @Body() payload: ReplaceCatalogItemComponentsDto,
  ) {
    return this.catalogoService.replaceItemComponents(id, empresaId, payload);
  }

  @Delete('items/:id')
  @Permissions(Permission.CRM_PRODUTOS_DELETE)
  async deleteItem(@Param('id', ParseUUIDPipe) id: string, @EmpresaId() empresaId: string) {
    return this.catalogoService.removeItem(id, empresaId);
  }

  @Get('templates')
  async listTemplates(
    @EmpresaId() empresaId: string,
    @Query() filtros: ListCatalogTemplatesDto,
  ) {
    return this.catalogoService.listTemplates(empresaId, filtros);
  }

  @Get('templates/:code')
  async getTemplate(@Param('code') code: string, @EmpresaId() empresaId: string) {
    return this.catalogoService.getTemplate(code, empresaId);
  }

  @Get('stats')
  async getStats(@EmpresaId() empresaId: string) {
    return this.catalogoService.getStats(empresaId);
  }
}
