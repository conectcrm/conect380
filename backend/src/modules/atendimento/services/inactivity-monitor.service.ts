/**
 * 🤖 Serviço de Monitoramento de Inatividade
 *
 * Monitora tickets inativos e fecha automaticamente conforme configuração
 *
 * IMPORTANTE: Para produção, instalar @nestjs/schedule:
 * npm install @nestjs/schedule
 *
 * E descomentar @Cron abaixo para execução automática
 */

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In, Not } from 'typeorm';
// import { Cron, CronExpression } from '@nestjs/schedule'; // TODO: Instalar @nestjs/schedule
import { Ticket, StatusTicket } from '../entities/ticket.entity';
import { ConfiguracaoInatividade } from '../entities/configuracao-inatividade.entity';
import { WhatsAppSenderService } from './whatsapp-sender.service';

@Injectable()
export class InactivityMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(InactivityMonitorService.name);
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(ConfiguracaoInatividade)
    private readonly configuracaoRepository: Repository<ConfiguracaoInatividade>,
    private readonly whatsappSenderService: WhatsAppSenderService,
  ) { }

  onModuleInit() {
    this.iniciarMonitoramento();
  }

  onModuleDestroy() {
    this.pararMonitoramento();
  }

  /**
   * Inicia monitoramento periódico (fallback sem @nestjs/schedule)
   */
  private iniciarMonitoramento() {
    if (this.intervalId) return;

    const CINCO_MINUTOS = 5 * 60 * 1000;
    this.intervalId = setInterval(() => {
      this.verificarTicketsInativos().catch((err) => {
        this.logger.error('Erro no monitoramento de inatividade:', err);
      });
    }, CINCO_MINUTOS);

    this.logger.log('🚀 Monitoramento de inatividade iniciado (a cada 5 minutos)');
  }

  /**
   * Para monitoramento (útil para testes)
   */
  pararMonitoramento() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.log('⏸️ Monitoramento de inatividade parado');
    }
  }

  /**
   * Job que roda a cada 5 minutos verificando tickets inativos
   * TODO: Descomentar @Cron após instalar @nestjs/schedule
   */
  // @Cron(CronExpression.EVERY_5_MINUTES)
  async verificarTicketsInativos() {
    this.logger.log('🕐 Iniciando verificação de tickets inativos...');

    try {
      // Buscar todas as configurações ativas
      const configuracoes = await this.configuracaoRepository.find({
        where: { ativo: true },
      });

      if (configuracoes.length === 0) {
        this.logger.log('⚠️ Nenhuma configuração de inatividade ativa');
        return;
      }

      let totalProcessados = 0;
      let totalFechados = 0;
      let totalAvisados = 0;

      for (const config of configuracoes) {
        const resultado = await this.processarEmpresa(config);
        totalProcessados += resultado.processados;
        totalFechados += resultado.fechados;
        totalAvisados += resultado.avisados;
      }

      this.logger.log(
        `✅ Verificação concluída: ${totalProcessados} tickets processados, ` +
        `${totalFechados} fechados, ${totalAvisados} avisados`,
      );
    } catch (error) {
      this.logger.error('❌ Erro ao verificar tickets inativos:', error);
    }
  }

  /**
   * Processa tickets de uma empresa específica
   */
  private async processarEmpresa(config: ConfiguracaoInatividade) {
    const now = new Date();

    // Filtro de status
    const statusFiltro =
      config.statusAplicaveis && config.statusAplicaveis.length > 0
        ? In(config.statusAplicaveis)
        : Not(In([StatusTicket.FECHADO, StatusTicket.RESOLVIDO])); // Não processar já fechados/resolvidos

    // Buscar todos os tickets ativos da empresa (sem filtrar por tempo ainda)
    const ticketsAtivos = await this.ticketRepository.find({
      where: {
        empresaId: config.empresaId,
        status: statusFiltro,
      },
      take: 200, // Processar no máximo 200 por vez
    });

    let fechados = 0;
    let avisados = 0;
    let processados = 0;

    for (const ticket of ticketsAtivos) {
      // 🎯 Obter configuração específica para este ticket (departamento ou global)
      const configTicket = await this.obterConfiguracaoParaTicket(ticket);

      if (!configTicket || !configTicket.ativo) {
        continue; // Pula se não há configuração ativa
      }

      // Calcular tempo de inatividade com base na config do ticket
      const timeoutMs = configTicket.timeoutMinutos * 60 * 1000;
      const limiteInatividade = new Date(now.getTime() - timeoutMs);

      // Verificar se está inativo
      if (ticket.ultima_mensagem_em > limiteInatividade) {
        continue; // Ainda não atingiu o tempo de inatividade
      }

      processados++;

      // Verificar se já foi avisado
      const jaAvisado = await this.verificarSeJaFoiAvisado(ticket.id);

      if (!jaAvisado && configTicket.enviarAviso) {
        // Calcular se deve avisar
        const avisoMs = configTicket.avisoMinutosAntes * 60 * 1000;
        const limiteAviso = new Date(now.getTime() - (timeoutMs - avisoMs));

        if (ticket.ultima_mensagem_em <= limiteAviso) {
          await this.enviarAvisoFechamento(ticket, configTicket);
          avisados++;
          continue; // Não fecha agora, só avisa
        }
      }

      // Fechar ticket por inatividade
      await this.fecharPorInatividade(ticket, configTicket);
      fechados++;
    }

    this.logger.log(
      `📊 Empresa ${config.empresaId}: ${processados} inativos, ` +
      `${fechados} fechados, ${avisados} avisados`,
    );

    return {
      processados,
      fechados,
      avisados,
    };
  }

  /**
   * 🎯 Obtém configuração aplicável para um ticket específico
   * Prioridade: 1º departamento específico → 2º global da empresa
   */
  private async obterConfiguracaoParaTicket(
    ticket: Ticket,
  ): Promise<ConfiguracaoInatividade | null> {
    // 1️⃣ Se ticket tem departamento, buscar config específica do departamento
    if (ticket.departamentoId) {
      const configDepartamento = await this.configuracaoRepository.findOne({
        where: {
          empresaId: ticket.empresaId,
          departamentoId: ticket.departamentoId,
          ativo: true,
        },
      });

      if (configDepartamento) {
        this.logger.debug(
          `🎯 Config departamento ${ticket.departamentoId} para ticket ${ticket.numero}`,
        );
        return configDepartamento;
      }
    }

    // 2️⃣ Fallback: buscar configuração global da empresa (departamentoId = null)
    const configGlobal = await this.configuracaoRepository.findOne({
      where: {
        empresaId: ticket.empresaId,
        departamentoId: null, // Global
        ativo: true,
      },
    });

    if (configGlobal) {
      this.logger.debug(`🌐 Config global para ticket ${ticket.numero}`);
    } else {
      this.logger.debug(`⚠️ Nenhuma config encontrada para ticket ${ticket.numero}`);
    }

    return configGlobal;
  }

  /**
   * Verifica se ticket já recebeu aviso de fechamento
   */
  private async verificarSeJaFoiAvisado(ticketId: string): Promise<boolean> {
    // TODO: Implementar verificação em tabela de logs ou metadata do ticket
    // Por enquanto, retorna false (sempre avisa)
    return false;
  }

  /**
   * Envia mensagem de aviso que ticket será fechado
   */
  private async enviarAvisoFechamento(ticket: Ticket, config: ConfiguracaoInatividade) {
    const mensagemPadrao =
      `⚠️ Este atendimento será encerrado automaticamente em ${config.avisoMinutosAntes} minutos por inatividade.\n\n` +
      `Se ainda precisar de ajuda, por favor responda esta mensagem.`;

    const mensagem = config.mensagemAviso || mensagemPadrao;

    this.logger.log(`📤 Enviando aviso de fechamento para ticket ${ticket.numero}`);

    // ✅ Enviar mensagem via WhatsApp
    try {
      await this.whatsappSenderService.enviarMensagem(
        ticket.contatoTelefone,
        mensagem,
        ticket.empresaId,
      );
      this.logger.log(`✅ Aviso enviado com sucesso para ${ticket.contatoTelefone}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar aviso para ticket ${ticket.numero}:`, error.message);
    }

    // Registrar que foi avisado
    // TODO: Salvar em metadata ou tabela de logs
  }

  /**
   * Fecha ticket por inatividade
   */
  private async fecharPorInatividade(ticket: Ticket, config: ConfiguracaoInatividade) {
    const mensagemPadrao =
      `✅ Este atendimento foi encerrado automaticamente devido à inatividade.\n\n` +
      `Se precisar de ajuda novamente, inicie uma nova conversa. Estamos sempre à disposição!`;

    const mensagem = config.mensagemFechamento || mensagemPadrao;

    this.logger.log(`🔒 Fechando ticket ${ticket.numero} por inatividade`);

    // Atualizar status
    ticket.status = StatusTicket.FECHADO;
    ticket.data_fechamento = new Date();

    await this.ticketRepository.save(ticket);

    // Enviar mensagem de fechamento
    try {
      await this.whatsappSenderService.enviarMensagem(
        ticket.contatoTelefone,
        mensagem,
        ticket.empresaId,
      );
      this.logger.log(
        `✅ Mensagem de fechamento enviada com sucesso para ${ticket.contatoTelefone}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Erro ao enviar mensagem de fechamento para ticket ${ticket.numero}:`,
        error.message,
      );
    }

    this.logger.log(`✅ Ticket ${ticket.numero} fechado por inatividade`);
  }

  /**
   * API manual: Forçar verificação imediata (útil para testes)
   */
  async verificarImediatamente(empresaId?: string, departamentoId?: string) {
    this.logger.log('🚀 Verificação manual solicitada');

    // Construir filtro dinamicamente
    const where: any = { ativo: true };

    if (empresaId) {
      where.empresaId = empresaId;
    }

    if (departamentoId !== undefined) {
      where.departamentoId = departamentoId; // Pode ser null (global) ou uuid específico
    }

    const configuracoes = await this.configuracaoRepository.find({ where });

    let totalFechados = 0;
    let totalAvisados = 0;

    for (const config of configuracoes) {
      const resultado = await this.processarEmpresa(config);
      totalFechados += resultado.fechados;
      totalAvisados += resultado.avisados;
    }

    return {
      sucesso: true,
      fechados: totalFechados,
      avisados: totalAvisados,
      configuracoes: configuracoes.length,
    };
  }
}
