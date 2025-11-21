# 🧪 CHECKLIST DE VALIDAÇÃO MANUAL - Consolidação Equipe → Fila

**Data**: 10 de novembro de 2025  
**Status**: Pronto para testes manuais  
**Backend**: ✅ Rodando na porta 3001  
**Frontend**: 🔄 Aguardando inicialização

---

## ✅ ETAPA 1: Validação de Schema (CONCLUÍDA)

### Resultados Automáticos:
- ✅ **nucleoId** (UUID) - PRESENTE na tabela `filas`
- ✅ **departamentoId** (UUID) - PRESENTE na tabela `filas`
- ✅ **cor** (VARCHAR 7) - PRESENTE na tabela `filas`
- ✅ **icone** (VARCHAR 50) - PRESENTE na tabela `filas`
- ✅ Tabela **equipes** - REMOVIDA COM SUCESSO
- ✅ Tabela **equipe_atribuicoes** - REMOVIDA COM SUCESSO
- ✅ Tabela **atendente_equipes** - REMOVIDA COM SUCESSO
- ✅ **8 filas totais** no sistema (4 migradas + 4 pré-existentes)

---

## 🌐 ETAPA 2: Validação de Endpoints (VIA SWAGGER)

### Pré-requisitos:
1. Backend rodando: `http://localhost:3001`
2. Swagger docs: `http://localhost:3001/api-docs`
3. **Fazer login** para obter token JWT

### Testes a Realizar:

#### 2.1. GET /api/filas (Listar Filas)
**URL**: `GET /api/filas?empresaId={empresaId}`

