
# 📚 Documentação do Conect360

## 📁 Estrutura da Documentação

### 📋 `/changelog`

**27 arquivos** - Histórico de correções, mudanças e status do sistema

- Correções de bugs e problemas
- Status de implementações
- Soluções aplicadas
- Reorganizações realizadas

### 📖 `/guides`

**11 arquivos** - Guias e manuais de configuração

- Guias de configuração do sistema
- Instruções de setup
- Credenciais e dependências
- Melhorias e otimizações

### 🔧 `/implementation`

**49 arquivos** - Documentação de funcionalidades implementadas

- Sistemas implementados (dashboard, funil, clientes, etc.)
- Módulos e componentes
- Integrações e APIs
- Interfaces e layouts

### 🐛 `/debug`

**6 arquivos** - Logs de debug e diagnósticos

- Diagnósticos de performance
- Logs de depuração
- Execução de processos

### 📘 `/handbook`

Governança de foco e operação do Copilot (índices, decisões, auditorias e guias práticos).

Links rápidos:

- [INDICE_DOCUMENTACAO.md](./handbook/INDICE_DOCUMENTACAO.md)
- [CONTEXTO_ATUAL.md](./handbook/CONTEXTO_ATUAL.md)
- [PRIORIDADES_ATIVAS.md](./handbook/PRIORIDADES_ATIVAS.md)
- [DECISOES_TECNICAS.md](./handbook/DECISOES_TECNICAS.md)
- [TEMPLATE_TAREFA.md](./handbook/TEMPLATE_TAREFA.md)
- [AUDITORIA_DOCUMENTACAO_ATUAL.md](./handbook/AUDITORIA_DOCUMENTACAO_ATUAL.md)
- [MAPA_MODULOS_TECNICOS.md](./handbook/MAPA_MODULOS_TECNICOS.md)

### 📱 Webhook WhatsApp (NOVO!)

**10 arquivos** - Documentação completa do webhook WhatsApp Business API

- Status atual do sistema
- Resolução de problemas (401, UUID)
- Guias de configuração e ativação
- Testes e validação
- Scripts de automação

**🚀 Início Rápido Webhook**: [STATUS_WEBHOOK_ATUAL.md](./STATUS_WEBHOOK_ATUAL.md)  
**📚 Índice Completo**: [INDICE_WEBHOOK_WHATSAPP.md](./INDICE_WEBHOOK_WHATSAPP.md)

---

## 📂 Estrutura Geral do Projeto

```text
conectcrm/
├── 📁 docs/                    # Toda documentação (.md)
│   ├── 📱 Webhook WhatsApp     # 10 arquivos (NOVO!)
│   ├── 📋 changelog/           # 27 arquivos
│   ├── 📖 guides/              # 11 arquivos
│   ├── 🔧 implementation/      # 49 arquivos
│   ├── 🐛 debug/               # 6 arquivos
│   └── 📘 handbook/            # Governança (Copilot)
├── 📁 temp/                    # Arquivos temporários e testes
├── 📁 backend/                 # API backend (NestJS)
├── 📁 frontend-web/            # Interface web (React)
├── 📁 mobile/                  # App mobile
├── 📁 scripts/                 # Scripts de automação
├── 📁 public/                  # Arquivos públicos
└── ⚙️ Arquivos de configuração # tsconfig.json, craco.config.js, etc.
```

## ⚠️ Arquivos Importantes na Raiz

Os seguintes arquivos **NÃO foram movidos** por serem críticos para o funcionamento:

- `tsconfig.json` - Configuração TypeScript global
- `craco.config.js` - Configuração do React
- `*.bat` e `*.ps1` - Scripts com caminhos hardcoded
- `init-users.sql` - Script SQL referenciado em múltiplos lugares

## 📝 IMPORTANTE: Criação de Novos Documentos

### 🎯 Antes de criar um novo arquivo .md:

1. **Determine a categoria** do documento:
   - 📋 **Correção/Bug/Status** → `docs/changelog/`
   - 📖 **Guia/Manual/Config** → `docs/guides/`
   - 🔧 **Implementação/Feature** → `docs/implementation/`
   - 🐛 **Debug/Diagnóstico** → `docs/debug/`

2. **Se não se encaixar em nenhuma categoria:**
   - Crie uma nova pasta em `docs/` com nome descritivo
   - Exemplo: `docs/api/`, `docs/deployment/`, `docs/security/`

3. **Nomenclatura recomendada:**
   - Use MAIÚSCULAS para consistência: `NOVA_FUNCIONALIDADE.md`
   - Seja descritivo: `IMPLEMENTACAO_CHAT_REAL_TIME.md`
   - Use underscore para separar palavras

### ⚠️ NÃO criar arquivos .md na raiz do projeto!

A raiz deve conter apenas arquivos críticos de configuração.

---

_Organização realizada em: 23/07/2025_
