# 🚀 Roadmap - Próximos Passos Admin Portal SaaS

**Última atualização**: 22/11/2025  
**Fase Atual**: Fase 1 ✅ Concluída (100%)  
**Próxima Fase**: A definir

---

## 📊 Status Geral do Projeto

| Fase | Status | Progresso | Prioridade | Tempo Estimado |
|------|--------|-----------|------------|----------------|
| **Fase 1** - Gestão de Empresas | ✅ Concluída | 100% | - | Concluído |
| **Fase 2** - Módulos e Planos | 🔲 Planejada | 0% | Alta | 1 semana |
| **Fase 3** - Faturamento | 🔲 Planejada | 0% | Média | 1 semana |
| **Fase 4** - Analytics | 🔲 Planejada | 0% | Média | 1 semana |
| **Fase 5** - Notificações | 🔲 Planejada | 0% | Baixa | 3 dias |

---

## 🎯 FASE 2: Gestão Avançada de Módulos e Planos

**Objetivo**: Permitir ativação/desativação granular de módulos por empresa e gestão detalhada de limites.

### Backend Tasks

#### 2.1. Criar DTOs (1h)
```typescript
// create-modulo-empresa.dto.ts
export class CreateModuloEmpresaDto {
  @IsString()
  modulo: string; // 'crm', 'atendimento', 'comercial', etc.

  @IsOptional()
  @IsObject()
  limites?: {
    usuarios?: number;
    leads?: number;
    storage_mb?: number;
    api_calls_dia?: number;
  };

  @IsOptional()
  @IsObject()
  configuracoes?: Record<string, any>;
}

// update-modulo-empresa.dto.ts
export class UpdateModuloEmpresaDto {
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsObject()
  limites?: {
    usuarios?: number;
    leads?: number;
    storage_mb?: number;
  };
}
```

#### 2.2. Expandir AdminEmpresasService (4h)
```typescript
// Novos métodos:
async listarModulos(empresaId: string): Promise<EmpresaModulo[]>
async ativarModulo(empresaId: string, dto: CreateModuloEmpresaDto): Promise<EmpresaModulo>
async desativarModulo(empresaId: string, modulo: string): Promise<void>
async atualizarLimites(empresaId: string, modulo: string, limites: any): Promise<EmpresaModulo>
async historicoPlanos(empresaId: string): Promise<HistoricoPlano[]>
async mudarPlano(empresaId: string, novoPlano: string): Promise<Empresa>
```

#### 2.3. Adicionar Rotas (2h)
```typescript
// admin-empresas.controller.ts
@Get(':id/modulos')
async listarModulos(@Param('id') id: string)

@Post(':id/modulos')
async ativarModulo(@Param('id') id: string, @Body() dto: CreateModuloEmpresaDto)

@Delete(':id/modulos/:modulo')
async desativarModulo(@Param('id') id: string, @Param('modulo') modulo: string)

@Patch(':id/modulos/:modulo')
async atualizarModulo(@Param('id') id: string, @Param('modulo') modulo: string, @Body() dto: UpdateModuloEmpresaDto)

@Get(':id/historico-planos')
async historicoPlanos(@Param('id') id: string)

@Patch(':id/plano')
async mudarPlano(@Param('id') id: string, @Body() dto: { plano: string })
```

#### 2.4. Criar Entity HistoricoPlano (1h)
```typescript
@Entity('historico_planos')
export class HistoricoPlano {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column()
  plano_anterior: string;

  @Column()
  plano_novo: string;

  @Column('decimal')
  valor_anterior: number;

  @Column('decimal')
  valor_novo: number;

  @Column({ type: 'text', nullable: true })
  motivo: string;

  @Column({ type: 'uuid', nullable: true })
  alterado_por: string;

  @CreateDateColumn()
  data_alteracao: Date;
}
```

#### 2.5. Migration (30min)
```bash
npm run migration:generate -- src/migrations/CreateHistoricoPlanos
npm run migration:run
```

**Tempo total Backend**: ~9h

---

### Frontend Tasks

