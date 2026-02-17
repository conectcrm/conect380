import { Repository } from 'typeorm';
import { Cliente } from '../modules/clientes/cliente.entity';
import { Produto } from '../modules/produtos/produto.entity';
import { SearchService } from './search.service';

describe('SearchService', () => {
  const clienteRepository = {
    find: jest.fn(),
  } as unknown as Repository<Cliente>;

  const produtoRepository = {
    find: jest.fn(),
  } as unknown as Repository<Produto>;

  const service = new SearchService(clienteRepository, produtoRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve montar filtros sem sensibilidade a caixa e acento', async () => {
    (clienteRepository.find as jest.Mock).mockResolvedValue([
      {
        id: 'cliente-1',
        nome: 'CLIENTE TESTE',
        email: 'CLIENTE@TESTE.COM',
        telefone: null,
      },
    ]);
    (produtoRepository.find as jest.Mock).mockResolvedValue([
      {
        id: 'produto-1',
        nome: 'PRODUTO TESTE',
        preco: 10,
      },
    ]);

    const results = await service.searchGlobal('\u00C7lI\u00EAnTe', 'empresa-1');

    expect(results).toHaveLength(2);
    expect(results[0].path).toBe('/crm/clientes?highlight=cliente-1');
    expect(results[1].path).toBe('/vendas/produtos?highlight=produto-1');

    const clienteWhere = (clienteRepository.find as jest.Mock).mock.calls[0][0].where;
    const produtoWhere = (produtoRepository.find as jest.Mock).mock.calls[0][0].where;

    for (const condition of clienteWhere) {
      expect(condition.empresaId).toBe('empresa-1');
    }
    for (const condition of produtoWhere) {
      expect(condition.empresaId).toBe('empresa-1');
    }

    const clienteNomeOperator = clienteWhere[0].nome;
    const produtoNomeOperator = produtoWhere[0].nome;

    expect(clienteNomeOperator._type).toBe('raw');
    expect(produtoNomeOperator._type).toBe('raw');
    expect(clienteNomeOperator._objectLiteralParameters.query).toBe('%cliente%');
    expect(produtoNomeOperator._objectLiteralParameters.query).toBe('%cliente%');
    expect(clienteNomeOperator._getSql('cliente.nome')).toContain('REPLACE(');
    expect(clienteNomeOperator._getSql('cliente.nome')).toContain('LOWER(COALESCE(');
    expect(produtoNomeOperator._getSql('produto.nome')).toContain('LIKE :query');
  });

  it('deve respeitar filtro de tipos informado', async () => {
    (produtoRepository.find as jest.Mock).mockResolvedValue([]);

    await service.searchGlobal('produto', 'empresa-1', ['produto']);

    expect(clienteRepository.find).not.toHaveBeenCalled();
    expect(produtoRepository.find).toHaveBeenCalledTimes(1);
  });
});
