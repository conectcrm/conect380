# 🔧 CORREÇÃO DO BACKEND: Usar Dados Reais do Cliente

## ❌ Problema Identificado

**Localização**: `backend/src/modules/propostas/propostas.service.ts` - Linha 196

**Código problemático**:
```typescript
// Se é string, criar objeto com o nome fornecido
const nomeCliente = dadosProposta.cliente as string;
clienteProcessado = {
  id: 'cliente-temp',
  nome: nomeCliente,
  email: `${nomeCliente.toLowerCase().replace(/\s+/g, '.')}@cliente.com`  // ← PROBLEMA
};
```

**Resultado**: 
- "Dhonleno Freitas" → `dhonleno.freitas@cliente.com` ❌
- Backend gera email fictício ao invés de buscar dados reais

---

## ✅ Solução Necessária

### 1. **Modificar Backend para Buscar Dados Reais**

```typescript
// ✅ CÓDIGO CORRIGIDO:
// Processar cliente baseado no tipo de dados recebido
let clienteProcessado;
if (typeof dadosProposta.cliente === 'string') {
  // 🔍 BUSCAR CLIENTE REAL NO BANCO
  const nomeCliente = dadosProposta.cliente as string;
  
  try {
    // Buscar cliente real pelo nome
    const clienteReal = await this.clienteRepository.findOne({
      where: [
        { nome: Like(`%${nomeCliente}%`) },
        { nome: nomeCliente }
      ]
    });
    
    if (clienteReal) {
      console.log(`✅ Cliente real encontrado: ${clienteReal.email}`);
      clienteProcessado = {
        id: clienteReal.id,
        nome: clienteReal.nome,
        email: clienteReal.email,          // ← USAR EMAIL REAL
        telefone: clienteReal.telefone,    // ← USAR TELEFONE REAL
        documento: clienteReal.documento,
        status: clienteReal.status
      };
    } else {
      console.warn(`⚠️ Cliente "${nomeCliente}" não encontrado, criando temporário`);
      clienteProcessado = {
        id: 'cliente-temp',
        nome: nomeCliente,
        email: '',  // ← DEIXAR VAZIO se não encontrar
        telefone: ''
      };
    }
  } catch (error) {
    console.error('❌ Erro ao buscar cliente:', error);
    // Fallback sem email fictício
    clienteProcessado = {
      id: 'cliente-temp',
      nome: nomeCliente,
      email: '',
      telefone: ''
    };
  }
} else if (dadosProposta.cliente && typeof dadosProposta.cliente === 'object') {
  // Se é objeto, usar como está
  clienteProcessado = dadosProposta.cliente;
} else {
  // Fallback para cliente padrão SEM EMAIL FICTÍCIO
  clienteProcessado = {
    id: 'cliente-default',
    nome: 'Cliente Temporário',
    email: '',  // ← NÃO gerar email fictício
    telefone: ''
  };
}
```

### 2. **Importar Repository de Clientes**

```typescript
import { Cliente } from '../clientes/cliente.entity'; // Importar entidade
import { Like } from 'typeorm'; // Para busca flexível

@Injectable()
export class PropostasService {
  constructor(
    @InjectRepository(PropostaEntity)
    private propostaRepository: Repository<PropostaEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Cliente)  // ← ADICIONAR
    private clienteRepository: Repository<Cliente>,
  ) {
    // ...
  }
```

---

## 🎯 Resultado da Correção

### **ANTES:**
```
1. Frontend envia: "Dhonleno Freitas"
   ↓
2. Backend gera: dhonleno.freitas@cliente.com
   ↓
3. Salva no banco: email fictício
   ↓
4. Frontend recebe: dados fictícios ❌
```

### **DEPOIS:**
```
1. Frontend envia: "Dhonleno Freitas"
   ↓
2. Backend busca: SELECT * FROM clientes WHERE nome LIKE '%Dhonleno Freitas%'
   ↓
3. Backend encontra: dhonlenofreitas@hotmail.com
   ↓
4. Salva no banco: dados reais
   ↓
5. Frontend recebe: dados reais ✅
```

---

## 📋 Passos para Implementar

1. **Modificar PropostasService**:
   - Importar `Cliente` entity
   - Injetar `clienteRepository`
   - Substituir geração de email fictício por busca real

2. **Resultado**:
   - ✅ Propostas criadas com dados reais do cadastro
   - ✅ Grid mostra emails corretos imediatamente
   - ✅ Não precisa mais corrigir no frontend
   - ✅ Dados consistentes entre proposta e cadastro

3. **Benefícios**:
   - 🔍 **Busca automática** de dados reais no backend
   - 📧 **Email real** salvo no banco: `dhonlenofreitas@hotmail.com`
   - 📱 **Telefone real** disponível: `62996689991`
   - 🎯 **Dados consistentes** em toda aplicação

---

## 🚀 Implementação da Correção

Esta correção resolve o problema na **origem** - o backend não mais gerará emails fictícios quando os dados reais estão disponíveis no cadastro!