#### 2.6. Criar Página de Módulos (3h)
```typescript
// GestaoModulosPage.tsx
- Lista de todos os módulos do sistema
- Toggle para ativar/desativar por empresa
- Modal para configurar limites
- Indicador visual de uso atual vs limite
- Alertas quando próximo do limite
```

#### 2.7. Adicionar Tab em EmpresaDetailPage (2h)
```typescript
// Adicionar tabs:
- "Geral" (atual)
- "Módulos" (novo)
- "Histórico" (novo)

// Tab Módulos:
- Grid de cards com cada módulo
- Status: Ativo/Inativo
- Limites configurados
- Uso atual
- Botão "Configurar"
```

#### 2.8. Criar ModalConfigurarModulo (2h)
```typescript
// ModalConfigurarModulo.tsx
- Campo: Limite de usuários (número)
- Campo: Limite de leads (número)
- Campo: Limite de storage (MB)
- Campo: Limite de API calls/dia (número)
- Botão "Salvar" e "Cancelar"
```

#### 2.9. Criar Página de Histórico (2h)
```typescript
// HistoricoPlanoPage.tsx
- Timeline de mudanças de plano
- Filtros: data, plano anterior, plano novo
- Detalhes: quem alterou, quando, motivo
- Export para Excel/PDF
```

#### 2.10. Atualizar Service (1h)
```typescript
// adminEmpresasService.ts
export const listarModulos = async (empresaId: string) => { ... }
export const ativarModulo = async (empresaId: string, data: any) => { ... }
export const desativarModulo = async (empresaId: string, modulo: string) => { ... }
export const atualizarLimites = async (empresaId: string, modulo: string, limites: any) => { ... }
export const historicoPlanos = async (empresaId: string) => { ... }
export const mudarPlano = async (empresaId: string, novoPlano: string) => { ... }
```

**Tempo total Frontend**: ~10h

---

### Testing (3h)
- [ ] Testar ativação de módulo
- [ ] Testar desativação de módulo
- [ ] Testar atualização de limites
- [ ] Testar mudança de plano
- [ ] Testar histórico de planos
- [ ] Testar validações de limites

**Tempo total Fase 2**: ~22h (~3 dias úteis)

---

## 💰 FASE 3: Faturamento e Cobrança

**Objetivo**: Integração completa com Stripe e gestão de cobranças recorrentes.

### Backend Tasks

#### 3.1. Integração Stripe (4h)
```typescript
// stripe.service.ts
async criarCliente(empresa: Empresa): Promise<Stripe.Customer>
async criarSubscription(empresaId: string, planoId: string): Promise<Stripe.Subscription>
async cancelarSubscription(subscriptionId: string): Promise<void>
async atualizarMetodoPagamento(customerId: string, paymentMethodId: string): Promise<void>
async listarFaturas(customerId: string): Promise<Stripe.Invoice[]>
async webhookHandler(event: Stripe.Event): Promise<void>
```

#### 3.2. Entity Fatura (2h)
```typescript
@Entity('faturas_admin')
export class FaturaAdmin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Empresa)
  empresa: Empresa;

  @Column()
  stripe_invoice_id: string;

  @Column('decimal')
  valor: number;

  @Column()
  status: 'pendente' | 'paga' | 'cancelada' | 'vencida';

  @Column()
  data_vencimento: Date;

  @Column({ nullable: true })
  data_pagamento: Date;

  @Column()
  periodo_inicio: Date;

  @Column()
  periodo_fim: Date;
}
```

#### 3.3. Controller de Faturas (3h)
```typescript
@Get('admin/faturas')
async listarFaturas(@Query() filters)

@Get('admin/faturas/:id')
async buscarFatura(@Param('id') id: string)

@Post('admin/faturas/:id/enviar-email')
async enviarEmailFatura(@Param('id') id: string)

@Post('admin/faturas/:id/cancelar')
async cancelarFatura(@Param('id') id: string)

@Get('admin/empresas/:id/faturas')
async listarFaturasPorEmpresa(@Param('id') empresaId: string)
```

**Tempo total Backend**: ~9h

---

### Frontend Tasks

