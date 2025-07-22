# Debug: Filtro Pessoa Jurídica não Funcionando

## 🐛 Problema Identificado

O usuário selecionou "Pessoa Jurídica" no filtro e a tag aparece como ativa, mas todos os 5 registros ainda são exibidos. O filtro não está sendo aplicado corretamente.

## 🔍 Logs de Debug Adicionados

### 1. Frontend - handleTipoChange
```typescript
const handleTipoChange = (tipo: string) => {
  console.log('🔍 Tipo alterado:', tipo);
  console.log('🔍 Valor anterior selectedTipo:', selectedTipo);
  setSelectedTipo(tipo);
  console.log('🔍 Novo valor selectedTipo será:', tipo);
};
```

### 2. Frontend - useEffect de Filtros
```typescript
useEffect(() => {
  console.log('🔄 useEffect filtros executando:', {
    searchTerm,
    selectedStatus,
    selectedTipo
  });
  
  const delayDebounce = setTimeout(() => {
    const newFilters = {
      ...filters,
      search: searchTerm,
      status: selectedStatus,
      tipo: selectedTipo,
      page: 1
    };
    
    console.log('⏰ Aplicando filtros após debounce:', newFilters);
    setFilters(newFilters);
  }, 300);

  return () => clearTimeout(delayDebounce);
}, [searchTerm, selectedStatus, selectedTipo]);
```

### 3. Frontend - useEffect loadClientes
```typescript
useEffect(() => {
  console.log('🚀 loadClientes será executado com filtros:', filters);
  loadClientes();
}, [filters]);
```

### 4. Service - getClientes
```typescript
async getClientes(filters: ClienteFilters = {}): Promise<PaginatedClientes> {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  const queryString = params.toString();
  console.log('🌐 API Request URL:', `${this.baseUrl}?${queryString}`);
  console.log('🔍 Filtros sendo enviados:', filters);
  console.log('🔍 Query params construídos:', Object.fromEntries(params));

  const response = await api.get(`${this.baseUrl}?${queryString}`);
  
  console.log('📊 Resposta da API:', {
    total: response.data.total,
    retornados: response.data.data.length,
    tipos: response.data.data.map((c: any) => ({ nome: c.nome, tipo: c.tipo }))
  });
  
  return response.data;
}
```

### 5. Botão de Debug Temporário
Adicionado botão "DEBUG: Forçar PJ" que:
- Mostra estados atuais no console
- Força aplicação do filtro pessoa_juridica
- Permite testar se o problema é no frontend ou backend

## 🧪 Como Testar Agora

### Passo 1: Limpar Console
1. F12 → Console
2. Ctrl+L para limpar

### Passo 2: Testar Filtro Normal
1. Selecione "Pessoa Jurídica" no dropdown
2. Observe os logs no console:

**Logs esperados:**
```
🔍 Tipo alterado: pessoa_juridica
🔍 Valor anterior selectedTipo: 
🔍 Novo valor selectedTipo será: pessoa_juridica
🔄 useEffect filtros executando: {searchTerm: "", selectedStatus: "", selectedTipo: "pessoa_juridica"}
⏰ Aplicando filtros após debounce: {page: 1, limit: 10, search: "", status: "", tipo: "pessoa_juridica", sortBy: "created_at", sortOrder: "DESC"}
🚀 loadClientes será executado com filtros: {tipo: "pessoa_juridica", ...}
🌐 API Request URL: /clientes?page=1&limit=10&tipo=pessoa_juridica&sortBy=created_at&sortOrder=DESC
🔍 Filtros sendo enviados: {tipo: "pessoa_juridica", ...}
🔍 Query params construídos: {page: "1", limit: "10", tipo: "pessoa_juridica", ...}
📊 Resposta da API: {total: X, retornados: Y, tipos: [...]}
```

### Passo 3: Testar Botão Debug
1. Clique no botão vermelho "DEBUG: Forçar PJ"
2. Observe se força o filtro

### Passo 4: Verificar Network Tab
1. F12 → Network
2. Selecione filtro PJ
3. Procure por request para `/clientes`
4. Verifique URL: deve conter `tipo=pessoa_juridica`
5. Verifique Response: deve retornar apenas pessoas jurídicas

## 🎯 Possíveis Causas

### 1. Problema no Frontend
**Sintomas:**
- Logs não mostram `tipo: "pessoa_juridica"` sendo enviado
- Query params não contém o filtro

**Solução:**
- Verificar se useEffect está executando
- Verificar se estado está sendo atualizado

### 2. Problema no Backend
**Sintomas:**
- Logs mostram filtro sendo enviado corretamente
- API retorna todos os registros mesmo com filtro
- Network tab mostra URL correta mas response errada

**Solução:**
- Verificar implementação do filtro no backend
- Verificar se campo `tipo` existe no banco
- Verificar se valores estão corretos

### 3. Problema na API
**Sintomas:**
- URL está correta
- Filtro é enviado
- Backend ignora o parâmetro

**Solução:**
- Verificar controller de clientes
- Verificar se parâmetro `tipo` é processado
- Verificar query SQL gerada

## 📋 Checklist de Investigação

- [ ] Logs do frontend mostram filtro sendo aplicado
- [ ] URL da API contém `tipo=pessoa_juridica`
- [ ] Resposta da API mostra apenas pessoas jurídicas
- [ ] Tipos dos clientes retornados são todos `pessoa_juridica`
- [ ] Botão debug funciona
- [ ] Filter é aplicado instantaneamente

## 🚨 Status

**EM INVESTIGAÇÃO** - Logs detalhados adicionados. 

**Próximo passo:** Executar teste e analisar logs para identificar onde está falhando.

## 🔧 Remoção dos Logs

Após identificar e corrigir o problema, remover:
1. Console.logs extras
2. Botão de debug temporário
3. Logs desnecessários no service

**Manter apenas logs essenciais para monitoramento.**
