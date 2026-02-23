# 🐛 TROUBLESHOOTING: Player de Áudio - "No supported sources"

## ❌ Erro Encontrado

```
NotSupportedError: The element has no supported sources.
```

**Local:** `ChatArea.tsx:218`  
**Função:** `toggleReproducao` → `audio.play()`

---

## 🔍 Diagnóstico

### Possíveis Causas

1. **URL Inválida ou Inacessível**
   - URL não resolve para arquivo válido
   - Endpoint `/api/atendimento/mensagens/:id/anexo` retorna 404
   - CORS bloqueando requisição

2. **MIME Type Incorreto**
   - Backend não retorna `Content-Type: audio/ogg` (ou correto)
   - Navegador não reconhece formato

3. **Arquivo Não Existe no Servidor**
   - Caminho do arquivo no backend está incorreto
   - Arquivo foi movido/deletado

4. **Problema de Normalização de URL**
   - URL relativa não sendo convertida para absoluta
   - Base URL incorreta

---

## 🧪 Debug Adicionado

### Frontend - ChatArea.tsx

```typescript
// 1. Log ao renderizar mensagem
if (audio?.url) {
  console.log('🎵 [AudioPlayer] URL recebida:', audio.url);
  console.log('🎵 [AudioPlayer] Dados completos:', audio);
}

// 2. Log ao montar player
useEffect(() => {
  console.log('🎵 [AudioPlayer] Montado com URL:', url);
  console.log('🎵 [AudioPlayer] Duração:', duracao);
  console.log('🎵 [AudioPlayer] Nome:', nome);
}, [url, duracao, nome]);

// 3. Log ao tentar reproduzir
const toggleReproducao = () => {
  console.log('🎵 [AudioPlayer] URL do elemento:', audio.src);
  console.log('🎵 [AudioPlayer] ReadyState:', audio.readyState);
  console.log('🎵 [AudioPlayer] NetworkState:', audio.networkState);
  // ...
};

// 4. Event listener de erro
audio.addEventListener('error', (e) => {
  console.error('❌ [AudioPlayer] Erro ao carregar áudio:', e);
  console.error('❌ [AudioPlayer] URL:', audio.src);
  console.error('❌ [AudioPlayer] Error code:', audio.error?.code);
  console.error('❌ [AudioPlayer] Error message:', audio.error?.message);
});
```

### Frontend - atendimentoService.ts

```typescript
// Normalização de URL melhorada
export const normalizarMidiaUrl = (valor?: string | null): string | null => {
  if (!valor) return null;
  const urlBruta = valor.toString().trim();
  if (!urlBruta) return null;

  // ✅ URLs completas (http/https), data URIs ou blobs
  if (/^(https?:\/\/|data:|blob:)/i.test(urlBruta)) {
    return urlBruta;
  }

  // ✅ URLs relativas: normalizar com base na API_BASE_URL
  try {
    const urlNormalizada = new URL(urlBruta, API_BASE_URL);
    return urlNormalizada.toString();
  } catch (error) {
    console.warn('⚠️ Não foi possível normalizar URL:', urlBruta, error);
    return urlBruta;
  }
};
```

---

## ✅ Soluções

### Solução 1: Verificar URL no Console

**Passo 1:** Abrir DevTools (F12) → Console  
**Passo 2:** Procurar por logs iniciando com `🎵 [AudioPlayer]`  
**Passo 3:** Copiar a URL exibida  
**Passo 4:** Abrir URL em nova aba para testar

**Exemplo de URL esperada:**
```
http://localhost:3001/api/atendimento/mensagens/UUID/anexo
```

**Teste manual:**
```bash
# Substituir {UUID} pelo ID real da mensagem
curl -I http://localhost:3001/api/atendimento/mensagens/{UUID}/anexo

# Resultado esperado:
# HTTP/1.1 200 OK
# Content-Type: audio/ogg (ou audio/webm, audio/mpeg)
# Content-Disposition: inline; filename="audio.ogg"
```

---

### Solução 2: Verificar Backend - Endpoint de Download

**Arquivo:** `backend/src/modules/atendimento/controllers/mensagem.controller.ts`

```typescript
@Get(':id/anexo')
async baixarAnexo(@Param('id') id: string, @Res() res: Response) {
  try {
    const midia = await this.mensagemService.obterMidiaParaDownload(id);

    // 🔍 ADICIONAR LOG TEMPORÁRIO
    this.logger.log(`📥 Baixando anexo: ${id}`);
    this.logger.log(`📥 Tipo: ${midia.tipo}`);
    this.logger.log(`📥 Nome: ${midia.nome}`);
    this.logger.log(`📥 Remoto: ${midia.remoto}`);
    this.logger.log(`📥 Caminho: ${midia.caminho}`);
    this.logger.log(`📥 URL: ${midia.url}`);

    // ... resto do código
  } catch (error) {
    this.logger.error(`❌ Erro ao baixar anexo ${id}:`, error);
    // ...
  }
}
```

**Executar e verificar logs:**
```powershell
cd backend
npm run start:dev

# Observar logs ao clicar no play do áudio
```

---

### Solução 3: Verificar Se Arquivo Existe

**Arquivo:** `backend/src/modules/atendimento/services/mensagem.service.ts`

```typescript
async obterMidiaParaDownload(mensagemId: string): Promise<{...}> {
  const mensagem = await this.buscarPorId(mensagemId);

  // 🔍 ADICIONAR LOG TEMPORÁRIO
  this.logger.log(`🔍 Mensagem midia:`, JSON.stringify(mensagem.midia, null, 2));

  const caminhoBruto = midia.caminhoAnexo || midia.path || midia.url;
  
  this.logger.log(`🔍 Caminho bruto: ${caminhoBruto}`);
  
  const caminhoAbsoluto = resolve(process.cwd(), caminhoNormalizado);
  
  this.logger.log(`🔍 Caminho absoluto: ${caminhoAbsoluto}`);
  this.logger.log(`🔍 Arquivo existe? ${existsSync(caminhoAbsoluto)}`);

  // ... resto do código
}
```

