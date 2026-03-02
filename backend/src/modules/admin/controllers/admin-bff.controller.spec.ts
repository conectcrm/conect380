import { BadRequestException } from '@nestjs/common';
import { AtividadeTipo } from '../../users/entities/user-activity.entity';
import { UserRole } from '../../users/user.entity';
import { AdminBffController } from './admin-bff.controller';

describe('AdminBffController', () => {
  const adminBffServiceMock = {
    getOverview: jest.fn(),
    listUsers: jest.fn(),
    listAccessChangeRequests: jest.fn(),
    approveAccessChangeRequest: jest.fn(),
    rejectAccessChangeRequest: jest.fn(),
    listBreakGlassRequests: jest.fn(),
    requestBreakGlassAccess: jest.fn(),
    approveBreakGlassRequest: jest.fn(),
    rejectBreakGlassRequest: jest.fn(),
    listActiveBreakGlassAccesses: jest.fn(),
    revokeBreakGlassAccess: jest.fn(),
    generateAccessReviewReport: jest.fn(),
    recertifyAccess: jest.fn(),
    listCompanies: jest.fn(),
    listAuditActivities: jest.fn(),
  };

  const actor = {
    id: 'user-admin',
    nome: 'Admin Teste',
    email: 'admin@conect360.local',
    role: UserRole.ADMIN,
    empresa_id: 'empresa-1',
  } as any;

  let controller: AdminBffController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AdminBffController(adminBffServiceMock as any);
  });

  it('rejeita status invalido na fila de aprovacao', async () => {
    await expect(controller.listAccessChangeRequests(actor, 'invalid', undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejeita tipo invalido na trilha de auditoria', async () => {
    await expect(
      controller.listAuditActivities(actor, undefined, undefined, 'desconhecido'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejeita recertificacao sem target_user_id', async () => {
    await expect(
      controller.recertifyAccess(actor, { approved: true }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejeita recertificacao reprovada sem reason', async () => {
    await expect(
      controller.recertifyAccess(actor, {
        target_user_id: 'user-2',
        approved: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('normaliza filtros de usuarios e delega ao service', async () => {
    adminBffServiceMock.listUsers.mockResolvedValue({
      items: [],
      total: 0,
      pagina: 2,
      limite: 15,
    });

    await controller.listUsers(actor, 'ana', 'vendedor', 'true', 'nome', 'desc', '15', '2');

    expect(adminBffServiceMock.listUsers).toHaveBeenCalledWith(actor, {
      busca: 'ana',
      role: 'vendedor',
      ativo: true,
      ordenacao: 'nome',
      direcao: 'desc',
      limite: 15,
      pagina: 2,
    });
  });

  it('normaliza filtros da trilha administrativa e delega ao service', async () => {
    adminBffServiceMock.listAuditActivities.mockResolvedValue([]);

    await controller.listAuditActivities(
      actor,
      '40',
      'user-2',
      'edicao',
      '2026-01-01',
      '2026-01-31',
      'false',
    );

    expect(adminBffServiceMock.listAuditActivities).toHaveBeenCalledWith(actor, {
      limit: 40,
      usuarioId: 'user-2',
      tipo: AtividadeTipo.EDICAO,
      dataInicio: '2026-01-01',
      dataFim: '2026-01-31',
      adminOnly: false,
    });
  });

  it('rejeita solicitacao break-glass sem reason', async () => {
    await expect(
      controller.requestBreakGlassAccess(actor, {
        target_user_id: 'user-2',
        permissions: ['users.update'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('normaliza payload de solicitacao break-glass e delega ao service', async () => {
    adminBffServiceMock.requestBreakGlassAccess.mockResolvedValue({
      id: 'req-1',
      status: 'REQUESTED',
    });

    await controller.requestBreakGlassAccess(actor, {
      target_user_id: 'user-2',
      permissions: 'users.update, admin.empresas.manage',
      duration_minutes: 25,
      reason: 'Cobertura emergencial do turno',
    });

    expect(adminBffServiceMock.requestBreakGlassAccess).toHaveBeenCalledWith(actor, {
      targetUserId: 'user-2',
      scopePermissions: ['users.update', 'admin.empresas.manage'],
      durationMinutes: 25,
      reason: 'Cobertura emergencial do turno',
    });
  });
});
