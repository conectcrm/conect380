import { PdfService } from './pdf.service';

describe('PdfService - composicao de plano', () => {
  let service: PdfService;

  beforeEach(() => {
    service = new PdfService();
  });

  it('anexa composicao na descricao quando item e plano', () => {
    const itens = (service as any).normalizarItens(
      [
        {
          nome: 'Plano Enterprise',
          descricao: 'Plano com modulos premium',
          tipoItem: 'plano',
          quantidade: 1,
          valorUnitario: 299,
          valorTotal: 299,
          componentesPlano: [
            {
              childItemId: 'mod-vendas',
              nome: 'Modulo Vendas',
              componentRole: 'included',
            },
            {
              childItemId: 'mod-fin',
              nome: 'Modulo Financeiro',
              componentRole: 'required',
              quantity: 2,
            },
          ],
        },
      ],
      'Fallback',
      0,
    );

    expect(itens).toHaveLength(1);
    expect(itens[0].descricao).toContain('Plano com modulos premium');
    expect(itens[0].descricao).toContain('Composicao do plano:');
    expect(itens[0].descricao).toContain('- Modulo Vendas (Incluido)');
    expect(itens[0].descricao).toContain('- Modulo Financeiro x2 (Obrigatorio)');
  });

  it('anexa composicao mesmo sem tipoItem quando componentes existem', () => {
    const itens = (service as any).normalizarItens(
      [
        {
          nome: 'Oferta sem tipo',
          quantidade: 1,
          valorUnitario: 120,
          valorTotal: 120,
          componentes: [
            {
              childItemId: 'srv-implantacao',
              nome: 'Servico de Implantacao',
              componentRole: 'optional',
            },
          ],
        },
      ],
      'Fallback',
      0,
    );

    expect(itens).toHaveLength(1);
    expect(itens[0].descricao).toContain('Composicao do plano:');
    expect(itens[0].descricao).toContain('- Servico de Implantacao (Opcional)');
  });

  it('nao duplica bloco de composicao quando descricao ja possui cabecalho', () => {
    const descricaoComposicaoExistente =
      'Escopo inicial\n\nComposicao do plano:\n- Modulo Base (Incluido)';
    const itens = (service as any).normalizarItens(
      [
        {
          nome: 'Plano com descricao pronta',
          descricao: descricaoComposicaoExistente,
          tipoItem: 'plano',
          quantidade: 1,
          valorUnitario: 180,
          valorTotal: 180,
          componentesPlano: [
            {
              childItemId: 'mod-base',
              nome: 'Modulo Base',
              componentRole: 'included',
            },
          ],
        },
      ],
      'Fallback',
      0,
    );

    const descricao = itens[0].descricao;
    expect(descricao).toBe(descricaoComposicaoExistente);
    expect((descricao.match(/Composicao do plano:/g) || []).length).toBe(1);
  });
});

