# Sistema de Exclusão Inteligente de Fornecedores - ConectCRM

## 📋 Visão Geral

O sistema implementa uma lógica robusta para lidar com a exclusão de fornecedores que possuem dependências financeiras, respeitando constraints de banco de dados e fornecendo uma experiência de usuário amigável.

## 🔧 Arquitetura da Solução

### Backend (NestJS + TypeORM)

#### 1. Entidades e Relacionamentos

**Fornecedor Entity**
```typescript
@Entity('fornecedores')
export class Fornecedor {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ length: 255 })
  nome: string;
  
  @Column({ type: 'boolean', default: true })
  ativo: boolean;
  
  @Column({ name: 'empresa_id' })
  empresaId: string;
  // ... outros campos
}
```

**ContaPagar Entity**
```typescript
@Entity('contas_pagar')
export class ContaPagar {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @ManyToOne(() => Fornecedor)
  @JoinColumn({ 
    name: 'fornecedor_id',
    foreignKeyConstraintName: 'fk_contas_pagar_fornecedor'
  })
  fornecedor: Fornecedor;
  
  @Column()
  status: string; // 'ABERTO', 'PAGO', 'FINALIZADO', etc.
  
  @Column('decimal', { precision: 10, scale: 2 })
  valor: number;
  // ... outros campos
}
```

#### 2. Service Layer - Lógica de Negócio

**FornecedorService.verificarDependencias()**
```typescript
async verificarDependencias(fornecedorId: string) {
  const contasPagar = await this.contaPagarRepository.find({
    where: { fornecedor: { id: fornecedorId } }
  });

  if (contasPagar.length > 0) {
    const contasAbertas = contasPagar.filter(c => 
      !['PAGO', 'FINALIZADO', 'QUITADO'].includes(c.status)
    );
    
    const contasPagas = contasPagar.filter(c => 
      ['PAGO', 'FINALIZADO', 'QUITADO'].includes(c.status)
    );

    // Calcula valores e retorna análise detalhada
    const valorEmAberto = contasAbertas.reduce((sum, c) => sum + c.valor, 0);
    const valorPago = contasPagas.reduce((sum, c) => sum + c.valor, 0);

    return {
      temDependencias: true,
      detalhes: {
        totalContas: contasPagar.length,
        contasAbertas: contasAbertas.length,
        contasPagas: contasPagas.length,
        valorEmAberto,
        valorPago,
        contasDetalhes: contasAbertas.slice(0, 5)
      }
    };
  }
  
  return { temDependencias: false };
}
```

#### 3. Controller Layer - Endpoints

**DELETE /fornecedores/:id**
```typescript
async remove(@Param('id') id: string, @Request() req): Promise<FornecedorRemovalResponse> {
  try {
    await this.fornecedorService.remove(id, empresaId);
    return {
      success: true,
      message: '✅ Fornecedor excluído com sucesso!'
    };
  } catch (error) {
    if (error.status === 400 && error.response?.details) {
      return {
        success: false,
        message: error.response.message,
        error: error.response,
        alternative: {
          action: 'desativar',
          endpoint: `/fornecedores/${id}/desativar`,
          description: 'Desativar fornecedor mantendo o histórico'
        }
      };
    }
    throw error;
  }
}
```

**PATCH /fornecedores/:id/desativar**
- Alternativa segura à exclusão
- Mantém dados históricos intactos
- Define `ativo = false`

**POST /fornecedores/:id/limpar-contas-pagas**
- Remove apenas contas com status 'PAGO', 'FINALIZADO', 'QUITADO'
- Permite exclusão após limpeza do histórico
- ⚠️ **OPERAÇÃO IRREVERSÍVEL**

### Frontend (React + TypeScript)

#### 1. Hook Personalizado - `useFornecedorRemoval`

**Características:**
- Gerencia estado de loading e erro
- Callbacks configuráveis para notificações
- Métodos para exclusão, desativação e limpeza
- Tratamento estruturado de erros de dependência

```typescript
const {
  isLoading,
  error,
  removeFornecedor,
  desativarFornecedor,
  clearError
} = useFornecedorRemoval(
  onUpdate, // Callback de sucesso
  onViewContas, // Navegação para contas
  {
    onSuccess: (message) => showNotification(message, 'success'),
    onError: (message) => showNotification(message, 'error'),
    onInfo: (message) => showNotification(message, 'info')
  }
);
```

#### 2. Componente de Erro - `FornecedorRemovalError`

