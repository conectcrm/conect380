# Guia de Solução de Problemas de Memória - React

## Problema
Erro: `FATAL ERROR: invalid table size Allocation failed - JavaScript heap out of memory`

## Soluções Implementadas

### 1. Aumento da Memória do Node.js
Modificamos o `package.json` para incluir mais memória:

```json
{
  "scripts": {
    "start": "set PORT=3900 && set NODE_OPTIONS=--max_old_space_size=4096 && react-scripts --openssl-legacy-provider start",
    "start:low-memory": "set PORT=3900 && set NODE_OPTIONS=--max_old_space_size=2048 && react-scripts --openssl-legacy-provider start"
  }
}
```

- **4096 MB**: Para desenvolvimento normal
- **2048 MB**: Para ambientes com menos recursos

### 2. Correção de Imports
- Corrigido import circular no `ProdutosPage.tsx`
- Padronizado exports no `ModalCadastroProdutoSimples.tsx`

### 3. Scripts Disponíveis

#### Comando Principal
```bash
npm start
```
*Inicia com 4GB de memória*

#### Comando para Baixo Recurso
```bash
npm run start:low-memory
```
*Inicia com 2GB de memória*

### 4. Monitoramento de Memória

Para verificar uso de memória:
```bash
# Windows Task Manager
Ctrl + Shift + Esc

# Via terminal (se necessário)
tasklist | findstr node.exe
```

### 5. Limpeza de Cache (se necessário)

```bash
# Limpar cache do npm
npm cache clean --force

# Reinstalar node_modules
rm -rf node_modules
npm install

# Limpar cache do React
rm -rf build
```

### 6. Configurações Alternativas

Se os problemas persistirem, considere:

1. **Reduzir arquivos na pasta examples**
2. **Usar lazy loading para componentes grandes**
3. **Dividir o projeto em chunks menores**

### 7. Troubleshooting

#### Se ainda der erro de memória:
1. Aumente para 6GB: `--max_old_space_size=6144`
2. Feche outras aplicações
3. Reinicie o VS Code

#### Para produção:
```bash
npm run build
```
*Build otimizado que consome menos memória*

---

## Status Atual
✅ Modal horizontal implementado
✅ SelectField com visibilidade corrigida
✅ Scripts de memória configurados
✅ Imports corrigidos
