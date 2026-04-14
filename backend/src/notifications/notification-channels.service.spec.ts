import { BadRequestException } from '@nestjs/common';
import { NotificationChannelsService } from './notification-channels.service';
import { NotificationsQueueProducer, NotificationRetryMeta } from './notifications.queue-producer';

describe('NotificationChannelsService', () => {
  const mockProducer: jest.Mocked<NotificationsQueueProducer> = {
    enqueueSendWhatsapp: jest.fn(),
    enqueueSendSms: jest.fn(),
    enqueueSendPush: jest.fn(),
    enqueueSendEmail: jest.fn(),
    enqueueNotifyUser: jest.fn(),
    enqueueNotification: jest.fn(),
    enqueue: jest.fn(),
  } as any;

  let service: NotificationChannelsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationChannelsService(mockProducer);
  });

  it('deve encaminhar retryMeta no WhatsApp', async () => {
    const retryMeta: NotificationRetryMeta = { statusCode: 429, retryAfterMs: 5000 };

    await service.sendWhatsapp({
      to: '5511999999999',
      message: 'teste',
      empresaId: 'empresa-1',
      retryMeta,
    });

    expect(mockProducer.enqueueSendWhatsapp).toHaveBeenCalledWith(
      { to: '5511999999999', message: 'teste', empresaId: 'empresa-1', context: undefined },
      retryMeta,
    );
  });

  it('deve encaminhar retryMeta no SMS', async () => {
    const retryMeta: NotificationRetryMeta = { statusCode: 503 };

    await service.sendSms({ to: '5511888888888', message: 'sms', retryMeta });

    expect(mockProducer.enqueueSendSms).toHaveBeenCalledWith(
      { to: '5511888888888', message: 'sms', context: undefined },
      retryMeta,
    );
  });

  it('deve lançar erro se destino estiver vazio', async () => {
    await expect(
      service.sendWhatsapp({ to: '   ', message: 'oi', empresaId: 'empresa-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve lançar erro se empresaId estiver ausente no WhatsApp', async () => {
    await expect(
      service.sendWhatsapp({ to: '5511999999999', message: 'oi', empresaId: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
