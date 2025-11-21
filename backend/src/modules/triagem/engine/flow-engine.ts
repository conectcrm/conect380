import { BadRequestException, Logger } from '@nestjs/common';
import { FluxoTriagem, Etapa } from '../entities/fluxo-triagem.entity';
import { SessaoTriagem } from '../entities/sessao-triagem.entity';
import {
  BotOption,
  RespostaBot,
  NucleoBotOption,
  DepartamentoBotOption,
} from '../types/triagem-bot.types';
import { formatarOpcoes, obterEmojiPorNome } from '../utils/menu-format.util';
import { criarOpcoesDepartamentos, criarOpcoesNucleos } from '../utils/flow-options.util';
import { formatarConfirmacaoDados } from '../utils/confirmation-format.util';

export interface FlowEngineHelpers {
  buscarNucleosParaBot(sessao: SessaoTriagem): Promise<NucleoBotOption[]>;
}

export interface FlowEngineConfig {
  fluxo: FluxoTriagem;
  sessao: SessaoTriagem;
  helpers: FlowEngineHelpers;
  logger?: Logger;
}

interface StepBuildResult {
  resposta: RespostaBot;
  autoAvancar?: boolean;
  proximaEtapaId?: string;
}

export interface FlowEngineExecutionResult {
  resposta: RespostaBot;
  sessionMutated: boolean;
}

export class FlowEngine {
  private readonly logger: Logger;
  private sessionMutated = false;

  constructor(private readonly config: FlowEngineConfig) {
    this.logger = config.logger ?? new Logger(FlowEngine.name);
  }

  async buildResponse(): Promise<FlowEngineExecutionResult> {
    let safetyCounter = 0;

    while (safetyCounter < 10) {
      safetyCounter += 1;
      const resultado = await this.buildSingleStep();

      if (!resultado.autoAvancar || !resultado.proximaEtapaId) {
        const respostaFinal = resultado.resposta;
        respostaFinal.sessaoId = this.config.sessao.id;
        respostaFinal.etapaAtual = this.config.sessao.etapaAtual;

        return {
          resposta: respostaFinal,
          sessionMutated: this.sessionMutated,
        };
      }

      this.logger.log(
        `🚀 [FLOW ENGINE] Etapa "${this.config.sessao.etapaAtual}" não aguarda resposta. Avançando automaticamente para "${resultado.proximaEtapaId}"`,
      );

      this.avancarSessao(resultado.proximaEtapaId, true);
    }

    throw new BadRequestException('Limite de auto avanço excedido ao montar resposta do fluxo');
  }

