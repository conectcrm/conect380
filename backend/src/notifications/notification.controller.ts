import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { NotificationResponseDto } from './dto/notification.dto';
import { EmpresaGuard } from '../common/guards/empresa.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard, EmpresaGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * GET /notifications
   * Busca todas as notificações do usuário logado
   */
  @Get()
  async findAll(
    @Request() req,
    @Query('onlyUnread') onlyUnread?: string,
  ): Promise<NotificationResponseDto[]> {
    const userId = req.user.id;
    const unreadOnly = onlyUnread === 'true';

    const notifications = await this.notificationService.findByUser(userId, unreadOnly);

    return notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      data: n.data,
      createdAt: n.createdAt,
      readAt: n.readAt,
    }));
  }

  /**
   * GET /notifications/unread-count
   * Retorna o número de notificações não lidas
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req): Promise<{ count: number }> {
    const userId = req.user.id; // ✅ CORRIGIDO: era req.user.userId (undefined)
    const count = await this.notificationService.countUnread(userId);
    return { count };
  }

  /**
   * PUT /notifications/:id/read
   * Marca uma notificação específica como lida
   */
  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id') notificationId: string,
    @Request() req,
  ): Promise<NotificationResponseDto> {
    const userId = req.user.id; // ✅ CORRIGIDO: era req.user.userId (undefined)

    const notification = await this.notificationService.markAsRead(notificationId, userId);

    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      data: notification.data,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
    };
  }

  /**
   * PUT /notifications/mark-all-read
   * Marca todas as notificações do usuário como lidas
   */
  @Put('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Request() req): Promise<{ count: number }> {
    const userId = req.user.id; // ✅ CORRIGIDO: era req.user.userId (undefined)
    const count = await this.notificationService.markAllAsRead(userId);
    return { count };
  }

  /**
   * DELETE /notifications/:id
   * Remove uma notificação específica
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') notificationId: string, @Request() req): Promise<void> {
    const userId = req.user.id; // ✅ CORRIGIDO: era req.user.userId (undefined)
    await this.notificationService.delete(notificationId, userId);
  }

  /**
   * DELETE /notifications
   * Remove todas as notificações do usuário
   */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll(@Request() req): Promise<void> {
    const userId = req.user.id; // ✅ CORRIGIDO: era req.user.userId (undefined)
    await this.notificationService.deleteAll(userId);
  }
}
