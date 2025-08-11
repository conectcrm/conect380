import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In, Between } from 'typeorm';
import { Cotacao, StatusCotacao } from './entities/cotacao.entity';
import { ItemCotacao } from './entities/item-cotacao.entity';
import { AnexoCotacao } from './entities/anexo-cotacao.entity';
import { Cliente } from '../modules/clientes/entities/cliente.entity';
import { User } from '../modules/users/entities/user.entity';
import { 
  CriarCotacaoDto, 
  AtualizarCotacaoDto, 
  CotacaoQueryDto,
  DuplicarCotacaoDto,
  EnviarEmailDto,
  CotacaoResponseDto
} from './dto/cotacao.dto';

@Injectable()
export class CotacaoService {
  constructor(
    @InjectRepository(Cotacao)
    private cotacaoRepository: Repository<Cotacao>,
    
    @InjectRepository(ItemCotacao)
    private itemCotacaoRepository: Repository<ItemCotacao>,
    
    @InjectRepository(AnexoCotacao)
    private anexoCotacaoRepository: Repository<AnexoCotacao>,
    
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async criar(criarCotacaoDto: CriarCotacaoDto, userId: string): Promise<CotacaoResponseDto> {
    // Validar cliente
    const cliente = await this.clienteRepository.findOne({
      where: { id: criarCotacaoDto.clienteId }
    });

    if (!cliente) {
      throw new HttpException('Cliente não encontrado', HttpStatus.NOT_FOUND);
    }

    // Validar usuário responsável
    const responsavel = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!responsavel) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    // Gerar número da cotação
    const numero = await this.gerarNumeroCotacao();

    // Criar cotação
    const cotacao = this.cotacaoRepository.create({
      ...criarCotacaoDto,
      numero,
      status: StatusCotacao.RASCUNHO,
      responsavelId: userId,
      dataVencimento: new Date(criarCotacaoDto.dataVencimento),
      criadoPor: userId,
      atualizadoPor: userId
    });

    const cotacaoSalva = await this.cotacaoRepository.save(cotacao);

    // Criar itens
    if (criarCotacaoDto.itens && criarCotacaoDto.itens.length > 0) {
      const itens = criarCotacaoDto.itens.map(item => 
        this.itemCotacaoRepository.create({
          ...item,
          cotacaoId: cotacaoSalva.id,
          valorTotal: item.quantidade * item.valorUnitario
        })
      );

      await this.itemCotacaoRepository.save(itens);
    }

    // Calcular e atualizar valor total
    await this.calcularValorTotal(cotacaoSalva.id);

    // Log simples de auditoria
    console.log(`[AUDIT] COTACAO CREATE - ID: ${cotacaoSalva.id}, User: ${userId}, Numero: ${cotacaoSalva.numero}`);

    return this.buscarPorId(cotacaoSalva.id, userId);
  }

