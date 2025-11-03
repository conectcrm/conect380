# 📝 Referência Rápida - Configuração dos Blocos

## Copie e Cole nas Configurações

---

### 1️⃣ Boas-vindas (Mensagem)

```
ID: boas-vindas
Nome: Boas-vindas
Tipo: Mensagem

Mensagem:
👋 Olá! Seja bem-vindo ao ConectCRM!

Para melhor atendê-lo, vou precisar de algumas informações.

Próxima Etapa: coleta-nome
```

---

### 2️⃣ Coleta de Nome (Input)

```
ID: coleta-nome
Nome: Coleta de Nome
Tipo: Input

Mensagem:
👤 Por favor, informe seu nome completo:

Variável: nome
Validação: Nome Completo
Obrigatório: SIM

Mensagem de Erro:
❌ Por favor, informe seu nome completo (nome e sobrenome).

Próxima Etapa: coleta-email
```

---

### 3️⃣ Coleta de Email (Input)

```
ID: coleta-email
Nome: Coleta de E-mail
Tipo: Input

Mensagem:
📧 Agora, informe seu e-mail:

Variável: email
Validação: E-mail
Obrigatório: SIM

Mensagem de Erro:
❌ E-mail inválido. Por favor, informe um e-mail válido (ex: seu@email.com).

Próxima Etapa: coleta-empresa
```

---

### 4️⃣ Coleta de Empresa (Input)

```
ID: coleta-empresa
Nome: Coleta de Empresa
Tipo: Input

Mensagem:
🏢 Por último, qual o nome da sua empresa?

Variável: empresa
Validação: Texto (sem validação rígida)
Obrigatório: NÃO

Próxima Etapa: confirmar-dados-cliente
```

---

### 5️⃣ ✨ Confirmação de Dados (Menu) - CRÍTICO!

```
ID: confirmar-dados-cliente
Nome: Confirmação de Dados
Tipo: Menu

Mensagem:
(Qualquer texto - será substituído automaticamente)

Opções: 
(Deixar vazio - sistema processa texto livre)

Próxima Etapa: menu_nucleos
```

**⚠️ ATENÇÃO**: 
- ID deve ser **EXATAMENTE** `confirmar-dados-cliente`
- Não adicione botões/opções manualmente
- Sistema formata automaticamente com emojis

---

### 6️⃣ Menu de Núcleos (Menu)

```
ID: menu_nucleos
Nome: Menu de Núcleos
Tipo: Menu

Mensagem:
Como posso ajudá-lo hoje?

Opções:
(Deixar vazio - preenchido automaticamente com núcleos cadastrados)

Próxima Etapa: (Conectar aos submenus)
```

---

## 🎨 Cores Sugeridas (se editor permitir)

- **Boas-vindas**: Azul claro (#3B82F6)
- **Coleta Nome**: Verde (#10B981)
- **Coleta Email**: Amarelo (#F59E0B)
- **Coleta Empresa**: Roxo (#8B5CF6)
- **✨ Confirmação**: Vermelho (#EF4444) - para destacar
- **Menu Núcleos**: Azul escuro (#1E40AF)

---

## 🔗 Ordem de Conexões

```
Início
  ↓
Boas-vindas
  ↓
Coleta Nome
  ↓
Coleta Email
  ↓
Coleta Empresa
  ↓
✨ Confirmação (SIM/NÃO)
  ↓ (se SIM)
Menu Núcleos
  ↓
Submenus (Suporte, Adm, Comercial)
  ↓
Transferências
```

---

## ✅ Validações Disponíveis

| Tipo | Exemplo Aceito | Exemplo Rejeitado |
|------|----------------|-------------------|
| **Nome Completo** | João Silva | João (só primeiro nome) |
| **E-mail** | joao@empresa.com.br | joao@invalido |
| **Telefone** | (11) 99999-9999 | 123 |
| **CPF** | 123.456.789-00 | 12345 |
| **CNPJ** | 12.345.678/0001-00 | 123456 |
| **Texto** | Qualquer coisa | - |

---

## 🚨 Erros Comuns

❌ **ID com espaço**: `confirmar dados` → ✅ `confirmar-dados-cliente`  
❌ **Tipo errado**: Confirmação como "Input" → ✅ "Menu"  
❌ **Conexões faltando**: Blocos soltos → ✅ Todos conectados  
❌ **Variável sem nome**: Campo vazio → ✅ `nome`, `email`, `empresa`

---

## 💾 Atalhos do Teclado

- **Ctrl+S**: Salvar manualmente
- **Ctrl+Z**: Desfazer
- **Ctrl+Y**: Refazer
- **Delete**: Excluir bloco selecionado
- **Ctrl+A**: Selecionar todos
- **Ctrl+C/V**: Copiar/Colar bloco

---

## 🧪 Teste Rápido

Após publicar, envie no WhatsApp:

```
Você: Oi
Bot: 👋 Olá! Seja bem-vindo...

Você: João Silva
Bot: 📧 Agora, informe seu e-mail:

Você: joao@empresa.com
Bot: 🏢 Por último, qual o nome da sua empresa?

Você: Empresa X
Bot: ✅ *Dados Cadastrados*
     👤 **Nome:** João Silva
     📧 **E-mail:** joao@empresa.com
     ...

Você: SIM
Bot: Como posso ajudá-lo hoje?
     1️⃣ Suporte Técnico
     2️⃣ Administrativo
     ...
```

✅ Se funcionar assim, está PERFEITO!

---

**Imprima esta página e deixe ao lado enquanto edita!** 📄
