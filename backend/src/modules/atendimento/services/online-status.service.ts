import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contato } from '../../clientes/contato.entity';
import { Ticket } from '../entities/ticket.entity';

/**
 * 🟢 OnlineStatusService - Gerencia status online/offline dos contatos
 *
 * Lógica:
 * - Online: última atividade < 5 minutos
 * - Offline: última atividade >= 5 minutos ou null
 * - Auto-update: atualiza a cada mensagem recebida/enviada
 */
@Injectable()
export class OnlineStatusService {
  // Constantes configuráveis
  private readonly ONLINE_THRESHOLD_MINUTES = 5;
  private readonly OFFLINE_THRESHOLD_MINUTES = 30; // Para limpar cache

  constructor(
    @InjectRepository(Contato)
    private readonly contatoRepository: Repository<Contato>,

    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  /**
   * 📋 Busca dados de atividade de um contato
   */
  async getContactActivityData(contatoId: number): Promise<{ last_activity: Date | null } | null> {
    try {
      const result = await this.contatoRepository.query(
        `
        SELECT last_activity 
        FROM contatos 
        WHERE id = $1
      `,
        [contatoId],
      );

      return result[0] || null;
    } catch (error) {
      console.error('❌ Erro ao buscar dados de atividade do contato:', error);
      return null;
    }
  }

  /**
   * 📞 Busca contato pelo telefone
   */
  async findContactByPhone(telefone: string): Promise<{ id: number } | null> {
    try {
      const result = await this.contatoRepository.query(
        `
        SELECT id 
        FROM contatos 
        WHERE telefone = $1
      `,
        [telefone],
      );

      return result[0] || null;
    } catch (error) {
      console.error('❌ Erro ao buscar contato por telefone:', error);
      return null;
    }
  }

  /**
   * 📊 Calcula se um contato está online baseado na última atividade
   */
  calculateOnlineStatus(lastActivity: Date | null): boolean {
    if (!lastActivity) return false;

    const now = new Date();
    const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);

    return diffMinutes < this.ONLINE_THRESHOLD_MINUTES;
  }

  /**
   * 🔄 Atualiza última atividade de um contato
   */
  async updateContactActivity(
    contatoId: string,
    empresaId: string,
    activity?: Date,
  ): Promise<void> {
    const now = activity || new Date();
    const isOnline = this.calculateOnlineStatus(now);

    try {
      // Atualizar tabela de contatos
      await this.contatoRepository.query(
        `
        UPDATE contatos 
        SET last_activity = $1, 
            online_status = $2,
            "updatedAt" = $1
        WHERE id = $3
      `,
        [now, isOnline, contatoId],
      );

      // Atualizar cache em tickets ativos
      await this.ticketRepository.query(
        `
        UPDATE atendimento_tickets 
        SET contato_online = $1,
            contato_last_activity = $2
        WHERE (contato_dados->>'id' = $3 OR "clienteId" = $3)
          AND status IN ('aberto', 'pendente')
          AND empresa_id = $4
      `,
        [isOnline, now, contatoId, empresaId],
      );

      console.log(`✅ Atividade atualizada - Contato: ${contatoId}, Online: ${isOnline}`);
    } catch (error) {
      console.error('❌ Erro ao atualizar atividade do contato:', error);
    }
  }

