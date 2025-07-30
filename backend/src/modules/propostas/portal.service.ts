import { Injectable } from '@nestjs/common';
import { PropostasService } from './propostas.service';
import { EmailIntegradoService } from './email-integrado.service';

interface TokenData {
  token: string;
  propostaId: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

interface ViewData {
  ip?: string;
  userAgent?: string;
  timestamp?: string;
}

@Injectable()
export class PortalService {
  private tokenMappings: Record<string, string> = {
    // Tokens pré-definidos para desenvolvimento
    'test-token-123': '1',
    'token-teste-workflow-999': '1',
    'portal-token-1': '1',
    'portal-token-2': '2',
    'PROP-001': '1',
    'PROP-002': '2',
    'TEST-001': '1',
    'TEST-002': '2',
    // ✨ ADICIONANDO PROPOSTAS REAIS PARA TESTE
    'PROP-2025-049': 'bff61bbe-b645-4581-a3d1-d8447b8c2b75',
    'PROP-2025-051': 'e0003dcb-f81a-4ac5-9661-76233446bfa8'
  };

  constructor(
    private readonly propostasService: PropostasService,
    private readonly emailService: EmailIntegradoService
  ) { }

  /**
   * Atualiza status de proposta usando token do portal
   */
  async atualizarStatusPorToken(
    token: string,
    novoStatus: string,
    metadata?: ViewData
  ): Promise<any> {

    console.log(`🔐 Portal: Processando token ${token}`);

    // 1. Validar token e obter proposta ID
    const tokenData = await this.validarToken(token);

    if (!tokenData || !tokenData.isActive) {
      throw new Error('Token inválido ou expirado');
    }

    console.log(`✅ Token válido para proposta: ${tokenData.propostaId}`);
    console.log(`🔧 DEBUG: tokenData.propostaId = "${tokenData.propostaId}" (tipo: ${typeof tokenData.propostaId})`);

    // 2. Registrar ação no log do portal
    await this.registrarAcaoPortal(token, 'status_update', {
      novoStatus,
      ...metadata
    });

    // 3. Atualizar status da proposta via service principal com validação automática
    let resultado;

    if (novoStatus === 'aprovada' || novoStatus === 'rejeitada') {
      console.log(`🔄 Portal: Aplicando transição automática para ${novoStatus}`);
      console.log(`🔧 DEBUG: Chamando atualizarStatusComValidacao com ID: "${tokenData.propostaId}"`);
      resultado = await this.propostasService.atualizarStatusComValidacao(
        tokenData.propostaId,
        novoStatus,
        'portal-auto',
        `Cliente ${novoStatus} a proposta via portal (token: ${token.substring(0, 8)}...)`
      );
    } else {
      console.log(`🔧 DEBUG: Chamando atualizarStatus com ID: "${tokenData.propostaId}"`);
      resultado = await this.propostasService.atualizarStatus(
        tokenData.propostaId,
        novoStatus,
        'portal-cliente',
        `Atualizado via portal do cliente (token: ${token.substring(0, 8)}...)`
      );
    }

    // 4. Enviar notificação por email se foi aceita ou rejeitada
    if (novoStatus === 'aprovada') {
      try {
        await this.emailService.notificarPropostaAceita({
          numero: tokenData.propostaId,
          titulo: resultado.titulo || 'Proposta sem título',
          cliente: resultado.cliente || 'Cliente',
          valor: resultado.valor || 0,
          status: 'aprovada',
          dataAceite: new Date().toISOString()
        });
        console.log('📧 Email de notificação de aceitação enviado com sucesso');
      } catch (emailError) {
        console.warn('⚠️ Erro ao enviar email, mas proposta foi aceita:', emailError);
      }
    } else if (novoStatus === 'rejeitada') {
      try {
        await this.emailService.notificarPropostaRejeitada({
          numero: tokenData.propostaId,
          titulo: resultado.titulo || 'Proposta sem título',
          cliente: resultado.cliente || 'Cliente',
          valor: resultado.valor || 0,
          status: 'rejeitada',
          dataRejeicao: new Date().toISOString()
        });
        console.log('📧 Email de notificação de rejeição enviado com sucesso');
      } catch (emailError) {
        console.warn('⚠️ Erro ao enviar email, mas proposta foi rejeitada:', emailError);
      }
    }

    console.log(`✅ Portal: Status atualizado com sucesso`);

    return {
      ...resultado,
      tokenInfo: {
        token: token.substring(0, 8) + '...',
        source: 'portal-cliente'
      }
    };
  }

