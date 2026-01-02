-- Criação das tabelas para o módulo de oportunidades/funil de vendas

-- Tabela de oportunidades
CREATE TABLE oportunidades (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    valor DECIMAL(12,2) DEFAULT 0,
    probabilidade INTEGER DEFAULT 0 CHECK (probabilidade >= 0 AND probabilidade <= 100),
    estagio VARCHAR(20) DEFAULT 'leads' CHECK (estagio IN ('leads', 'qualification', 'proposal', 'negotiation', 'closing', 'won', 'lost')),
    prioridade VARCHAR(10) DEFAULT 'medium' CHECK (prioridade IN ('low', 'medium', 'high')),
    origem VARCHAR(20) DEFAULT 'website' CHECK (origem IN ('website', 'indicacao', 'telefone', 'email', 'redes_sociais', 'evento', 'parceiro', 'campanha')),
    tags TEXT[], -- Array de strings para PostgreSQL
    data_fechamento_esperado DATE,
    data_fechamento_real DATE,
    
    -- Relacionamentos
    responsavel_id INTEGER NOT NULL REFERENCES users(id),
    cliente_id INTEGER REFERENCES clientes(id),
    
    -- Informações de contato (quando não há cliente)
    nome_contato VARCHAR(255),
    email_contato VARCHAR(255),
    telefone_contato VARCHAR(20),
    empresa_contato VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_oportunidades_estagio ON oportunidades(estagio);
CREATE INDEX idx_oportunidades_responsavel ON oportunidades(responsavel_id);
CREATE INDEX idx_oportunidades_cliente ON oportunidades(cliente_id);
CREATE INDEX idx_oportunidades_data_criacao ON oportunidades(created_at);
CREATE INDEX idx_oportunidades_data_fechamento ON oportunidades(data_fechamento_esperado);

-- Tabela de atividades
CREATE TABLE atividades (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(10) DEFAULT 'note' CHECK (tipo IN ('call', 'email', 'meeting', 'note', 'task')),
    descricao TEXT NOT NULL,
    data_atividade TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Relacionamentos
    oportunidade_id INTEGER NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
    criado_por_id INTEGER NOT NULL REFERENCES users(id),
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para atividades
CREATE INDEX idx_atividades_oportunidade ON atividades(oportunidade_id);
CREATE INDEX idx_atividades_data ON atividades(data_atividade);
CREATE INDEX idx_atividades_criado_por ON atividades(criado_por_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_oportunidades_updated_at 
    BEFORE UPDATE ON oportunidades 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dados de exemplo para teste
INSERT INTO oportunidades (
    titulo, descricao, valor, probabilidade, estagio, prioridade, origem, tags,
    data_fechamento_esperado, responsavel_id, nome_contato, email_contato, 
    telefone_contato, empresa_contato
) VALUES 
(
    'Implementação Sistema ERP - Empresa ABC',
    'Sistema ERP completo para gestão empresarial com módulos financeiro, estoque e vendas.',
    85000.00,
    80,
    'negotiation',
    'high',
    'website',
    ARRAY['ERP', 'Implementação'],
    '2025-08-15',
    (SELECT id FROM users WHERE email = 'ana@conectcrm.com' LIMIT 1),
    'Carlos Alberto',
    'carlos@empresaabc.com.br',
    '(11) 98765-4321',
    'Empresa ABC Ltda'
),
(
    'Consultoria Digital - TechStart',
    'Consultoria para transformação digital da empresa com foco em automação de processos.',
    45000.00,
    60,
    'proposal',
    'medium',
    'indicacao',
    ARRAY['Consultoria', 'Digital'],
    '2025-08-30',
    (SELECT id FROM users WHERE email = 'carlos@conectcrm.com' LIMIT 1),
    'Marina Santos',
    'marina@techstart.com.br',
    '(11) 99876-5432',
    'TechStart Inovação'
),
(
    'Sistema de Gestão - Clínica MedCenter',
    'Sistema especializado para gestão de clínicas médicas com agenda, prontuários e faturamento.',
    35000.00,
    40,
    'qualification',
    'medium',
    'telefone',
    ARRAY['Healthcare', 'Gestão'],
    '2025-09-15',
    (SELECT id FROM users WHERE email = 'admin@conectsuite.com.br' LIMIT 1),
    'Dr. Roberto Silva',
    'roberto@medcenter.com.br',
    '(11) 97654-3210',
    'Clínica MedCenter'
),
(
    'E-commerce Personalizado - Fashion Style',
    'Plataforma de e-commerce personalizada para boutique de moda com integração de pagamentos.',
    55000.00,
    70,
    'closing',
    'high',
    'redes_sociais',
    ARRAY['E-commerce', 'Fashion'],
    '2025-08-20',
    (SELECT id FROM users WHERE email = 'ana@conectcrm.com' LIMIT 1),
    'Isabella Costa',
    'isabella@fashionstyle.com.br',
    '(11) 96543-2109',
    'Fashion Style Boutique'
),
(
    'App Mobile - Delivery Express',
    'Aplicativo mobile para gestão de entregas com rastreamento em tempo real.',
    28000.00,
    30,
    'leads',
    'low',
    'website',
    ARRAY['Mobile', 'Delivery'],
    '2025-09-30',
    (SELECT id FROM users WHERE email = 'carlos@conectcrm.com' LIMIT 1),
    'Pedro Oliveira',
    'pedro@deliveryexpress.com.br',
    '(11) 95432-1098',
    'Delivery Express Ltda'
),
(
    'Sistema Educacional - Escola Futuro',
    'Sistema completo para gestão escolar com portal do aluno, professor e responsáveis.',
    42000.00,
    90,
    'won',
    'high',
    'indicacao',
    ARRAY['Educação', 'Sistema'],
    '2025-07-25',
    (SELECT id FROM users WHERE email = 'admin@conectsuite.com.br' LIMIT 1),
    'Prof. Maria Helena',
    'maria@escolafuturo.edu.br',
    '(11) 94321-0987',
    'Escola Futuro'
),
(
    'Automação Industrial - MetalTech',
    'Sistema de automação para linha de produção industrial.',
    15000.00,
    10,
    'lost',
    'medium',
    'telefone',
    ARRAY['Automação', 'Industrial'],
    '2025-08-10',
    (SELECT id FROM users WHERE email = 'ana@conectcrm.com' LIMIT 1),
    'Eng. Ricardo Lima',
    'ricardo@metaltech.com.br',
    '(11) 93210-9876',
    'MetalTech Indústria'
);

-- Inserir algumas atividades de exemplo
INSERT INTO atividades (tipo, descricao, oportunidade_id, criado_por_id, data_atividade) VALUES
(
    'call',
    'Ligação de follow-up - cliente interessado em fechar ainda neste mês',
    1,
    (SELECT id FROM users WHERE email = 'ana@conectcrm.com' LIMIT 1),
    '2025-07-20 14:30:00'
),
(
    'email',
    'Proposta comercial enviada com valores atualizados e cronograma de implementação',
    1,
    (SELECT id FROM users WHERE email = 'ana@conectcrm.com' LIMIT 1),
    '2025-07-18 09:15:00'
),
(
    'meeting',
    'Reunião presencial para apresentação do sistema e levantamento de requisitos',
    1,
    (SELECT id FROM users WHERE email = 'ana@conectcrm.com' LIMIT 1),
    '2025-07-15 15:00:00'
),
(
    'email',
    'Enviado material complementar sobre metodologias de transformação digital',
    2,
    (SELECT id FROM users WHERE email = 'carlos@conectcrm.com' LIMIT 1),
    '2025-07-19 11:20:00'
),
(
    'meeting',
    'Reunião online para entender necessidades da empresa',
    2,
    (SELECT id FROM users WHERE email = 'carlos@conectcrm.com' LIMIT 1),
    '2025-07-16 16:30:00'
),
(
    'note',
    'Contrato assinado! Iniciar processo de implementação na próxima semana',
    6,
    (SELECT id FROM users WHERE email = 'admin@conectsuite.com.br' LIMIT 1),
    '2025-07-22 10:00:00'
),
(
    'note',
    'Cliente optou por solução concorrente devido ao prazo de entrega mais curto',
    7,
    (SELECT id FROM users WHERE email = 'ana@conectcrm.com' LIMIT 1),
    '2025-07-10 16:45:00'
);

-- Comentários das tabelas
COMMENT ON TABLE oportunidades IS 'Oportunidades de vendas do CRM';
COMMENT ON TABLE atividades IS 'Atividades e histórico das oportunidades';

COMMENT ON COLUMN oportunidades.estagio IS 'Estágio atual da oportunidade no pipeline';
COMMENT ON COLUMN oportunidades.probabilidade IS 'Probabilidade de fechamento (0-100%)';
COMMENT ON COLUMN oportunidades.tags IS 'Tags para categorização da oportunidade';
COMMENT ON COLUMN atividades.tipo IS 'Tipo da atividade: call, email, meeting, note, task';