  private async buildSingleStep(): Promise<StepBuildResult> {
    const sessao = this.config.sessao;
    const fluxo = this.config.fluxo;
    const etapaId = sessao.etapaAtual;
    const etapa = fluxo.estrutura?.etapas?.[etapaId] as Etapa & Record<string, any>;

    if (!etapa) {
      throw new BadRequestException(`Etapa "${etapaId}" não encontrada no fluxo`);
    }

    // 🔀 PROCESSAR ETAPA CONDICIONAL
    if (etapa.tipo === 'condicional') {
      this.logger.log(`🔀 [FLOW ENGINE] Processando etapa condicional: ${etapaId}`);
      return this.processarEtapaCondicional(etapa);
    }

    // 🎯 PROCESSAR ETAPA DE TRANSFERÊNCIA
    if (
      etapaId === 'transferir-atendimento' ||
      (etapa.tipo === 'acao' && etapa.acao === 'transferir')
    ) {
      this.logger.log(`🎯 [FLOW ENGINE] Processando transferência de atendimento`);
      return await this.processarTransferenciaAtendimento(etapa);
    }

    let mensagem = etapa.mensagem || '';

    if (
      etapaId === 'boas-vindas' &&
      sessao.contexto?.__clienteCadastrado === true &&
      (sessao.contexto?.primeiroNome || sessao.contexto?.nome)
    ) {
      // 🎯 Personalizar saudação para cliente cadastrado
      const nomeExibicao = sessao.contexto.primeiroNome || sessao.contexto.nome;

      // Verificar se há mensagem personalizada no metadata da etapa
      if (etapa.metadata?.mensagemClienteExistente) {
        mensagem = etapa.metadata.mensagemClienteExistente;
        this.logger.log(`✨ Usando mensagem personalizada do metadata para cliente existente`);
      } else {
        // Fallback: substituir saudações genéricas pela personalizada
        const saudacao = `👋 Olá, *${nomeExibicao}*! Que bom ter você de volta! 😊`;

        const saudacoesGenericas = [
          '👋 Olá! Eu sou a assistente virtual da ConectCRM.',
          'Olá! Seja bem-vindo ao ConectCRM!',
          'Olá! Seja bem-vindo',
          '👋 Olá!',
        ];

        for (const saudacaoGenerica of saudacoesGenericas) {
          if (mensagem.includes(saudacaoGenerica)) {
            mensagem = mensagem.replace(saudacaoGenerica, saudacao);
            break;
          }
        }
      }

      this.logger.log(`✨ Saudação personalizada para ${nomeExibicao}`);
    }

    mensagem = this.substituirVariaveisNaMensagem(mensagem, sessao);

    // 📋 Formatação especial para confirmação de dados
    if (etapaId === 'confirmar-dados-cliente' || etapaId === 'confirmacao-dados') {
      mensagem = formatarConfirmacaoDados(sessao.contexto);
      this.logger.log('📋 Mensagem de confirmação de dados formatada');
    }

    let opcoesMenu: BotOption[] = Array.isArray(etapa.opcoes) ? [...(etapa.opcoes as any[])] : [];

    if (
      (etapaId === 'confirmar-dados-cliente' || etapaId === 'confirmacao-dados') &&
      opcoesMenu.length === 0
    ) {
      opcoesMenu = this.criarOpcoesConfirmacaoPadrao();
    }

    // 🎯 RESOLVER MENU DE NÚCLEOS (sempre que etapa for boas-vindas)
    if (etapaId === 'boas-vindas') {
      const menuNucleos = await this.resolverMenuNucleos(opcoesMenu, mensagem);
      if (menuNucleos) {
        mensagem = menuNucleos.mensagem;
        opcoesMenu = menuNucleos.opcoes;
      }
    }

    if (etapaId === 'escolha-departamento') {
      const menuDepartamentos = await this.resolverMenuDepartamentos();
      if (menuDepartamentos?.autoAvancar) {
        return {
          resposta: { mensagem },
          autoAvancar: true,
          proximaEtapaId: menuDepartamentos.proximaEtapaId,
        };
      }

      if (menuDepartamentos && 'mensagem' in menuDepartamentos && 'opcoes' in menuDepartamentos) {
        mensagem = menuDepartamentos.mensagem;
        opcoesMenu = menuDepartamentos.opcoes;
      }
    }

    const resposta: RespostaBot = {
      mensagem,
      etapaAtual: etapaId,
      sessaoId: sessao.id,
    };

    if (opcoesMenu && opcoesMenu.length > 0) {
      resposta.opcoes = opcoesMenu;
      resposta.mensagem = this.aplicarPreferenciaInterativa(resposta, mensagem, opcoesMenu);
    }

    const aguardArResposta = etapa?.aguardarResposta;
    const proximaEtapa = etapa?.proximaEtapa;

    if (aguardArResposta === false && proximaEtapa) {
      this.registrarHistoricoAutoAvanco();
      return {
        resposta,
        autoAvancar: true,
        proximaEtapaId: proximaEtapa,
      };
    }

    return { resposta };
  }

