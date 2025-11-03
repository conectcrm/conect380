-- Verificar contatos com telefone 96689991 ou nome Dhon
SELECT 
  id, 
  nome, 
  telefone, 
  email, 
  ativo, 
  "clienteId"
FROM contatos 
WHERE 
  telefone LIKE '%96689991%' 
  OR telefone LIKE '%Dhon%'
  OR nome LIKE '%Dhon%'
LIMIT 10;
