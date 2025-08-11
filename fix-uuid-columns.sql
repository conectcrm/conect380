-- Fix UUID columns for faturamento and contratos tables

-- First, add temporary UUID columns
ALTER TABLE contratos ADD COLUMN usuarioResponsavelId_temp UUID;
ALTER TABLE faturas ADD COLUMN usuarioResponsavelId_temp UUID;

-- Update contratos with valid UUIDs (map existing integer values to actual UUIDs)
UPDATE contratos SET usuarioResponsavelId_temp = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' WHERE "usuarioResponsavelId" = 1;

-- Since faturas table is empty, we don't need to update data

-- Drop the old integer columns
ALTER TABLE contratos DROP COLUMN "usuarioResponsavelId";
ALTER TABLE faturas DROP COLUMN "usuarioResponsavelId";

-- Rename the temporary columns to the correct names
ALTER TABLE contratos RENAME COLUMN usuarioResponsavelId_temp TO "usuarioResponsavelId";
ALTER TABLE faturas RENAME COLUMN usuarioResponsavelId_temp TO "usuarioResponsavelId";

-- Set NOT NULL constraints
ALTER TABLE contratos ALTER COLUMN "usuarioResponsavelId" SET NOT NULL;
ALTER TABLE faturas ALTER COLUMN "usuarioResponsavelId" SET NOT NULL;
