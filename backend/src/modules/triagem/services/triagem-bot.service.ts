// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessaoTriagem } from '../entities/sessao-triagem.entity';
import { FluxoTriagem } from '../entities/fluxo-triagem.entity';
import { NucleoAtendimento } from '../entities/nucleo-atendimento.entity';
import { IniciarTriagemDto, ResponderTriagemDto } from '../dto';
import { TicketService } from '../../atendimento/services/ticket.service';
import {
  PrioridadeTicket,
  OrigemTicket,
  StatusTicket,
} from '../../atendimento/entities/ticket.entity';
import { Contato } from '../../clientes/contato.entity';
import { NucleoService } from './nucleo.service';
import { AtribuicaoService } from './atribuicao.service';
import { FlowEngine } from '../engine/flow-engine';
import { RespostaBot, DadosMensagemWebhook } from '../types/triagem-bot.types';
import type { ResultadoProcessamentoWebhook } from '../types/triagem-bot.types';
export type { ResultadoProcessamentoWebhook } from '../types/triagem-bot.types';
import { formatarOpcoes, normalizarTextoMenu } from '../utils/menu-format.util';
import { criarOpcoesDepartamentos, criarOpcoesNucleos } from '../utils/flow-options.util';
import { ValidationUtil } from '../utils/validation.util';
import { KeywordShortcuts } from '../utils/keyword-shortcuts.util';
import { TriagemLogService } from './triagem-log.service';
import { WhatsAppSenderService } from '../../atendimento/services/whatsapp-sender.service';
import { User } from '../../users/user.entity';

@Injectable()
export class TriagemBotService {
  private readonly logger = new Logger(TriagemBotService.name);

