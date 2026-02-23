# 🎯 PRÓXIMA PRIORIDADE: Auto-distribuição de Filas

**Data Início**: 7 de novembro de 2025  
**Prioridade**: 🔴 **ALTA** (Priority 2)  
**Tempo Estimado**: 5-7 dias úteis  
**Rating Esperado**: 9.0 → 9.5/10

---

## 📊 Contexto

Com a **Store Zustand 100% aprovada**, agora temos base sólida para implementar features avançadas.

### ✅ O Que Já Temos
- ✅ CRUD de Filas (backend + frontend)
- ✅ Store centralizada (gerenciamento de estado)
- ✅ WebSocket (tempo real)
- ✅ Entidades: Fila, FilaAtendente, Ticket

### ❌ O Que Falta
- ❌ Algoritmos de distribuição automática
- ❌ Regras de negócio (capacidade, prioridade)
- ❌ UI de configuração avançada
- ❌ Métricas e dashboard

---

## 🎯 Objetivo da Feature

**Distribuir tickets automaticamente** para atendentes disponíveis com base em:
1. **Capacidade** do atendente (máx de tickets simultâneos)
2. **Disponibilidade** (online/offline, ocupado/livre)
3. **Prioridade** da fila
4. **Skills** do atendente (opcional - fase 2)

---

## 📋 Escopo Detalhado

### Fase 1: Algoritmos Básicos (3-4 dias)

#### Backend
1. **DistribuicaoService** (novo serviço)
   - `distribuirTicket(ticketId, filaId)` - Distribuir 1 ticket
   - `redistribuirFila(filaId)` - Redistribuir todos tickets de uma fila
   - `calcularProximoAtendente(filaId)` - Algoritmo de escolha

2. **Algoritmos Suportados**
   - **Round Robin**: Revezamento circular
   - **Menor Carga**: Atendente com menos tickets
   - **Balanceado**: Considera capacidade e carga atual

3. **Regras de Negócio**
   - Verificar se atendente está online
   - Respeitar capacidade máxima
   - Não distribuir para atendente sem permissão na fila
   - Log de todas distribuições

#### Frontend
1. **Configuração de Algoritmo** (GestaoFilasPage)
   - Dropdown para escolher algoritmo
   - Configuração de capacidade por atendente
   - Preview de distribuição simulada

2. **Dashboard de Distribuição**
   - Visualizar carga de cada atendente
   - Ver tickets por atendente
   - Botão "Redistribuir Fila"

---

### Fase 2: Automação (2-3 dias)

#### Backend
1. **Trigger Automático**
   - Quando ticket entra na fila → distribuir automaticamente
   - Quando atendente fica online → redistribuir pendentes
   - Quando atendente atinge capacidade → bloquear novos

2. **Eventos WebSocket**
   - `ticket_distribuido` - Notificar atendente
   - `redistribuicao_iniciada` - Notificar supervisores
   - `capacidade_atingida` - Alertar sistema

#### Frontend
1. **Notificações em Tempo Real**
   - Toast quando ticket é distribuído
   - Som de notificação (opcional)
   - Badge de contagem atualizado

2. **Auto-refresh**
   - Sidebar atualiza automaticamente
   - Dashboard de filas atualiza em tempo real

---

## 🗂️ Estrutura de Arquivos (Novo)

### Backend
```
backend/src/modules/triagem/
├── services/
│   └── distribuicao.service.ts          🆕 CRIAR
├── controllers/
│   └── distribuicao.controller.ts       🆕 CRIAR
├── dto/
│   ├── configurar-distribuicao.dto.ts   🆕 CRIAR
│   └── redistribuir-fila.dto.ts         🆕 CRIAR
└── entities/
    └── distribuicao-log.entity.ts       🆕 CRIAR (opcional)
```

### Frontend
```
frontend-web/src/features/gestao/filas/
├── components/
│   ├── ConfiguracaoDistribuicao.tsx     🆕 CRIAR
│   ├── DashboardDistribuicao.tsx        🆕 CRIAR
│   └── PreviewDistribuicao.tsx          🆕 CRIAR
├── services/
│   └── distribuicaoService.ts           🆕 CRIAR
└── types/
    └── distribuicao.types.ts            🆕 CRIAR
```

---

## 🔧 Implementação Técnica

### 1. Backend - DistribuicaoService

