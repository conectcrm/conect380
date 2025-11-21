# 🐛 BUG: Módulos Não São Ativados no Registro

## 📋 Problema

Ao registrar uma nova empresa, os módulos do plano escolhido NÃO são ativados automaticamente.

### Sintomas
- ✅ Empresa é criada com sucesso
- ✅ Usuário é criado com sucesso  
- ✅ Login funciona normalmente
- ❌ **Tabela `empresa_modulos` fica VAZIA**
- ❌ Menu mostra apenas 4 itens (Dashboard, Relatórios, Supervisão, Configurações)
- ❌ Módulos específicos do plano não aparecem

### Impacto
- 🔴 **CRÍTICO**: Empresas recém-registradas não têm acesso às funcionalidades contratadas
- 🔴 Afeta TODOS os planos (STARTER, BUSINESS, ENTERPRISE)
- 🔴 Problema existe desde implementação inicial do sistema de módulos

## 🔍 Investigação Realizada

### 1. Código Analisado

**arquivo**: `backend/src/empresas/empresas.service.ts`

```typescript
// Linha 105-114: Código que DEVERIA ativar módulos
console.log(`🔍 Tentando ativar módulos para plano: "${plano}"`);
const planoEnum = this.mapearPlanoParaEnum(plano);
console.log(`🔍 Plano mapeado para enum:`, planoEnum);

if (planoEnum) {
  await this.empresaModuloService.ativarPlano(empresaSalva.id, planoEnum);
  console.log(`✅ Módulos do plano ${plano} ativados para empresa ${empresaSalva.nome}`);
} else {
  console.error(`❌ Plano "${plano}" não mapeado para enum. Módulos NÃO ativados!`);
}
```

### 2. Logs Não Aparecem

❌ **PROBLEMA CONFIRMADO**: Os `console.log()` adicionados NÃO aparecem nos logs do backend!

Isso indica que o código **NÃO ESTÁ SENDO EXECUTADO**.

### 3. Testes Realizados

```powershell
# Teste 1: Registro manual
$response = Invoke-RestMethod -Uri "http://localhost:3001/empresas/registro" -Method Post -Body $data
# ✅ Sucesso: Empresa criada

# Teste 2: Login
$login = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Body $credentials  
# ✅ Sucesso: Token obtido

# Teste 3: Listar módulos
$modulos = Invoke-RestMethod -Uri "http://localhost:3001/empresas/modulos" -Headers @{ Authorization = "Bearer $token" }
# ❌ FALHA: Array vazio []
```

### 4. Possíveis Causas

#### Causa 1: Transação Rollback (MAS PROVÁVEL)
O código de ativação está APÓS `save()` mas pode estar dentro de uma transação que dá rollback silencioso.

#### Causa 2: Exceção Silenciosa
Alguma exceção está acontecendo mas sendo engolida pelo `try-catch` genérico.

#### Causa 3: Código Não Compilado
O backend não está rodando a versão mais recente (improvável - confirmamos recompilação).

#### Causa 4: Service Não Injetado
`EmpresaModuloService` não foi injetado corretamente (improvável - confirmamos no `empresas.module.ts`).

## 🎯 Solução Proposta

### Opção 1: Usar TypeORM Transaction Manager (RECOMENDADO)

```typescript
async registrarEmpresa(createEmpresaDto: CreateEmpresaDto) {
  return await this.empresaRepository.manager.transaction(async transactionalEntityManager => {
    // 1. Criar empresa
    const empresa = transactionalEntityManager.create(Empresa, empresaData);
    const empresaSalva = await transactionalEntityManager.save(empresa);

    // 2. Criar usuário
    const usuario = transactionalEntityManager.create(User, usuarioData);
    await transactionalEntityManager.save(usuario);

    // 3. Ativar módulos (DENTRO da transação)
    const planoEnum = this.mapearPlanoParaEnum(plano);
    if (planoEnum) {
      const modulos = this.getModulosParaPlano(planoEnum);
      for (const modulo of modulos) {
        const empresaModulo = transactionalEntityManager.create(EmpresaModulo, {
          empresa_id: empresaSalva.id,
          modulo,
          ativo: true,
          plano: planoEnum
        });
        await transactionalEntityManager.save(empresaModulo);
      }
    }

    return empresaSalva;
  });
}

private getModulosParaPlano(plano: PlanoEnum): ModuloEnum[] {
  const mapa = {
    [PlanoEnum.STARTER]: [ModuloEnum.CRM, ModuloEnum.ATENDIMENTO],
    [PlanoEnum.BUSINESS]: [ModuloEnum.CRM, ModuloEnum.ATENDIMENTO, ModuloEnum.VENDAS, ModuloEnum.FINANCEIRO],
    [PlanoEnum.ENTERPRISE]: Object.values(ModuloEnum)
  };
  return mapa[plano] || [];
}
```

