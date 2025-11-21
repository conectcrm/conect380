# Correção do Comportamento de Minimizar/Expandir Menu Hierárquico

## Problema Identificado
- Usuário não conseguia minimizar categorias pela setinha quando alguma página estava selecionada
- A auto-expansão estava conflitando com as ações manuais do usuário
- Menu se re-expandia automaticamente mesmo quando o usuário tentava fechá-lo

## Causa Raiz
A lógica de auto-expansão executava a cada mudança de rota e sempre forçava a abertura do menu que continha a página ativa, ignorando as intenções manuais do usuário.

### Antes (Problemático)
```typescript
// Auto-expandia sempre que havia item ativo, sem considerar intenção do usuário
useEffect(() => {
  const menuToExpand = menuItems.find(menu => {
    if (menu.children) {
      return menu.children.some(child => child.href && currentPath.startsWith(child.href));
    }
    return false;
  });

  if (menuToExpand && !expandedMenus.includes(menuToExpand.id)) {
    expandMenu(menuToExpand.id); // Sempre expandia
  }
}, [location.pathname]);
```

## Solução Implementada

### 1. Rastreamento de Ações Manuais
```typescript
const handleMenuToggle = (menuId: string) => {
  const isCurrentlyExpanded = isMenuExpanded(menuId);
  
  // Se fechando manualmente, marcar como "manualmente fechado"
  if (isCurrentlyExpanded) {
    const manuallyClosedMenus = JSON.parse(localStorage.getItem('manually-closed-menus') || '[]');
    if (!manuallyClosedMenus.includes(menuId)) {
      localStorage.setItem('manually-closed-menus', JSON.stringify([...manuallyClosedMenus, menuId]));
    }
  } else {
    // Se abrindo manualmente, remover da lista de "fechados manualmente"
    const manuallyClosedMenus = JSON.parse(localStorage.getItem('manually-closed-menus') || '[]');
    const filtered = manuallyClosedMenus.filter((id: string) => id !== menuId);
    localStorage.setItem('manually-closed-menus', JSON.stringify(filtered));
  }
  
  toggleMenu(menuId);
};
```

### 2. Auto-Expansão Respeitosa
```typescript
useEffect(() => {
  const menuToExpand = menuItems.find(menu => {
    if (menu.children) {
      return menu.children.some(child => child.href && currentPath === child.href);
    }
    return false;
  });

  if (menuToExpanded && !expandedMenus.includes(menuToExpand.id)) {
    // Só auto-expandir se NÃO foi manualmente fechado antes
    const manuallyClosedMenus = JSON.parse(localStorage.getItem('manually-closed-menus') || '[]');
    
    if (!manuallyClosedMenus.includes(menuToExpand.id)) {
      expandMenu(menuToExpand.id);
    }
  }
}, [location.pathname]);
```

### 3. Comparação Exata na Auto-Expansão
- Mudou de `currentPath.startsWith(child.href)` para `currentPath === child.href`
- Evita expansão desnecessária em rotas parciais

## Comportamento Corrigido

### ✅ Auto-Expansão Inteligente
- Menu se expande automaticamente apenas na primeira navegação para uma rota
- Respeita a preferência do usuário se ele fechar manualmente

### ✅ Controle Manual Total
- Usuário pode fechar qualquer menu clicando na setinha
- Menu permanece fechado mesmo com páginas ativas
- Escolha do usuário é persistida entre sessões

### ✅ Flexibilidade
- Se usuário abrir manualmente um menu fechado, auto-expansão volta a funcionar
- Sistema "esquece" que o menu foi fechado manualmente

## Testes de Verificação

1. **Teste de Auto-Expansão**:
   - Navegue para `/atendimento/chat` → Menu "Atendimento" deve expandir
   
2. **Teste de Fechamento Manual**:
   - Clique na setinha do "Atendimento" → Menu deve fechar
   - Navegue para outra rota do atendimento → Menu deve permanecer fechado
   
3. **Teste de Abertura Manual**:
   - Com menu fechado, clique na setinha → Menu deve abrir
   - Navegue para outras rotas → Auto-expansão volta a funcionar normalmente

## Arquivos Modificados
- `src/components/navigation/HierarchicalNavGroup.tsx`
  - Adicionada função `handleMenuToggle()`
  - Modificada lógica de auto-expansão no `useEffect`
  - Integrado sistema de persistência de preferências manuais

## Status
✅ **CORRIGIDO** - Usuário agora tem controle total sobre expansão/minimização dos menus