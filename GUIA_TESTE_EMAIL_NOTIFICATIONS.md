# 📧 Guia de Teste - Email Notifications

**Data**: 15 de Novembro de 2025  
**Status**: Sistema pronto para testes  
**Versão**: 1.1

---

## ✅ Pré-requisitos Verificados

- ✅ **Backend rodando**: `http://localhost:3001` (porta 3001)
- ✅ **Variáveis .env configuradas**:
  ```env
  GMAIL_USER=conectcrm@gmail.com
  GMAIL_PASSWORD=*********** (configurado)
  EMAIL_FROM=noreply@conectcrm.com
  EMAIL_FROM_NAME=Conect CRM
  FRONTEND_URL=http://localhost:3900
  ```
- ✅ **CotacaoEmailService**: Criado e integrado
- ✅ **Templates HTML**: Profissionais com design verde/vermelho
- ✅ **Sem erros TypeScript**: Código validado

---

## 🧪 Roteiro de Testes

### Passo 1: Iniciar Frontend

```powershell
cd frontend-web
npm start
```

**Aguarde** o frontend compilar e abrir automaticamente em `http://localhost:3000`

---

### Passo 2: Fazer Login

1. Acesse: `http://localhost:3000`
2. Faça login com suas credenciais
3. Sistema deve redirecionar para dashboard

---

### Passo 3: Acessar Cotações

1. Menu lateral: **Comercial** → **Cotações**
2. Ou acesse direto: `http://localhost:3000/comercial/cotacoes`
3. Deve exibir lista de cotações com 5 cards KPI

---

### Passo 4: Testar Aprovação com Email

#### 4.1. Selecionar Cotação

- Escolha uma cotação com status **"Em Análise"** (amarelo)
- **IMPORTANTE**: Certifique-se que a cotação tem email válido:
  - Email do usuário que criou (`criadoPor.email`)
  - OU email da empresa (`empresa.email`)

#### 4.2. Aprovar Cotação

1. Clique no botão **"✅ Aprovar"** na cotação
2. Modal abrirá com 2 etapas:
   - **Etapa 1**: Confirmação
   - **Etapa 2**: Justificativa (opcional para aprovação)
3. Preencha justificativa (opcional): Ex: "Proposta aprovada conforme reunião de 15/11"
4. Clique em **"Confirmar Aprovação"**

#### 4.3. Verificar Logs Backend

**ABRA O TERMINAL DO BACKEND** e procure por:

```
✅ Email de aprovação enviado com sucesso para: email@exemplo.com
```

**OU, se houver erro**:

```
❌ Erro ao enviar email de aprovação: [detalhes do erro]
```

**Se não encontrar email**:

```
⚠️ Cotação sem email válido. Email não enviado.
```

#### 4.4. Verificar Inbox

1. Abra o email cadastrado na cotação
2. Verifique a caixa de entrada (pode levar 10-30 segundos)
3. **Se não encontrar**: Verificar pasta **Spam/Lixo Eletrônico**

#### 4.5. Validar Template de Aprovação

O email deve ter:

