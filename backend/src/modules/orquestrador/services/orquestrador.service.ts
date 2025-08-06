import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { FluxoAutomatizado, StatusFluxo } from '../entities/fluxo-automatizado.entity';
import { EventoFluxo, TipoEvento, StatusEvento } from '../entities/evento-fluxo.entity';
import { CreateFluxoAutomatizadoDto, UpdateFluxoAutomatizadoDto, FiltroFluxosDto, EstatisticasFluxoDto, ProcessarFluxoDto } from '../dto/fluxo-automatizado.dto';

@Injectable()
export class OrquestradorService {
  private readonly logger = new Logger(OrquestradorService.name);

  constructor(
    @InjectRepository(FluxoAutomatizado)
    private fluxoRepository: Repository<FluxoAutomatizado>,

    @InjectRepository(EventoFluxo)
    private eventoRepository: Repository<EventoFluxo>
  ) { }

  /**
   * Cria um novo fluxo automatizado a partir de uma proposta aceita
   */
  async criarFluxoAutomatizado(createDto: CreateFluxoAutomatizadoDto): Promise<FluxoAutomatizado> {
    try {
      this.logger.log(`Criando fluxo automatizado para proposta ${createDto.propostaId}`);

      // Gerar número único do fluxo
      const numeroFluxo = await this.gerarNumeroFluxo(createDto.tenantId);

      const fluxo = this.fluxoRepository.create({
        ...createDto,
        numeroFluxo,
        status: StatusFluxo.PROPOSTA_ACEITA,
        etapaAtual: 1,
        dataInicio: new Date(),
        configuracoes: {
          enviarEmailsAutomaticos: true,
          gerarContratoAutomatico: true,
          criarFaturaAutomatica: true,
          cobrarRecorrentemente: false,
          intervaloDias: 30,
          ...createDto.configuracoes
        },
        maxTentativas: createDto.maxTentativas || 3
      });

      const fluxoSalvo = await this.fluxoRepository.save(fluxo);

      // Criar evento inicial
      await this.criarEvento({
        tenantId: createDto.tenantId,
        fluxoId: fluxoSalvo.id,
        tipoEvento: TipoEvento.PROPOSTA_ACEITA,
        titulo: 'Proposta Aceita - Iniciando Fluxo Automatizado',
        descricao: `Fluxo automatizado iniciado para proposta ${createDto.propostaId}`,
        dadosEvento: {
          entityId: createDto.propostaId,
          entityType: 'proposta',
          parametrosExecucao: fluxoSalvo.configuracoes
        }
      });

      // Agendar próxima ação (geração de contrato)
      fluxoSalvo.definirProximaAcao(5); // 5 minutos
      await this.fluxoRepository.save(fluxoSalvo);

      this.logger.log(`Fluxo automatizado criado: ${fluxoSalvo.id} (${numeroFluxo})`);
      return fluxoSalvo;

    } catch (error) {
      this.logger.error(`Erro ao criar fluxo automatizado: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Processa um fluxo específico manualmente
   */
  async processarFluxo(processarDto: ProcessarFluxoDto): Promise<FluxoAutomatizado> {
    const { fluxoId, forcarProcessamento, parametrosCustomizados } = processarDto;

    try {
      const fluxo = await this.fluxoRepository.findOne({
        where: { id: fluxoId }
      });

      if (!fluxo) {
        throw new Error(`Fluxo ${fluxoId} não encontrado`);
      }

      if (!forcarProcessamento && !fluxo.podeProcessar()) {
        throw new Error(`Fluxo ${fluxoId} não pode ser processado no momento`);
      }

      this.logger.log(`Processando fluxo ${fluxo.numeroFluxo} - Etapa ${fluxo.etapaAtual}`);

      const resultado = await this.executarEtapaAtual(fluxo, parametrosCustomizados);

      return resultado;

    } catch (error) {
      this.logger.error(`Erro ao processar fluxo ${fluxoId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Processa fluxos pendentes manualmente (pode ser chamado por job externo)
   */
  async processarFluxosPendentes(): Promise<void> {
    try {
      this.logger.log('Iniciando processamento automático de fluxos pendentes');

      const fluxosPendentes = await this.fluxoRepository.find({
        where: {
          status: In([
            StatusFluxo.PROPOSTA_ACEITA,
            StatusFluxo.CONTRATO_GERADO,
            StatusFluxo.CONTRATO_ENVIADO,
            StatusFluxo.CONTRATO_ASSINADO,
            StatusFluxo.FATURA_GERADA
          ]),
          dataProximaAcao: LessThan(new Date())
        },
        take: 10 // Processar no máximo 10 por vez
      });

      this.logger.log(`Encontrados ${fluxosPendentes.length} fluxos para processar`);

      for (const fluxo of fluxosPendentes) {
        try {
          await this.executarEtapaAtual(fluxo);
        } catch (error) {
          this.logger.error(`Erro ao processar fluxo ${fluxo.numeroFluxo}: ${error.message}`);
          await this.marcarFluxoComErro(fluxo, error.message);
        }
      }

    } catch (error) {
      this.logger.error(`Erro no processamento automático: ${error.message}`, error.stack);
    }
  }

  /**
   * Executa a etapa atual do fluxo (versão simplificada para demonstração)
   */
  private async executarEtapaAtual(fluxo: FluxoAutomatizado, parametrosCustomizados?: any): Promise<FluxoAutomatizado> {
    this.logger.log(`Executando etapa ${fluxo.etapaAtual} para fluxo ${fluxo.numeroFluxo}`);

    // Simulação das etapas por enquanto
    switch (fluxo.status) {
      case StatusFluxo.PROPOSTA_ACEITA:
        return await this.simularGeracaoContrato(fluxo);

      case StatusFluxo.CONTRATO_GERADO:
        return await this.simularEnvioContrato(fluxo);

      case StatusFluxo.CONTRATO_ENVIADO:
        return await this.simularVerificacaoAssinatura(fluxo);

      case StatusFluxo.CONTRATO_ASSINADO:
        return await this.simularGeracaoFatura(fluxo);

      case StatusFluxo.FATURA_GERADA:
        return await this.simularVerificacaoPagamento(fluxo);

      default:
        throw new Error(`Status de fluxo não suportado: ${fluxo.status}`);
    }
  }

  /**
   * Simulações das etapas (para demonstração)
   */
  private async simularGeracaoContrato(fluxo: FluxoAutomatizado): Promise<FluxoAutomatizado> {
    this.logger.log(`Simulando geração de contrato para fluxo ${fluxo.numeroFluxo}`);

    // Simular criação de contrato
    fluxo.contratoId = `contrato-${Date.now()}`;
    fluxo.status = StatusFluxo.CONTRATO_GERADO;
    fluxo.proximaEtapa();
    fluxo.resetarTentativas();
    fluxo.definirProximaAcao(5);

    await this.criarEvento({
      tenantId: fluxo.tenantId,
      fluxoId: fluxo.id,
      tipoEvento: TipoEvento.CONTRATO_CRIADO,
      titulo: 'Contrato Gerado (Simulação)',
      descricao: `Contrato simulado gerado para proposta ${fluxo.propostaId}`
    });

    return await this.fluxoRepository.save(fluxo);
  }

  private async simularEnvioContrato(fluxo: FluxoAutomatizado): Promise<FluxoAutomatizado> {
    this.logger.log(`Simulando envio de contrato para fluxo ${fluxo.numeroFluxo}`);

    fluxo.status = StatusFluxo.CONTRATO_ENVIADO;
    fluxo.proximaEtapa();
    fluxo.resetarTentativas();
    fluxo.definirProximaAcao(60); // 1 hora

    await this.criarEvento({
      tenantId: fluxo.tenantId,
      fluxoId: fluxo.id,
      tipoEvento: TipoEvento.CONTRATO_ENVIADO,
      titulo: 'Contrato Enviado (Simulação)',
      descricao: `Contrato simulado enviado por email`
    });

    return await this.fluxoRepository.save(fluxo);
  }

  private async simularVerificacaoAssinatura(fluxo: FluxoAutomatizado): Promise<FluxoAutomatizado> {
    this.logger.log(`Simulando verificação de assinatura para fluxo ${fluxo.numeroFluxo}`);

    // Simular assinatura aleatória (50% de chance)
    const assinado = Math.random() > 0.5;

    if (assinado) {
      fluxo.status = StatusFluxo.CONTRATO_ASSINADO;
      fluxo.proximaEtapa();
      fluxo.resetarTentativas();
      fluxo.definirProximaAcao(5);

      await this.criarEvento({
        tenantId: fluxo.tenantId,
        fluxoId: fluxo.id,
        tipoEvento: TipoEvento.CONTRATO_ASSINADO,
        titulo: 'Contrato Assinado (Simulação)',
        descricao: `Contrato simulado foi assinado`
      });
    } else {
      // Reagendar verificação
      fluxo.definirProximaAcao(120); // 2 horas
    }

    return await this.fluxoRepository.save(fluxo);
  }

  private async simularGeracaoFatura(fluxo: FluxoAutomatizado): Promise<FluxoAutomatizado> {
    this.logger.log(`Simulando geração de fatura para fluxo ${fluxo.numeroFluxo}`);

    // Simular criação de fatura
    fluxo.faturaId = `fatura-${Date.now()}`;
    fluxo.status = StatusFluxo.FATURA_GERADA;
    fluxo.proximaEtapa();
    fluxo.resetarTentativas();
    fluxo.definirProximaAcao(60);

    await this.criarEvento({
      tenantId: fluxo.tenantId,
      fluxoId: fluxo.id,
      tipoEvento: TipoEvento.FATURA_CRIADA,
      titulo: 'Fatura Gerada (Simulação)',
      descricao: `Fatura simulada gerada`
    });

    return await this.fluxoRepository.save(fluxo);
  }

  private async simularVerificacaoPagamento(fluxo: FluxoAutomatizado): Promise<FluxoAutomatizado> {
    this.logger.log(`Simulando verificação de pagamento para fluxo ${fluxo.numeroFluxo}`);

    // Simular pagamento aleatório (30% de chance)
    const pago = Math.random() > 0.7;

    if (pago) {
      fluxo.marcarConcluido();

      await this.criarEvento({
        tenantId: fluxo.tenantId,
        fluxoId: fluxo.id,
        tipoEvento: TipoEvento.PAGAMENTO_RECEBIDO,
        titulo: 'Pagamento Recebido (Simulação)',
        descricao: `Pagamento simulado recebido. Fluxo concluído.`
      });
    } else {
      // Reagendar verificação
      fluxo.definirProximaAcao(240); // 4 horas
    }

    return await this.fluxoRepository.save(fluxo);
  }

  /**
   * Marca fluxo com erro
   */
  private async marcarFluxoComErro(fluxo: FluxoAutomatizado, erro: string): Promise<void> {
    fluxo.marcarErro(erro);
    await this.fluxoRepository.save(fluxo);

    // Criar evento de erro
    await this.criarEvento({
      tenantId: fluxo.tenantId,
      fluxoId: fluxo.id,
      tipoEvento: TipoEvento.ERRO_OCORRIDO,
      titulo: 'Erro no Processamento',
      descricao: erro,
      dadosEvento: {
        entityType: 'erro',
        parametrosExecucao: {
          tentativa: fluxo.tentativasProcessamento,
          maxTentativas: fluxo.maxTentativas
        }
      }
    });
  }

  /**
   * Criar evento do fluxo
   */
  private async criarEvento(dadosEvento: any): Promise<EventoFluxo> {
    const evento = this.eventoRepository.create({
      ...dadosEvento,
      status: StatusEvento.CONCLUIDO
    });

    const savedEvento = await this.eventoRepository.save(evento);
    return Array.isArray(savedEvento) ? savedEvento[0] : savedEvento;
  }

  /**
   * Gerar número único do fluxo
   */
  private async gerarNumeroFluxo(tenantId: string): Promise<string> {
    const ano = new Date().getFullYear();
    const count = await this.fluxoRepository.count({
      where: { tenantId }
    });

    return `FL${ano}${String(count + 1).padStart(6, '0')}`;
  }

  // Métodos de consulta
  async listarFluxos(filtros: FiltroFluxosDto): Promise<{ fluxos: FluxoAutomatizado[]; total: number }> {
    const { limite = 20, offset = 0, ordenarPor = 'createdAt', direcao = 'DESC' } = filtros;

    const queryBuilder = this.fluxoRepository.createQueryBuilder('fluxo');

    if (filtros.tenantId) {
      queryBuilder.andWhere('fluxo.tenantId = :tenantId', { tenantId: filtros.tenantId });
    }

    if (filtros.status) {
      queryBuilder.andWhere('fluxo.status = :status', { status: filtros.status });
    }

    if (filtros.propostaId) {
      queryBuilder.andWhere('fluxo.propostaId = :propostaId', { propostaId: filtros.propostaId });
    }

    if (filtros.comErros) {
      queryBuilder.andWhere('fluxo.status = :statusErro', { statusErro: StatusFluxo.ERRO_PROCESSAMENTO });
    }

    if (filtros.vencidos) {
      queryBuilder.andWhere('fluxo.dataProximaAcao < :agora', { agora: new Date() });
      queryBuilder.andWhere('fluxo.status != :concluido', { concluido: StatusFluxo.WORKFLOW_CONCLUIDO });
    }

    const [fluxos, total] = await queryBuilder
      .orderBy(`fluxo.${ordenarPor}`, direcao as 'ASC' | 'DESC')
      .skip(offset)
      .take(limite)
      .getManyAndCount();

    return { fluxos, total };
  }

  async obterEstatisticas(filtros: EstatisticasFluxoDto): Promise<any> {
    const queryBuilder = this.fluxoRepository.createQueryBuilder('fluxo');

    if (filtros.tenantId) {
      queryBuilder.andWhere('fluxo.tenantId = :tenantId', { tenantId: filtros.tenantId });
    }

    if (filtros.dataInicio) {
      queryBuilder.andWhere('fluxo.createdAt >= :dataInicio', { dataInicio: filtros.dataInicio });
    }

    if (filtros.dataFim) {
      queryBuilder.andWhere('fluxo.createdAt <= :dataFim', { dataFim: filtros.dataFim });
    }

    const estatisticas = await queryBuilder
      .select('COUNT(*)', 'total')
      .addSelect('fluxo.status', 'status')
      .groupBy('fluxo.status')
      .getRawMany();

    return {
      resumo: estatisticas,
      totalFluxos: estatisticas.reduce((acc, stat) => acc + parseInt(stat.total), 0)
    };
  }

  async buscarPorId(id: string): Promise<FluxoAutomatizado> {
    const fluxo = await this.fluxoRepository.findOne({
      where: { id }
    });

    if (!fluxo) {
      throw new Error(`Fluxo ${id} não encontrado`);
    }

    return fluxo;
  }

  async atualizar(id: string, updateDto: UpdateFluxoAutomatizadoDto): Promise<FluxoAutomatizado> {
    const fluxo = await this.buscarPorId(id);

    Object.assign(fluxo, updateDto);

    return await this.fluxoRepository.save(fluxo);
  }

  async pausarFluxo(id: string, motivo?: string): Promise<FluxoAutomatizado> {
    const fluxo = await this.buscarPorId(id);
    fluxo.pausar(motivo);

    return await this.fluxoRepository.save(fluxo);
  }

  async retomarFluxo(id: string): Promise<FluxoAutomatizado> {
    const fluxo = await this.buscarPorId(id);
    fluxo.retomar();

    return await this.fluxoRepository.save(fluxo);
  }

  async cancelarFluxo(id: string, motivo?: string): Promise<FluxoAutomatizado> {
    const fluxo = await this.buscarPorId(id);
    fluxo.cancelar(motivo);

    return await this.fluxoRepository.save(fluxo);
  }
}
