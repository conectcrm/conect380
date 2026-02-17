import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In, Between, IsNull } from 'typeorm';
import { Cotacao, StatusCotacao } from './entities/cotacao.entity';
import { ItemCotacao } from './entities/item-cotacao.entity';
import { AnexoCotacao } from './entities/anexo-cotacao.entity';
import { Fornecedor } from '../modules/financeiro/entities/fornecedor.entity';
import { User } from '../modules/users/user.entity';
import { CotacaoEmailService } from './cotacao-email.service';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import {
  CriarCotacaoDto,
  AtualizarCotacaoDto,
  CotacaoQueryDto,
  DuplicarCotacaoDto,
  EnviarEmailDto,
  CotacaoResponseDto,
  CriarItemCotacaoDto,
} from './dto/cotacao.dto';

@Injectable()
export class CotacaoService {
  private readonly logger = new Logger(CotacaoService.name);

  constructor(
    @InjectRepository(Cotacao)
    private cotacaoRepository: Repository<Cotacao>,

    @InjectRepository(ItemCotacao)
    private itemCotacaoRepository: Repository<ItemCotacao>,

    @InjectRepository(AnexoCotacao)
    private anexoCotacaoRepository: Repository<AnexoCotacao>,

    @InjectRepository(Fornecedor)
    private fornecedorRepository: Repository<Fornecedor>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private cotacaoEmailService: CotacaoEmailService,
    private notificationService: NotificationService,
  ) {}

  async criar(
    criarCotacaoDto: CriarCotacaoDto,
    userId: string,
    empresaId: string,
  ): Promise<CotacaoResponseDto> {
    // Validar fornecedor
    const fornecedor = await this.fornecedorRepository.findOne({
      where: { id: criarCotacaoDto.fornecedorId, empresaId },
    });

    if (!fornecedor) {
      throw new HttpException('Fornecedor não encontrado', HttpStatus.NOT_FOUND);
    }

    // Validar usuário responsável
    const responsavel = await this.userRepository.findOne({
      where: { id: userId, empresa_id: empresaId },
    });

    if (!responsavel) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    // Validar aprovador (se fornecido)
    if (criarCotacaoDto.aprovadorId) {
      const aprovador = await this.userRepository.findOne({
        where: { id: criarCotacaoDto.aprovadorId, empresa_id: empresaId },
      });

      if (!aprovador) {
        throw new HttpException('Aprovador não encontrado', HttpStatus.NOT_FOUND);
      }
    }

    // Gerar número da cotação
    const numero = await this.gerarNumeroCotacao(empresaId);

    // Criar cotação (SEM itens - serão criados separadamente)
    const { itens, ...cotacaoData } = criarCotacaoDto;
    const cotacao = this.cotacaoRepository.create({
      ...cotacaoData,
      numero,
      empresaId,
      status: StatusCotacao.RASCUNHO,
      responsavelId: userId,
      prazoResposta: criarCotacaoDto.prazoResposta ? new Date(criarCotacaoDto.prazoResposta) : null,
      criadoPor: userId,
      atualizadoPor: userId,
    });

    const cotacaoSalva = await this.cotacaoRepository.save(cotacao);

    // Criar itens
    if (criarCotacaoDto.itens && criarCotacaoDto.itens.length > 0) {
      const itemEntities = criarCotacaoDto.itens.map((item, index) =>
        this.buildItemCotacaoEntity(item, {
          cotacaoId: cotacaoSalva.id,
          userId,
          empresaId,
          ordem: index + 1,
        }),
      );

      this.logger.debug(
        `Itens antes do save: ${JSON.stringify(
          itemEntities.map((e) => ({
            valorTotal: e.valorTotal,
            valorUnitario: e.valorUnitario,
            quantidade: e.quantidade,
            desconto: e.desconto,
          })),
        )}`,
      );

      // Atualizar valores calculados dos itens
      itemEntities.forEach((item) => {
        item.atualizarValores();
      });
      // ===================================

      // Usar save() ao invés de insert() para garantir que defaults sejam aplicados
      await this.itemCotacaoRepository.save(itemEntities);
      this.logger.debug('Itens salvos com sucesso.');
    }

    // Calcular e atualizar valor total
    await this.calcularValorTotal(cotacaoSalva.id);

    // Recarregar cotação com valor total atualizado
    const cotacaoAtualizada = await this.cotacaoRepository.findOne({
      where: { id: cotacaoSalva.id, empresaId },
    });

    // Log simples de auditoria
    console.log(
      `[AUDIT] COTACAO CREATE - ID: ${cotacaoSalva.id}, User: ${userId}, Numero: ${cotacaoSalva.numero}, Status: ${cotacaoSalva.status}`,
    );

    // ✅ FLUXO CORRETO: Só notifica se status = PENDENTE (não em RASCUNHO)
    // RASCUNHO = usuário ainda está editando, não está pronta
    // PENDENTE = foi enviada para aprovação, aprovador deve ser notificado
    if (criarCotacaoDto.aprovadorId && cotacaoSalva.status === StatusCotacao.PENDENTE) {
      const aprovador = await this.userRepository.findOne({
        where: { id: criarCotacaoDto.aprovadorId, empresa_id: empresaId },
      });

      if (aprovador) {
        const valorFormatado = cotacaoAtualizada.valorTotal
          ? `R$ ${Number(cotacaoAtualizada.valorTotal).toFixed(2)}`
          : 'A definir';

        this.notificationService
          .create({
            userId: aprovador.id,
            type: NotificationType.COTACAO_PENDENTE,
            title: `Nova cotação #${cotacaoAtualizada.numero} aguardando aprovação`,
            message: `${responsavel.nome} criou uma cotação que precisa da sua aprovação. Valor: ${valorFormatado}`,
            data: {
              cotacaoId: cotacaoAtualizada.id,
              cotacaoNumero: cotacaoAtualizada.numero,
              criadorId: userId,
              criadorNome: responsavel.nome,
              valorTotal: cotacaoAtualizada.valorTotal,
            },
          })
          .catch((err) => console.error('Erro ao criar notificação:', err));
      }
    }

    return this.buscarPorId(cotacaoSalva.id, userId, empresaId);
  }

