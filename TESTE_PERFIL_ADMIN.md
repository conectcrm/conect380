# Instruções para Simular Usuário Administrador

Para testar o seletor de perfil, você pode temporariamente modificar o contexto de autenticação ou criar um usuário mock com perfil de administrador.

## Opção 1: Modificar temporariamente o contexto AuthContext

No arquivo `src/contexts/AuthContext.tsx`, você pode adicionar uma propriedade mock para simular um usuário admin:

```typescript
// Adicionar esta linha temporariamente no contexto
const mockAdminUser = {
  id: '1',
  nome: 'Admin Teste',
  email: 'admin@teste.com',
  perfil: 'admin',
  tipo: 'admin',
  role: 'admin'
};

// E retornar este usuário no contexto:
const contextValue = {
  user: mockAdminUser, // Usar mockAdminUser temporariamente
  // ... resto do contexto
};
```

## Opção 2: Modificar a função de determinação de perfil

No arquivo `DashboardRouter.tsx`, você pode forçar o modo admin temporariamente:

```typescript
// Substituir temporariamente:
const perfilOriginal: PerfilUsuario = 'admin'; // Forçar admin
const isAdmin = true; // Forçar modo admin
```

## Opção 3: Criar um botão de debug (Recomendado)

Adicionar um botão de desenvolvimento que simula diferentes perfis de usuário.

## Como Testar:

1. **Acesse o dashboard** - você deve ver o seletor de perfil no topo
2. **Clique no seletor** - verá as opções de perfil disponíveis
3. **Selecione "Vendedor"** - deve carregar o VendedorDashboard
4. **Selecione "Gestor"** - deve carregar o DashboardPage (gerencial)
5. **Outros perfis** - mostrarão o dashboard do gestor (fallback) até serem implementados

## Recursos do Seletor:

✅ **Visual diferenciado** - Cada perfil tem ícone e cor específica
✅ **Descrições** - Explicam o que cada perfil visualiza
✅ **Indicação visual** - Mostra qual perfil está ativo
✅ **Badge "Modo Admin"** - Indica que está no modo de visualização de administrador
✅ **Dica de uso** - Explica o propósito da funcionalidade
✅ **Apenas para admins** - Não aparece para usuários comuns

## Próximas Implementações:

- [ ] OperacionalDashboard
- [ ] FinanceiroDashboard
- [ ] SuporteDashboard
- [ ] Persistir seleção de perfil na sessão
- [ ] Log de auditoria das mudanças de perfil
