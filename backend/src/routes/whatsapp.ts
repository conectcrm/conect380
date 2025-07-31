import { Router, Request, Response } from 'express';
import whatsappService, { WhatsAppPropostaData } from '../services/whatsappService';
import { auth } from '../middleware/auth';
import multer from 'multer';

// Extensão do tipo Request para incluir file
interface RequestWithFile extends Request {
  file?: any;
}

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Obter status da conexão WhatsApp
router.get('/status', auth, async (req, res) => {
  try {
    const status = whatsappService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('❌ Erro ao obter status WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter status do WhatsApp',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Inicializar cliente WhatsApp
router.post('/initialize', auth, async (req, res) => {
  try {
    await whatsappService.initialize();
    res.json({
      success: true,
      message: 'Cliente WhatsApp inicializado'
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao inicializar WhatsApp',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Parar cliente WhatsApp
router.post('/disconnect', auth, async (req, res) => {
  try {
    await whatsappService.destroy();
    res.json({
      success: true,
      message: 'Cliente WhatsApp desconectado'
    });
  } catch (error) {
    console.error('❌ Erro ao desconectar WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao desconectar WhatsApp',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Verificar se número é válido
router.post('/validate-number', auth, async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Número de telefone é obrigatório'
      });
    }

    const isValid = await whatsappService.isValidNumber(phoneNumber);

    res.json({
      success: true,
      data: {
        phoneNumber,
        isValid,
        formatted: phoneNumber.replace(/\D/g, '').replace(/^55/, '').replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
      }
    });
  } catch (error) {
    console.error('❌ Erro ao validar número:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao validar número',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Enviar mensagem simples
router.post('/send-message', auth, async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: 'Destinatário e mensagem são obrigatórios'
      });
    }

    if (!whatsappService.isReady()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado'
      });
    }

    await whatsappService.sendMessage(to, message);

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar mensagem',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Enviar proposta via WhatsApp
router.post('/send-proposal', auth, upload.single('pdf'), async (req: RequestWithFile, res: Response) => {
  try {
    const {
      clienteNome,
      clienteWhatsApp,
      propostaNumero,
      valorTotal,
      empresaNome,
      mensagemPersonalizada
    } = req.body;

    // Validações
    if (!clienteNome || !clienteWhatsApp || !propostaNumero || !valorTotal || !empresaNome) {
      return res.status(400).json({
        success: false,
        message: 'Dados obrigatórios: clienteNome, clienteWhatsApp, propostaNumero, valorTotal, empresaNome'
      });
    }

    if (!whatsappService.isReady()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado. Conecte primeiro.'
      });
    }

    // Preparar dados da proposta
    const dadosProposta: WhatsAppPropostaData = {
      clienteNome,
      clienteWhatsApp,
      propostaNumero,
      valorTotal: parseFloat(valorTotal),
      empresaNome,
      mensagemPersonalizada: mensagemPersonalizada || undefined,
      pdfBuffer: req.file?.buffer || undefined
    };

    // Enviar proposta
    await whatsappService.enviarProposta(dadosProposta);

    res.json({
      success: true,
      message: 'Proposta enviada via WhatsApp com sucesso',
      data: {
        cliente: clienteNome,
        numero: propostaNumero,
        whatsapp: clienteWhatsApp,
        temPdf: !!req.file
      }
    });
  } catch (error) {
    console.error('❌ Erro ao enviar proposta via WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar proposta via WhatsApp',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Obter informações do cliente conectado
router.get('/client-info', auth, async (req, res) => {
  try {
    const clientInfo = whatsappService.getClientInfo();

    if (!clientInfo) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado'
      });
    }

    res.json({
      success: true,
      data: {
        name: clientInfo.pushname,
        number: clientInfo.wid.user,
        platform: clientInfo.platform,
        isConnected: whatsappService.isReady()
      }
    });
  } catch (error) {
    console.error('❌ Erro ao obter informações do cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter informações do cliente',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Obter chats recentes
router.get('/chats', auth, async (req, res) => {
  try {
    if (!whatsappService.isReady()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado'
      });
    }

    const chats = await whatsappService.getChats();

    // Formatar dados dos chats
    const formattedChats = chats.map(chat => ({
      id: chat.id._serialized,
      name: chat.name,
      isGroup: chat.isGroup,
      unreadCount: chat.unreadCount,
      lastMessage: chat.lastMessage ? {
        body: chat.lastMessage.body,
        timestamp: chat.lastMessage.timestamp,
        from: chat.lastMessage.from
      } : null
    }));

    res.json({
      success: true,
      data: formattedChats
    });
  } catch (error) {
    console.error('❌ Erro ao obter chats:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter chats',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Testar conexão e envio
router.post('/test', auth, async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Número de telefone é obrigatório para teste'
      });
    }

    if (!whatsappService.isReady()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado'
      });
    }

    // Verificar se número é válido
    const isValid = await whatsappService.isValidNumber(phoneNumber);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Número de WhatsApp inválido ou não existe'
      });
    }

    // Enviar mensagem de teste
    const mensagemTeste = `🧪 *Teste de Conexão - ConectCRM*

✅ Sistema funcionando perfeitamente!

Esta é uma mensagem de teste automática.
Se você recebeu esta mensagem, a integração WhatsApp está configurada corretamente.

🚀 *Recursos disponíveis:*
• Envio de propostas comerciais
• Anexos em PDF
• Mensagens personalizadas
• Validação de números

---
_Sistema ConectCRM - ${new Date().toLocaleString('pt-BR')}_`;

    await whatsappService.sendMessage(phoneNumber, mensagemTeste);

    res.json({
      success: true,
      message: 'Mensagem de teste enviada com sucesso',
      data: {
        phoneNumber,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Erro no teste WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no teste do WhatsApp',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;
