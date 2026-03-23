# Catalogo Flexivel - Proposta Tecnica

## Objetivo

Permitir que o sistema atenda, com a mesma base de catalogo:

- software/SaaS
- imobiliarias e empresas de servicos relacionados
- autopecas e acessorios
- lojas de veiculos para servicos e ofertas comerciais

Sem forcar tudo em um unico tipo de item e sem transformar o modal atual em um formulario gigante.

## Leitura do estado atual

Hoje o modulo de produtos ja cobre bem o cadastro de item simples e recorrente:

- tipos como `produto`, `servico`, `licenca`, `modulo`, `plano`, `aplicativo`
- categorias, subcategorias e configuracoes
- integracao com propostas
- estoque basico
- tags e variacoes simples

Mas ainda faltam as capacidades que tornam o catalogo realmente multi-segmento:

- composicao oficial de itens
- atributos dinamicos por template
- separacao entre item generico e entidades especializadas
- regras de exibicao por nicho
- contratos de API preparados para plano + modulos + add-ons

## Principios de arquitetura

1. Manter um nucleo unico de catalogo.
2. Separar item simples, item composto e item com atributos.
3. Usar templates para personalizar UX e validacoes.
4. Criar entidades especializadas quando o objeto de negocio nao for um produto generico.
5. Preservar compatibilidade com o endpoint atual de `produtos` durante a transicao.

## Modelo alvo

### 1. Nucleo de item de catalogo

Representa qualquer item vendavel ou operacional do sistema.

Exemplos:

- plano SaaS
- modulo
- licenca
- servico de implantacao
- acessorio
- peca
- pacote comercial

Campos obrigatorios do nucleo:

- identificacao
- classificacao
- precificacao
- status
- cobranca
- metadados leves

### 2. Composicao

Representa relacao pai/filho entre itens do catalogo.

Exemplos:

- plano inclui modulo
- pacote inclui servico
- kit inclui acessorio

### 3. Templates

Definem quais campos e secoes aparecem no modal conforme o tipo de oferta.

Exemplos:

- `software_plan`
- `software_module`
- `service_package`
- `autoparts_item`
- `retail_accessory_or_service`

### 4. Entidades especializadas fora do catalogo

Alguns dominios nao devem ser forzados como produto generico:

- veiculo em loja de veiculos
- imovel, se um dia virar estoque operacional

Nesses casos, o catalogo continua servindo para servicos, pacotes, garantias, vistorias, acessorios e afins.

## Modelo de dados sugerido

### Tabela `catalog_items`

Tabela principal do catalogo.

```sql
create table catalog_items (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),

  legacy_produto_id uuid null references produtos(id),

  code varchar(100) null,
  nome varchar(255) not null,
  descricao text null,

  item_kind varchar(40) not null,
  business_type varchar(40) not null,
  template_code varchar(80) null,

  categoria_id uuid null references categorias_produtos(id),
  subcategoria_id uuid null references subcategorias_produtos(id),
  configuracao_id uuid null references configuracoes_produtos(id),

  status varchar(30) not null default 'ativo',

  billing_model varchar(30) null,
  recurrence varchar(30) null,
  unit_code varchar(40) null,

  sale_price numeric(12,2) not null default 0,
  cost_amount numeric(12,2) null,
  currency_code varchar(8) not null default 'BRL',

  track_stock boolean not null default false,
  stock_current integer null,
  stock_min integer null,
  stock_max integer null,

  sku varchar(100) null,
  supplier_name varchar(255) null,

  metadata jsonb null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create index idx_catalog_items_empresa on catalog_items(empresa_id);
create index idx_catalog_items_kind on catalog_items(empresa_id, item_kind, business_type);
create index idx_catalog_items_status on catalog_items(empresa_id, status);
create index idx_catalog_items_template on catalog_items(empresa_id, template_code);
create unique index uq_catalog_items_empresa_sku on catalog_items(empresa_id, sku) where sku is not null;
```

