# 🎯 SOLUÇÃO: Bug Módulos Não Ativam

## 📊 Status: CAUSA RAIZ IDENTIFICADA

### ✅ Descobertas

1. **Código ESTÁ executando** ✅
   - Logs aparecem com `process.stdout.write()`
   - Visto: "✅ [DEBUG] ATIVAÇÃO CONCLUÍDA"
   - Controller e Service são chamados

2. **Problema está no método `ativar()`** ❌
   - O loop chama `await this.ativar()` para cada módulo
   - Mas os registros **NÃO são salvos no banco**
   - Tabela `empresa_modulos` fica vazia

3. **Possível Causa**: Transaction Context
   - O repositório `empresaModuloRepository` pode não estar no mesmo contexto de transação
   - Ou há alguma validação/constraint falhando silenciosamente

## 🔍 Próxima Ação: Verificar o Método `ativar()`

Precisamos adicionar logs detalhados NO método `ativar()` para ver:
- Se ele é chamado
- Se cria o objeto
- **Se o save() é bem-sucedido**
- **Se há alguma exceção engolida**

### Código Atual (empresa-modulo.service.ts linha ~100)

```typescript
async ativar(empresa_id: string, dto: CreateEmpresaModuloDto): Promise<EmpresaModulo> {
  console.log(`       🔹 [ativar] Iniciando - Empresa: ${empresa_id}, Módulo: ${dto.modulo}`);
  
  const existente = await this.empresaModuloRepository.findOne({
    where: { empresa_id, modulo: dto.modulo },
  });

  if (existente) {
    // ... atualizar
  }

  // Criar novo
  const novoModulo = this.empresaModuloRepository.create({
    empresa_id,
    modulo: dto.modulo,
    ativo: dto.ativo !== undefined ? dto.ativo : true,
    data_expiracao: dto.data_expiracao ? new Date(dto.data_expiracao) : null,
    plano: dto.plano || PlanoEnum.STARTER,
  });

  const salvo = await this.empresaModuloRepository.save(novoModulo);
  console.log(`       ✅ [ativar] Novo módulo criado (ID: ${salvo.id})`);
  return salvo;
}
```

### 🐛 Possível Bug

O `save()` pode estar:
1. **Falhando silenciosamente** (erro engolido)
2. **Salvando mas em transação que dá rollback**
3. **Validação do TypeORM falhando** (empresa_id inválido?)

## ✅ SOLUÇÃO PROPOSTA

### Opção 1: Add Try-Catch Explícito

```typescript
async ativar(empresa_id: string, dto: CreateEmpresaModuloDto): Promise<EmpresaModulo> {
  process.stdout.write(`\n       🔹 [ativar] Empresa: ${empresa_id}, Módulo: ${dto.modulo}\n`);
  
  try {
    const existente = await this.empresaModuloRepository.findOne({
      where: { empresa_id, modulo: dto.modulo },
    });

    if (existente) {
      process.stdout.write(`       📝 [ativar] Atualizando existente ID: ${existente.id}\n`);
      await this.empresaModuloRepository.update(existente.id, {
        ativo: true,
        data_ativacao: new Date(),
        plano: dto.plano || existente.plano,
      });
      return existente;
    }

    process.stdout.write(`       ➕ [ativar] Criando novo registro...\n`);
    const novoModulo = this.empresaModuloRepository.create({
      empresa_id,
      modulo: dto.modulo,
      ativo: true,
      plano: dto.plano || PlanoEnum.STARTER,
    });
    
    process.stdout.write(`       💾 [ativar] Salvando no banco...\n`);
    const salvo = await this.empresaModuloRepository.save(novoModulo);
    process.stdout.write(`       ✅ [ativar] Salvo! ID: ${salvo.id}\n`);
    
    // ⚡ VERIFICAÇÃO IMEDIATA
    const verificacao = await this.empresaModuloRepository.findOne({
      where: { id: salvo.id }
    });
    
    if (!verificacao) {
      throw new Error(`CRÍTICO: Módulo salvo (ID: ${salvo.id}) mas não encontrado no banco!`);
    }
    
    return salvo;
    
  } catch (error) {
    process.stdout.write(`       ❌ [ativar] ERRO: ${error.message}\n`);
    process.stdout.write(`       ❌ [ativar] Stack: ${error.stack}\n`);
    throw error;
  }
}
```

