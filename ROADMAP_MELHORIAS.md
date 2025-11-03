# 🗺️ Roadmap de Melhorias - ConectCRM

**Última atualização**: 3 de novembro de 2025  
**Status**: Consolidação de TODOs e melhorias identificadas

---

## 🎯 Visão Geral

Este documento consolida **todas as melhorias pendentes** identificadas no sistema, organizadas por prioridade e categoria.

### Estatísticas
- **Total de melhorias identificadas**: 47
- **Prioridade ALTA**: 8
- **Prioridade MÉDIA**: 21
- **Prioridade BAIXA**: 18

---

## 🔥 PRIORIDADE ALTA (Próximas 2 semanas)

### 1. Segurança e Produção

#### 🔒 SSL/HTTPS (Crítico)
- [ ] Configurar certificado SSL/TLS com Let's Encrypt
- [ ] Redirecionar HTTP → HTTPS automaticamente
- [ ] Atualizar URLs de ambiente para HTTPS
- **Impacto**: ⚠️ BLOQUEADOR para produção
- **Tempo estimado**: 2 horas
- **Referência**: `PRODUCTION_READY.md` linha 350

#### 🛡️ Rate Limiting
- [ ] Implementar rate limiting na API (express-rate-limit)
- [ ] Configurar limites: 100 req/min por IP
- [ ] Adicionar headers de rate limit na resposta
- **Impacto**: Alta - Protege contra abuso/DDoS
- **Tempo estimado**: 3 horas
- **Referência**: `STATUS_BACKEND_ATENDIMENTO.md` linha 319

#### 🔥 Firewall AWS
- [ ] Configurar Security Group restritivo
- [ ] Abrir apenas portas: 22 (SSH), 80 (HTTP), 443 (HTTPS)
- [ ] Fechar porta 3001 (backend) para acesso externo
- [ ] Documentar regras no README
- **Impacto**: Alta - Segurança da infraestrutura
- **Tempo estimado**: 1 hora
- **Referência**: `PRODUCTION_READY.md` linha 353

### 2. Qualidade e Testes

#### 🧪 Testes Automatizados
- [ ] Aumentar cobertura de testes unitários (atual: ~30%)
- [ ] Adicionar testes E2E para fluxos críticos
- [ ] Configurar testes no CI/CD
- **Impacto**: Alta - Previne regressões
- **Tempo estimado**: 1 semana
- **Referência**: `docs/RELATORIO_FINAL.md` linha 278

#### 🔄 CI/CD com GitHub Actions
- [ ] Criar workflow de build + test
- [ ] Adicionar deploy automático para staging
- [ ] Implementar rollback automático se testes falharem
- **Impacto**: Alta - Acelera entregas
- **Tempo estimado**: 1 dia
- **Referência**: `docs/RELATORIO_FINAL.md` linha 279

### 3. Backend - Features Críticas

#### 📝 Sistema de Notas Internas (Tickets)
- [ ] Implementar `TicketService.criarNotaInterna()`
- [ ] Adicionar endpoint `POST /tickets/:id/notas`
- [ ] Emitir evento WebSocket para atualização real-time
- **Impacto**: Alta - Funcionalidade solicitada por usuários
- **Tempo estimado**: 4 horas
- **Referência**: `STATUS_BACKEND_ATENDIMENTO.md` linha 301

#### 🔔 Notificações de Transferência
- [ ] Enviar notificação ao atendente quando receber ticket
- [ ] Implementar via WebSocket + Push Notification
- [ ] Adicionar som de alerta configurável
- **Impacto**: Alta - UX crítica para atendentes
- **Tempo estimado**: 4 horas
- **Referência**: `STATUS_BACKEND_ATENDIMENTO.md` linha 302

#### ✉️ Marcar Mensagens como Lidas
- [ ] Adicionar campo `lida: boolean` na entity Mensagem
- [ ] Implementar endpoint `PUT /mensagens/:id/marcar-lida`
- [ ] Emitir evento WebSocket para atualização
- [ ] Atualizar contador de não lidas no frontend
- **Impacto**: Alta - UX esperada por usuários
- **Tempo estimado**: 3 horas
- **Referência**: `STATUS_BACKEND_ATENDIMENTO.md` linha 309

---

## ⚡ PRIORIDADE MÉDIA (Próximo mês)

### 4. Performance e Otimização

#### 🚀 Memoização de Componentes React
- [ ] Identificar componentes pesados (React DevTools Profiler)
- [ ] Aplicar `React.memo()` em componentes puros
- [ ] Usar `useMemo()` para cálculos pesados
- [ ] Usar `useCallback()` para funções passadas via props
- **Impacto**: Média - Melhora fluidez da UI
- **Tempo estimado**: 1 dia
- **Referência**: `STATUS_NUCLEO_ATENDIMENTO_2025.md` linha 427

