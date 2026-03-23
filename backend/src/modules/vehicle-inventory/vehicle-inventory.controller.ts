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
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateVehicleInventoryItemDto,
  ListVehicleInventoryItemsDto,
  RestoreVehicleInventoryItemDto,
  UpdateVehicleInventoryItemDto,
  UpdateVehicleInventoryStatusDto,
} from './dto/vehicle-inventory.dto';
import { VehicleInventoryService } from './vehicle-inventory.service';

@Controller('vehicle-inventory')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.CRM_PRODUTOS_READ)
export class VehicleInventoryController {
  constructor(private readonly vehicleInventoryService: VehicleInventoryService) {}

  @Get('items')
  async listItems(
    @EmpresaId() empresaId: string,
    @Query() filtros: ListVehicleInventoryItemsDto,
  ) {
    return this.vehicleInventoryService.listItems(empresaId, filtros);
  }

  @Get('items/:id')
  async getItem(@Param('id', ParseUUIDPipe) id: string, @EmpresaId() empresaId: string) {
    return this.vehicleInventoryService.getItem(id, empresaId);
  }

  @Post('items')
  @Permissions(Permission.CRM_PRODUTOS_CREATE)
  async createItem(
    @EmpresaId() empresaId: string,
    @Body() payload: CreateVehicleInventoryItemDto,
  ) {
    return this.vehicleInventoryService.createItem(empresaId, payload);
  }

  @Put('items/:id')
  @Permissions(Permission.CRM_PRODUTOS_UPDATE)
  async updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @EmpresaId() empresaId: string,
    @Body() payload: UpdateVehicleInventoryItemDto,
  ) {
    return this.vehicleInventoryService.updateItem(id, empresaId, payload);
  }

  @Patch('items/:id/status')
  @Permissions(Permission.CRM_PRODUTOS_UPDATE)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @EmpresaId() empresaId: string,
    @Body() payload: UpdateVehicleInventoryStatusDto,
  ) {
    return this.vehicleInventoryService.updateStatus(id, empresaId, payload);
  }

  @Patch('items/:id/restore')
  @Permissions(Permission.CRM_PRODUTOS_UPDATE)
  async restoreItem(
    @Param('id', ParseUUIDPipe) id: string,
    @EmpresaId() empresaId: string,
    @Body() payload: RestoreVehicleInventoryItemDto,
  ) {
    return this.vehicleInventoryService.restoreItem(id, empresaId, payload);
  }

  @Delete('items/:id')
  @Permissions(Permission.CRM_PRODUTOS_DELETE)
  async deleteItem(@Param('id', ParseUUIDPipe) id: string, @EmpresaId() empresaId: string) {
    return this.vehicleInventoryService.removeItem(id, empresaId);
  }

  @Get('stats')
  async getStats(@EmpresaId() empresaId: string) {
    return this.vehicleInventoryService.getStats(empresaId);
  }
}
