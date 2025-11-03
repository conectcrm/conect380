import { SessaoTriagem } from '../entities/sessao-triagem.entity';
import { HorarioFuncionamento } from '../entities/nucleo-atendimento.entity';

/**
 * Representa uma opção de resposta exibida ao usuário durante a triagem.
 * Mantém estrutura flexível para suportar metadados adicionais definidos no fluxo.
 */
export interface BotOption extends Record<string, any> {
  valor: string;
  texto: string;
  descricao?: string;
}

export interface DepartamentoBotOption {
  id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  [key: string]: any;
}

export interface NucleoBotOption {
  id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  mensagemBoasVindas?: string;
  mensagemForaHorario?: string;
  horarioFuncionamento?: HorarioFuncionamento | null;
  timezone?: string | null;
  departamentos?: DepartamentoBotOption[];
  atendentesIds?: string[]; // 🆕 IDs dos atendentes vinculados ao núcleo (quando não tem departamentos)
  [key: string]: any;
}

export type MotivoNucleoIndisponivel =
  | 'fora_horario'
  | 'sem_departamentos'
  | 'capacidade_maxima'
  | 'inativo'
  | 'outro';

export interface NucleoIndisponivel {
  id: string;
  nome: string;
  motivo: MotivoNucleoIndisponivel;
  mensagemForaHorario?: string | null;
  horarioFuncionamento?: HorarioFuncionamento | null;
  timezone?: string | null;
  metadata?: Record<string, any>;
}

export interface NucleosParaBotResultado {
  disponiveis: NucleoBotOption[];
  foraDoHorario?: NucleoIndisponivel[];
  indisponiveis?: NucleoIndisponivel[];
}

export type BotInteractiveType = 'reply' | 'list';

export interface RespostaBot {
  mensagem: string;
  sessaoId?: string;
  etapaAtual?: string;
  opcoes?: BotOption[];
  finalizado?: boolean;
  nucleoId?: string;
  atendenteId?: string;
  ticketId?: string;
  usarBotoes?: boolean;
  tipoBotao?: BotInteractiveType;
  autoAvanco?: boolean;
}

export interface DadosMensagemWebhook {
  telefone?: string;
  texto?: string;
  nome?: string;
  messageId?: string;
  canalId?: string;
  tipoMensagem?: string;
  rawMessage?: Record<string, any>;
}

export interface ResultadoProcessamentoWebhook {
  ignorado?: boolean;
  motivo?: string;
  novaSessao?: boolean;
  sessaoId?: string;
  fluxoId?: string;
  resposta?: RespostaBot;
  dadosMensagem?: DadosMensagemWebhook;
}

export interface FlowEngineContext {
  sessao: SessaoTriagem;
  novaMensagem?: string;
}