  async listar(query: CotacaoQueryDto, userId: string) {
    const queryBuilder = this.createQueryBuilder();

    // Aplicar filtros básicos
    this.applyFilters(queryBuilder, query, userId);

    // Aplicar ordenação
    const orderBy = query.orderBy || 'dataCriacao';
    const orderDirection = query.orderDirection || 'DESC';
    queryBuilder.orderBy(`cotacao.${orderBy}`, orderDirection);

    // Aplicar paginação
    const page = query.page || 1;
    const limit = query.limit || 25;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // Executar query
    const [items, total] = await queryBuilder.getManyAndCount();

    // Calcular estatísticas básicas
    const totalValue = items.reduce((sum, item) => sum + item.valorTotal, 0);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      statistics: {
        total,
        totalValue,
        byStatus: await this.getStatusStatistics(userId),
        byPriority: await this.getPriorityStatistics(userId)
      }
    };
  }

  async buscarPorId(id: string, userId: string): Promise<CotacaoResponseDto> {
    const cotacao = await this.cotacaoRepository.findOne({
      where: { id },
      relations: [
        'cliente',
        'responsavel',
        'itens',
        'anexos',
        'criadoPorUser',
        'atualizadoPorUser'
      ]
    });

    if (!cotacao) {
      throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
    }

    return this.formatarCotacaoResponse(cotacao);
  }

  async atualizar(
    id: string, 
    atualizarCotacaoDto: AtualizarCotacaoDto, 
    userId: string
  ): Promise<CotacaoResponseDto> {
    const cotacao = await this.cotacaoRepository.findOne({
      where: { id },
      relations: ['itens']
    });

    if (!cotacao) {
      throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
    }

    // Verificar se pode ser editada
    if (!this.podeSerEditada(cotacao.status)) {
      throw new HttpException(
        'Cotação não pode ser editada no status atual',
        HttpStatus.BAD_REQUEST
      );
    }

    // Validar cliente se foi alterado
    if (atualizarCotacaoDto.clienteId && atualizarCotacaoDto.clienteId !== cotacao.clienteId) {
      const cliente = await this.clienteRepository.findOne({
        where: { id: atualizarCotacaoDto.clienteId }
      });

      if (!cliente) {
        throw new HttpException('Cliente não encontrado', HttpStatus.NOT_FOUND);
      }
    }

    // Atualizar cotação
    Object.assign(cotacao, {
      ...atualizarCotacaoDto,
      atualizadoPor: userId,
      dataAtualizacao: new Date()
    });

    if (atualizarCotacaoDto.dataVencimento) {
      cotacao.dataVencimento = new Date(atualizarCotacaoDto.dataVencimento);
    }

    await this.cotacaoRepository.save(cotacao);

    // Atualizar itens se fornecidos
    if (atualizarCotacaoDto.itens) {
      // Remover itens existentes
      await this.itemCotacaoRepository.delete({ cotacaoId: id });

      // Criar novos itens
      if (atualizarCotacaoDto.itens.length > 0) {
        const novosItens = atualizarCotacaoDto.itens.map(item => 
          this.itemCotacaoRepository.create({
            ...item,
            cotacaoId: id,
            valorTotal: item.quantidade * item.valorUnitario
          })
        );

        await this.itemCotacaoRepository.save(novosItens);
      }

      // Recalcular valor total
      await this.calcularValorTotal(id);
    }

    // Log simples de auditoria
    console.log(`[AUDIT] COTACAO UPDATE - ID: ${id}, User: ${userId}`);

    return this.buscarPorId(id, userId);
  }

  async deletar(id: string, userId: string): Promise<void> {
    const cotacao = await this.cotacaoRepository.findOne({
      where: { id }
    });

    if (!cotacao) {
      throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
    }

    // Verificar se pode ser deletada
    if (!this.podeSerDeletada(cotacao.status)) {
      throw new HttpException(
        'Cotação não pode ser deletada no status atual',
        HttpStatus.BAD_REQUEST
      );
    }

    // Soft delete
    cotacao.deletadoEm = new Date();
    cotacao.deletadoPor = userId;
    await this.cotacaoRepository.save(cotacao);

    // Log simples de auditoria
    console.log(`[AUDIT] COTACAO DELETE - ID: ${id}, User: ${userId}, Numero: ${cotacao.numero}`);
  }

  async alterarStatus(
    id: string, 
    novoStatus: StatusCotacao, 
    observacao?: string,
    userId?: string
  ): Promise<CotacaoResponseDto> {
    const cotacao = await this.cotacaoRepository.findOne({
      where: { id }
    });

    if (!cotacao) {
      throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
    }

    // Validar transição de status
    if (!this.isValidStatusTransition(cotacao.status, novoStatus)) {
      throw new HttpException(
        `Transição de status inválida: ${cotacao.status} → ${novoStatus}`,
        HttpStatus.BAD_REQUEST
      );
    }

    const statusAnterior = cotacao.status;
    cotacao.status = novoStatus;
    cotacao.atualizadoPor = userId;
    cotacao.dataAtualizacao = new Date();

    // Atualizar campos específicos baseados no status
    switch (novoStatus) {
      case StatusCotacao.ENVIADA:
        cotacao.dataEnvio = new Date();
        break;
      case StatusCotacao.APROVADA:
        cotacao.dataAprovacao = new Date();
        break;
      case StatusCotacao.REJEITADA:
        cotacao.dataRejeicao = new Date();
        break;
      case StatusCotacao.CONVERTIDA:
        cotacao.dataConversao = new Date();
        break;
    }

    if (observacao) {
      cotacao.observacoes = (cotacao.observacoes || '') + `\n[${new Date().toLocaleString()}] ${observacao}`;
    }

    await this.cotacaoRepository.save(cotacao);

    // Log simples de auditoria
    console.log(`[AUDIT] COTACAO UPDATE_STATUS - ID: ${id}, User: ${userId}, ${statusAnterior} → ${novoStatus}`);

    return this.buscarPorId(id, userId);
  }

  async gerarPDF(id: string, userId: string): Promise<Buffer> {
    const cotacao = await this.buscarPorId(id, userId);
    
    // Log simples de auditoria
    console.log(`[AUDIT] COTACAO GENERATE_PDF - ID: ${id}, User: ${userId}, Numero: ${cotacao.numero}`);

    // Implementação básica - retorna dados como buffer JSON
    const dados = JSON.stringify({
      type: 'cotacao_pdf',
      cotacao,
      geradoEm: new Date(),
      geradoPor: userId
    }, null, 2);
    
    return Buffer.from(dados, 'utf-8');
  }

  async enviarEmail(
    id: string, 
    enviarEmailDto: EnviarEmailDto, 
    userId: string
  ): Promise<void> {
    const cotacao = await this.buscarPorId(id, userId);
    
    // Log simples em vez de envio real
    console.log(`[EMAIL] COTACAO SEND - ID: ${id}, Destinatarios: ${enviarEmailDto.destinatarios.join(', ')}, Assunto: ${enviarEmailDto.assunto}`);

    // Atualizar status se ainda for rascunho
    if (cotacao.status === StatusCotacao.RASCUNHO) {
      await this.alterarStatus(id, StatusCotacao.ENVIADA, 'Enviada por email', userId);
    }

    // Log simples de auditoria
    console.log(`[AUDIT] COTACAO SEND_EMAIL - ID: ${id}, User: ${userId}, Destinatarios: ${enviarEmailDto.destinatarios.length}`);
  }

  async obterHistorico(id: string, userId: string) {
    // Implementação básica sem módulo de auditoria
    return {
      message: 'Histórico não disponível - módulo de auditoria não configurado',
      cotacaoId: id,
      consultadoPor: userId,
      consultadoEm: new Date()
    };
  }

  async exportar(formato: 'csv' | 'excel' | 'pdf', query: CotacaoQueryDto, userId: string) {
    const queryBuilder = this.createQueryBuilder();
    this.applyFilters(queryBuilder, query, userId);
    
    const cotacoes = await queryBuilder.getMany();
    
    // Log simples de auditoria
    console.log(`[AUDIT] COTACAO EXPORT - User: ${userId}, Formato: ${formato}, Quantidade: ${cotacoes.length}`);

    // Implementação básica - retorna dados como buffer JSON
    const dados = JSON.stringify({
      type: `cotacao_export_${formato}`,
      cotacoes,
      exportadoEm: new Date(),
      exportadoPor: userId
    }, null, 2);
    
    return Buffer.from(dados, 'utf-8');
  }

  // Métodos auxiliares privados
  private createQueryBuilder(): SelectQueryBuilder<Cotacao> {
    return this.cotacaoRepository
      .createQueryBuilder('cotacao')
      .leftJoinAndSelect('cotacao.cliente', 'cliente')
      .leftJoinAndSelect('cotacao.responsavel', 'responsavel')
      .leftJoinAndSelect('cotacao.itens', 'itens')
      .where('cotacao.deletadoEm IS NULL');
  }

  private applyFilters(queryBuilder: SelectQueryBuilder<Cotacao>, query: CotacaoQueryDto, userId: string) {
    // Filtro por cliente
    if (query.clienteId) {
      queryBuilder.andWhere('cotacao.clienteId = :clienteId', { clienteId: query.clienteId });
    }

    // Filtro por status
    if (query.status) {
      if (Array.isArray(query.status)) {
        queryBuilder.andWhere('cotacao.status IN (:...status)', { status: query.status });
      } else {
        queryBuilder.andWhere('cotacao.status = :status', { status: query.status });
      }
    }

    // Filtro por prioridade
    if (query.prioridade) {
      queryBuilder.andWhere('cotacao.prioridade = :prioridade', { prioridade: query.prioridade });
    }

    // Filtro por responsável
    if (query.responsavelId) {
      queryBuilder.andWhere('cotacao.responsavelId = :responsavelId', { responsavelId: query.responsavelId });
    }

    // Filtro por período
    if (query.dataInicio) {
      queryBuilder.andWhere('cotacao.dataCriacao >= :dataInicio', { dataInicio: query.dataInicio });
    }

    if (query.dataFim) {
      queryBuilder.andWhere('cotacao.dataCriacao <= :dataFim', { dataFim: query.dataFim });
    }

    // Busca global
    if (query.busca) {
      queryBuilder.andWhere(
        '(cotacao.numero ILIKE :busca OR cotacao.titulo ILIKE :busca OR cliente.nome ILIKE :busca)',
        { busca: `%${query.busca}%` }
      );
    }
  }

  private async gerarNumeroCotacao(): Promise<string> {
    const ano = new Date().getFullYear();
    const prefixo = `COT${ano}`;
    
    const ultimaCotacao = await this.cotacaoRepository
      .createQueryBuilder('cotacao')
      .where('cotacao.numero LIKE :prefixo', { prefixo: `${prefixo}%` })
      .orderBy('cotacao.numero', 'DESC')
      .getOne();

    let proximoNumero = 1;
    if (ultimaCotacao) {
      const numeroAtual = parseInt(ultimaCotacao.numero.replace(prefixo, ''));
      proximoNumero = numeroAtual + 1;
    }

    return `${prefixo}${proximoNumero.toString().padStart(6, '0')}`;
  }

  private async calcularValorTotal(cotacaoId: string): Promise<void> {
    const resultado = await this.itemCotacaoRepository
      .createQueryBuilder('item')
      .select('SUM(item.valorTotal)', 'total')
      .where('item.cotacaoId = :cotacaoId', { cotacaoId })
      .getRawOne();

    const valorTotal = parseFloat(resultado?.total || '0');

    await this.cotacaoRepository.update(cotacaoId, { valorTotal });
  }

  private podeSerEditada(status: StatusCotacao): boolean {
    return [StatusCotacao.RASCUNHO, StatusCotacao.ENVIADA].includes(status);
  }

  private podeSerDeletada(status: StatusCotacao): boolean {
    return [StatusCotacao.RASCUNHO, StatusCotacao.REJEITADA, StatusCotacao.VENCIDA].includes(status);
  }

  private isValidStatusTransition(statusAtual: StatusCotacao, novoStatus: StatusCotacao): boolean {
    const transicoes = {
      [StatusCotacao.RASCUNHO]: [StatusCotacao.ENVIADA, StatusCotacao.CANCELADA],
      [StatusCotacao.ENVIADA]: [StatusCotacao.EM_ANALISE, StatusCotacao.APROVADA, StatusCotacao.REJEITADA, StatusCotacao.VENCIDA],
      [StatusCotacao.EM_ANALISE]: [StatusCotacao.APROVADA, StatusCotacao.REJEITADA, StatusCotacao.VENCIDA],
      [StatusCotacao.APROVADA]: [StatusCotacao.CONVERTIDA],
      [StatusCotacao.REJEITADA]: [StatusCotacao.RASCUNHO],
      [StatusCotacao.VENCIDA]: [StatusCotacao.RASCUNHO],
      [StatusCotacao.CONVERTIDA]: [],
      [StatusCotacao.CANCELADA]: []
    };

    return transicoes[statusAtual]?.includes(novoStatus) || false;
  }

  private async getStatusStatistics(userId: string) {
    const result = await this.cotacaoRepository
      .createQueryBuilder('cotacao')
      .select('cotacao.status', 'status')
      .addSelect('COUNT(*)', 'quantidade')
      .where('cotacao.deletadoEm IS NULL')
      .groupBy('cotacao.status')
      .getRawMany();

    return result.map(item => ({
      status: item.status,
      quantidade: parseInt(item.quantidade)
    }));
  }

  private async getPriorityStatistics(userId: string) {
    const result = await this.cotacaoRepository
      .createQueryBuilder('cotacao')
      .select('cotacao.prioridade', 'prioridade')
      .addSelect('COUNT(*)', 'quantidade')
      .where('cotacao.deletadoEm IS NULL')
      .groupBy('cotacao.prioridade')
      .getRawMany();

    return result.map(item => ({
      prioridade: item.prioridade,
      quantidade: parseInt(item.quantidade)
    }));
  }

  private formatarCotacaoResponse(cotacao: Cotacao): CotacaoResponseDto {
    return {
      id: cotacao.id,
      numero: cotacao.numero,
      titulo: cotacao.titulo,
      descricao: cotacao.descricao,
      status: cotacao.status,
      prioridade: cotacao.prioridade,
      valorTotal: cotacao.valorTotal,
      dataVencimento: cotacao.dataVencimento,
      observacoes: cotacao.observacoes,
      condicoesPagamento: cotacao.condicoesPagamento,
      prazoEntrega: cotacao.prazoEntrega,
      validadeOrcamento: cotacao.validadeOrcamento,
      origem: cotacao.origem,
      clienteId: cotacao.clienteId,
      cliente: cotacao.cliente ? {
        id: cotacao.cliente.id,
        nome: cotacao.cliente.nome,
        email: cotacao.cliente.email,
        telefone: cotacao.cliente.telefone
      } : null,
      responsavelId: cotacao.responsavelId,
      responsavel: cotacao.responsavel ? {
        id: cotacao.responsavel.id,
        nome: cotacao.responsavel.nome,
        email: cotacao.responsavel.email
      } : null,
      itens: cotacao.itens?.map(item => ({
        id: item.id,
        descricao: item.descricao,
        quantidade: item.quantidade,
        unidade: item.unidade,
        valorUnitario: item.valorUnitario,
        valorTotal: item.valorTotal,
        observacoes: item.observacoes
      })) || [],
      anexos: cotacao.anexos?.map(anexo => ({
        id: anexo.id,
        nome: anexo.nome,
        tipo: anexo.tipo,
        url: anexo.url,
        tamanho: anexo.tamanho,
        dataCriacao: anexo.dataCriacao
      })) || [],
      dataCriacao: cotacao.dataCriacao,
      dataAtualizacao: cotacao.dataAtualizacao,
      dataEnvio: cotacao.dataEnvio,
      dataAprovacao: cotacao.dataAprovacao,
      dataRejeicao: cotacao.dataRejeicao,
      dataConversao: cotacao.dataConversao,
      criadoPor: cotacao.criadoPor,
      atualizadoPor: cotacao.atualizadoPor
    };
  }
}
