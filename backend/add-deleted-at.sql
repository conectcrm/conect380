-- Adicionar coluna deleted_at para soft delete
ALTER TABLE atendimento_tickets 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

-- Verificar se foi adicionada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'atendimento_tickets' 
AND column_name = 'deleted_at';
