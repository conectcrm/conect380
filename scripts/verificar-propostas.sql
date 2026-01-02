-- Verificar propostas inseridas por mês e status
SELECT 
  TO_CHAR("atualizadaEm", 'Mon/YYYY') as mes,
  EXTRACT(MONTH FROM "atualizadaEm") as mes_num,
  status,
  COUNT(*) as quantidade,
  SUM(valor)::numeric(10,2) as total_valor
FROM propostas
WHERE empresa_id = '11111111-1111-1111-1111-111111111111'
GROUP BY 
  TO_CHAR("atualizadaEm", 'Mon/YYYY'),
  EXTRACT(MONTH FROM "atualizadaEm"),
  status
ORDER BY 
  EXTRACT(MONTH FROM "atualizadaEm"),
  status;
