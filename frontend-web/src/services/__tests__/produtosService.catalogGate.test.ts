import { api } from '../api';
import { catalogoService } from '../catalogoService';
import { produtosService } from '../produtosService';

jest.mock('../api', () => {
  const client = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  return {
    __esModule: true,
    api: client,
    API_BASE_URL: 'http://localhost:3001',
    default: client,
  };
});

jest.mock('../catalogoService', () => ({
  __esModule: true,
  catalogoService: {
    listItems: jest.fn(),
    listAllItems: jest.fn(),
    getItem: jest.fn(),
    createItem: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
    getStats: jest.fn(),
  },
}));

const apiMock = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
};

const catalogoServiceMock = catalogoService as unknown as {
  listItems: jest.Mock;
  listAllItems: jest.Mock;
  getItem: jest.Mock;
  createItem: jest.Mock;
  updateItem: jest.Mock;
  deleteItem: jest.Mock;
  getStats: jest.Mock;
};

const previousCatalogApiEnabled = process.env.REACT_APP_CATALOGO_API_ENABLED;
const previousCatalogApiTenants = process.env.REACT_APP_CATALOGO_API_TENANTS;

describe('produtosService - gate da API de catalogo por tenant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    process.env.REACT_APP_CATALOGO_API_ENABLED = 'true';
    process.env.REACT_APP_CATALOGO_API_TENANTS = '';
  });

  afterAll(() => {
    process.env.REACT_APP_CATALOGO_API_ENABLED = previousCatalogApiEnabled;
    process.env.REACT_APP_CATALOGO_API_TENANTS = previousCatalogApiTenants;
  });

  it('usa /catalog/items quando tenant esta na allowlist', async () => {
    process.env.REACT_APP_CATALOGO_API_ENABLED = 'true';
    process.env.REACT_APP_CATALOGO_API_TENANTS = 'tenant-codexa,tenant-beta';
    localStorage.setItem('empresaAtiva', '  TENANT-CODEXA ');

    catalogoServiceMock.listItems.mockResolvedValue({
      data: [
        {
          id: 'item-1',
          empresaId: 'tenant-codexa',
          nome: 'Plano Starter',
          itemKind: 'subscription',
          businessType: 'plano',
          status: 'ativo',
          salePrice: 149.9,
          currencyCode: 'BRL',
          trackStock: false,
          createdAt: '2026-03-10T10:00:00.000Z',
          updatedAt: '2026-03-10T10:00:00.000Z',
        },
      ],
      meta: {
        total: 1,
        page: 2,
        limit: 5,
        totalPages: 1,
      },
    });

    const response = await produtosService.listPaginated({
      search: 'starter',
      status: 'ativo',
      tipoItem: 'plano',
      page: 2,
      limit: 5,
      sortBy: 'preco',
      sortOrder: 'ASC',
    });

    expect(catalogoServiceMock.listItems).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'starter',
        status: 'ativo',
        businessType: 'plano',
        page: 2,
        limit: 5,
        sortBy: 'sale_price',
        sortOrder: 'asc',
      }),
    );
    expect(apiMock.get).not.toHaveBeenCalled();
    expect(response.data).toHaveLength(1);
    expect(response.data[0].nome).toBe('Plano Starter');
  });

  it('mantem /produtos quando tenant nao esta na allowlist', async () => {
    process.env.REACT_APP_CATALOGO_API_ENABLED = 'true';
    process.env.REACT_APP_CATALOGO_API_TENANTS = 'tenant-codexa';
    localStorage.setItem('empresaAtiva', 'tenant-bloqueado');

    apiMock.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 'prod-1',
            nome: 'Servico Legado',
            categoria: 'Servicos',
            preco: 99,
            custoUnitario: null,
            tipoItem: 'servico',
            frequencia: 'unico',
            unidadeMedida: 'unidade',
            status: 'ativo',
            descricao: '',
            sku: '',
            fornecedor: '',
            estoqueAtual: 0,
            estoqueMinimo: 0,
            estoqueMaximo: 0,
            vendasMes: 0,
            vendasTotal: 0,
            criadoEm: '2026-03-10T10:00:00.000Z',
            atualizadoEm: '2026-03-10T10:00:00.000Z',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    });

    const response = await produtosService.listPaginated({
      status: 'ativo',
      page: 1,
      limit: 10,
    });

    expect(apiMock.get).toHaveBeenCalledWith('/produtos?status=ativo&page=1&limit=10');
    expect(catalogoServiceMock.listItems).not.toHaveBeenCalled();
    expect(response.data[0].nome).toBe('Servico Legado');
  });

  it('forca fallback legado quando flag global esta desativada', async () => {
    process.env.REACT_APP_CATALOGO_API_ENABLED = 'false';
    process.env.REACT_APP_CATALOGO_API_TENANTS = 'tenant-codexa';
    localStorage.setItem('empresaAtiva', 'tenant-codexa');

    apiMock.get.mockResolvedValue({
      data: {
        totalProdutos: 4,
        produtosAtivos: 3,
        vendasMes: 0,
        valorTotal: 1500,
        estoquesBaixos: 0,
      },
    });

    const response = await produtosService.getEstatisticas();

    expect(apiMock.get).toHaveBeenCalledWith('/produtos/estatisticas');
    expect(catalogoServiceMock.getStats).not.toHaveBeenCalled();
    expect(response.totalProdutos).toBe(4);
  });
});