  private async resolverMenuNucleos(
    opcoesExistentes: BotOption[],
    mensagemAtual: string,
  ): Promise<{ mensagem: string; opcoes: BotOption[] } | null> {
    const etapaPossuiMenuEstatico = Array.isArray(opcoesExistentes) && opcoesExistentes.length > 0;
    const fluxoConfig: any = this.config.fluxo?.estrutura || {};
    const etapaConfig = this.config.fluxo?.estrutura?.etapas?.[this.config.sessao.etapaAtual] as
      | Record<string, any>
      | undefined;

    // 🎯 PRIORIDADE: Se nucleosMenu está definido, usar menu dinâmico filtrado
    const nucleosMenuSelecionados = etapaConfig?.nucleosMenu;
    const temNucleosMenuSelecionados =
      Array.isArray(nucleosMenuSelecionados) && nucleosMenuSelecionados.length > 0;

    // Flag de menu dinâmico (compatibilidade com versões anteriores)
    const flagMenuDinamico = Boolean(
      etapaConfig?.usarNucleosDinamicos ||
      etapaConfig?.config?.usarNucleosDinamicos ||
      fluxoConfig?.usarNucleosDinamicos ||
      fluxoConfig?.config?.usarNucleosDinamicos,
    );

    const deveUsarMenuDinamico =
      temNucleosMenuSelecionados || flagMenuDinamico || !etapaPossuiMenuEstatico;

    if (!deveUsarMenuDinamico) {
      return null;
    }

    // Buscar núcleos disponíveis
    const todosNucleos = await this.config.helpers.buscarNucleosParaBot(this.config.sessao);

    if (!todosNucleos || todosNucleos.length === 0) {
      this.logger.warn('[FLOW ENGINE] Nenhum núcleo visível encontrado para menu dinâmico');
      return null;
    }

    // 🎯 FILTRAR núcleos se nucleosMenu está definido
    let nucleosVisiveis = todosNucleos;

    if (temNucleosMenuSelecionados) {
      this.logger.log(
        `🎯 [FLOW ENGINE] Filtrando núcleos: ${nucleosMenuSelecionados.length} selecionados`,
      );

      nucleosVisiveis = todosNucleos.filter((nucleo) =>
        nucleosMenuSelecionados.includes(nucleo.id),
      );

      this.logger.log(
        `✅ [FLOW ENGINE] Núcleos filtrados: ${nucleosVisiveis.length} de ${todosNucleos.length}`,
      );

      if (nucleosVisiveis.length === 0) {
        this.logger.warn('[FLOW ENGINE] ⚠️ Nenhum núcleo encontrado após filtro nucleosMenu');
        return null;
      }
    }

    const opcoes = criarOpcoesNucleos(this.config.sessao, nucleosVisiveis);

    // 🔄 Adicionar opção "Continuar atendimento anterior" se houver último ticket
    const ultimoDepartamentoNome = this.config.sessao.contexto?.__ultimoDepartamentoNome;
    const ultimoTicketId = this.config.sessao.contexto?.__ultimoTicketId;

    if (ultimoDepartamentoNome && ultimoTicketId) {
      this.logger.log(
        `🔄 Adicionando opção de continuar no departamento: ${ultimoDepartamentoNome}`,
      );

      // Adicionar opção "Continuar" no início
      opcoes.unshift({
        numero: '0',
        valor: '0',
        texto: `Continuar em ${ultimoDepartamentoNome}`,
        acao: 'transferir_nucleo',
        proximaEtapa: 'transferir_atendimento',
        departamentoId: this.config.sessao.contexto?.__ultimoDepartamentoId,
      } as any);
    }

    // 🆕 QUICK WIN: Adicionar botão "Não entendi" para falar com humano
    opcoes.push({
      numero: 'ajuda',
      valor: 'ajuda',
      texto: '❓ Não entendi essas opções',
      descricao: 'Falar com um atendente humano',
      acao: 'transferir_nucleo',
      proximaEtapa: 'transferir_atendimento',
      nucleoId: this.config.sessao.contexto?.__nucleoGeralId || null,
    } as any);

    const suportaBotoesInterativos = this.sessaoSuportaBotoesInterativos();
    const deveIncluirFallbackTexto = !suportaBotoesInterativos || opcoes.length > 3;

    if (!deveIncluirFallbackTexto) {
      const mensagemComCancelar = mensagemAtual.includes('Digite SAIR')
        ? mensagemAtual
        : `${mensagemAtual}\n\n❌ Digite SAIR para cancelar`;

      return {
        mensagem: mensagemComCancelar,
        opcoes,
      };
    }

    const linhasMenu: string[] = [];

    if (ultimoDepartamentoNome && ultimoTicketId) {
      linhasMenu.push(`🔄 0️⃣ Continuar atendimento em ${ultimoDepartamentoNome}`);
      linhasMenu.push('');
    }

    const nucleosLinhas = nucleosVisiveis.map((nucleo, index) => {
      const numero = index + 1;
      const emoji = obterEmojiPorNome(nucleo.nome);
      return `${emoji} ${numero}️⃣ ${nucleo.nome}`;
    });

    linhasMenu.push(...nucleosLinhas);
    linhasMenu.push('');
    linhasMenu.push('❌ Digite SAIR para cancelar');

    const linhaEscolha = 'Escolha uma das opções abaixo para continuar:';
    const linhaCancelar = '❌ Digite SAIR para cancelar';

    let novaMensagem = mensagemAtual;

    if (mensagemAtual.includes(linhaEscolha) && mensagemAtual.includes(linhaCancelar)) {
      const indiceInicio = mensagemAtual.indexOf(linhaEscolha) + linhaEscolha.length;
      novaMensagem = `${mensagemAtual.substring(0, indiceInicio)}\n\n${linhasMenu.join('\n')}`;
    } else {
      novaMensagem = `${mensagemAtual}\n\n${linhasMenu.join('\n')}`;
    }

    return {
      mensagem: novaMensagem,
      opcoes,
    };
  }