---

### Solução 4: Verificar CORS

**Sintoma:** Console mostra erro de CORS antes do "no supported sources"

**Solução:** Adicionar headers CORS no backend

**Arquivo:** `backend/src/main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ CORS configurado
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ... resto do código
}
```

---

### Solução 5: Forçar Reload do Componente

Se a URL foi corrigida mas o player ainda não funciona:

```tsx
// Adicionar key dinâmica para forçar remontagem
<AudioPlayer
  key={audio.url} // ⚡ Força remontagem quando URL muda
  url={audio.url}
  duracao={audio.duracao}
  nome={audio.nome}
  ehCliente={ehCliente}
/>
```

---

### Solução 6: Fallback para Player HTML5 Padrão

Enquanto debug, adicionar fallback:

```tsx
{audio?.url && (
  <div className={audioClasses}>
    {/* Player customizado */}
    <AudioPlayer
      url={audio.url}
      duracao={audio.duracao}
      nome={audio.nome}
      ehCliente={ehCliente}
    />
    
    {/* 🔧 DEBUG: Fallback para testar URL */}
    <audio controls src={audio.url} className="mt-2 w-full">
      <source src={audio.url} type="audio/ogg" />
      <source src={audio.url} type="audio/webm" />
      <source src={audio.url} type="audio/mpeg" />
      Seu navegador não suporta áudio.
    </audio>
  </div>
)}
```

---

## 📊 Checklist de Verificação

Ao encontrar o erro "no supported sources":

- [ ] **Console Frontend:**
  - [ ] Ver URL recebida (`🎵 [AudioPlayer] URL recebida:`)
  - [ ] Copiar URL e testar em nova aba
  - [ ] Verificar se retorna áudio ou erro 404

- [ ] **Console Backend:**
  - [ ] Ver logs de `baixarAnexo`
  - [ ] Verificar se caminho do arquivo existe
  - [ ] Confirmar Content-Type retornado

- [ ] **Network Tab (DevTools):**
  - [ ] Verificar requisição para `/anexo`
  - [ ] Status code esperado: 200 OK
  - [ ] Content-Type esperado: `audio/ogg` (ou correto)
  - [ ] Content-Length > 0

- [ ] **Banco de Dados:**
  - [ ] Verificar campo `midia` na tabela `mensagem`
  - [ ] Confirmar que `caminhoAnexo` está preenchido
  - [ ] Validar formato do JSON armazenado

- [ ] **Sistema de Arquivos:**
  - [ ] Verificar pasta `backend/uploads/atendimento/`
  - [ ] Confirmar que arquivo existe
  - [ ] Validar permissões de leitura

---

## 🎯 Próximos Passos

1. **Executar debug no console** (ver logs adicionados)
2. **Testar URL manualmente** (abrir em nova aba)
3. **Verificar logs do backend** (`npm run start:dev`)
4. **Conferir se arquivo existe** no filesystem
5. **Validar CORS** (se necessário)

---

## ✅ SOLUÇÃO IMPLEMENTADA!

### Problema Raiz Identificado

**URLs do WhatsApp expiram em ~1 hora!**

```
❌ https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=...&ext=1760919725&hash=...
   Erro: MEDIA_ELEMENT_ERROR: Format error (Error code: 4)
```

### Solução Automática

🎉 **Implementado sistema de cache local de áudios!**

Agora, quando o webhook recebe um áudio do WhatsApp:

1. ✅ Backend detecta URL temporária (`lookaside.fbsbx.com`)
2. ✅ Baixa áudio automaticamente via `axios`
3. ✅ Salva em `backend/uploads/atendimento/`
4. ✅ Substitui URL temporária por caminho local
5. ✅ Player reproduz do servidor local (nunca expira!)

**Arquivo:** `backend/src/modules/atendimento/services/mensagem.service.ts`  
**Método:** `baixarMidiaWhatsApp()`

### Como Testar

```powershell
# 1. Reiniciar backend
cd c:\Projetos\conectcrm\backend
npm run start:dev

# 2. Enviar áudio pelo WhatsApp

# 3. Verificar logs
# Procurar por:
# 🎵 Detectado áudio/mídia temporária do WhatsApp - baixando...
# ✅ Mídia baixada e salva: ...

# 4. Verificar arquivo salvo
Get-ChildItem backend\uploads\atendimento\whatsapp-*.ogg
```

**Detalhes completos:** Ver `SOLUCAO_PLAYER_AUDIO_URLS_TEMPORARIAS.md`

---

## 📝 Informações para Relatar

Se o problema persistir, coletar estas informações:

```
🔍 RELATÓRIO DE DEBUG - Player de Áudio

**Frontend:**
- URL recebida: [copiar do console]
- URL do elemento <audio>: [copiar do console]
- ReadyState: [copiar do console]
- NetworkState: [copiar do console]
- Error code: [copiar do console]

**Backend:**
- Logs de baixarAnexo: [colar logs]
- Caminho absoluto do arquivo: [colar]
- Arquivo existe? [sim/não]

**Network Tab:**
- Status Code: [ex: 200, 404, 500]
- Content-Type: [ex: audio/ogg]
- Content-Length: [tamanho em bytes]

**Banco de Dados:**
- Campo midia da mensagem: [colar JSON]
```

---

**Última atualização:** 20 de outubro de 2025  
**Responsável:** GitHub Copilot  
**Status:** 🔧 Em investigação
