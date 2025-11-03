# 💬 Suporte e Recursos

Obrigado por usar o **ConectSuite**! Este documento contém informações sobre como obter ajuda e recursos disponíveis.

## 📚 Documentação

Antes de pedir ajuda, consulte nossa documentação:

### Documentação Técnica
- **[README.md](./README.md)** - Visão geral, instalação, stack, deploy
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Como contribuir com o projeto
- **[CHANGELOG.md](./CHANGELOG.md)** - Histórico de versões e mudanças
- **[DESIGN_GUIDELINES.md](./frontend-web/DESIGN_GUIDELINES.md)** - Guia de design e UX

### Guias Específicos
- **[Integração WhatsApp](./CONFIGURACAO_META_WHATSAPP.md)** - Configurar API do WhatsApp
- **[Chat Real-Time](./CHAT_REALTIME_README.md)** - Sistema de chat e WebSocket
- **[Backend Integration](./BACKEND_INTEGRATION_README.md)** - Integração com backend
- **[Comandos Rápidos](./COMANDOS_RAPIDOS.md)** - Comandos úteis para desenvolvimento

## 🆘 Como Obter Ajuda

### 1. Perguntas e Dúvidas Gerais

**GitHub Discussions** (recomendado)  
Para dúvidas sobre uso, boas práticas, arquitetura:
- [Abrir uma Discussion](https://github.com/Dhonleno/conectsuite/discussions)
- Categorias:
  - 💬 **Q&A** - Perguntas e respostas
  - 💡 **Ideas** - Sugestões de melhorias
  - 🙌 **Show and Tell** - Compartilhe seu uso do ConectSuite
  - 📣 **Announcements** - Novidades (somente equipe)

### 2. Bugs e Problemas Técnicos

**GitHub Issues**  
Para reportar bugs, erros ou comportamentos inesperados:
- [Abrir uma Issue de Bug](https://github.com/Dhonleno/conectsuite/issues/new?template=bug_report.md)
- Inclua:
  - Descrição clara do problema
  - Passos para reproduzir
  - Comportamento esperado vs. atual
  - Screenshots/logs (se possível)
  - Versão do sistema
  - Ambiente (dev/prod, SO, Node version)

**Antes de abrir uma issue:**
- [ ] Procure issues existentes (pode já estar reportado)
- [ ] Verifique se está na versão mais recente
- [ ] Rode `npm audit` para verificar dependências
- [ ] Confira os logs do console

### 3. Solicitação de Features

**GitHub Issues**  
Para sugerir novas funcionalidades:
- [Abrir uma Issue de Feature Request](https://github.com/Dhonleno/conectsuite/issues/new?template=feature_request.md)
- Inclua:
  - Problema que a feature resolve
  - Solução proposta
  - Alternativas consideradas
  - Mockups/designs (se aplicável)
  - Prioridade e impacto

### 4. Vulnerabilidades de Segurança

**NÃO use Issues públicas para reportar vulnerabilidades!**

Veja: **[SECURITY.md](./SECURITY.md)**
- Email: security@conectsuite.com
- Resposta em até 48 horas
- Divulgação coordenada

## 🚀 Recursos Rápidos

### Stack Tecnológica

#### Backend
- **Framework**: NestJS 10
- **Banco de Dados**: PostgreSQL 15
- **ORM**: TypeORM
- **Cache**: Redis
- **Real-time**: Socket.io
- **IA**: Anthropic Claude, OpenAI

#### Frontend
- **Framework**: React 18 + TypeScript
- **Estilização**: Tailwind CSS
- **Ícones**: Lucide React
- **HTTP**: Axios
- **WebSocket**: Socket.io-client

### Comandos Úteis

```powershell
# Backend
cd backend
npm run start:dev          # Iniciar em modo desenvolvimento
npm run build              # Build para produção
npm run migration:generate # Gerar migration
npm run migration:run      # Rodar migrations

# Frontend
cd frontend-web
npm start                  # Iniciar servidor React
npm run build              # Build para produção
npm test                   # Rodar testes

# Docker
docker-compose up -d       # Subir containers (PostgreSQL + Redis)
docker-compose down        # Parar containers
docker-compose logs -f     # Ver logs
```

### Solução de Problemas Comuns

#### ❌ Erro: "EntityMetadataNotFoundError"
```typescript
// Adicionar entity em backend/src/config/database.config.ts
entities: [
  // ...
  MinhaNovaEntity,  // ← Adicionar aqui
],
```

#### ❌ Erro: 404 - Rota não encontrada
```typescript
// 1. Verificar se controller está registrado no module
// 2. Verificar decorador @Controller() no controller
// 3. Verificar se module está em app.module.ts
```

#### ❌ CORS Error no Frontend
```typescript
// Backend - main.ts
app.enableCors({ 
  origin: 'http://localhost:3000',
  credentials: true 
});
```

#### ❌ Migration Error: "relation already exists"
```powershell
# Reverter última migration
npm run migration:revert

# Ou dropar tabela manualmente e rodar novamente
```

## 🤝 Comunidade

### Onde Encontrar Outros Desenvolvedores

- **GitHub Discussions**: Fórum oficial de discussões
- **Issues**: Rastreamento de bugs e features
- **Pull Requests**: Contribuições de código

### Como Contribuir

1. Leia [CONTRIBUTING.md](./CONTRIBUTING.md)
2. Fork o repositório
3. Crie uma branch: `git checkout -b minha-feature`
4. Commit: `git commit -m "feat: adicionar feature X"`
5. Push: `git push origin minha-feature`
6. Abra um Pull Request

## 📊 Status do Projeto

- **Versão Atual**: 1.0.0
- **Status**: ✅ Estável (Produção)
- **Última Atualização**: Novembro 2025

### Roadmap

#### v1.1 (Curto Prazo)
- [ ] Testes automatizados (Jest + React Testing Library)
- [ ] CI/CD com GitHub Actions
- [ ] Documentação Swagger (OpenAPI)
- [ ] Logs centralizados (Winston)

#### v2.0 (Longo Prazo)
- [ ] Sistema de notificações push
- [ ] Dashboard de BI (métricas avançadas)
- [ ] Integração com múltiplas plataformas (Telegram, Instagram)
- [ ] Mobile app (React Native)

## 📞 Contato

### Para Empresas/Parcerias
- Email: contato@conectsuite.com
- Website: (em breve)

### Para Desenvolvedores
- GitHub Issues: [Criar Issue](https://github.com/Dhonleno/conectsuite/issues/new/choose)
- GitHub Discussions: [Participar](https://github.com/Dhonleno/conectsuite/discussions)

### Para Segurança
- Email: security@conectsuite.com
- Ver: [SECURITY.md](./SECURITY.md)

## ⏰ Tempo de Resposta Esperado

| Tipo | Tempo de Resposta |
|------|-------------------|
| Vulnerabilidade de Segurança | 48 horas |
| Bug Crítico (produção parada) | 24-48 horas |
| Bug Normal | 3-7 dias |
| Feature Request | 7-14 dias (análise) |
| Dúvida Geral (Discussion) | 2-5 dias |

**Nota**: Tempos são estimativas. Issues com label `critical` têm prioridade.

## 🎓 Recursos de Aprendizado

### Tecnologias Utilizadas

- **NestJS**: https://docs.nestjs.com
- **React**: https://react.dev
- **TypeORM**: https://typeorm.io
- **PostgreSQL**: https://www.postgresql.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Socket.io**: https://socket.io/docs

### Tutoriais ConectSuite

_(em construção - contribuições são bem-vindas!)_

- [ ] Como criar um novo módulo (backend)
- [ ] Como criar uma nova página (frontend)
- [ ] Como integrar com API externa
- [ ] Como configurar bot de triagem
- [ ] Como fazer deploy em produção

## 📜 Licença

ConectSuite é proprietário. Para questões de licenciamento:
- Email: contato@conectsuite.com

---

**Obrigado por usar o ConectSuite!** 🚀  
Se este projeto te ajudou, considere deixar uma ⭐ no GitHub!

[⬆ Voltar ao topo](#-suporte-e-recursos)