  private async resolverMenuDepartamentos(): Promise<
    | { mensagem: string; opcoes: BotOption[]; autoAvancar?: false }
    | { autoAvancar: true; proximaEtapaId: string }
    | null
  > {
    const departamentos = this.config.sessao.contexto?.__departamentosDisponiveis || [];
    const nucleoId = this.config.sessao.contexto?.destinoNucleoId;
    const temAtendentesNoNucleo = this.config.sessao.contexto?.__nucleoTemAtendentes;

    // 🎯 Cenário 1: Núcleo SEM departamentos, mas COM atendentes diretos
    if ((!Array.isArray(departamentos) || departamentos.length === 0) && temAtendentesNoNucleo) {
      this.logger.log(
        '[FLOW ENGINE] 🎯 Núcleo sem departamentos, mas com atendentes diretos. Transferindo...',
      );

      // Salva contexto para transferência direta ao núcleo
      this.config.sessao.contexto = {
        ...this.config.sessao.contexto,
        __transferirParaNucleoSemDepartamento: true,
      };

      return {
        autoAvancar: true,
        proximaEtapaId: 'coleta-nome', // Vai coletar dados e transferir direto
      };
    }

    // 🎯 Cenário 2: Núcleo SEM departamentos e SEM atendentes
    if (!Array.isArray(departamentos) || departamentos.length === 0) {
      this.logger.warn('[FLOW ENGINE] ⚠️ Núcleo sem departamentos e sem atendentes. Avançando...');
      return {
        autoAvancar: true,
        proximaEtapaId: 'coleta-nome',
      };
    }

    const etapaConfig = this.config.fluxo?.estrutura?.etapas?.['escolha-departamento'] as
      | Record<string, any>
      | undefined;

    let proximaEtapaDepartamento: string =
      etapaConfig?.proximaEtapaDepartamento ??
      etapaConfig?.metadata?.proximaEtapaDepartamento ??
      this.config.sessao.contexto?.__proximaEtapaDepartamento ??
      'transferir-atendimento';

    if (
      typeof proximaEtapaDepartamento !== 'string' ||
      proximaEtapaDepartamento.trim().length === 0
    ) {
      proximaEtapaDepartamento = 'transferir-atendimento';
    } else {
      proximaEtapaDepartamento = proximaEtapaDepartamento.trim();
    }

    if (
      proximaEtapaDepartamento !== 'transferir-atendimento' &&
      !this.config.fluxo?.estrutura?.etapas?.[proximaEtapaDepartamento]
    ) {
      this.logger.warn(
        `⚠️ [FLOW ENGINE] Etapa "${proximaEtapaDepartamento}" não encontrada. Usando "transferir-atendimento" como fallback.`,
      );
      proximaEtapaDepartamento = 'transferir-atendimento';
    }

    if (this.config.sessao.contexto?.__proximaEtapaDepartamento !== proximaEtapaDepartamento) {
      this.config.sessao.contexto = {
        ...(this.config.sessao.contexto || {}),
        __proximaEtapaDepartamento: proximaEtapaDepartamento,
      };
      this.sessionMutated = true;
    }

    const opcoes = criarOpcoesDepartamentos(
      this.config.sessao,
      departamentos,
      proximaEtapaDepartamento,
    );

    const nucleoNome = this.config.sessao.contexto?.nucleoNome || 'setor';

    // Usar mensagem do fluxo se definida, com substituição de variáveis
    let mensagemBase =
      etapaConfig?.mensagem ||
      `🏢 *${nucleoNome}*\n\nAgora escolha o *departamento* específico:\n\n_💡 Dica: Escolha a área que melhor atende sua necessidade_`;

    // Substituir variável {{nucleoNome}} na mensagem
    mensagemBase = mensagemBase.replace(/\{\{nucleoNome\}\}/g, nucleoNome);

    // Se suporta botões interativos, retornar apenas a mensagem (sem lista numerada)
    const suportaBotoesInterativos = this.sessaoSuportaBotoesInterativos();

    if (suportaBotoesInterativos) {
      this.logger.debug(
        `📱 [DEPARTAMENTOS] Usando botões interativos (${opcoes.length} departamentos)`,
      );
      return {
        mensagem: mensagemBase,
        opcoes,
      };
    }

    // Fallback: WhatsApp Web ou canal sem suporte a botões - adicionar lista numerada
    this.logger.debug(`📝 [DEPARTAMENTOS] Usando texto formatado (${opcoes.length} departamentos)`);
    const linhasDept = departamentos.map((dept: any, index: number) => {
      const numero = index + 1;
      return `${numero}. ${dept.nome}`;
    });

    const mensagemComLista = [
      mensagemBase,
      '',
      ...linhasDept,
      '',
      '❌ Digite SAIR para cancelar',
    ].join('\n');

    return {
      mensagem: mensagemComLista,
      opcoes,
    };
  }