- ✅ **Header verde** com gradiente (#16A34A → #15803D)
- ✅ **Ícone ✅** grande no topo
- ✅ **Box verde claro** (#F0FDF4) com informações:
  - Número da cotação
  - Empresa
  - Valor formatado (ex: R$ 15.000,00)
  - Nome do aprovador
  - Data e hora
- ✅ **Box cinza** com justificativa (se preenchida)
- ✅ **Botão verde** "Ver Cotação no Sistema"
- ✅ **Footer** com aviso de email automático
- ✅ **Responsivo** (testar abrir no celular)

---

### Passo 5: Testar Reprovação com Email

#### 5.1. Selecionar Outra Cotação

- Escolha outra cotação com status **"Em Análise"**
- Novamente, verificar que tem email válido

#### 5.2. Reprovar Cotação

1. Clique no botão **"❌ Reprovar"** na cotação
2. Modal abrirá com 2 etapas:
   - **Etapa 1**: Confirmação
   - **Etapa 2**: Justificativa (**OBRIGATÓRIA** para reprovação)
3. Preencha justificativa: Ex: "Valores acima do orçamento aprovado"
4. Clique em **"Confirmar Reprovação"**

#### 5.3. Verificar Logs Backend

Procure por:

```
✅ Email de reprovação enviado com sucesso para: email@exemplo.com
```

#### 5.4. Verificar Inbox

1. Abra o email cadastrado na cotação
2. Novo email deve ter chegado
3. Verificar spam se necessário

#### 5.5. Validar Template de Reprovação

O email deve ter:

- ❌ **Header vermelho** com gradiente (#DC2626 → #B91C1C)
- ❌ **Ícone ❌** grande no topo
- ❌ **Box vermelho claro** (#FEF2F2) com informações da cotação
- ❌ **Box vermelho** com título **"Motivo da Reprovação:"** e justificativa
- ❌ **Botão vermelho** "Ver Cotação no Sistema"
- ❌ **Footer** igual ao de aprovação
- ❌ **Responsivo**

---

## 📊 Checklist de Validação

### Funcionalidade

- [ ] Backend iniciado sem erros
- [ ] Frontend acessível em localhost:3000
- [ ] Login funcional
- [ ] Página de cotações carrega
- [ ] Modal de aprovação abre corretamente
- [ ] Modal de reprovação abre corretamente
- [ ] Justificativa opcional em aprovação
- [ ] Justificativa obrigatória em reprovação
- [ ] Status muda após aprovação (verde)
- [ ] Status muda após reprovação (vermelho)

### Email - Aprovação

- [ ] Log "Email enviado" aparece no console backend
- [ ] Email chega na caixa de entrada (ou spam)
- [ ] Template tem header verde
- [ ] Ícone ✅ aparece no topo
- [ ] Informações da cotação corretas
- [ ] Nome do aprovador correto
- [ ] Data/hora formatada (DD/MM/AAAA HH:MM)
- [ ] Justificativa aparece (se preenchida)
- [ ] Botão "Ver Cotação" funciona
- [ ] Layout responsivo (desktop + mobile)

### Email - Reprovação

- [ ] Log "Email enviado" aparece no console backend
- [ ] Email chega na caixa de entrada (ou spam)
- [ ] Template tem header vermelho
- [ ] Ícone ❌ aparece no topo
- [ ] Informações da cotação corretas
- [ ] Nome do aprovador correto
- [ ] Título "Motivo da Reprovação:" aparece
- [ ] Justificativa aparece no box vermelho
- [ ] Botão "Ver Cotação" funciona
- [ ] Layout responsivo

---

## 🐛 Troubleshooting

### Problema: Email não chega

**Possíveis causas**:

1. **Cotação sem email válido**
   - Solução: Editar cotação e adicionar email em `criadoPor` ou `empresa`

2. **Email na pasta spam**
   - Solução: Verificar pasta Lixo Eletrônico/Spam

3. **Credenciais Gmail incorretas**
   - Solução: Verificar `GMAIL_USER` e `GMAIL_PASSWORD` no `.env`
   - Gerar nova "Senha de App" do Gmail se necessário

4. **Firewall bloqueando SMTP**
   - Solução: Verificar porta 587 (SMTP) está liberada

### Problema: Erro "Authentication failed" no console

**Solução**:

1. Acessar: https://myaccount.google.com/security
2. Ativar "Verificação em duas etapas"
3. Ir em "Senhas de app"
4. Gerar nova senha para "Outro (Nome personalizado)"
5. Copiar senha gerada (16 caracteres sem espaços)
6. Atualizar `GMAIL_PASSWORD` no `.env` com nova senha
7. Reiniciar backend: `npm run start:dev`

### Problema: Template sem formatação

**Possíveis causas**:

1. **Cliente de email não suporta HTML**
   - Solução: Testar em Gmail web, Outlook, Apple Mail

2. **CSS inline quebrado**
   - Solução: Verificar código do template em `cotacao-email.service.ts`

### Problema: Botão "Ver Cotação" não funciona

**Causa**: `FRONTEND_URL` incorreto no `.env`

**Solução**:

1. Verificar qual porta o frontend está usando (3000 ou 3900)
2. Atualizar `FRONTEND_URL=http://localhost:PORTA` no `.env`
3. Reiniciar backend

---

## 📋 Logs Esperados no Backend

### Aprovação bem-sucedida:

```
[15/11/2025, 22:10:35] [INFO][CotacaoService] Cotação COT-2025-001 aprovada por João Silva
✅ Email de aprovação enviado com sucesso para: cliente@empresa.com
```

### Reprovação bem-sucedida:

```
[15/11/2025, 22:12:18] [INFO][CotacaoService] Cotação COT-2025-002 reprovada por Maria Santos
✅ Email de reprovação enviado com sucesso para: fornecedor@exemplo.com
```

### Cotação sem email:

```
[15/11/2025, 22:15:42] [WARN][CotacaoEmailService] Cotação sem email válido. Email não enviado.
```

### Erro de autenticação:

```
[15/11/2025, 22:18:55] [ERROR][CotacaoEmailService] Erro ao enviar email: Invalid login: 535-5.7.8 Username and Password not accepted
```

---

## 🎯 Critérios de Sucesso

Para considerar o sistema **100% funcional**, você deve:

- ✅ Aprovar 1 cotação e receber email verde
- ✅ Reprovar 1 cotação e receber email vermelho
- ✅ Verificar que justificativa aparece corretamente
- ✅ Confirmar que templates são responsivos
- ✅ Validar que botão "Ver Cotação" redireciona corretamente
- ✅ Ver logs de sucesso no console backend
- ✅ Confirmar que aprovação/reprovação funciona mesmo se email falhar (async)

---

## 📸 Screenshots Esperados

### Email de Aprovação:
```
┌─────────────────────────────────────────┐
│     [Verde com Gradiente]               │
│           ✅ (ícone grande)             │
│   COTAÇÃO APROVADA COM SUCESSO!         │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ [Box Verde Claro]                 │  │
│  │ Cotação: #COT-2025-001            │  │
│  │ Empresa: Acme Corporation         │  │
│  │ Valor: R$ 15.000,00               │  │
│  │ Aprovado por: João Silva          │  │
│  │ Data: 15/11/2025 22:10            │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ [Box Cinza - se justificativa]    │  │
│  │ Justificativa: Proposta aprovada  │  │
│  └───────────────────────────────────┘  │
│                                         │
│      [Botão Verde: Ver Cotação]         │
│                                         │
│  ────────────────────────────────────   │
│  Email automático - Conect CRM          │
└─────────────────────────────────────────┘
```

### Email de Reprovação:
```
┌─────────────────────────────────────────┐
│     [Vermelho com Gradiente]            │
│           ❌ (ícone grande)             │
│   COTAÇÃO REPROVADA                     │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ [Box Vermelho Claro]              │  │
│  │ Cotação: #COT-2025-002            │  │
│  │ Empresa: Beta Ltda                │  │
│  │ Valor: R$ 8.500,00                │  │
│  │ Reprovado por: Maria Santos       │  │
│  │ Data: 15/11/2025 22:12            │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ [Box Vermelho]                    │  │
│  │ Motivo da Reprovação:             │  │
│  │ Valores acima do orçamento        │  │
│  └───────────────────────────────────┘  │
│                                         │
│      [Botão Vermelho: Ver Cotação]      │
│                                         │
│  ────────────────────────────────────   │
│  Email automático - Conect CRM          │
└─────────────────────────────────────────┘
```

---

## 🚀 Próximos Passos Após Testes

Se todos os testes passarem:

1. ✅ Marcar "Email Notifications" como **100% validado**
2. 🎯 Decidir próxima melhoria:
   - **Opção A**: Aprovação em Lote (1-2h)
   - **Opção B**: Dashboard de Analytics (2-3h)
   - **Opção C**: Outra prioridade

---

## 📝 Notas Importantes

- ⚠️ **Emails são assíncronos**: Aprovação/reprovação funciona mesmo se email falhar
- ⚠️ **Logs sempre aparecem**: Console backend mostra sucesso ou erro
- ⚠️ **Gmail requer senha de app**: Não é a senha normal da conta
- ⚠️ **SMTP porta 587**: Se firewall bloquear, emails não saem
- ⚠️ **Frontend_URL importante**: Define link do botão "Ver Cotação"

---

**Última atualização**: 15 de Novembro de 2025, 22:05  
**Responsável**: Sistema de Aprovação ConectCRM  
**Versão do Sistema**: 1.1