  constructor(
    @InjectRepository(SessaoTriagem)
    private readonly sessaoRepository: Repository<SessaoTriagem>,
    @InjectRepository(FluxoTriagem)
    private readonly fluxoRepository: Repository<FluxoTriagem>,
    @InjectRepository(NucleoAtendimento)
    private readonly nucleoRepository: Repository<NucleoAtendimento>,
    @InjectRepository(Contato)
    private readonly contatoRepository: Repository<Contato>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => TicketService))
    private readonly ticketService: TicketService,
    @Inject(forwardRef(() => NucleoService))
    private readonly nucleoService: NucleoService,
    @Inject(forwardRef(() => AtribuicaoService))
    private readonly atribuicaoService: AtribuicaoService,
    private readonly triagemLogService: TriagemLogService,
    private readonly whatsAppSenderService: WhatsAppSenderService,
  ) {}

  private maskPhone(phone?: string): string {
    if (!phone) return '[telefone]';
    const digits = phone.replace(/\D/g, '');
    if (!digits) return '[telefone]';
    const suffix = digits.slice(-4);
    return `${'*'.repeat(Math.max(digits.length - 4, 4))}${suffix}`;
  }

  private summarizeText(text?: string): string {
    if (!text) return '[vazio]';
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) return '[vazio]';
    return normalized.length > 40 ? `${normalized.slice(0, 40)}...` : normalized;
  }

  private summarizeWebhookPayload(payload: any): Record<string, unknown> {
    return {
      object: payload?.object || null,
      entryCount: Array.isArray(payload?.entry) ? payload.entry.length : 0,
      hasMessages: Boolean(payload?.entry?.[0]?.changes?.[0]?.value?.messages?.length),
      hasStatuses: Boolean(payload?.entry?.[0]?.changes?.[0]?.value?.statuses?.length),
    };
  }

  /**
   * Processa mensagem recebida pelo webhook do WhatsApp
   */
  async processarMensagemWhatsApp(
    empresaId: string,
    payload: any,
  ): Promise<ResultadoProcessamentoWebhook> {
    this.logger.debug(
      `Triagem webhook recebido empresa=${empresaId} ${JSON.stringify(
        this.summarizeWebhookPayload(payload),
      )}`,
    );

    const dadosMensagem = this.extrairDadosWebhook(payload);
    this.logger.debug(
      `Triagem dados extraidos telefone=${this.maskPhone(dadosMensagem?.telefone)} texto=${this.summarizeText(dadosMensagem?.texto)} canal=${dadosMensagem?.canalId || 'N/A'}`,
    );

    if (!dadosMensagem?.telefone || !dadosMensagem?.texto) {
      this.logger.warn('Webhook WhatsApp ignorado: sem telefone ou texto processável');
      return {
        ignorado: true,
        motivo: 'Payload sem mensagem de texto ou telefone',
        dadosMensagem,
      };
    }

    const telefoneNormalizado = this.normalizarTelefone(dadosMensagem.telefone);

    // 🔍 DEBUG: Dados extraídos
    this.logger.debug(`📱 DADOS EXTRAÍDOS:`);
    this.logger.debug(`   - Telefone: ${this.maskPhone(dadosMensagem.telefone)} -> ${this.maskPhone(telefoneNormalizado)}`);
    this.logger.debug(`   - Texto: "${this.summarizeText(dadosMensagem.texto)}"`);
    this.logger.debug(`   - Nome: ${dadosMensagem.nome || 'N/A'}`);
    this.logger.debug(`   - Canal ID: ${dadosMensagem.canalId || 'N/A'}`);

    // Atualizar telefone normalizado para retorno
    dadosMensagem.telefone = telefoneNormalizado;

    this.logger.log(`Mensagem recebida de ${this.maskPhone(telefoneNormalizado)}: "${this.summarizeText(dadosMensagem.texto)}"`);

    // Verificar se existe sessão ativa
    const sessaoAtiva = await this.buscarSessaoAtiva(empresaId, telefoneNormalizado);

    if (sessaoAtiva) {
      this.logger.log(`Sessão ativa encontrada: ${sessaoAtiva.id}`);

      await this.registrarLogEntradaMensagem(empresaId, dadosMensagem, sessaoAtiva, payload);

      const resposta = await this.processarResposta(
        empresaId,
        {
          sessaoId: sessaoAtiva.id,
          resposta: dadosMensagem.texto,
        },
        { pularLogEntrada: true },
      );

      return {
        novaSessao: false,
        sessaoId: sessaoAtiva.id,
        fluxoId: sessaoAtiva.fluxoId,
        resposta,
        dadosMensagem,
      };
    }

    // Nenhuma sessão ativa -> iniciar nova a partir do fluxo padrão
    this.logger.log('Nenhuma sessão ativa. Buscando fluxo padrão...');

    const fluxoPadrao = await this.fluxoRepository
      .createQueryBuilder('fluxo')
      .where('fluxo.empresaId = :empresaId', { empresaId })
      .andWhere('fluxo.ativo = TRUE')
      .andWhere('fluxo.publicado = TRUE')
      .andWhere(':canal = ANY(fluxo.canais)', { canal: 'whatsapp' })
      .orderBy('fluxo.prioridade', 'DESC')
      .addOrderBy('fluxo.publishedAt', 'DESC')
      .addOrderBy('fluxo.updatedAt', 'DESC')
      .addOrderBy('fluxo.createdAt', 'DESC')
      .getOne();

    if (!fluxoPadrao) {
      throw new NotFoundException('Nenhum fluxo padrão publicado encontrado para o canal WhatsApp');
    }

    this.logger.log(`Fluxo padrão encontrado: ${fluxoPadrao.id}`);

    // 🔍 DEBUG: Verificar estrutura do fluxo carregado
    this.logger.debug('═'.repeat(80));
    this.logger.debug(`🎯 FLUXO CARREGADO - ID: ${fluxoPadrao.id}`);
    this.logger.debug(`📝 Nome: ${fluxoPadrao.nome}`);
    this.logger.debug(`✅ Publicado: ${fluxoPadrao.publicado} (em ${fluxoPadrao.publishedAt})`);
    this.logger.debug(`🔄 Atualizado: ${fluxoPadrao.updatedAt}`);
    this.logger.debug(
      `📊 Total de etapas: ${Object.keys(fluxoPadrao.estrutura.etapas || {}).length}`,
    );
    this.logger.debug(
      `🗂️ Lista de etapas: ${Object.keys(fluxoPadrao.estrutura.etapas || {}).join(', ')}`,
    );

    const etapaBoasVindas = fluxoPadrao.estrutura.etapas['boas-vindas'];
    if (etapaBoasVindas) {
      this.logger.debug(`🎉 Etapa boas-vindas encontrada:`);
      this.logger.debug(`   - Tipo: ${etapaBoasVindas.tipo}`);
      this.logger.debug(`   - Próxima etapa: ${etapaBoasVindas.proximaEtapa || 'N/A'}`);
      this.logger.debug(
        `   - Mensagem (primeiros 100 chars): ${(etapaBoasVindas.mensagem || '').substring(0, 100)}...`,
      );
      this.logger.debug(
        `   - Tem botões? ${etapaBoasVindas.opcoes ? 'SIM (' + etapaBoasVindas.opcoes.length + ')' : 'NÃO'}`,
      );
      if (etapaBoasVindas.opcoes && etapaBoasVindas.opcoes.length > 0) {
        etapaBoasVindas.opcoes.forEach((opcao, idx) => {
          this.logger.debug(`     Botão ${idx + 1}: "${opcao.texto}" → ${opcao.proximaEtapa}`);
        });
      }
    } else {
      this.logger.warn('⚠️ Etapa boas-vindas NÃO ENCONTRADA no fluxo!');
    }
    this.logger.debug('═'.repeat(80));

    const resposta = await this.iniciarTriagem(empresaId, {
      contatoTelefone: telefoneNormalizado,
      contatoNome: dadosMensagem.nome,
      fluxoId: fluxoPadrao.id,
      canal: 'whatsapp',
      canalId: dadosMensagem.canalId,
      mensagemInicial: dadosMensagem.texto,
    });

    const novaSessao = resposta?.sessaoId
      ? await this.sessaoRepository.findOne({
          where: { id: resposta.sessaoId, empresaId },
        })
      : null;

    await this.registrarLogEntradaMensagem(empresaId, dadosMensagem, novaSessao, payload);

    return {
      novaSessao: true,
      sessaoId: resposta.sessaoId,
      fluxoId: fluxoPadrao.id,
      resposta,
      dadosMensagem,
    };
  }

  /**
   * 🔍 Busca contato existente por telefone
   */
  private async buscarContatoPorTelefone(
    empresaId: string,
    telefone: string,
  ): Promise<Contato | null> {
    try {
      const telefoneNormalizado = this.normalizarTelefone(telefone);
      const telefoneSemMais = telefoneNormalizado.startsWith('+')
        ? telefoneNormalizado.substring(1)
        : telefoneNormalizado;

      const telefonesPossiveisSet = new Set<string>();
      if (telefoneSemMais) {
        telefonesPossiveisSet.add(telefoneSemMais);

        if (telefoneSemMais.startsWith('55')) {
          const semDDI = telefoneSemMais.substring(2);
          if (semDDI) {
            telefonesPossiveisSet.add(semDDI);

            if (semDDI.length === 10) {
              const comNonoDigito = `${semDDI.slice(0, 2)}9${semDDI.slice(2)}`;
              telefonesPossiveisSet.add(comNonoDigito);
              telefonesPossiveisSet.add(`55${comNonoDigito}`);
            }
          }
        }
      }

      const telefonesPossiveis = Array.from(telefonesPossiveisSet);

      if (telefonesPossiveis.length === 0) {
        this.logger.warn('❌ Não foi possível normalizar telefone para busca de contato');
        return null;
      }

      this.logger.debug(`📞 Variantes para busca de contato: ${telefonesPossiveis.join(', ')}`);

      // Buscar contato ativo com telefone que bata com ou sem máscara/DDI
      const contato = await this.contatoRepository
        .createQueryBuilder('contato')
        .leftJoinAndSelect('contato.cliente', 'cliente')
        .where('contato.ativo = TRUE')
        .andWhere('cliente.empresa_id = :empresaId', { empresaId })
        .andWhere("regexp_replace(contato.telefone, '\\D', '', 'g') IN (:...telefones)", {
          telefones: telefonesPossiveis,
        })
        .orderBy('contato.principal', 'DESC')
        .addOrderBy('contato.updatedAt', 'DESC')
        .getOne();

      if (contato) {
        this.logger.log(`Contato encontrado: ${contato.nome} (${this.maskPhone(contato.telefone)})`);
      } else {
        this.logger.log(`Nenhum contato encontrado para: ${this.maskPhone(telefoneNormalizado)}`);
      }

      return contato;
    } catch (erro) {
      this.logger.error(`Erro ao buscar contato: ${erro.message}`);
      return null;
    }
  }

  private async gerarRespostaFluxo(
    sessao: SessaoTriagem,
    fluxo: FluxoTriagem,
  ): Promise<RespostaBot> {
    const engine = new FlowEngine({
      fluxo,
      sessao,
      helpers: {
        buscarNucleosParaBot: async (sessaoAtual) =>
          this.nucleoService.findOpcoesParaBot(sessaoAtual.empresaId),
      },
      logger: this.logger,
    });

    const resultado = await engine.buildResponse();

    if (resultado.sessionMutated) {
      await this.sessaoRepository.save(sessao);
    }

    // ✅ NOVO: Verificar se deve finalizar automaticamente após enviar mensagem
    if (sessao.contexto?.__finalizarAposEnviar) {
      this.logger.log(
        '🎫 [AUTO-FINALIZAÇÃO] Flag detectada - finalizando triagem após enviar mensagem',
      );

      // Remover a flag para não reprocessar
      delete sessao.contexto.__finalizarAposEnviar;
      await this.sessaoRepository.save(sessao);

      // 1️⃣ Enviar mensagem de transferência primeiro (permite que canais sincronizem a resposta)
      const respostaInicial = await this.responderComLog(sessao, fluxo, resultado.resposta);

      // 2️⃣ Agendar finalização para ocorrer após breve intervalo
      const delayBeforeFinalize = 1200; // ms – garante que mensagem de transferência apareça primeiro
      setTimeout(async () => {
        try {
          await this.finalizarTriagem(sessao, fluxo);
        } catch (error) {
          this.logger.error(
            `❌ [AUTO-FINALIZAÇÃO] Falha ao concluir triagem agendada: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }, delayBeforeFinalize);

      return respostaInicial;
    }

    return await this.responderComLog(sessao, fluxo, resultado.resposta);
  }

  /**
   * 🔄 Busca último ticket recente do contato (criado há menos de 7 dias)
   */
  private async buscarUltimoTicketRecente(
    empresaId: string,
    contatoId: string,
  ): Promise<any | null> {
    try {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

      const ultimoTicket = await this.ticketService.findOne({
        where: {
          empresaId,
          contatoId,
          createdAt: { $gte: seteDiasAtras } as any,
        },
        order: { createdAt: 'DESC' },
        relations: ['departamento'],
      });

      return ultimoTicket || null;
    } catch (error) {
      this.logger.warn(`Erro ao buscar último ticket do contato ${contatoId}:`, error);
      return null;
    }
  }

  /**
   * Inicia uma nova sessão de triagem
   */
  async iniciarTriagem(empresaId: string, dto: IniciarTriagemDto): Promise<RespostaBot> {
    this.logger.log(`Iniciando triagem para ${dto.contatoTelefone} no fluxo ${dto.fluxoId}`);

    // Buscar fluxo
    const fluxo = await this.fluxoRepository.findOne({
      where: { id: dto.fluxoId, empresaId, ativo: true },
    });

    if (!fluxo) {
      throw new NotFoundException('Fluxo de triagem não encontrado ou inativo');
    }

    // Verificar se já existe sessão ativa
    const sessaoExistente = await this.sessaoRepository.findOne({
      where: {
        contatoTelefone: dto.contatoTelefone,
        empresaId,
        status: 'em_andamento',
      },
    });

    if (sessaoExistente && !sessaoExistente.estaExpirada()) {
      // Retomar sessão existente
      if (dto.mensagemInicial) {
        await this.registrarLogEntradaTexto(sessaoExistente, dto.mensagemInicial, {
          origem: 'iniciar_triagem_existente',
        });
      }

      await this.registrarLogSistema(
        sessaoExistente,
        'Sessão retomada para contato com sessão ativa',
        'sessao_retomada',
        {
          canal: dto.canal,
          fluxoId: fluxo.id,
        },
      );
      return await this.gerarRespostaFluxo(sessaoExistente, fluxo);
    }

    // 🔍 Buscar contato existente no banco de dados
    const contatoExistente = await this.buscarContatoPorTelefone(empresaId, dto.contatoTelefone);

    const contextoInicial = {
      ...(fluxo.estrutura.variaveis ? { ...fluxo.estrutura.variaveis } : {}),
    } as Record<string, any>;

    // 🎯 Buscar último ticket do contato (se reconhecido)
    let ultimoTicket = null;
    if (contatoExistente) {
      ultimoTicket = await this.buscarUltimoTicketRecente(empresaId, contatoExistente.id);

      if (ultimoTicket) {
        this.logger.log(
          `🔄 Último ticket encontrado: ${ultimoTicket.id} - Departamento: ${ultimoTicket.departamento?.nome || 'N/A'}`,
        );
        contextoInicial.__ultimoTicketId = ultimoTicket.id;
        contextoInicial.__ultimoDepartamentoId = ultimoTicket.departamentoId;
        contextoInicial.__ultimoDepartamentoNome = ultimoTicket.departamento?.nome || '';
      }
    }

    // ✨ Se encontrou contato, preencher dados automaticamente
    if (contatoExistente) {
      this.logger.log(`🎯 Cliente reconhecido: ${contatoExistente.nome}`);

      contextoInicial.nome = contatoExistente.nome;
      contextoInicial.telefone = contatoExistente.telefone;
      contextoInicial.email = contatoExistente.email || '';
      contextoInicial.cargo = contatoExistente.cargo || '';
      contextoInicial.__contatoId = contatoExistente.id;
      contextoInicial.__clienteCadastrado = true;
      contextoInicial.contatoExiste = true; // ✅ Para etapas condicionais

      // 📝 Extrair primeiro nome e sobrenome do nome completo
      if (contatoExistente.nome) {
        const partesNome = contatoExistente.nome.trim().split(/\s+/);
        contextoInicial.primeiroNome = partesNome[0] || '';
        contextoInicial.sobrenome = partesNome.slice(1).join(' ') || '';
      }

      if (contatoExistente.cliente) {
        contextoInicial.empresa = contatoExistente.cliente.nome || '';
        contextoInicial.__clienteId = contatoExistente.cliente.id;
      }
    } else {
      this.logger.log(`👤 Novo contato - será necessário coletar dados`);
      contextoInicial.__clienteCadastrado = false;
      contextoInicial.contatoExiste = false; // ✅ Para etapas condicionais
    }

    if (dto.canalId) {
      contextoInicial.__canalId = dto.canalId;
    }

    if (dto.mensagemInicial) {
      contextoInicial.__mensagemInicial = dto.mensagemInicial;
    }

    // Criar nova sessão
    const sessao = this.sessaoRepository.create({
      empresaId,
      contatoTelefone: dto.contatoTelefone,
      contatoNome: dto.contatoNome,
      fluxoId: dto.fluxoId,
      canal: dto.canal,
      etapaAtual: fluxo.estrutura.etapaInicial,
      status: 'em_andamento',
      contexto: contextoInicial,
      historico: [],
    } as any);

    const sessaoSalva = await this.sessaoRepository.save(sessao);

    // Incrementar execuções do fluxo
    await fluxo.incrementarExecucoes();
    await this.fluxoRepository.save(fluxo);

    await this.registrarLogSistema(sessaoSalva, 'Sessão de triagem iniciada', 'sessao_iniciada', {
      canal: dto.canal,
      canalId: dto.canalId,
      fluxoId: fluxo.id,
      clienteReconhecido: Boolean(contextoInicial.__clienteCadastrado),
      ultimoTicketEncontrado: Boolean(ultimoTicket),
    });

    if (dto.mensagemInicial) {
      await this.registrarLogEntradaTexto(sessaoSalva, dto.mensagemInicial, {
        origem: 'iniciar_triagem',
        canalId: dto.canalId,
      });
    }

    // Retornar primeira mensagem
    return await this.gerarRespostaFluxo(sessaoSalva, fluxo);
  }

  /**
   * Processa a resposta do usuário
   */
  async processarResposta(
    empresaId: string,
    dto: ResponderTriagemDto,
    options: { pularLogEntrada?: boolean } = {},
  ): Promise<RespostaBot> {
    // Buscar sessão
    const sessao = await this.sessaoRepository.findOne({
      where: { id: dto.sessaoId, empresaId },
      relations: ['fluxo'],
    });

    if (!sessao) {
      throw new NotFoundException('Sessão de triagem não encontrada');
    }

    if (sessao.status !== 'em_andamento') {
      throw new BadRequestException('Sessão já foi finalizada');
    }

    // 🆕 QUICK WIN: Verificar se está em estado de timeout
    if (sessao.metadados?.timeoutAvisoEnviado) {
      this.logger.log('⏰ Processando resposta após aviso de timeout');

      // Processar resposta de timeout (1, 2, 3, continuar, atendente, cancelar)
      const respostaNormalizada = dto.resposta?.toLowerCase().trim();

      if (['1', 'continuar', 'sim'].includes(respostaNormalizada)) {
        // Resetar flag e continuar normalmente
        sessao.metadados.timeoutAvisoEnviado = false;
        sessao.metadados.timeoutContinuado = true;
        await this.sessaoRepository.save(sessao);

        await this.registrarLogSistema(
          sessao,
          'Usuário escolheu continuar após timeout',
          'timeout_continuado',
          {},
        );

        // Continuar fluxo normalmente (processar resposta abaixo)
      } else if (['2', 'atendente', 'humano', 'pessoa'].includes(respostaNormalizada)) {
        // Transferir imediatamente para atendente
        sessao.metadados.timeoutAvisoEnviado = false;
        sessao.metadados.timeoutTransferido = true;

        await this.registrarLogSistema(
          sessao,
          'Usuário escolheu falar com atendente após timeout',
          'timeout_transferir_atendente',
          {},
        );

        // Buscar núcleo geral ou primeiro disponível
        const nucleoGeral = await this.nucleoRepository.findOne({
          where: {
            codigo: 'NUC_GERAL',
            empresaId: sessao.empresaId,
            ativo: true,
          },
        });

        if (nucleoGeral) {
          return await this.transferirParaNucleo(sessao, sessao.fluxo, {
            nucleoId: nucleoGeral.id,
            motivo: 'timeout_escolheu_atendente',
          });
        } else {
          // Se não tem núcleo geral, buscar primeiro ativo
          const primeiroNucleo = await this.nucleoRepository.findOne({
            where: { empresaId: sessao.empresaId, ativo: true },
          });

          if (primeiroNucleo) {
            return await this.transferirParaNucleo(sessao, sessao.fluxo, {
              nucleoId: primeiroNucleo.id,
              motivo: 'timeout_escolheu_atendente',
            });
          }
        }
      } else if (['3', 'cancelar', 'sair', 'não', 'nao'].includes(respostaNormalizada)) {
        // Cancelar atendimento
        sessao.status = 'cancelada';
        sessao.finalizadaEm = new Date();
        sessao.metadados.motivoCancelamento = 'timeout_usuario_cancelou';
        await this.sessaoRepository.save(sessao);

        await this.registrarLogSistema(
          sessao,
          'Usuário escolheu cancelar após timeout',
          'timeout_cancelado',
          {},
        );

        return {
          mensagem: '✅ Atendimento cancelado.\n\nQuando precisar, é só chamar! 👋',
          sessaoId: sessao.id,
          etapaAtual: sessao.etapaAtual,
          aguardaResposta: false,
          finalizado: true,
        };
      } else {
        // Qualquer outra resposta = assumir que quer continuar
        sessao.metadados.timeoutAvisoEnviado = false;
        sessao.metadados.timeoutContinuadoAutomatico = true;
        await this.sessaoRepository.save(sessao);

        await this.registrarLogSistema(
          sessao,
          'Resposta não reconhecida após timeout, continuando fluxo',
          'timeout_continuado_automatico',
          { resposta: dto.resposta },
        );

        // Continuar processamento normal abaixo
      }
    }

    if (sessao.estaExpirada()) {
      sessao.status = 'expirada';
      await this.sessaoRepository.save(sessao);
      await this.registrarLogSistema(
        sessao,
        'Sessão expirada ao tentar processar resposta',
        'sessao_expirada',
        { respostaRecebida: dto.resposta },
      );
      throw new BadRequestException('Sessão expirada. Inicie uma nova triagem.');
    }

    if (!options.pularLogEntrada && dto.resposta) {
      await this.registrarLogEntradaTexto(sessao, dto.resposta, {
        origem: 'api_responder_triagem',
      });
    }

    const fluxo = sessao.fluxo;
    const etapaAtual = fluxo.estrutura.etapas[sessao.etapaAtual];

    if (!etapaAtual) {
      this.logger.warn(
        `⚠️ Etapa "${sessao.etapaAtual}" não encontrada no fluxo ${fluxo.id}. Reiniciando sessão na etapa inicial.`,
      );

      const etapaInicial = fluxo.estrutura.etapaInicial;
      if (!etapaInicial || !fluxo.estrutura.etapas[etapaInicial]) {
        throw new BadRequestException('Fluxo sem etapa inicial válida após atualização');
      }

      sessao.etapaAnterior = sessao.etapaAtual;
      sessao.etapaAtual = etapaInicial;
      sessao.contexto = {
        ...(sessao.contexto || {}),
        __reiniciadaEm: new Date().toISOString(),
        __motivoReinicio: 'etapa_inexistente',
      };

      await this.registrarLogSistema(
        sessao,
        'Sessão reiniciada por etapa inexistente',
        'sessao_reiniciada',
        {
          etapaAnterior: sessao.etapaAnterior,
          novaEtapa: etapaInicial,
        },
      );

      const sessaoReiniciada = await this.sessaoRepository.save(sessao);
      return await this.gerarRespostaFluxo(sessaoReiniciada, fluxo);
    }

    // 🎯 VERIFICAR SE ESTÁ AGUARDANDO TRANSFERÊNCIA
    // Se a sessão já tem flag de transferência, finalizar imediatamente e criar ticket
    if (sessao.contexto?.__aguardandoTransferencia) {
      this.logger.log(
        '🎫 [TRANSFERÊNCIA] Detectada flag __aguardandoTransferencia - finalizando triagem e criando ticket',
      );
      return await this.finalizarTriagem(sessao, fluxo);
    }

    // Adicionar ao histórico
    sessao.adicionarAoHistorico(
      sessao.etapaAtual,
      dto.resposta,
      new Date().getTime() - new Date(sessao.updatedAt).getTime(),
    );

    // Processar resposta baseado no tipo de etapa
    let proximaEtapa: string | null = null;

    // 🔍 PROCESSAR KEYWORDS (metadata.keywords) - Suporte para Web fallback
    const keywords = (etapaAtual as any)?.metadata?.keywords;
    if (keywords && typeof keywords === 'object') {
      const respostaNormalizada = dto.resposta?.toLowerCase().trim();

      if (respostaNormalizada && keywords[respostaNormalizada]) {
        proximaEtapa = keywords[respostaNormalizada];
        this.logger.log(`🔑 [KEYWORDS] "${dto.resposta}" → "${proximaEtapa}"`);

        // Avançar para próxima etapa identificada pela keyword
        sessao.etapaAnterior = sessao.etapaAtual;
        sessao.etapaAtual = proximaEtapa;
        const sessaoAtualizada = await this.sessaoRepository.save(sessao);
        return await this.gerarRespostaFluxo(sessaoAtualizada, fluxo);
      }
    }

    // 📋 Processamento especial para confirmação de dados
    if (
      sessao.etapaAtual === 'confirmar-dados-cliente' ||
      sessao.etapaAtual === 'confirmacao-dados' ||
      sessao.etapaAtual === 'verificar-dados-atualizados' // ✅ ADICIONAR NOVA ETAPA
    ) {
      const { eConfirmacao, eNegacao } = await import('../utils/confirmation-format.util');

      if (eConfirmacao(dto.resposta)) {
        this.logger.log('✅ Usuário confirmou dados cadastrados');
        // Avançar para próxima etapa (geralmente menu de núcleos ou transferência)
        proximaEtapa = etapaAtual.proximaEtapa || 'boas-vindas';

        await this.registrarLogSistema(
          sessao,
          'Dados confirmados pelo usuário',
          'dados_confirmados',
          {
            dados: {
              nome: sessao.contexto.nome,
              email: sessao.contexto.email,
              empresa: sessao.contexto.empresa,
            },
          },
        );
      } else if (eNegacao(dto.resposta)) {
        this.logger.log('❌ Usuário solicitou correção de dados');
        // Voltar para coleta de nome
        proximaEtapa = 'coleta-nome';

        await this.registrarLogSistema(
          sessao,
          'Usuário solicitou correção de dados',
          'correcao_solicitada',
          {},
        );
      } else {
        // Resposta inválida - pedir confirmação novamente
        return await this.responderComLog(sessao, fluxo, {
          mensagem:
            '❌ Resposta inválida.\n\n✅ Digite *SIM* para confirmar os dados\n❌ Digite *NÃO* para corrigir',
          sessaoId: sessao.id,
          etapaAtual: sessao.etapaAtual,
        });
      }

      // Avançar para próxima etapa
      sessao.etapaAnterior = sessao.etapaAtual;
      sessao.etapaAtual = proximaEtapa;
      const sessaoAtualizada = await this.sessaoRepository.save(sessao);
      return await this.gerarRespostaFluxo(sessaoAtualizada, fluxo);
    }

    let opcoesDisponiveis = Array.isArray(etapaAtual.opcoes) ? [...etapaAtual.opcoes] : [];

    if (sessao.etapaAtual === 'boas-vindas') {
      try {
        const nucleosVisiveis = await this.nucleoService.findOpcoesParaBot(sessao.empresaId);
        if (Array.isArray(nucleosVisiveis) && nucleosVisiveis.length > 0) {
          opcoesDisponiveis = criarOpcoesNucleos(sessao, nucleosVisiveis);
        }
      } catch (erro) {
        this.logger.error('Erro ao montar opções dinâmicas de núcleos:', erro);
      }
    } else if (sessao.etapaAtual === 'escolha-departamento') {
      const departamentosDisponiveis = sessao.contexto?.__departamentosDisponiveis;
      if (Array.isArray(departamentosDisponiveis) && departamentosDisponiveis.length > 0) {
        const proximaEtapaDepartamentosRaw = sessao.contexto?.__proximaEtapaDepartamento;
        const proximaEtapaDepartamentos =
          typeof proximaEtapaDepartamentosRaw === 'string' &&
          proximaEtapaDepartamentosRaw.trim().length > 0
            ? proximaEtapaDepartamentosRaw.trim()
            : 'transferir-atendimento';

        opcoesDisponiveis = criarOpcoesDepartamentos(
          sessao,
          departamentosDisponiveis,
          proximaEtapaDepartamentos,
        );
      }
    }

    if (opcoesDisponiveis.length > 0) {
      // Etapa de menu - encontrar opção escolhida
      const respostaOriginal = dto.resposta ? String(dto.resposta).trim() : '';
      const respostaNormalizada = normalizarTextoMenu(respostaOriginal);
      const respostaNumerica = respostaOriginal.replace(/\D/g, '');

      // 🆕 QUICK WIN: Detectar atalhos de palavras-chave
      const atalho = KeywordShortcuts.detectar(respostaOriginal);

      if (atalho && atalho.confianca > 0.8) {
        this.logger.log(
          `🎯 [ATALHO] Detectado: ${atalho.categoria} (${(atalho.confianca * 100).toFixed(0)}% confiança)`,
        );

        // Se detectou núcleo, ir para confirmação
        if (atalho.nucleoCodigo) {
          const nucleo = await this.nucleoRepository.findOne({
            where: {
              codigo: atalho.nucleoCodigo,
              empresaId: sessao.empresaId,
              ativo: true,
            },
          });

          if (nucleo) {
            // Salvar destino no contexto
            sessao.contexto.destinoNucleoId = nucleo.id;
            sessao.contexto.areaTitulo = nucleo.nome.toLowerCase();
            sessao.metadados.atalhoDetectado = {
              categoria: atalho.categoria,
              confianca: atalho.confianca,
              palavras: atalho.palavrasEncontradas,
            };

            // Ir para confirmação rápida
            sessao.etapaAtual = 'confirmar-atalho';
            await this.sessaoRepository.save(sessao);

            return await this.responderComLog(sessao, fluxo, {
              mensagem: `✅ Entendi! Você precisa de ajuda com *${nucleo.nome}*.

Posso te encaminhar agora para nossa equipe?

1️⃣ Sim, pode encaminhar
2️⃣ Não, quero escolher outra opção`,
              sessaoId: sessao.id,
              etapaAtual: sessao.etapaAtual,
              aguardaResposta: true,
            });
          }
        }

        // Se detectou ação de transferir para humano
        if (atalho.acao === 'transferir_geral') {
          const nucleoGeral = await this.nucleoRepository.findOne({
            where: {
              codigo: 'NUC_GERAL',
              empresaId: sessao.empresaId,
              ativo: true,
            },
          });

          if (nucleoGeral) {
            sessao.contexto.destinoNucleoId = nucleoGeral.id;
            sessao.contexto.areaTitulo = 'atendimento humano';
            sessao.etapaAtual = 'coleta-resumo'; // Coleta motivo rápido antes de transferir
            await this.sessaoRepository.save(sessao);

            return await this.responderComLog(sessao, fluxo, {
              mensagem:
                '👤 Vou te conectar com um atendente humano!\n\nAntes, conta rapidamente: qual o motivo do seu contato?\n\n💡 Digite SAIR para cancelar',
              sessaoId: sessao.id,
              etapaAtual: sessao.etapaAtual,
              aguardaResposta: true,
            });
          }
        }

        // Se detectou ação de sair/cancelar
        if (atalho.acao === 'finalizar') {
          this.logger.log('❌ Usuário solicitou cancelamento via atalho');
          sessao.contexto.__mensagemFinal =
            '👋 Atendimento cancelado. Caso precise de ajuda novamente, é só mandar uma mensagem! Até logo.';
          return await this.finalizarTriagem(sessao, fluxo);
        }
      }

      if (['sair', 'cancelar'].includes(respostaNormalizada)) {
        if (fluxo?.permiteSair === false) {
          this.logger.log('🚫 Fluxo configurado para não permitir saída via comando "sair".');
          return await this.responderComLog(sessao, fluxo, {
            mensagem: `🚫 Este atendimento não permite sair agora. Por favor, escolha uma das opções abaixo:\n\n${formatarOpcoes(opcoesDisponiveis)}`,
            sessaoId: sessao.id,
            etapaAtual: sessao.etapaAtual,
            opcoes: opcoesDisponiveis,
          });
        }

        this.logger.log('❌ Usuário solicitou cancelamento da triagem (menu).');
        sessao.contexto = sessao.contexto || {};
        sessao.contexto.__mensagemFinal =
          '👋 Atendimento cancelado. Caso precise de ajuda novamente, é só mandar uma mensagem! Até logo.';
        return await this.finalizarTriagem(sessao, fluxo);
      }

      this.logger.debug(`🔍 Procurando opção para resposta: "${respostaOriginal}"`);
      this.logger.debug(
        `📋 Opções disponíveis: ${opcoesDisponiveis.map((op) => `"${op.valor}"`).join(', ')}`,
      );

      const opcaoEscolhida = opcoesDisponiveis.find((op, index) => {
        const valorOriginal = op.valor != null ? String(op.valor) : String(index + 1);
        const valorNormalizado = normalizarTextoMenu(valorOriginal);
        const valorNumerico = valorOriginal.replace(/\D/g, '');
        const textoNormalizado = normalizarTextoMenu(op.texto);

        if (respostaNumerica && valorNumerico && respostaNumerica === valorNumerico) {
          return true;
        }

        if (respostaNormalizada && valorNormalizado && respostaNormalizada === valorNormalizado) {
          return true;
        }

        if (respostaNormalizada && textoNormalizado && respostaNormalizada === textoNormalizado) {
          return true;
        }

        if (Array.isArray((op as any).aliases)) {
          const aliasesNormalizadas = ((op as any).aliases as string[]).map((alias) =>
            normalizarTextoMenu(alias),
          );
          if (aliasesNormalizadas.includes(respostaNormalizada)) {
            return true;
          }
        }

        return false;
      });

      this.logger.debug(
        `✅ Opção encontrada: ${opcaoEscolhida ? `"${opcaoEscolhida.valor}" (${opcaoEscolhida.acao})` : 'NENHUMA'}`,
      );

      if (!opcaoEscolhida) {
        // Resposta inválida
        this.logger.warn(
          `❌ Opção inválida: "${dto.resposta}" não corresponde a nenhuma opção disponível`,
        );
        return await this.responderComLog(sessao, fluxo, {
          mensagem: `❌ Opção inválida. Por favor, escolha uma das opções:\n\n${formatarOpcoes(opcoesDisponiveis)}`,
          sessaoId: sessao.id,
          etapaAtual: sessao.etapaAtual,
          opcoes: opcoesDisponiveis,
        });
      }

      // Executar ação da opção
      return await this.executarAcao(sessao, fluxo, opcaoEscolhida, dto.resposta);
    } else if (etapaAtual.condicoes && etapaAtual.condicoes.length > 0) {
      // Etapa condicional - avaliar condições
      proximaEtapa = this.avaliarCondicoes(etapaAtual.condicoes, sessao.contexto);
    } else {
      // Verificar se o usuário quer cancelar/sair (antes de salvar qualquer dado)
      const respostaOriginal = dto.resposta ? String(dto.resposta).trim() : '';
      const respostaNormalizada = normalizarTextoMenu(respostaOriginal);

      if (['sair', 'cancelar'].includes(respostaNormalizada)) {
        this.logger.log('❌ Usuário solicitou cancelamento da triagem');
        sessao.contexto = sessao.contexto || {};
        sessao.contexto.__mensagemFinal =
          '👋 Atendimento cancelado. Caso precise de ajuda novamente, é só mandar uma mensagem! Até logo.';
        return await this.finalizarTriagem(sessao, fluxo);
      }

      // Etapa de texto livre ou coleta de dados - VALIDAR ANTES DE SALVAR
      const etapaColetaDados =
        etapaAtual.tipo === 'coleta_dados' ||
        etapaAtual.tipo === 'input' ||
        etapaAtual.tipo === 'coleta' ||
        etapaAtual.coletaDados === true;

      if (etapaColetaDados && etapaAtual.variavel) {
        this.logger.debug(`📝 [COLETA] Validando resposta para variável ${etapaAtual.variavel}`);

        const validacao = await this.validarRespostaEtapa(sessao, dto.resposta, etapaAtual);

        if (!validacao.valido) {
          // Resposta inválida - retornar mensagem de erro sem avançar
          this.logger.warn(`❌ Validação falhou: ${validacao.erro}`);

          await this.registrarLogSistema(
            sessao,
            `Validação falhou na etapa ${sessao.etapaAtual}`,
            'validacao_falhou',
            {
              resposta: dto.resposta,
              erro: validacao.erro,
            },
          );

          return await this.responderComLog(sessao, fluxo, {
            mensagem: `❌ ${validacao.erro}\n\nPor favor, tente novamente.`,
            sessaoId: sessao.id,
            etapaAtual: sessao.etapaAtual,
          });
        }

        // Validação OK - salvar valor normalizado
        const valorParaSalvar = validacao.valorNormalizado || dto.resposta;
        sessao.contexto[etapaAtual.variavel] = valorParaSalvar;

        this.logger.log(`✅ Dados coletados: ${etapaAtual.variavel} = ${valorParaSalvar}`);
        this.logger.debug(`📦 Contexto após coleta: ${JSON.stringify(sessao.contexto, null, 2)}`);
      }
      proximaEtapa = etapaAtual.proximaEtapa;
    }

    if (!proximaEtapa) {
      // Finalizar triagem
      this.logger.warn(
        `⚠️ [TRIAGEM] Etapa ${sessao.etapaAtual} sem proximaEtapa definida - finalizando`,
      );
      return await this.finalizarTriagem(sessao, fluxo);
    }

    // Avançar para próxima etapa
    this.logger.log(`🔄 [TRIAGEM] Avançando de "${sessao.etapaAtual}" → "${proximaEtapa}"`);
    sessao.avancarParaEtapa(proximaEtapa);
    await this.sessaoRepository.save(sessao);

    return await this.gerarRespostaFluxo(sessao, fluxo);
  }

  /**
   * Executa ação de uma opção do menu
   */
  private async executarAcao(
    sessao: SessaoTriagem,
    fluxo: FluxoTriagem,
    opcao: any,
    resposta: string,
  ): Promise<RespostaBot> {
    sessao.contexto = sessao.contexto || {};

    if (opcao?.salvarContexto && typeof opcao.salvarContexto === 'object') {
      this.logger.log(
        `💾 Salvando contexto da opção (${sessao.etapaAtual}): ${JSON.stringify(opcao.salvarContexto)}`,
      );
      for (const [chave, valor] of Object.entries(opcao.salvarContexto)) {
        if (valor === null || typeof valor === 'undefined') {
          if (Object.prototype.hasOwnProperty.call(sessao.contexto, chave)) {
            delete sessao.contexto[chave];
          }
          continue;
        }

        if (typeof valor === 'string') {
          if (valor === '{{resposta}}') {
            sessao.contexto[chave] = resposta;
            continue;
          }

          if (valor.startsWith('{{contexto.') && valor.endsWith('}}')) {
            const key = valor.substring(11, valor.length - 2);
            const contextoValor = sessao.contexto[key];
            if (typeof contextoValor !== 'undefined') {
              sessao.contexto[chave] = contextoValor;
            }
            continue;
          }
        }

        sessao.contexto[chave] = valor;
        this.logger.log(
          `💾 Contexto atualizado: ${chave} => ${
            Array.isArray(valor) ? `[array ${valor.length}]` : JSON.stringify(valor)
          }`,
        );
      }
    }

    const nucleoResolvido =
      opcao?.nucleoId ||
      (opcao?.nucleoContextKey ? sessao.contexto?.[opcao.nucleoContextKey] : undefined);
    const atendenteResolvido =
      opcao?.atendenteId ||
      (opcao?.atendenteContextKey ? sessao.contexto?.[opcao.atendenteContextKey] : undefined);

    switch (opcao.acao) {
      case 'proximo_passo':
        // ✨ Verificar se há lógica condicional para próxima etapa
        let proximaEtapaDefinida = opcao.proximaEtapa;

        if (opcao.proximaEtapaCondicional && Array.isArray(opcao.proximaEtapaCondicional)) {
          this.logger.log('🔀 Avaliando etapa condicional...');
          this.logger.log(
            '🧭 Contexto condicional:',
            JSON.stringify(
              {
                etapaAtual: sessao.etapaAtual,
                clienteCadastrado: sessao.contexto?.__clienteCadastrado,
                temDepartamentos: sessao.contexto?.__temDepartamentos,
                temDepartamentosTipo: typeof sessao.contexto?.__temDepartamentos,
                destinoNucleoId: sessao.contexto?.destinoNucleoId,
                destinoDepartamentoId: sessao.contexto?.destinoDepartamentoId,
              },
              null,
              2,
            ),
          );

          for (const condicao of opcao.proximaEtapaCondicional) {
            if (this.avaliarCondicao(condicao.se, sessao.contexto)) {
              proximaEtapaDefinida = condicao.entao;
              this.logger.log(
                `✅ Condição atendida: ${condicao.se} → Indo para: ${condicao.entao}`,
              );
              break;
            }
          }
        }

        if (!proximaEtapaDefinida) {
          throw new BadRequestException('Próxima etapa não definida');
        }

        sessao.avancarParaEtapa(proximaEtapaDefinida);
        await this.sessaoRepository.save(sessao);
        return await this.gerarRespostaFluxo(sessao, fluxo);

      case 'transferir_nucleo':
        if (!nucleoResolvido) {
          throw new BadRequestException('Núcleo não informado para transferência');
        }
        return await this.transferirParaNucleo(sessao, fluxo, nucleoResolvido);

      case 'transferir_atendente':
        if (!atendenteResolvido) {
          throw new BadRequestException('Atendente não informado para transferência');
        }
        return await this.transferirParaAtendente(
          sessao,
          fluxo,
          atendenteResolvido,
          nucleoResolvido,
        );

      case 'coletar_dado':
        if (opcao.variavel) {
          sessao.contexto[opcao.variavel] = resposta;
        }
        if (opcao.proximaEtapa) {
          sessao.avancarParaEtapa(opcao.proximaEtapa);
          await this.sessaoRepository.save(sessao);
          return await this.gerarRespostaFluxo(sessao, fluxo);
        }
        return await this.finalizarTriagem(sessao, fluxo);

      case 'enviar_mensagem':
        // Enviar mensagem adicional antes de prosseguir
        if (opcao.proximaEtapa) {
          sessao.avancarParaEtapa(opcao.proximaEtapa);
          await this.sessaoRepository.save(sessao);
          return {
            mensagem: opcao.mensagem,
            ...(await this.gerarRespostaFluxo(sessao, fluxo)),
          };
        }
        return await this.responderComLog(sessao, fluxo, {
          mensagem: opcao.mensagem,
          sessaoId: sessao.id,
          etapaAtual: sessao.etapaAtual,
        });

      case 'finalizar':
        return await this.finalizarTriagem(sessao, fluxo);

      default:
        throw new BadRequestException('Ação desconhecida');
    }
  }

  /**
   * Transfere para núcleo de atendimento
   * Agora busca atendentes disponíveis baseado em atribuições
   */
  private async transferirParaNucleo(
    sessao: SessaoTriagem,
    fluxo: FluxoTriagem,
    nucleoId: string,
  ): Promise<RespostaBot> {
    const nucleo = await this.nucleoRepository.findOne({
      where: { id: nucleoId },
    });

    if (!nucleo) {
      throw new NotFoundException('Núcleo não encontrado');
    }

    // 🎯 Buscar departamento selecionado (se houver)
    const departamentoId = sessao.contexto?.destinoDepartamentoId || null;

    const atendenteEscolhido = await this.atribuicaoService.selecionarAtendenteParaRoteamento(
      sessao.empresaId,
      nucleoId,
      departamentoId,
    );

    if (atendenteEscolhido) {
      this.logger.log(
        `✅ Atendente selecionado: ${atendenteEscolhido.nome} (${atendenteEscolhido.id})`,
      );
    } else {
      this.logger.warn(
        `⚠️ Nenhum atendente disponível para núcleo ${nucleoId}${departamentoId ? ` / departamento ${departamentoId}` : ''}`,
      );
    }

    const ticket = await this.garantirTicketParaSessao(sessao, fluxo, {
      nucleo,
      atendenteId: atendenteEscolhido?.id,
    });

    sessao.nucleoId = nucleoId;
    sessao.nucleoDestinoId = nucleoId;
    sessao.ticketId = ticket?.id;
    sessao.atendenteId = atendenteEscolhido?.id || null;
    sessao.transferir(atendenteEscolhido?.id, nucleoId);
    sessao.contexto = {
      ...(sessao.contexto || {}),
      __ticketId: ticket?.id,
      __nucleoDestinoId: nucleoId,
      __atendenteDestinoId: atendenteEscolhido?.id,
    };

    await this.sessaoRepository.save(sessao);

    // 🎯 Se houver atendente, atribuir ticket
    if (ticket?.id && atendenteEscolhido?.id) {
      try {
        await this.ticketService.atribuir(ticket.id, atendenteEscolhido.id);
        this.logger.log(`✅ Ticket ${ticket.id} atribuído ao atendente ${atendenteEscolhido.id}`);
      } catch (error) {
        this.logger.error(`❌ Erro ao atribuir ticket: ${error.message}`);
      }
    }

    await fluxo.incrementarConclusoes();
    await this.fluxoRepository.save(fluxo);

    let mensagem =
      nucleo.mensagemBoasVindas || `✅ Você foi direcionado para o núcleo de ${nucleo.nome}.`;

    if (atendenteEscolhido) {
      mensagem += ` O atendente ${atendenteEscolhido.nome} já foi notificado e entrará em contato em breve.`;
    } else {
      mensagem += ` Em breve um atendente entrará em contato.`;
    }

    await this.registrarLogSistema(
      sessao,
      `Sessão transferida para núcleo ${nucleo.id}`,
      'transferencia_nucleo',
      {
        nucleoId: nucleo.id,
        nucleoNome: nucleo.nome,
        atendenteDestinoId: atendenteEscolhido?.id,
        atendenteDestinoNome: atendenteEscolhido?.nome,
        ticketId: ticket?.id,
        departamentoId: departamentoId || sessao.contexto?.destinoDepartamentoId,
      },
    );

    return await this.responderComLog(sessao, fluxo, {
      mensagem,
      sessaoId: sessao.id,
      finalizado: true,
      nucleoId: nucleo.id,
      atendenteId: atendenteEscolhido?.id,
      ticketId: ticket?.id,
    });
  }

  /**
   * Transfere para atendente específico
   */
  private async transferirParaAtendente(
    sessao: SessaoTriagem,
    fluxo: FluxoTriagem,
    atendenteId: string,
    nucleoId?: string,
  ): Promise<RespostaBot> {
    let nucleo: NucleoAtendimento = null;
    if (nucleoId) {
      nucleo = await this.nucleoRepository.findOne({ where: { id: nucleoId } });
      if (!nucleo) {
        throw new NotFoundException('Núcleo não encontrado');
      }
    }

    const ticket = await this.garantirTicketParaSessao(sessao, fluxo, {
      nucleo: nucleo || undefined,
      atendenteId,
    });

    sessao.atendenteId = atendenteId;
    if (nucleoId) {
      sessao.nucleoId = nucleoId;
      sessao.nucleoDestinoId = nucleoId;
    }
    sessao.ticketId = ticket?.id;
    sessao.transferir(atendenteId, nucleoId);
    sessao.contexto = {
      ...(sessao.contexto || {}),
      __ticketId: ticket?.id,
      __atendenteDestinoId: atendenteId,
      ...(nucleoId ? { __nucleoDestinoId: nucleoId } : {}),
    };

    if (ticket?.id && atendenteId) {
      try {
        await this.ticketService.atribuir(ticket.id, atendenteId);
      } catch (error) {
        this.logger.error(
          `Falha ao atribuir ticket ${ticket.id} ao atendente ${atendenteId}: ${error.message}`,
        );
      }
    }

    await this.sessaoRepository.save(sessao);

    await fluxo.incrementarConclusoes();
    await this.fluxoRepository.save(fluxo);

    await this.registrarLogSistema(
      sessao,
      `Sessão transferida diretamente para atendente ${atendenteId}`,
      'transferencia_atendente',
      {
        nucleoId,
        atendenteId,
        ticketId: ticket?.id,
      },
    );

    return await this.responderComLog(sessao, fluxo, {
      mensagem:
        '✅ Você foi direcionado para um atendente especializado. Em breve iniciaremos o atendimento.',
      sessaoId: sessao.id,
      finalizado: true,
      atendenteId,
      nucleoId,
      ticketId: ticket?.id,
    });
  }

  /**
   * Finaliza triagem sem transferência específica
   */
  private async finalizarTriagem(sessao: SessaoTriagem, fluxo: FluxoTriagem): Promise<RespostaBot> {
    // 🆕 VERIFICAR SE ESTÁ AGUARDANDO TRANSFERÊNCIA
    if (sessao.contexto?.__aguardandoTransferencia) {
      this.logger.log(`🎫 [TRIAGEM FINALIZADA] Criando ticket para transferência`);

      const departamentoId = sessao.contexto?.__departamentoIdDestino;
      const nucleoId = sessao.contexto?.__nucleoIdDestino;
      const departamentoNome = sessao.contexto?.__departamentoNome || 'Departamento';

      if (departamentoId) {
        try {
          // 🔍 Buscar contatoId do contexto (preenchido quando contato existe)
          const contatoId = sessao.contexto?.__contatoId || null;

          // Criar ticket de atendimento
          const ticket = await this.ticketService.criarParaTriagem({
            contatoId,
            contatoTelefone: sessao.contatoTelefone,
            contatoNome: sessao.contatoNome || sessao.contexto?.nome || null,
            departamentoId,
            nucleoId,
            empresaId: sessao.empresaId,
            canalOrigem: 'whatsapp',
            prioridade: 'media',
            assunto: `Atendimento via Bot - ${departamentoNome}`,
            descricao: `Cliente solicitou atendimento através do bot de triagem.\n\nContexto:\n${JSON.stringify(sessao.contexto, null, 2)}`,
          });

          // Atualizar sessão com ticketId
          sessao.ticketId = ticket.id;
          this.logger.log(`✅ [TICKET] Criado: ${ticket.id} para departamento: ${departamentoId}`);

          // 🎬 Enviar sequência de mensagens profissionais ao cliente
          const numeroTicket = ticket.numero || ticket.id.substring(0, 8).toUpperCase();
          const primeiraMsg =
            `✅ *Atendimento Registrado*\n\n` +
            `Seu protocolo de atendimento é:\n` +
            `🎫 *#${numeroTicket}*\n\n` +
            `_Processando sua solicitação..._`;

          let continuarSequencia = true;

          try {
            await this.enviarMensagemWhatsApp(
              sessao.contatoTelefone,
              primeiraMsg,
              sessao.empresaId,
            );
            this.logger.log(`📱 [WHATSAPP] 1/3 - Protocolo enviado ao cliente`);
          } catch (error) {
            this.logger.error(`❌ [WHATSAPP] Erro ao enviar protocolo: ${error.message}`);

            // 🔄 Fallback: tentar enviar mensagem simples e encerrar sequência
            try {
              const msgFallback =
                `✅ Atendimento registrado!\n\n` +
                `Protocolo: #${ticket.numero || 'AGUARDE'}\n\n` +
                `Você será atendido em breve. Aguarde na linha.`;

              await this.enviarMensagemWhatsApp(
                sessao.contatoTelefone,
                msgFallback,
                sessao.empresaId,
              );
            } catch (fallbackError) {
              this.logger.error(`❌ [WHATSAPP] Fallback também falhou: ${fallbackError.message}`);
            }

            continuarSequencia = false;
          }

          // Garantir que sabemos o nome do atendente (busca adicional se necessário)
          let nomeAtendente = ticket.atendenteNome || null;
          if (!nomeAtendente && ticket.atendenteId) {
            try {
              const atendente = await this.userRepository.findOne({
                where: { id: ticket.atendenteId },
              });
              nomeAtendente = atendente?.nome || null;
              if (nomeAtendente) {
                this.logger.log(
                  `👤 [TRIAGEM] Nome do atendente obtido via repositório: ${nomeAtendente}`,
                );
              }
            } catch (error) {
              this.logger.warn(
                `⚠️ [TRIAGEM] Não foi possível buscar nome do atendente (${ticket.atendenteId}): ${error instanceof Error ? error.message : String(error)}`,
              );
            }
          }

          if (continuarSequencia) {
            // Se ainda não temos nome do atendente, aguardar breve intervalo e consultar ticket novamente
            if (!nomeAtendente) {
              await new Promise((resolve) => setTimeout(resolve, 1200));
              try {
                const ticketAtualizado = await this.ticketService.buscarPorId(
                  ticket.id,
                  sessao.empresaId,
                );
                if (
                  ticketAtualizado?.atendenteId &&
                  ticketAtualizado.atendenteId !== ticket.atendenteId
                ) {
                  this.logger.log(
                    `🔄 [TRIAGEM] Ticket atualizado com novo atendente: ${ticketAtualizado.atendenteId}`,
                  );
                }

                if (!ticketAtualizado?.atendenteNome && ticketAtualizado?.atendenteId) {
                  const atendente = await this.userRepository.findOne({
                    where: { id: ticketAtualizado.atendenteId },
                  });
                  nomeAtendente = atendente?.nome || null;
                } else if (ticketAtualizado?.atendenteNome) {
                  nomeAtendente = ticketAtualizado.atendenteNome;
                }

                if (nomeAtendente) {
                  this.logger.log(
                    `✅ [TRIAGEM] Nome do atendente obtido após reconsulta: ${nomeAtendente}`,
                  );
                }
              } catch (error) {
                this.logger.warn(
                  `⚠️ [TRIAGEM] Falha ao reconsultar ticket ${ticket.id}: ${error instanceof Error ? error.message : String(error)}`,
                );
              }
            }

            // ⏱️ Delay + indicador de digitação (2 segundos)
            await new Promise((resolve) => setTimeout(resolve, 2000));
            try {
              await this.whatsAppSenderService.enviarIndicadorDigitacao(
                sessao.empresaId,
                sessao.contatoTelefone,
              );
            } catch (error) {
              this.logger.warn(
                `⚠️ [WHATSAPP] Não foi possível enviar indicador de digitação (1ª etapa): ${error instanceof Error ? error.message : String(error)}`,
              );
            }
            await new Promise((resolve) => setTimeout(resolve, 800)); // Mostra "..." por 0.8s

            // 2️⃣ Informar sobre atendente atribuído
            if (nomeAtendente) {
              const segundaMsg =
                `👤 *Atendente Designado*\n\n` +
                `Você será atendido por:\n` +
                `*${nomeAtendente}*\n\n` +
                `Departamento: _${departamentoNome}_`;

              try {
                await this.enviarMensagemWhatsApp(
                  sessao.contatoTelefone,
                  segundaMsg,
                  sessao.empresaId,
                );
                this.logger.log(`📱 [WHATSAPP] 2/2 - Info do atendente enviada`);
              } catch (error) {
                this.logger.error(
                  `❌ [WHATSAPP] Erro ao enviar informação do atendente: ${error instanceof Error ? error.message : String(error)}`,
                );
              }
            } else {
              // 2️⃣ Alternativa: Nenhum atendente disponível no momento
              const segundaMsg =
                `⏳ *Buscando Atendente...*\n\n` +
                `Estamos localizando um especialista disponível.\n\n` +
                `Departamento: _${departamentoNome}_\n\n` +
                `_Você receberá uma notificação assim que o atendimento iniciar._`;

              try {
                await this.enviarMensagemWhatsApp(
                  sessao.contatoTelefone,
                  segundaMsg,
                  sessao.empresaId,
                );
                this.logger.warn(
                  `⚠️ [TICKET] 2/2 - Nenhum atendente atribuído - cliente informado`,
                );
              } catch (error) {
                this.logger.error(
                  `❌ [WHATSAPP] Erro ao informar ausência de atendente: ${error instanceof Error ? error.message : String(error)}`,
                );
              }
            }
          }
        } catch (error) {
          this.logger.error(`❌ [TICKET] Erro ao criar ticket: ${error.message}`, error.stack);
        }
      }
    }

    await sessao.concluir({ status: 'concluida' });
    await this.sessaoRepository.save(sessao);

    await fluxo.incrementarConclusoes();
    await this.fluxoRepository.save(fluxo);

    const mensagemFinal =
      (sessao.contexto?.__mensagemFinal && String(sessao.contexto.__mensagemFinal)) ||
      '✅ Triagem concluída! Obrigado pelas informações.';

    await this.registrarLogSistema(sessao, 'Sessão de triagem finalizada', 'sessao_finalizada', {
      ticketId: sessao.ticketId,
      mensagemFinal: mensagemFinal,
    });

    return await this.responderComLog(sessao, fluxo, {
      mensagem: mensagemFinal,
      sessaoId: sessao.id,
      finalizado: true,
      ticketId: sessao.ticketId,
    });
  }

  private async garantirTicketParaSessao(
    sessao: SessaoTriagem,
    fluxo: FluxoTriagem,
    contexto?: { nucleo?: NucleoAtendimento; atendenteId?: string },
  ): Promise<any> {
    if (sessao.ticketId) {
      try {
        return await this.ticketService.buscarPorId(sessao.ticketId, sessao.empresaId);
      } catch (error) {
        this.logger.warn(`Ticket vinculado à sessão ${sessao.id} não encontrado: ${error.message}`);
        sessao.ticketId = null;
      }
    }

    const ticketsExistentes = await this.ticketService.buscarPorTelefone(
      sessao.empresaId,
      sessao.contatoTelefone,
    );

    const ticketAtivo = ticketsExistentes?.find((ticket) => {
      const statusNormalizado = (ticket.status || '').toUpperCase() as StatusTicket;
      return [StatusTicket.ABERTO, StatusTicket.EM_ATENDIMENTO, StatusTicket.AGUARDANDO].includes(
        statusNormalizado,
      );
    });

    if (ticketAtivo) {
      sessao.ticketId = ticketAtivo.id;
      sessao.contexto = {
        ...(sessao.contexto || {}),
        __ticketId: ticketAtivo.id,
      };
      await this.sessaoRepository.save(sessao);

      await this.registrarLogSistema(
        sessao,
        `Ticket ${ticketAtivo.id} reutilizado para sessão de triagem`,
        'ticket_reutilizado',
        {
          ticketId: ticketAtivo.id,
          origem: 'triagem',
        },
      );
      return ticketAtivo;
    }

    const ticketCriado = await this.ticketService.criar({
      empresaId: sessao.empresaId,
      canalId: this.obterCanalIdSessao(sessao),
      clienteNumero: sessao.contatoTelefone,
      clienteNome: sessao.contatoNome || sessao.contatoTelefone,
      clienteEmail: sessao.contatoEmail,
      assunto: this.definirAssuntoTicket(sessao, fluxo, contexto),
      descricao: this.gerarDescricaoTicket(sessao, fluxo),
      origem: this.mapearOrigemTicket(sessao.canal),
      prioridade: PrioridadeTicket.MEDIA,
      metadata: {
        fluxoId: fluxo.id,
        sessaoId: sessao.id,
        nucleoId: contexto?.nucleo?.id,
        atendenteId: contexto?.atendenteId,
      },
    });

    sessao.ticketId = ticketCriado.id;
    sessao.contexto = {
      ...(sessao.contexto || {}),
      __ticketId: ticketCriado.id,
    };

    await this.sessaoRepository.save(sessao);

    await this.registrarLogSistema(
      sessao,
      `Ticket ${ticketCriado.id} criado a partir da triagem`,
      'ticket_criado',
      {
        ticketId: ticketCriado.id,
        prioridade: ticketCriado.prioridade,
        nucleoId: contexto?.nucleo?.id,
        atendenteId: contexto?.atendenteId,
      },
    );

    return ticketCriado;
  }

  private definirAssuntoTicket(
    sessao: SessaoTriagem,
    fluxo: FluxoTriagem,
    contexto?: { nucleo?: NucleoAtendimento; atendenteId?: string },
  ): string {
    const partes: string[] = [];

    if (fluxo?.nome) {
      partes.push(`Triagem ${fluxo.nome}`);
    } else {
      partes.push('Triagem automática');
    }

    if (contexto?.nucleo?.nome) {
      partes.push(`Núcleo ${contexto.nucleo.nome}`);
    }

    if (contexto?.atendenteId) {
      partes.push('Atendimento humano');
    }

    const assunto = partes.join(' - ') || 'Triagem automática';
    return this.truncarTexto(assunto, 120);
  }

  private gerarDescricaoTicket(sessao: SessaoTriagem, fluxo: FluxoTriagem): string {
    const historico = Array.isArray(sessao.historico) ? sessao.historico : [];

    const respostas =
      historico.length > 0
        ? historico
            .map((item, index) => {
              const etapa = fluxo?.estrutura?.etapas?.[item.etapa];
              const pergunta = etapa?.mensagem
                ? etapa.mensagem.replace(/\s+/g, ' ').trim()
                : item.etapa;
              return `${index + 1}. ${pergunta}: ${item.resposta}`;
            })
            .join('\n')
        : 'Nenhuma resposta registrada durante a triagem.';

    const contexto = sessao.contexto || {};
    const variaveis = Object.entries(contexto)
      .filter(([chave]) => !chave.startsWith('__'))
      .map(
        ([chave, valor]) =>
          `${chave}: ${typeof valor === 'object' ? JSON.stringify(valor) : valor}`,
      )
      .join('\n');

    const contextoTexto = variaveis ? `\n\nContexto coletado:\n${variaveis}` : '';

    const descricao = `Fluxo: ${fluxo?.nome || 'Triagem'}\nSessão: ${sessao.id}\nCanal: ${sessao.canal}\nTelefone: ${sessao.contatoTelefone}\n\nRespostas:\n${respostas}${contextoTexto}`;

    return this.truncarTexto(descricao, 1800);
  }

  private mapearOrigemTicket(canal: string): OrigemTicket {
    switch ((canal || '').toLowerCase()) {
      case 'whatsapp':
        return OrigemTicket.WHATSAPP;
      case 'telegram':
        return OrigemTicket.TELEGRAM;
      case 'chat':
      case 'webchat':
        return OrigemTicket.WEBCHAT;
      case 'email':
        return OrigemTicket.EMAIL;
      case 'sms':
        return OrigemTicket.SMS;
      default:
        return OrigemTicket.API;
    }
  }

  private obterCanalIdSessao(sessao: SessaoTriagem): string | null {
    if (!sessao?.contexto) {
      return null;
    }

    if (sessao.contexto.__canalId) {
      return sessao.contexto.__canalId;
    }

    if (sessao.contexto.canalId) {
      return sessao.contexto.canalId;
    }

    return null;
  }

  private truncarTexto(texto: string, limite: number): string {
    if (!texto) {
      return texto;
    }

    return texto.length > limite ? `${texto.substring(0, limite - 3)}...` : texto;
  }

  private async registrarLogEntradaMensagem(
    empresaId: string,
    dadosMensagem: DadosMensagemWebhook | null,
    sessao?: SessaoTriagem | null,
    payload?: any,
  ): Promise<void> {
    if (!dadosMensagem?.texto) {
      return;
    }

    try {
      await this.triagemLogService.registrarEntrada({
        empresaId,
        sessaoId: sessao?.id,
        fluxoId: sessao?.fluxoId,
        etapa: sessao?.etapaAtual,
        canal: 'whatsapp',
        tipo: dadosMensagem.tipoMensagem || 'text',
        mensagem: dadosMensagem.texto,
        messageId: dadosMensagem.messageId,
        payload: dadosMensagem.rawMessage || payload,
        metadata: {
          origem: 'whatsapp_webhook',
          nomeContato: dadosMensagem.nome,
        },
        contextoSnapshot: sessao?.contexto,
      });
    } catch (erro) {
      this.logger.error(
        `Falha ao registrar log de entrada: ${erro instanceof Error ? erro.message : String(erro)}`,
      );
    }
  }

  private async registrarLogEntradaTexto(
    sessao: SessaoTriagem | null,
    mensagem: string | undefined,
    metadata?: Record<string, any>,
    tipo: string = 'text',
  ): Promise<void> {
    if (!sessao || !mensagem) {
      return;
    }

    try {
      await this.triagemLogService.registrarEntrada({
        empresaId: sessao.empresaId,
        sessaoId: sessao.id,
        fluxoId: sessao.fluxoId,
        etapa: sessao.etapaAtual,
        canal: sessao.canal,
        tipo,
        mensagem: String(mensagem),
        metadata,
        contextoSnapshot: sessao.contexto,
      });
    } catch (erro) {
      this.logger.error(
        `Falha ao registrar log de entrada: ${erro instanceof Error ? erro.message : String(erro)}`,
      );
    }
  }

  private construirMensagemRespostaLog(resposta: RespostaBot): string {
    const partes: string[] = [];

    if (resposta?.mensagem) {
      partes.push(resposta.mensagem);
    }

    if (Array.isArray(resposta?.opcoes) && resposta.opcoes.length > 0) {
      const opcoesFormatadas = resposta.opcoes
        .map((opcao, indice) => `${indice + 1}) ${opcao.texto || opcao.valor}`)
        .join('\n');

      partes.push(`Opções:\n${opcoesFormatadas}`);
    }

    return partes.join('\n\n');
  }

  private async responderComLog(
    sessao: SessaoTriagem | null,
    fluxo: FluxoTriagem | null,
    resposta: RespostaBot,
  ): Promise<RespostaBot> {
    if (!sessao || !resposta) {
      return resposta;
    }

    try {
      await this.triagemLogService.registrarSaida({
        empresaId: sessao.empresaId,
        sessaoId: sessao.id,
        fluxoId: fluxo?.id || sessao.fluxoId,
        etapa: sessao.etapaAtual,
        canal: sessao.canal,
        tipo: resposta.tipoBotao ? `bot_interativo_${resposta.tipoBotao}` : 'bot_texto',
        mensagem: this.construirMensagemRespostaLog(resposta),
        metadata: {
          finalizado: resposta.finalizado || false,
          usarBotoes: resposta.usarBotoes || false,
          autoAvanco: resposta.autoAvanco || false,
          opcoes: resposta.opcoes || [],
          nucleoId: resposta.nucleoId,
          atendenteId: resposta.atendenteId,
          ticketId: resposta.ticketId,
        },
        contextoSnapshot: sessao.contexto,
      });
    } catch (erro) {
      this.logger.error(
        `Falha ao registrar log de saída: ${erro instanceof Error ? erro.message : String(erro)}`,
      );
    }

    return resposta;
  }

  private async registrarLogSistema(
    sessao: SessaoTriagem | null,
    mensagem: string,
    tipo: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    if (!sessao) {
      return;
    }

    try {
      await this.triagemLogService.registrarSistema({
        empresaId: sessao.empresaId,
        sessaoId: sessao.id,
        fluxoId: sessao.fluxoId,
        etapa: sessao.etapaAtual,
        canal: sessao.canal,
        tipo,
        mensagem,
        metadata,
        contextoSnapshot: sessao.contexto,
      });
    } catch (erro) {
      this.logger.error(
        `Falha ao registrar log de sistema: ${erro instanceof Error ? erro.message : String(erro)}`,
      );
    }
  }

  /**
   * Avalia condições para etapa condicional
   */
  private avaliarCondicoes(condicoes: any[], contexto: Record<string, any>): string | null {
    for (const condicao of condicoes) {
      const valor = contexto[condicao.variavel];
      let resultado = false;

      switch (condicao.operador) {
        case 'igual':
          resultado = valor == condicao.valor;
          break;
        case 'diferente':
          resultado = valor != condicao.valor;
          break;
        case 'contem':
          resultado = String(valor).includes(condicao.valor);
          break;
        case 'maior':
          resultado = Number(valor) > Number(condicao.valor);
          break;
        case 'menor':
          resultado = Number(valor) < Number(condicao.valor);
          break;
      }

      if (resultado) {
        return condicao.proximaEtapa;
      }
    }

    return null;
  }

  /**
   * ✨ Avalia uma expressão condicional simples
   * Suporta: variavel === valor, variavel !== valor, variavel == valor, variavel != valor
   */
  private avaliarCondicao(expressao: string, contexto: Record<string, any>): boolean {
    try {
      // Permitir combinações com && e || dividindo em grupos
      const gruposOu = expressao
        .split('||')
        .map((grupo) => grupo.trim())
        .filter(Boolean);

      for (const grupo of gruposOu) {
        const condicoesE = grupo
          .split('&&')
          .map((condicao) => condicao.trim())
          .filter(Boolean);

        const todasCondicoesAtendidas = condicoesE.every((condicao) =>
          this.avaliarExpressaoSimples(condicao, contexto),
        );

        if (todasCondicoesAtendidas) {
          return true;
        }
      }

      return false;
    } catch (erro) {
      this.logger.error(`❌ Erro ao avaliar condição "${expressao}": ${erro.message}`);
      return false;
    }
  }

  private avaliarExpressaoSimples(expressao: string, contexto: Record<string, any>): boolean {
    const expr = expressao.replace(/contexto\./g, '');

    let operador: string;
    let partes: string[];

    if (expr.includes('===')) {
      operador = '===';
      partes = expr.split('===').map((p) => p.trim());
    } else if (expr.includes('!==')) {
      operador = '!==';
      partes = expr.split('!==').map((p) => p.trim());
    } else if (expr.includes('==')) {
      operador = '==';
      partes = expr.split('==').map((p) => p.trim());
    } else if (expr.includes('!=')) {
      operador = '!=';
      partes = expr.split('!=').map((p) => p.trim());
    } else {
      this.logger.warn(`⚠️ Operador não suportado na expressão: ${expressao}`);
      return false;
    }

    if (partes.length !== 2) {
      this.logger.warn(`⚠️ Expressão inválida: ${expressao}`);
      return false;
    }

    const [variavelNome, valorEsperado] = partes;
    const valorContexto = contexto[variavelNome];

    let valorComparacao: any = valorEsperado;
    if (valorEsperado === 'true') {
      valorComparacao = true;
    } else if (valorEsperado === 'false') {
      valorComparacao = false;
    } else if (valorEsperado === 'null') {
      valorComparacao = null;
    } else if (!isNaN(Number(valorEsperado))) {
      valorComparacao = Number(valorEsperado);
    } else if (valorEsperado.startsWith("'") && valorEsperado.endsWith("'")) {
      valorComparacao = valorEsperado.slice(1, -1);
    } else if (valorEsperado.startsWith('"') && valorEsperado.endsWith('"')) {
      valorComparacao = valorEsperado.slice(1, -1);
    }

    let resultado = false;
    switch (operador) {
      case '===':
        resultado = valorContexto === valorComparacao;
        break;
      case '!==':
        resultado = valorContexto !== valorComparacao;
        break;
      case '==':
        resultado = valorContexto == valorComparacao;
        break;
      case '!=':
        resultado = valorContexto != valorComparacao;
        break;
    }

    this.logger.log(
      `🔍 Avaliação: ${variavelNome} (${valorContexto}) ${operador} ${valorComparacao} = ${resultado}`,
    );

    return resultado;
  }

  /**
   * Busca sessão ativa por telefone
   */
  async buscarSessaoAtiva(
    empresaId: string,
    contatoTelefone: string,
  ): Promise<SessaoTriagem | null> {
    const sessao = await this.sessaoRepository.findOne({
      where: {
        empresaId,
        contatoTelefone,
        status: 'em_andamento',
      },
      relations: ['fluxo'],
    });

    if (sessao && sessao.estaExpirada()) {
      sessao.status = 'expirada';
      await this.sessaoRepository.save(sessao);
      await this.registrarLogSistema(
        sessao,
        'Sessão marcada como expirada ao consultar sessão ativa',
        'sessao_expirada',
        {
          origem: 'buscarSessaoAtiva',
        },
      );
      return null;
    }

    return sessao;
  }

  /**
   * Cancela sessão de triagem
   */
  async cancelarSessao(empresaId: string, sessaoId: string): Promise<void> {
    const sessao = await this.sessaoRepository.findOne({
      where: { id: sessaoId, empresaId },
      relations: ['fluxo'],
    });

    if (!sessao) return;

    sessao.status = 'cancelada';
    await this.sessaoRepository.save(sessao);

    await this.registrarLogSistema(
      sessao,
      'Sessão de triagem cancelada manualmente',
      'sessao_cancelada',
      {
        motivo: 'cancelamento_manual',
      },
    );

    if (sessao.fluxo) {
      await sessao.fluxo.incrementarAbandonos();
      await this.fluxoRepository.save(sessao.fluxo);
    }
  }

  /**
   * Extrai dados relevantes do payload recebido via webhook
   */
  private extrairDadosWebhook(payload: any): DadosMensagemWebhook | null {
    if (!payload) {
      return null;
    }

    // Estrutura simplificada (utilizada nos testes automatizados)
    if (payload.from && payload.body) {
      return {
        telefone: String(payload.from),
        texto: String(payload.body).trim(),
        nome: payload.name ? String(payload.name) : undefined,
        messageId: payload.messageId || payload.id,
        canalId: payload.canalId,
        tipoMensagem: payload.type || 'text',
        rawMessage: payload,
      };
    }

    // Estrutura padrão Meta WhatsApp Cloud API
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      // Pode ser evento de status/read/etc
      return null;
    }

    const texto =
      message.text?.body ||
      message.button?.text ||
      message.interactive?.list_reply?.title ||
      message.interactive?.button_reply?.title;

    const telefone = message.from || value?.contacts?.[0]?.wa_id;
    const nome = value?.contacts?.[0]?.profile?.name;
    const messageId = message.id || message.message_id;
    const canalId = value?.metadata?.phone_number_id;

    if (!telefone || !texto) {
      return null;
    }

    return {
      telefone: String(telefone),
      texto: String(texto).trim(),
      nome: nome ? String(nome) : undefined,
      messageId: messageId ? String(messageId) : undefined,
      canalId: canalId ? String(canalId) : undefined,
      tipoMensagem: message?.type ? String(message.type) : undefined,
      rawMessage: message,
    };
  }

  /**
   * Remove caracteres desnecessários mantendo sinal de + inicial (caso exista)
   */
  private normalizarTelefone(telefone: string): string {
    if (!telefone) {
      return telefone;
    }

    const trimmed = telefone.trim();
    const possuiMais = trimmed.startsWith('+');
    const somenteDigitos = trimmed.replace(/[^0-9]/g, '');

    if (possuiMais) {
      return `+${somenteDigitos}`;
    }

    return somenteDigitos;
  }

  /**
   * 🔍 Valida resposta do usuário baseado na etapa atual
   */
  private async validarRespostaEtapa(
    sessao: SessaoTriagem,
    resposta: string,
    etapa: any,
  ): Promise<{ valido: boolean; erro?: string; valorNormalizado?: string }> {
    const etapaId = sessao.etapaAtual;

    // Detectar cancelamento
    if (ValidationUtil.isRespostaCancelamento(resposta)) {
      return {
        valido: true,
        valorNormalizado: resposta,
      };
    }

    // Validações específicas por etapa
    if (etapaId === 'coleta-email' || etapaId === 'coletar_email') {
      return ValidationUtil.validarEmail(resposta);
    }

    if (etapaId === 'coleta-nome' || etapaId === 'coletar_primeiro_nome') {
      return ValidationUtil.validarNome(resposta, 'Nome');
    }

    if (etapaId === 'coleta-sobrenome' || etapaId === 'coletar_sobrenome') {
      return ValidationUtil.validarNome(resposta, 'Sobrenome');
    }

    if (etapaId === 'coleta-empresa' || etapaId === 'coletar_empresa') {
      return ValidationUtil.validarEmpresa(resposta);
    }

    // Validação genérica baseada em config da etapa
    if (etapa?.validacao) {
      const { tipo, minimo, minLength, maximo, maxLength, regex, mensagemErro } = etapa.validacao;

      const minimoAjustado = minimo ?? minLength;
      const maximoAjustado = maximo ?? maxLength;

      if (tipo === 'email') {
        return ValidationUtil.validarEmail(resposta);
      }

      if (tipo === 'nome' || tipo === 'text') {
        const respostaTrimmed = resposta.trim();

        if (minimoAjustado && respostaTrimmed.length < minimoAjustado) {
          return {
            valido: false,
            erro: mensagemErro || `Resposta deve ter pelo menos ${minimoAjustado} caracteres`,
          };
        }

        if (maximoAjustado && respostaTrimmed.length > maximoAjustado) {
          return {
            valido: false,
            erro: mensagemErro || `Resposta deve ter no máximo ${maximoAjustado} caracteres`,
          };
        }
      }

      if (tipo === 'telefone') {
        return ValidationUtil.validarTelefone(resposta);
      }

      if (regex && typeof regex === 'string') {
        try {
          const regexPattern = new RegExp(regex);
          if (!regexPattern.test(resposta)) {
            return {
              valido: false,
              erro: mensagemErro || 'Formato inválido',
            };
          }
        } catch (error) {
          this.logger.error(`Erro ao validar regex: ${error.message}`);
        }
      }
    }

    // Sem validação específica, aceitar qualquer resposta
    return {
      valido: true,
      valorNormalizado: ValidationUtil.normalizarResposta(resposta),
    };
  }

  /**
   * Método auxiliar para enviar mensagem via WhatsApp
   */
  private async enviarMensagemWhatsApp(
    telefone: string,
    mensagem: string,
    empresaId: string,
  ): Promise<void> {
    try {
      const resultado = await this.whatsAppSenderService.enviarMensagem(
        empresaId,
        telefone,
        mensagem,
      );

      if (!resultado.sucesso) {
        throw new Error(resultado.erro || 'Falha no envio');
      }
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem WhatsApp: ${error.message}`);
      throw error;
    }
  }
}
