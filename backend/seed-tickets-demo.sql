-- ==========================================
-- Criar tickets de demonstração
-- ==========================================

-- Inserir tickets de exemplo para a empresa demo
INSERT INTO atendimento_tickets (
  id,
  numero,
  titulo,
  descricao,
  tipo,
  status,
  prioridade,
  empresa_id,
  data_abertura,
  created_at,
  updated_at
) VALUES 
  (
    gen_random_uuid(),
    1001,
    'Suporte - Configuração de Email',
    'Cliente precisa de ajuda para configurar o email corporativo no sistema',
    'SUPORTE',
    'FILA',
    'MEDIA',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW(),
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    1002,
    'Demanda - Nova Funcionalidade de Relatórios',
    'Implementar relatórios customizados de vendas por período',
    'DEMANDA',
    'EM_ATENDIMENTO',
    'ALTA',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    NOW()
  ),
  (
    gen_random_uuid(),
    1003,
    'Suporte - Erro ao Fazer Login',
    'Usuário reportou erro 500 ao tentar fazer login no sistema',
    'SUPORTE',
    'FILA',
    'URGENTE',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour',
    NOW()
  ),
  (
    gen_random_uuid(),
    1004,
    'Demanda - Integração com WhatsApp',
    'Configurar integração do sistema com WhatsApp Business API',
    'DEMANDA',
    'EM_ATENDIMENTO',
    'MEDIA',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    gen_random_uuid(),
    1005,
    'Suporte - Dúvida sobre Faturamento',
    'Cliente perguntou como gerar nota fiscal pelo sistema',
    'SUPORTE',
    'ENCERRADO',
    'BAIXA',
    '550e8400-e29b-41d4-a716-446655440000',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '6 days'
  );

-- Verificar tickets criados
SELECT 
  numero,
  titulo,
  tipo,
  status,
  prioridade,
  DATE(data_abertura) as data_abertura
FROM atendimento_tickets
WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY numero;

SELECT '✅ Tickets de demonstração criados com sucesso!' as resultado;