  private substituirVariaveisNaMensagem(base: string, sessao: SessaoTriagem): string {
    let mensagem = base;

    Object.entries(sessao.contexto || {}).forEach(([chave, valor]) => {
      if (valor === null || typeof valor === 'undefined') {
        return;
      }

      // 🔧 Suporta tanto {{variavel}} (Handlebars) quanto {variavel}
      const regexHandlebars = new RegExp(`\\{\\{${chave}\\}\\}`, 'g'); // {{var}}
      const regexSimples = new RegExp(`\\{${chave}\\}`, 'g'); // {var}

      mensagem = mensagem.replace(regexHandlebars, String(valor));
      mensagem = mensagem.replace(regexSimples, String(valor));
    });

    return mensagem;
  }

  private aplicarPreferenciaInterativa(
    resposta: RespostaBot,
    mensagem: string,
    opcoes: BotOption[],
  ): string {
    // ✅ Botões reply (até 3 opções) - FORMATO OFICIAL WhatsApp Business API
    if (opcoes.length <= 3) {
      resposta.usarBotoes = true;
      resposta.tipoBotao = 'reply';
      this.logger.debug(`📱 Usando reply buttons (${opcoes.length} opções)`);
      return mensagem;
    }

    // ✅ Menu de lista (4 a 10 opções)
    if (opcoes.length <= 10) {
      resposta.usarBotoes = true;
      resposta.tipoBotao = 'list';
      this.logger.debug(`📋 Usando list menu (${opcoes.length} opções)`);
      return mensagem;
    }

    // ❌ Muitas opções - fallback para texto
    resposta.usarBotoes = false;
    this.logger.debug(`📝 Usando texto formatado (${opcoes.length} opções - limite excedido)`);
    return `${mensagem}\n\n${formatarOpcoes(opcoes)}`;
  }