  /**
   * 📱 Atualiza atividade baseada em mensagem recebida
   */
  async updateActivityFromMessage(
    telefone: string,
    empresaId: string,
    messageTimestamp?: Date,
  ): Promise<void> {
    const timestamp = messageTimestamp || new Date();

    try {
      // Buscar contato pelo telefone
      const contato = await this.contatoRepository.query(
        `
        SELECT c.id, c.nome, c.telefone
        FROM contatos c
        INNER JOIN clientes cl ON c."clienteId" = cl.id
        WHERE c.telefone = $1 AND cl.empresa_id = $2
        LIMIT 1
      `,
        [telefone, empresaId],
      );

      if (contato.length > 0) {
        await this.updateContactActivity(contato[0].id, empresaId, timestamp);
      } else {
        // Se não encontrou contato específico, tentar atualizar por tickets
        await this.updateActivityFromTicket(telefone, empresaId, timestamp);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar atividade por mensagem:', error);
    }
  }

  /**
   * 🎫 Atualiza atividade baseada em ticket
   */
  async updateActivityFromTicket(
    telefone: string,
    empresaId: string,
    timestamp?: Date,
  ): Promise<void> {
    const now = timestamp || new Date();
    const isOnline = this.calculateOnlineStatus(now);

    try {
      await this.ticketRepository.query(
        `
        UPDATE atendimento_tickets 
        SET contato_online = $1,
            contato_last_activity = $2
        WHERE contato_telefone = $3
          AND empresa_id = $4
          AND status IN ('aberto', 'pendente')
      `,
        [isOnline, now, telefone, empresaId],
      );

      console.log(`✅ Atividade do ticket atualizada - Telefone: ${telefone}, Online: ${isOnline}`);
    } catch (error) {
      console.error('❌ Erro ao atualizar atividade do ticket:', error);
    }
  }

  /**
   * 👥 Busca status online de múltiplos contatos
   */
  async getBulkOnlineStatus(contatoIds: string[]): Promise<Map<string, boolean>> {
    const statusMap = new Map<string, boolean>();

    if (contatoIds.length === 0) return statusMap;

    try {
      const results = await this.contatoRepository.query(
        `
        SELECT id, last_activity, online_status
        FROM contatos 
        WHERE id = ANY($1)
      `,
        [contatoIds],
      );

      results.forEach((contato: any) => {
        const isOnline = this.calculateOnlineStatus(contato.last_activity);
        statusMap.set(contato.id, isOnline);
      });

      return statusMap;
    } catch (error) {
      console.error('❌ Erro ao buscar status em lote:', error);
      return statusMap;
    }
  }

  /**
   * 🔄 Job para limpar status antigos (executar periodicamente)
   */
  async cleanupOldStatuses(): Promise<void> {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - this.OFFLINE_THRESHOLD_MINUTES);

    try {
      // Marcar contatos antigos como offline
      const result = await this.contatoRepository.query(
        `
        UPDATE contatos 
        SET online_status = FALSE
        WHERE last_activity < $1 
          AND online_status = TRUE
      `,
        [cutoffTime],
      );

      // Atualizar cache em tickets
      await this.ticketRepository.query(
        `
        UPDATE atendimento_tickets 
        SET contato_online = FALSE
        WHERE contato_last_activity < $1 
          AND contato_online = TRUE
          AND status IN ('aberto', 'pendente')
      `,
        [cutoffTime],
      );

      console.log(
        `🧹 Cleanup realizado - ${result.affectedRows || 0} contatos marcados como offline`,
      );
    } catch (error) {
      console.error('❌ Erro no cleanup de status:', error);
    }
  }

  /**
   * 📊 Estatísticas de status online
   */
  async getOnlineStats(empresaId: string): Promise<{
    total: number;
    online: number;
    offline: number;
    percentage: number;
  }> {
    try {
      const stats = await this.contatoRepository.query(
        `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN online_status = true THEN 1 END) as online,
          COUNT(CASE WHEN online_status = false OR online_status IS NULL THEN 1 END) as offline
        FROM contatos c
        INNER JOIN clientes cl ON c."clienteId" = cl.id
        WHERE cl.empresa_id = $1 AND c.ativo = true
      `,
        [empresaId],
      );

      const result = stats[0];
      const percentage = result.total > 0 ? (result.online / result.total) * 100 : 0;

      return {
        total: parseInt(result.total),
        online: parseInt(result.online),
        offline: parseInt(result.offline),
        percentage: Math.round(percentage * 100) / 100,
      };
    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      return { total: 0, online: 0, offline: 0, percentage: 0 };
    }
  }
}
