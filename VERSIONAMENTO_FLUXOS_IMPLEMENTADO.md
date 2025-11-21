# 📦 Versionamento e Rollback de Fluxos - IMPLEMENTADO

## ✅ Status: Backend Completo

Implementado sistema completo de versionamento e rollback para fluxos de triagem!

---

## 🏗️ Arquitetura Implementada

### 1. **Entity - FluxoTriagem** ✅

**Arquivo**: `backend/src/modules/triagem/entities/fluxo-triagem.entity.ts`

#### Novos Campos:
```typescript
export interface VersaoFluxo {
  numero: number;
  estrutura: EstruturaFluxo;
  timestamp: Date;
  autor: string;
  descricao?: string;
  publicada: boolean;
}

@Column({ type: 'jsonb', default: '[]', name: 'historico_versoes' })
historicoVersoes: VersaoFluxo[];

@Column({ type: 'integer', default: 1, name: 'versao_atual' })
versaoAtual: number;
```

#### Novos Métodos:
- ✅ `salvarVersao(autor, descricao?)` - Salva snapshot da estrutura atual
- ✅ `restaurarVersao(numeroVersao)` - Restaura versão anterior
- ✅ `getHistoricoOrdenado()` - Lista versões ordenadas (mais recente primeiro)

---

### 2. **Service - FluxoTriagemService** ✅

**Arquivo**: `backend/src/modules/triagem/services/fluxo-triagem.service.ts`

#### Novos Métodos:

##### `getHistoricoVersoes(empresaId, id)`
- Retorna array de snapshots de versões
- Ordenado por número de versão (decrescente)
- Inclui estrutura completa + metadados

##### `restaurarVersao(empresaId, id, numeroVersao, usuarioId)`
- Valida se versão existe
- Salva backup da versão atual antes de restaurar
- Restaura estrutura da versão especificada
- Incrementa `versaoAtual`
- Registra log da operação

##### `salvarVersao(empresaId, id, usuarioId, descricao?)`
- Cria snapshot da estrutura atual
- Adiciona ao array `historicoVersoes`
- Incrementa `versaoAtual`
- Registra log

#### Modificação no `publicar()`:
```typescript
// 📦 Salvar versão antes de publicar
fluxo.salvarVersao(usuarioId, 'Versão publicada');
```

---

### 3. **Controller - FluxoController** ✅

**Arquivo**: `backend/src/modules/triagem/controllers/fluxo.controller.ts`

#### Novos Endpoints:

```typescript
// GET /fluxos/:id/historico
// Obter histórico completo de versões
async getHistoricoVersoes(@Param('id') id: string)

// POST /fluxos/:id/salvar-versao
// Salvar snapshot manual da versão atual
async salvarVersao(@Param('id') id: string, @Body('descricao') descricao?: string)

// POST /fluxos/:id/restaurar-versao
// Restaurar versão anterior
async restaurarVersao(@Param('id') id: string, @Body('numeroVersao') numeroVersao: number)
```

---

## 🔄 Fluxo de Funcionamento

### 1. **Auto-Save ao Publicar**
```
Usuário clica "Publicar fluxo"
  ↓
Backend chama fluxo.salvarVersao(userId, 'Versão publicada')
  ↓
Snapshot é adicionado ao historicoVersoes[]
  ↓
versaoAtual++
  ↓
Fluxo é publicado
```

### 2. **Save Manual**
```
Usuário clica "Salvar Versão" na UI
  ↓
POST /fluxos/:id/salvar-versao { descricao: "..." }
  ↓
Backend salva snapshot com descrição customizada
  ↓
Retorna fluxo atualizado com novo histórico
```

### 3. **Restaurar Versão**
```
Usuário seleciona versão no histórico
  ↓
Clica "Restaurar"
  ↓
POST /fluxos/:id/restaurar-versao { numeroVersao: 3 }
  ↓
Backend:
  1. Salva backup da versão atual
  2. Restaura estrutura da versão 3
  3. Incrementa versaoAtual
  ↓
Retorna fluxo restaurado
```

---

## 📊 Estrutura de Dados

### Exemplo de `historicoVersoes`:

```json
[
  {
    "numero": 1,
    "estrutura": {
      "etapaInicial": "inicio",
      "etapas": { ... }
    },
    "timestamp": "2025-10-27T14:30:00.000Z",
    "autor": "user-uuid-123",
    "descricao": "Versão publicada",
    "publicada": true
  },
  {
    "numero": 2,
    "estrutura": { ... },
    "timestamp": "2025-10-27T15:45:00.000Z",
    "autor": "user-uuid-123",
    "descricao": "Adicionado nova etapa de validação",
    "publicada": false
  }
]
```

---

## 🎯 Próximos Passos - Frontend

### Componentes a Criar:

#### 1. **ModalHistoricoVersoes.tsx**
```typescript
interface ModalHistoricoVersoesProps {
  open: boolean;
  fluxoId: string;
  onClose: () => void;
  onRestore: () => void;
}
```

**Features**:
- Timeline visual com versões
- Cada item mostra:
  - Número da versão
  - Data/hora (formato relativo: "há 2 horas")
  - Autor
  - Descrição
  - Badge "PUBLICADA" se aplicável
- Botões:
  - "👁️ Visualizar" - Preview da estrutura
  - "↩️ Restaurar" - Restaurar versão
  - "📥 Exportar JSON" - Download do snapshot

