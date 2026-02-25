import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EmpresaId } from '../../common/decorators/empresa.decorator';
import { EmpresaGuard } from '../../common/guards/empresa.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AtividadeTipo } from './entities/user-activity.entity';
import { UserActivitiesService } from './services/user-activities.service';

@ApiTags('user-activities')
@Controller('users/atividades')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.USERS_READ)
export class UserActivitiesController {
  private readonly logger = new Logger(UserActivitiesController.name);

  constructor(private readonly userActivitiesService: UserActivitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Obter atividades de usuarios' })
  @ApiResponse({ status: 200, description: 'Atividades listadas com sucesso' })
  @ApiResponse({ status: 401, description: 'Nao autorizado' })
  async listarAtividades(@EmpresaId() empresaId: string, @Query('limit') limit: number) {
    this.logger.log(`Obtendo atividades para empresa ${empresaId}`);

    return this.userActivitiesService.listarAtividades(
      empresaId,
      limit ? parseInt(limit.toString(), 10) : 20,
    );
  }

  @Post('registrar')
  @Permissions(Permission.USERS_UPDATE)
  @ApiOperation({ summary: 'Registrar atividade de usuario' })
  @ApiResponse({ status: 201, description: 'Atividade registrada com sucesso' })
  @ApiResponse({ status: 401, description: 'Nao autorizado' })
  async registrarAtividade(
    @Request() req: any,
    @EmpresaId() empresaId: string,
    @Body()
    dadosAtividade: {
      tipo: AtividadeTipo;
      descricao: string;
      detalhes?: string;
    },
  ) {
    this.logger.log(`Registrando atividade: ${dadosAtividade.tipo}`);

    return this.userActivitiesService.registrarAtividade(
      req.user.id,
      empresaId,
      dadosAtividade.tipo,
      dadosAtividade.descricao,
      dadosAtividade.detalhes,
    );
  }
}
