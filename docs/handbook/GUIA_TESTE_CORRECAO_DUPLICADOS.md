# ✅ Guia de Teste: Validação da Correção de Canais Duplicados

Este guia te ajuda a validar que a correção está funcionando corretamente.

---

## 🧪 Teste 1: Verificar Estado Inicial do Banco

**Objetivo**: Confirmar que o banco está limpo (apenas 1 canal)

```bash
node visualizar-canais.js
```

**Resultado Esperado**:
```
📊 Total de canais: 1
📋 Canais por tipo:
   WHATSAPP: 1 canal(is)
✅ Nenhum canal duplicado!
```

---

## 🧪 Teste 2: Salvar Configuração Múltiplas Vezes

**Objetivo**: Verificar que salvar várias vezes NÃO cria canais duplicados

### Passo a Passo

1. **Iniciar Frontend**:
   ```bash
   cd frontend-web
   npm start
   ```

2. **Abrir Navegador**:
  - Acesse: http://localhost:3000
  - Login: admin@conectsuite.com.br / admin123
   - Console do navegador: F12 → Aba "Console"

3. **Ir para Integrações**:
   - Menu: Configurações → Integrações
   - Seção: WhatsApp Business API

4. **Salvar 1ª Vez**:
   - Modificar qualquer campo (ex: Business Account ID)
   - Clicar "Salvar Configuração"
   - **Observar Console**:
     ```javascript
     🔍 [Frontend] Verificando se canal existe: whatsapp
     ➕ [Frontend] Nenhum canal existente, criando novo
     🔍 [Frontend] Enviando configuração: { method: 'POST' }
     ✅ [Frontend] Resposta de sucesso
     ```
   - Mensagem na tela: "Integração whatsapp criada com sucesso!"

5. **Salvar 2ª Vez** (chave do teste):
   - Modificar qualquer campo novamente
   - Clicar "Salvar Configuração"
   - **Observar Console**:
     ```javascript
     🔍 [Frontend] Verificando se canal existe: whatsapp
     ✅ [Frontend] Canal existente encontrado: df104dd2-...
     🔍 [Frontend] Enviando configuração: { method: 'PUT' }
     ✅ [Frontend] Resposta de sucesso
     ```
   - Mensagem na tela: "Integração whatsapp atualizada com sucesso!" ← ATENÇÃO: "atualizada" não "criada"

6. **Salvar 3ª Vez**:
   - Repetir processo
   - Deve continuar mostrando **PUT** e **"atualizada"**

### ✅ Critérios de Sucesso

| Tentativa | Método | Mensagem | Status |
|-----------|--------|----------|--------|
| 1ª vez | POST | "criada com sucesso" | ✅ Correto |
| 2ª vez | **PUT** | **"atualizada com sucesso"** | ✅ Correto |
| 3ª vez | **PUT** | **"atualizada com sucesso"** | ✅ Correto |

### ❌ Comportamento Problemático (Antigo)

Se ainda estiver com o bug:
| Tentativa | Método | Mensagem | Status |
|-----------|--------|----------|--------|
| 1ª vez | POST | "criada com sucesso" | ✅ OK |
| 2ª vez | POST | "criada com sucesso" | ❌ ERRADO |
| 3ª vez | POST | "criada com sucesso" | ❌ ERRADO |

---

## 🧪 Teste 3: Verificar Banco Após Salvamentos

**Objetivo**: Confirmar que continua com apenas 1 canal

```bash
node visualizar-canais.js
```

**Resultado Esperado**:
```
📊 Total de canais: 1  ← DEVE CONTINUAR 1
📋 Canais por tipo:
   WHATSAPP: 1 canal(is)
✅ Nenhum canal duplicado!
```

**❌ Se mostrar mais de 1**: A correção não está ativa. Verifique se o código do frontend foi salvo e recompilado.

---

## 🧪 Teste 4: Verificar Merge de Propriedades

**Objetivo**: Confirmar que atualizar um campo NÃO apaga os outros

### Cenário de Teste

1. **Estado Inicial** - Canal com todas propriedades:
   ```json
   {
     "whatsapp_api_token": "TOKEN123",
     "whatsapp_phone_number_id": "704423209430762",
     "whatsapp_business_account_id": "1922786558561358",
     "whatsapp_webhook_verify_token": "conectcrm_webhook_token_123"
   }
   ```

2. **Atualizar APENAS o Token**:
   - Modificar apenas "Token da API"
   - Deixar outros campos em branco ou não modificar
   - Clicar "Salvar"

3. **Verificar no Banco**:
   ```bash
   node visualizar-canais.js
   ```
   ou via SQL:
   ```sql
   SELECT configuracao FROM atendimento_canais WHERE tipo = 'WHATSAPP';
   ```

4. **✅ Resultado Esperado**:
   ```json
   {
     "credenciais": {
       "whatsapp_api_token": "TOKEN_NOVO",  ← Atualizado
       "whatsapp_phone_number_id": "704423209430762",  ← Preservado
       "whatsapp_business_account_id": "1922786558561358",  ← Preservado
       "whatsapp_webhook_verify_token": "conectcrm_webhook_token_123"  ← Preservado
     }
   }
   ```

