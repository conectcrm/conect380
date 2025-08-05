// Teste da lógica de detecção de emails fictícios

function testarDeteccaoEmail(email) {
  // Lista de domínios reais comuns que NUNCA devem ser considerados fictícios
  const dominiosReais = [
    'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'live.com',
    'icloud.com', 'uol.com.br', 'bol.com.br', 'terra.com.br', 'ig.com.br',
    'globo.com', 'r7.com', 'oi.com.br', 'vivo.com.br', 'tim.com.br'
  ];

  const dominio = email.split('@')[1]?.toLowerCase() || '';
  const isDominioReal = dominiosReais.includes(dominio);

  // Só detectar como fictício se não for um domínio real conhecido
  const isFakeEmail = !isDominioReal && (
    email.endsWith('@cliente.temp') ||
    email.endsWith('@exemplo.com') ||
    email.endsWith('@test.com') ||
    email.endsWith('@teste.com') ||
    email.includes('cliente.temp') ||
    email.includes('exemplo.') ||
    email.includes('test.') ||
    email.includes('teste.')
  );

  return {
    email,
    dominio,
    isDominioReal,
    isFakeEmail,
    status: isFakeEmail ? '🚨 FICTÍCIO' : '✅ VÁLIDO'
  };
}

// Testes com diferentes tipos de email
const emailsParaTestar = [
  'joao@gmail.com',           // ✅ Deve ser válido (Gmail)
  'maria@hotmail.com',        // ✅ Deve ser válido (Hotmail)
  'pedro@outlook.com',        // ✅ Deve ser válido (Outlook)
  'ana@yahoo.com',            // ✅ Deve ser válido (Yahoo)
  'carlos@uol.com.br',        // ✅ Deve ser válido (UOL)
  'teste@empresa.com.br',     // ✅ Deve ser válido (empresa real)
  'admin@meusite.com',        // ✅ Deve ser válido (site real)
  'joao.silva@cliente.temp',  // 🚨 Deve ser fictício
  'cliente@exemplo.com',      // 🚨 Deve ser fictício
  'user@test.com',            // 🚨 Deve ser fictício
  'admin@teste.com',          // 🚨 Deve ser fictício
  'fake@test.local',          // 🚨 Deve ser fictício
  'demo@exemplo.org'          // 🚨 Deve ser fictício
];

console.log('🔍 TESTE DE DETECÇÃO DE EMAILS FICTÍCIOS\n');
console.log('='.repeat(60));

emailsParaTestar.forEach(email => {
  const resultado = testarDeteccaoEmail(email);
  console.log(`${resultado.status} ${resultado.email}`);
  console.log(`   Domínio: ${resultado.dominio} (Real: ${resultado.isDominioReal ? 'Sim' : 'Não'})`);
  console.log('');
});

console.log('='.repeat(60));
console.log('✅ Teste concluído!');
