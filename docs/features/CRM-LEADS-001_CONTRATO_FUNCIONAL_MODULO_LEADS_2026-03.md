# CRM-LEADS-001 - Contrato Funcional do Modulo de Leads (v1) (2026-03)

Status: Aprovado para baseline funcional
Origem: consolidacao do roadmap historico de Leads com evidencias atuais do backend
Data: 2026-03
Escopo: CRM / captura, qualificacao e conversao de leads

## 1. Objetivo

Definir o contrato funcional vigente do modulo de Leads com base no dominio que ja possui implementacao e validacao no backend, substituindo a leitura do roadmap historico como se fosse o estado atual.

## 2. Principios

- lead representa a entrada do funil comercial antes da oportunidade;
- lead nao substitui cliente nem oportunidade;
- o modulo deve respeitar tenant e isolamento por empresa;
- conversao de lead deve preservar rastreabilidade para oportunidade gerada;
- qualificacao pode evoluir por score, status e atribuicao operacional.

## 3. Entidade funcional `lead`

Campos minimos observados/esperados:

- `id`
- `empresa_id`
- `nome`
- `email` opcional
- `telefone` opcional
- `empresa` opcional
- `status`
- `origem` opcional
- `score` opcional
- `observacoes` opcionais
- `responsavel_id` opcional
- `oportunidade_id` opcional
- `convertido_em` opcional
- `created_at`
- `updated_at`

## 4. Estados funcionais minimos

- `novo`
- `contatado`
- `qualificado`
- `desqualificado`
- `convertido`

## 5. Operacoes obrigatorias do v1

### 5.1 Criar lead

Regras:

- lead deve nascer vinculado ao tenant correto;
- criacao deve aceitar dados basicos e contexto comercial minimo;
- o sistema pode preencher score inicial conforme regra vigente.

### 5.2 Listar e consultar leads

Regras:

- listagem deve respeitar isolamento por empresa;
- lead de outro tenant nao pode ser retornado nem por acesso direto;
- filtros operacionais por status, origem e responsavel sao desejaveis no dominio.

### 5.3 Atualizar lead

Regras:

- atualizacao deve respeitar tenant;
- status e contexto comercial podem ser alterados de forma auditavel;
- campos de qualificacao nao devem romper o historico de conversao quando o lead ja tiver sido convertido.

### 5.4 Converter lead em oportunidade

Regras:

- lead qualificado pode originar oportunidade;
- a oportunidade criada deve manter rastreabilidade para o lead;
- ao converter, o sistema deve refletir o estado `convertido` e registrar a data correspondente.

## 6. Seguranca e multi-tenant

- toda operacao deve respeitar `empresa_id`;
- acesso indevido a lead de outro tenant deve falhar como nao encontrado ou equivalente seguro;
- o modulo nao deve depender de filtros apenas de frontend para isolamento.

## 7. Evidencias atuais do baseline

1. `backend/docs/AUDITORIA_ENTITIES_MULTI_TENANCY.md`
2. `backend/docs/TESTE_E2E_MULTI_TENANCY_RESULTADOS.md`
3. modulo `backend/src/modules/leads/`

## 8. Fora de escopo deste contrato v1

- score preditivo por IA como requisito obrigatorio;
- automacao complexa de nutricao;
- captura publica multicanal completa em todas as origens prometidas;
- enriquecimento externo automatico de dados.

## 9. Criterios de aceite minimos

- criar lead no tenant correto;
- listar apenas leads da empresa autenticada;
- bloquear acesso cruzado entre tenants;
- atualizar lead existente com seguranca;
- converter lead em oportunidade com rastreabilidade.

## 10. Proximos artefatos desejaveis

- checklist de QA e sign-off do modulo de Leads;
- backlog tecnico de captura publica/importacao, se essas frentes entrarem em fase formal.

Resultado: Leads deixa de depender de roadmap historico como referencia principal e passa a ter contrato funcional vigente alinhado ao backend validado.
