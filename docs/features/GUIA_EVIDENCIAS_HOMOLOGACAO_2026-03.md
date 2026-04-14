# Guia de Evidencias de Homologacao - 2026-03

## 1. Objetivo

Padronizar como registrar evidencias de homologacao em `docs/features/evidencias/` para contratos, checklists e sign-offs publicados no repositório.

## 2. Quando gerar evidencia

Gerar evidencia sempre que um checklist de QA ou sign-off exigir validacao real de:

1. fluxo funcional;
2. smoke de API ou UI;
3. rollout controlado;
4. monitoramento pos-go-live;
5. validacao manual assistida.

## 3. Formato recomendado do nome do arquivo

Usar o prefixo do artefato funcional ou tecnico seguido do tipo de evidencia e timestamp.

Exemplos:

- `ATD-EMAIL-006_HOMOLOGACAO_ASSISTIDA_20260312-154500.md`
- `CRM-034_API_SMOKE_20260312-160100.md`
- `FIN-NFSE-003_VALIDACAO_MANUAL_20260312-161500.md`

## 4. Conteudo minimo de uma evidencia em Markdown

Toda evidencia em `.md` deve registrar pelo menos:

1. objetivo da execucao;
2. ambiente e contexto;
3. data e responsavel;
4. passos executados;
5. resultado observado;
6. evidencias anexas ou referencias a arquivos `.json`, `.csv` ou `.log` quando houver;
7. conclusao: GO parcial, GO ou NO-GO.

## 5. Template resumido

```md
# <PREFIXO> - Evidencia de Homologacao

## Objetivo

## Ambiente

## Data e responsavel

## Passos executados

## Resultado observado

## Artefatos anexos

## Conclusao
```

## 6. Regras de vinculacao com checklist

- o checklist deve apontar para a evidencia publicada;
- a evidencia deve citar o contrato e o checklist relacionados;
- se houver varios cenarios, pode haver mais de uma evidencia por checklist.

## 7. O que nao vale como evidencia suficiente

- print isolado sem contexto;
- comentario solto em commit ou PR;
- log bruto sem explicacao do que foi validado;
- backlog tecnico tratado como se fosse execucao homologada.

## 8. Resultado esperado

Com esse padrao, os checklists deixam de ser apenas intencao documental e passam a apontar para provas rastreaveis de execucao real.
