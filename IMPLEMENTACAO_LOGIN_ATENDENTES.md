# 🔐 Sistema de Login para Atendentes - Guia de Implementação

**Data**: Janeiro 2025  
**Objetivo**: Permitir que atendentes façam login no sistema após serem cadastrados  
**Status**: 📋 PLANEJADO

---

## 🎯 Problema Identificado

Atualmente:
- ✅ Existe tabela `atendentes` com campos: nome, email, **usuarioId** (nullable)
- ✅ Existe tabela `users` com autenticação (email, senha, JWT)
- ❌ **PROBLEMA**: Ao cadastrar atendente, não é criado um User correspondente
- ❌ **RESULTADO**: Atendente não consegue fazer login!

### Estrutura Atual

```sql
-- Tabela users (login do sistema)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  nome VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  senha VARCHAR (hash bcrypt),
  role ENUM('admin', 'manager', 'vendedor', 'user'),
  empresa_id UUID,
  ativo BOOLEAN DEFAULT true,
  primeira_senha BOOLEAN DEFAULT false  -- ⚡ CAMPO NOVO (pendente migration)
);

-- Tabela atendentes (perfil de atendimento)
CREATE TABLE atendentes (
  id UUID PRIMARY KEY,
  nome VARCHAR(100),
  email VARCHAR(100),
  usuarioId UUID NULLABLE,  -- ⚠️ FK para users, mas nullable!
  empresaId UUID,
  status VARCHAR DEFAULT 'OFFLINE',
  capacidadeMaxima INT DEFAULT 5,
  ticketsAtivos INT DEFAULT 0
);
```

---

## ✅ Solução Proposta: Criação Automática de User

### Fluxo Completo

```
GESTOR                  BACKEND                    DATABASE                ATENDENTE
  |                       |                           |                        |
  |-- Cadastra Atendente -|                           |                        |
  |   (nome, email)       |                           |                        |
  |                       |                           |                        |
  |                       |-- Verifica se User existe |                        |
  |                       |   com email               |                        |
  |                       |                           |                        |
  |                       |-- SE NÃO EXISTE:          |                        |
  |                       |   1. Gera senha aleatória |                        |
  |                       |      (ex: "Temp2025xyz")  |                        |
  |                       |   2. Hash bcrypt          |                        |
  |                       |   3. Cria User            |                        |
  |                       |      role: 'user'         |                        |
  |                       |      primeira_senha: true |                        |
  |                       |------------------->       |                        |
  |                       |                    INSERT users                    |
  |                       |<-------------------       |                        |
  |                       |                    User.id = UUID                  |
  |                       |                           |                        |
  |                       |-- Cria Atendente          |                        |
  |                       |   usuarioId = User.id     |                        |
  |                       |------------------->       |                        |
  |                       |                    INSERT atendentes               |
  |                       |<-------------------       |                        |
  |                       |                           |                        |
  |<-- Retorna:           |                           |                        |
  |    ✅ Atendente criado |                           |                        |
  |    📧 Senha: "Temp2025xyz"                        |                        |
  |    (exibir na tela)   |                           |                        |
  |                       |                           |                        |
  |----- Passa senha manualmente para atendente -----|                        |
  |                                                    |                        |
  |                                                    |-- Atendente acessa ---> |
  |                                                    |   http://sistema.com/login
  |                                                    |   Email: joao@empresa.com
  |                                                    |   Senha: Temp2025xyz
  |                                                    |                        |
  |                                                    |<-- POST /auth/login ---|
  |                                                    |                        |
  |                                                    |-- ⚠️ VERIFICAR:        |
  |                                                    |   user.primeira_senha? |
  |                                                    |                        |
  |                                                    |-- SE true:             |
  |                                                    |<-- Redirecionar -------|
  |                                                    |   para /trocar-senha   |
  |                                                    |                        |
  |                                                    |<-- Define nova senha --|
  |                                                    |   Nova: "MinhaS3nh@123"|
  |                                                    |                        |
  |                                                    |-- PUT /auth/trocar-senha
  |                                                    |   1. Valida senha antiga
  |                                                    |   2. Hash nova senha
  |                                                    |   3. primeira_senha = false
  |                                                    |                        |
  |                                                    |<-- ✅ Senha alterada --|
  |                                                    |                        |
  |                                                    |<-- Faz login normal ---|
  |                                                    |                        |
  |                                                    |<-- Acessa chat --------|
  |                                                    |   /atendimento/chat    |
```

---

## 📋 Tarefas de Implementação

### 1️⃣ Database (PENDENTE)