Regras:

- `item_kind` define o comportamento estrutural do item.
- `business_type` define o significado comercial do item.
- `template_code` controla UX, validacoes e campos dinamicos.
- `metadata` guarda apenas dados complementares, nunca campos centrais do negocio.

Valores recomendados para `item_kind`:

- `simple`
- `composite`
- `variant_parent`
- `variant_child`
- `service`
- `subscription`

Valores recomendados para `business_type`:

- `produto`
- `servico`
- `plano`
- `modulo`
- `licenca`
- `aplicativo`
- `peca`
- `acessorio`
- `pacote`
- `garantia`

### Tabela `catalog_item_components`

Relaciona item pai e item filho.

```sql
create table catalog_item_components (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  parent_item_id uuid not null references catalog_items(id),
  child_item_id uuid not null references catalog_items(id),

  component_role varchar(30) not null,
  quantity numeric(12,4) not null default 1,
  sort_order integer not null default 0,
  affects_price boolean not null default false,
  is_default boolean not null default true,

  metadata jsonb null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_catalog_components_parent on catalog_item_components(empresa_id, parent_item_id);
create index idx_catalog_components_child on catalog_item_components(empresa_id, child_item_id);
```

Valores recomendados para `component_role`:

- `included`
- `required`
- `optional`
- `recommended`
- `addon`

Exemplo de uso:

- `Plano Enterprise` inclui `Modulo CRM`
- `Plano Enterprise` inclui `Modulo Financeiro`
- `Plano Enterprise` possui `Implantacao Premium` como `optional`

### Tabela `catalog_templates`

Cadastro de templates disponiveis por empresa.

```sql
create table catalog_templates (
  code varchar(80) primary key,
  empresa_id uuid null references empresas(id),
  nome varchar(120) not null,
  descricao text null,
  item_kind varchar(40) not null,
  business_type varchar(40) not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Observacao:

- `empresa_id` nulo permite templates globais.
- `empresa_id` preenchido permite templates por tenant.

### Tabela `catalog_template_fields`

Define os campos extras e as secoes do modal.

```sql
create table catalog_template_fields (
  id uuid primary key default gen_random_uuid(),
  template_code varchar(80) not null references catalog_templates(code),

  field_key varchar(80) not null,
  label varchar(120) not null,
  section varchar(40) not null,
  field_type varchar(30) not null,

  required boolean not null default false,
  visible boolean not null default true,
  sort_order integer not null default 0,

  options jsonb null,
  validation_rules jsonb null,
  default_value jsonb null,
  help_text text null
);

