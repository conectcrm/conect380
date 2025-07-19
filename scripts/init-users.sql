-- Script de inicialização de usuários para o Fênix CRM
-- Criado automaticamente com usuários pré-cadastrados

-- Verificar se as tabelas existem antes de inserir dados
DO $$
BEGIN
    -- Aguardar um pouco para garantir que as tabelas foram criadas
    PERFORM pg_sleep(1);
END $$;

-- Inserir empresa padrão se não existir
INSERT INTO empresas (id, nome, slug, cnpj, email, telefone, endereco, cidade, estado, cep, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Fênix CRM Empresa Demo',
    'fenix-crm-demo',
    '00.000.000/0001-00',
    'contato@fenixcrm.com',
    '(11) 99999-9999',
    'Rua Demo, 123',
    'São Paulo',
    'SP',
    '01000-000',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Inserir usuários se não existirem
INSERT INTO users (id, email, senha, nome, role, empresa_id, ativo, created_at, updated_at)
VALUES 
    (
        '00000000-0000-0000-0000-000000000001',
        'admin@fenixcrm.com',
        '$2a$10$FlCEpmIgRopB4XZXGtaVpOmT0s5HCe.Qxksv005Af5NB4szwiTYam',
        'Admin Sistema',
        'admin',
        '00000000-0000-0000-0000-000000000001',
        true,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'manager@fenixcrm.com',
        '$2a$10$JIKv0c1EeAKC3w74oyomueq6igwCSqVa.LO2akFbD6jzUgWsX82kO',
        'Manager Sistema',
        'manager',
        '00000000-0000-0000-0000-000000000001',
        true,
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000003',
        'vendedor@fenixcrm.com',
        '$2a$10$td24SLNFNJBW5ipMToUGyuUIqKVdFn0bu7n7rgPDh8aj.ZrarvHam',
        'Vendedor Sistema',
        'vendedor',
        '00000000-0000-0000-0000-000000000001',
        true,
        NOW(),
        NOW()
    )
ON CONFLICT (email) DO NOTHING;

-- Confirmar inserção
SELECT 'Usuários inseridos com sucesso!' as status;
