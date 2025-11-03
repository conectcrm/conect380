# 🤖 Guia Completo: Corrigir Fluxo "Triagem Inteligente WhatsApp (cópia)"

**Data**: 29/10/2025  
**Objetivo**: Deixar o fluxo 100% funcional e editável no construtor visual

---

## 🎯 Resumo dos Problemas

### ❌ Problema 1: Token JWT Expirado (BLOQUEADOR)
- **Sintoma**: Fluxos não salvam (erro 401 Unauthorized)
- **Causa**: Token expirou após 7 dias
- **Solução**: Re-login no sistema

### ❌ Problema 2: Núcleos e Departamentos Hardcoded
- **Sintoma**: Bot mostra apenas 3 núcleos fixos (deveria mostrar 6 dinâmicos)
- **Causa**: Fluxo usa `menu_nucleos` em vez de `boas-vindas` (etapa especial)
- **Solução**: Renomear etapa no construtor visual

### ❌ Problema 3: Estrutura incompatível com editor visual
- **Sintoma**: Fluxo pode não renderizar corretamente no construtor
- **Causa**: JSON antigo, pode ter formato incompatível
- **Solução**: Recriar etapas no editor visual

---

## ✅ SOLUÇÃO PASSO A PASSO

### 🔐 ETAPA 1: Fazer Login (OBRIGATÓRIO)

#### 1.1. Abrir página de login
```
URL: http://localhost:3000/login
```

#### 1.2. Fazer login com credenciais de administrador
```
Email: admin@conectcrm.com
Senha: sua_senha_aqui
```

#### 1.3. Verificar se login funcionou
- ✅ Redirecionou para dashboard
- ✅ Menu lateral aparece
- ✅ Sem erros no console (F12)

**⏱️ Tempo estimado**: 1 minuto

---

### 🏗️ ETAPA 2: Abrir Construtor Visual

#### 2.1. Navegar para gestão de fluxos
```
Menu → Gestão → Fluxos de Triagem
ou
URL: http://localhost:3000/gestao/fluxos
```

#### 2.2. Localizar fluxo
Procure por: **"Triagem Inteligente WhatsApp (cópia)"**

#### 2.3. Abrir no editor visual
Clique no ícone: **🎨 Editar Visual** (ícone de pincel/bloco)

#### 2.4. Verificar se carregou
- ✅ Canvas aparece com blocos conectados
- ✅ Sidebar à direita com "Biblioteca de Blocos"
- ✅ Preview WhatsApp à direita
- ✅ Sem erros de loading

**⏱️ Tempo estimado**: 1 minuto

---

### 🔧 ETAPA 3: Corrigir Busca Dinâmica de Núcleos

#### 3.1. Localizar bloco "menu_nucleos"
- Procure no canvas o bloco com o texto "Menu de Núcleos" ou similar
- Deve ser do tipo **Menu** (ícone de lista)

#### 3.2. Clicar no bloco para editar
- Sidebar direita abre configurações
- Veja campo "ID da Etapa"

#### 3.3. **RENOMEAR ID**: `menu_nucleos` → `boas-vindas`
```diff
- ID da Etapa: menu_nucleos
+ ID da Etapa: boas-vindas
```

> **Por quê?** O FlowEngine só ativa busca dinâmica de núcleos quando a etapa se chama exatamente "boas-vindas" (ver linha 115 do flow-engine.ts)

#### 3.4. Atualizar mensagem (opcional)
```
Sugestão de mensagem:
"Olá! 👋 Bem-vindo ao ConectCRM.

Como posso ajudá-lo hoje? Selecione o setor desejado:"
```

#### 3.5. **IMPORTANTE**: Limpar opções fixas
Se houver opções fixas ("Suporte Técnico", "Administrativo", "Comercial"):
- **Remova TODAS** as opções
- Deixe o array de opções **vazio**: `[]`

> **Por quê?** Com etapa "boas-vindas", o backend vai GERAR as opções dinamicamente buscando do banco. Opções fixas serão ignoradas.

#### 3.6. Salvar bloco
- Clique em "Salvar" ou "Aplicar" no sidebar
- Verifique se ID mudou no canvas

**⏱️ Tempo estimado**: 2 minutos

---

### 📋 ETAPA 4: Criar Etapa de Departamentos Dinâmica

#### 4.1. Localizar ou criar bloco de departamentos
Procure bloco após escolha de núcleo (ex: `menu_suporte`)

#### 4.2. **OPÇÃO A**: Renomear bloco existente
Se já existe bloco de departamentos:
```diff
- ID da Etapa: menu_suporte (ou menu_administrativo, menu_comercial)
+ ID da Etapa: escolha-departamento
```

