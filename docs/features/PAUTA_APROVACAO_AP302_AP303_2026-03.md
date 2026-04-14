# Pauta de aprovacao - AP-302/AP-303 (2026-03)

## 1. Objetivo

Fechar validacao formal de requisitos e sequenciamento de sprint para AP-302 (exportacao contabil/fiscal) e AP-303 (alertas operacionais).

## 2. Participantes obrigatorios

1. Produto
2. Financeiro
3. Contabil
4. Tech Lead
5. QA

## 3. Materiais de referencia

1. `docs/features/AP302_AP303_MINUTA_REQUISITOS_2026-03.md`
2. `docs/features/AP302_AP303_BACKLOG_TECNICO_2026-03.md`
3. `docs/features/PLANO_EXECUCAO_CONTAS_PAGAR_2026.md`

## 4. Decisoes pendentes (gate de aprovacao)

### D1 - Layout final de exportacao AP-302

- Opcao A: manter layout tecnico atual (colunas base definidas na minuta).
- Opcao B: incluir colunas contabil/fiscal adicionais (conta contabil, historico padrao, natureza).
- Decisao: Opcao A aprovada para ciclo atual; colunas adicionais entram como melhoria incremental.
- Responsavel: Responsavel unico do projeto (autoaprovacao formal)
- Data: 2026-02-28

### D2 - Threshold de criticidade AP-303

- Opcao A: manter janela de alerta em 3 dias para vencimento.
- Opcao B: ajustar para 5 dias.
- Opcao C: ajustar para 7 dias.
- Decisao: Opcao A aprovada (janela de 3 dias mantida).
- Responsavel: Responsavel unico do projeto (autoaprovacao formal)
- Data: 2026-02-28

### D3 - Sequenciamento de sprint

- Opcao A: AP-302 e AP-303 em paralelo.
- Opcao B: AP-302 primeiro, AP-303 em seguida.
- Opcao C: AP-303 primeiro, AP-302 em seguida.
- Decisao: Opcao A aprovada (AP-302/AP-303 em paralelo para sustentacao e ajustes finais).
- Responsavel: Responsavel unico do projeto (autoaprovacao formal)
- Data: 2026-02-28

### D4 - Capacidade e compromisso de entrega

- Capacidade de pontos aprovada: 8 pontos para ajustes incrementais e hardening.
- Data alvo de inicio: 2026-03-01
- Data alvo de fechamento: 2026-03-07

### D5 - Criterio de aceite de homologacao

- Confirmar se evidencia automatizada atual e suficiente para GO tecnico.
- Definir requisitos adicionais para GO de negocio (se houver).
- Decisao: evidencia automatizada atual suficiente para GO tecnico e GO de negocio no modelo de responsavel unico.
- Responsavel: Responsavel unico do projeto (autoaprovacao formal)
- Data: 2026-02-28

## 5. Resultado esperado da reuniao

1. Todas as decisoes D1..D5 preenchidas.
2. Sequenciamento da proxima sprint aprovado.
3. Plano principal atualizado com status "aprovado" para AP-302/AP-303.

Status atual: pauta encerrada com autoaprovacao formal do responsavel unico em 2026-02-28.
