import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DlqReprocessService, FilaReprocessavel } from '../services/dlq-reprocess.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { UserRole } from '../../users/user.entity';

@Controller('api/atendimento/filas/dlq')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
@Permissions(Permission.ATENDIMENTO_DLQ_MANAGE)
export class DlqController {
  private readonly logger = new Logger(DlqController.name);

  constructor(private readonly dlqService: DlqReprocessService) {}

  @Post('status')
  async status(@Body() body: { fila?: FilaReprocessavel }) {
    try {
      const data = await this.dlqService.status(body?.fila);
      return { success: true, data };
    } catch (error: any) {
      this.logger.error(`Erro ao consultar status DLQ: ${error?.message || error}`);
      throw new HttpException(
        { success: false, message: 'Erro ao consultar status DLQ', erro: error?.message || error },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('reprocessar')
  async reprocessar(
    @Req() req: any,
    @Body() body: { fila: FilaReprocessavel; limit?: number; filtros?: any },
  ) {
    const { fila, limit, filtros } = body || {};
    const actor = req?.user?.id || req?.user?.email || req?.user?.sub || null;

    if (!fila) {
      throw new HttpException(
        { success: false, message: 'Campo obrigatório: fila' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const actionId = randomUUID();
      const resultado = await this.dlqService.reprocessar(
        fila,
        limit ?? 50,
        filtros ?? {},
        actor,
        actionId,
      );
      this.logger.log(
        `DLQ ${fila}: actionId=${actionId}, actor=${actor || 'n/a'}, filtrados ${resultado.totalFiltrados}, reprocessados ${resultado.reprocessados}/${resultado.totalSelecionados} (ignoradoSemJobName=${resultado.ignoradosSemJobName}, ignoradoSemPayload=${resultado.ignoradosSemPayload}, ignoradoJobNameInvalido=${resultado.ignoradosJobNameInvalido}, ignoradoMaxAttempt=${resultado.ignoradosMaxAttempt})`,
      );

      return {
        success: true,
        data: { actionId, actor: actor || null, ...resultado },
      };
    } catch (error: any) {
      this.logger.error(`Erro ao reprocessar DLQ ${fila}: ${error?.message || error}`);
      throw new HttpException(
        { success: false, message: 'Erro ao reprocessar DLQ', erro: error?.message || error },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