#### 3.4. Página de Faturas (4h)
```typescript
// FaturasListPage.tsx
- Grid de faturas
- Filtros: status, período, empresa
- Badges coloridos por status
- Download de PDF
- Enviar por email
- Cancelar fatura
```

#### 3.5. Detalhes da Fatura (2h)
```typescript
// FaturaDetailPage.tsx
- Informações completas
- Itens da fatura
- Histórico de pagamento
- Logs de tentativas
- Botões de ação
```

#### 3.6. Componente de Pagamento (3h)
```typescript
// StripeCheckout.tsx
- Integração Stripe Elements
- Formulário de cartão
- Validação em tempo real
- Loading states
- Error handling
```

**Tempo total Frontend**: ~9h

**Tempo total Fase 3**: ~18h (~2.5 dias úteis)

---

## 📊 FASE 4: Dashboard Analítico

**Objetivo**: Métricas globais e visualizações para tomada de decisão.

### Backend Tasks

#### 4.1. Analytics Service (6h)
```typescript
// admin-analytics.service.ts
async calcularMRR(): Promise<number>
async calcularChurnRate(): Promise<number>
async calcularCAC(): Promise<number>
async calcularLTV(): Promise<number>
async crescimentoMensal(): Promise<GraficoData[]>
async distribuicaoPorPlano(): Promise<DistribuicaoData[]>
async top10Empresas(): Promise<Empresa[]>
async alertasAutomaticos(): Promise<Alerta[]>
```

#### 4.2. Controller Analytics (2h)
```typescript
@Get('admin/analytics/dashboard')
async getDashboard()

@Get('admin/analytics/mrr-historico')
async getMRRHistorico(@Query() params)

@Get('admin/analytics/churn-analise')
async getChurnAnalise(@Query() params)

@Get('admin/analytics/crescimento')
async getCrescimento(@Query() params)

@Get('admin/analytics/export')
async exportarRelatorio(@Query() params)
```

**Tempo total Backend**: ~8h

---

### Frontend Tasks

#### 4.3. Dashboard Page (5h)
```typescript
// AnalyticsDashboardPage.tsx
- KPI Cards grandes (MRR, Churn, CAC, LTV)
- Gráfico de crescimento (Chart.js/Recharts)
- Gráfico de distribuição por plano (pie chart)
- Top 10 empresas
- Alertas em destaque
```

#### 4.4. Filtros de Período (2h)
```typescript
// DateRangeFilter.tsx
- Preset: Hoje, 7 dias, 30 dias, 90 dias, Ano
- Custom: Selecionar início e fim
- Comparar com período anterior
```

#### 4.5. Exportação de Relatórios (3h)
```typescript
// ExportButton.tsx
- Exportar para Excel
- Exportar para PDF
- Exportar para CSV
- Agendar relatórios automáticos
```

**Tempo total Frontend**: ~10h

**Tempo total Fase 4**: ~18h (~2.5 dias úteis)

---

## 🔔 FASE 5: Sistema de Notificações

**Objetivo**: Alertas automáticos para eventos importantes.

### Backend Tasks

#### 5.1. Alertas Service (4h)
```typescript
// admin-alertas.service.ts
async criarAlerta(tipo: string, empresaId: string, mensagem: string): Promise<Alerta>
async listarAlertas(filters): Promise<Alerta[]>
async marcarComoLido(alertaId: string): Promise<void>
async configuracoesAlertas(): Promise<ConfiguracaoAlerta[]>

// Tipos de alertas:
- Trial expirando (5 dias antes)
- Fatura vencida
- Health score baixo (<50)
- Limite de uso atingido (90%)
- Tentativa de pagamento falhada
- Novo cadastro
- Cancelamento
```

#### 5.2. Cron Jobs (3h)
```typescript
// alertas.cron.ts
@Cron('0 9 * * *') // Todo dia às 9h
async verificarTrialsExpirando()

@Cron('0 10 * * *') // Todo dia às 10h
async verificarFaturasVencidas()

@Cron('0 */6 * * *') // A cada 6 horas
async verificarHealthScoreBaixo()
```

**Tempo total Backend**: ~7h

---

### Frontend Tasks

