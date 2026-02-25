import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In, Between, IsNull } from 'typeorm';
import { Cotacao, StatusCotacao } from './entities/cotacao.entity';
import { ItemCotacao } from './entities/item-cotacao.entity';
import { AnexoCotacao } from './entities/anexo-cotacao.entity';
import { Fornecedor } from '../modules/financeiro/entities/fornecedor.entity';
import { ContaPagarService } from '../modules/financeiro/services/conta-pagar.service';
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
  GerarContaPagarDto,
} from './dto/cotacao.dto';

@Injectable()
export class CotacaoService {
  private readonly logger = new Logger(CotacaoService.name);

  private maskEmail(email?: string | null): string {
    if (!email) return '[email]';
    const [local, domain] = String(email).split('@');
    if (!domain) return '[email]';
    const localMasked =
      local.length <= 2 ? `${local[0] || '*'}*` : `${local.slice(0, 2)}***${local.slice(-1)}`;
    return `${localMasked}@${domain}`;
  }

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

    private contaPagarService: ContaPagarService,
    private cotacaoEmailService: CotacaoEmailService,
    private notificationService: NotificationService,
  ) {}

  async obterMetadataCriacao(_userId: string, empresaId: string): Promise<{
    fornecedores: Array<{ id: string; nome: string }>;
    aprovadores: Array<{ id: string; nome: string; email: string; role: string }>;
  }> {
    const [fornecedores, aprovadores] = await Promise.all([
      this.fornecedorRepository.find({
        select: {
          id: true,
          nome: true,
        },
        where: {
          empresaId,
          ativo: true,
        },
        order: {
          nome: 'ASC',
        },
      }),
      this.userRepository.find({
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
        },
        where: {
          empresa_id: empresaId,
          ativo: true,
        },
        order: {
          nome: 'ASC',
        },
      }),
    ]);

    return {
      fornecedores: fornecedores.map((fornecedor) => ({
        id: fornecedor.id,
        nome: fornecedor.nome,
      })),
      aprovadores: aprovadores.map((usuario) => ({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: String(usuario.role ?? ''),
      })),
    };
  }

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
    this.logger.log(
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
          .catch((err) => this.logger.error('Erro ao criar notificacao', err?.stack || String(err)));
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
    const cotacoes = await this.cotacaoRepository
      .createQueryBuilder('cotacao')
      .leftJoinAndSelect('cotacao.fornecedor', 'fornecedor')
      .leftJoinAndSelect('cotacao.responsavel', 'responsavel')
      .leftJoinAndSelect('cotacao.aprovador', 'aprovador')
      .where('cotacao.empresaId = :empresaId', { empresaId })
      .andWhere('cotacao.aprovadorId = :userId', { userId })
      .andWhere('cotacao.deletadoEm IS NULL')
      // Compatibilidade com schemas legados: alguns bancos não têm enum 'em_analise'.
      .andWhere('cotacao.status::text IN (:...statusPendentes)', {
        statusPendentes: [StatusCotacao.PENDENTE, StatusCotacao.EM_ANALISE],
      })
      .orderBy('cotacao.dataCriacao', 'DESC')
      .getMany();

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
    this.logger.log(`[AUDIT] COTACAO UPDATE - ID: ${id}, User: ${userId}`);

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
    this.logger.log(`[AUDIT] COTACAO DELETE - ID: ${id}, User: ${userId}, Numero: ${cotacao.numero}`);
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
      this.logger.log(
        `[AUDIT] COTACAO SEND_TO_APPROVAL - ID: ${id}, User: ${userId}, Numero: ${cotacao.numero}`,
      );

      return this.buscarPorId(id, userId, empresaId);
    } catch (error) {
      this.logger.error(
        'Erro ao enviar cotacao para aprovacao',
        error?.stack || error?.message || String(error),
      );
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

    // Verificar se está aguardando aprovação
    if (![StatusCotacao.PENDENTE, StatusCotacao.EM_ANALISE].includes(cotacao.status)) {
      throw new HttpException(
        `Cotação não está disponível para aprovação no status atual: ${cotacao.status}`,
        HttpStatus.BAD_REQUEST,
      );
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

    this.logger.log(
      `[AUDIT] COTACAO APROVADA - ID: ${id}, Aprovador: ${userId}, Numero: ${cotacao.numero}`,
    );

    // Enviar email de notificação (async, não bloqueia resposta)
    const aprovador = await this.userRepository.findOne({ where: { id: userId, empresa_id: empresaId } });
    if (aprovador) {
      // Enviar email
      this.cotacaoEmailService
        .notificarCotacaoAprovada(cotacao, aprovador, justificativa)
        .catch((err) => this.logger.error('Erro ao enviar email de aprovacao', err?.stack || String(err)));

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
          .then(() => this.logger.debug(`Notificacao criada para cotacao #${cotacao.numero}`))
          .catch((err) => this.logger.error('Erro ao criar notificacao', err?.stack || String(err)));
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

    // Verificar se está aguardando aprovação
    if (![StatusCotacao.PENDENTE, StatusCotacao.EM_ANALISE].includes(cotacao.status)) {
      throw new HttpException(
        `Cotação não está disponível para reprovação no status atual: ${cotacao.status}`,
        HttpStatus.BAD_REQUEST,
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
    cotacao.dataRejeicao = cotacao.dataAprovacao;
    cotacao.justificativaAprovacao = justificativa;
    cotacao.status = StatusCotacao.REJEITADA;

    await this.cotacaoRepository.save(cotacao);

    this.logger.log(
      `[AUDIT] COTACAO REPROVADA - ID: ${id}, Aprovador: ${userId}, Numero: ${cotacao.numero}`,
    );

    // Enviar email de notificação (async, não bloqueia resposta)
    const aprovador = await this.userRepository.findOne({ where: { id: userId, empresa_id: empresaId } });
    if (aprovador) {
      // Enviar email
      this.cotacaoEmailService
        .notificarCotacaoReprovada(cotacao, aprovador, justificativa)
        .then(() => this.logger.debug(`Email de reprovacao enviado para cotacao #${cotacao.numero}`))
        .catch((err) => this.logger.error('Erro ao enviar email de reprovacao', err?.stack || String(err)));

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
          .then(() => this.logger.debug(`Notificacao criada para cotacao #${cotacao.numero}`))
          .catch((err) => this.logger.error('Erro ao criar notificacao', err?.stack || String(err)));
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

    this.logger.log(
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

    this.logger.log(
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

    const statusRestritoPorFluxo = new Set<StatusCotacao>([
      StatusCotacao.PENDENTE,
      StatusCotacao.APROVADA,
      StatusCotacao.REJEITADA,
      StatusCotacao.PEDIDO_GERADO,
      StatusCotacao.ADQUIRIDO,
      StatusCotacao.CONVERTIDA,
    ]);

    if (statusRestritoPorFluxo.has(novoStatus)) {
      throw new HttpException(
        `Status ${novoStatus} deve ser alterado pelo fluxo específico (enviar para aprovação, aprovar/reprovar ou converter em pedido)`,
        HttpStatus.BAD_REQUEST,
      );
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
    this.logger.log(
      `[AUDIT] COTACAO UPDATE_STATUS - ID: ${id}, User: ${userId}, ${statusAnterior} → ${novoStatus}`,
    );

    return this.buscarPorId(id, userId, empresaId);
  }

  async gerarPDF(id: string, userId: string, empresaId: string): Promise<Buffer> {
    const cotacao = await this.buscarPorId(id, userId, empresaId);

    // Log simples de auditoria
    this.logger.log(
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
    this.logger.log(
      `[EMAIL] COTACAO SEND - resumo: ${JSON.stringify({
        id,
        destinatarios: Array.isArray(enviarEmailDto.destinatarios)
          ? enviarEmailDto.destinatarios.length
          : 0,
        dominios: (enviarEmailDto.destinatarios || [])
          .filter((d) => typeof d === 'string' && d.includes('@'))
          .slice(0, 5)
          .map((d) => d.split('@')[1]),
        assunto: (enviarEmailDto.assunto || '').slice(0, 120),
      })}`,
    );

    // Atualizar status se ainda for rascunho
    if (cotacao.status === StatusCotacao.RASCUNHO) {
      await this.alterarStatus(id, StatusCotacao.ENVIADA, 'Enviada por email', userId, empresaId);
    }

    // Log simples de auditoria
    this.logger.log(
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
  private mergeCompraMetadados(
    metadadosAtual: Record<string, any> | null | undefined,
    compraPatch: Record<string, any>,
  ): Record<string, any> {
    const metadados = metadadosAtual && typeof metadadosAtual === 'object' ? metadadosAtual : {};
    const compraAtual =
      metadados.compra && typeof metadados.compra === 'object' ? metadados.compra : {};

    return {
      ...metadados,
      compra: {
        ...compraAtual,
        ...compraPatch,
      },
    };
  }

  private appendObservacaoFluxo(observacoesAtual: string | null | undefined, texto: string): string {
    const carimbo = `[${new Date().toLocaleString()}] ${texto}`;
    return observacoesAtual ? `${observacoesAtual}\n${carimbo}` : carimbo;
  }

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

    this.logger.debug(
      `calcularValorTotal resumo: ${JSON.stringify({
        cotacaoId,
        somaItens: resultado?.total ?? null,
        valorTotal,
      })}`,
    );

    await this.cotacaoRepository.update(cotacaoId, { valorTotal });

    this.logger.debug(`Valor total atualizado no banco: ${valorTotal}`);
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
        StatusCotacao.PENDENTE,
        StatusCotacao.EM_ANALISE,
        StatusCotacao.APROVADA,
        StatusCotacao.REJEITADA,
        StatusCotacao.VENCIDA,
      ],
      [StatusCotacao.PENDENTE]: [
        StatusCotacao.EM_ANALISE,
        StatusCotacao.VENCIDA,
        StatusCotacao.CANCELADA,
      ],
      [StatusCotacao.EM_ANALISE]: [
        StatusCotacao.APROVADA,
        StatusCotacao.REJEITADA,
        StatusCotacao.VENCIDA,
      ],
      [StatusCotacao.APROVADA]: [StatusCotacao.PEDIDO_GERADO, StatusCotacao.CONVERTIDA],
      [StatusCotacao.PEDIDO_GERADO]: [StatusCotacao.ADQUIRIDO, StatusCotacao.CANCELADA],
      [StatusCotacao.ADQUIRIDO]: [],
      [StatusCotacao.REJEITADA]: [StatusCotacao.RASCUNHO],
      [StatusCotacao.VENCIDA]: [StatusCotacao.RASCUNHO],
      [StatusCotacao.CONVERTIDA]: [StatusCotacao.ADQUIRIDO],
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
      metadados: cotacao.metadados || undefined,
      criadoPor: cotacao.criadoPor,
      atualizadoPor: cotacao.atualizadoPor,
    };
  }

  async obterEstatisticas(userId: string, empresaId: string): Promise<any> {
    const total = await this.cotacaoRepository.count({ where: { empresaId, deletadoEm: IsNull() } });
    const pendentes = await this.cotacaoRepository
      .createQueryBuilder('cotacao')
      .where('cotacao.empresaId = :empresaId', { empresaId })
      .andWhere('cotacao.deletadoEm IS NULL')
      .andWhere('cotacao.status::text IN (:...statusPendentes)', {
        statusPendentes: [StatusCotacao.PENDENTE, StatusCotacao.EM_ANALISE],
      })
      .getCount();
    const aprovadas = await this.cotacaoRepository
      .createQueryBuilder('cotacao')
      .where('cotacao.empresaId = :empresaId', { empresaId })
      .andWhere('cotacao.deletadoEm IS NULL')
      .andWhere('cotacao.status::text IN (:...statusAprovadas)', {
        statusAprovadas: [
          StatusCotacao.APROVADA,
          StatusCotacao.PEDIDO_GERADO,
          StatusCotacao.ADQUIRIDO,
          StatusCotacao.CONVERTIDA,
        ],
      })
      .getCount();
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
    observacoes: string | undefined,
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

    cotacao.status = StatusCotacao.PEDIDO_GERADO;
    cotacao.dataConversao = new Date();
    cotacao.atualizadoPor = userId;
    cotacao.metadados = this.mergeCompraMetadados(cotacao.metadados, {
      status: 'pedido_gerado',
      pedidoId: `PED-${Date.now()}`,
      dataPedido: new Date().toISOString(),
      pagamentoExterno: true,
      atualizadoPor: userId,
      atualizadoEm: new Date().toISOString(),
      ...(observacoes ? { observacoes } : {}),
    });

    if (observacoes) {
      cotacao.observacoes = this.appendObservacaoFluxo(
        cotacao.observacoes,
        `Conversão em pedido: ${observacoes}`,
      );
    }

    await this.cotacaoRepository.save(cotacao);

    const compra = (cotacao.metadados || {}).compra || {};
    let contaPagarGeradaAutomaticamente = false;
    let contaPagarAlreadyExisted = false;
    let contaPagar: any | undefined;
    let contaPagarErro: string | undefined;

    try {
      const contaPagarResult = await this.gerarContaPagar(id, {}, userId, empresaId);
      contaPagarGeradaAutomaticamente = true;
      contaPagarAlreadyExisted = !!contaPagarResult.alreadyExisted;
      contaPagar = contaPagarResult.contaPagar;
    } catch (error) {
      contaPagarErro = error?.message || 'Falha ao gerar conta a pagar automaticamente';
      this.logger.warn(
        `[COTACAO] Conversao em pedido concluida sem conta a pagar automatica - cotacao=${id} empresa=${empresaId}: ${contaPagarErro}`,
      );
    }

    return {
      id: compra.pedidoId || `PED-${Date.now()}`,
      cotacaoId: id,
      status: 'CRIADO',
      observacoes,
      contaPagar,
      contaPagarGeradaAutomaticamente,
      contaPagarAlreadyExisted,
      contaPagarErro,
    };
  }

  async gerarContaPagar(
    id: string,
    dados: GerarContaPagarDto,
    userId: string,
    empresaId: string,
  ): Promise<{
    success: true;
    contaPagar: any;
    cotacao: CotacaoResponseDto;
    alreadyExisted?: boolean;
  }> {
    const cotacao = await this.cotacaoRepository.findOne({
      where: { id, empresaId },
      relations: { fornecedor: true },
    });

    if (!cotacao) {
      throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
    }

    if (![StatusCotacao.PEDIDO_GERADO, StatusCotacao.CONVERTIDA].includes(cotacao.status)) {
      throw new HttpException(
        'A conta a pagar só pode ser gerada após o pedido estar gerado',
        HttpStatus.BAD_REQUEST,
      );
    }

    const compraAtual = (cotacao.metadados || {}).compra || {};
    const contaPagarIdExistente = compraAtual.contaPagarId as string | undefined;

    if (contaPagarIdExistente) {
      try {
        const contaExistente = await this.contaPagarService.findOne(contaPagarIdExistente, empresaId);
        return {
          success: true,
          contaPagar: contaExistente,
          cotacao: await this.buscarPorId(id, userId, empresaId),
          alreadyExisted: true,
        };
      } catch {
        // Se a conta foi removida, permite recriar e atualizar o vínculo
      }
    }

    const dataVencimentoBase =
      dados.dataVencimento?.trim() ||
      (cotacao.prazoResposta ? new Date(cotacao.prazoResposta).toISOString().slice(0, 10) : undefined) ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const dataVencimento = new Date(dataVencimentoBase);
    if (Number.isNaN(dataVencimento.getTime())) {
      throw new HttpException('Data de vencimento inválida', HttpStatus.BAD_REQUEST);
    }

    const prioridadeMap: Record<string, string> = {
      baixa: 'baixa',
      media: 'media',
      alta: 'alta',
      urgente: 'urgente',
    };
    const prioridadeConta =
      (dados.prioridade?.trim().toLowerCase() || prioridadeMap[String(cotacao.prioridade)] || 'media');
    const categoriaConta = dados.categoria?.trim().toLowerCase() || 'fornecedores';

    const valorOriginal = Number(cotacao.valorTotal || 0);
    if (!(valorOriginal > 0)) {
      throw new HttpException(
        'Cotação sem valor total válido para gerar conta a pagar',
        HttpStatus.BAD_REQUEST,
      );
    }

    const observacoesConta = [
      `Gerada a partir da cotação ${cotacao.numero}`,
      dados.observacoes?.trim(),
      compraAtual?.pedidoId ? `Pedido: ${compraAtual.pedidoId}` : undefined,
    ]
      .filter(Boolean)
      .join('\n');

    const contaPagar = await this.contaPagarService.create(
      {
        fornecedorId: cotacao.fornecedorId,
        descricao: `Compra interna - ${cotacao.titulo || cotacao.numero}`,
        numeroDocumento: compraAtual?.pedidoId || cotacao.numero,
        dataEmissao: new Date().toISOString().slice(0, 10),
        dataVencimento: dataVencimento.toISOString().slice(0, 10),
        valorOriginal,
        valorDesconto: 0,
        categoria: categoriaConta,
        prioridade: prioridadeConta,
        tipoPagamento: 'pix',
        observacoes: observacoesConta || undefined,
        recorrente: false,
        tags: ['cotacao', 'compra_interna'],
      },
      empresaId,
    );

    cotacao.metadados = this.mergeCompraMetadados(cotacao.metadados, {
      ...compraAtual,
      contaPagarId: contaPagar.id,
      contaPagarNumero: contaPagar.numero,
      contaPagarStatus: contaPagar.status,
      dataGeracaoContaPagar: new Date().toISOString(),
      atualizadoPor: userId,
      atualizadoEm: new Date().toISOString(),
    });
    cotacao.atualizadoPor = userId;

    cotacao.observacoes = this.appendObservacaoFluxo(
      cotacao.observacoes,
      `Conta a pagar gerada (${contaPagar.numero})`,
    );

    await this.cotacaoRepository.save(cotacao);

    return {
      success: true,
      contaPagar,
      cotacao: await this.buscarPorId(id, userId, empresaId),
    };
  }

  async marcarAdquirido(
    id: string,
    dados: {
      numeroPedido?: string;
      referenciaPagamento?: string;
      dataAquisicao?: string;
      observacoes?: string;
    },
    userId: string,
    empresaId: string,
  ): Promise<CotacaoResponseDto> {
    const cotacao = await this.cotacaoRepository.findOne({ where: { id, empresaId } });
    if (!cotacao) {
      throw new HttpException('Cotação não encontrada', HttpStatus.NOT_FOUND);
    }

    if (![StatusCotacao.CONVERTIDA, StatusCotacao.PEDIDO_GERADO].includes(cotacao.status)) {
      throw new HttpException(
        'Apenas cotações com pedido gerado podem ser marcadas como adquiridas',
        HttpStatus.BAD_REQUEST,
      );
    }

    const compraAtual = (cotacao.metadados || {}).compra || {};
    const dataAquisicao = dados.dataAquisicao
      ? new Date(dados.dataAquisicao)
      : new Date();

    if (Number.isNaN(dataAquisicao.getTime())) {
      throw new HttpException('Data de aquisição inválida', HttpStatus.BAD_REQUEST);
    }

    cotacao.metadados = this.mergeCompraMetadados(cotacao.metadados, {
      ...compraAtual,
      status: 'adquirido',
      pagamentoExterno: true,
      dataAquisicao: dataAquisicao.toISOString(),
      atualizadoPor: userId,
      atualizadoEm: new Date().toISOString(),
      ...(dados.numeroPedido ? { numeroPedido: dados.numeroPedido } : {}),
      ...(dados.referenciaPagamento ? { referenciaPagamento: dados.referenciaPagamento } : {}),
      ...(dados.observacoes ? { observacoes: dados.observacoes } : {}),
    });
    cotacao.status = StatusCotacao.ADQUIRIDO;
    cotacao.atualizadoPor = userId;
    cotacao.dataAtualizacao = new Date();

    if (dados.observacoes) {
      cotacao.observacoes = this.appendObservacaoFluxo(
        cotacao.observacoes,
        `Compra concluída (pagamento externo): ${dados.observacoes}`,
      );
    } else {
      cotacao.observacoes = this.appendObservacaoFluxo(
        cotacao.observacoes,
        'Compra concluída (pagamento externo)',
      );
    }

    await this.cotacaoRepository.save(cotacao);

    this.logger.log(
      `[AUDIT] COTACAO MARK_ACQUIRED - ID: ${id}, User: ${userId}, Numero: ${cotacao.numero}`,
    );

    return this.buscarPorId(id, userId, empresaId);
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


