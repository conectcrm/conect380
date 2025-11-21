# 🐛 Correção: Contato "Sem Nome" no Chat de Atendimento

## 📋 Problema Identificado

**Sintoma**: Quando o bot finalizava a triagem e criava o ticket, o contato aparecia "sem nome" na interface de atendimento.

**Causa Raiz**: A entidade `SessaoTriagem` **não possui campo `contatoId`**, mas o código estava tentando acessar `sessao.contatoId` ao criar o ticket.

```typescript
// ❌ ERRADO - Campo não existe na entidade
const ticket = await this.ticketService.criarParaTriagem({
  contatoId: sessao.contatoId, // undefined!
  ...
});
```

Quando `contatoId` era `undefined`:
- O método `criarParaTriagem()` não conseguia buscar o contato
- O ticket era criado com `contatoNome: null`
- Frontend exibia "sem nome"

---

## ✅ Solução Implementada

### 1. **Usar `contexto.__contatoId` quando disponível**

O bot já preenchia `contexto.__contatoId` quando reconhecia o contato (linha 410 em `triagem-bot.service.ts`):

```typescript
if (contatoExistente) {
  contextoInicial.__contatoId = contatoExistente.id;
  contextoInicial.__clienteCadastrado = true;
  ...
}
```

### 2. **Adicionar fallback com telefone e nome**

Para clientes novos (sem cadastro), passamos telefone e nome diretamente:

```typescript
// ✅ CORRETO - Busca contatoId do contexto + fallback
const contatoId = sessao.contexto?.__contatoId || null;

const ticket = await this.ticketService.criarParaTriagem({
  contatoId,
  contatoTelefone: sessao.contatoTelefone,
  contatoNome: sessao.contatoNome || sessao.contexto?.nome || null,
  ...
});
```

### 3. **Atualizar `criarParaTriagem()` para aceitar fallback**

```typescript
async criarParaTriagem(dados: {
  contatoId?: string;
  contatoTelefone?: string; // 🆕 Fallback
  contatoNome?: string;      // 🆕 Fallback
  ...
}): Promise<any> {
  // Buscar contato por ID
  let contato: Contato | null = null;
  if (dados.contatoId) {
    contato = await this.contatoRepository.findOne({
      where: { id: dados.contatoId },
      relations: ['cliente'],
    });
  }

  // 🆕 Usar dados do contato ou fallback fornecido
  const telefone = contato?.telefone || dados.contatoTelefone || null;
  const nome = contato?.nome || dados.contatoNome || null;
  
  // Criar ticket com os dados resolvidos
  const ticket = this.ticketRepository.create({
    contatoTelefone: telefone,
    contatoNome: nome,
    ...
  });
}
```

---

## 📂 Arquivos Modificados

### 1. `backend/src/modules/triagem/services/triagem-bot.service.ts`
**Linhas ~1135-1145** (método `finalizarTriagem`)

```typescript
// 🔍 Buscar contatoId do contexto (preenchido quando contato existe)
const contatoId = sessao.contexto?.__contatoId || null;

// Criar ticket de atendimento
const ticket = await this.ticketService.criarParaTriagem({
  contatoId,
  contatoTelefone: sessao.contatoTelefone,
  contatoNome: sessao.contatoNome || sessao.contexto?.nome || null,
  departamentoId,
  nucleoId,
  empresaId: sessao.empresaId,
  canalOrigem: 'whatsapp',
  prioridade: 'media',
  assunto: `Atendimento via Bot - ${departamentoNome}`,
  descricao: `Cliente solicitou atendimento através do bot de triagem.\n\nContexto:\n${JSON.stringify(sessao.contexto, null, 2)}`,
});
```

### 2. `backend/src/modules/atendimento/services/ticket.service.ts`
**Linhas 250-290** (método `criarParaTriagem`)

```typescript
async criarParaTriagem(dados: {
  contatoId?: string;
  contatoTelefone?: string; // 🆕 Fallback quando não há contatoId
  contatoNome?: string;     // 🆕 Fallback quando não há contatoId
  departamentoId?: string;
  nucleoId?: string;
  empresaId: string;
  canalOrigem: string;
  prioridade: string;
  assunto: string;
  descricao?: string;
}): Promise<any> {
  this.logger.log(`➕ Criando ticket para: ${dados.contatoId || dados.contatoTelefone || 'contato não especificado'}`);

  // Buscar contato se fornecido
  let contato: Contato | null = null;
  if (dados.contatoId) {
    contato = await this.contatoRepository.findOne({
      where: { id: dados.contatoId },
      relations: ['cliente'],
    });
    
    if (contato) {
      this.logger.log(`✅ Contato encontrado no banco: ${contato.nome} (${contato.telefone})`);
    }
  }

  // 🆕 Se não tem contato mas tem telefone/nome, usar os dados fornecidos
  const telefone = contato?.telefone || dados.contatoTelefone || null;
  const nome = contato?.nome || dados.contatoNome || null;
  
  if (!contato && (dados.contatoTelefone || dados.contatoNome)) {
    this.logger.log(`⚠️ Ticket sem vínculo de contato - usando: ${nome} (${telefone})`);
  }

  // Criar ticket
  const ticket = this.ticketRepository.create({
    empresaId: dados.empresaId,
    contatoTelefone: telefone,
    contatoNome: nome,
    contatoFoto: null,
    assunto: dados.assunto,
    status: 'ABERTO' as any,
    prioridade: dados.prioridade as any,
    data_abertura: new Date(),
    ultima_mensagem_em: new Date(),
  });
  
  // ... resto do código
}
```

