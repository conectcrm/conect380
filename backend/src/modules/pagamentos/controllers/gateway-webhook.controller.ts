import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { SkipEmpresaValidation } from '../../../common/decorators/empresa.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { GatewayWebhookService } from '../services/gateway-webhook.service';

@Controller('pagamentos/gateways/webhooks')
export class GatewayWebhookController {
  constructor(private readonly gatewayWebhookService: GatewayWebhookService) {}

  @Public()
  @SkipEmpresaValidation()
  @HttpCode(HttpStatus.OK)
  @Post(':gateway/:empresaId')
  async receberWebhook(
    @Param('gateway') gateway: string,
    @Param('empresaId', ParseUUIDPipe) empresaId: string,
    @Body() body: Record<string, unknown>,
    @Headers('x-signature') signature: string,
    @Headers('x-request-id') requestId: string,
    @Headers('x-idempotency-key') idempotencyKey: string,
    @Headers('x-event-id') eventId: string,
  ) {
    return this.gatewayWebhookService.processarWebhook({
      gatewayParam: gateway,
      empresaId,
      payload: body || {},
      headers: {
        signature,
        requestId,
        idempotencyKey,
        eventId,
      },
    });
  }
}
