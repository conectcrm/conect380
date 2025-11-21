# 🔍 Logs de Debug Adicionados no Backend

## ✅ O Que Foi Feito

Adicionei logs temporários no backend para rastrear o fluxo completo de `empresaId`:

### 1. Controller (`message-template.controller.ts`)
```typescript
@Get()
async listar(@Query('empresaId') empresaId: string, ...) {
  console.log('🔍 [Controller] Buscando templates para empresaId:', empresaId);
  const templates = await this.templateService.listar(empresaId, somenteAtivos);
  console.log('📊 [Controller] Templates encontrados:', templates.length);
  if (templates.length > 0) {
    console.log('🏢 [Controller] empresaIds dos templates:', templates.map(t => t.empresaId));
  }
  // ...
}
```

### 2. Service - Criar (`message-template.service.ts`)
```typescript
async criar(createDto: CriarTemplateDto, empresaId: string) {
  console.log('🆕 [Service] criar() chamado');
  console.log('🏢 [Service] empresaId recebido:', empresaId);
  console.log('📝 [Service] DTO:', JSON.stringify(createDto));
  
  // ... validações ...
  
  console.log('💾 [Service] Salvando template com empresaId:', template.empresaId);
  const saved = await this.templateRepository.save(template);
  console.log('✅ [Service] Template salvo com ID:', saved.id);
  console.log('🏢 [Service] empresaId do template salvo:', saved.empresaId);
  
  return saved;
}
```

### 3. Service - Listar (`message-template.service.ts`)
```typescript
async listar(empresaId: string, apenasAtivos: boolean = false) {
  console.log('🔍 [Service] listar() chamado com empresaId:', empresaId);
  console.log('🔍 [Service] apenasAtivos:', apenasAtivos);
  console.log('🔍 [Service] WHERE conditions:', JSON.stringify(where));
  
  const templates = await this.templateRepository.find({ where, ... });
  
  console.log('📊 [Service] Query retornou', templates.length, 'templates');
  if (templates.length > 0) {
    console.log('🏢 [Service] empresaIds encontrados:', templates.map(t => t.empresaId));
    console.log('📝 [Service] Nomes:', templates.map(t => t.nome));
  }
  
  return templates;
}
```

---

## 🚀 PRÓXIMOS PASSOS (OBRIGATÓRIOS)

### 1️⃣ Reiniciar Backend

O backend **precisa ser reiniciado** para aplicar os logs:

```powershell
# Parar backend atual
Get-Process -Name node | Where-Object {$_.Id -eq 29768} | Stop-Process -Force

# Ou usar Ctrl+C no terminal do backend

# Iniciar novamente
cd c:\Projetos\conectcrm\backend
npm run start:dev
```

**Ou usar a task do VS Code**:
- `Ctrl+Shift+P` → `Tasks: Run Task` → `Start Backend Dev (watch)`

---

### 2️⃣ Criar Um Template de Teste

Após backend reiniciar:

1. Abrir http://localhost:3000/atendimento/templates
2. Clicar em "**+ Novo Template**"
3. Preencher:
   - **Nome**: `TESTE DEBUG`
   - **Conteúdo**: `Olá {{nome}}, teste de debug`
   - **Categoria**: `Debug`
   - **Atalho**: `/debug`
4. Clicar em "**Salvar**"

---

### 3️⃣ Verificar Logs no Terminal do Backend

**O terminal do backend mostrará**:

```
🆕 [Service] criar() chamado
🏢 [Service] empresaId recebido: f47ac10b-58cc-4372-a567-0e02b2c3d479
📝 [Service] DTO: {"nome":"TESTE DEBUG","conteudo":"Olá {{nome}}, teste de debug",...}
💾 [Service] Salvando template com empresaId: f47ac10b-58cc-4372-a567-0e02b2c3d479
✅ [Service] Template salvo com ID: xxx-xxx-xxx
🏢 [Service] empresaId do template salvo: f47ac10b-58cc-4372-a567-0e02b2c3d479
```

**Depois, ao recarregar a lista**:

```
🔍 [Controller] Buscando templates para empresaId: f47ac10b-58cc-4372-a567-0e02b2c3d479
🔍 [Service] listar() chamado com empresaId: f47ac10b-58cc-4372-a567-0e02b2c3d479
🔍 [Service] apenasAtivos: false
🔍 [Service] WHERE conditions: {"empresaId":"f47ac10b-58cc-4372-a567-0e02b2c3d479"}
📊 [Service] Query retornou X templates
🏢 [Service] empresaIds encontrados: ['f47ac10b-58cc-4372-a567-0e02b2c3d479', ...]
📝 [Service] Nomes: ['TESTE DEBUG', ...]
```

---

## 🎯 O Que Vamos Descobrir

### Cenário 1: empresaId Salvo Corretamente
```
✅ Template salvo com empresaId: f47ac10b-58cc-4372-a567-0e02b2c3d479
🔍 WHERE conditions: {"empresaId":"f47ac10b-58cc-4372-a567-0e02b2c3d479"}
📊 Query retornou 0 templates  ← PROBLEMA: Query não acha o que salvou!
```

**Causa provável**: Problema no TypeORM query ou na coluna do banco.

---

### Cenário 2: empresaId Salvo Diferente
```
✅ Template salvo com empresaId: null  ← OU outro valor!
🔍 WHERE conditions: {"empresaId":"f47ac10b-58cc-4372-a567-0e02b2c3d479"}
📊 Query retornou 0 templates
```

**Causa provável**: Backend não está salvando `empresaId` corretamente.

---

### Cenário 3: Query Retorna Templates
```
📊 Query retornou 5 templates
🏢 empresaIds encontrados: ['outro-id', 'outro-id', ...]
📝 Nomes: ['Template Antigo 1', 'Template Antigo 2', ...]
```

**Causa provável**: Templates existem mas com `empresaId` diferente.

---

## 📋 Checklist de Execução

- [ ] **1. Reiniciar backend** (`npm run start:dev`)
- [ ] **2. Aguardar mensagem** `Nest application successfully started`
- [ ] **3. Criar template de teste** via UI
- [ ] **4. Copiar logs do terminal backend** (criar e listar)
- [ ] **5. Enviar logs completos** para análise
- [ ] **6. Comparar empresaIds** (salvo vs buscado)

---

## ⏱️ Tempo Estimado

- Reiniciar backend: **30 segundos**
- Criar template: **10 segundos**
- Copiar logs: **10 segundos**

**Total**: ~1 minuto

---

## 🚨 IMPORTANTE

**NÃO faça mais tentativas de criar templates sem reiniciar o backend primeiro!**

Os logs só funcionam após reinicialização.

---

**Próxima ação**: Reiniciar backend → Criar template → Enviar logs