#### 📊 Métricas de Monitoramento
- [ ] Integrar Prometheus para métricas
- [ ] Configurar Grafana para dashboards
- [ ] Adicionar alertas para erros críticos
- [ ] Monitorar tempo de resposta de APIs
- **Impacto**: Média - Observabilidade
- **Tempo estimado**: 2 dias
- **Referência**: `docs/RELATORIO_FINAL.md` linha 280

#### 🔌 Circuit Breaker para APIs Externas
- [ ] Implementar circuit breaker (library: opossum)
- [ ] Aplicar em: WhatsApp API, OpenAI, Anthropic
- [ ] Configurar fallback gracioso
- [ ] Adicionar retry com backoff exponencial
- **Impacto**: Média - Resiliência do sistema
- **Tempo estimado**: 1 dia
- **Referência**: `docs/RELATORIO_FINAL.md` linha 282

#### 🗄️ Backup Automático do Banco
- [ ] Criar script de backup PostgreSQL
- [ ] Agendar backups diários (cron)
- [ ] Armazenar backups em S3 ou similar
- [ ] Testar restore periódico
- **Impacto**: Média - Proteção de dados
- **Tempo estimado**: 4 horas
- **Referência**: `PRODUCTION_READY.md` linha 355

### 5. Backend - Features Complementares

#### 📋 Follow-up Automático de Tickets
- [ ] Criar sistema de follow-up quando ticket encerrado
- [ ] Agendar envio de mensagem após X dias
- [ ] Perguntar satisfação do cliente (CSAT)
- [ ] Reabertura automática se cliente responder
- **Impacto**: Média - Melhora qualidade do atendimento
- **Tempo estimado**: 1 dia
- **Referência**: `STATUS_BACKEND_ATENDIMENTO.md` linha 303

#### 📊 Pesquisa CSAT (Customer Satisfaction)
- [ ] Criar entity `PesquisaSatisfacao`
- [ ] Implementar envio automático após fechamento
- [ ] Coletar nota de 1-5 estrelas
- [ ] Dashboard de satisfação no frontend
- **Impacto**: Média - Métricas de qualidade
- **Tempo estimado**: 1 dia
- **Referência**: `STATUS_BACKEND_ATENDIMENTO.md` linha 304

#### 📎 Validação de Arquivos
- [ ] Limitar tamanho máximo de upload (10MB)
- [ ] Validar tipos de arquivo permitidos (whitelist)
- [ ] Scan de vírus em arquivos (ClamAV ou similar)
- [ ] Sanitizar nomes de arquivo
- **Impacto**: Média - Segurança e UX
- **Tempo estimado**: 4 hours
- **Referência**: `STATUS_BACKEND_ATENDIMENTO.md` linha 314

#### 🛡️ Sanitização de Conteúdo
- [ ] Sanitizar HTML em mensagens (DOMPurify)
- [ ] Escapar caracteres especiais em SQL
- [ ] Validar URLs em links enviados
- [ ] Prevenir XSS em campos de texto
- **Impacto**: Média - Segurança
- **Tempo estimado**: 3 horas
- **Referência**: `STATUS_BACKEND_ATENDIMENTO.md` linha 316

### 6. Frontend - Melhorias de UX

#### 🎨 Cards em vez de Tabela (Propostas)
- [ ] Redesenhar PropostasPage com cards
- [ ] Adicionar indicadores visuais de status
- [ ] Preview rápido dos produtos no card
- [ ] Tags de categoria coloridas
- **Impacto**: Média - UX mais moderna
- **Tempo estimado**: 4 horas
- **Referência**: `docs/changelog/SUCESSO_PROPOSTAS_FUNCIONANDO.md` linha 64

#### 📊 Dashboard de Propostas
- [ ] Total de propostas por status
- [ ] Valor total em negociação
- [ ] Taxa de conversão (fechadas/total)
- [ ] Gráficos simples (Chart.js)
- **Impacto**: Média - Visibilidade de métricas
- **Tempo estimado**: 1 dia
- **Referência**: `docs/changelog/SUCESSO_PROPOSTAS_FUNCIONANDO.md` linha 69

#### 🔔 Notificações Push no Browser
- [ ] Implementar Push Notifications API
- [ ] Solicitar permissão do usuário
- [ ] Notificar: novo ticket, nova mensagem, transferência
- [ ] Configurar som de alerta personalizável
- **Impacto**: Média - Atenção de atendentes
- **Tempo estimado**: 1 dia
- **Referência**: Implícito em várias referências

### 7. Integrações e APIs

#### 🔄 Integração Real Backend (Propostas)
- [ ] Substituir localStorage por API real
- [ ] Criar endpoints REST no backend
- [ ] Sincronização em tempo real via WebSocket
- [ ] Backup automático no banco
- **Impacto**: Média - Migração de mock para produção
- **Tempo estimado**: 1 dia
- **Referência**: `docs/changelog/SUCESSO_PROPOSTAS_FUNCIONANDO.md` linha 75