**Funcionalidades:**
- Exibe resumo financeiro detalhado
- Mostra contas em aberto principais
- Explica o motivo da restrição
- Oferece ações alternativas:
  - 🔍 Ver contas a pagar
  - ⚠️ Desativar fornecedor
  - ❌ Cancelar operação

**Visual Design:**
- Modal com overlay
- Ícones intuitivos (AlertTriangle, DollarSign, etc.)
- Cores semânticas (vermelho para alertas, azul para ações)
- Layout responsivo

#### 3. Componente de Lista - `FornecedorListItem`

**Integração Completa:**
- Usa o hook `useFornecedorRemoval`
- Exibe modal de confirmação simples
- Fallback automático para modal de erro de dependência
- Estados de loading visuais

## 🛡️ Segurança e Integridade

### Constraint de Banco de Dados
```sql
ALTER TABLE contas_pagar 
ADD CONSTRAINT fk_contas_pagar_fornecedor 
FOREIGN KEY (fornecedor_id) 
REFERENCES fornecedores(id) 
ON DELETE RESTRICT;
```

### Validações em Camadas
1. **Banco de Dados**: Foreign key constraint impede exclusão
2. **Service Layer**: Verificação prévia de dependências
3. **Controller Layer**: Tratamento estruturado de erros
4. **Frontend**: UX intuitiva com alternativas

## 📱 Fluxo de Usuário

### Cenário 1: Exclusão Bem-Sucedida
1. Usuário clica em "Excluir fornecedor"
2. Modal de confirmação é exibido
3. Sistema verifica dependências
4. Não há contas vinculadas
5. Fornecedor é excluído
6. Notificação de sucesso

### Cenário 2: Fornecedor com Dependências
1. Usuário clica em "Excluir fornecedor"
2. Modal de confirmação é exibido
3. Sistema detecta contas vinculadas
4. Modal de erro detalhado é exibido com:
   - Resumo financeiro
   - Contas em aberto principais
   - Explicação do problema
   - Ações alternativas

### Cenário 3: Desativação como Alternativa
1. Do modal de erro, usuário clica "Desativar fornecedor"
2. Sistema desativa sem perder dados
3. Fornecedor some da lista ativa
4. Histórico preservado para relatórios

## 🔧 Configuração e Deploy

### Dependências Backend
```json
{
  "@nestjs/common": "^10.x",
  "@nestjs/typeorm": "^10.x",
  "typeorm": "^0.3.x",
  "class-validator": "^0.14.x"
}
```

### Dependências Frontend
```json
{
  "react": "^18.x",
  "lucide-react": "^0.x", // Para ícones
  "typescript": "^5.x"
}
```

### Configuração do Banco
```typescript
// migrations/xxx-add-foreign-key-constraint.ts
export class AddForeignKeyConstraint implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createForeignKey('contas_pagar', new ForeignKey({
      columnNames: ['fornecedor_id'],
      referencedTableName: 'fornecedores',
      referencedColumnNames: ['id'],
      name: 'fk_contas_pagar_fornecedor',
      onDelete: 'RESTRICT'
    }));
  }
}
```

## 🎯 Benefícios da Implementação

### Para o Usuário
- **Clareza**: Entende exatamente por que não pode excluir
- **Controle**: Tem alternativas claras de ação
- **Confiança**: Vê dados financeiros detalhados
- **Eficiência**: Acesso rápido às contas vinculadas

### Para o Sistema
- **Integridade**: Dados financeiros sempre consistentes
- **Auditoria**: Histórico completo preservado
- **Flexibilidade**: Múltiplas opções de resolução
- **Manutenibilidade**: Código organizado em camadas

### Para o Negócio
- **Compliance**: Atende requisitos de auditoria
- **Relatórios**: Dados históricos sempre disponíveis
- **Produtividade**: Usuários não ficam bloqueados
- **Confiabilidade**: Sistema robusto e previsível

## 🚀 Próximos Passos

1. **Testes Automatizados**: Unit tests para service layer
2. **Logs Detalhados**: Auditoria de tentativas de exclusão
3. **Permissões**: Controle de quem pode desativar/limpar histórico
4. **Relatórios**: Dashboard de fornecedores inativos
5. **Backup**: Exportação antes de limpeza de histórico

---

## 📞 Suporte

Para dúvidas sobre implementação ou customização, consulte:
- Documentação da API: `/api/docs`
- Logs do sistema: `/var/log/conectcrm`
- Repositório: GitHub/ConectCRM

**⚠️ Importante**: A operação de "limpar contas pagas" é irreversível. Use com cautela e sempre mantenha backups.
