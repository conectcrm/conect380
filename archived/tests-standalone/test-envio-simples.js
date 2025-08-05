// Teste simples usando PowerShell para verificar envio de proposta
console.log('=== TESTE ENDPOINT ENVIO PROPOSTA ===');

// Dados para teste
const dadosEnvio = {
  proposta: {
    id: 'd3fc7cc8-16a8-448b-a05b-d5892fa773fb',
    numero: 'PROP-2025-032',
    titulo: 'Dhonleno Freitas - 29/07/2025',
    valor: 2464
  },
  emailCliente: 'dhonlenofreitas@hotmail.com',
  linkPortal: 'https://portal.conectcrm.com/PROP-2025-032/token123'
};

console.log('Dados que serão enviados:', JSON.stringify(dadosEnvio, null, 2));
console.log('');
console.log('Execute este comando no PowerShell:');
console.log('');
console.log(`$body = '${JSON.stringify(dadosEnvio).replace(/'/g, "''")}'; Invoke-WebRequest -Uri "http://localhost:3001/email/enviar-proposta" -Method POST -Body $body -ContentType "application/json"`);
console.log('');
console.log('Depois verifique se o status mudou com:');
console.log('Invoke-WebRequest -Uri "http://localhost:3001/propostas" -Method GET | ConvertFrom-Json');
