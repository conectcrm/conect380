-- Criar tabelas do módulo de atendimento omnichannel

-- Tabela de Canais
CREATE TABLE IF NOT EXISTS canais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  "empresaId" UUID NOT NULL,
  ativo BOOLEAN DEFAULT false,
  configuracao JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "deletedAt" TIMESTAMP,
  FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE
);

-- Tabela de Filas
CREATE TABLE IF NOT EXISTS filas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  "empresaId" UUID NOT NULL,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  "horarioAtendimento" JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "deletedAt" TIMESTAMP,
  FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE
);

-- Tabela de Atendentes
CREATE TABLE IF NOT EXISTS atendentes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  "usuarioId" UUID,
  "empresaId" UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'DISPONIVEL',
  "capacidadeMaxima" INTEGER DEFAULT 5,
  "ticketsAtivos" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "deletedAt" TIMESTAMP,
  FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE,
  FOREIGN KEY ("usuarioId") REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero SERIAL,
  assunto VARCHAR(255),
  remetente JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'ABERTO',
  prioridade VARCHAR(20) DEFAULT 'MEDIA',
  origem VARCHAR(20) NOT NULL,
  "canalId" UUID,
  "filaId" UUID,
  "atendenteId" UUID,
  "empresaId" UUID NOT NULL,
  "primeiraResposta" TIMESTAMP,
  "ultimaInteracao" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "closedAt" TIMESTAMP,
  "deletedAt" TIMESTAMP,
  FOREIGN KEY ("canalId") REFERENCES canais(id) ON DELETE SET NULL,
  FOREIGN KEY ("filaId") REFERENCES filas(id) ON DELETE SET NULL,
  FOREIGN KEY ("atendenteId") REFERENCES atendentes(id) ON DELETE SET NULL,
  FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE
);

-- Tabela de Mensagens
CREATE TABLE IF NOT EXISTS mensagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "ticketId" UUID NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  conteudo TEXT NOT NULL,
  remetente VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'ENVIADA',
  midia JSONB,
  "idExterno" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "deletedAt" TIMESTAMP,
  FOREIGN KEY ("ticketId") REFERENCES tickets(id) ON DELETE CASCADE
);

-- Tabela de Histórico
CREATE TABLE IF NOT EXISTS historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "ticketId" UUID NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  descricao TEXT,
  "valorAnterior" TEXT,
  "valorNovo" TEXT,
  "usuarioId" UUID,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("ticketId") REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY ("usuarioId") REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de relacionamento Atendente-Fila
CREATE TABLE IF NOT EXISTS atendente_fila (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "atendenteId" UUID NOT NULL,
  "filaId" UUID NOT NULL,
  prioridade INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("atendenteId") REFERENCES atendentes(id) ON DELETE CASCADE,
  FOREIGN KEY ("filaId") REFERENCES filas(id) ON DELETE CASCADE,
  UNIQUE ("atendenteId", "filaId")
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_canais_empresa ON canais("empresaId");
CREATE INDEX IF NOT EXISTS idx_filas_empresa ON filas("empresaId");
CREATE INDEX IF NOT EXISTS idx_atendentes_empresa ON atendentes("empresaId");
CREATE INDEX IF NOT EXISTS idx_tickets_empresa ON tickets("empresaId");
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_atendente ON tickets("atendenteId");
CREATE INDEX IF NOT EXISTS idx_mensagens_ticket ON mensagens("ticketId");
CREATE INDEX IF NOT EXISTS idx_historico_ticket ON historico("ticketId");

-- Comentários
COMMENT ON TABLE canais IS 'Canais de comunicação (WhatsApp, Telegram, Email, etc)';
COMMENT ON TABLE filas IS 'Filas de atendimento para distribuição de tickets';
COMMENT ON TABLE atendentes IS 'Atendentes/Agentes do sistema';
COMMENT ON TABLE tickets IS 'Tickets de atendimento';
COMMENT ON TABLE mensagens IS 'Mensagens trocadas nos tickets';
COMMENT ON TABLE historico IS 'Histórico de alterações dos tickets';
COMMENT ON TABLE atendente_fila IS 'Relacionamento entre atendentes e filas';