---

## 🎯 Fluxos de Criação de Ticket

### Cenário 1: Cliente Cadastrado (com `contatoId`)
```
1. Bot reconhece telefone → busca contato no DB
2. Preenche contexto.__contatoId
3. Cria ticket com contatoId
4. criarParaTriagem() busca contato por ID
5. Usa nome e telefone do registro no banco
✅ Ticket aparece com nome correto
```

### Cenário 2: Cliente Novo (sem `contatoId`)
```
1. Bot não encontra contato no DB
2. contexto.__contatoId fica null
3. Usa fallback: sessao.contatoTelefone e sessao.contatoNome
4. criarParaTriagem() não encontra contato
5. Usa telefone e nome fornecidos diretamente
✅ Ticket aparece com nome coletado pelo bot
```

### Cenário 3: Cliente Novo + Nome no Contexto
```
1. Bot não encontra contato
2. Bot coleta nome durante fluxo → sessao.contexto.nome
3. Fallback: sessao.contexto.nome
4. Ticket criado com nome coletado
✅ Ticket aparece com nome correto
```

---

## 🧪 Como Testar

### 1. Teste com Cliente Cadastrado
```bash
# 1. Certifique-se que há um contato no banco com telefone
# 2. Envie mensagem WhatsApp desse telefone
# 3. Bot inicia triagem
# 4. Selecione departamento
# 5. Verifique no chat se nome aparece correto
```

**Log esperado:**
```
✅ Contato encontrado no banco: João Silva (5511999999999)
👤 Atendente atribuído automaticamente: Maria Santos (uuid)
📱 Mensagem de direcionamento enviada ao cliente
```

### 2. Teste com Cliente Novo
```bash
# 1. Use telefone NÃO cadastrado
# 2. Bot coleta nome durante triagem
# 3. Selecione departamento
# 4. Verifique se nome coletado aparece no chat
```

**Log esperado:**
```
⚠️ Ticket sem vínculo de contato - usando: João (5511888888888)
👤 Atendente atribuído automaticamente: Maria Santos (uuid)
📱 Mensagem de direcionamento enviada ao cliente
```

### 3. Verificar no Frontend
```
1. Acesse tela de atendimento
2. Verifique lista de tickets
3. Nome do contato deve aparecer (não "sem nome")
4. Telefone deve estar preenchido
```

---

## 📊 Logs de Diagnóstico

Para debugar problemas futuros:

```typescript
// No finalizarTriagem()
this.logger.log(`🔍 Dados da sessão:
  - contatoTelefone: ${sessao.contatoTelefone}
  - contatoNome: ${sessao.contatoNome}
  - contexto.__contatoId: ${sessao.contexto?.__contatoId}
  - contexto.nome: ${sessao.contexto?.nome}
`);

// No criarParaTriagem()
this.logger.log(`📝 Criando ticket com:
  - contatoId: ${dados.contatoId || 'null'}
  - telefone: ${telefone}
  - nome: ${nome}
`);
```

---

## ⚠️ Solução Futura (Opcional)

Para evitar dependência do `contexto`, considerar adicionar campo `contatoId` à entidade:

```typescript
// backend/src/modules/triagem/entities/sessao-triagem.entity.ts
@Column({ type: 'uuid', nullable: true, name: 'contato_id' })
contatoId: string;

@ManyToOne(() => Contato, { nullable: true })
@JoinColumn({ name: 'contato_id' })
contato: Contato;
```

**Prós**:
- Relação direta com Contato
- Mais confiável
- Facilita queries

**Contras**:
- Requer migration
- Mudanças em múltiplos lugares

**Decisão**: Manter solução atual (contexto + fallback) por ser menos invasiva e funcionar bem.

---

## ✅ Status

- [x] Bug identificado
- [x] Causa raiz documentada
- [x] Solução implementada
- [x] Código atualizado
- [x] Backend compilando (0 erros)
- [ ] Testado em ambiente real
- [ ] Validado com cliente cadastrado
- [ ] Validado com cliente novo

---

**Data da Correção**: 29 de outubro de 2025  
**Arquivos**: 2 modificados  
**Linhas**: ~50 alteradas  
**Tempo**: ~20 minutos
