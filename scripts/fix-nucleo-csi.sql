-- Habilitar núcleo CSI no bot
UPDATE nucleos_atendimento
SET visivel_no_bot = TRUE
WHERE id = '525cd442-6229-4372-9847-30b04b6443e8'
  AND nome = 'CSI';

-- Verificar resultado
SELECT nome, visivel_no_bot, ativo
FROM nucleos_atendimento
WHERE empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
ORDER BY nome;
