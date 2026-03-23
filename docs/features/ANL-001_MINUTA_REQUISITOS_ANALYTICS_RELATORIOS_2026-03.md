# ANL-001 - Minuta de Requisitos para Analytics e Relatorios (2026-03)

Status: Minuta inicial para consolidacao
Origem: consolidacao das promessas de dashboard, metricas e analytics distribuidas no produto
Data: 2026-03
Escopo: Analytics / relatorios / dashboards gerenciais

## 1. Objetivo

Consolidar uma minuta-base para o modulo de Analytics/Relatorios do Conect360, separando requisitos transversais de dashboards do produto das regras especificas ja cobertas em CRM, Financeiro e Guardian.

## 2. Principios

- analytics e um modulo transversal, nao apenas uma tela isolada;
- metricas devem respeitar tenant e escopo do modulo de origem;
- dashboards operacionais e gerenciais nao podem contradizer as fontes de verdade dos dominios transacionais;
- relatorios precisam ser rastreaveis, filtraveis e auditaveis quando afetarem decisao comercial ou financeira.

## 3. Capacidades funcionais minimas esperadas

### 3.1 Dashboards consolidados

O sistema deve suportar dashboards com indicadores-chave pelo menos para:

- comercial;
- atendimento;
- financeiro;
- administracao/governanca quando aplicavel.

### 3.2 Filtros e recortes

O sistema deve permitir recortes por:

- periodo;
- tenant/empresa;
- responsavel, equipe ou pipeline quando fizer sentido;
- status ou lifecycle do dominio de origem.

### 3.3 Consistencia de metricas

Regras:

- contagens e valores exibidos no dashboard nao devem contradizer a listagem transacional correspondente;
- exclusoes, arquivamentos e lifecycle precisam ser respeitados nas agregacoes;
- divergencia conhecida entre dashboard e origem deve ser tratada como bug/alerta, nao como comportamento aceitavel indefinido.

### 3.4 Exportacao e relatórios

O modulo deve prever pelo menos:

- exportacao de relatórios em formato utilizavel externamente;
- identificacao clara do criterio de filtro aplicado;
- rastreabilidade da origem dos dados quando exigido pelo negocio.

## 4. Frentes ja parcialmente cobertas no repositorio

1. analytics comercial ligado ao lifecycle de oportunidades;
2. dashboard financeiro e alertas operacionais;
3. indicadores administrativos/guardian.

## 5. Lacunas que esta minuta tenta organizar

1. ausencia de contrato unico do modulo Analytics/Relatorios;
2. dependencia excessiva de backlog setorial para entender metricas globais;
3. falta de fronteira clara entre dashboard operacional, dashboard executivo e exportacao gerencial.

## 6. Decisoes que ainda precisam de fechamento

1. quais dashboards compoem oficialmente o modulo Analytics do produto;
2. quais exports/relatorios sao obrigatorios no baseline;
3. como versionar definicoes de metricas compartilhadas;
4. como tratar snapshot historico versus dado em tempo real.

## 7. Proximos documentos necessarios

- contrato funcional v1 do modulo Analytics/Relatorios;
- backlog tecnico das agregacoes compartilhadas;
- checklist de QA para consistencia dashboard x origem.

Resultado: Analytics/Relatorios deixa de depender apenas de referencias dispersas e passa a ter minuta-base para consolidacao futura.