```typescript
// backend/src/modules/triagem/services/distribuicao.service.ts

export enum AlgoritmoDistribuicao {
  ROUND_ROBIN = 'round_robin',
  MENOR_CARGA = 'menor_carga',
  BALANCEADO = 'balanceado',
}

@Injectable()
export class DistribuicaoService {
  async distribuirTicket(ticketId: string, filaId: string) {
    // 1. Buscar fila e configuração
    const fila = await this.filaRepository.findOne(filaId);
    const algoritmo = fila.algoritmoDistribuicao || AlgoritmoDistribuicao.MENOR_CARGA;
    
    // 2. Buscar atendentes disponíveis
    const atendentes = await this.buscarAtendentesDisponiveis(filaId);
    
    // 3. Aplicar algoritmo
    const atendenteEscolhido = await this.aplicarAlgoritmo(atendentes, algoritmo);
    
    // 4. Atribuir ticket
    await this.ticketService.atribuirAtendente(ticketId, atendenteEscolhido.id);
    
    // 5. Notificar WebSocket
    this.gateway.emit('ticket_distribuido', { ticketId, atendenteId: atendenteEscolhido.id });
    
    return atendenteEscolhido;
  }
  
  private async buscarAtendentesDisponiveis(filaId: string) {
    return this.filaAtendenteRepository.find({
      where: { filaId, ativo: true },
      relations: ['atendente'],
    }).then(registros => 
      registros
        .filter(r => r.atendente.online && r.ticketsAtivos < r.capacidadeMaxima)
        .map(r => r.atendente)
    );
  }
  
  private async aplicarAlgoritmo(atendentes: Atendente[], algoritmo: AlgoritmoDistribuicao) {
    switch (algoritmo) {
      case AlgoritmoDistribuicao.ROUND_ROBIN:
        return this.roundRobin(atendentes);
      
      case AlgoritmoDistribuicao.MENOR_CARGA:
        return this.menorCarga(atendentes);
      
      case AlgoritmoDistribuicao.BALANCEADO:
        return this.balanceado(atendentes);
      
      default:
        return this.menorCarga(atendentes);
    }
  }
  
  private menorCarga(atendentes: Atendente[]) {
    return atendentes.reduce((menor, atual) => 
      atual.ticketsAtivos < menor.ticketsAtivos ? atual : menor
    );
  }
}
```

### 2. Frontend - ConfiguracaoDistribuicao

```typescript
// frontend-web/src/features/gestao/filas/components/ConfiguracaoDistribuicao.tsx

export const ConfiguracaoDistribuicao: React.FC = () => {
  const [algoritmo, setAlgoritmo] = useState<AlgoritmoDistribuicao>('menor_carga');
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Configuração de Distribuição</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Algoritmo</label>
          <select 
            value={algoritmo}
            onChange={(e) => setAlgoritmo(e.target.value as AlgoritmoDistribuicao)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="menor_carga">Menor Carga (Recomendado)</option>
            <option value="round_robin">Round Robin</option>
            <option value="balanceado">Balanceado</option>
          </select>
        </div>
        
        <button 
          onClick={salvarConfiguracao}
          className="px-4 py-2 bg-[#159A9C] text-white rounded-lg"
        >
          Salvar Configuração
        </button>
      </div>
    </div>
  );
};
```

---

## 📊 Cronograma Detalhado

### Semana 1 (5 dias úteis)

| Dia | Tarefa | Responsável | Tempo |
|-----|--------|-------------|-------|
| 1 | Backend: DistribuicaoService (base) | Dev | 4h |
| 1 | Backend: Algoritmo Menor Carga | Dev | 2h |
| 2 | Backend: Algoritmo Round Robin | Dev | 2h |
| 2 | Backend: Algoritmo Balanceado | Dev | 2h |
| 2 | Backend: Controller e rotas | Dev | 2h |
| 3 | Frontend: distribuicaoService | Dev | 2h |
| 3 | Frontend: ConfiguracaoDistribuicao | Dev | 3h |
| 4 | Frontend: DashboardDistribuicao | Dev | 4h |
| 4 | Frontend: Integração WebSocket | Dev | 2h |
| 5 | Testes unitários (backend) | Dev | 3h |
| 5 | Testes integração (E2E) | Dev | 3h |

**Total**: ~35 horas (~5-7 dias)

---

## 🧪 Critérios de Aceitação

### Funcional
- [ ] Ticket novo é distribuído automaticamente ao entrar na fila
- [ ] Algoritmo respeita capacidade máxima do atendente
- [ ] Algoritmo não distribui para atendente offline
- [ ] Redistribuição manual funciona
- [ ] WebSocket notifica atendente em tempo real

### Performance
- [ ] Distribuição ocorre em <500ms
- [ ] Suporta 100+ tickets simultâneos
- [ ] Sem race conditions (concorrência)

### UX
- [ ] UI intuitiva para configurar algoritmo
- [ ] Dashboard mostra carga em tempo real
- [ ] Notificações claras e não invasivas

---

## 🎯 Resultado Esperado

Após conclusão:
- ✅ **Automação completa** de distribuição
- ✅ **3 algoritmos** disponíveis
- ✅ **Dashboard visual** de carga
- ✅ **WebSocket integrado** (notificações)
- ✅ **Rating 9.0 → 9.5/10**
- ✅ **Competitivo** com Zendesk/Intercom

---

## 📞 Próxima Ação

**AGORA**: Revisar este plano e aprovar

**Pergunta para você**:
- ✅ Aprovar e começar implementação?
- ⚠️ Ajustar algo no escopo?
- ❓ Dúvidas sobre alguma parte?

---

**Aguardando sua aprovação para começar!** 🚀
