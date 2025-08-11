# 🤖 Diretrizes para GitHub Copilot - ConectCRM

## 📋 Padrão de Documentação Obrigatório

**IMPORTANTE**: O GitHub Copilot deve SEMPRE seguir este padrão de organização quando criar documentação para funcionalidades do ConectCRM.

### 📁 Estrutura de Documentação Padrão

```
doc/
└── [nome-do-modulo]/
    ├── README.md                    # Índice geral e navegação
    ├── [funcionalidade]-detalhada.md # Documentação técnica completa
    └── exemplos-praticos-[funcionalidade].md # Exemplos práticos e casos de uso
```

### 📄 Arquivos Obrigatórios

#### 1. **README.md** - Arquivo Índice
- Visão geral da documentação
- Estrutura dos arquivos
- Guia de uso por perfil (desenvolvedor, usuário, QA)
- Configurações recomendadas
- Links para suporte e contribuição

#### 2. **[funcionalidade]-detalhada.md** - Documentação Técnica
- **Visão Geral**: Funcionalidades e características
- **Como Usar**: Passo a passo detalhado
- **Componentes Disponíveis**: Tabela completa com todas as opções
- **Comportamento Responsivo**: Código CSS e comportamento
- **Persistência de Dados**: Como os dados são salvos
- **Arquitetura Técnica**: Componentes e fluxo de dados
- **Casos de Uso**: Recomendações por perfil profissional
- **Troubleshooting**: Soluções para problemas comuns
- **Futuras Melhorias**: Roadmap de funcionalidades

#### 3. **exemplos-praticos-[funcionalidade].md** - Guia Prático
- **Cenários Reais**: Diferentes perfis profissionais
- **Comportamento por Dispositivo**: Visual por tamanho de tela
- **Exemplos de Código**: Implementações específicas
- **Testes de Funcionalidade**: Como validar
- **Customização Avançada**: Como expandir funcionalidades
- **Checklist**: Para desenvolvedores, QA e usuários finais

## 🎯 Exemplo de Referência: Configuração de Cards do Faturamento

### ✅ **Estrutura Implementada Corretamente**
```
doc/
└── faturamento/
    ├── README.md
    ├── configuracao-cards-dashboard.md
    └── exemplos-praticos-cards.md
```

### 📊 **Características do Exemplo**
- **Completa e Detalhada**: Cobre todos os aspectos técnicos e práticos
- **Multi-Público**: Desenvolvedores, usuários, QA, gerentes
- **Prática e Aplicável**: Cenários reais de diferentes perfis
- **Futuro-Proof**: Roadmap e guias de contribuição

## 📝 Templates Obrigatórios

### **Template README.md**
```markdown
# 📚 Documentação do Módulo [NOME]

## 📁 Estrutura da Documentação
## 📄 Arquivos Disponíveis
## 🎯 Funcionalidades Documentadas
## 🚀 Como Usar Esta Documentação
## [Conteúdo específico do módulo]
## 🔧 Configurações Recomendadas
## 🎨 Layouts/Comportamentos
## 🔄 Atualizações
## 📞 Suporte
## 🏗️ Contribuição
```

### **Template Documentação Técnica**
```markdown
# 📊 [Nome da Funcionalidade] - [Módulo]

## 📋 Visão Geral
## ⭐ Características Principais
## 🔧 Como Configurar/Usar
## 📊 Componentes/Opções Disponíveis
## 🎨 Comportamento Responsivo/Visual
## 💾 Persistência de Dados
## 🛠️ Arquitetura Técnica
## 🎯 Casos de Uso Recomendados
## 🔍 Troubleshooting
## 📈 Métricas e Analytics (se aplicável)
## 🚀 Futuras Melhorias
## 📞 Suporte
```

### **Template Exemplos Práticos**
```markdown
# 💡 Exemplos Práticos - [Funcionalidade]

## 🎯 Cenários de Uso Real
## 📱 Comportamento por Dispositivo
## 🎨 Exemplos de Código
## 🧪 Testes de Funcionalidade
## 📊 Métricas de Performance
## 🔧 Customização Avançada
## 📋 Checklist de Implementação
```

## 🎨 Padrões de Formatação

### **Emojis Obrigatórios**
- 📚 Documentação
- 📁 Estrutura/Pastas
- 📄 Arquivos
- 🎯 Objetivos/Funcionalidades
- 🚀 Como usar/Início rápido
- 🔧 Configurações
- 🎨 Visual/Layout
- 📱 Responsividade
- 💾 Dados/Persistência
- 🛠️ Técnico/Arquitetura
- 🧪 Testes
- 📊 Métricas/Analytics
- 🔍 Troubleshooting
- 📞 Suporte
- 🏗️ Contribuição
- ✅ Concluído/Implementado
- 🔄 Em progresso/Futuro

### **Formatação de Código**
- Usar blocos de código com linguagem especificada
- Incluir comentários explicativos
- Exemplos práticos e funcionais

### **Tabelas Padronizadas**
- Sempre usar headers descritivos
- Incluir colunas de descrição e uso
- Adicionar exemplos quando relevante

## 🔒 Regras Obrigatórias

### **✅ SEMPRE FAZER**
1. Criar os 3 arquivos obrigatórios (README + técnico + exemplos)
2. Usar a estrutura de pastas padrão
3. Incluir seções de troubleshooting
4. Adicionar exemplos práticos por perfil profissional
5. Documentar arquitetura técnica
6. Incluir roadmap de futuras melhorias
7. Usar emojis padronizados
8. Criar checklists para diferentes públicos

### **❌ NUNCA FAZER**
1. Criar documentação em arquivo único
2. Omitir exemplos práticos
3. Ignorar casos de uso por perfil
4. Esquecer da seção de troubleshooting
5. Não incluir arquitetura técnica
6. Documentar sem contexto responsivo
7. Omitir informações de persistência de dados
8. Criar sem roadmap futuro

## 📈 Métricas de Qualidade

### **Documentação Completa Deve Ter**
- ✅ Mínimo de 3 arquivos
- ✅ Pelo menos 4 cenários de uso diferentes
- ✅ Seção de troubleshooting com 3+ problemas comuns
- ✅ Exemplos de código funcionais
- ✅ Checklist para 3+ perfis (dev, QA, usuário)
- ✅ Arquitetura técnica com componentes
- ✅ Roadmap com futuras versões

## 🔄 Processo de Criação

### **Sequência Obrigatória**
1. **Analisar funcionalidade** e definir módulo
2. **Criar estrutura de pastas** `doc/[modulo]/`
3. **Criar README.md** com índice geral
4. **Criar documentação técnica** completa
5. **Criar exemplos práticos** com cenários reais
6. **Revisar completude** contra checklist
7. **Validar padrões** de formatação e estrutura

## 💡 Exemplo de Uso Desta Diretriz

**Situação**: Copilot precisa documentar nova funcionalidade "Relatórios Personalizados" no módulo "relatórios"

**Ação Obrigatória**:
1. Criar `doc/relatorios/`
2. Criar `README.md` com índice
3. Criar `relatorios-personalizados-detalhado.md`
4. Criar `exemplos-praticos-relatorios.md`
5. Seguir todos os templates e padrões

---

**⚠️ AVISO IMPORTANTE**: Esta diretriz é OBRIGATÓRIA para todas as documentações criadas pelo GitHub Copilot no projeto ConectCRM. Não seguir este padrão resultará em documentação inconsistente e incompleta.

**Última atualização**: 7 de agosto de 2025  
**Responsável**: Equipe de Desenvolvimento  
**Status**: OBRIGATÓRIO para GitHub Copilot