#### 📲 Gateway de Envio (WhatsApp/Telegram)
- [ ] Integrar MensagemService com WhatsApp API
- [ ] Adicionar suporte para Telegram
- [ ] Implementar retry em caso de falha
- [ ] Queue de mensagens para evitar rate limit
- **Impacto**: Média - Funcionalidade multi-canal
- **Tempo estimado**: 2 dias
- **Referência**: `STATUS_BACKEND_ATENDIMENTO.md` linha 311

### 8. Documentação

#### 📚 Guias de Troubleshooting
- [ ] Consolidar troubleshooting disperso em um único guia
- [ ] Adicionar screenshots dos erros comuns
- [ ] Criar fluxograma de decisão para debug
- [ ] Documentar logs importantes e onde procurar
- **Impacto**: Média - Reduz tempo de suporte
- **Tempo estimado**: 4 horas
- **Referência**: Vários arquivos (consolidar)

#### 🎓 Vídeos Tutoriais
- [ ] Criar vídeo: "Como criar uma tela do zero"
- [ ] Criar vídeo: "Troubleshooting do WebSocket"
- [ ] Criar vídeo: "Deploy em produção"
- [ ] Hospedar no YouTube ou S3
- **Impacto**: Média - Onboarding de novos devs
- **Tempo estimado**: 1 dia
- **Referência**: Implícito (melhoria sugerida)

---

## 🔮 PRIORIDADE BAIXA (Backlog)

### 9. Features Avançadas

#### 📜 Versionamento de Propostas
- [ ] Criar tabela `versoes_proposta`
- [ ] Salvar histórico de alterações
- [ ] Comparar versões lado a lado
- [ ] Restaurar versão anterior
- **Impacto**: Baixa - Nice to have
- **Tempo estimado**: 2 dias
- **Referência**: `docs/changelog/SUCESSO_PROPOSTAS_FUNCIONANDO.md` linha 80

#### ✅ Workflow de Aprovação
- [ ] Criar sistema de aprovação multi-nível
- [ ] Notificar aprovadores via email/push
- [ ] Dashboard de aprovações pendentes
- [ ] Histórico de aprovações/rejeições
- **Impacto**: Baixa - Governança corporativa
- **Tempo estimado**: 1 semana
- **Referência**: `docs/changelog/SUCESSO_PROPOSTAS_FUNCIONANDO.md` linha 81

#### 📄 Templates de Proposta
- [ ] Criar biblioteca de templates
- [ ] Editor visual de templates
- [ ] Variáveis dinâmicas ({{cliente}}, {{produto}})
- [ ] Preview em tempo real
- **Impacto**: Baixa - Produtividade
- **Tempo estimado**: 1 semana
- **Referência**: `docs/changelog/SUCESSO_PROPOSTAS_FUNCIONANDO.md` linha 82

#### 📈 Relatórios Avançados
- [ ] Relatório de performance por atendente
- [ ] Relatório de SLA (tempo médio de resposta)
- [ ] Relatório de satisfação (CSAT/NPS)
- [ ] Exportação em PDF/Excel
- **Impacto**: Baixa - Analytics avançado
- **Tempo estimado**: 2 semanas
- **Referência**: `docs/changelog/SUCESSO_PROPOSTAS_FUNCIONANDO.md` linha 83

### 10. Infraestrutura

#### 📦 Containers Non-Root
- [ ] Configurar containers Docker para rodar como non-root
- [ ] Atualizar Dockerfile com USER directive
- [ ] Testar permissões de arquivo
- [ ] Documentar mudanças
- **Impacto**: Baixa - Hardening de segurança
- **Tempo estimado**: 2 horas
- **Referência**: `PRODUCTION_READY.md` linha 354

#### 🌐 CDN para Assets Estáticos
- [ ] Configurar CloudFront ou similar
- [ ] Migrar imagens/CSS/JS para CDN
- [ ] Implementar cache headers corretos
- [ ] Testar performance
- **Impacto**: Baixa - Performance global
- **Tempo estimado**: 4 horas
- **Referência**: Melhoria sugerida

#### 🔍 Logs Centralizados
- [ ] Integrar com CloudWatch, ELK ou similar
- [ ] Estruturar logs em JSON
- [ ] Adicionar correlation IDs
- [ ] Criar dashboards de logs
- **Impacto**: Baixa - Observabilidade avançada
- **Tempo estimado**: 1 dia
- **Referência**: `PRODUCTION_READY.md` linha 356

### 11. Qualidade de Código

