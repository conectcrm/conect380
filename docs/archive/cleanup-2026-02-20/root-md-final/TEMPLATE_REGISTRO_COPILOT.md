# 🤖 TEMPLATE PARA REGISTRO DE ARQUIVOS DO COPILOT

## Como usar este template:

### Quando criar um arquivo, adicione uma entrada ao .copilot-registry.md:

```
YYYY-MM-DD TIPO nome-do-arquivo.ext ATIVO "Descrição do propósito do arquivo"
```

### Exemplos de uso:

#### Para arquivo temporário de teste:
```
2025-08-06 TEMP temp-teste-api.js ATIVO "Script temporário para testar endpoints da API"
```

#### Para arquivo de debug:
```
2025-08-06 DEBUG debug-conexao-db.js ATIVO "Script para debugar problemas de conexão com banco"
```

#### Para arquivo de exemplo:
```
2025-08-06 EXAMPLE exemplo-modal-cliente.tsx ATIVO "Exemplo de implementação do modal de cliente"
```

#### Para documentação temporária:
```
2025-08-06 DOC TEMP_FUNCIONALIDADE_X.md ATIVO "Documentação temporária durante desenvolvimento"
```

#### Para script utilitário:
```
2025-08-06 SCRIPT setup-ambiente-dev.js ATIVO "Script para configurar ambiente de desenvolvimento"
```

### Tipos disponíveis:

- **TEMP**: Arquivos temporários (removidos após 7 dias se não ativos)
- **TEST**: Arquivos de teste (removidos se não referenciados)
- **DEBUG**: Scripts de debug (removidos quando não utilizados)
- **EXAMPLE**: Exemplos (removidos após implementação)
- **SCRIPT**: Scripts utilitários (avaliados caso a caso)
- **DOC**: Documentação (temporária vs permanente)
- **PROD**: Arquivos de produção (NUNCA removidos)

### Status disponíveis:

- **ATIVO**: Arquivo em uso
- **OBSOLETO**: Arquivo pode ser removido
- **REMOVIDO**: Arquivo já foi removido

### Regras importantes:

1. **Sempre registre** arquivos que você criar
2. **Use prefixos claros** no nome (temp-, test-, debug-, exemplo-)
3. **Marque como OBSOLETO** quando não precisar mais
4. **Descreva o propósito** claramente
5. **Não registre** arquivos de produção críticos

### Automação:

O sistema irá automaticamente:
- Remover arquivos TEMP após 7 dias
- Remover arquivos TEST/DEBUG/EXAMPLE sem referências
- Atualizar status para REMOVIDO após remoção
- Buscar arquivos órfãos não registrados

### Para marcar arquivo como obsoleto:
Simplesmente mude ATIVO para OBSOLETO no registro:
```
2025-08-06 TEMP temp-teste-api.js OBSOLETO "Não precisamos mais deste teste"
```
