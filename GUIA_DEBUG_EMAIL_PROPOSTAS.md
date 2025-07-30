# 🔍 GUIA DE DEBUG - BOTÕES DE EMAIL DAS PROPOSTAS

## Passos para Debug:

### 1. Acesse a página de propostas
- Abra o navegador em: http://localhost:3900
- Navegue até a página de propostas

### 2. Abra o Console do Navegador
- Pressione F12 ou clique com botão direito > Inspecionar
- Vá para a aba "Console"

### 3. Verifique os Logs
Procure pelos seguintes logs no console:

#### 📊 Logs da Conversão (PropostasPage.tsx)
```
🔄 [CONVERTER] Processando proposta X:
   - ID: XXX
   - Status: "XXX"
   - Cliente original: ...
   - Tipo do cliente: object/string
   📦 Cliente OBJETO - Nome: "...", Email: "..."
   OU
   📝 Cliente STRING - Nome original: "..."
   📧 Email GERADO para cliente string "...": ...@cliente.temp
   ✅ RESULTADO final: {...}
   ✅ cliente_contato final: "..."
```

#### 🔍 Logs dos Botões (PropostaActions.tsx)
```
🔍 DEBUG getClienteData - proposta: {...}
📦 Proposta COMPLETA - resultado: {...}
OU
📝 Proposta UI - cliente_contato: "..."
📝 Proposta UI - tipo cliente_contato: string
✅ Email válido detectado: ...
OU
❌ cliente_contato não é email nem telefone válido
📝 Proposta UI - resultado final: {...}
```

### 4. Teste Específico
Cole este código no console para análise detalhada:

```javascript
// Verificar botões de email
const emailButtons = document.querySelectorAll('[title*="email"], [title*="Email"]');
console.log('📧 Botões de email encontrados:', emailButtons.length);

emailButtons.forEach((btn, i) => {
  console.log(`Botão ${i+1}:`, {
    disabled: btn.disabled,
    title: btn.title,
    classList: btn.classList.toString()
  });
});

// Verificar se getClienteData está funcionando
if (window.React) {
  console.log('React disponível - Debug mais profundo possível');
}
```

### 5. O que Procurar:

#### ✅ Situação CORRETA:
- `cliente_contato` com email válido (formato: xxx@xxx.xxx)
- Botão com `disabled: false`
- Título: "Enviar por email"

#### ❌ Situação PROBLEMÁTICA:
- `cliente_contato` vazio ou inválido
- Botão com `disabled: true`
- Título: "Cliente sem email"

### 6. Teste Manual:
- Tente clicar nos botões de email das propostas
- Verifique se aparecem como clicáveis (não acinzentados)
- Observe os logs no console durante o clique

## Resultados Esperados:

Se a correção funcionou:
- Propostas com clientes em formato string devem gerar emails automaticamente
- Todos os botões de email devem ficar clicáveis
- Logs devem mostrar emails gerados no formato: `nome.sobrenome@cliente.temp`

Se ainda há problemas:
- Verificar se a função `converterPropostaParaUI` está sendo chamada
- Verificar se os emails gerados estão chegando ao componente `PropostaActions`
- Verificar se há outros fatores causando o `disabled=true`