**Arquivo**: Criar migration manual  
**Ação**: Adicionar coluna `primeira_senha` na tabela `users`

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS primeira_senha BOOLEAN NOT NULL DEFAULT false;
```

**Alternativa temporária**: Como está dando problema com migrations complexas, podemos usar um campo existente ou adicionar direto no banco via PGAdmin.

---

### 2️⃣ Backend - Service de Atendentes

**Arquivo**: `backend/src/modules/atendimento/services/atendente.service.ts` (CRIAR)

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Atendente, StatusAtendente } from '../entities/atendente.entity';
import { User, UserRole } from '../../users/user.entity';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AtendenteService {
  constructor(
    @InjectRepository(Atendente)
    private atendenteRepo: Repository<Atendente>,
    
    @InjectRepository(User)
    private userRepo: Repository<User>,
    
    private usersService: UsersService,
  ) {}

  /**
   * Gera senha aleatória temporária
   * Formato: Temp + Ano + 3 letras aleatórias
   * Ex: "Temp2025xyz"
   */
  private gerarSenhaTemporaria(): string {
    const ano = new Date().getFullYear();
    const letras = Math.random().toString(36).substring(2, 5);
    return `Temp${ano}${letras}`;
  }

  /**
   * Criar atendente + user automaticamente
   */
  async criar(dto: CriarAtendenteDto, empresaId: string) {
    // 1. Verificar se email já existe (atendente)
    const atendenteExistente = await this.atendenteRepo.findOne({
      where: { email: dto.email, empresaId },
    });
    
    if (atendenteExistente) {
      throw new BadRequestException('Email já cadastrado como atendente');
    }

    // 2. Verificar se User já existe
    let user = await this.usersService.findByEmail(dto.email);
    let senhaTemporaria: string | null = null;

    if (!user) {
      // 3. Criar User automaticamente
      senhaTemporaria = this.gerarSenhaTemporaria();
      const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

      user = await this.usersService.create({
        nome: dto.nome,
        email: dto.email,
        senha: senhaHash,
        telefone: dto.telefone || null,
        empresa_id: empresaId,
        role: UserRole.USER,
        // primeira_senha: true,  // ⚠️ Quando migration rodar
      });
    }

    // 4. Criar Atendente vinculado ao User
    const atendente = this.atendenteRepo.create({
      ...dto,
      empresaId,
      usuarioId: user.id,
      status: StatusAtendente.OFFLINE,
    });

    await this.atendenteRepo.save(atendente);

    // 5. Retornar com senha temporária (se gerou)
    return {
      atendente,
      senhaTemporaria,  // ⚡ IMPORTANTE: Frontend vai exibir isso!
      usuarioCriado: !!senhaTemporaria,
    };
  }
}
```

---

### 3️⃣ Backend - Controller de Atendentes

**Arquivo**: `backend/src/modules/atendimento/controllers/atendentes.controller.ts`

**Modificação no método `criar()`**:

```typescript
@Post()
async criar(@Req() req, @Body() dto: CriarAtendenteDto) {
  const empresaId = req.user.empresa_id || req.user.empresaId;

  const resultado = await this.atendenteService.criar(dto, empresaId);

  return {
    success: true,
    message: resultado.usuarioCriado 
      ? 'Atendente criado! Usuário gerado automaticamente.'
      : 'Atendente criado e vinculado ao usuário existente',
    data: resultado.atendente,
    senhaTemporaria: resultado.senhaTemporaria,  // ⚡ Frontend vai pegar isso!
  };
}
```

---

### 4️⃣ Backend - AuthService (Detectar Primeira Senha)

**Arquivo**: `backend/src/modules/auth/auth.service.ts`

**Modificar método `login()`**:

```typescript
async login(user: User) {
  // ⚠️ VERIFICAR SE É PRIMEIRA SENHA
  if (user.primeira_senha) {  // ou user.ativo === false (temporário)
    return {
      success: false,
      action: 'TROCAR_SENHA',
      message: 'Você precisa trocar sua senha temporária antes de continuar',
      userId: user.id,
      email: user.email,
    };
  }

  // Login normal
  const payload = { 
    email: user.email, 
    sub: user.id, 
    empresa_id: user.empresa_id,
    role: user.role 
  };

  await this.usersService.updateLastLogin(user.id);

  return {
    success: true,
    data: {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
    },
  };
}
```

**Adicionar método `trocarSenha()`**:

```typescript
async trocarSenha(userId: string, senhaAntiga: string, senhaNova: string) {
  const user = await this.usersService.findById(userId);

  if (!user) {
    throw new UnauthorizedException('Usuário não encontrado');
  }

  // Validar senha antiga
  const senhaValida = await bcrypt.compare(senhaAntiga, user.senha);
  if (!senhaValida) {
    throw new UnauthorizedException('Senha antiga incorreta');
  }

  // Atualizar senha
  const senhaHash = await bcrypt.hash(senhaNova, 10);
  await this.usersService.update(userId, {
    senha: senhaHash,
    primeira_senha: false,  // ⚡ Marcar como senha permanente
  });

  return {
    success: true,
    message: 'Senha alterada com sucesso! Faça login novamente.',
  };
}
```