### Opção 2: Usar Query Builder Direto

Se o problema for com o EntityManager, usar SQL direto:

```typescript
async ativar(empresa_id: string, dto: CreateEmpresaModuloDto): Promise<EmpresaModulo> {
  // Tentar inserir direto com query builder
  const result = await this.empresaModuloRepository
    .createQueryBuilder()
    .insert()
    .into(EmpresaModulo)
    .values({
      empresa_id,
      modulo: dto.modulo,
      ativo: true,
      plano: dto.plano || PlanoEnum.STARTER,
      data_ativacao: new Date(),
    })
    .orUpdate(['ativo', 'plano', 'data_ativacao'], ['empresa_id', 'modulo'])
    .returning('*')
    .execute();
  
  return result.generatedMaps[0] as EmpresaModulo;
}
```

### Opção 3: Verificar Foreign Key

O problema pode ser que `empresa_id` não está commitado ainda:

```typescript
// No registrarEmpresa(), FORÇAR commit antes de ativar módulos
const empresaSalva = await this.empresaRepository.save(empresaData);

// ⚡ FORÇAR FLUSH
await this.empresaRepository.manager.query('SELECT 1'); // Force commit

// Agora ativar módulos
await this.empresaModuloService.ativarPlano(empresaSalva.id, planoEnum);
```

## 🎬 Próximo Teste

1. Implementar **Opção 1** (try-catch + verificação)
2. Testar registro de empresa
3. Ver EXATAMENTE onde falha
4. Se falhar no `save()`: usar **Opção 2** (query builder)
5. Se falhar na verificação: usar **Opção 3** (forçar commit)

## 📝 Logs Esperados (Sucesso)

```
🎯 [CONTROLLER] POST /empresas/registro chamado
🚀 ===== REGISTRO DE EMPRESA INICIADO =====
...
═══════════════════════════════════════
🔍 [DEBUG] INICIANDO ATIVAÇÃO DE MÓDULOS
═══════════════════════════════════════
  🎯 [EmpresaModuloService] ativarPlano() iniciado
     Módulos a ativar (2): [ 'CRM', 'ATENDIMENTO' ]
     🔄 Ativando módulo: CRM...
       🔹 [ativar] Empresa: xxx, Módulo: CRM
       ➕ [ativar] Criando novo registro...
       💾 [ativar] Salvando no banco...
       ✅ [ativar] Salvo! ID: yyy
     ✅ Módulo CRM ativado com sucesso
     🔄 Ativando módulo: ATENDIMENTO...
       🔹 [ativar] Empresa: xxx, Módulo: ATENDIMENTO
       ➕ [ativar] Criando novo registro...
       💾 [ativar] Salvando no banco...
       ✅ [ativar] Salvo! ID: zzz
     ✅ Módulo ATENDIMENTO ativado com sucesso
  ✅ [EmpresaModuloService] ativarPlano() concluído
✅ [DEBUG] ATIVAÇÃO CONCLUÍDA
```

## 📊 Progresso

- [x] Identificar que código não executava
- [x] Descobrir que console.log era suprimido
- [x] Usar process.stdout.write() para ver logs
- [x] Confirmar que código EXECUTA e diz "CONCLUÍDO"
- [ ] **ATUAL**: Descobrir por que save() não persiste
- [ ] Implementar solução
- [ ] Validar com testes
- [ ] Remover logs de debug
- [ ] Documentar solução final

---

**Data**: 2025-11-20 23:02  
**Status**: Em investigação - save() não persiste dados  
**Próxima ação**: Implementar Opção 1 (try-catch detalhado)