5. **❌ Comportamento Problemático** (se merge não funcionar):
   ```json
   {
     "credenciais": {
       "whatsapp_api_token": "TOKEN_NOVO",  ← Atualizado
       // ❌ Outras propriedades PERDIDAS
     }
   }
   ```

---

## 🧪 Teste 5: Teste Automatizado

**Objetivo**: Script automatizado que valida o fluxo completo

Crie este script de teste (`test-duplicados-corrigidos.js`):

```javascript
const fetch = require('node-fetch');

async function testarDuplicados() {
  const token = 'SEU_TOKEN_AQUI'; // Ou fazer login programaticamente
  
  // 1. Contar canais inicial
  const resp1 = await fetch('http://localhost:3001/api/atendimento/canais', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const canaisInicial = (await resp1.json()).data;
  console.log(`📊 Canais iniciais: ${canaisInicial.length}`);
  
  // 2. Salvar 3x
  for (let i = 1; i <= 3; i++) {
    const body = {
      tipo: 'whatsapp',
      nome: 'WHATSAPP Principal',
      configuracao: {
        credenciais: {
          whatsapp_api_token: `TOKEN_TESTE_${i}`
        }
      }
    };
    
    // Frontend deve fazer GET primeiro para verificar se existe
    const canalExistente = canaisInicial.find(c => c.tipo === 'whatsapp');
    const method = canalExistente ? 'PUT' : 'POST';
    const url = canalExistente 
      ? `http://localhost:3001/api/atendimento/canais/${canalExistente.id}`
      : 'http://localhost:3001/api/atendimento/canais';
    
    console.log(`\n🔄 Tentativa ${i}: ${method} ${url}`);
    
    const resp = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const result = await resp.json();
    console.log(`✅ Resultado: ${result.message}`);
  }
  
  // 3. Contar canais final
  const resp2 = await fetch('http://localhost:3001/api/atendimento/canais', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const canaisFinal = (await resp2.json()).data;
  console.log(`\n📊 Canais finais: ${canaisFinal.length}`);
  
  // 4. Validar
  if (canaisFinal.length === canaisInicial.length) {
    console.log('✅ TESTE PASSOU: Nenhum canal duplicado criado!');
  } else {
    console.log('❌ TESTE FALHOU: Canais duplicados foram criados!');
    console.log(`   Esperado: ${canaisInicial.length}, Obtido: ${canaisFinal.length}`);
  }
}

testarDuplicados();
```

**Executar**:
```bash
node test-duplicados-corrigidos.js
```

**Resultado Esperado**:
```
📊 Canais iniciais: 1

🔄 Tentativa 1: POST ...
✅ Resultado: Canal criado com sucesso

🔄 Tentativa 2: PUT ...
✅ Resultado: Canal atualizado com sucesso

🔄 Tentativa 3: PUT ...
✅ Resultado: Canal atualizado com sucesso

📊 Canais finais: 1
✅ TESTE PASSOU: Nenhum canal duplicado criado!
```

---

## 🔍 Troubleshooting

### Problema: Ainda criando duplicados

**Sintomas**:
- Console mostra sempre POST
- Mensagem sempre "criada com sucesso"
- `visualizar-canais.js` mostra múltiplos canais

**Soluções**:

1. **Verificar se o código foi salvo**:
   ```bash
   # No VSCode, verificar se o arquivo não tem asterisco (*) não salvo
   # Ctrl+S para salvar
   ```

2. **Verificar se o frontend recompilou**:
   ```bash
   # No terminal do frontend, procurar por:
   # "webpack compiled successfully"
   # "Compiled successfully!"
   ```

3. **Limpar cache do navegador**:
   - F12 → Application → Clear storage → Clear site data
   - Ou Ctrl+Shift+Delete → Limpar cache

4. **Restartar frontend**:
   ```bash
   # Ctrl+C no terminal do frontend
   npm start
   ```

5. **Verificar arquivo correto**:
   ```bash
   # Confirmar que está editando o arquivo certo:
   code frontend-web/src/pages/configuracoes/IntegracoesPage.tsx
   # Procurar por: "Verificando se canal existe"
   ```

---

## 📊 Checklist de Validação Completa

- [ ] `visualizar-canais.js` mostra 1 canal
- [ ] Salvar 1ª vez: método POST, mensagem "criada"
- [ ] Salvar 2ª vez: método PUT, mensagem "atualizada"
- [ ] Salvar 3ª vez: método PUT, mensagem "atualizada"
- [ ] `visualizar-canais.js` continua mostrando 1 canal
- [ ] Merge de propriedades funciona (nenhuma perdida)
- [ ] Console do navegador mostra logs corretos
- [ ] Sem erros no console do navegador
- [ ] Sem erros no console do backend

---

## ✅ Se Todos os Testes Passarem

**Parabéns!** 🎉 A correção está funcionando perfeitamente. Você pode:

1. ✅ Prosseguir com os testes de webhook
2. ✅ Commit das mudanças
3. ✅ Aplicar constraint no banco (recomendado)
4. ✅ Documentar no README da equipe

---

## 🚀 Próximo Passo

Agora que os canais estão corretos, execute os testes de integração do webhook:

```bash
.\executar-testes.ps1 -Teste Integracao
```

O teste usará o canal WhatsApp único e limpo do banco.

---

**Boa sorte com os testes!** 🚀
