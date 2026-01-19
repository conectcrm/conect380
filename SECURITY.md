# Política de Segurança

## 🔒 Versões Suportadas

Atualmente estamos fornecendo atualizações de segurança para as seguintes versões:

| Versão | Suportada          |
| ------ | ------------------ |
| 1.0.x  | :white_check_mark: |
| < 1.0  | :x:                |

## 🚨 Reportando uma Vulnerabilidade

**Por favor, NÃO reporte vulnerabilidades de segurança através de issues públicas do GitHub.**

Se você descobrir uma vulnerabilidade de segurança, por favor, siga estas etapas:

### 1. Reporte Privadamente

Envie um email para: **security@conectsuite.com** (ou contato interno da equipe)

Inclua:
- Descrição detalhada da vulnerabilidade
- Passos para reproduzir o problema
- Impacto potencial
- Versões afetadas
- Sugestões de correção (se houver)

### 2. Aguarde Resposta

- Você receberá uma resposta em até **48 horas**
- A equipe irá investigar e validar o reporte
- Manteremos você informado sobre o progresso

### 3. Divulgação Coordenada

- Trabalharemos com você para entender e corrigir o problema
- Solicitamos que **não divulgue publicamente** até que um patch seja lançado
- Você será creditado na correção (se desejar)

## 🛡️ Boas Práticas de Segurança

### Para Desenvolvedores

#### ✅ Faça

- Use variáveis de ambiente para dados sensíveis
- Valide TODAS as entradas de usuário
- Sanitize dados antes de usar em queries
- Use prepared statements/ORMs para SQL
- Implemente rate limiting em APIs públicas
- Use HTTPS em produção
- Mantenha dependências atualizadas
- Revise código antes de merge
- Rode análise de segurança (npm audit)
- Use JWT com expiração curta
- Implemente CORS corretamente
- Log de ações sensíveis (mas não de dados sensíveis)

#### ❌ Nunca

- Commite credenciais no repositório
- Exponha stack traces em produção
- Use `eval()` ou `Function()` com input de usuário
- Desabilite validações de segurança
- Armazene senhas em texto plano
- Confie em dados do cliente sem validação
- Use bibliotecas com vulnerabilidades conhecidas
- Exponha informações de debug em produção

### Para Usuários/Administradores

- Use senhas fortes (mínimo 12 caracteres)
- Ative autenticação de dois fatores quando disponível
- Mantenha o sistema atualizado
- Faça backups regulares
- Monitore logs de acesso
- Use HTTPS sempre
- Revise permissões de usuários regularmente
- Não compartilhe credenciais

## 🔐 Recursos de Segurança Implementados

### Autenticação
- ✅ JWT com expiração configurável
- ✅ Refresh tokens
- ✅ Password hashing com bcrypt (salt rounds: 10)
- ✅ Guards de proteção de rotas
- ✅ Validação de tokens

### Autorização
- ✅ Sistema de permissões hierárquicas
- ✅ Row Level Security (RLS) no PostgreSQL
- ✅ Isolamento multi-tenant completo
- ✅ Validação de acesso por empresa

### Validação de Dados
- ✅ class-validator em todos os DTOs
- ✅ Sanitização de inputs
- ✅ Validação de tipos TypeScript
- ✅ Whitelist de campos permitidos

### Comunicação
- ✅ HTTPS em produção
- ✅ CORS configurado
- ✅ Secure headers (Helmet.js)
- ✅ Rate limiting

### Banco de Dados
- ✅ Prepared statements (TypeORM)
- ✅ Row Level Security (RLS)
- ✅ Backups automáticos
- ✅ Migrations versionadas

### Logs e Monitoramento
- ✅ Logs estruturados
- ✅ Auditoria de ações sensíveis
- ✅ Monitoramento de erros
- ✅ Alertas de atividades suspeitas

## 📋 Checklist de Segurança para Deploy

Antes de fazer deploy em produção:

- [ ] Todas as variáveis de ambiente estão configuradas
- [ ] `.env` está no `.gitignore`
- [ ] JWT_SECRET é forte (mínimo 32 caracteres)
- [ ] HTTPS está ativado
- [ ] CORS está configurado corretamente
- [ ] Rate limiting está ativo
- [ ] Database passwords são fortes
- [ ] Backups automáticos estão configurados
- [ ] Logs estão sendo monitorados
- [ ] `npm audit` não retorna vulnerabilidades críticas
- [ ] Secrets do GitHub estão configurados
- [ ] Firewall está configurado (apenas portas necessárias)
- [ ] Database não está exposto publicamente
- [ ] Redis tem senha configurada (se exposto)
- [ ] Atualizações de segurança agendadas

## 🔄 Processo de Atualização de Segurança

1. Vulnerabilidade identificada
2. Patch desenvolvido e testado
3. Nova versão lançada (patch version)
4. Changelog atualizado
5. Usuários notificados
6. Deploy em produção ASAP

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

## 📞 Contato

Para questões de segurança:
- Email: security@conectsuite.com
- Para issues não sensíveis: [GitHub Issues](https://github.com/Dhonleno/conect360/issues)

---

**Última atualização**: Novembro 2025  
**Versão**: 1.0.0
