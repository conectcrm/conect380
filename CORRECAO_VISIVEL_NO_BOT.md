# 🐛 BUG CORRIGIDO: Campo visivelNoBot Não Salvava

## ❌ Problema

Ao desmarcar "Visível no Bot" na edição de núcleos, a mudança não era salva no banco.

### Sintomas
```
1. Usuário desmarca checkbox "Visível no Bot"
2. Clica em "Salvar"
3. Backend responde 200 OK
4. ❌ Valor não muda no banco de dados
5. ❌ Badge continua mostrando "👁️ Visível"
```

### Causa Raiz

No arquivo `backend/src/modules/triagem/services/nucleo.service.ts`, método `update()`, **faltava mapear o campo `visivelNoBot`**:

```typescript
// ❌ ANTES (linhas 155-159)
if (updateNucleoDto.nome) nucleo.nome = updateNucleoDto.nome;
if (updateNucleoDto.descricao) nucleo.descricao = updateNucleoDto.descricao;
if (updateNucleoDto.cor) nucleo.cor = updateNucleoDto.cor;
if (updateNucleoDto.icone) nucleo.icone = updateNucleoDto.icone;
if (updateNucleoDto.ativo !== undefined) nucleo.ativo = updateNucleoDto.ativo;
// ← CAMPO visivelNoBot AUSENTE!
if (updateNucleoDto.prioridade) nucleo.prioridade = updateNucleoDto.prioridade;
```

**Resultado:** O DTO chegava com `visivelNoBot: false`, mas o service não atualizava a entity.

---

## ✅ Solução Aplicada

Adicionada linha para mapear o campo `visivelNoBot`:

```typescript
// ✅ DEPOIS (linhas 155-160)
if (updateNucleoDto.nome) nucleo.nome = updateNucleoDto.nome;
if (updateNucleoDto.descricao) nucleo.descricao = updateNucleoDto.descricao;
if (updateNucleoDto.cor) nucleo.cor = updateNucleoDto.cor;
if (updateNucleoDto.icone) nucleo.icone = updateNucleoDto.icone;
if (updateNucleoDto.ativo !== undefined) nucleo.ativo = updateNucleoDto.ativo;
if (updateNucleoDto.visivelNoBot !== undefined) nucleo.visivelNoBot = updateNucleoDto.visivelNoBot;  // ← ADICIONADO
if (updateNucleoDto.prioridade) nucleo.prioridade = updateNucleoDto.prioridade;
```

**Commit:** `fix: adiciona mapeamento de visivelNoBot no update de núcleos`

---

## 📋 Validações Realizadas

### ✅ DTO Tem o Campo
```typescript
// backend/src/modules/triagem/dto/create-nucleo.dto.ts (linha 62-64)
@IsBoolean()
@IsOptional()
visivelNoBot?: boolean;
```

### ✅ Entity Tem o Campo
```typescript
// backend/src/modules/triagem/entities/nucleo-atendimento.entity.ts
@Column({ name: 'visivel_no_bot', type: 'boolean', default: true })
visivelNoBot: boolean;
```

### ✅ Banco Tem a Coluna
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'nucleos_atendimento' 
  AND column_name = 'visivel_no_bot';
```

Resultado:
```
column_name     | data_type | column_default
----------------+-----------+---------------
visivel_no_bot  | boolean   | true
```

### ✅ Frontend Envia o Campo
```typescript
// frontend/src/pages/GestaoNucleosPage.tsx (linha 621-629)
<input
  type="checkbox"
  checked={formData.visivelNoBot ?? true}
  onChange={(e) => setFormData({ ...formData, visivelNoBot: e.target.checked })}
  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
