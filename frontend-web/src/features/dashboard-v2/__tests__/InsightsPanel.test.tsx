import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { DashboardV2Insight } from '../useDashboardV2';
import InsightsPanel from '../components/InsightsPanel';

const buildInsight = (overrides: Partial<DashboardV2Insight>): DashboardV2Insight => ({
  id: overrides.id || 'insight-id',
  type: overrides.type || 'info',
  title: overrides.title || 'Titulo insight',
  description: overrides.description || 'Descricao insight',
  impact: overrides.impact || 'baixo',
  action: overrides.action,
});

describe('InsightsPanel', () => {
  it('exibe estado vazio quando nao ha insights', () => {
    render(<InsightsPanel insights={[]} />);

    expect(screen.getByText(/Sem insights para o per/i)).toBeInTheDocument();
    expect(screen.getByText(/Sem leituras adicionais/i)).toBeInTheDocument();
  });

  it('renderiza os insights recebidos sem fallback estatico', () => {
    const insights: DashboardV2Insight[] = [
      buildInsight({
        id: 'financeiro-alertas-criticos',
        type: 'warning',
        title: 'Alertas operacionais criticos',
        description: '1 alerta critico ativo no financeiro.',
        impact: 'alto',
      }),
      buildInsight({
        id: 'financeiro-fila-aprovacao',
        type: 'warning',
        title: 'Fila de aprovacoes pendente',
        description: '2 contas aguardam aprovacao.',
        impact: 'medio',
      }),
      buildInsight({
        id: 'financeiro-recebimento-em-linha',
        type: 'opportunity',
        title: 'Recebimento em linha com a meta',
        description: '92% do faturado convertido em recebimento.',
        impact: 'medio',
      }),
      buildInsight({
        id: 'financeiro-conciliacao-recente',
        type: 'opportunity',
        title: 'Conciliacao com movimentacao recente',
        description: '3 importacoes de extrato no periodo.',
        impact: 'baixo',
      }),
    ];

    render(<InsightsPanel insights={insights} />);

    expect(screen.getByText('Alertas operacionais criticos')).toBeInTheDocument();
    expect(screen.getByText('Fila de aprovacoes pendente')).toBeInTheDocument();
    expect(screen.getByText('Recebimento em linha com a meta')).toBeInTheDocument();
    expect(screen.getByText('Conciliacao com movimentacao recente')).toBeInTheDocument();
    expect(screen.queryByText(/Sem insights para o per/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sem leituras adicionais/i)).not.toBeInTheDocument();
  });

  it('dispara callback ao clicar em um insight', () => {
    const insight = buildInsight({
      id: 'financeiro-alertas-criticos',
      title: 'Alertas operacionais criticos',
      type: 'warning',
      impact: 'alto',
    });
    const onInsightClick = jest.fn();

    render(<InsightsPanel insights={[insight]} onInsightClick={onInsightClick} />);

    fireEvent.click(screen.getByRole('button', { name: /Abrir insight: Alertas operacionais criticos/i }));
    expect(onInsightClick).toHaveBeenCalledWith(insight);
  });
});
