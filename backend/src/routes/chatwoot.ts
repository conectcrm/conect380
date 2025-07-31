import { Router, Request, Response } from 'express';
import multer from 'multer';
import chatwootService, { PropostaChatwootData } from '../services/chatwootService';

// Extensão do tipo Request para incluir file
interface RequestWithFile extends Request {
  file?: any;
}

const router = Router();

// Configurar multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// 1. Status do serviço Chatwoot
router.get('/status', async (req: Request, res: Response) => {
  try {
    const isConnected = await chatwootService.testConnection();

    res.json({
      success: true,
      status: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      service: 'Chatwoot',
      message: isConnected ? 'Conectado ao Chatwoot' : 'Falha na conexão com Chatwoot'
    });
  } catch (error) {
    console.error('❌ Erro ao verificar status do Chatwoot:', error);
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Erro ao verificar conexão com Chatwoot',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// 2. Teste de conexão
router.post('/test-connection', async (req: Request, res: Response) => {
  try {
    const isConnected = await chatwootService.testConnection();

    if (isConnected) {
      res.json({
        success: true,
        message: '✅ Conexão com Chatwoot estabelecida com sucesso!',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        message: '❌ Falha na conexão com Chatwoot. Verifique as configurações.',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Erro no teste de conexão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno no teste de conexão',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// 3. Enviar proposta via Chatwoot
router.post('/send-proposal', upload.single('pdf'), async (req: RequestWithFile, res: Response) => {
  try {
    const {
      clienteNome,
      clienteWhatsApp,
      clienteEmail,
      propostaNumero,
      valorTotal,
      empresaNome,
      mensagemPersonalizada
    } = req.body;

    // Validação básica
    if (!clienteNome || !clienteWhatsApp || !propostaNumero || !valorTotal || !empresaNome) {
      return res.status(400).json({
        success: false,
        message: 'Dados obrigatórios: clienteNome, clienteWhatsApp, propostaNumero, valorTotal, empresaNome'
      });
    }

    // Preparar dados da proposta
    const dadosProposta: PropostaChatwootData = {
      clienteNome,
      clienteWhatsApp,
      clienteEmail,
      propostaNumero,
      valorTotal: parseFloat(valorTotal),
      empresaNome,
      mensagemPersonalizada,
      pdfBuffer: req.file?.buffer
    };

    // Enviar proposta
    await chatwootService.enviarProposta(dadosProposta);

    res.json({
      success: true,
      message: `✅ Proposta ${propostaNumero} enviada via Chatwoot para ${clienteNome}`,
      data: {
        cliente: clienteNome,
        whatsapp: clienteWhatsApp,
        proposta: propostaNumero,
        valor: valorTotal,
        temAnexo: !!req.file,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro ao enviar proposta via Chatwoot:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar proposta via Chatwoot',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// 4. Buscar conversas
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const { status, assignee_id, labels, page } = req.query;

    const params: any = {};
    if (status) params.status = status;
    if (assignee_id) params.assignee_id = Number(assignee_id);
    if (labels) params.labels = Array.isArray(labels) ? labels : [labels];
    if (page) params.page = Number(page);

    const conversations = await chatwootService.getConversations(params);

    res.json({
      success: true,
      data: conversations,
      count: conversations.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao buscar conversas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar conversas',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// 5. Buscar mensagens de uma conversa
router.get('/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const conversationId = Number(req.params.id);

    if (isNaN(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'ID da conversa deve ser um número'
      });
    }

    const messages = await chatwootService.getMessages(conversationId);

    res.json({
      success: true,
      data: messages,
      count: messages.length,
      conversationId: conversationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar mensagens da conversa',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// 6. Resolver conversa
router.post('/conversations/:id/resolve', async (req: Request, res: Response) => {
  try {
    const conversationId = Number(req.params.id);

    if (isNaN(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'ID da conversa deve ser um número'
      });
    }

    await chatwootService.resolveConversation(conversationId);

    res.json({
      success: true,
      message: `✅ Conversa ${conversationId} resolvida com sucesso`,
      conversationId: conversationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao resolver conversa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao resolver conversa',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// 7. Atribuir conversa a agente
router.post('/conversations/:id/assign', async (req: Request, res: Response) => {
  try {
    const conversationId = Number(req.params.id);
    const { agentId } = req.body;

    if (isNaN(conversationId) || !agentId) {
      return res.status(400).json({
        success: false,
        message: 'ID da conversa e agentId são obrigatórios'
      });
    }

    await chatwootService.assignConversation(conversationId, Number(agentId));

    res.json({
      success: true,
      message: `✅ Conversa ${conversationId} atribuída ao agente ${agentId}`,
      conversationId: conversationId,
      agentId: Number(agentId),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao atribuir conversa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atribuir conversa',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// 8. Enviar mensagem para conversa existente
router.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const conversationId = Number(req.params.id);
    const { content, message_type = 'outgoing', private: isPrivate = false } = req.body;

    if (isNaN(conversationId) || !content) {
      return res.status(400).json({
        success: false,
        message: 'ID da conversa e conteúdo da mensagem são obrigatórios'
      });
    }

    const message = await chatwootService.sendMessage(conversationId, {
      content,
      message_type,
      private: isPrivate
    });

    res.json({
      success: true,
      message: '✅ Mensagem enviada com sucesso',
      data: message,
      conversationId: conversationId,
      timestamp: new Date().toISOString()
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

// 9. Criar contato
router.post('/contacts', async (req: Request, res: Response) => {
  try {
    const { name, email, phone_number, identifier, custom_attributes } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nome do contato é obrigatório'
      });
    }

    const contact = await chatwootService.findOrCreateContact({
      name,
      email,
      phone_number,
      identifier,
      custom_attributes
    });

    res.json({
      success: true,
      message: '✅ Contato criado/encontrado com sucesso',
      data: contact,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao criar contato:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar contato',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// 10. Validar número de WhatsApp
router.post('/validate-number', async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Número de telefone é obrigatório'
      });
    }

    // Validação básica do formato
    const cleaned = phoneNumber.replace(/\D/g, '');
    const isValid = cleaned.length >= 10 && cleaned.length <= 15;

    res.json({
      success: true,
      data: {
        original: phoneNumber,
        cleaned: cleaned,
        formatted: isValid ? `+55${cleaned.slice(-11)}` : '',
        isValid: isValid
      },
      message: isValid ? '✅ Número válido' : '❌ Número inválido'
    });

  } catch (error) {
    console.error('❌ Erro ao validar número:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao validar número de telefone',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// 11. Estatísticas do Chatwoot
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Buscar conversas abertas
    const openConversations = await chatwootService.getConversations({ status: 'open' });
    const resolvedConversations = await chatwootService.getConversations({ status: 'resolved' });
    const pendingConversations = await chatwootService.getConversations({ status: 'pending' });

    res.json({
      success: true,
      data: {
        conversations: {
          open: openConversations.length,
          resolved: resolvedConversations.length,
          pending: pendingConversations.length,
          total: openConversations.length + resolvedConversations.length + pendingConversations.length
        },
        service: 'Chatwoot',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;
