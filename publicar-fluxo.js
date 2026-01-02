const http = require('http');

async function publicarFluxo() {
  // 1. Login
  console.log('🔐 Fazendo login...');

  const loginData = JSON.stringify({
    email: 'admin@conectsuite.com.br',
    senha: 'admin123'
  });

  const loginPromise = new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const response = JSON.parse(data);
        if (response.data && response.data.access_token) {
          resolve(response.data.access_token);
        } else {
          reject(new Error('Token não encontrado'));
        }
      });
    });

    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  const token = await loginPromise;
  console.log('✅ Login realizado\n');

  // 2. Listar fluxos para pegar o ID
  console.log('📋 Buscando fluxo...');

  const fluxosPromise = new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/fluxos',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const fluxos = JSON.parse(data);
        const fluxo = fluxos.find(f => f.codigo === 'atendimento-completo-v1');
        if (fluxo) {
          resolve(fluxo);
        } else {
          reject(new Error('Fluxo não encontrado'));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });

  const fluxo = await fluxosPromise;
  console.log('✅ Fluxo encontrado:', fluxo.nome);
  console.log('   ID:', fluxo.id);
  console.log('   Status atual: Publicado =', fluxo.publicado, '| Ativo =', fluxo.ativo);
  console.log('');

  // 3. Publicar fluxo
  console.log('📤 Publicando fluxo...');

  const publicarPromise = new Promise((resolve, reject) => {
    const putData = JSON.stringify({
      publicado: true,
      ativo: true
    });

    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: `/fluxos/${fluxo.id}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(putData)
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('📊 Status:', res.statusCode);
        if (res.statusCode === 200) {
          const updated = JSON.parse(data);
          resolve(updated);
        } else {
          console.log('📄 Resposta:', data);
          reject(new Error(`Erro ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(putData);
    req.end();
  });

  const updated = await publicarPromise;
  console.log('\n✅ Fluxo publicado com sucesso!');
  console.log('   📋 Nome:', updated.nome);
  console.log('   ✅ Publicado:', updated.publicado);
  console.log('   ✅ Ativo:', updated.ativo);
  console.log('\n🎉 O fluxo agora está PUBLICADO e pronto para receber mensagens!');
}

publicarFluxo().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
