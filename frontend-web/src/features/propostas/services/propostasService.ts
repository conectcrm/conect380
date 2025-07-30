interface Cliente {
  id: string;
  nome: string;
  documento: string;
  email: string;
  telefone: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  tipoPessoa: 'fisica' | 'juridica';
}

interface Vendedor {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  tipo: 'vendedor' | 'gerente' | 'admin';
  ativo: boolean;
}

interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  descricao?: string;
  unidade: string;
  tipo?: 'produto' | 'combo' | 'software';
  produtosCombo?: Produto[];
  precoOriginal?: number;
  desconto?: number;
  tipoItem?: 'produto' | 'servico' | 'licenca' | 'modulo' | 'aplicativo';
  tipoLicenciamento?: string;
  periodicidadeLicenca?: string;
  renovacaoAutomatica?: boolean;
  quantidadeLicencas?: number;
}

interface ProdutoProposta {
  produto: Produto;
  quantidade: number;
  desconto: number;
  subtotal: number;
}

interface PropostaFormData {
  titulo?: string;
  vendedor: Vendedor | null;
  cliente: Cliente | null;
  produtos: ProdutoProposta[];
  descontoGlobal: number;
  impostos: number;
  formaPagamento: 'avista' | 'parcelado' | 'boleto' | 'cartao';
  parcelas?: number;
  validadeDias: number;
  observacoes: string;
  incluirImpostosPDF: boolean;
}

interface PropostaCompleta extends PropostaFormData {
  id?: string;
  numero?: string;
  subtotal: number;
  total: number;
  dataValidade: Date;
  status?: 'rascunho' | 'enviada' | 'aprovada' | 'rejeitada';
  tokenPortal?: string;
  criadaEm?: Date;
  atualizadaEm?: Date;
}

// Serviço com APIs reais apenas
class PropostasService {
  private baseUrl = 'http://localhost:3001/propostas';

