import { EstagioOportunidade } from './oportunidade.entity';
import {
  getAllowedNextOportunidadeStages,
  isOportunidadeStageTransitionAllowed,
  isOportunidadeTerminalStage,
} from './oportunidades.service';

describe('Oportunidades stage rules', () => {
  it('permite transicoes validas do pipeline comercial (sequenciais)', () => {
    expect(
      isOportunidadeStageTransitionAllowed(
        EstagioOportunidade.LEADS,
        EstagioOportunidade.QUALIFICACAO,
      ),
    ).toBe(true);

    expect(
      isOportunidadeStageTransitionAllowed(
        EstagioOportunidade.QUALIFICACAO,
        EstagioOportunidade.PROPOSTA,
      ),
    ).toBe(true);

    expect(
      isOportunidadeStageTransitionAllowed(
        EstagioOportunidade.NEGOCIACAO,
        EstagioOportunidade.FECHAMENTO,
      ),
    ).toBe(true);

    expect(
      isOportunidadeStageTransitionAllowed(
        EstagioOportunidade.FECHAMENTO,
        EstagioOportunidade.GANHO,
      ),
    ).toBe(true);
  });

  it('bloqueia pulos de etapa e reabertura de estagios terminais', () => {
    expect(
      isOportunidadeStageTransitionAllowed(EstagioOportunidade.LEADS, EstagioOportunidade.GANHO),
    ).toBe(false);

    expect(
      isOportunidadeStageTransitionAllowed(
        EstagioOportunidade.QUALIFICACAO,
        EstagioOportunidade.GANHO,
      ),
    ).toBe(false);

    expect(
      isOportunidadeStageTransitionAllowed(
        EstagioOportunidade.PROPOSTA,
        EstagioOportunidade.FECHAMENTO,
      ),
    ).toBe(false);

    expect(
      isOportunidadeStageTransitionAllowed(
        EstagioOportunidade.NEGOCIACAO,
        EstagioOportunidade.GANHO,
      ),
    ).toBe(false);

    expect(
      isOportunidadeStageTransitionAllowed(
        EstagioOportunidade.GANHO,
        EstagioOportunidade.NEGOCIACAO,
      ),
    ).toBe(false);

    expect(
      isOportunidadeStageTransitionAllowed(
        EstagioOportunidade.PERDIDO,
        EstagioOportunidade.QUALIFICACAO,
      ),
    ).toBe(false);
  });

  it('aceita aliases legados/normalizados de estagio', () => {
    expect(isOportunidadeStageTransitionAllowed('qualificado', 'proposta')).toBe(true);
    expect(isOportunidadeStageTransitionAllowed('fechamento', 'won')).toBe(true);
    expect(isOportunidadeStageTransitionAllowed('negociacao', 'won')).toBe(false);
    expect(isOportunidadeStageTransitionAllowed('lead', 'won')).toBe(false);
  });

  it('expoe lista de proximos estagios permitidos', () => {
    expect(getAllowedNextOportunidadeStages(EstagioOportunidade.LEADS)).toEqual([
      EstagioOportunidade.QUALIFICACAO,
      EstagioOportunidade.PERDIDO,
    ]);
    expect(getAllowedNextOportunidadeStages(EstagioOportunidade.NEGOCIACAO)).toEqual([
      EstagioOportunidade.PROPOSTA,
      EstagioOportunidade.FECHAMENTO,
      EstagioOportunidade.PERDIDO,
    ]);
    expect(getAllowedNextOportunidadeStages(EstagioOportunidade.GANHO)).toHaveLength(0);
  });

  it('identifica estagios terminais', () => {
    expect(isOportunidadeTerminalStage('won')).toBe(true);
    expect(isOportunidadeTerminalStage('perdido')).toBe(true);
    expect(isOportunidadeTerminalStage(EstagioOportunidade.PROPOSTA)).toBe(false);
  });
});