  async listar(query: CotacaoQueryDto, userId: string, empresaId: string) {
    const queryBuilder = this.createQueryBuilder(empresaId);

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
        pages: Math.ceil(total / limit),
      },
      statistics: {
        total,
        totalValue,
        byStatus: await this.getStatusStatistics(empresaId),
        byPriority: await this.getPriorityStatistics(empresaId),
      },
    };
  }

  async minhasAprovacoes(userId: string, empresaId: string): Promise<CotacaoResponseDto[]> {
    const cotacoes = await this.cotacaoRepository.find({
      where: [
        {
          empresaId,
          aprovadorId: userId,
          status: StatusCotacao.RASCUNHO,
        },
        {
          empresaId,
          aprovadorId: userId,
          status: StatusCotacao.ENVIADA,
        },
        {
          empresaId,
          aprovadorId: userId,
          status: StatusCotacao.EM_ANALISE,
        },
      ],
      relations: ['fornecedor', 'responsavel', 'aprovador', 'itens', 'criadoPorUser'],
      order: {
        dataCriacao: 'DESC',
      },
    });

    return cotacoes.map((cotacao) => this.formatarCotacaoResponse(cotacao));
  }

  async buscarPorId(id: string, userId: string, empresaId: string): Promise<CotacaoResponseDto> {
    const cotacao = await this.cotacaoRepository.findOne({
      where: { id, empresaId },
      relations: [
        'fornecedor',
        'responsavel',
        'aprovador',
        'itens',
        'anexos',
        'criadoPorUser',
        'atualizadoPorUser',
      ],
    });

    if (!cotacao) {
      throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
    }

    return this.formatarCotacaoResponse(cotacao);
  }

  async atualizar(
    id: string,
    atualizarCotacaoDto: AtualizarCotacaoDto,
    userId: string,
    empresaId: string,
  ): Promise<CotacaoResponseDto> {
    const cotacao = await this.cotacaoRepository.findOne({
      where: { id, empresaId },
      relations: ['itens'],
    });

    if (!cotacao) {
      throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
    }

    // Verificar se pode ser editada
    if (!this.podeSerEditada(cotacao.status)) {
      throw new HttpException(
        'Cotação não pode ser editada no status atual',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validar fornecedor se foi alterado
    if (
      atualizarCotacaoDto.fornecedorId &&
      atualizarCotacaoDto.fornecedorId !== cotacao.fornecedorId
    ) {
      const fornecedor = await this.fornecedorRepository.findOne({
        where: { id: atualizarCotacaoDto.fornecedorId, empresaId },
      });

      if (!fornecedor) {
        throw new HttpException('Fornecedor não encontrado', HttpStatus.NOT_FOUND);
      }
    }

    // Validar aprovador se foi alterado
    if (atualizarCotacaoDto.aprovadorId) {
      const aprovador = await this.userRepository.findOne({
        where: { id: atualizarCotacaoDto.aprovadorId, empresa_id: empresaId },
      });

      if (!aprovador) {
        throw new HttpException('Aprovador não encontrado', HttpStatus.NOT_FOUND);
      }
    }

    // Atualizar cotação
    const { itens, ...dadosAtualizacao } = atualizarCotacaoDto;

    Object.assign(cotacao, {
      ...dadosAtualizacao,
      atualizadoPor: userId,
      dataAtualizacao: new Date(),
    });

    if (atualizarCotacaoDto.prazoResposta) {
      cotacao.prazoResposta = new Date(atualizarCotacaoDto.prazoResposta);
    }

    await this.cotacaoRepository.save(cotacao);

    // Atualizar itens se fornecidos
    if (itens) {
      // Remover itens existentes
      await this.itemCotacaoRepository.delete({ cotacaoId: id, empresaId });

      // Criar novos itens
      if (atualizarCotacaoDto.itens.length > 0) {
        const novosItens = atualizarCotacaoDto.itens.map((item, index) =>
          this.buildItemCotacaoEntity(item, {
            cotacaoId: id,
            userId,
            empresaId,
            ordem: index + 1,
          }),
        );

        novosItens.forEach((item) => item.atualizarValores());

        await this.itemCotacaoRepository.save(novosItens);
      }

      // Recalcular valor total
      await this.calcularValorTotal(id);
    }

    // Log simples de auditoria
    console.log(`[AUDIT] COTACAO UPDATE - ID: ${id}, User: ${userId}`);

    return this.buscarPorId(id, userId, empresaId);
  }

  async deletar(id: string, userId: string, empresaId: string): Promise<void> {
    const cotacao = await this.cotacaoRepository.findOne({
      where: { id, empresaId },
    });

    if (!cotacao) {
      throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
    }

    // Verificar se pode ser deletada
    if (!this.podeSerDeletada(cotacao.status)) {
      throw new HttpException(
        'Cotação não pode ser deletada no status atual',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Soft delete
    cotacao.deletadoEm = new Date();
    cotacao.deletadoPor = userId;
    await this.cotacaoRepository.save(cotacao);

    // Log simples de auditoria
    console.log(`[AUDIT] COTACAO DELETE - ID: ${id}, User: ${userId}, Numero: ${cotacao.numero}`);
  }

  /**
   * Envia cotação em RASCUNHO para aprovação
   * Muda status para PENDENTE e notifica o aprovador
   */
  async enviarParaAprovacao(id: string, userId: string, empresaId: string): Promise<CotacaoResponseDto> {
    try {
      // Buscar cotação com relações
      const cotacao = await this.cotacaoRepository.findOne({
        where: { id, empresaId },
        relations: ['aprovador', 'criadoPorUser', 'fornecedor', 'itens'],
      });

      if (!cotacao) {
        throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
      }

      // Verificar se o usuário é o criador
      if (cotacao.criadoPor !== userId) {
        throw new HttpException(
          'Apenas o criador pode enviar esta cotação para aprovação',
          HttpStatus.FORBIDDEN,
        );
      }

      // Verificar se está em RASCUNHO
      if (cotacao.status !== StatusCotacao.RASCUNHO) {
        throw new HttpException(
          `Apenas cotações em RASCUNHO podem ser enviadas para aprovação. Status atual: ${cotacao.status}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verificar se tem aprovador definido
      if (!cotacao.aprovadorId) {
        throw new HttpException(
          'É necessário definir um aprovador antes de enviar para aprovação',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verificar se tem itens
      if (!cotacao.itens || cotacao.itens.length === 0) {
        throw new HttpException(
          'É necessário adicionar ao menos um item antes de enviar para aprovação',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Mudar status para PENDENTE
      cotacao.status = StatusCotacao.PENDENTE;
      await this.cotacaoRepository.save(cotacao);

      // Criar notificação para o aprovador
      const aprovador = cotacao.aprovador;
      const criador = cotacao.criadoPorUser;

      if (aprovador && criador) {
        const valorFormatado = cotacao.valorTotal
          ? `R$ ${Number(cotacao.valorTotal).toFixed(2)}`
          : 'A definir';

        await this.notificationService.create({
          userId: aprovador.id,
          type: NotificationType.COTACAO_PENDENTE,
          title: `Nova cotação #${cotacao.numero} aguardando aprovação`,
          message: `${criador.nome} enviou uma cotação que precisa da sua aprovação. Valor: ${valorFormatado}`,
          data: {
            cotacaoId: cotacao.id,
            cotacaoNumero: cotacao.numero,
            criadorId: criador.id,
            criadorNome: criador.nome,
            valorTotal: cotacao.valorTotal,
          },
        });
      }

      // Log de auditoria
      console.log(
        `[AUDIT] COTACAO SEND_TO_APPROVAL - ID: ${id}, User: ${userId}, Numero: ${cotacao.numero}`,
      );

      return this.buscarPorId(id, userId, empresaId);
    } catch (error) {
      console.error('Erro ao enviar cotação para aprovação:', error.message);
      throw error;
    }
  }

  async aprovar(
    id: string,
    userId: string,
    empresaId: string,
    justificativa?: string,
  ): Promise<Cotacao> {
    const cotacao = await this.cotacaoRepository.findOne({
      where: { id, empresaId },
      relations: ['aprovador', 'fornecedor', 'itens', 'criadoPorUser'],
    });

    if (!cotacao) {
      throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
    }

    // Verificar se tem aprovador definido
    if (!cotacao.aprovadorId) {
      throw new HttpException(
        'Esta cotação não possui um aprovador definido',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Verificar se o usuário é o aprovador
    if (cotacao.aprovadorId !== userId) {
      throw new HttpException('Apenas o aprovador pode aprovar esta cotação', HttpStatus.FORBIDDEN);
    }

    // Verificar se já foi aprovada/reprovada
    if (cotacao.statusAprovacao) {
      throw new HttpException(`Cotação já foi ${cotacao.statusAprovacao}`, HttpStatus.BAD_REQUEST);
    }

    // Atualizar campos de aprovação
    cotacao.statusAprovacao = 'aprovado';
    cotacao.dataAprovacao = new Date();
    cotacao.justificativaAprovacao = justificativa || null;
    cotacao.status = StatusCotacao.APROVADA;

    await this.cotacaoRepository.save(cotacao);

    console.log(
      `[AUDIT] COTACAO APROVADA - ID: ${id}, Aprovador: ${userId}, Numero: ${cotacao.numero}`,
    );

    // Enviar email de notificação (async, não bloqueia resposta)
    const aprovador = await this.userRepository.findOne({ where: { id: userId, empresa_id: empresaId } });
    if (aprovador) {
      // Enviar email
      this.cotacaoEmailService
        .notificarCotacaoAprovada(cotacao, aprovador, justificativa)
        .catch((err) => console.error('Erro ao enviar email de aprovação:', err));

      // Criar notificação no sistema
      if (cotacao.criadoPor) {
        this.notificationService
          .create({
            userId: cotacao.criadoPor,
            type: NotificationType.COTACAO_APROVADA,
            title: `Cotação #${cotacao.numero} aprovada`,
            message: `Sua cotação foi aprovada por ${aprovador.nome}${justificativa ? `. Justificativa: ${justificativa}` : ''}`,
            data: {
              cotacaoId: cotacao.id,
              cotacaoNumero: cotacao.numero,
              aprovadorId: aprovador.id,
              aprovadorNome: aprovador.nome,
              dataAprovacao: cotacao.dataAprovacao,
            },
          })
          .then(() => console.log(`✅ Notificação criada para cotação #${cotacao.numero}`))
          .catch((err) => console.error(`❌ Erro ao criar notificação:`, err));
      }
    }

    return cotacao;
  }

  async reprovar(id: string, userId: string, empresaId: string, justificativa: string): Promise<Cotacao> {
    const cotacao = await this.cotacaoRepository.findOne({
      where: { id, empresaId },
      relations: ['aprovador', 'fornecedor', 'itens', 'criadoPorUser'],
    });

    if (!cotacao) {
      throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
    }

    // Verificar se o usuário é o aprovador
    if (cotacao.aprovadorId !== userId) {
      throw new HttpException(
        'Apenas o aprovador pode reprovar esta cotação',
        HttpStatus.FORBIDDEN,
      );
    }

    // Verificar se já foi aprovada/reprovada
    if (cotacao.statusAprovacao) {
      throw new HttpException(`Cotação já foi ${cotacao.statusAprovacao}`, HttpStatus.BAD_REQUEST);
    }

    // Justificativa é obrigatória para reprovação
    if (!justificativa || justificativa.trim() === '') {
      throw new HttpException(
        'Justificativa é obrigatória para reprovar uma cotação',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Atualizar campos de reprovação
    cotacao.statusAprovacao = 'reprovado';
    cotacao.dataAprovacao = new Date();
    cotacao.justificativaAprovacao = justificativa;
    cotacao.status = StatusCotacao.REJEITADA;

    await this.cotacaoRepository.save(cotacao);

    console.log(
      `[AUDIT] COTACAO REPROVADA - ID: ${id}, Aprovador: ${userId}, Numero: ${cotacao.numero}`,
    );

    // Enviar email de notificação (async, não bloqueia resposta)
    const aprovador = await this.userRepository.findOne({ where: { id: userId, empresa_id: empresaId } });
    if (aprovador) {
      // Enviar email
      this.cotacaoEmailService
        .notificarCotacaoReprovada(cotacao, aprovador, justificativa)
        .then(() => console.log(`✅ Email de reprovação enviado para cotação #${cotacao.numero}`))
        .catch((err) => console.error(`❌ Erro ao enviar email de reprovação:`, err));

      // Criar notificação no sistema
      if (cotacao.criadoPor) {
        this.notificationService
          .create({
            userId: cotacao.criadoPor,
            type: NotificationType.COTACAO_REPROVADA,
            title: `Cotação #${cotacao.numero} reprovada`,
            message: `Sua cotação foi reprovada por ${aprovador.nome}. Justificativa: ${justificativa}`,
            data: {
              cotacaoId: cotacao.id,
              cotacaoNumero: cotacao.numero,
              aprovadorId: aprovador.id,
              aprovadorNome: aprovador.nome,
              dataReprovacao: cotacao.dataAprovacao,
              justificativa,
            },
          })
          .then(() => console.log(`✅ Notificação criada para cotação #${cotacao.numero}`))
          .catch((err) => console.error(`❌ Erro ao criar notificação:`, err));
      }
    }

    return cotacao;
  }

  async aprovarLote(
    cotacaoIds: string[],
    userId: string,
    empresaId: string,
    justificativa?: string,
  ): Promise<{
    total: number;
    sucessos: number;
    falhas: number;
    cotacoesProcessadas: string[];
    erros: Array<{ cotacaoId: string; erro: string }>;
  }> {
    const resultado = {
      total: cotacaoIds.length,
      sucessos: 0,
      falhas: 0,
      cotacoesProcessadas: [] as string[],
      erros: [] as Array<{ cotacaoId: string; erro: string }>,
    };

    for (const cotacaoId of cotacaoIds) {
      try {
        await this.aprovar(cotacaoId, userId, empresaId, justificativa);
        resultado.sucessos++;
        resultado.cotacoesProcessadas.push(cotacaoId);
      } catch (error) {
        resultado.falhas++;
        resultado.erros.push({
          cotacaoId,
          erro: error.message || 'Erro desconhecido',
        });
      }
    }

    console.log(
      `[AUDIT] APROVACAO LOTE - Total: ${resultado.total}, Sucessos: ${resultado.sucessos}, Falhas: ${resultado.falhas}, Aprovador: ${userId}`,
    );

    return resultado;
  }

  async reprovarLote(
    cotacaoIds: string[],
    userId: string,
    empresaId: string,
    justificativa: string,
  ): Promise<{
    total: number;
    sucessos: number;
    falhas: number;
    cotacoesProcessadas: string[];
    erros: Array<{ cotacaoId: string; erro: string }>;
  }> {
    // Validar justificativa
    if (!justificativa || justificativa.trim() === '') {
      throw new HttpException(
        'Justificativa é obrigatória para reprovar cotações',
        HttpStatus.BAD_REQUEST,
      );
    }

    const resultado = {
      total: cotacaoIds.length,
      sucessos: 0,
      falhas: 0,
      cotacoesProcessadas: [] as string[],
      erros: [] as Array<{ cotacaoId: string; erro: string }>,
    };

    for (const cotacaoId of cotacaoIds) {
      try {
        await this.reprovar(cotacaoId, userId, empresaId, justificativa);
        resultado.sucessos++;
        resultado.cotacoesProcessadas.push(cotacaoId);
      } catch (error) {
        resultado.falhas++;
        resultado.erros.push({
          cotacaoId,
          erro: error.message || 'Erro desconhecido',
        });
      }
    }

    console.log(
      `[AUDIT] REPROVACAO LOTE - Total: ${resultado.total}, Sucessos: ${resultado.sucessos}, Falhas: ${resultado.falhas}, Aprovador: ${userId}`,
    );

    return resultado;
  }

  async alterarStatus(
    id: string,
    novoStatus: StatusCotacao,
    observacao: string | undefined,
    userId: string,
    empresaId: string,
  ): Promise<CotacaoResponseDto> {
    
    const cotacao = await this.cotacaoRepository.findOne({
      where: { id, empresaId },
    });

    if (!cotacao) {
      throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
    }

    // Validar transição de status
    if (!this.isValidStatusTransition(cotacao.status, novoStatus)) {
      throw new HttpException(
        `Transição de status inválida: ${cotacao.status} → ${novoStatus}`,
        HttpStatus.BAD_REQUEST,
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
      cotacao.observacoes =
        (cotacao.observacoes || '') + `\n[${new Date().toLocaleString()}] ${observacao}`;
    }

    await this.cotacaoRepository.save(cotacao);

    // Log simples de auditoria
    console.log(
      `[AUDIT] COTACAO UPDATE_STATUS - ID: ${id}, User: ${userId}, ${statusAnterior} → ${novoStatus}`,
    );

    return this.buscarPorId(id, userId, empresaId);
  }

  async gerarPDF(id: string, userId: string, empresaId: string): Promise<Buffer> {
    const cotacao = await this.buscarPorId(id, userId, empresaId);

    // Log simples de auditoria
    console.log(
      `[AUDIT] COTACAO GENERATE_PDF - ID: ${id}, User: ${userId}, Numero: ${cotacao.numero}`,
    );

    // Implementação básica - retorna dados como buffer JSON
    const dados = JSON.stringify(
      {
        type: 'cotacao_pdf',
        cotacao,
        geradoEm: new Date(),
        geradoPor: userId,
      },
      null,
      2,
    );

    return Buffer.from(dados, 'utf-8');
  }

  async enviarEmail(
    id: string,
    enviarEmailDto: EnviarEmailDto,
    userId: string,
    empresaId: string,
  ): Promise<void> {
    const cotacao = await this.buscarPorId(id, userId, empresaId);

    // Log simples em vez de envio real
    console.log(
      `[EMAIL] COTACAO SEND - ID: ${id}, Destinatarios: ${enviarEmailDto.destinatarios.join(', ')}, Assunto: ${enviarEmailDto.assunto}`,
    );

    // Atualizar status se ainda for rascunho
    if (cotacao.status === StatusCotacao.RASCUNHO) {
      await this.alterarStatus(id, StatusCotacao.ENVIADA, 'Enviada por email', userId, empresaId);
    }

    // Log simples de auditoria
    console.log(
      `[AUDIT] COTACAO SEND_EMAIL - ID: ${id}, User: ${userId}, Destinatarios: ${enviarEmailDto.destinatarios.length}`,
    );
  }

  async obterHistorico(id: string, userId: string, empresaId: string) {
    const cotacao = await this.cotacaoRepository.findOne({ where: { id, empresaId } });
    if (!cotacao) {
      throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
    }

    return {
      message: 'Histórico não disponível - módulo de auditoria não configurado',
      cotacaoId: id,
      consultadoPor: userId,
      consultadoEm: new Date(),
    };
  }

  // Métodos auxiliares privados
  private createQueryBuilder(empresaId: string): SelectQueryBuilder<Cotacao> {
    return this.cotacaoRepository
      .createQueryBuilder('cotacao')
      .leftJoinAndSelect('cotacao.fornecedor', 'fornecedor')
      .leftJoinAndSelect('cotacao.responsavel', 'responsavel')
      .leftJoinAndSelect('cotacao.aprovador', 'aprovador')
      .leftJoinAndSelect('cotacao.itens', 'itens')
      .where('cotacao.deletadoEm IS NULL')
      .andWhere('cotacao.empresaId = :empresaId', { empresaId });
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Cotacao>,
    query: CotacaoQueryDto,
    userId: string,
  ) {
    // Filtro por cliente
    if (query.fornecedorId) {
      queryBuilder.andWhere('cotacao.fornecedorId = :fornecedorId', {
        fornecedorId: query.fornecedorId,
      });
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
      queryBuilder.andWhere('cotacao.responsavelId = :responsavelId', {
        responsavelId: query.responsavelId,
      });
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
        '(cotacao.numero ILIKE :busca OR cotacao.titulo ILIKE :busca OR fornecedor.nome ILIKE :busca)',
        { busca: `%${query.busca}%` },
      );
    }
  }

  private async gerarNumeroCotacao(empresaId: string): Promise<string> {
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

    console.log(`🧮 calcularValorTotal - Cotacao ID: ${cotacaoId}`);
    console.log(`🧮 Soma dos itens: ${resultado?.total}`);
    console.log(`🧮 Valor total calculado: ${valorTotal}`);

    await this.cotacaoRepository.update(cotacaoId, { valorTotal });

    console.log(`✅ Valor total atualizado no banco: ${valorTotal}`);
  }

  private buildItemCotacaoEntity(
    item: CriarItemCotacaoDto,
    context: { cotacaoId: string; userId: string; empresaId: string; ordem: number },
  ): ItemCotacao {
    const quantidade = Number(item.quantidade) || 0;
    const valorUnitario = Number(item.valorUnitario) || 0;
    const descontoPercentual = item.desconto ?? 0;
    const aliquotaImposto = item.aliquotaImposto ?? 0;

    const valorBruto = quantidade * valorUnitario;
    const valorDesconto = (valorBruto * descontoPercentual) / 100;
    const valorBase = valorBruto - valorDesconto;
    const valorImposto = (valorBase * aliquotaImposto) / 100;
    const valorTotal = valorBase + valorImposto;
    const valorLiquido = valorTotal - valorImposto;

    // Log para debug
    this.logger.debug(
      `Cálculos do item: ${JSON.stringify({
        quantidade,
        valorUnitario,
        valorBruto,
        descontoPercentual,
        valorDesconto,
        valorBase,
        aliquotaImposto,
        valorImposto,
        valorTotal,
        valorLiquido,
      })}`,
    );

    // Criar entidade diretamente ao invés de usar repository.create()
    const entity = new ItemCotacao();
    entity.descricao = item.descricao;
    entity.unidade = item.unidade;
    entity.observacoes = item.observacoes;
    entity.codigo = item.codigo;
    entity.categoria = item.categoria;
    entity.prazoEntregaDias = item.prazoEntregaDias;
    entity.especificacoes = item.especificacoes;
    entity.quantidade = quantidade;
    entity.valorUnitario = valorUnitario;
    entity.desconto = descontoPercentual;
    entity.aliquotaImposto = aliquotaImposto;
    entity.cotacaoId = context.cotacaoId;
    entity.empresaId = context.empresaId;
    entity.ordem = context.ordem;
    entity.valorDesconto = valorDesconto;
    entity.valorImposto = valorImposto;
    entity.valorTotal = valorTotal;
    entity.valorLiquido = valorLiquido;
    entity.criadoPor = context.userId;
    entity.atualizadoPor = context.userId;

    this.logger.debug(
      `Entidade montada: ${JSON.stringify({
        valorTotal: entity.valorTotal,
        valorDesconto: entity.valorDesconto,
        criadoPor: entity.criadoPor,
      })}`,
    );

    return entity;
  }

  private podeSerEditada(status: StatusCotacao): boolean {
    return [StatusCotacao.RASCUNHO, StatusCotacao.ENVIADA].includes(status);
  }

  private podeSerDeletada(status: StatusCotacao): boolean {
    return [StatusCotacao.RASCUNHO, StatusCotacao.REJEITADA, StatusCotacao.VENCIDA].includes(
      status,
    );
  }

  private isValidStatusTransition(statusAtual: StatusCotacao, novoStatus: StatusCotacao): boolean {
    const transicoes = {
      [StatusCotacao.RASCUNHO]: [StatusCotacao.ENVIADA, StatusCotacao.CANCELADA],
      [StatusCotacao.ENVIADA]: [
        StatusCotacao.EM_ANALISE,
        StatusCotacao.APROVADA,
        StatusCotacao.REJEITADA,
        StatusCotacao.VENCIDA,
      ],
      [StatusCotacao.EM_ANALISE]: [
        StatusCotacao.APROVADA,
        StatusCotacao.REJEITADA,
        StatusCotacao.VENCIDA,
      ],
      [StatusCotacao.APROVADA]: [StatusCotacao.CONVERTIDA],
      [StatusCotacao.REJEITADA]: [StatusCotacao.RASCUNHO],
      [StatusCotacao.VENCIDA]: [StatusCotacao.RASCUNHO],
      [StatusCotacao.CONVERTIDA]: [],
      [StatusCotacao.CANCELADA]: [],
    };

    return transicoes[statusAtual]?.includes(novoStatus) || false;
  }

  private async getStatusStatistics(empresaId: string) {
    const result = await this.cotacaoRepository
      .createQueryBuilder('cotacao')
      .select('cotacao.status', 'status')
      .addSelect('COUNT(*)', 'quantidade')
      .where('cotacao.deletadoEm IS NULL')
      .andWhere('cotacao.empresaId = :empresaId', { empresaId })
      .groupBy('cotacao.status')
      .getRawMany();

    return result.map((item) => ({
      status: item.status,
      quantidade: parseInt(item.quantidade),
    }));
  }

  private async getPriorityStatistics(empresaId: string) {
    const result = await this.cotacaoRepository
      .createQueryBuilder('cotacao')
      .select('cotacao.prioridade', 'prioridade')
      .addSelect('COUNT(*)', 'quantidade')
      .where('cotacao.deletadoEm IS NULL')
      .andWhere('cotacao.empresaId = :empresaId', { empresaId })
      .groupBy('cotacao.prioridade')
      .getRawMany();

    return result.map((item) => ({
      prioridade: item.prioridade,
      quantidade: parseInt(item.quantidade),
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
      prazoResposta: cotacao.prazoResposta,
      dataVencimento: cotacao.prazoResposta, // Alias para compatibilidade frontend
      observacoes: cotacao.observacoes,
      condicoesPagamento: cotacao.condicoesPagamento,
      prazoEntrega: cotacao.prazoEntrega,
      validadeOrcamento: cotacao.validadeOrcamento,
      origem: cotacao.origem,
      fornecedorId: cotacao.fornecedorId,
      fornecedor: cotacao.fornecedor
        ? {
            id: cotacao.fornecedor.id,
            nome: cotacao.fornecedor.nome,
            email: cotacao.fornecedor.email,
            telefone: cotacao.fornecedor.telefone,
          }
        : null,
      responsavelId: cotacao.responsavelId,
      responsavel: cotacao.responsavel
        ? {
            id: cotacao.responsavel.id,
            nome: cotacao.responsavel.nome,
            email: cotacao.responsavel.email,
          }
        : null,
      aprovadorId: cotacao.aprovadorId,
      aprovador: cotacao.aprovador
        ? {
            id: cotacao.aprovador.id,
            nome: cotacao.aprovador.nome,
            email: cotacao.aprovador.email,
          }
        : null,
      itens:
        cotacao.itens?.map((item) => ({
          id: item.id,
          descricao: item.descricao,
          quantidade: item.quantidade,
          unidade: item.unidade,
          valorUnitario: item.valorUnitario,
          valorTotal: item.valorTotal,
          valorDesconto: item.valorDesconto || 0,
          valorImposto: item.valorImposto || 0,
          valorLiquido: item.valorLiquido || item.valorTotal,
          observacoes: item.observacoes,
          dataCriacao: item.dataCriacao || new Date(),
        })) || [],
      anexos:
        cotacao.anexos?.map((anexo) => ({
          id: anexo.id,
          nome: anexo.nome,
          tipo: anexo.tipo,
          url: anexo.url,
          tamanho: anexo.tamanho,
          dataCriacao: anexo.dataCriacao,
        })) || [],
      dataCriacao: cotacao.dataCriacao,
      dataAtualizacao: cotacao.dataAtualizacao,
      dataEnvio: cotacao.dataEnvio,
      dataAprovacao: cotacao.dataAprovacao,
      dataRejeicao: cotacao.dataRejeicao,
      dataConversao: cotacao.dataConversao,
      criadoPor: cotacao.criadoPor,
      atualizadoPor: cotacao.atualizadoPor,
    };
  }

  async obterEstatisticas(userId: string, empresaId: string): Promise<any> {
    const total = await this.cotacaoRepository.count({ where: { empresaId, deletadoEm: IsNull() } });
    const pendentes = await this.cotacaoRepository.count({
      where: { empresaId, deletadoEm: IsNull(), status: StatusCotacao.RASCUNHO },
    });
    const aprovadas = await this.cotacaoRepository.count({
      where: { empresaId, deletadoEm: IsNull(), status: StatusCotacao.APROVADA },
    });
    const rejeitadas = await this.cotacaoRepository.count({
      where: { empresaId, deletadoEm: IsNull(), status: StatusCotacao.REJEITADA },
    });

    return {
      total,
      pendentes,
      aprovadas,
      rejeitadas,
    };
  }

  async obterDashboard(userId: string, empresaId: string): Promise<any> {
    const estatisticas = await this.obterEstatisticas(userId, empresaId);
    return {
      ...estatisticas,
      recentes: await this.listar({ page: 1, limit: 5 } as any, userId, empresaId),
    };
  }

  async duplicar(
    id: string,
    duplicarDto: DuplicarCotacaoDto,
    userId: string,
    empresaId: string,
  ): Promise<CotacaoResponseDto> {
    const cotacaoOriginal = await this.cotacaoRepository.findOne({
      where: { id, empresaId },
      relations: ['itens'],
    });

    if (!cotacaoOriginal) {
      throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
    }

    const numero = await this.gerarNumeroCotacao(empresaId);

    const novaCotacao = this.cotacaoRepository.create({
      numero,
      empresaId,
      titulo: cotacaoOriginal.titulo,
      descricao: cotacaoOriginal.descricao,
      status: StatusCotacao.RASCUNHO,
      prioridade: cotacaoOriginal.prioridade,
      fornecedorId: cotacaoOriginal.fornecedorId,
      responsavelId: userId,
      aprovadorId: cotacaoOriginal.aprovadorId,
      prazoResposta: cotacaoOriginal.prazoResposta,
      observacoes: duplicarDto.observacoes || cotacaoOriginal.observacoes,
      condicoesPagamento: cotacaoOriginal.condicoesPagamento,
      prazoEntrega: cotacaoOriginal.prazoEntrega,
      validadeOrcamento: cotacaoOriginal.validadeOrcamento,
      origem: cotacaoOriginal.origem,
      criadoPor: userId,
      atualizadoPor: userId,
    });

    const cotacaoSalva = await this.cotacaoRepository.save(novaCotacao);

    if (cotacaoOriginal.itens?.length) {
      const itensDuplicados = cotacaoOriginal.itens.map((item, index) => {
        const novoItem = new ItemCotacao();
        novoItem.empresaId = empresaId;
        novoItem.cotacaoId = cotacaoSalva.id;
        novoItem.ordem = index + 1;
        novoItem.descricao = item.descricao;
        novoItem.unidade = item.unidade;
        novoItem.observacoes = item.observacoes;
        novoItem.codigo = item.codigo;
        novoItem.categoria = item.categoria;
        novoItem.prazoEntregaDias = item.prazoEntregaDias;
        novoItem.especificacoes = item.especificacoes;
        novoItem.quantidade = item.quantidade;
        novoItem.valorUnitario = item.valorUnitario;
        novoItem.desconto = item.desconto;
        novoItem.aliquotaImposto = item.aliquotaImposto;
        novoItem.criadoPor = userId;
        novoItem.atualizadoPor = userId;
        novoItem.atualizarValores();
        return novoItem;
      });

      await this.itemCotacaoRepository.save(itensDuplicados);
      await this.calcularValorTotal(cotacaoSalva.id);
    }

    return this.buscarPorId(cotacaoSalva.id, userId, empresaId);
  }

  async converterEmPedido(
    id: string,
    observacoes: string,
    userId: string,
    empresaId: string,
  ): Promise<any> {
    const cotacao = await this.cotacaoRepository.findOne({ where: { id, empresaId } });
    if (!cotacao) {
      throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
    }

    if (cotacao.status !== StatusCotacao.APROVADA) {
      throw new HttpException(
        'Apenas cotações aprovadas podem ser convertidas em pedido',
        HttpStatus.BAD_REQUEST,
      );
    }

    cotacao.status = StatusCotacao.CONVERTIDA;
    cotacao.dataConversao = new Date();
    cotacao.observacoes = observacoes;
    cotacao.atualizadoPor = userId;

    await this.cotacaoRepository.save(cotacao);

    return {
      id: `PED-${Date.now()}`,
      cotacaoId: id,
      status: 'CRIADO',
      observacoes,
    };
  }

  async exportar(
    formato: string,
    filtros: any,
    userId: string,
    empresaId: string,
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {

    const cotacoes = await this.cotacaoRepository.find({
      where: { empresaId, deletadoEm: IsNull() },
      order: { dataCriacao: 'DESC' },
      take: 5000,
    });

    const normalized = (formato || '').toString().toUpperCase();

    if (normalized === 'PDF') {
      const pdfContent = JSON.stringify(cotacoes);
      return {
        buffer: Buffer.from(pdfContent),
        filename: `cotacoes_${Date.now()}.pdf`,
        mimeType: 'application/pdf',
      };
    }

    if (normalized === 'EXCEL' || normalized === 'XLSX') {
      const excelContent = JSON.stringify(cotacoes);
      return {
        buffer: Buffer.from(excelContent),
        filename: `cotacoes_${Date.now()}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }

    if (normalized === 'CSV' || normalized === '') {
      const header = 'id,numero,titulo,status,valorTotal\n';
      const rows = cotacoes
        .map((c) =>
          [c.id, c.numero, (c.titulo || '').replace(/\"/g, '""'), c.status, c.valorTotal ?? '']
            .map((v) => `"${String(v ?? '')}"`)
            .join(','),
        )
        .join('\n');
      return {
        buffer: Buffer.from(header + rows, 'utf-8'),
        filename: `cotacoes_${Date.now()}.csv`,
        mimeType: 'text/csv; charset=utf-8',
      };
    }
    throw new HttpException('Formato não suportado', HttpStatus.BAD_REQUEST);
  }

  async importar(dados: any, validarApenas: boolean, userId: string, empresaId: string): Promise<any> {
    // Implementar lógica de importação
    return {
      sucesso: 0,
      erros: 0,
      mensagens: [],
    };
  }

  async listarAnexos(id: string, userId: string, empresaId: string): Promise<any[]> {
    const cotacao = await this.cotacaoRepository.findOne({ where: { id, empresaId } });
    if (!cotacao) {
      throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
    }
    const anexos = await this.anexoCotacaoRepository.find({
      where: { cotacaoId: id, empresaId },
    });

    return anexos;
  }

  async adicionarAnexo(id: string, body: any, userId: string, empresaId: string): Promise<any> {
    const cotacao = await this.cotacaoRepository.findOne({ where: { id, empresaId } });
    if (!cotacao) {
      throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
    }
    const anexo = this.anexoCotacaoRepository.create({
      cotacaoId: id,
      empresaId,
      nome: body.nome,
      tipo: body.tipo,
      url: body.url,
      tamanho: body.tamanho,
      criadoPor: userId,
    });

    return this.anexoCotacaoRepository.save(anexo);
  }

  async removerAnexo(id: string, anexoId: string, userId: string, empresaId: string): Promise<void> {
    const cotacao = await this.cotacaoRepository.findOne({ where: { id, empresaId } });
    if (!cotacao) {
      throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
    }
    await this.anexoCotacaoRepository.delete({
      id: anexoId,
      cotacaoId: id,
      empresaId,
    });
  }

  async buscarProximoNumero(userId: string, empresaId: string): Promise<string> {
    return this.gerarNumeroCotacao(empresaId);
  }

  async buscarTemplates(userId: string, empresaId: string): Promise<any[]> {
    // Por enquanto retorna templates padrão
    // Futuramente pode ser uma tabela separada
    return [
      {
        id: '1',
        nome: 'Template Padrão',
        descricao: 'Template padrão para cotações',
        dados: {
          observacoes: 'Cotação válida por 30 dias',
          condicoesPagamento: 'À vista',
          prazoEntrega: '7 dias úteis',
        },
      },
      {
        id: '2',
        nome: 'Template Serviços',
        descricao: 'Template para cotações de serviços',
        dados: {
          observacoes: 'Serviços sob demanda',
          condicoesPagamento: '50% antecipado, 50% na entrega',
          prazoEntrega: 'A combinar',
        },
      },
    ];
  }

  async salvarTemplate(
    dados: { nome: string; descricao?: string; dados: any },
    userId: string,
    empresaId: string,
  ): Promise<any> {
    // Por enquanto retorna sucesso
    // Futuramente implementar tabela de templates
    return {
      id: Date.now().toString(),
      nome: dados.nome,
      descricao: dados.descricao,
      dados: dados.dados,
      criadoPor: userId,
      criadoEm: new Date(),
    };
  }
}


