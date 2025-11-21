import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { TriagemLog, DirecaoTriagemLog } from '../entities/triagem-log.entity';

export interface RegistrarTriagemLogInput {
  empresaId: string;
  sessaoId?: string;
  fluxoId?: string;
  etapa?: string;
  direcao: DirecaoTriagemLog;
  canal?: string;
  tipo?: string;
  mensagem?: string;
  messageId?: string;
  payload?: Record<string, any>;
  metadata?: Record<string, any>;
  contextoSnapshot?: Record<string, any>;
}

@Injectable()
export class TriagemLogService {
  private readonly logger = new Logger(TriagemLogService.name);
  private missingTableWarned = false;

  constructor(
    @InjectRepository(TriagemLog)
    private readonly triagemLogRepository: Repository<TriagemLog>,
  ) {}

  async registrar(input: RegistrarTriagemLogInput): Promise<TriagemLog | null> {
    try {
      const registro = this.triagemLogRepository.create({
        empresaId: input.empresaId,
        sessaoId: input.sessaoId,
        fluxoId: input.fluxoId,
        etapa: input.etapa,
        direcao: input.direcao,
        canal: input.canal || 'whatsapp',
        tipo: input.tipo,
        mensagem: input.mensagem,
        messageId: input.messageId,
        payload: input.payload,
        metadata: input.metadata,
        contextoSnapshot: input.contextoSnapshot,
      });

      return await this.triagemLogRepository.save(registro);
    } catch (erro) {
      if (erro instanceof QueryFailedError && (erro as any)?.code === '42P01') {
        if (!this.missingTableWarned) {
          this.logger.warn(
            '⚠️ Tabela triagem_logs não encontrada. Pulando registro até que a migration seja executada.',
          );
          this.missingTableWarned = true;
        }
        return null;
      }

      this.logger.error(
        `Falha ao registrar log de triagem: ${erro instanceof Error ? erro.message : String(erro)}`,
      );
      throw erro;
    }
  }

  async registrarEntrada(
    params: Omit<RegistrarTriagemLogInput, 'direcao'>,
  ): Promise<TriagemLog | null> {
    return this.registrar({ ...params, direcao: 'entrada' });
  }

  async registrarSaida(
    params: Omit<RegistrarTriagemLogInput, 'direcao'>,
  ): Promise<TriagemLog | null> {
    return this.registrar({ ...params, direcao: 'saida' });
  }

  async registrarSistema(
    params: Omit<RegistrarTriagemLogInput, 'direcao'>,
  ): Promise<TriagemLog | null> {
    return this.registrar({ ...params, direcao: 'sistema' });
  }

  async listarPorSessao(empresaId: string, sessaoId: string, limite = 100): Promise<TriagemLog[]> {
    return this.triagemLogRepository.find({
      where: { empresaId, sessaoId },
      order: { createdAt: 'DESC' },
      take: limite,
    });
  }
}
