UPDATE atendimento_integracoes_config 
SET credenciais = '{
  "whatsapp_api_token": "EAALQrbLuMHwBPuHhWZBBp4CNW5vny6xP1NOZB9n9N2mYKFnWQn4okbha3GPkPggskNj5BCa1tQ4iCL4VVc8HzjQDdfE036o7h4HBKSetuxU70viYv88hDhXFiDmRzcWe1fnZCIdPnG8JksmIdcO4ubPGCBmjX42z814WSgZBf9ddLjKDu2jdbZCynypfi3077J5Nb25j8bSTAy63JQcXY8Vc1Dbv77qfmZCgTnvSrAJQZDZD",
  "whatsapp_phone_number_id": "704423209430762",
  "whatsapp_business_account_id": "1922786558561358"
}'::jsonb 
WHERE tipo = 'whatsapp_business_api';

-- Verificar atualização
SELECT 
  tipo,
  LEFT(credenciais->>'whatsapp_api_token', 30) as token_inicio,
  LENGTH(credenciais->>'whatsapp_api_token') as token_length,
  credenciais->>'whatsapp_phone_number_id' as phone_id
FROM atendimento_integracoes_config 
WHERE tipo = 'whatsapp_business_api';
