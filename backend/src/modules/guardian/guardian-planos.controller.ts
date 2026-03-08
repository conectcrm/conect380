import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/permissions/permissions.constants';
import { UserRole } from '../users/user.entity';
import { GuardianMfaGuard } from './guardian-mfa.guard';
import { GuardianCriticalAuditInterceptor } from './interceptors/guardian-critical-audit.interceptor';
import { PlanosService } from '../planos/planos.service';
import { CriarPlanoDto } from '../planos/dto/criar-plano.dto';
import { AtualizarPlanoDto } from '../planos/dto/atualizar-plano.dto';

@Controller('guardian/planos')
@UseGuards(JwtAuthGuard, GuardianMfaGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(GuardianCriticalAuditInterceptor)
@Roles(UserRole.SUPERADMIN)
@Permissions(Permission.PLANOS_MANAGE)
export class GuardianPlanosController {
  constructor(private readonly planosService: PlanosService) {}

  @Get()
  async listarTodos(@Query('include_inactive') includeInactive?: string) {
    return this.planosService.listarTodos(this.parseIncludeInactive(includeInactive));
  }

  @Get('modulos')
  async listarModulosDisponiveis() {
    return this.planosService.listarModulosDisponiveis();
  }

  @Get('codigo/:codigo')
  async buscarPorCodigo(@Param('codigo') codigo: string) {
    return this.planosService.buscarPorCodigo(codigo);
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string) {
    return this.planosService.buscarPorId(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async criar(@Body() dados: CriarPlanoDto) {
    return this.planosService.criar(dados);
  }

  @Put(':id')
  async atualizar(@Param('id') id: string, @Body() dados: AtualizarPlanoDto) {
    return this.planosService.atualizar(id, dados);
  }

  @Delete(':id')
  async remover(@Param('id') id: string) {
    await this.planosService.remover(id);
    return { message: 'Plano removido com sucesso' };
  }

  @Put(':id/desativar')
  async desativar(@Param('id') id: string) {
    return this.planosService.desativar(id);
  }

  @Put(':id/ativar')
  async ativar(@Param('id') id: string) {
    return this.planosService.ativar(id);
  }

  @Put(':id/toggle-status')
  async toggleStatus(@Param('id') id: string) {
    const planoAtual = await this.planosService.buscarPorId(id);
    if (!planoAtual) {
      throw new NotFoundException('Plano nao encontrado');
    }

    return planoAtual.ativo
      ? this.planosService.desativar(id)
      : this.planosService.ativar(id);
  }

  private parseIncludeInactive(raw: string | undefined): boolean {
    if (raw === undefined) {
      return true;
    }

    const normalized = raw.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }

    if (normalized === 'false' || normalized === '0') {
      return false;
    }

    throw new BadRequestException('Parametro include_inactive invalido');
  }
}
