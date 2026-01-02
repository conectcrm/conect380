# 🌐 Configuração para Acesso em Rede Local

## 📋 Informações da Rede

- **IP da Máquina**: 172.23.192.1
- **Backend**: http://172.23.192.1:3001
- **Frontend**: http://172.23.192.1:3000

## ✅ Mudanças Aplicadas

### Backend (NestJS)
- ✅ CORS configurado para aceitar qualquer origem em desenvolvimento
- ✅ Servidor escutando em todas as interfaces (0.0.0.0)
- ✅ Porta 3001 acessível externamente

### Frontend (React)
- ✅ Variável de ambiente criada: `.env.network`
- ✅ Script de inicialização para rede: `npm run start:network`
- ✅ Configurado para acessar backend via IP da rede

## 🚀 Como Usar

### 1. Iniciar Backend (na máquina host)
```powershell
cd backend
npm run start:dev
```

### 2. Iniciar Frontend para Rede (na máquina host)
```powershell
cd frontend-web
npm run start:network
```

### 3. Acessar de Qualquer Dispositivo na Rede

**Do dispositivo que está hospedando:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

**De outros dispositivos na mesma rede (celular, tablet, outro PC):**
- Frontend: http://172.23.192.1:3000
- Backend: http://172.23.192.1:3001

## 🔧 Configurações Adicionais

### Firewall do Windows
Pode ser necessário permitir conexões nas portas:
```powershell
# Permitir porta 3000 (Frontend)
New-NetFirewallRule -DisplayName "ConectCRM Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Permitir porta 3001 (Backend)
New-NetFirewallRule -DisplayName "ConectCRM Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

### Verificar IP da Máquina
Se o IP mudar (rede diferente, DHCP):
```powershell
ipconfig | Select-String "IPv4"
```

Atualize o `.env.network` com o novo IP.

## 📱 Testar no Celular/Tablet

1. Conecte o dispositivo na **mesma rede WiFi**
2. Abra o navegador
3. Acesse: http://172.23.192.1:3000
4. Sistema deve carregar normalmente!

## 🐛 Troubleshooting

### Erro: ERR_CONNECTION_REFUSED
- ✅ Verifique se backend está rodando: http://172.23.192.1:3001
- ✅ Verifique firewall (desabilitar temporariamente para testar)
- ✅ Confirme que ambos dispositivos estão na mesma rede

### Erro: CORS Policy
- ✅ Backend já configurado para aceitar todas origens em desenvolvimento
- ✅ Se persistir, reinicie o backend

### Erro: Cannot reach server
- ✅ Confirme IP com `ipconfig`
- ✅ Atualize `.env.network` se IP mudou
- ✅ Reinicie frontend com `npm run start:network`

## 🎯 Exemplo Prático

**Cenário**: Testar sistema no celular

1. **No PC (host):**
   ```powershell
   # Terminal 1 - Backend
   cd c:\Projetos\conectcrm\backend
   npm run start:dev
   
   # Terminal 2 - Frontend
   cd c:\Projetos\conectcrm\frontend-web
   npm run start:network
   ```

2. **No Celular:**
   - Conectar no WiFi (mesma rede do PC)
   - Abrir Chrome/Safari
   - Digitar: http://172.23.192.1:3000
   - Login: admin@conectsuite.com.br / admin123

3. **Pronto!** Sistema funcionando no celular! 📱✨
