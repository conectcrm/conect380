
# Documentacao do Conect360

## Objetivo

Este arquivo explica como navegar na documentacao do projeto sem confundir:

1. visao oficial do produto;
2. requisitos vigentes;
3. documentacao de implementacao;
4. documentos historicos ou operacionais.

## Leia primeiro

Para entender o produto e o estado atual da documentacao, comece por:

1. `../README.md`
2. `../VISAO_SISTEMA_2025.md`
3. `./INDICE_DOCUMENTACAO.md`
4. `./handbook/MATRIZ_COBERTURA_REQUISITOS_2026-03.md`
5. `./handbook/PLANO_SANEAMENTO_DOCUMENTACAO_2026-03.md`

## Fonte de verdade por tipo de documento

### Requisitos vigentes

Use primeiro:

1. `docs/features/`
2. `docs/handbook/MATRIZ_COBERTURA_REQUISITOS_2026-03.md`

Tipos esperados nessa area:

1. contrato funcional;
2. minuta de requisitos;
3. backlog tecnico;
4. checklist de QA, piloto ou sign-off.

### Governanca e contexto

Use:

1. `docs/handbook/`

Arquivos principais:

1. `INDICE_DOCUMENTACAO.md`
2. `AUDITORIA_DOCUMENTACAO_ATUAL.md`
3. `MAPA_MODULOS_TECNICOS.md`
4. `MATRIZ_COBERTURA_REQUISITOS_2026-03.md`
5. `PLANO_SANEAMENTO_DOCUMENTACAO_2026-03.md`

### Implementacao

Use com cautela:

1. `docs/implementation/`

Esses arquivos explicam como algo foi implementado, mas nao substituem contrato funcional ou backlog vigente.

### Operacao e validacao

Use:

1. `docs/runbooks/`
2. `docs/features/evidencias/`

Esses arquivos ajudam em rollout, homologacao e suporte, mas tambem nao substituem requisito funcional.

### Historico

Use apenas quando precisar de contexto antigo:

1. `docs/archive/`

## Estrutura resumida

```text
docs/
├── features/         # requisitos, backlog, contratos, checklists
├── handbook/         # governanca documental e contexto
├── implementation/   # documentacao de implementacao
├── runbooks/         # procedimentos operacionais
├── archive/          # historico e legado
├── changelog/        # historico de alteracoes
├── guides/           # guias auxiliares
└── debug/            # diagnosticos pontuais
```

## Regra pratica para novos documentos

Antes de criar um novo arquivo, decida primeiro o papel dele:

1. se define escopo, aceite ou comportamento esperado, ele deve ir para `docs/features/`;
2. se explica navegacao, criterio ou governanca, ele deve ir para `docs/handbook/`;
3. se descreve uma entrega pronta, ele deve ir para `docs/implementation/`;
4. se descreve operacao, teste manual ou resposta a incidente, ele deve ir para `docs/runbooks/`.

## Alertas importantes

1. Nao use `docs/archive/` como base primaria para novas implementacoes.
2. Nao use `docs/implementation/` como substituto de requisito funcional.
3. Nao use indices de subsistema como se fossem indice principal do produto.

## Proximo passo sugerido

Se a duvida for "qual documento manda neste modulo?", consulte primeiro:

1. `./handbook/MATRIZ_COBERTURA_REQUISITOS_2026-03.md`
2. `./handbook/MAPA_MODULOS_TECNICOS.md`
3. `./features/` correspondente ao dominio.
