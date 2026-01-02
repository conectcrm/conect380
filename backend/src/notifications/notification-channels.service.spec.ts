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

    await service.sendWhatsapp({ to: '5511999999999', message: 'teste', retryMeta });

    expect(mockProducer.enqueueSendWhatsapp).toHaveBeenCalledWith(
      { to: '5511999999999', message: 'teste', context: undefined },
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
    await expect(service.sendWhatsapp({ to: '   ', message: 'oi' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