### Opção 2: Mover Ativação Para Após Transaction

```typescript
async registrarEmpresa(createEmpresaDto: CreateEmpresaDto) {
  try {
    // 1. Criar empresa e usuário (transação original)
    const empresaSalva = await this.empresaRepository.save(empresaData);
    await this.userRepository.save(usuarioData);

    // 2. Commit implícito aqui

    // 3. Ativar módulos EM SEPARADO (nova operação)
    try {
      const planoEnum = this.mapearPlanoParaEnum(plano);
      if (planoEnum) {
        await this.empresaModuloService.ativarPlano(empresaSalva.id, planoEnum);
        console.log(`✅ Módulos ativados para ${empresaSalva.nome}`);
      }
    } catch (moduloError) {
      // Log mas não falha o registro
      console.error(`⚠️ Erro ao ativar módulos:`, moduloError);
      // IMPORTANTE: Enviar alerta para admin
    }

    return empresaSalva;
  } catch (error) {
    console.error('Erro ao registrar empresa:', error);
    throw new HttpException('Erro interno', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
```

### Opção 3: Debug Mode - Simplificar Para Encontrar Problema

```typescript
async registrarEmpresa(createEmpresaDto: CreateEmpresaDto) {
  console.log('═══ INÍCIO REGISTRO ═══');
  
  try {
    console.log('1. Salvando empresa...');
    const empresaSalva = await this.empresaRepository.save(empresaData);
    console.log(`✅ Empresa salva: ${empresaSalva.id}`);

    console.log('2. Salvando usuário...');
    const usuarioSalvo = await this.userRepository.save(usuarioData);
    console.log(`✅ Usuário salvo: ${usuarioSalvo.id}`);

    console.log('3. Tentando mapear plano...');
    const planoEnum = this.mapearPlanoParaEnum(plano);
    console.log(`✅ Plano mapeado:`, planoEnum);

    if (!planoEnum) {
      console.error(`❌ PLANO NÃO MAPEADO: "${plano}"`);
      throw new Error(`Plano inválido: ${plano}`);
    }

    console.log('4. Chamando ativarPlano...');
    await this.empresaModuloService.ativarPlano(empresaSalva.id, planoEnum);
    console.log('✅ ativarPlano retornou sem erro');

    console.log('5. Verificando módulos salvos...');
    const modulosSalvos = await this.empresaModuloService.listar(empresaSalva.id);
    console.log(`✅ Módulos no banco:`, modulosSalvos.length);

    console.log('═══ FIM REGISTRO ═══');
    return empresaSalva;
  } catch (error) {
    console.error('❌ ERRO NO REGISTRO:', error);
    throw error;
  }
}
```

## 🧪 Próximos Passos

### IMEDIATO (5 min)

1. ✅ Implementar **Opção 3 (Debug Mode)**
2. ✅ Recompilar backend
3. ✅ Testar registro de nova empresa
4. ✅ Analisar logs COMPLETOS
5. ✅ Identificar EXATAMENTE onde falha

### CORREÇÃO (15 min)

Baseado no debug:
- Se falhar na linha 3-4: Problema no mapeamento de plano
- Se falhar na linha 4-5: Problema no `ativarPlano()`
- Se chegar na linha 5 mas modulosSalvos = 0: Problema no `save()` dos módulos

### VALIDAÇÃO (10 min)

1. ✅ Testar 3 planos (STARTER, BUSINESS, ENTERPRISE)
2. ✅ Verificar módulos corretos ativados
3. ✅ Confirmar menu aparece corretamente
4. ✅ Remover logs de debug
5. ✅ Documentar solução final

## 📊 Status Atual

- ❌ **BUG ATIVO**: Módulos não são ativados
- 🟡 **EM INVESTIGAÇÃO**: Código aparentemente correto mas não executa
- 🔴 **BLOQUEADOR**: Impede teste da nova distribuição de planos
- ⏰ **PRIORIDADE**: CRÍTICA

---

**Data**: 2025-11-20 22:52  
**Autor**: GitHub Copilot + Usuario  
**Próxima Ação**: Implementar Debug Mode (Opção 3) para identificar falha exata
