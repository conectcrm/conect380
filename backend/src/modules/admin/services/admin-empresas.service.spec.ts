import { Empresa } from '../../../empresas/entities/empresa.entity';
import { UserRole } from '../../users/user.entity';
import { AdminEmpresasService } from './admin-empresas.service';

describe('AdminEmpresasService - notificacoes de status', () => {
  let service: AdminEmpresasService;

  const empresaRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const userRepository = {
    find: jest.fn(),
  };

  const moduloEmpresaRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const historicoPlanoRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mailService = {
    enviarEmailStatusEmpresa: jest.fn(),
  };

  const buildEmpresa = (): Empresa =>
    ({
      id: 'empresa-1',
      nome: 'Acme Ltda',
      email: 'contato@acme.com',
      status: 'active',
      ativo: true,
      notas_internas: '',
    }) as Empresa;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AdminEmpresasService(
      empresaRepository as any,
      userRepository as any,
      moduloEmpresaRepository as any,
      historicoPlanoRepository as any,
      {} as any,
      {} as any,
      {} as any,
      mailService as any,
    );
  });

  it('envia email ao suspender empresa para emails administrativos', async () => {
    const empresa = buildEmpresa();
    empresaRepository.findOne.mockResolvedValue(empresa);
    empresaRepository.save.mockResolvedValue(empresa);
    userRepository.find.mockResolvedValue([
      { email: 'ADMIN@acme.com', role: UserRole.ADMIN, ativo: true },
      { email: 'gerente@acme.com', role: UserRole.GERENTE, ativo: true },
      { email: 'vendedor@acme.com', role: UserRole.VENDEDOR, ativo: true },
      { email: 'email-invalido', role: UserRole.ADMIN, ativo: true },
    ]);
    mailService.enviarEmailStatusEmpresa.mockResolvedValue(undefined);

    const result = await service.suspender('empresa-1', 'inadimplencia recorrente');

    expect(result.message).toBe('Empresa suspensa com sucesso');
    expect(empresa.status).toBe('suspended');
    expect(empresa.ativo).toBe(false);
    expect(mailService.enviarEmailStatusEmpresa).toHaveBeenCalledTimes(1);
    expect(mailService.enviarEmailStatusEmpresa).toHaveBeenCalledWith(
      expect.objectContaining({
        empresa: 'Acme Ltda',
        status: 'suspended',
        reason: 'inadimplencia recorrente',
      }),
    );

    const recipients = mailService.enviarEmailStatusEmpresa.mock.calls[0][0].to as string[];
    expect(recipients).toEqual(
      expect.arrayContaining(['contato@acme.com', 'admin@acme.com', 'gerente@acme.com']),
    );
    expect(recipients).not.toEqual(expect.arrayContaining(['vendedor@acme.com', 'email-invalido']));
  });

  it('envia email ao reativar empresa', async () => {
    const empresa = buildEmpresa();
    empresa.status = 'suspended';
    empresa.ativo = false;

    empresaRepository.findOne.mockResolvedValue(empresa);
    empresaRepository.save.mockResolvedValue(empresa);
    userRepository.find.mockResolvedValue([
      { email: 'admin@acme.com', role: UserRole.ADMIN, ativo: true },
    ]);
    mailService.enviarEmailStatusEmpresa.mockResolvedValue(undefined);

    const result = await service.reativar('empresa-1');

    expect(result.message).toBe('Empresa reativada com sucesso');
    expect(empresa.status).toBe('active');
    expect(empresa.ativo).toBe(true);
    expect(mailService.enviarEmailStatusEmpresa).toHaveBeenCalledWith(
      expect.objectContaining({
        empresa: 'Acme Ltda',
        status: 'active',
      }),
    );
  });

  it('nao falha a operacao quando envio de email retorna erro', async () => {
    const empresa = buildEmpresa();

    empresaRepository.findOne.mockResolvedValue(empresa);
    empresaRepository.save.mockResolvedValue(empresa);
    userRepository.find.mockResolvedValue([
      { email: 'admin@acme.com', role: UserRole.ADMIN, ativo: true },
    ]);
    mailService.enviarEmailStatusEmpresa.mockRejectedValue(new Error('smtp offline'));

    await expect(service.suspender('empresa-1', 'inadimplencia')).resolves.toMatchObject({
      message: 'Empresa suspensa com sucesso',
    });
    expect(empresaRepository.save).toHaveBeenCalledTimes(1);
    expect(mailService.enviarEmailStatusEmpresa).toHaveBeenCalledTimes(1);
  });
});