**Validações**:
- [ ] Status 200 OK
- [ ] Retorna array de filas
- [ ] Cada fila possui os campos:
  - [ ] `id` (UUID)
  - [ ] `nome` (string)
  - [ ] `cor` (string, formato #RRGGBB ou null)
  - [ ] `icone` (string, nome Lucide React ou null)
  - [ ] `nucleoId` (UUID ou null)
  - [ ] `departamentoId` (UUID ou null)
  - [ ] `empresaId` (UUID)
  - [ ] `estrategia_distribuicao` (enum)
  - [ ] `capacidade_maxima` (number)
  - [ ] `distribuicao_automatica` (boolean)

**Exemplo de resposta esperada**:
```json
[
  {
    "id": "uuid-da-fila",
    "nome": "Fila de Suporte",
    "cor": "#159A9C",
    "icone": "Users",
    "nucleoId": "uuid-do-nucleo",
    "departamentoId": "uuid-do-departamento",
    "empresaId": "uuid-da-empresa",
    "estrategia_distribuicao": "ROUND_ROBIN",
    "capacidade_maxima": 10,
    "distribuicao_automatica": true,
    "ativo": true,
    "ordem": 0,
    "createdAt": "2025-11-10T...",
    "updatedAt": "2025-11-10T..."
  }
]
```

---

#### 2.2. PATCH /api/filas/:id/nucleo (Atribuir Núcleo)
**URL**: `PATCH /api/filas/{filaId}/nucleo`

**Body**:
```json
{
  "nucleoId": "uuid-do-nucleo"
}
```

**Validações**:
- [ ] Status 200 OK
- [ ] Retorna fila atualizada com `nucleoId` preenchido
- [ ] Campo `updatedAt` foi atualizado

---

#### 2.3. PATCH /api/filas/:id/departamento (Atribuir Departamento)
**URL**: `PATCH /api/filas/{filaId}/departamento`

**Body**:
```json
{
  "departamentoId": "uuid-do-departamento"
}
```

**Validações**:
- [ ] Status 200 OK
- [ ] Retorna fila atualizada com `departamentoId` preenchido
- [ ] Campo `updatedAt` foi atualizado

---

#### 2.4. GET /api/filas/nucleo/:id/ideal (Fila Ideal - Load Balancing)
**URL**: `GET /api/filas/nucleo/{nucleoId}/ideal`

**Validações**:
- [ ] Status 200 OK
- [ ] Retorna uma única fila (a com menor carga)
- [ ] Resposta inclui:
  - [ ] `id`, `nome`, `nucleoId`
  - [ ] `atendimentosAtivos` (número de tickets ativos)
  - [ ] `taxaOcupacao` (percentual 0-1)
  - [ ] `capacidadeDisponivel` (slots livres)

**Exemplo de resposta**:
```json
{
  "id": "uuid-da-fila-ideal",
  "nome": "Fila A",
  "nucleoId": "uuid-do-nucleo",
  "atendimentosAtivos": 3,
  "taxaOcupacao": 0.3,
  "capacidadeDisponivel": 7,
  "capacidade_maxima": 10
}
```

---

#### 2.5. POST /api/filas/rebalancear (Rebalancear Cargas)
**URL**: `POST /api/filas/rebalancear`

**Body**:
```json
{
  "empresaId": "uuid-da-empresa"
}
```

**Validações**:
- [ ] Status 200 OK
- [ ] Retorna relatório de rebalanceamento:
  - [ ] `filasProcessadas` (número)
  - [ ] `ticketsMovidos` (número)
  - [ ] `detalhes` (array de operações)

---

#### 2.6. GET /api/filas/estatisticas (Estatísticas de Filas)
**URL**: `GET /api/filas/estatisticas?empresaId={empresaId}`

**Validações**:
- [ ] Status 200 OK
- [ ] Retorna objeto com:
  - [ ] `totalFilas`
  - [ ] `filasAtivas`
  - [ ] `taxaOcupacaoMedia`
  - [ ] `ticketsEmAtendimento`
  - [ ] `capacidadeTotal`
  - [ ] `capacidadeUtilizada`

---

## 🎨 ETAPA 3: Validação de Frontend

### 3.1. Página: Gestão de Equipes (DEPRECIADA)
**URL**: `http://localhost:3000/configuracoes/gestao-equipes`

**Validações**:
- [ ] Página carrega sem erros no console
- [ ] **Banner de depreciação aparece no topo**:
  - [ ] Cor: amarelo/warning
  - [ ] Texto: "Esta página está obsoleta. As equipes foram consolidadas em Filas."
  - [ ] Botão: "Ir para Gestão de Filas"
- [ ] Clicar no botão redireciona para `/configuracoes/gestao-filas`
- [ ] Lista de equipes antigas (se houver) aparece desabilitada ou vazia
- [ ] Botão "Nova Equipe" está desabilitado ou oculto

---

### 3.2. Página: Gestão de Filas (PRINCIPAL)
**URL**: `http://localhost:3000/configuracoes/gestao-filas`

**Validações - Listagem**:
- [ ] Página carrega sem erros no console
- [ ] Lista todas as filas do sistema (8 filas esperadas)
- [ ] Cada card de fila exibe:
  - [ ] Nome da fila
  - [ ] Cor (barra lateral colorida ou badge)
  - [ ] Ícone Lucide React
  - [ ] Núcleo (nome ou "Não atribuído")
  - [ ] Departamento (nome ou "Não atribuído")
  - [ ] Status (Ativo/Inativo)
  - [ ] Botões: Editar, Deletar

**Validações - Criar Nova Fila**:
- [ ] Clicar em "Nova Fila" abre modal/formulário
- [ ] Formulário inclui campos:
  - [ ] **Nome** (input text, obrigatório)
  - [ ] **Descrição** (textarea, opcional)
  - [ ] **Cor** (color picker, opcional)
  - [ ] **Ícone** (select com ícones Lucide, opcional)
  - [ ] **Núcleo** (select dropdown, opcional) ← **NOVO CAMPO**
  - [ ] **Departamento** (select dropdown, opcional) ← **NOVO CAMPO**
  - [ ] **Estratégia** (select: Round Robin, Menor Carga, Prioridade)
  - [ ] **Capacidade Máxima** (number, padrão 10)
  - [ ] **Distribuição Automática** (checkbox, padrão true)
  - [ ] **Ativo** (checkbox, padrão true)

**Validações - Editar Fila Existente**:
- [ ] Clicar em "Editar" em uma fila migrada abre formulário preenchido
- [ ] Campos `nucleoId` e `departamentoId` aparecem corretamente se preenchidos
- [ ] Se fila foi migrada de equipe, campos `cor` e `icone` têm valores padrão
- [ ] Atualizar núcleo/departamento funciona (salva e reflete na listagem)

**Validações - Console do Navegador**:
- [ ] Sem erros 404 ou 500
- [ ] Sem warnings de TypeScript
- [ ] Network tab: requests retornam 200 OK
- [ ] Dados JSON nas responses incluem `nucleoId` e `departamentoId`

---

## 📊 ETAPA 4: Validação de Dados Migrados

### Via SQL (pgAdmin ou psql):
```sql
-- Verificar filas migradas (devem ter cor e ícone)
SELECT 
    id, 
    nome, 
    cor, 
    icone, 
    "nucleoId", 
    "departamentoId",
    "createdAt"
FROM filas
ORDER BY "createdAt" DESC
LIMIT 10;

-- Verificar relação com núcleos (se houver)
SELECT 
    f.nome AS fila_nome,
    n.nome AS nucleo_nome
FROM filas f
LEFT JOIN nucleos_atendimento n ON f."nucleoId" = n.id
WHERE f."nucleoId" IS NOT NULL;

-- Verificar membros migrados
SELECT 
    fa."filaId",
    fa."atendenteId",
    fa.capacidade,
    fa.prioridade,
    fa.ativo
FROM filas_atendentes fa
LIMIT 10;
```

**Validações**:
- [ ] 4 filas têm `cor` e `icone` preenchidos (migradas de equipes)
- [ ] Filas com `nucleoId` não-nulo têm relação válida com `nucleos_atendimento`
- [ ] 5 registros em `filas_atendentes` (membros migrados)
- [ ] Capacidade padrão = 5, Prioridade padrão = 1, Ativo = true

---

## 🐛 ETAPA 5: Verificação de Erros Comuns

### Checklist de Problemas Potenciais:
- [ ] **Console do navegador**: Sem erros de CORS
- [ ] **Network tab**: Endpoints retornam 200 (não 401 sem token)
- [ ] **Zustand store**: Estado global atualiza após operações
- [ ] **Campos novos**: Selects de núcleo/departamento carregam opções
- [ ] **Responsividade**: Funciona em mobile (375px), tablet (768px), desktop (1920px)
- [ ] **Formulário**: Validações funcionam (campo nome obrigatório)
- [ ] **Ações em massa**: Se houver, testá-las (ex: desativar múltiplas filas)

---

## ✅ RESUMO DE VALIDAÇÃO

### Status das Tarefas:
- [x] **Schema validado** (4 colunas novas, 3 tabelas removidas)
- [ ] **Endpoints testados** (6 endpoints via Swagger)
- [ ] **Frontend GestaoEquipesPage** (banner de depreciação)
- [ ] **Frontend GestaoFilasPage** (campos novos funcionando)
- [ ] **Dados migrados** (4 equipes → filas, 5 membros)

### Critérios de Aceitação:
✅ **APROVADO** se:
- Todos os endpoints retornam 200 OK com dados corretos
- Frontend exibe campos `nucleoId` e `departamentoId`
- Banner de depreciação aparece em GestaoEquipesPage
- Criar/editar fila com núcleo/departamento funciona
- Console sem erros críticos

❌ **REPROVAR** se:
- Endpoint retorna 500 ou erro de validação
- Campos novos não aparecem no frontend
- Dados migrados estão inconsistentes
- Tabelas antigas ainda existem no banco

---

## 🚀 Próximos Passos Após Validação

1. **Se APROVADO**:
   - [ ] Atualizar `AUDITORIA_PROGRESSO_REAL.md` com resultados
   - [ ] Criar PR para branch `main`
   - [ ] Documentar em `CHANGELOG.md`
   - [ ] Comunicar equipe sobre depreciação de "Gestão de Equipes"

2. **Se REPROVAR**:
   - [ ] Documentar bugs encontrados
   - [ ] Criar issues no GitHub
   - [ ] Reverter migration se necessário: `npm run migration:revert`
   - [ ] Corrigir código e re-testar

---

**Última atualização**: 10/11/2025 11:30  
**Responsável**: Consolidação Equipe → Fila  
**Branch**: `consolidacao-atendimento`
