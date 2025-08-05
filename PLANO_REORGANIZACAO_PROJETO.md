# Plano de Reorganização - ConectCRM

## Estado Atual
- **Total de arquivos na raiz**: ~300+ arquivos
- **Arquivos de teste/debug**: ~150 arquivos
- **Documentação MD**: ~80 arquivos
- **Scripts duplicados**: .bat e .ps1 (20+ arquivos)

## Problemas Identificados

### 1. Arquivos de Teste/Debug Espalhados
- `test-*.js` (25+ arquivos)
- `teste-*.js` (60+ arquivos) 
- `debug-*.js` (20+ arquivos)
- Todos na raiz do projeto

### 2. Scripts Duplicados
- Scripts .bat e .ps1 com mesma funcionalidade
- Scripts de inicialização espalhados
- Falta padronização Windows/Unix

### 3. Documentação Desorganizada
- 80+ arquivos .md na raiz
- Nomes inconsistentes (MAIÚSCULO vs minúsculo)
- Sem categorização

### 4. Estrutura Frontend Inconsistente
- `frontend/` (vazio?)
- `frontend-web/` (principal)
- Confusão sobre qual usar

## Plano de Reorganização

### Fase 1: Criar Nova Estrutura de Pastas
```
conectcrm/
├── apps/
│   ├── backend/
│   ├── frontend-web/
│   └── mobile/
├── docs/
│   ├── api/
│   ├── features/
│   ├── guides/
│   └── troubleshooting/
├── scripts/
│   ├── build/
│   ├── deploy/
│   ├── setup/
│   └── utils/
├── tests/
│   ├── integration/
│   ├── e2e/
│   └── debug/
├── tools/
│   └── development/
└── config/
    └── environment/
```

### Fase 2: Mover Arquivos de Teste/Debug
**Destino**: `tests/`
- `tests/integration/` - Testes de API e integração
- `tests/debug/` - Scripts de debug
- `tests/e2e/` - Testes end-to-end

### Fase 3: Reorganizar Scripts
**Destino**: `scripts/`
- `scripts/setup/` - Scripts de configuração inicial
- `scripts/build/` - Scripts de build e deploy
- `scripts/utils/` - Utilitários diversos

### Fase 4: Reorganizar Documentação
**Destino**: `docs/`
- `docs/api/` - Documentação de APIs
- `docs/features/` - Documentação de funcionalidades
- `docs/guides/` - Guias de uso
- `docs/troubleshooting/` - Correções e soluções

### Fase 5: Limpeza de Duplicados
- Remover arquivos obsoletos
- Consolidar scripts duplicados
- Atualizar referências

## Arquivos para Exclusão (Candidatos)

### Scripts Obsoletos/Duplicados
- Manter apenas .ps1 (Windows PowerShell é padrão)
- Remover .bat duplicados

### Testes Obsoletos
- Arquivos de teste com datas antigas
- Testes que não rodam mais
- Debug scripts não utilizados

### Documentação Duplicada
- Arquivos MD com conteúdo similar
- Versões antigas de documentos

## Prioridades

1. **ALTA**: Mover testes/debug (melhora desenvolvimento)
2. **ALTA**: Organizar scripts (facilita automação)
3. **MÉDIA**: Reorganizar docs (melhora manutenção)
4. **BAIXA**: Renomear pastas principais (requer atualizações)

## Benefícios Esperados

- ✅ Redução de 70% dos arquivos na raiz
- ✅ Estrutura mais profissional
- ✅ Facilita navegação e manutenção
- ✅ Melhora onboarding de novos desenvolvedores
- ✅ Facilita automação CI/CD