**Adicionar rota no controller**:

```typescript
@Post('trocar-senha')
async trocarSenha(@Body() dto: { userId: string; senhaAntiga: string; senhaNova: string }) {
  return this.authService.trocarSenha(dto.userId, dto.senhaAntiga, dto.senhaNova);
}
```

---

### 5️⃣ Frontend - Modal de Senha Temporária

**Arquivo**: `frontend-web/src/pages/GestaoAtendentesPage.tsx`

**Modificar `handleSubmit()`**:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) {
    toast.error('Por favor, corrija os erros no formulário');
    return;
  }

  try {
    setLoading(true);
    let response;
    
    if (editingAtendente) {
      response = await atendenteService.atualizar(editingAtendente.id, formData);
      toast.success('Atendente atualizado com sucesso!');
    } else {
      response = await atendenteService.criar(formData);
      
      // ⚡ VERIFICAR SE GEROU SENHA TEMPORÁRIA
      if (response.senhaTemporaria) {
        // Exibir modal com senha
        toast.success('Atendente cadastrado! Senha temporária gerada.');
        setMostrarSenhaTemporaria({
          nome: formData.nome,
          email: formData.email,
          senha: response.senhaTemporaria,
        });
      } else {
        toast.success('Atendente cadastrado com sucesso!');
      }
    }
    
    await carregarAtendentes();
    setShowDialog(false);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar atendente';
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};
```

**Adicionar modal de senha temporária**:

```tsx
{mostrarSenhaTemporaria && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Atendente Cadastrado!
        </h2>
        <p className="text-gray-600">
          Uma senha temporária foi gerada
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600 mb-2">Nome:</p>
        <p className="text-lg font-semibold text-gray-900 mb-4">
          {mostrarSenhaTemporaria.nome}
        </p>

        <p className="text-sm text-gray-600 mb-2">Email:</p>
        <p className="text-lg font-semibold text-gray-900 mb-4">
          {mostrarSenhaTemporaria.email}
        </p>

        <p className="text-sm text-gray-600 mb-2">Senha Temporária:</p>
        <div className="flex items-center justify-between bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
          <p className="text-xl font-mono font-bold text-yellow-900">
            {mostrarSenhaTemporaria.senha}
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(mostrarSenhaTemporaria.senha);
              toast.success('Senha copiada!');
            }}
            className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Copiar
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          ⚠️ <strong>Importante:</strong> Anote esta senha e passe para o atendente.
          No primeiro login, ele será solicitado a trocar a senha.
        </p>
      </div>

      <button
        onClick={() => setMostrarSenhaTemporaria(null)}
        className="w-full px-4 py-2 bg-[#9333EA] text-white rounded-lg hover:bg-[#7E22CE]"
      >
        Entendi
      </button>
    </div>
  </div>
)}
```

---

### 6️⃣ Frontend - Tela de Troca de Senha

**Arquivo**: `frontend-web/src/pages/TrocarSenhaPage.tsx` (CRIAR)

```tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Lock, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

interface LocationState {
  userId: string;
  email: string;
}

const TrocarSenhaPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [formData, setFormData] = useState({
    senhaAntiga: '',
    senhaNova: '',
    confirmarSenha: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    antiga: false,
    nova: false,
    confirmar: false,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.senhaNova !== formData.confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (formData.senhaNova.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/trocar-senha', {
        userId: state.userId,
        senhaAntiga: formData.senhaAntiga,
        senhaNova: formData.senhaNova,
      });

      toast.success('Senha alterada com sucesso! Faça login novamente.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao trocar senha';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Trocar Senha
          </h1>
          <p className="text-gray-600">
            Defina uma nova senha para sua conta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Senha Antiga */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha Temporária
            </label>
            <div className="relative">
              <input
                type={showPasswords.antiga ? 'text' : 'password'}
                value={formData.senhaAntiga}
                onChange={(e) => setFormData({ ...formData, senhaAntiga: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, antiga: !showPasswords.antiga })}
                className="absolute right-3 top-2.5 text-gray-500"
              >
                {showPasswords.antiga ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Nova Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showPasswords.nova ? 'text' : 'password'}
                value={formData.senhaNova}
                onChange={(e) => setFormData({ ...formData, senhaNova: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, nova: !showPasswords.nova })}
                className="absolute right-3 top-2.5 text-gray-500"
              >
                {showPasswords.nova ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirmar ? 'text' : 'password'}
                value={formData.confirmarSenha}
                onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirmar: !showPasswords.confirmar })}
                className="absolute right-3 top-2.5 text-gray-500"
              >
                {showPasswords.confirmar ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TrocarSenhaPage;
```

---

### 7️⃣ Frontend - Modificar LoginPage

**Arquivo**: `frontend-web/src/pages/LoginPage.tsx`

**Modificar handleSubmit**:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    setLoading(true);
    const response = await api.post('/auth/login', {
      email: formData.email,
      senha: formData.senha,
    });

    // ⚠️ VERIFICAR SE PRECISA TROCAR SENHA
    if (response.data.action === 'TROCAR_SENHA') {
      navigate('/trocar-senha', {
        state: {
          userId: response.data.userId,
          email: response.data.email,
        },
      });
      return;
    }

    // Login normal
    localStorage.setItem('token', response.data.data.access_token);
    localStorage.setItem('user', JSON.stringify(response.data.data.user));
    
    toast.success('Login realizado com sucesso!');
    navigate('/');
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login';
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};
```

---

### 8️⃣ Frontend - Registrar Rotas

**Arquivo**: `frontend-web/src/App.tsx`

```tsx
import TrocarSenhaPage from './pages/TrocarSenhaPage';

// ...

<Route path="/trocar-senha" element={<TrocarSenhaPage />} />
```

---

## 🧪 Como Testar

### Teste 1: Cadastro de Atendente

1. Acessar `/gestao/atendentes`
2. Clicar em "Novo Atendente"
3. Preencher:
   - Nome: "João Silva"
   - Email: "joao@teste.com"
   - Telefone: "(11) 98765-4321"
4. Clicar em "Salvar"
5. **Esperado**:
   - ✅ Modal aparece com senha temporária
   - ✅ Senha formato: "Temp2025xyz"
   - ✅ Botão "Copiar" funciona
   - ✅ Toast: "Atendente cadastrado!"

### Teste 2: Login com Senha Temporária

1. Fazer logout (se logado)
2. Ir para `/login`
3. Entrar com:
   - Email: "joao@teste.com"
   - Senha: "Temp2025xyz" (a que apareceu no modal)
4. **Esperado**:
   - ✅ Redireciona para `/trocar-senha`
   - ✅ Não entra no sistema ainda

### Teste 3: Trocar Senha

1. Na tela `/trocar-senha`:
   - Senha temporária: "Temp2025xyz"
   - Nova senha: "MinhaS3nh@123"
   - Confirmar: "MinhaS3nh@123"
2. Clicar em "Alterar Senha"
3. **Esperado**:
   - ✅ Toast: "Senha alterada com sucesso!"
   - ✅ Redireciona para `/login`

### Teste 4: Login Normal

1. Na tela de login:
   - Email: "joao@teste.com"
   - Senha: "MinhaS3nh@123" (a nova)
2. **Esperado**:
   - ✅ Entra no sistema normalmente
   - ✅ Pode acessar chat
   - ✅ Não pede mais troca de senha

---

## 📊 Checklist de Implementação

- [ ] 1. Adicionar coluna `primeira_senha` na tabela `users` (migration ou manual)
- [ ] 2. Criar `AtendenteService` com método `criar()` que gera User
- [ ] 3. Modificar `AtendentesController` para usar service
- [ ] 4. Adicionar método `gerarSenhaTemporaria()` no service
- [ ] 5. Modificar `AuthService.login()` para detectar primeira senha
- [ ] 6. Criar método `AuthService.trocarSenha()`
- [ ] 7. Criar rota `POST /auth/trocar-senha`
- [ ] 8. Modificar `GestaoAtendentesPage` para exibir modal de senha
- [ ] 9. Criar `TrocarSenhaPage.tsx`
- [ ] 10. Modificar `LoginPage` para redirecionar se primeira senha
- [ ] 11. Registrar rota `/trocar-senha` em `App.tsx`
- [ ] 12. Testar fluxo completo end-to-end

---

## 🎯 Alternativa Simplificada (Sem Migration)

Se a migration continuar dando problema, podemos usar uma abordagem temporária:

**Em vez de `primeira_senha`**, usar:
- `ativo = false` → Marca como precisa trocar senha
- Depois de trocar → `ativo = true`

**Modificar apenas**:
```typescript
// No criar User:
ativo: false,  // Em vez de primeira_senha: true

// No login:
if (!user.ativo) {  // Em vez de user.primeira_senha
  return { action: 'TROCAR_SENHA', ... };
}

// Ao trocar senha:
ativo: true,  // Em vez de primeira_senha: false
```

**Vantagem**: Não precisa de migration!  
**Desvantagem**: Campo `ativo` perde significado original (mas pode ser aceitável temporariamente)

---

**Última atualização**: Janeiro 2025  
**Status**: Documentação completa - Aguardando implementação  
**Próximo passo**: Escolher se resolve migration ou usa alternativa com `ativo`
