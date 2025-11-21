/**
 * Enums para Oportunidades - Espelho do backend
 * Caminho backend: backend/src/modules/oportunidades/oportunidade.entity.ts
 */

export enum EstagioOportunidade {
  LEADS = 'leads',
  QUALIFICACAO = 'qualification',
  PROPOSTA = 'proposal',
  NEGOCIACAO = 'negotiation',
  FECHAMENTO = 'closing',
  GANHO = 'won',
  PERDIDO = 'lost',
}

export enum PrioridadeOportunidade {
  BAIXA = 'low',
  MEDIA = 'medium',
  ALTA = 'high',
}

export enum OrigemOportunidade {
  WEBSITE = 'website',
  INDICACAO = 'indicacao',
  TELEFONE = 'telefone',
  EMAIL = 'email',
  REDES_SOCIAIS = 'redes_sociais',
  EVENTO = 'evento',
  PARCEIRO = 'parceiro',
  CAMPANHA = 'campanha',
}

export enum TipoAtividade {
  LIGACAO = 'call',
  EMAIL = 'email',
  REUNIAO = 'meeting',
  NOTA = 'note',
  TAREFA = 'task',
}