#### 🧹 Limpeza de Código Técnico
- [ ] Remover arquivos temporários não usados
- [ ] Limpar comentários obsoletos
- [ ] Refatorar código duplicado
- [ ] Organizar imports consistentemente
- **Impacto**: Baixa - Manutenibilidade
- **Tempo estimado**: 2 dias
- **Referência**: `backend/resumo-sistema-completo.ps1` linha 186

#### 📐 Linting Rigoroso
- [ ] Configurar ESLint mais restritivo
- [ ] Adicionar Prettier para formatação
- [ ] Integrar no pre-commit hook (Husky)
- [ ] Corrigir warnings existentes
- **Impacto**: Baixa - Consistência de código
- **Tempo estimado**: 1 dia
- **Referência**: Melhoria sugerida

### 12. Acessibilidade (a11y)

#### ♿ Conformidade WCAG 2.1
- [ ] Adicionar labels em todos os inputs
- [ ] Garantir contraste mínimo (4.5:1)
- [ ] Navegação completa por teclado
- [ ] Screen reader compatibility
- **Impacto**: Baixa - Inclusão
- **Tempo estimado**: 1 semana
- **Referência**: Requisito de acessibilidade

---

## 📊 Métricas de Progresso

### Por Categoria
```
Segurança:       ▓▓▓▓▓▓░░░░ 60% (3/5 completas)
Performance:     ▓▓░░░░░░░░ 20% (1/5 completas)
Features:        ▓▓▓▓▓▓▓░░░ 70% (14/20 completas)
Documentação:    ▓▓▓▓▓▓▓▓░░ 80% (4/5 completas)
Infraestrutura:  ▓▓▓▓▓░░░░░ 50% (2/4 completas)
Qualidade:       ▓▓▓▓░░░░░░ 40% (2/5 completas)
```

### Por Prioridade
```
ALTA:   ▓▓▓░░░░░░░ 37% (3/8 completas)
MÉDIA:  ▓▓▓▓▓▓░░░░ 57% (12/21 completas)
BAIXA:  ▓░░░░░░░░░ 11% (2/18 completas)
```

### Total Geral
```
▓▓▓▓░░░░░░ 36% (17/47 melhorias completas)
```

---

## 🎯 Sprints Sugeridos

### Sprint 1 (Próxima semana) - SEGURANÇA
- [ ] SSL/HTTPS
- [ ] Rate Limiting
- [ ] Firewall AWS
- [ ] Notas Internas
- [ ] Notificações de Transferência

**Objetivo**: Preparar para produção segura

### Sprint 2 (2ª semana) - QUALIDADE
- [ ] Testes automatizados
- [ ] CI/CD com GitHub Actions
- [ ] Marcar mensagens como lidas
- [ ] Validação de arquivos
- [ ] Sanitização de conteúdo

**Objetivo**: Aumentar confiabilidade

### Sprint 3 (3ª semana) - PERFORMANCE
- [ ] Memoização de componentes
- [ ] Métricas de monitoramento
- [ ] Circuit breaker
- [ ] Backup automático

**Objetivo**: Otimizar e observar

### Sprint 4 (4ª semana) - FEATURES
- [ ] Follow-up automático
- [ ] Pesquisa CSAT
- [ ] Dashboard de propostas
- [ ] Gateway multi-canal

**Objetivo**: Enriquecer funcionalidades

---

## 📝 Como Usar Este Roadmap

### Para Desenvolvedores
1. Escolha uma melhoria de **PRIORIDADE ALTA** primeiro
2. Leia a **Referência** para contexto completo
3. Estime o tempo e planeje
4. Marque como completa ao terminar
5. Commite com mensagem: `feat(categoria): descrição da melhoria`

### Para Product Owners
1. Revise prioridades trimestralmente
2. Ajuste baseado em feedback de usuários
3. Adicione novas melhorias conforme necessário
4. Comemore quando sprint é concluído! 🎉

### Para Gestores
1. Use métricas de progresso para reporting
2. Aloque recursos baseado em prioridades
3. Identifique bloqueadores cedo
4. Mantenha equipe focada em valor de negócio

---

## 🔗 Arquivos Relacionados

- `PRODUCTION_READY.md` - Checklist de produção
- `STATUS_BACKEND_ATENDIMENTO.md` - TODOs do backend
- `STATUS_NUCLEO_ATENDIMENTO_2025.md` - Métricas de qualidade
- `docs/RELATORIO_FINAL.md` - Lições aprendidas
- `docs/changelog/SUCESSO_PROPOSTAS_FUNCIONANDO.md` - Próximas iterações

---

## 📞 Suporte

**Dúvidas sobre este roadmap?**
- Consulte `SUPPORT.md` para abrir issue
- Procure por `TODO` ou `FIXME` no código
- Verifique documentos `CORRECAO_*.md` para contexto histórico

---

**Última revisão**: 3 de novembro de 2025  
**Próxima revisão**: 10 de novembro de 2025  
**Responsável**: Equipe ConectCRM
