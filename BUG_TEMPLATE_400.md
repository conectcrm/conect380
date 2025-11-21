# 🐛 BUG REPORT - Templates de Mensagens

**Data**: 7/nov/2025 - 21:00  
**Status**: ❌ ERRO 400 ao criar template

---

## 📋 Descrição do Erro

**Endpoint**: `POST /atendimento/templates?empresaId=f47ac10b-58cc-4372-a567-0e02b2c3d479`  
**Status Code**: 400 (Bad Request)  
**Erro**: `AxiosError {message: 'Request failed with status code 400', ...}`

---

## 🔍 Análise

### Frontend está enviando:
```json
{
  "nome": "string",
  "conteudo": "string",
  "categoria": "string" (opcional),
  "atalho": "string" (opcional)
}
```

### Backend espera (CriarTemplateDto):
```typescript
{
  nome: string;         // @IsString() - obrigatório
  conteudo: string;     // @IsString() - obrigatório
  categoria?: string;   // @IsOptional() @IsString()
  atalho?: string;      // @IsOptional() @IsString()
  variaveis?: string[]; // @IsOptional() @IsArray() @IsString({ each: true })
}
```

---

## 🛠️ Correções Aplicadas

### 1. Frontend - Remover campo `variaveis` vazio
**Arquivo**: `frontend-web/src/pages/GestaoTemplatesPage.tsx`

**ANTES**:
```typescript
await messageTemplateService.criar(formData, empresaId);
// Enviava: { nome, conteudo, categoria, atalho, variaveis: [] }
```

**DEPOIS**:
```typescript
const dataToSend = {
  nome: formData.nome,
  conteudo: formData.conteudo,
  categoria: formData.categoria || undefined,
  atalho: formData.atalho || undefined,
};
await messageTemplateService.criar(dataToSend as CreateMessageTemplateDto, empresaId);
// Envia: { nome, conteudo, categoria?, atalho? }
// Backend extrai variaveis automaticamente
```

---

## ✅ Próximos Passos

1. **Testar novamente** no navegador:
   - Recarregar página (Ctrl + F5)
   - Tentar criar template "Boas-vindas"
   - Verificar se erro 400 persiste

2. **Se erro persistir**:
   - Verificar logs do backend no terminal
   - Capturar payload exato enviado (Network tab)
   - Verificar se há validação adicional no DTO

3. **Se funcionar**:
   - ✅ Marcar correção como aprovada
   - Continuar testes do checklist
   - Atualizar RESULTADOS_TESTES_TEMPLATES.md

---

## 📝 Observações

- Backend tem `ValidationPipe` com `whitelist: true`
- Campos opcionais devem ser `undefined`, não `''` (string vazia)
- Backend extrai variáveis automaticamente via regex: `/{{[^}]+}}/g`

---

**Status**: ⏳ Aguardando reteste após correção