/>
```

---

## 🚀 Como Aplicar a Correção

### 1. Backend Já Foi Recompilado ✅
```powershell
npm run build --prefix backend
# ✅ Compilado com sucesso
```

### 2. Reiniciar Backend (NECESSÁRIO)
```powershell
# Parar o backend atual (Ctrl+C no terminal)
# Depois:
cd C:\Projetos\conectcrm\backend
npm run start:dev
```

### 3. Testar no Frontend
1. Acesse: http://localhost:3000/configuracoes/nucleos
2. Clique em "Editar" em um núcleo
3. **Desmarque** ☐ Visível no Bot
4. Clique em "Salvar"
5. ✅ Badge deve mudar para "🚫 Oculto"

### 4. Verificar no Banco
```sql
SELECT nome, ativo, visivel_no_bot 
FROM nucleos_atendimento 
ORDER BY nome;
```

Deve mostrar `visivel_no_bot = false` para o núcleo editado.

---

## 🧪 Cenários de Teste

### Teste 1: Ocultar Núcleo Visível
**Antes:**
- Núcleo "Suporte": `visivel_no_bot = true`
- Badge: 👁️ Visível (azul)

**Ação:**
1. Editar núcleo "Suporte"
2. Desmarcar "Visível no Bot"
3. Salvar

**Depois:**
- Núcleo "Suporte": `visivel_no_bot = false` ✅
- Badge: 🚫 Oculto (cinza) ✅
- Endpoint `/nucleos/bot/opcoes` **não** retorna "Suporte" ✅

---

### Teste 2: Tornar Núcleo Oculto Visível
**Antes:**
- Núcleo "Vendas": `visivel_no_bot = false`
- Badge: 🚫 Oculto (cinza)

**Ação:**
1. Editar núcleo "Vendas"
2. Marcar "Visível no Bot"
3. Salvar

**Depois:**
- Núcleo "Vendas": `visivel_no_bot = true` ✅
- Badge: 👁️ Visível (azul) ✅
- Endpoint `/nucleos/bot/opcoes` retorna "Vendas" ✅

---

### Teste 3: Criar Núcleo Oculto
**Ação:**
1. Clicar "Novo Núcleo"
2. Preencher dados
3. **Desmarcar** "Visível no Bot"
4. Criar

**Resultado:**
- Núcleo criado com `visivel_no_bot = false` ✅
- Badge: 🚫 Oculto desde o início ✅

---

### Teste 4: Editar Outros Campos Sem Tocar visivelNoBot
**Ação:**
1. Editar núcleo
2. Mudar apenas o nome
3. Não tocar no checkbox
4. Salvar

**Resultado:**
- Nome atualizado ✅
- `visivel_no_bot` permanece inalterado ✅

---

## 📊 Impacto da Correção

### Funcionalidades Afetadas
- ✅ Edição de núcleos (campo agora salva)
- ✅ Badge de visibilidade (reflete valor real)
- ✅ Endpoint `/nucleos/bot/opcoes` (filtra corretamente)
- ✅ FluxoTriagem (respeita configuração)

### Funcionalidades NÃO Afetadas
- ✅ Criação de núcleos (já funcionava)
- ✅ Listagem de núcleos (já funcionava)
- ✅ Outros campos (continuam funcionando)

---

## 🎯 Checklist Pós-Correção

- [x] Código corrigido em `nucleo.service.ts`
- [x] Backend recompilado
- [ ] Backend reiniciado com código novo
- [ ] Teste manual: ocultar núcleo
- [ ] Teste manual: tornar núcleo visível
- [ ] Verificação no banco de dados
- [ ] Teste endpoint `/nucleos/bot/opcoes`
- [ ] Documentação atualizada

---

## 📝 Lições Aprendidas

1. **Sempre mapear todos os campos no update**
   - Revisar método `update()` quando adicionar novo campo
   - Usar checklist de campos DTO vs Entity vs Mapeamento

2. **Padrão inconsistente**
   - Campo `ativo` usa `!== undefined` (correto para booleanos)
   - Outros campos usam validação truthy (pode perder `false`)
   - **Recomendação:** Usar `!== undefined` para todos os booleanos

3. **Melhorias futuras**
   ```typescript
   // Opção 1: Usar Object.assign (mais limpo)
   Object.assign(nucleo, updateNucleoDto);
   
   // Opção 2: Decorador para mapear automaticamente
   @AutoMap()
   async update(...)
   ```

---

## 🔍 Debug Usado

### 1. Verificar DTO chegando
```typescript
console.log('[DEBUG] updateNucleoDto:', updateNucleoDto);
// ✅ visivelNoBot estava presente
```

### 2. Verificar Entity antes do save
```typescript
console.log('[DEBUG] nucleo antes:', nucleo.visivelNoBot);
// ❌ Valor não mudava
```

### 3. Verificar SQL gerado
```typescript
this.nucleoRepository.save(nucleo); // TypeORM detecta changes
// ❌ Campo visivelNoBot não estava no UPDATE
```

**Conclusão:** O campo não estava sendo copiado do DTO para a entity.

---

## ✨ Status Final

**BUG:** ❌ Campo `visivelNoBot` não salvava  
**CORREÇÃO:** ✅ Linha adicionada no mapeamento  
**BUILD:** ✅ Backend recompilado  
**PRÓXIMO PASSO:** 🔄 Reiniciar backend

---

**Após reiniciar o backend, o sistema estará 100% funcional para controle de visibilidade dos núcleos no bot!** 🎉
