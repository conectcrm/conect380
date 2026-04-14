# CRM-001 - Contrato Oficial da Entidade Cliente (v1)

Status: Aprovado para implementacao tecnica
Origem: `BACKLOG_CLIENTES_360.md` (card CRM-001)
Data: 2026-03
Escopo: Backend `clientes` + Frontend `clientesService` e formularios

## 1. Objetivo

Definir o contrato oficial da entidade `cliente` para eliminar ambiguidade entre:
- o que e dado mestre do cliente;
- o que pertence a contato, atendimento, comercial e financeiro;
- o que pode aparecer na UI apenas como dado derivado/agregado.

Este documento e a referencia obrigatoria para CRM-002 e CRM-003.

## 2. Principios

- Multi-tenant obrigatorio: todo cliente pertence a `empresa_id`.
- Fonte unica de verdade: apenas campos abaixo podem ser persistidos na tabela `clientes`.
- Separacao de contexto: dados operacionais de atendimento, vendas e faturamento nao viram coluna em `clientes`.
- Compatibilidade controlada: aliases legados podem existir em payload, mas mapeados para campos oficiais.

## 3. Contrato Oficial - Campos Persistidos em `clientes`

### 3.1 Campos obrigatorios

- `id` (uuid, gerado pelo sistema)
- `empresa_id` (uuid, isolamento tenant)
- `nome` (string, obrigatorio)
- `email` (string, obrigatorio)
- `tipo` (`pessoa_fisica` | `pessoa_juridica`, default `pessoa_fisica`)
- `ativo` (boolean, default `true`)
- `created_at` (timestamp, gerado pelo sistema)
- `updated_at` (timestamp, gerado pelo sistema)

### 3.2 Campos opcionais

- `telefone` (string, formato E.164 recomendado)
- `documento` (string; CPF/CNPJ normalizado)
- `endereco` (string)
- `cidade` (string)
- `estado` (string de 2 caracteres)
- `cep` (string)
- `observacoes` (text)
- `avatar_url` (text, quando coluna disponivel no banco)

### 3.3 Campos derivados/autorizados em resposta (nao colunas)

- `status` (`lead` | `prospect` | `cliente` | `inativo`):
  - pode vir no payload de entrada;
  - e traduzido para estado persistivel (`ativo`) e, quando disponivel, coluna `status` legada;
  - nao define novo dado mestre fora das regras do service.
- `avatar` e `avatarUrl`:
  - aliases de `avatar_url` para compatibilidade de frontend.

## 4. Campos Fora de Escopo da Entidade Cliente

Os campos abaixo NAO fazem parte do contrato persistido de `clientes`:

- `empresa` (nome da empresa do cliente)
- `cargo`
- `site`
- `tags`
- `data_nascimento`
- `genero`
- `profissao`
- `renda`
- `origem`
- `responsavel_id`
- `valor_estimado`
- `ultimo_contato`
- `proximo_contato`

Regra: se aparecerem na UI, devem ser tratados como:
- metadado de outro modulo;
- agregacao derivada para exibicao;
- ou backlog de novo dominio/tabela especifica.

## 5. Fronteira Entre Dominios

- Cliente:
  - identificacao civil/comercial, contato basico e endereco.
- Contato:
  - pessoas de referencia associadas ao cliente (ex.: decisor, financeiro, tecnico).
- Atendimento:
  - tickets, mensagens, notas, demandas, historico operacional e SLA.
- Comercial:
  - oportunidades, propostas, pipeline, previsao de receita.
- Financeiro:
  - contratos, faturas, pagamentos, inadimplencia e cobranca.

## 6. Regras de API (Contrato de Entrada/Saida)

### 6.1 Create/Update - payload aceito

Aceitar como oficiais apenas os campos do item 3.

Campos legados aceitos temporariamente:
- `cpf_cnpj` -> mapear para `documento`.
- `avatar`/`avatarUrl` -> mapear para `avatar_url`.

Qualquer outro campo fora do contrato:
- nao deve ser persistido em `clientes`;
- nao deve ser devolvido como dado mestre persistido.

### 6.2 Response padrao

A resposta pode incluir aliases e dados agregados, desde que:
- o payload de dominio (dado mestre) mantenha os campos oficiais;
- dados agregados venham identificados como derivados de outros modulos.

## 7. Regras de Banco e Multi-Tenant

- Tabela `clientes` deve manter `empresa_id` com indice dedicado.
- RLS deve permanecer habilitado na tabela com politica por tenant.
- Nenhuma migration futura pode remover isolamento por `empresa_id`.

## 8. Impacto Direto no Backlog

- CRM-002: ajustar entity/service/controller para persistir estritamente o contrato oficial.
- CRM-003: alinhar schema/migrations e remover ambiguidades de colunas legadas.
- CRM-004+: ajustar frontend para nao prometer persistencia de campos fora do contrato.

## 9. Checklist de Aprovacao do Contrato (CRM-001)

- Campos obrigatorios definidos.
- Campos opcionais definidos.
- Campos fora de escopo definidos.
- Fronteira entre cliente/contato/atendimento/comercial documentada.
- Documento utilizavel como referencia tecnica e funcional.

Resultado: CRM-001 concluido com este documento como baseline oficial v1.