#### 2. **Integration em FluxoBuilderPage**
```typescript
// Adicionar botão no header:
<button onClick={() => setShowHistorico(true)}>
  <History /> Histórico de Versões
</button>

// Adicionar modal:
<ModalHistoricoVersoes
  open={showHistorico}
  fluxoId={fluxoId}
  onClose={() => setShowHistorico(false)}
  onRestore={() => {
    carregarFluxo();
    toast.success('Versão restaurada com sucesso!');
  }}
/>
```

#### 3. **Integration em GestaoFluxosPage**
```typescript
// Adicionar ação no dropdown dos cards:
<MenuItem onClick={() => abrirHistorico(fluxo.id)}>
  <History /> Ver Histórico
</MenuItem>
```

---

## 🧪 Endpoints para Testar

### 1. Obter Histórico
```bash
GET http://localhost:3001/fluxos/:id/historico
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "numero": 3,
      "timestamp": "2025-10-27T14:30:00Z",
      "autor": "user-123",
      "descricao": "Versão publicada",
      "publicada": true
    },
    ...
  ],
  "total": 5
}
```

### 2. Salvar Versão Manual
```bash
POST http://localhost:3001/fluxos/:id/salvar-versao
Authorization: Bearer <token>
Content-Type: application/json

{
  "descricao": "Checkpoint antes de grandes mudanças"
}

Response:
{
  "success": true,
  "message": "Versão 4 salva com sucesso",
  "data": { ... }
}
```

### 3. Restaurar Versão
```bash
POST http://localhost:3001/fluxos/:id/restaurar-versao
Authorization: Bearer <token>
Content-Type: application/json

{
  "numeroVersao": 2
}

Response:
{
  "success": true,
  "message": "Fluxo restaurado para versão 2 com sucesso",
  "data": { ... }
}
```

---

## 🛡️ Segurança e Validações

### Implementadas:
- ✅ Validação de `numeroVersao` (número inteiro positivo)
- ✅ Backup automático antes de restaurar
- ✅ Deep clone da estrutura (evita mutação)
- ✅ Logs de todas operações de versionamento
- ✅ Verificação de permissões (JWT + empresaId)

### Comportamento de Edge Cases:
- ❌ Versão não existe → `404 Not Found`
- ❌ numeroVersao inválido → `400 Bad Request`
- ✅ Restaurar versão já salva backup → Evita perda de dados
- ✅ Array vazio de histórico → Retorna array vazio (não erro)

---

## 📈 Melhorias Futuras (Opcional)

### Nível 1 - Comparação Visual
- [ ] Diff visual entre versões (mostrar o que mudou)
- [ ] Highlight de blocos adicionados/removidos

### Nível 2 - Comentários e Tags
- [ ] Permitir adicionar comentários em cada versão
- [ ] Tags para marcar versões importantes ("Produção", "Staging", etc.)

### Nível 3 - Branching
- [ ] Criar ramificações de versões (como Git branches)
- [ ] Merge de fluxos

---

## ✅ Checklist de Implementação

### Backend
- [x] Interface `VersaoFluxo` criada
- [x] Campos `historicoVersoes` e `versaoAtual` adicionados na entity
- [x] Método `salvarVersao()` implementado
- [x] Método `restaurarVersao()` implementado
- [x] Método `getHistoricoOrdenado()` implementado
- [x] Service `getHistoricoVersoes()` implementado
- [x] Service `restaurarVersao()` implementado
- [x] Service `salvarVersao()` implementado
- [x] Auto-save ao publicar integrado
- [x] Controller endpoints criados
- [x] Import `BadRequestException` adicionado

### Database
- [ ] Migration para adicionar colunas
  ```bash
  cd backend
  npm run migration:generate -- src/migrations/AddVersoesColunas
  npm run migration:run
  ```

### Frontend (Pendente)
- [ ] Service `fluxoService.getHistorico(id)`
- [ ] Service `fluxoService.salvarVersao(id, descricao)`
- [ ] Service `fluxoService.restaurarVersao(id, numeroVersao)`
- [ ] Componente `ModalHistoricoVersoes.tsx`
- [ ] Integração no `FluxoBuilderPage`
- [ ] Integração no `GestaoFluxosPage`
- [ ] Toast notifications
- [ ] Confirmação antes de restaurar ("Tem certeza?")

---

## 📝 Logs e Debugging

### Backend Logs a Verificar:
```
[FluxoTriagemService] Versão 3 do fluxo abc-123 salva com sucesso
[FluxoTriagemService] Fluxo abc-123 restaurado para versão 2 por usuário user-456
[FluxoTriagemService] Fluxo publicado: abc-123 - v4
```

---

## 🎓 Como Usar

### Para Desenvolvedor:

1. **Salvar checkpoint antes de mudança grande**:
   ```typescript
   await fluxoService.salvarVersao(empresaId, fluxoId, userId, 'Antes de refatorar');
   ```

2. **Restaurar se der errado**:
   ```typescript
   await fluxoService.restaurarVersao(empresaId, fluxoId, versaoAnterior, userId);
   ```

3. **Ver histórico**:
   ```typescript
   const versoes = await fluxoService.getHistoricoVersoes(empresaId, fluxoId);
   ```

### Para Usuário Final (quando UI estiver pronta):

1. Abrir fluxo no editor visual
2. Clicar em "Histórico de Versões"
3. Ver timeline com todas versões salvas
4. Clicar "Restaurar" na versão desejada
5. Confirmar ação
6. ✅ Fluxo volta ao estado anterior

---

**Data de Implementação**: 27 de outubro de 2025  
**Desenvolvido por**: GitHub Copilot + Equipe ConectCRM  
**Status**: Backend 100% ✅ | Frontend Pendente 🔄
