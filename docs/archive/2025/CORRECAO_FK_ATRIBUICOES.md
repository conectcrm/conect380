# 🔧 Correção: Validação de Foreign Keys em Atribuições

## 📋 Data
18 de outubro de 2025

## 🎯 Problema Identificado

### Sintoma
```
POST /atribuicoes/atendente 400 Bad Request
Payload: {atendenteId: '...', nucleoId: '...'}  ✅ UUIDs válidos
```

### Causa Raiz
Backend tentava inserir atribuição sem validar se:
- ✅ Atendente existe no banco
- ✅ Núcleo existe no banco  
- ✅ Equipe existe no banco
- ✅ Departamento existe (se informado)

Como existe **foreign key constraint** nas entities:
```typescript
@ManyToOne(() => User, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'atendente_id' })
atendente: User;

@ManyToOne(() => NucleoAtendimento, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'nucleo_id' })
nucleo: NucleoAtendimento;
```

Se o UUID for válido mas o registro **não existir**, o banco rejeita com erro de FK!

---

## ✅ Solução Implementada

### 1. Backend - Validação Antes de Salvar

#### Arquivo: `backend/src/modules/triagem/services/atribuicao.service.ts`

**Imports adicionados:**
```typescript
import { NucleoAtendimento } from '../entities/nucleo-atendimento.entity';
import { Departamento } from '../entities/departamento.entity';
```

**Repositories injetados:**
```typescript
constructor(
  // ... existentes
  @InjectRepository(NucleoAtendimento)
  private readonly nucleoRepository: Repository<NucleoAtendimento>,
  @InjectRepository(Departamento)
  private readonly departamentoRepository: Repository<Departamento>,
  // ...
) {}
```

**Validações adicionadas em `atribuirAtendenteANucleoDepartamento()`:**
```typescript
// Verificar se o atendente existe
const atendente = await this.userRepository.findOne({
  where: { id: dto.atendenteId },
});
if (!atendente) {
  throw new NotFoundException(`Atendente ${dto.atendenteId} não encontrado`);
}

// Verificar se o núcleo existe (se informado)
if (dto.nucleoId) {
  const nucleo = await this.nucleoRepository.findOne({
    where: { id: dto.nucleoId },
  });
  if (!nucleo) {
    throw new NotFoundException(`Núcleo ${dto.nucleoId} não encontrado`);
  }
}

// Verificar se o departamento existe (se informado)
if (dto.departamentoId) {
  const departamento = await this.departamentoRepository.findOne({
    where: { id: dto.departamentoId },
  });
  if (!departamento) {
    throw new NotFoundException(`Departamento ${dto.departamentoId} não encontrado`);
  }
}
```

**Mesma lógica aplicada em `atribuirEquipeANucleoDepartamento()`** para validar:
- ✅ Equipe existe
- ✅ Núcleo existe (se informado)
- ✅ Departamento existe (se informado)

---

### 2. Frontend - Validação de UUID + Logs Detalhados

#### Arquivo: `frontend-web/src/pages/GestaoAtribuicoesPage.tsx`

**Validação de UUID adicionada:**
```typescript
// Validar UUIDs antes de enviar
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

if (!uuidRegex.test(payloadAtendente.atendenteId)) {
  toast.error('ID do atendente inválido');
  console.error('❌ atendenteId inválido:', payloadAtendente.atendenteId);
  return;
}

if (payloadAtendente.nucleoId && !uuidRegex.test(payloadAtendente.nucleoId)) {
  toast.error('ID do núcleo inválido');
  console.error('❌ nucleoId inválido:', payloadAtendente.nucleoId);
  return;
}
```

**Logs de erro melhorados:**
```typescript
if (axiosError?.response?.data) {
  const data = axiosError.response.data;
  console.error('📋 Resposta do servidor:', data);
  
  // Log detalhado da mensagem
  if (data.message) {
    console.error('📨 Mensagem do backend:', data.message);
  }
  
  // Extrair mensagem...
}
```

---

## 🧪 Cenários de Teste

| Cenário | atendenteId | nucleoId | Resultado Esperado |
|---------|-------------|----------|-------------------|
| ✅ Sucesso | Existe | Existe | 201 Created |
| ❌ Atendente não existe | UUID válido mas não existe | Existe | 404 "Atendente ... não encontrado" |
| ❌ Núcleo não existe | Existe | UUID válido mas não existe | 404 "Núcleo ... não encontrado" |
| ❌ UUID inválido | `abc-123` | Existe | 400 frontend "ID do atendente inválido" |
| ❌ Duplicada | Existe | Existe (já atribuído) | 400 "Atribuição já existe" |

---

## 🎯 Benefícios

### Antes
- ❌ Erro genérico de FK do banco (difícil debug)
- ❌ Mensagem pouco clara para o usuário
- ❌ Sem validação prévia

### Depois
- ✅ Erro específico: "Atendente X não encontrado"
- ✅ Mensagem clara para o usuário
- ✅ Validação no frontend E backend
- ✅ Logs detalhados para debug

---

## 📝 Impacto

### Backend
- ✅ 2 imports adicionados
- ✅ 2 repositories injetados
- ✅ ~40 linhas de validação em 2 métodos
- ✅ Mensagens de erro mais descritivas

### Frontend
- ✅ Validação de UUID antes de enviar
- ✅ Logs detalhados para debug
- ✅ ~30 linhas de validação

### Banco de Dados
- ✅ Sem impacto (foreign keys já existiam)

---

## 🔄 Próximos Passos

1. ✅ Testar criação de atribuição com atendente/núcleo existente
2. ✅ Testar com atendente não existente (deve retornar 404 claro)
3. ✅ Testar com núcleo não existente (deve retornar 404 claro)
4. ✅ Verificar logs no console do navegador
5. ✅ Verificar mensagem de erro amigável para o usuário

---

## 🎓 Lições Aprendidas

### 1. Foreign Keys Exigem Validação Prévia
Sempre valide se registros referenciados existem ANTES de tentar salvar.

### 2. Erros de Banco São Genéricos
Melhor retornar erro específico (`NotFoundException`) do que deixar o banco rejeitar.

### 3. Validação em Camadas
- **Frontend**: Validar formato (UUID)
- **Backend**: Validar existência no banco

### 4. Logs Detalhados São Essenciais
```typescript
console.error('📋 Resposta do servidor:', data);
console.error('📨 Mensagem do backend:', data.message);
```

---

## 📚 Referências

- Entity: `backend/src/modules/triagem/entities/atendente-atribuicao.entity.ts`
- Service: `backend/src/modules/triagem/services/atribuicao.service.ts`
- Controller: `backend/src/modules/triagem/controllers/atribuicao.controller.ts`
- Frontend: `frontend-web/src/pages/GestaoAtribuicoesPage.tsx`

---

**Autor**: Sistema ConectCRM  
**Status**: ✅ Implementado - Aguardando Testes
