import { Body, Controller, Headers, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { SkipEmpresaValidation } from '../../common/decorators/empresa.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { DocumentoFiscalService } from './services/documento-fiscal.service';

@Controller('faturamento/documento-fiscal/webhooks')
export class FaturamentoWebhookController {
  constructor(private readonly documentoFiscalService: DocumentoFiscalService) {}

  @Public()
  @SkipEmpresaValidation()
  @HttpCode(HttpStatus.OK)
  @Post('oficial/:empresaId')
  async receberWebhookFiscalOficial(
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Body() body: Record<string, unknown>,
    @Headers('x-signature') signature: string,
    @Headers('x-request-id') requestId: string,
    @Headers('x-idempotency-key') idempotencyKey: string,
    @Headers('x-event-id') eventId: string,
    @Headers('x-correlation-id') correlationId: string,
  ) {
    return this.documentoFiscalService.processarWebhookProviderOficial({
      empresaId,
      payload: body || {},
      headers: {
        signature,
        requestId,
        idempotencyKey,
        eventId,
        correlationId,
      },
    });
  }
}

