# Exemplos de Uso - Sistema de Billing ConectCRM

## 1. Protegendo uma Página Completa

```tsx
// src/pages/clientes/index.tsx
import React from 'react';
import { SubscriptionGuard } from '../../components/Billing';

export const ClientesPage = () => {
  return (
    <SubscriptionGuard requiredModule="clientes">
      {/* Conteúdo da página de clientes */}
      <div>
        <h1>Gestão de Clientes</h1>
        {/* Resto do componente */}
      </div>
    </SubscriptionGuard>
  );
};
```

## 2. Verificação Programática

```tsx
// src/components/ClienteForm.tsx
import React from 'react';
import { useSubscriptionGuard, UpgradePrompt } from '../Billing';

export const ClienteForm = () => {
  const { podeExecutarAcao, requiresUpgrade } = useSubscriptionGuard();
  
  const handleSubmit = () => {
    if (!podeExecutarAcao('cliente')) {
      // Mostrar alerta de limite atingido
      return;
    }
    
    // Prosseguir com criação do cliente
  };

  if (requiresUpgrade('clientes')) {
    return (
      <UpgradePrompt 
        module="clientes"
        reason="module-not-included"
        compact={true}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Formulário de cliente */}
    </form>
  );
};
```

## 3. Alert de Limite

```tsx
// src/components/LimiteAlert.tsx
import React from 'react';
import { useSubscription, UpgradePrompt } from '../Billing';

export const LimiteAlert = () => {
  const { calcularProgresso } = useSubscription();
  const progresso = calcularProgresso();
  
  const temLimiteProximo = progresso && (
    progresso.usuarios.percentual > 80 ||
    progresso.clientes.percentual > 80 ||
    progresso.storage.percentual > 80
  );

  if (!temLimiteProximo) return null;

  return (
    <UpgradePrompt 
      reason="limit-reached"
      compact={true}
      onDismiss={() => {/* fechar alert */}}
    />
  );
};
```

## 4. Widget de Uso na Sidebar

```tsx
// src/components/Sidebar/UsageWidget.tsx
import React from 'react';
import { UsageMeter } from '../Billing';

export const UsageWidget = () => {
  return (
    <div className="p-4 border-t">
      <UsageMeter onUpgrade={() => window.location.href = '/billing'} />
    </div>
  );
};
```

## 5. Modal de Upgrade

```tsx
// src/components/UpgradeModal.tsx
import React, { useState } from 'react';
import { PlanSelection } from '../Billing';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-screen overflow-y-auto">
        <PlanSelection
          onPlanSelect={(plano) => {
            console.log('Plano selecionado:', plano);
            onClose();
          }}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
```

## 6. Hook de Verificação em Botões

```tsx
// src/components/ActionButton.tsx
import React from 'react';
import { useSubscriptionGuard } from '../Billing';
import { Button } from '../ui/button';

interface ActionButtonProps {
  action: 'create-user' | 'create-client' | 'upload-file';
  children: React.ReactNode;
  onClick: () => void;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ 
  action, 
  children, 
  onClick 
}) => {
  const { checkAccess } = useSubscriptionGuard();
  
  const getRequirements = (action: string) => {
    switch (action) {
      case 'create-user': return { type: 'usuario' as const };
      case 'create-client': return { type: 'cliente' as const };
      case 'upload-file': return { type: 'storage' as const, quantity: 1024 * 1024 }; // 1MB
      default: return null;
    }
  };

  const requirements = getRequirements(action);
  
  const handleClick = () => {
    if (requirements) {
      const access = checkAccess();
      if (!access.hasAccess) {
        alert(access.message);
        return;
      }
    }
    
    onClick();
  };

  return (
    <Button onClick={handleClick}>
      {children}
    </Button>
  );
};
```

## 7. Integração com React Router

```tsx
// src/routes/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscriptionGuard } from '../components/Billing';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredModule 
}) => {
  const { checkAccess } = useSubscriptionGuard();
  const access = checkAccess(requiredModule);
  
  if (!access.hasAccess) {
    return <Navigate to="/billing" replace />;
  }

  return <>{children}</>;
};
```

## 8. Middleware para API Calls

```tsx
// src/services/apiMiddleware.ts
import { useSubscriptionGuard } from '../components/Billing';

export const useApiMiddleware = () => {
  const { registrarChamadaApi } = useSubscriptionGuard();
  
  const apiCall = async (endpoint: string, options: RequestInit) => {
    // Registrar chamada da API
    const permitido = await registrarChamadaApi();
    
    if (!permitido) {
      throw new Error('Limite de API calls excedido');
    }
    
    return fetch(endpoint, options);
  };
  
  return { apiCall };
};
```
