-- Create pagamentos table based on Pagamento entity

CREATE TABLE IF NOT EXISTS pagamentos (
    id SERIAL PRIMARY KEY,
    "faturaId" INTEGER NOT NULL,
    "transacaoId" VARCHAR UNIQUE NOT NULL,
    tipo VARCHAR DEFAULT 'pagamento',
    status VARCHAR DEFAULT 'pendente',
    valor NUMERIC(10,2) NOT NULL,
    taxa NUMERIC(10,2) DEFAULT 0,
    "valorLiquido" NUMERIC(10,2) NOT NULL,
    "metodoPagamento" TEXT NOT NULL,
    gateway TEXT,
    "gatewayTransacaoId" TEXT,
    "gatewayStatusRaw" TEXT,
    "dadosCompletos" JSONB,
    "dataProcessamento" TIMESTAMP,
    "dataAprovacao" TIMESTAMP,
    "motivoRejeicao" TEXT,
    observacoes TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Check constraints for enums
    CONSTRAINT pagamentos_tipo_check CHECK (tipo IN ('pagamento', 'estorno', 'ajuste', 'desconto')),
    CONSTRAINT pagamentos_status_check CHECK (status IN ('pendente', 'processando', 'aprovado', 'rejeitado', 'cancelado', 'estornado')),
    
    -- Foreign key constraint
    CONSTRAINT fk_pagamentos_fatura FOREIGN KEY ("faturaId") REFERENCES faturas(id) ON DELETE CASCADE
);