#### 4.3. **OPÇÃO B**: Criar novo bloco
Se não existe:
1. Arraste bloco **"Menu"** da biblioteca
2. Configure:
   ```
   ID: escolha-departamento
   Mensagem: "Escolha o departamento:"
   Opções: [] (vazio)
   ```
3. Conecte após o bloco "boas-vindas"

> **Por quê?** O FlowEngine só ativa busca dinâmica de departamentos quando a etapa se chama exatamente "escolha-departamento" (ver linha 130 do flow-engine.ts)

#### 4.4. Remover blocos hardcoded obsoletos
Se existirem blocos como:
- `menu_suporte` (com departamentos fixos)
- `menu_administrativo` (com departamentos fixos)
- `menu_comercial` (com departamentos fixos)

**REMOVA TODOS!** Eles não serão mais necessários.

#### 4.5. Ajustar conexões
- De `boas-vindas` → diretamente para `escolha-departamento`
- De `escolha-departamento` → para blocos de ação/transferência

**⏱️ Tempo estimado**: 5 minutos

---

### 💾 ETAPA 5: Salvar e Publicar

#### 5.1. Clicar em "Salvar" (botão superior direito)
- Ícone de disquete: 💾
- Aguarde confirmação: "✅ Fluxo salvo com sucesso"

#### 5.2. Validar estrutura
Clique em "Validar" (se houver botão):
- ✅ Sem erros de conexão
- ✅ Sem loops infinitos
- ✅ Todas etapas conectadas

#### 5.3. Publicar fluxo
Clique em "Publicar" (botão com ícone ▶️):
- Confirma que fluxo está pronto para produção
- Torna visível para WhatsApp

#### 5.4. Verificar status
- ✅ Badge "Publicado" aparece
- ✅ Fluxo fica ativo no sistema

**⏱️ Tempo estimado**: 1 minuto

---

### 📱 ETAPA 6: Testar no WhatsApp (Opcional mas Recomendado)

#### 6.1. Abrir WhatsApp Manager
```
Menu → Atendimento → WhatsApp Manager
ou
URL: http://localhost:3000/atendimento/whatsapp
```

#### 6.2. Verificar conexão
- ✅ Status: "Conectado" (verde)
- ✅ QR Code escaneado

#### 6.3. Enviar mensagem de teste
```
Seu número: +55 (XX) XXXXX-XXXX
Mensagem: "Oi"
```

#### 6.4. Verificar resposta do bot
Espera-se:
```
Olá! 👋 Bem-vindo ao ConectCRM.

Como posso ajudá-lo hoje? Selecione o setor desejado:

1️⃣ Atendimento Geral
2️⃣ CSI
3️⃣ Comercial
4️⃣ Financeiro
5️⃣ Suporte Técnico

Digite o número da opção desejada.
```

> **Antes** (hardcoded): Só 3 opções fixas  
> **Depois** (dinâmico): 5-6 opções do banco!

#### 6.5. Testar seleção de núcleo
```
Você: 5 (Suporte Técnico)
Bot: "Escolha o departamento:"
      1️⃣ Suporte Nível 1
      2️⃣ Suporte Nível 2
      3️⃣ Infraestrutura
      (departamentos reais do banco!)
```

#### 6.6. Verificar logs do backend
Console do backend deve mostrar:
```
🤖 FlowEngine.buildResponse() - Etapa: boas-vindas
🔍 Buscando núcleos dinâmicos do banco...
✅ Núcleos filtrados: 5 de 6
📤 Enviando menu com 5 opções
```

**⏱️ Tempo estimado**: 5 minutos

---

## 🎨 Estrutura Final Esperada (Canvas)

```
┌──────────────┐
│   🚀 START   │
│   (início)   │
└──────┬───────┘
       │
       v
┌──────────────────────┐
│   📋 MENU            │
│   boas-vindas        │ ← ID ESPECIAL (busca dinâmica)
│                      │
│ Mensagem:            │
│ "Selecione o setor"  │
│                      │
│ Opções: [] (vazio)   │ ← Gerado automaticamente
└──────┬───────────────┘
       │
       v
┌─────────────────────────┐
│   📋 MENU               │
│   escolha-departamento  │ ← ID ESPECIAL (busca dinâmica)
│                         │
│ Mensagem:               │
│ "Escolha o depto:"      │
│                         │
│ Opções: [] (vazio)      │ ← Gerado automaticamente
└──────┬──────────────────┘
       │
       v
┌──────────────────────────┐
│   ⚡ AÇÃO                │
│   transferir-atendimento │
│                          │
│ Ação: Transferir         │
│ Para: {{departamentoId}} │
└──────────────────────────┘
```

---

