# Debug: Filtro Pessoa Jurídica não está funcionando

## 🐛 Problema Identificado

O filtro "Pessoa Jurídica" não está filtrando os dados corretamente quando selecionado.

## 🔍 Logs de Debug Adicionados

### 1. Frontend - handleTipoChange
```typescript
const handleTipoChange = (tipo: string) => {
  console.log('🔍 Filtro por tipo alterado:', tipo);
  setFilters(prev => {
    const newFilters = { ...prev, tipo: tipo === 'todos' ? '' : tipo, page: 1 };
    console.log('🔍 Novos filtros aplicados:', newFilters);
    return newFilters;
  });
};
```

### 2. Frontend - loadClientes
```typescript
const loadClientes = async () => {
  try {
    console.log('🔍 Carregando clientes com filtros:', filters);
    const data = await clientesService.getClientes(filters);
    console.log('🔍 Dados recebidos:', data.data.map(c => ({ nome: c.nome, tipo: c.tipo })));
  } catch (error) {
    // ...
  }
};
```

### 3. Service - getClientes
```typescript
async getClientes(filters: ClienteFilters = {}): Promise<PaginatedClientes> {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  console.log('🔍 Parâmetros enviados para API:', params.toString());
  console.log('🔍 Filtros originais:', filters);

  const response = await api.get(`${this.baseUrl}?${params.toString()}`);
  return response.data;
}
```

## 🧪 Como Testar

### Passo 1: Abrir Console do Navegador
1. F12 para abrir DevTools
2. Ir na aba Console
3. Limpar o console (Ctrl+L)

### Passo 2: Testar o Filtro
1. Na tela de clientes, selecionar "Pessoa Jurídica" no filtro de tipo
2. Observar os logs no console:
   - ✅ "🔍 Filtro por tipo alterado: pessoa_juridica"
   - ✅ "🔍 Novos filtros aplicados: {tipo: 'pessoa_juridica', ...}"
   - ✅ "🔍 Carregando clientes com filtros: {tipo: 'pessoa_juridica', ...}"
   - ✅ "🔍 Parâmetros enviados para API: tipo=pessoa_juridica&..."

### Passo 3: Verificar Resposta
1. Observar se a API retorna apenas clientes pessoa jurídica
2. Verificar se a tabela é atualizada corretamente

## 🔧 Possíveis Causas

### 1. Backend não está processando o filtro
- **Verificar**: Se o backend está ignorando o parâmetro `tipo`
- **Solução**: Implementar filtro no backend

### 2. Valor do filtro está incorreto
- **Verificar**: Se o valor "pessoa_juridica" está correto
- **Solução**: Verificar se o backend espera outro formato

### 3. Cache do navegador
- **Verificar**: Se há cache interferindo
- **Solução**: Hard refresh (Ctrl+Shift+R)

### 4. Erro na API
- **Verificar**: Network tab para ver se há erros HTTP
- **Solução**: Corrigir erro na API

## 📊 Dados de Teste Esperados

Com o filtro "Pessoa Jurídica" ativo, deveria mostrar apenas:
- Guilherme Paiva
- MULTSOFT DESENVOLVIMENTO DE SISTEMAS LTDA - EPP  
- Beatriz Dos Santos
- Dhonleno Lopes Freitas

E **NÃO** mostrar:
- Marenilde Dos Santos (se for pessoa física)

## 🎯 Próximos Passos

1. **Executar teste** com logs ativos
2. **Analisar console** para identificar onde está falhando
3. **Verificar backend** se necessário
4. **Corrigir problema** identificado
5. **Remover logs** após correção

## 🚨 Status

**Em investigação** - Logs de debug adicionados para identificar a causa raiz.
