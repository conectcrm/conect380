// 🔍 Investigar origem do número 685046
// Checando onde está sendo gerado esse link incorreto

const API_URL = 'http://localhost:3001';

async function investigarOrigemLink() {
  console.log('🔍 INVESTIGANDO ORIGEM DO LINK INCORRETO 685046');
  console.log('='.repeat(60));

  try {
    // 1. Buscar PROP-2025-043 para ver os detalhes do email
    const response = await fetch(`${API_URL}/propostas`);
    const data = await response.json();

    if (data.success && data.propostas) {
      const prop043 = data.propostas.find(p => p.numero === 'PROP-2025-043');

      if (prop043) {
        console.log('📧 EMAIL DETAILS da PROP-2025-043:');
        console.log(JSON.stringify(prop043.emailDetails, null, 2));

        if (prop043.emailDetails && prop043.emailDetails.linkPortal) {
          console.log('\n🔗 ANÁLISE DO LINK:');
          console.log(`Link completo: ${prop043.emailDetails.linkPortal}`);

          // Extrair partes do link
          const linkParts = prop043.emailDetails.linkPortal.split('/');
          console.log('Partes do link:', linkParts);

          const numeroNoLink = linkParts[linkParts.length - 1];
          console.log(`Número extraído do link: ${numeroNoLink}`);

          if (numeroNoLink === '685046') {
            console.log('🚨 CONFIRMADO: O link contém o número incorreto 685046');
            console.log('🔍 Isso indica que o problema está na geração do link no frontend');
          }
        }

        // 2. Verificar se há alguma propriedade token ou id incorreta
        console.log('\n🆔 PROPRIEDADES DA PROPOSTA:');
        console.log(`ID: ${prop043.id}`);
        console.log(`Número: ${prop043.numero}`);

        // Verificar se há alguma propriedade que contenha 685046
        const propString = JSON.stringify(prop043);
        if (propString.includes('685046')) {
          console.log('🚨 ENCONTRADO: A string 685046 existe em alguma propriedade da proposta');

          // Procurar onde está
          Object.keys(prop043).forEach(key => {
            const value = JSON.stringify(prop043[key]);
            if (value.includes('685046')) {
              console.log(`   Encontrado em: ${key} = ${value}`);
            }
          });
        } else {
          console.log('✅ A proposta não contém 685046 - problema está na geração do link');
        }
      }
    }

    // 3. Verificar se 685046 pode ser algum ID gerado aleatoriamente
    console.log('\n🎲 ANÁLISE DO NÚMERO 685046:');
    console.log('Tamanho:', '685046'.length);
    console.log('É numérico:', /^\d+$/.test('685046'));
    console.log('Possível Math.random()*1000000:', 685046 < 1000000);

    // 4. Verificar logs do backend para ver quando foi gerado
    console.log('\n📝 RECOMENDAÇÕES:');
    console.log('1. Verificar logs do backend quando PROP-2025-043 foi enviada');
    console.log('2. Checar código do frontend que gera o link do portal');
    console.log('3. Verificar se há algum token/ID sendo gerado incorretamente');
    console.log('4. Confirmar se 685046 é gerado por Math.random() * 1000000');

  } catch (error) {
    console.error('❌ Erro na investigação:', error);
  }
}

// Executar investigação
investigarOrigemLink();
