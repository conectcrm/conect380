import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) { }

  /**
   * Cria uma nova notificação
   */
  async create(data: CreateNotificationDto): Promise<Notification> {
    try {
      this.logger.log(`\n${'🔔'.repeat(30)}`);
      this.logger.log(`📬 CRIANDO NOTIFICAÇÃO NO BANCO DE DADOS`);
      this.logger.log(`   Título: ${data.title}`);
      this.logger.log(`   Destinatário (userId): ${data.userId}`);
      this.logger.log(`   Tipo: ${data.type}`);
      this.logger.log(`${'🔔'.repeat(30)}\n`);

      const notification = this.notificationRepository.create({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
        read: false,
      });

      const saved = await this.notificationRepository.save(notification);

      this.logger.log(`✅ Notificação salva com ID: ${saved.id} para userId: ${saved.userId}`);

      return saved;
    } catch (error) {
      this.logger.error(`❌ Erro ao criar notificação:`, error);
      throw error;
    }
  }

  /**
   * Busca todas as notificações de um usuário
   */
  async findByUser(userId: string, onlyUnread = false): Promise<Notification[]> {
    try {
      const where: any = { userId };

      if (onlyUnread) {
        where.read = false;
      }

      const notifications = await this.notificationRepository.find({
        where,
        order: { createdAt: 'DESC' },
        take: 50, // Limitar a 50 notificações mais recentes
      });

      this.logger.log(
        `🔍 Encontradas ${notifications.length} notificações para usuário ${userId} (${onlyUnread ? 'não lidas' : 'todas'})`,
      );

      return notifications;
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar notificações:`, error);
      throw error;
    }
  }

  /**
   * Conta notificações não lidas de um usuário
   */
  async countUnread(userId: string): Promise<number> {
    try {
      const count = await this.notificationRepository.count({
        where: { userId, read: false },
      });

      return count;
    } catch (error) {
      this.logger.error(`❌ Erro ao contar notificações não lidas:`, error);
      throw error;
    }
  }

  /**
   * Marca uma notificação como lida
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    try {
      const notification = await this.notificationRepository.findOne({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new NotFoundException('Notificação não encontrada');
      }

      if (!notification.read) {
        notification.read = true;
        notification.readAt = new Date();
        await this.notificationRepository.save(notification);

        this.logger.log(`✅ Notificação ${notificationId} marcada como lida`);
      }

      return notification;
    } catch (error) {
      this.logger.error(`❌ Erro ao marcar notificação como lida:`, error);
      throw error;
    }
  }

  /**
   * Marca todas as notificações de um usuário como lidas
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await this.notificationRepository.update(
        { userId, read: false },
        { read: true, readAt: new Date() },
      );

      const count = result.affected || 0;

      this.logger.log(`✅ ${count} notificações marcadas como lidas para usuário ${userId}`);

      return count;
    } catch (error) {
      this.logger.error(`❌ Erro ao marcar todas notificações como lidas:`, error);
      throw error;
    }
  }

  /**
   * Deleta notificações antigas (mais de 30 dias)
   */
  async deleteOld(days = 30): Promise<number> {
    try {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      const result = await this.notificationRepository
        .createQueryBuilder()
        .delete()
        .where('created_at < :dateLimit', { dateLimit })
        .andWhere('read = :read', { read: true })
        .execute();

      const count = result.affected || 0;

      this.logger.log(`🗑️ ${count} notificações antigas deletadas`);

      return count;
    } catch (error) {
      this.logger.error(`❌ Erro ao deletar notificações antigas:`, error);
      throw error;
    }
  }

  /**
   * Deleta uma notificação específica
   */
  async delete(notificationId: string, userId: string): Promise<void> {
    try {
      const notification = await this.notificationRepository.findOne({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new NotFoundException(`Notificação ${notificationId} não encontrada`);
      }

      await this.notificationRepository.remove(notification);

      this.logger.log(`🗑️ Notificação ${notificationId} deletada pelo usuário ${userId}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao deletar notificação ${notificationId}:`, error);
      throw error;
    }
  }

  /**
   * Deleta todas as notificações de um usuário
   */
  async deleteAll(userId: string): Promise<number> {
    try {
      const result = await this.notificationRepository
        .createQueryBuilder()
        .delete()
        .where('user_id = :userId', { userId })
        .execute();

      const count = result.affected || 0;

      this.logger.log(`🗑️ ${count} notificações deletadas do usuário ${userId}`);

      return count;
    } catch (error) {
      this.logger.error(`❌ Erro ao deletar notificações do usuário ${userId}:`, error);
      throw error;
    }
  }
}