  private sessaoSuportaBotoesInterativos(): boolean {
    const canal = (this.config.sessao?.canal || '').toLowerCase();

    if (!canal) {
      return false;
    }

    const canaisComSuporte = new Set(['whatsapp', 'whatsapp_business', 'whatsapp_business_api']);

    if (canaisComSuporte.has(canal)) {
      return true;
    }

    const suporteExplicito = this.config.sessao?.contexto?.__canalSuportaBotoes;
    if (typeof suporteExplicito === 'boolean') {
      return suporteExplicito;
    }

    return false;
  }

  private registrarHistoricoAutoAvanco(): void {
    try {
      this.config.sessao.adicionarAoHistorico(this.config.sessao.etapaAtual, '[AUTO-AVANCO]');
      this.sessionMutated = true;
    } catch (erro) {
      this.logger.warn(
        `Não foi possível registrar histórico de auto avanço: ${erro instanceof Error ? erro.message : String(erro)}`,
      );
    }
  }

  private avancarSessao(proximaEtapaId: string, auto = false): void {
    if (!proximaEtapaId) {
      return;
    }

    this.config.sessao.avancarParaEtapa(proximaEtapaId);
    this.sessionMutated = true;

    if (!auto) {
      return;
    }

    this.config.sessao.contexto = {
      ...(this.config.sessao.contexto || {}),
      __autoAvancoEm: new Date().toISOString(),
      __autoAvancoDestino: proximaEtapaId,
    };
  }

  private criarOpcoesConfirmacaoPadrao(): BotOption[] {
    return [
      {
        valor: 'SIM',
        texto: 'Sim, está certo',
        aliases: ['sim', 'confirmar', 'confirmo', 'ok', '1'],
      },
      {
        valor: 'NAO',
        texto: 'Corrigir dados',
        aliases: ['nao', 'não', 'corrigir', 'alterar', '0'],
      },
    ];
  }

