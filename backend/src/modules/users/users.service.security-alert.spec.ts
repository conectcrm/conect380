import { UsersService } from './users.service';
import { UserRole } from './user.entity';
import { NotificationType } from '../../notifications/entities/notification.entity';

describe('UsersService - alerta de seguranca administrativo', () => {
  let service: UsersService;

  const userRepository = {
    find: jest.fn(),
  };

  const notificationService = {
    create: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new UsersService(
      userRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      notificationService as any,
    );
  });

  it('envia alerta somente para super admins, excluindo o ator da acao', async () => {
    userRepository.find.mockResolvedValue([
      {
        id: 'super-1',
        nome: 'Super 1',
        email: 'super1@acme.com',
        role: UserRole.SUPERADMIN,
      },
      {
        id: 'admin-1',
        nome: 'Admin 1',
        email: 'admin1@acme.com',
        role: UserRole.ADMIN,
      },
      {
        id: 'super-actor',
        nome: 'Super Actor',
        email: 'actor@acme.com',
        role: UserRole.SUPERADMIN,
      },
    ]);
    notificationService.create.mockResolvedValue({ id: 'notif-1' });

    await (service as any).notifyAdminsSecurityAlert({
      empresaId: 'empresa-1',
      event: 'privilege_escalation',
      severity: 'high',
      title: 'Alerta de seguranca: criacao de acesso privilegiado',
      message: 'Teste',
      actor: {
        id: 'super-actor',
        nome: 'Super Actor',
        email: 'actor@acme.com',
      },
      targetUser: {
        id: 'target-1',
        nome: 'Target',
        email: 'target@acme.com',
        role: UserRole.ADMIN,
      },
    });

    expect(notificationService.create).toHaveBeenCalledTimes(1);
    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        empresaId: 'empresa-1',
        userId: 'super-1',
        type: NotificationType.SISTEMA,
        title: 'Alerta de seguranca: criacao de acesso privilegiado',
      }),
    );
  });
});
