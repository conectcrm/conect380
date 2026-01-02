import { Body, Controller, HttpException, HttpStatus, Logger, Post } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DlqReprocessService, FilaReprocessavel } from '../services/dlq-reprocess.service';

@Controller('api/atendimento/filas/dlq')
export class DlqController {
  private readonly logger = new Logger(DlqController.name);

  constructor(private readonly dlqService: DlqReprocessService) { }

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
  async reprocessar(@Body() body: { fila: FilaReprocessavel; limit?: number; filtros?: any; actor?: string }) {
    const { fila, limit, filtros, actor } = body || {};

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
        actor || null,
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