  /**
   * 🔀 Processa etapa condicional
   * Avalia a condição e decide automaticamente qual próxima etapa seguir
   */
  private processarEtapaCondicional(etapa: Record<string, any>): StepBuildResult {
    const { condicao, acaoSeVerdadeiro, acaoSeFalso, mensagem } = etapa;

    if (!condicao) {
      throw new BadRequestException('Etapa condicional sem campo "condicao" definido');
    }

    const { variavel, operador, valor: valorEsperado } = condicao;

    if (!variavel) {
      throw new BadRequestException('Condição sem campo "variavel" definido');
    }

    // Buscar valor da variável no contexto da sessão
    const valorAtual = this.config.sessao.contexto?.[variavel];

    this.logger.log(
      `🔍 [CONDICIONAL] Variável: ${variavel}, Operador: ${operador}, Esperado: ${valorEsperado}, Atual: ${valorAtual}`,
    );

    // Avaliar condição
    let condicaoVerdadeira = false;

    switch (operador) {
      case 'igual':
      case '==':
      case '===':
        condicaoVerdadeira = valorAtual === valorEsperado;
        break;

      case 'diferente':
      case '!=':
      case '!==':
        condicaoVerdadeira = valorAtual !== valorEsperado;
        break;

      case 'maior':
      case '>':
        condicaoVerdadeira = valorAtual > valorEsperado;
        break;

      case 'menor':
      case '<':
        condicaoVerdadeira = valorAtual < valorEsperado;
        break;

      case 'existe':
        condicaoVerdadeira = valorAtual !== undefined && valorAtual !== null && valorAtual !== '';
        break;

      case 'nao_existe':
        condicaoVerdadeira = valorAtual === undefined || valorAtual === null || valorAtual === '';
        break;

      default:
        this.logger.warn(`⚠️ Operador desconhecido: ${operador}, tratando como 'igual'`);
        condicaoVerdadeira = valorAtual === valorEsperado;
    }

    const proximaEtapaId = condicaoVerdadeira ? acaoSeVerdadeiro : acaoSeFalso;

    this.logger.log(
      `✅ [CONDICIONAL] Resultado: ${condicaoVerdadeira ? 'VERDADEIRO' : 'FALSO'} → Próxima etapa: ${proximaEtapaId}`,
    );

    if (!proximaEtapaId) {
      throw new BadRequestException(
        `Etapa condicional sem ação definida para resultado ${condicaoVerdadeira ? 'verdadeiro' : 'falso'}`,
      );
    }

    // Retornar resposta com auto-avanço
    return {
      resposta: {
        mensagem: mensagem || '🔍 Processando...',
        etapaAtual: this.config.sessao.etapaAtual,
        sessaoId: this.config.sessao.id,
      },
      autoAvancar: true,
      proximaEtapaId,
    };
  }

  /**
   * Processa etapa de transferência de atendimento
   * Marca sessão para transferência e mostra posição na fila
   */
  private async processarTransferenciaAtendimento(etapa: any): Promise<StepBuildResult> {
    const sessao = this.config.sessao;
    const departamentoId = sessao.contexto?.destinoDepartamentoId;
    const departamentoNome = sessao.contexto?.departamentoNome || 'atendimento';
    const nucleoId = sessao.contexto?.destinoNucleoId;
    const nucleoNome = sessao.contexto?.nucleoNome || 'setor';

    this.logger.log(
      `🎯 [TRANSFERÊNCIA] Iniciando transferência para departamento: ${departamentoNome}`,
    );

    if (!departamentoId) {
      throw new BadRequestException('Departamento não informado para transferência');
    }

    // ✅ MENSAGEM FIXA E SIMPLES - Ignorar mensagem do banco que pode ter texto redundante
    // As mensagens progressivas detalhadas virão depois na finalizarTriagem()
    const mensagemFinal = `⏳ *Encaminhando você para ${departamentoNome}...*\n\n_Aguarde um momento_`;

    // Preparar resumo para salvar no contexto
    const resumoAtendimento = (sessao.contexto?.resumoAtendimento || '').toString().trim();
    const resumoFallback =
      resumoAtendimento.length > 0 ? resumoAtendimento : 'Detalhes não informados';

    this.logger.log(`📋 [TRANSFERÊNCIA] Sessão marcada para transferência`);

    // Marcar sessão para transferência (triagem-bot.service processará)
    sessao.contexto = {
      ...sessao.contexto,
      __aguardandoTransferencia: true,
      __finalizarAposEnviar: true, // ✅ NOVA FLAG: Finalizar automaticamente após enviar mensagem
      __departamentoIdDestino: departamentoId,
      __departamentoNome: departamentoNome,
      __nucleoIdDestino: nucleoId,
      __nucleoNome: nucleoNome,
      __transferidoEm: new Date().toISOString(),
      __resumoAtendimentoFinal: resumoFallback,
    };

    this.sessionMutated = true;

    // Retornar mensagem (triagem finaliza aqui)
    return {
      resposta: {
        mensagem: mensagemFinal,
        etapaAtual: sessao.etapaAtual,
        sessaoId: sessao.id,
      } as any,
      autoAvancar: false,
    };
  }
}