create unique index uq_catalog_template_fields on catalog_template_fields(template_code, field_key);
```

Exemplos de `section`:

- `identificacao`
- `comercial`
- `cobranca`
- `operacao`
- `estoque`
- `composicao`
- `compatibilidade`

Exemplos de `field_type`:

- `text`
- `textarea`
- `number`
- `money`
- `select`
- `multiselect`
- `boolean`
- `uuid_select`

### Tabela `catalog_item_attribute_values`

Opcional. Usar somente se a equipe quiser separar atributos dinamicos de `metadata`.

```sql
create table catalog_item_attribute_values (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  item_id uuid not null references catalog_items(id),
  field_key varchar(80) not null,
  value_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index uq_catalog_item_attribute_values on catalog_item_attribute_values(item_id, field_key);
```

Decisao pratica:

- se quiser entrega mais rapida, usar `metadata` em `catalog_items`
- se quiser governanca e filtros mais fortes, usar `catalog_item_attribute_values`

### Tabela `vehicle_inventory_items`

Modulo proprio para loja de veiculos.

```sql
create table vehicle_inventory_items (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),

  marca varchar(100) not null,
  modelo varchar(120) not null,
  versao varchar(120) null,

  ano_fabricacao integer not null,
  ano_modelo integer not null,
  quilometragem integer null,

  combustivel varchar(40) null,
  cambio varchar(40) null,
  cor varchar(40) null,

  placa varchar(20) null,
  chassi varchar(40) null,
  renavam varchar(40) null,

  valor_compra numeric(12,2) null,
  valor_venda numeric(12,2) not null,
  status varchar(30) not null default 'disponivel',

  metadata jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Conclusao importante:

- veiculo nao deve usar `catalog_items` como estoque principal
- o catalogo continua servindo para servicos, garantias, vistoria, financiamento e acessorios

## Contrato de API sugerido

### Estrategia

Manter `produtos` funcionando e abrir uma API nova de catalogo. Durante a migracao:

- `produtos` continua ativo
- `catalog` passa a ser a API alvo
- `produtos` pode virar adaptador para `catalog_items`

### Endpoints novos

```http
GET    /catalog/items
POST   /catalog/items
GET    /catalog/items/:id
PUT    /catalog/items/:id
PATCH  /catalog/items/:id/status
DELETE /catalog/items/:id

GET    /catalog/items/:id/components
PUT    /catalog/items/:id/components

GET    /catalog/templates
GET    /catalog/templates/:code

GET    /catalog/stats
```

### DTO base

```ts
export type CatalogItemKind =
  | 'simple'
  | 'composite'
  | 'variant_parent'
  | 'variant_child'
  | 'service'
  | 'subscription';

export type CatalogBusinessType =
  | 'produto'
  | 'servico'
  | 'plano'
  | 'modulo'
  | 'licenca'
  | 'aplicativo'
  | 'peca'
  | 'acessorio'
  | 'pacote'
  | 'garantia';

export interface CreateCatalogItemDto {
  nome: string;
  descricao?: string;

  itemKind: CatalogItemKind;
  businessType: CatalogBusinessType;
  templateCode?: string;

  categoriaId?: string | null;
  subcategoriaId?: string | null;
  configuracaoId?: string | null;

  status?: 'ativo' | 'inativo' | 'descontinuado';

  billingModel?: 'unico' | 'recorrente';
  recurrence?: 'mensal' | 'anual' | 'trimestral' | 'sob_consulta' | null;
  unitCode?: string | null;

  salePrice: number;
  costAmount?: number | null;

  trackStock?: boolean;
  stockCurrent?: number | null;
  stockMin?: number | null;
  stockMax?: number | null;

  sku?: string | null;
  supplierName?: string | null;

  metadata?: Record<string, unknown>;
  components?: CreateCatalogItemComponentDto[];
}

export interface CreateCatalogItemComponentDto {
  childItemId: string;
  componentRole: 'included' | 'required' | 'optional' | 'recommended' | 'addon';
  quantity: number;
  sortOrder?: number;
  affectsPrice?: boolean;
  isDefault?: boolean;
  metadata?: Record<string, unknown>;
}
```

### Resposta padrao

```ts
export interface CatalogItemResponse {
  id: string;
  nome: string;
  descricao?: string;
  itemKind: CatalogItemKind;
  businessType: CatalogBusinessType;
  templateCode?: string;

  categoriaId?: string | null;
  subcategoriaId?: string | null;
  configuracaoId?: string | null;

  status: 'ativo' | 'inativo' | 'descontinuado';

  billingModel?: string | null;
  recurrence?: string | null;
  unitCode?: string | null;

  salePrice: number;
  costAmount?: number | null;

  trackStock: boolean;
  stockCurrent?: number | null;
  stockMin?: number | null;
  stockMax?: number | null;

  sku?: string | null;
  supplierName?: string | null;

  metadata?: Record<string, unknown>;
  components?: CatalogItemComponentResponse[];

  createdAt: string;
  updatedAt: string;
}
```

## Templates iniciais recomendados

### `software_plan`

Uso:

- plano Starter
- plano Enterprise
- assinatura de plataforma

Campos extras:

- usuarios_inclusos
- suporte_incluso
- onboarding_incluso
- limite_unidades
- limite_integracoes

Permite composicao:

- modulos incluidos
- add-ons opcionais
- servicos de implantacao

### `software_module`

Uso:

- modulo CRM
- modulo Financeiro
- modulo Compras

Campos extras:

- depende_de_modulo
- tipo_licenciamento
- recorrencia
- limite_usuarios

### `service_package`

Uso:

- implantacao
- treinamento
- consultoria
- pacote premium

Campos extras:

- duracao_estimada
- modalidade
- horas_previstas
- escopo_entrega

### `autoparts_item`

Uso:

- peca
- acessorio
- item automotivo com compatibilidade

Campos extras:

- marca_aplicacao
- modelo_aplicacao
- ano_inicial
- ano_final
- codigo_oem
- referencia_cruzada
- lado_posicao

### `retail_accessory_or_service`

Uso:

- garantia
- instalacao
- acessorio
- servico avulso

Campos extras:

- possui_instalacao
- prazo_execucao
- fornecedor_padrao

## UX do novo modal

### Problema do modal atual

O modal atual tenta ser unico para todos os cenarios. Isso funciona para item simples, mas perde clareza quando entram:

- plano com modulos
- servico com regras proprias
- peca com compatibilidade
- itens que nao usam estoque

### Fluxo recomendado

#### Etapa 1. Modelo do item

Escolha rapida do comportamento estrutural:

- item simples
- item composto
- assinatura/plano
- servico
- item com variacoes

#### Etapa 2. Tipo comercial

- produto
- servico
- plano
- modulo
- licenca
- aplicativo
- peca
- acessorio
- pacote

#### Etapa 3. Template

Sugestoes a partir do tipo escolhido:

- software_plan
- software_module
- service_package
- autoparts_item
- retail_accessory_or_service
- generico

#### Etapa 4. Formulario dinamico

Secoes exibidas conforme template:

- Identificacao
- Comercial
- Cobranca
- Operacao
- Estoque
- Composicao
- Compatibilidade
- Observacoes

### Regras de UX

- esconder estoque quando `trackStock = false`
- esconder composicao quando `itemKind = simple`
- mostrar composicao para `subscription` e `composite`
- renomear `Custo Unitario` conforme o tipo
- impedir autosave que persistir no backend sem clique explicito
- separar campos obrigatorios dos avancados

### Rotulos recomendados por nicho

- software/plano/modulo/licenca: `Custo Operacional Estimado`
- produto fisico/peca/acessorio: `Custo de Aquisicao`
- servico: `Custo de Entrega`

## Exemplo de uso por nicho

### Conect360 - plano SaaS

Item:

- `itemKind`: `subscription`
- `businessType`: `plano`
- `templateCode`: `software_plan`
- `salePrice`: mensalidade
- `costAmount`: custo operacional estimado

Composicao:

- `Modulo CRM` como `included`
- `Modulo Financeiro` como `included`
- `Implantacao Premium` como `optional`

### Imobiliaria

Catalogo serve para:

- implantacao
- integracao
- treinamento
- plano recorrente
- pacote de suporte

Nao precisa entidade especializada neste primeiro momento.

### Autopecas

Catalogo serve para:

- pecas
- acessorios
- servicos de instalacao

Template deve expor compatibilidade veicular.

### Loja de veiculos

Separacao recomendada:

- `catalog_items` para servicos, garantia, acessorios, vistoria, financiamento
- `vehicle_inventory_items` para carros e motos

## Compatibilidade com o modulo atual

### Mapeamento inicial entre `produtos` e `catalog_items`

| produtos | catalog_items |
| --- | --- |
| `id` | `legacy_produto_id` e opcionalmente mesmo `id` na migracao |
| `nome` | `nome` |
| `descricao` | `descricao` |
| `tipoItem` | `business_type` |
| `categoriaId` | `categoria_id` |
| `subcategoriaId` | `subcategoria_id` |
| `configuracaoId` | `configuracao_id` |
| `preco` | `sale_price` |
| `custoUnitario` | `cost_amount` |
| `frequencia` | `recurrence` |
| `unidadeMedida` | `unit_code` |
| `status` | `status` |
| `sku` | `sku` |
| `fornecedor` | `supplier_name` |
| `estoqueAtual` | `stock_current` |
| `estoqueMinimo` | `stock_min` |
| `estoqueMaximo` | `stock_max` |
| `tags` / `variacoes` | `metadata` ou tabela de atributos |

### Adaptador temporario

Durante a transicao, o backend pode continuar devolvendo o contrato legado para as telas atuais:

```ts
function mapCatalogItemToLegacyProduto(item: CatalogItemEntity): ProdutoResponse {
  return {
    id: item.id,
    nome: item.nome,
    categoria: item.categoria?.nome ?? 'geral',
    categoriaId: item.categoriaId ?? null,
    subcategoriaId: item.subcategoriaId ?? null,
    configuracaoId: item.configuracaoId ?? null,
    preco: item.salePrice,
    custoUnitario: item.costAmount ?? 0,
    tipoItem: item.businessType,
    frequencia: item.recurrence ?? 'unico',
    unidadeMedida: item.unitCode ?? 'unidade',
    status: item.status,
    descricao: item.descricao ?? '',
    sku: item.sku ?? '',
    fornecedor: item.supplierName ?? '',
    estoqueAtual: item.stockCurrent ?? 0,
    estoqueMinimo: item.stockMin ?? 0,
    estoqueMaximo: item.stockMax ?? 0,
  };
}
```

## Plano de migracao

### Fase 1. Hardening do modulo atual

Antes da arquitetura nova:

- remover autosave persistente do modal atual
- unificar enum de unidade
- corrigir cards de metricas
- esconder acoes por permissao
- parar de assumir `custo = preco`
- trocar delete bruto por `descontinuado` quando fizer sentido

### Fase 2. Infraestrutura do catalogo

- criar tabelas `catalog_items`, `catalog_item_components`, `catalog_templates`, `catalog_template_fields`
- criar entidades TypeORM
- criar endpoints de `catalog`
- manter `produtos` como adaptador

### Fase 3. Templates e composicao

- entregar `software_plan`
- entregar `software_module`
- entregar `service_package`
- entregar `autoparts_item`

### Fase 4. Modal novo

- wizard por etapas
- secoes dinamicas
- composicao oficial
- custo com rotulo contextual

### Fase 5. Entidades especializadas

- `vehicle_inventory_items`
- modulo visual de estoque de veiculos

## Status atual da implementacao (2026-03-10)

- Fase 1: concluida
- Fase 2: concluida
- Fase 3: concluida
- Fase 4: concluida
- Fase 5: concluida

Observacao operacional:

- rollout em producao deve ser gradual por tenant via flags de ambiente
- runbook: `docs/CATALOGO_FLEXIVEL_ROLLOUT_PILOTO.md`

## Criterios de aceite da versao flexivel

O sistema pode ser considerado pronto para os nichos alvo quando conseguir:

1. cadastrar item simples sem campos desnecessarios
2. cadastrar plano com composicao de modulos e add-ons
3. cadastrar servico recorrente e avulso
4. cadastrar peca com compatibilidade
5. operar loja de veiculos sem usar produto generico para o veiculo
6. reaproveitar o catalogo nas propostas sem perder snapshot da composicao

## Recomendacao objetiva

Para a proxima implementacao, a ordem recomendada e:

1. corrigir o modulo atual
2. introduzir `catalog_items` com composicao
3. fazer o modal por template
4. separar veiculos em entidade propria

Essa abordagem atende melhor:

- software e SaaS
- imobiliarias e servicos
- automotivo leve
- loja de veiculos sem distorcer o dominio
