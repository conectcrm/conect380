# Guia de Debug - Erro 400 na Criação de Produtos

## 🔍 Problema Identificado
O erro "Request failed with status code 400" sugere que os dados enviados pelo frontend não estão passando na validação do backend.

## 🛠️ Modificações Realizadas

### 1. Backend - DTO atualizado
- ✅ Adicionado 'aplicativo' no enum de tipoItem em `backend/src/modules/produtos/dto/produto.dto.ts`

### 2. Frontend - Service melhorado
- ✅ Adicionados logs detalhados em `frontend-web/src/services/produtosService.ts`
- ✅ Melhorada a validação e transformação de dados
- ✅ Tratamento mais robusto de tipos de dados

## 🧪 Como Debugar

### Passo 1: Testar o Backend
```bash
# 1. Vá para a pasta do backend
cd c:\Projetos\fenixcrm\backend

# 2. Inicie o backend (se não estiver rodando)
npm run start:dev

# 3. Em outro terminal, teste a API
cd c:\Projetos\fenixcrm
node test-produto-api.js
```

### Passo 2: Testar o Frontend
```bash
# 1. Vá para a pasta do frontend
cd c:\Projetos\fenixcrm\frontend-web

# 2. Inicie o frontend (se não estiver rodando)
npm start

# 3. Abra o navegador em http://localhost:3000
# 4. Abra DevTools (F12) → Console
# 5. Tente criar um produto no modal
# 6. Verifique os logs no console
```

## 📊 Logs Adicionados

### No Console do Browser:
- "Dados do formulário recebidos:" - mostra o que vem do modal
- "Dados transformados para API:" - mostra o que será enviado
- "Dados sendo enviados para API:" - confirma o envio
- "Detalhes do erro:" - detalhes completos do erro 400

### Exemplo de dados esperados:
```json
{
  "nome": "Nome do Produto",
  "categoria": "categoria",
  "preco": 100,
  "tipoItem": "aplicativo",
  "frequencia": "mensal", 
  "unidadeMedida": "licenca",
  "status": "ativo"
}
```

## 🚨 Possíveis Causas do Erro 400

### 1. Campos obrigatórios
- ❌ nome vazio ou undefined
- ❌ categoria vazia ou undefined  
- ❌ preco vazio, undefined ou NaN

### 2. Tipos de dados incorretos
- ❌ preco como string ao invés de number
- ❌ status como boolean ao invés de string

### 3. Valores inválidos para enums
- ❌ tipoItem não está em ['produto', 'servico', 'licenca', 'modulo', 'plano', 'aplicativo']
- ❌ frequencia não está em ['unico', 'mensal', 'anual']
- ❌ unidadeMedida não está em ['unidade', 'saca', 'hectare', 'pacote', 'licenca']
- ❌ status não está em ['ativo', 'inativo', 'descontinuado']

## 🔧 Como Resolver

### Se o erro for nos dados:
1. Verifique os logs do console para ver exatamente o que está sendo enviado
2. Compare com o exemplo de dados esperados acima
3. Verifique se todos os campos obrigatórios estão preenchidos
4. Verifique se os tipos estão corretos (principalmente o preço como number)

### Se o erro for no backend:
1. Verifique os logs do backend no terminal
2. O erro de validação deve aparecer lá com detalhes específicos
3. Verifique se o banco de dados está conectado

## 📞 Próximos Passos

1. **Execute o script de teste**: `node test-produto-api.js`
2. **Verifique os logs no frontend**: F12 → Console quando criar produto
3. **Compartilhe os logs**: Copie e cole os logs que aparecem no console
4. **Teste com dados simples**: Tente criar um produto apenas com nome, categoria e preço

## 🎯 Dados Mínimos para Teste

Tente criar um produto com apenas estes dados:
- Nome: "Produto Teste"
- Categoria: "Teste" 
- Preço: 100
- Tipo: "aplicativo"
- Frequência: "mensal"
- Unidade: "licenca"

Se isso funcionar, o problema está em algum campo adicional.
