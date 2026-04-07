import { EstagioOportunidade, LifecycleStatusOportunidade } from './oportunidade.entity';
import {
  canBypassOportunidadeStageTransitionByRole,
  getDefaultOportunidadeProbabilityByStage,
  getAllowedNextOportunidadeLifecycleStatuses,
  getAllowedNextOportunidadeStages,
  isOportunidadeForwardSkipTransition,
  resolveOportunidadeEngagementSignal,
  isOportunidadeLifecycleTransitionAllowed,
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

  it('identifica quando a transicao e um pulo forward no pipeline', () => {
    expect(
      isOportunidadeForwardSkipTransition(
        EstagioOportunidade.LEADS,
        EstagioOportunidade.NEGOCIACAO,
      ),
    ).toBe(true);
    expect(
      isOportunidadeForwardSkipTransition(
        EstagioOportunidade.QUALIFICACAO,
        EstagioOportunidade.PROPOSTA,
      ),
    ).toBe(false);
    expect(
      isOportunidadeForwardSkipTransition(
        EstagioOportunidade.FECHAMENTO,
        EstagioOportunidade.GANHO,
      ),
    ).toBe(false);
    expect(
      isOportunidadeForwardSkipTransition(
        EstagioOportunidade.PROPOSTA,
        EstagioOportunidade.QUALIFICACAO,
      ),
    ).toBe(false);
  });

  it('define papeis que podem bypass de transicao de etapa', () => {
    expect(canBypassOportunidadeStageTransitionByRole('superadmin')).toBe(true);
    expect(canBypassOportunidadeStageTransitionByRole('admin')).toBe(true);
    expect(canBypassOportunidadeStageTransitionByRole('gerente')).toBe(true);
    expect(canBypassOportunidadeStageTransitionByRole('manager')).toBe(true);
    expect(canBypassOportunidadeStageTransitionByRole('vendedor')).toBe(false);
    expect(canBypassOportunidadeStageTransitionByRole(undefined)).toBe(false);
  });

  it('retorna probabilidade padrao por estagio', () => {
    expect(getDefaultOportunidadeProbabilityByStage(EstagioOportunidade.LEADS)).toBe(20);
    expect(getDefaultOportunidadeProbabilityByStage(EstagioOportunidade.QUALIFICACAO)).toBe(40);
    expect(getDefaultOportunidadeProbabilityByStage(EstagioOportunidade.PROPOSTA)).toBe(60);
    expect(getDefaultOportunidadeProbabilityByStage(EstagioOportunidade.NEGOCIACAO)).toBe(80);
    expect(getDefaultOportunidadeProbabilityByStage(EstagioOportunidade.FECHAMENTO)).toBe(95);
    expect(getDefaultOportunidadeProbabilityByStage(EstagioOportunidade.GANHO)).toBe(100);
    expect(getDefaultOportunidadeProbabilityByStage(EstagioOportunidade.PERDIDO)).toBe(0);
    expect(getDefaultOportunidadeProbabilityByStage('qualificado')).toBe(40);
    expect(getDefaultOportunidadeProbabilityByStage('estagio-inexistente')).toBe(50);
  });

  it('classifica negociacao quente quando probabilidade alta e acao esta pressionando', () => {
    expect(
      resolveOportunidadeEngagementSignal({
        lifecycleStatus: LifecycleStatusOportunidade.OPEN,
        stage: EstagioOportunidade.NEGOCIACAO,
        probabilidade: 85,
        nextActionStatus: 'due_soon',
      }),
    ).toBe('hot');
  });

  it('nao marca oportunidade stale como quente', () => {
    expect(
      resolveOportunidadeEngagementSignal({
        lifecycleStatus: LifecycleStatusOportunidade.OPEN,
        stage: EstagioOportunidade.FECHAMENTO,
        probabilidade: 95,
        isStale: true,
        nextActionStatus: 'due_soon',
      }),
    ).toBe('normal');
  });

  it('marca watch quando acao esta atrasada fora da janela quente', () => {
    expect(
      resolveOportunidadeEngagementSignal({
        lifecycleStatus: LifecycleStatusOportunidade.OPEN,
        stage: EstagioOportunidade.QUALIFICACAO,
        probabilidade: 30,
        nextActionStatus: 'overdue',
      }),
    ).toBe('watch');
  });

  it('respeita limiares customizados para classificar negociacao quente', () => {
    const referenceDate = new Date('2026-04-05T10:00:00.000Z');
    const expectedCloseDate = new Date('2026-04-25T10:00:00.000Z');

    expect(
      resolveOportunidadeEngagementSignal({
        lifecycleStatus: LifecycleStatusOportunidade.OPEN,
        stage: EstagioOportunidade.NEGOCIACAO,
        probabilidade: 78,
        nextActionStatus: 'future',
        expectedCloseDate,
        referenceDate,
      }),
    ).toBe('normal');

    expect(
      resolveOportunidadeEngagementSignal({
        lifecycleStatus: LifecycleStatusOportunidade.OPEN,
        stage: EstagioOportunidade.NEGOCIACAO,
        probabilidade: 78,
        nextActionStatus: 'future',
        expectedCloseDate,
        referenceDate,
        hotMinProbability: 70,
        hotCloseWindowDays: 30,
      }),
    ).toBe('hot');
  });

  it('permite transicoes validas de lifecycle', () => {
    expect(
      isOportunidadeLifecycleTransitionAllowed(
        LifecycleStatusOportunidade.OPEN,
        LifecycleStatusOportunidade.ARCHIVED,
      ),
    ).toBe(true);

    expect(
      isOportunidadeLifecycleTransitionAllowed(
        LifecycleStatusOportunidade.ARCHIVED,
        LifecycleStatusOportunidade.OPEN,
      ),
    ).toBe(true);

    expect(
      isOportunidadeLifecycleTransitionAllowed(
        LifecycleStatusOportunidade.WON,
        LifecycleStatusOportunidade.DELETED,
      ),
    ).toBe(true);
  });

  it('bloqueia transicoes invalidas de lifecycle', () => {
    expect(
      isOportunidadeLifecycleTransitionAllowed(
        LifecycleStatusOportunidade.OPEN,
        'inexistente',
      ),
    ).toBe(false);
    expect(
      isOportunidadeLifecycleTransitionAllowed(
        'inexistente',
        LifecycleStatusOportunidade.OPEN,
      ),
    ).toBe(false);
  });

  it('expoe lista de proximos status de lifecycle permitidos', () => {
    expect(getAllowedNextOportunidadeLifecycleStatuses(LifecycleStatusOportunidade.OPEN)).toEqual([
      LifecycleStatusOportunidade.WON,
      LifecycleStatusOportunidade.LOST,
      LifecycleStatusOportunidade.ARCHIVED,
      LifecycleStatusOportunidade.DELETED,
    ]);
  });
});
