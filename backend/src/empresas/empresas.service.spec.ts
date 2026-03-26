import { EmpresasService } from './empresas.service';

describe('EmpresasService - normalizacao em atualizarEmpresa', () => {
  let service: EmpresasService;

  const empresaRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const userRepository = {
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const clienteRepository = {
    count: jest.fn(),
  };

  const featureFlagTenantRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mailService = {};
  const empresaModuloService = {};
  const planosService = {
    listarTodos: jest.fn(),
  };
  const assinaturasService = {};

  beforeEach(() => {
    jest.clearAllMocks();

    service = new EmpresasService(
      empresaRepository as any,
      userRepository as any,
      clienteRepository as any,
      featureFlagTenantRepository as any,
      mailService as any,
      empresaModuloService as any,
      planosService as any,
      assinaturasService as any,
    );
  });

  it('normaliza nome, endereco e cidade no update da empresa', async () => {
    const empresa = {
      id: 'empresa-1',
      nome: 'Empresa Base',
      slug: 'empresa-base',
      cnpj: '12345678000195',
      email: 'contato@empresa.com',
      telefone: '11999990000',
      endereco: 'Rua A',
      cidade: 'Sao Paulo',
      estado: 'SP',
      cep: '01001000',
    };

    empresaRepository.findOne.mockResolvedValue(empresa);
    empresaRepository.save.mockImplementation(async (payload: any) => payload);

    await service.atualizarEmpresa('empresa-1', {
      nome: '  Nova   Empresa   Nome  ',
      endereco: '  Av.   Paulista,   1000  ',
      cidade: '  Belo   Horizonte  ',
    } as any);

    expect(empresaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Nova Empresa Nome',
        endereco: 'Av. Paulista, 1000',
        cidade: 'Belo Horizonte',
      }),
    );
  });

  it('normaliza slug quando enviado no payload de update', async () => {
    const empresa = {
      id: 'empresa-1',
      nome: 'Empresa Base',
      slug: 'empresa-base',
      cnpj: '12345678000195',
      email: 'contato@empresa.com',
      telefone: '11999990000',
      endereco: 'Rua A',
      cidade: 'Sao Paulo',
      estado: 'SP',
      cep: '01001000',
    };

    empresaRepository.findOne.mockResolvedValue(empresa);
    empresaRepository.save.mockImplementation(async (payload: any) => payload);

    await service.atualizarEmpresa('empresa-1', {
      slug: '  Meu   Slug   Especial  ',
    } as any);

    expect(empresaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'meu-slug-especial',
      }),
    );
  });

  it('aceita token recente de verificacao mesmo quando a empresa e antiga', async () => {
    const tokenRecente = `${Date.now().toString(36)}.${'a'.repeat(64)}`;
    const empresa = {
      id: 'empresa-2',
      token_verificacao: tokenRecente,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 72),
      email_verificado: false,
      usuarios: [],
    };

    empresaRepository.findOne.mockResolvedValue(empresa);
    empresaRepository.save.mockImplementation(async (payload: any) => payload);

    await service.verificarEmailAtivacao(tokenRecente);

    expect(empresaRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email_verificado: true,
        token_verificacao: null,
      }),
    );
  });

  it('rejeita token expirado com base no timestamp embutido no token', async () => {
    const tokenAntigo = `${(Date.now() - 1000 * 60 * 60 * 25).toString(36)}.${'b'.repeat(64)}`;
    const empresa = {
      id: 'empresa-3',
      token_verificacao: tokenAntigo,
      created_at: new Date(),
      email_verificado: false,
      usuarios: [],
    };

    empresaRepository.findOne.mockResolvedValue(empresa);

    await expect(service.verificarEmailAtivacao(tokenAntigo)).rejects.toThrow('Token expirado');
  });

  it('lista planos ativos do catalogo incluindo planos customizados no registro', async () => {
    planosService.listarTodos.mockResolvedValue([
      {
        codigo: 'starter',
        nome: 'Starter',
        preco: 149,
        descricao: 'Plano inicial',
        limiteUsuarios: 3,
        limiteClientes: 1000,
        limiteStorage: 5 * 1024 * 1024 * 1024,
        limiteApiCalls: 1000,
        whiteLabel: false,
        suportePrioritario: false,
        modulosInclusos: [{ modulo: { nome: 'CRM' } }],
      },
      {
        codigo: 'plano-teste',
        nome: 'Plano de teste',
        preco: 229,
        descricao: 'Plano customizado para testes',
        limiteUsuarios: 8,
        limiteClientes: 2500,
        limiteStorage: 15 * 1024 * 1024 * 1024,
        limiteApiCalls: 7500,
        whiteLabel: true,
        suportePrioritario: true,
        modulosInclusos: [{ modulo: { nome: 'CRM' } }, { modulo: { nome: 'FINANCEIRO' } }],
      },
    ]);

    const planos = await service.listarPlanos();

    expect(planosService.listarTodos).toHaveBeenCalledTimes(1);
    expect(Array.isArray(planos)).toBe(true);
    expect(planos.map((plano: any) => plano.id)).toEqual(
      expect.arrayContaining(['starter', 'plano-teste']),
    );
  });
});
