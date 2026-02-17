import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { WhatsAppSenderService } from '../services/whatsapp-sender.service';
import { MensagemService } from '../services/mensagem.service';
import { mensagemLatenciaHistogram } from '../../../config/metrics';
import { runWithTenant } from '../../../common/tenant/tenant-context';

interface WaSendJobData {
  empresaId: string;
  para: string;
  mensagem: string;
  mensagemId?: string;
  ticketId?: string;
}

@Processor('messages-out')
export class MessagesOutProcessor {
  private readonly logger = new Logger(MessagesOutProcessor.name);

  constructor(
    private readonly waSender: WhatsAppSenderService,
    private readonly mensagemService: MensagemService,
  ) {}

  @Process('wa-send-text')
  async handle(job: Job<WaSendJobData>) {
    const { empresaId, para, mensagem } = job.data;
    const start = Date.now();

    try {
      await runWithTenant(empresaId, async () => {
        const result = await this.waSender.enviarMensagem(empresaId, para, mensagem);

        if (!result.sucesso) {
          throw new Error(result.erro || 'Falha ao enviar mensagem');
        }

        mensagemLatenciaHistogram.observe(
          { empresaId, canalId: 'whatsapp' },
          (Date.now() - start) / 1000,
        );
        this.logger.debug(`Mensagem enviada (job ${job.id}) -> ${result.messageId || 'sem id'}`);

        // Atualiza o registro da mensagem com o ID definitivo retornado pelo provedor
        if (result.messageId && job.data.mensagemId) {
          try {
            await this.mensagemService.atualizarIdExterno(job.data.mensagemId, result.messageId);
          } catch (updateError: any) {
            this.logger.warn(
              `Não foi possível atualizar idExterno para mensagem ${job.data.mensagemId}: ${updateError?.message || updateError}`,
            );
          }
        }
      });
    } catch (error: any) {
      this.logger.error(`Erro ao enviar (job ${job.id}): ${error?.message}`);
      throw error;
    }
  }
}