  // Método para obter produtos do sistema
  async obterProdutos(): Promise<Produto[]> {
    try {
      // Carregar produtos do backend
      const { produtosService } = await import('../../../services/produtosService');
      const produtosAPI = await produtosService.findAll();

      if (produtosAPI && produtosAPI.length > 0) {
        console.log('📦 Produtos carregados do backend:', produtosAPI.length);

        // Converter produtos da API para o formato de propostas
        const produtosFormatados: Produto[] = produtosAPI.map((produto: any) => ({
          id: produto.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          nome: produto.nome || 'Produto sem nome',
          preco: produto.preco || 0,
          categoria: produto.categoria || 'Geral',
          descricao: produto.descricao || '',
          unidade: produto.unidade || 'unidade',
          tipo: produto.tipo || 'produto'
        }));

        return produtosFormatados;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar produtos do backend:', error);
    }

    // Fallback com produtos básicos se não conseguir carregar do backend
    console.log('📦 Usando produtos básicos como fallback');
    return [
      {
        id: 'prod1',
        nome: 'Produto Básico',
        preco: 100.00,
        categoria: 'Geral',
        descricao: 'Produto de exemplo',
        unidade: 'unidade',
        tipo: 'produto'
      }
    ];
  }

  // Método para obter clientes do sistema
  async obterClientes(): Promise<Cliente[]> {
    try {
      const { clientesService } = await import('../../../services/clientesService');

      // Usar o método correto para buscar clientes
      const clientesData = await clientesService.getClientes({ page: 1, limit: 1000 });

      if (clientesData?.data && clientesData.data.length > 0) {
        console.log('👥 Clientes carregados do backend:', clientesData.data.length);

        const clientesFormatados: Cliente[] = clientesData.data.map((cliente: any) => ({
          id: cliente.id || `cli_${Date.now()}`,
          nome: cliente.nome || 'Cliente sem nome',
          documento: cliente.documento || '',
          email: cliente.email || '',
          telefone: cliente.telefone || '',
          endereco: cliente.endereco || '',
          cidade: cliente.cidade || '',
          estado: cliente.estado || '',
          cep: cliente.cep || '',
          tipoPessoa: cliente.tipo === 'pessoa_fisica' ? 'fisica' : 'juridica'
        }));

        return clientesFormatados;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar clientes do backend:', error);
    }

    return [];
  }

  // Método para obter vendedores do sistema
  async obterVendedores(): Promise<Vendedor[]> {
    try {
      // Como não temos vendedoresService, vamos usar usuários como vendedores
      const { usuariosService } = await import('../../../services/usuariosService');

      // Filtrar apenas usuários ativos
      const usuariosData = await usuariosService.listarUsuarios({ ativo: true });

      if (usuariosData && usuariosData.length > 0) {
        console.log('👨‍💼 Usuários ativos carregados como vendedores:', usuariosData.length);

        const vendedoresFormatados: Vendedor[] = usuariosData
          .filter((usuario: any) => usuario.ativo === true) // Dupla verificação
          .map((usuario: any) => ({
            id: usuario.id || `vend_${Date.now()}`,
            nome: usuario.nome || usuario.name || 'Vendedor sem nome',
            email: usuario.email || '',
            telefone: usuario.telefone || '',
            tipo: 'vendedor',
            ativo: true // Já filtrado, então todos são ativos
          }));

        console.log(`✅ ${vendedoresFormatados.length} vendedores ativos disponíveis para propostas`);
        return vendedoresFormatados;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar vendedores do backend:', error);
    }

    // Fallback: retornar pelo menos um vendedor padrão
    return [
      {
        id: 'vend_default',
        nome: 'Vendedor Padrão',
        email: 'vendedor@empresa.com',
        telefone: '',
        tipo: 'vendedor',
        ativo: true
      }
    ];
  }

  // Gerar título automático para proposta
  gerarTituloAutomatico(cliente: Cliente | null): string {
    if (!cliente) {
      return 'Nova Proposta Comercial';
    }

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    return `${cliente.nome} - ${dataAtual}`;
  }

  // Criar nova proposta usando API real
  async criarProposta(dados: PropostaCompleta): Promise<PropostaCompleta> {
    try {
      console.log('📝 Criando nova proposta via API:', dados);

      // Preparar dados para o backend
      const dadosParaBackend = {
        titulo: dados.titulo || this.gerarTituloAutomatico(dados.cliente),
        cliente: dados.cliente?.nome || 'Cliente não informado',
        valor: dados.total,
        observacoes: dados.observacoes || '',
        vendedor: dados.vendedor?.nome || '',
        formaPagamento: dados.formaPagamento || 'avista',
        validadeDias: dados.validadeDias || 30
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosParaBackend)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Proposta criada no backend:', result);

      // Converter resposta do backend para formato do frontend
      const propostaCriada: PropostaCompleta = {
        ...dados,
        id: result.proposta?.id || `prop_${Date.now()}`,
        numero: result.proposta?.numero || `PROP-${Date.now()}`,
        status: (result.proposta?.status as any) || 'rascunho',
        criadaEm: new Date(result.proposta?.createdAt || Date.now()),
        atualizadaEm: new Date(result.proposta?.updatedAt || Date.now())
      };

      return propostaCriada;

    } catch (error) {
      console.error('❌ Erro ao criar proposta:', error);
      throw new Error('Não foi possível criar a proposta. Tente novamente.');
    }
  }

  // Listar propostas usando API real
  async listarPropostas(): Promise<PropostaCompleta[]> {
    try {
      console.log('📋 Buscando propostas da API...');

      const response = await fetch(this.baseUrl);

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Propostas recebidas da API:', result);

      if (!result.propostas || !Array.isArray(result.propostas)) {
        console.warn('⚠️ Formato inesperado da resposta da API');
        return [];
      }

      // Converter propostas do backend para formato do frontend
      const propostasFormatadas: PropostaCompleta[] = result.propostas.map((prop: any) => ({
        id: prop.id,
        numero: prop.numero,
        titulo: prop.titulo,
        status: prop.status,
        cliente: { nome: prop.cliente } as Cliente,
        vendedor: { nome: prop.vendedor || 'N/A' } as Vendedor,
        produtos: [],
        descontoGlobal: 0,
        impostos: 0,
        formaPagamento: (prop.formaPagamento as any) || 'avista',
        validadeDias: prop.validadeDias || 30,
        observacoes: prop.observacoes || '',
        incluirImpostosPDF: false,
        subtotal: prop.valor || 0,
        total: prop.valor || 0,
        dataValidade: new Date(Date.now() + (prop.validadeDias || 30) * 24 * 60 * 60 * 1000),
        criadaEm: new Date(prop.createdAt),
        atualizadaEm: new Date(prop.updatedAt)
      }));

      console.log(`📋 ${propostasFormatadas.length} propostas formatadas para o frontend`);
      return propostasFormatadas;

    } catch (error) {
      console.error('❌ Erro ao listar propostas:', error);
      return [];
    }
  }

  // Obter proposta específica usando API real
  async obterProposta(id: string): Promise<PropostaCompleta | null> {
    try {
      console.log(`🔍 Buscando proposta ${id} na API...`);

      const response = await fetch(`${this.baseUrl}/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`⚠️ Proposta ${id} não encontrada`);
          return null;
        }
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Proposta recebida da API:', result);

      if (!result.proposta) {
        console.warn('⚠️ Proposta não encontrada na resposta da API');
        return null;
      }

      const prop = result.proposta;

      // Converter proposta do backend para formato do frontend
      const propostaFormatada: PropostaCompleta = {
        id: prop.id,
        numero: prop.numero,
        titulo: prop.titulo,
        status: prop.status,
        cliente: { nome: prop.cliente } as Cliente,
        vendedor: { nome: prop.vendedor || 'N/A' } as Vendedor,
        produtos: [],
        descontoGlobal: 0,
        impostos: 0,
        formaPagamento: (prop.formaPagamento as any) || 'avista',
        validadeDias: prop.validadeDias || 30,
        observacoes: prop.observacoes || '',
        incluirImpostosPDF: false,
        subtotal: prop.valor || 0,
        total: prop.valor || 0,
        dataValidade: new Date(Date.now() + (prop.validadeDias || 30) * 24 * 60 * 60 * 1000),
        criadaEm: new Date(prop.createdAt),
        atualizadaEm: new Date(prop.updatedAt)
      };

      console.log(`✅ Proposta ${id} formatada para o frontend`);
      return propostaFormatada;

    } catch (error) {
      console.error(`❌ Erro ao obter proposta ${id}:`, error);
      return null;
    }
  }

  // Remover proposta usando API real
  async removerProposta(id: string): Promise<boolean> {
    try {
      console.log(`🗑️ Removendo proposta ${id} via API...`);

      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Proposta removida:', result);

      return true;

    } catch (error) {
      console.error(`❌ Erro ao remover proposta ${id}:`, error);
      return false;
    }
  }

  // Atualizar status de proposta
  async atualizarStatus(id: string, novoStatus: string): Promise<PropostaCompleta | null> {
    try {
      console.log(`🔄 Atualizando status da proposta ${id} para ${novoStatus}...`);

      const response = await fetch(`${this.baseUrl}/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: novoStatus })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Status atualizado:', result);

      // Retornar proposta atualizada
      return await this.obterProposta(id);

    } catch (error) {
      console.error(`❌ Erro ao atualizar status da proposta ${id}:`, error);
      return null;
    }
  }

  // Estatísticas das propostas (calculadas do backend)
  async obterEstatisticas() {
    try {
      const propostas = await this.listarPropostas();

      const totalPropostas = propostas.length;
      const valorTotalPipeline = propostas.reduce((sum, p) => sum + p.total, 0);

      const propostasAprovadas = propostas.filter(p => p.status === 'aprovada').length;
      const taxaConversao = totalPropostas > 0 ? (propostasAprovadas / totalPropostas) * 100 : 0;

      const estatisticasPorStatus: Record<string, number> = {};
      propostas.forEach(proposta => {
        const status = proposta.status || 'rascunho';
        estatisticasPorStatus[status] = (estatisticasPorStatus[status] || 0) + 1;
      });

      const estatisticasPorVendedor: Record<string, number> = {};
      propostas.forEach(proposta => {
        const vendedor = proposta.vendedor?.nome || 'Sem vendedor';
        estatisticasPorVendedor[vendedor] = (estatisticasPorVendedor[vendedor] || 0) + 1;
      });

      return {
        totalPropostas,
        valorTotalPipeline,
        taxaConversao: Math.round(taxaConversao * 100) / 100,
        propostasAprovadas,
        estatisticasPorStatus,
        estatisticasPorVendedor
      };

    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      return {
        totalPropostas: 0,
        valorTotalPipeline: 0,
        taxaConversao: 0,
        propostasAprovadas: 0,
        estatisticasPorStatus: {},
        estatisticasPorVendedor: {}
      };
    }
  }

  // Verificar status da conexão com o backend
  async verificarConexao(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('❌ Erro de conexão com backend:', error);
      return false;
    }
  }

  // Métodos adicionais para compatibilidade com o frontend existente

  // Clonar uma proposta existente
  async clonarProposta(id: string): Promise<PropostaCompleta | null> {
    try {
      const propostaOriginal = await this.obterProposta(id);
      if (!propostaOriginal) {
        throw new Error('Proposta original não encontrada');
      }

      // Criar nova proposta baseada na original
      const propostaClone: PropostaCompleta = {
        ...propostaOriginal,
        id: undefined,
        numero: undefined,
        titulo: `${propostaOriginal.titulo} (Cópia)`,
        status: 'rascunho',
        criadaEm: undefined,
        atualizadaEm: undefined
      };

      // Preparar dados para o backend
      const dadosParaBackend = {
        titulo: propostaClone.titulo,
        cliente: propostaClone.cliente?.nome || 'Cliente não informado',
        valor: propostaClone.total,
        observacoes: propostaClone.observacoes || '',
        vendedor: propostaClone.vendedor?.nome || '',
        formaPagamento: propostaClone.formaPagamento || 'avista',
        validadeDias: propostaClone.validadeDias || 30
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosParaBackend)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Proposta clonada no backend:', result);

      return {
        ...propostaClone,
        id: result.proposta?.id || `prop_${Date.now()}`,
        numero: result.proposta?.numero || `PROP-${Date.now()}`,
        criadaEm: new Date(result.proposta?.createdAt || Date.now()),
        atualizadaEm: new Date(result.proposta?.updatedAt || Date.now())
      };

    } catch (error) {
      console.error(`❌ Erro ao clonar proposta ${id}:`, error);
      return null;
    }
  }

  // Obter vendedor atual (mock para compatibilidade)
  async obterVendedorAtual(): Promise<Vendedor | null> {
    try {
      const vendedores = await this.obterVendedores();
      return vendedores.length > 0 ? vendedores[0] : null;
    } catch (error) {
      console.error('❌ Erro ao obter vendedor atual:', error);
      return null;
    }
  }

  // Preview de proposta (mock para compatibilidade)
  async previewProposta(dadosJson: string): Promise<{ html: string }> {
    try {
      const dados = JSON.parse(dadosJson);
      const html = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2>Preview da Proposta</h2>
          <p><strong>Título:</strong> ${dados.titulo || 'Sem título'}</p>
          <p><strong>Cliente:</strong> ${dados.cliente?.nome || 'Cliente não informado'}</p>
          <p><strong>Valor:</strong> R$ ${(dados.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p><strong>Observações:</strong> ${dados.observacoes || 'Nenhuma observação'}</p>
        </div>
      `;
      return { html };
    } catch (error) {
      console.error('❌ Erro no preview da proposta:', error);
      return { html: '<div>Erro ao gerar preview</div>' };
    }
  }

  // Métodos para ações em lote (mock para compatibilidade)
  async atualizarStatusEmLote(ids: string[], novoStatus: string): Promise<void> {
    console.log(`📋 Atualizando status em lote para ${ids.length} propostas`);
    for (const id of ids) {
      await this.atualizarStatus(id, novoStatus);
    }
  }

  async excluirEmLote(ids: string[]): Promise<void> {
    console.log(`🗑️ Removendo ${ids.length} propostas em lote`);
    for (const id of ids) {
      await this.removerProposta(id);
    }
  }

  async enviarEmailEmLote(ids: string[]): Promise<void> {
    console.log(`📧 Enviando email para ${ids.length} propostas`);
    // Mock implementation - em produção, integraria com EmailService
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

export const propostasService = new PropostasService();
export type { PropostaCompleta, PropostaFormData, Cliente, Vendedor, Produto, ProdutoProposta };