#### 5.3. Painel de Notificações (3h)
```typescript
// NotificacoesPanel.tsx
- Dropdown no header com badge de contador
- Lista de notificações recentes
- Filtro por tipo
- Marcar como lida
- Ir para recurso relacionado
```

#### 5.4. Configurações de Alertas (2h)
```typescript
// ConfigurarAlertasPage.tsx
- Ativar/desativar por tipo
- Configurar threshold
- Escolher canais (email, in-app, SMS)
- Testar envio
```

**Tempo total Frontend**: ~5h

**Tempo total Fase 5**: ~12h (~1.5 dias úteis)

---

## 📅 Cronograma Sugerido

### Semana 1 (25-29 Nov)
- **Seg-Qua**: Fase 2 (Módulos e Planos) - 22h
- **Qui-Sex**: Fase 3 Parte 1 (Stripe Integration) - 9h

### Semana 2 (2-6 Dez)
- **Seg-Ter**: Fase 3 Parte 2 (Frontend Faturas) - 9h
- **Qua-Sex**: Fase 4 (Analytics) - 18h

### Semana 3 (9-13 Dez)
- **Seg-Ter**: Fase 5 (Notificações) - 12h
- **Qua-Sex**: Testes E2E + Ajustes finais

**Data de conclusão prevista**: 13/12/2025

---

## 🎯 Melhorias Opcionais (Backlog)

### Performance
- [ ] Implementar cache Redis
- [ ] Otimizar queries com índices
- [ ] Lazy loading de imagens
- [ ] Virtualização de listas longas
- [ ] PWA com service worker

### UX/UI
- [ ] Dark mode
- [ ] Atalhos de teclado
- [ ] Drag & drop para reordenar
- [ ] Animações micro-interações
- [ ] Tour guiado (onboarding)

### Segurança
- [ ] 2FA para admins
- [ ] Logs de auditoria
- [ ] Rate limiting
- [ ] IP whitelist
- [ ] Criptografia de dados sensíveis

### Integração
- [ ] Webhooks para eventos
- [ ] API pública para parceiros
- [ ] Integração Slack
- [ ] Integração Discord
- [ ] Zapier integration

---

## 📊 Priorização (MoSCoW)

### Must Have (Obrigatório)
- ✅ Fase 1: Gestão de Empresas
- 🔲 Fase 2: Módulos e Planos
- 🔲 Fase 3: Faturamento

### Should Have (Importante)
- 🔲 Fase 4: Analytics
- 🔲 Testes E2E

### Could Have (Desejável)
- 🔲 Fase 5: Notificações
- 🔲 Dark mode
- 🔲 PWA

### Won't Have (Não prioritário)
- Integração Zapier
- Webhooks externos
- API pública

---

## 🚦 Decisão: Qual Fase Seguir?

### Critérios de Decisão

1. **Valor de Negócio**
   - Fase 2 (Módulos): Alta - Diferencial competitivo
   - Fase 3 (Faturamento): Crítica - Receita
   - Fase 4 (Analytics): Média - Tomada de decisão

2. **Complexidade Técnica**
   - Fase 2: Média (8/10)
   - Fase 3: Alta (9/10) - Stripe
   - Fase 4: Média (7/10) - Gráficos

3. **Dependências**
   - Fase 2: Independente
   - Fase 3: Depende minimamente de Fase 2
   - Fase 4: Depende de Fase 2 e 3

4. **Urgência**
   - Fase 2: Alta - Clientes solicitam
   - Fase 3: Crítica - Precisa faturar
   - Fase 4: Média - Nice to have

### Recomendação

**Seguir com Fase 2 (Módulos e Planos)**

**Motivos**:
- ✅ Alta demanda de clientes
- ✅ Diferencial competitivo
- ✅ Independente de outras fases
- ✅ Tempo razoável (3 dias)
- ✅ Prepara terreno para Fase 3

**Comando para começar**:
```
"Vamos começar a Fase 2 - Gestão de Módulos e Planos. 
Começar pelo backend: criar DTOs e expandir AdminEmpresasService."
```

---

**Última atualização**: 22/11/2025 13:30
