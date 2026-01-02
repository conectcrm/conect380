-- Corrigir valores NULL em interacoes.tipo
-- Este script deve ser executado ANTES da migration CreateTemplateMensagemTable1765483671377

UPDATE interacoes 
SET tipo = CASE
  WHEN canal = 'whatsapp' THEN 'mensagem'
  WHEN canal = 'email' THEN 'email'
  WHEN canal = 'telefone' THEN 'ligacao'
  ELSE 'outro'
END
WHERE tipo IS NULL;

-- Verificar resultado
SELECT COUNT(*) as total_corrigido FROM interacoes WHERE tipo = 'outro' OR tipo IS NOT NULL;
