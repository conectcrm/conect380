-- Create faturas table
CREATE TABLE IF NOT EXISTS faturas (
    id SERIAL PRIMARY KEY,
    numero VARCHAR UNIQUE NOT NULL,
    "contratoId" INTEGER,
    "clienteId" INTEGER NOT NULL,
    "usuarioResponsavelId" INTEGER NOT NULL,
    tipo VARCHAR CHECK (tipo IN ('unica', 'recorrente', 'parcela', 'adicional')) DEFAULT 'unica',
    status VARCHAR CHECK (status IN ('pendente', 'enviada', 'paga', 'vencida', 'cancelada', 'parcialmente_paga')) DEFAULT 'pendente',
    "formaPagamentoPreferida" VARCHAR CHECK ("formaPagamentoPreferida" IN ('pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia', 'dinheiro')),
    descricao TEXT NOT NULL,
    "valorTotal" DECIMAL(10, 2) NOT NULL,
    "valorPago" DECIMAL(10, 2) DEFAULT 0,
    "valorDesconto" DECIMAL(10, 2) DEFAULT 0,
    "valorJuros" DECIMAL(10, 2) DEFAULT 0,
    "valorMulta" DECIMAL(10, 2) DEFAULT 0,
    "dataEmissao" DATE NOT NULL,
    "dataVencimento" DATE NOT NULL,
    "dataPagamento" DATE,
    observacoes TEXT,
    "linkPagamento" TEXT,
    "qrCodePix" TEXT,
    "codigoBoleto" TEXT,
    metadados JSONB,
    ativo BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create itens_fatura table
CREATE TABLE IF NOT EXISTS itens_fatura (
    id SERIAL PRIMARY KEY,
    "faturaId" INTEGER NOT NULL REFERENCES faturas(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    quantidade DECIMAL(10, 4) NOT NULL,
    "valorUnitario" DECIMAL(10, 2) NOT NULL,
    "valorTotal" DECIMAL(10, 2) NOT NULL,
    unidade TEXT,
    "codigoProduto" TEXT,
    "percentualDesconto" DECIMAL(5, 2) DEFAULT 0,
    "valorDesconto" DECIMAL(10, 2) DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_faturas_numero ON faturas(numero);
CREATE INDEX IF NOT EXISTS idx_faturas_cliente ON faturas("clienteId");
CREATE INDEX IF NOT EXISTS idx_faturas_contrato ON faturas("contratoId");
CREATE INDEX IF NOT EXISTS idx_faturas_status ON faturas(status);
CREATE INDEX IF NOT EXISTS idx_faturas_vencimento ON faturas("dataVencimento");
CREATE INDEX IF NOT EXISTS idx_itens_fatura_fatura ON itens_fatura("faturaId");

SELECT 'Tables created successfully!' as result;
