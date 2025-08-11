CREATE TABLE contratos (
    id SERIAL NOT NULL,
    numero character varying NOT NULL,
    "propostaId" integer NOT NULL,
    "clienteId" integer NOT NULL,
    "usuarioResponsavelId" integer NOT NULL,
    tipo contratos_tipo_enum NOT NULL DEFAULT 'servico',
    status contratos_status_enum NOT NULL DEFAULT 'aguardando_assinatura',
    objeto text NOT NULL,
    "valorTotal" numeric(10,2) NOT NULL,
    "dataInicio" date NOT NULL,
    "dataFim" date NOT NULL,
    "dataAssinatura" date,
    "dataVencimento" date NOT NULL,
    observacoes text,
    "clausulasEspeciais" text,
    "condicoesPagamento" json,
    "caminhoArquivoPDF" text,
    "hashDocumento" text,
    ativo boolean NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "UQ_118d425b390cd16aa23be3d675c" UNIQUE (numero),
    CONSTRAINT "PK_cfae35069d6ff59da899c17ed397" PRIMARY KEY (id)
);

INSERT INTO contratos (numero, "propostaId", "clienteId", "usuarioResponsavelId", objeto, "valorTotal", "dataInicio", "dataFim", "dataVencimento") VALUES 
('CTR-2025-001', 1, 1, 1, 'Contrato de prestação de serviços de desenvolvimento de software', 15000.00, '2025-01-01', '2025-12-31', '2025-01-31'),
('CTR-2025-002', 2, 1, 1, 'Contrato de licenciamento de software CRM', 8500.00, '2025-02-01', '2026-01-31', '2025-02-28');