  /**
   * Obtém proposta por token do portal
   */
  async obterPropostaPorToken(token: string): Promise<any> {
    console.log(`🔍 Portal: Buscando proposta por token ${token}`);

    // 1. Validar token
    const tokenData = await this.validarToken(token);

    if (!tokenData || !tokenData.isActive) {
      throw new Error('Token inválido ou expirado');
    }

    // 2. Buscar proposta
    const proposta = await this.propostasService.obterProposta(tokenData.propostaId);

    if (!proposta) {
      throw new Error('Proposta não encontrada');
    }

    // 3. 🔄 SINCRONIZAÇÃO AUTOMÁTICA: Atualizar status para "visualizada" se ainda estiver "enviada"
    if (proposta.status === 'enviada') {
      console.log(`🔄 Portal: Auto-atualizando status ${proposta.status} → visualizada`);

      try {
        await this.propostasService.marcarComoVisualizada(
          tokenData.propostaId,
          '127.0.0.1', // IP do cliente seria capturado em produção
          'Portal-Client'
        );

        // Atualizar objeto local
        proposta.status = 'visualizada';
        proposta.updatedAt = new Date().toISOString();

        console.log(`✅ Portal: Status atualizado automaticamente para "visualizada"`);
      } catch (error) {
        console.warn(`⚠️ Portal: Erro ao atualizar status automaticamente:`, error);
      }
    }

    // 4. Registrar acesso
    await this.registrarAcaoPortal(token, 'view', {
      timestamp: new Date().toISOString(),
      statusAnterior: proposta.status === 'visualizada' ? 'enviada' : proposta.status,
      statusAtual: proposta.status
    });

    console.log(`✅ Portal: Proposta encontrada para token`);

    return {
      ...proposta,
      portalAccess: {
        token: token.substring(0, 8) + '...',
        accessedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Valida token do portal
   */
  private async validarToken(token: string): Promise<TokenData | null> {
    console.log(`🔐 Validando token: ${token}`);

    // ✅ CORREÇÃO: Usar método centralizado para obter mapeamentos
    const tokenMappings = this.getTokenMappings();

    // 🔧 CORREÇÃO: Remover validação por tamanho, apenas verificar se existe proposta
    // A validação real será feita ao buscar a proposta no banco

    // Obter ID real da proposta ou usar mapeamento padrão
    let propostaId = tokenMappings[token];

    if (!propostaId) {
      // 🔧 CORREÇÃO: Buscar proposta pelo NÚMERO (token)
      try {
        const propostas = await this.propostasService.listarPropostas();
        console.log(`📊 ${propostas.length} propostas encontradas no banco`);
        console.log(`🔍 Procurando proposta com número: "${token}"`);

        // Log das primeiras propostas para debug
        if (propostas.length > 0) {
          console.log(`📋 Primeiras propostas no banco:`);
          propostas.slice(0, 3).forEach(p => {
            console.log(`   - ${p.numero} (ID: ${p.id})`);
          });
        }

        // Tentar encontrar proposta pelo número (token)
        const propostaEncontrada = propostas.find(p => p.numero === token);

        if (propostaEncontrada) {
          propostaId = propostaEncontrada.id;
          console.log(`✅ Token ${token} mapeado para proposta existente ID: ${propostaId}`);
          console.log(`🔧 DEBUG: propostaEncontrada.id = "${propostaEncontrada.id}" (tipo: ${typeof propostaEncontrada.id})`);
          console.log(`🔧 DEBUG: propostaEncontrada.numero = "${propostaEncontrada.numero}"`);
        } else {
          console.log(`❌ Proposta com número ${token} não encontrada no banco`);
          console.log(`🔍 Buscou entre ${propostas.length} propostas. Token rejeitado.`);
          return null; // Token inválido se proposta não existe
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao buscar propostas:`, error);
        return null; // Falhar se não conseguir buscar
      }
    } else {
      console.log(`✅ Token ${token} encontrado no mapeamento: ${propostaId}`);
    }

    // Simular dados do token para desenvolvimento
    const tokenMock: TokenData = {
      token,
      propostaId, // AGORA USA O ID CORRETO DA PROPOSTA REAL
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
      isActive: true
    };

    console.log(`✅ Token ${token} validado → Proposta ID real: ${propostaId}`);
    return tokenMock;
  }

  /**
   * Registra ação no portal
   */
  async registrarAcaoPortal(
    token: string,
    acao: string,
    metadata?: any
  ): Promise<void> {
    console.log(`📝 Portal: Registrando ação "${acao}" para token ${token}`);

    const logEntry = {
      token: token.substring(0, 8) + '...',
      acao,
      timestamp: new Date().toISOString(),
      metadata
    };

    // Em um ambiente real, isso seria salvo no banco de dados
    console.log(`📋 Log Portal:`, logEntry);
  }

  /**
   * Registra visualização da proposta
   */
  async registrarVisualizacao(token: string, viewData: ViewData): Promise<void> {
    await this.registrarAcaoPortal(token, 'view', {
      ip: viewData.ip,
      userAgent: viewData.userAgent,
      timestamp: viewData.timestamp || new Date().toISOString()
    });
  }

  /**
   * Registra ação do cliente na proposta
   */
  async registrarAcaoCliente(
    token: string,
    acao: string,
    metadata?: any
  ): Promise<{ sucesso: boolean; mensagem: string; status?: string }> {
    console.log(`🎯 Portal: Registrando ação "${acao}" do cliente`);

    try {
      // 1. Validar token
      const tokenData = await this.validarToken(token);
      if (!tokenData || !tokenData.isActive) {
        return { sucesso: false, mensagem: 'Token inválido ou expirado' };
      }

      // 2. Registrar ação no log
      await this.registrarAcaoPortal(token, acao, {
        ...metadata,
        timestamp: new Date().toISOString(),
        source: 'cliente-portal'
      });

      // 3. Atualizar status baseado na ação
      let novoStatus: string | null = null;

      switch (acao) {
        case 'visualizada':
          novoStatus = 'visualizada';
          break;
        case 'aprovada':
        case 'aceita':
          novoStatus = 'aprovada';
          break;
        case 'rejeitada':
        case 'recusada':
          novoStatus = 'rejeitada';
          break;
        case 'em_analise':
          novoStatus = 'em_analise';
          break;
        default:
          // Para outras ações, apenas registrar sem alterar status
          console.log(`📝 Ação "${acao}" registrada sem alteração de status`);
          break;
      }

      // 4. Se há mudança de status, aplicar via método centralizado
      if (novoStatus) {
        await this.atualizarStatusPorToken(token, novoStatus, metadata);
        console.log(`✅ Status atualizado para: ${novoStatus}`);

        return {
          sucesso: true,
          mensagem: `Ação "${acao}" registrada e status atualizado para "${novoStatus}"`,
          status: novoStatus
        };
      }

      return {
        sucesso: true,
        mensagem: `Ação "${acao}" registrada com sucesso`
      };

    } catch (error) {
      console.error(`❌ Erro ao registrar ação do cliente:`, error);
      return {
        sucesso: false,
        mensagem: `Erro ao registrar ação: ${error.message}`
      };
    }
  }

  /**
   * Registra um token para uma proposta específica
   */
  async registrarTokenProposta(token: string, propostaId: string): Promise<void> {
    console.log(`🎫 Portal: Registrando token ${token} para proposta ${propostaId}`);

    // Adicionar ao mapeamento em memória
    this.tokenMappings[token] = propostaId;

    console.log(`✅ Token ${token} registrado com sucesso para proposta ${propostaId}`);
  }

  /**
   * Obtém mapeamentos de tokens (método auxiliar)
   */
  private getTokenMappings(): Record<string, string> {
    return this.tokenMappings;
  }

  /**
   * Gera novo token para proposta (para futuras funcionalidades)
   */
  async gerarToken(propostaId: string, expiresInDays: number = 30): Promise<string> {
    const token = `${propostaId}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const tokenData: TokenData = {
      token,
      propostaId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true
    };

    // Em um ambiente real, salvar no banco de dados
    console.log(`🎫 Token gerado para proposta ${propostaId}:`, token);

    return token;
  }
}