## 🔍 Verificação de Sucesso

### ✅ Checklist Final:

- [ ] Login funcionou (novo token JWT)
- [ ] Construtor visual abriu sem erros
- [ ] Etapa `menu_nucleos` renomeada para `boas-vindas`
- [ ] Etapa de departamentos criada/renomeada para `escolha-departamento`
- [ ] Blocos hardcoded removidos (`menu_suporte`, `menu_administrativo`, `menu_comercial`)
- [ ] Fluxo salvo com sucesso
- [ ] Fluxo publicado (status "Publicado")
- [ ] Teste WhatsApp retorna 5-6 núcleos dinâmicos (não 3 fixos)
- [ ] Teste departamentos retorna departamentos reais do banco

---

## 🚨 Troubleshooting

### Problema: "Fluxo não salva" (401 Unauthorized)
**Solução**: Fazer login novamente (Etapa 1)

### Problema: "Núcleos não aparecem dinamicamente"
**Causas possíveis**:
1. ❌ Etapa não se chama exatamente "boas-vindas" → Verifique ID
2. ❌ Opções ainda estão hardcoded no JSON → Limpe array de opções
3. ❌ Backend não está rodando → Verificar porta 3001

**Solução**: Seguir ETAPA 3 novamente com atenção

### Problema: "Departamentos não aparecem"
**Causas possíveis**:
1. ❌ Etapa não se chama "escolha-departamento" → Verifique ID
2. ❌ Núcleo não tem departamentos no banco → Cadastrar departamentos
3. ❌ Conexão entre etapas está quebrada → Revisar edges no canvas

**Solução**: Seguir ETAPA 4 novamente

### Problema: "Construtor visual não abre"
**Causas possíveis**:
1. ❌ Frontend não está rodando → `cd frontend-web && npm start`
2. ❌ Erro no console (F12) → Verificar mensagens de erro
3. ❌ Fluxo tem JSON inválido (loop infinito) → Ver mensagem de erro no topo

**Solução**: 
- Rodar frontend: `npm start`
- Se tiver loop, clicar em "🔧 Corrigir Loops Automaticamente"

### Problema: "Erro ao publicar fluxo"
**Causa**: Validação falhou (etapas desconectadas, loops)

**Solução**: 
1. Clicar em "Validar"
2. Ler erros na lista
3. Corrigir conexões/loops
4. Tentar publicar novamente

---

## 📚 Referências Técnicas

### Arquivos Relevantes:
- `backend/src/modules/triagem/engine/flow-engine.ts` (linha 115, 130) - Lógica de busca dinâmica
- `frontend-web/src/pages/FluxoBuilderPage.tsx` - Construtor visual
- `ANALISE_FLUXO_TRIAGEM_COPIA.md` - Análise do problema hardcoded
- `DIAGNOSTICO_SALVAMENTO_FLUXOS.md` - Problema de token JWT

### IDs Especiais (Gatilhos de Busca Dinâmica):
- `boas-vindas` → Busca núcleos do banco automaticamente
- `escolha-departamento` → Busca departamentos do núcleo escolhido

### Código-fonte da Busca Dinâmica:
```typescript
// flow-engine.ts - linha ~115
if (etapaId === 'boas-vindas') {
  const menuNucleos = await this.resolverMenuNucleos(opcoesMenu, mensagem);
  if (menuNucleos) {
    mensagem = menuNucleos.mensagem;
    opcoesMenu = menuNucleos.opcoes;  // ← BUSCA DO BANCO!
  }
}

// flow-engine.ts - linha ~130
if (etapaId === 'escolha-departamento') {
  const menuDepartamentos = await this.resolverMenuDepartamentos();
  if (menuDepartamentos && 'mensagem' in menuDepartamentos) {
    mensagem = menuDepartamentos.mensagem;
    opcoesMenu = menuDepartamentos.opcoes;  // ← BUSCA DO BANCO!
  }
}
```

---

## ⏱️ Tempo Total Estimado

- **Mínimo** (tudo funciona): 10 minutos
- **Médio** (alguns ajustes): 20 minutos
- **Máximo** (troubleshooting): 30 minutos

---

## 🎯 Resultado Final

Após seguir todas as etapas:

✅ **Fluxo 100% dinâmico**  
✅ **Editável no construtor visual**  
✅ **Sincronizado com banco de dados**  
✅ **Pronto para produção**  

Cadastrou novo núcleo → **Aparece automaticamente no bot**  
Desativou departamento → **Some automaticamente do bot**  

**Zero manutenção manual!** 🚀

---

**Desenvolvido por**: GitHub Copilot + Equipe ConectCRM  
**Data**: 29/10/2025  
**Status**: Pronto para uso
