import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  Eye,
  Mail,
  MessageSquare,
  Download,
  Share2,
  Send,
  Loader2
} from 'lucide-react';
import { emailServiceReal } from '../../../services/emailServiceReal';
import { PropostaCompleta } from '../services/propostasService';
import { clientesService } from '../../../services/clientesService';

// Tipo união para aceitar tanto PropostaCompleta quanto o formato da UI
type PropostaUI = {
  id: string;
  numero: string;
  cliente: string;
  cliente_contato: string;
  titulo: string;
  valor: number;
  status: string;
  data_criacao: string;
  data_vencimento: string;
  data_aprovacao: string | null;
  vendedor: string;
  descricao: string;
  probabilidade: number;
  categoria: string;
};

interface PropostaActionsProps {
  proposta: PropostaCompleta | PropostaUI;
  onViewProposta: (proposta: PropostaCompleta | PropostaUI) => void;
  className?: string;
  showLabels?: boolean;
}

const PropostaActions: React.FC<PropostaActionsProps> = ({
  proposta,
  onViewProposta,
  className = "",
  showLabels = false
}) => {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [clienteData, setClienteData] = useState<{ nome: string, email: string, telefone: string } | null>(null);

  // Carregar dados do cliente quando o componente for montado
  React.useEffect(() => {
    const loadClienteData = async () => {
      const data = await getClienteData();
      setClienteData(data);
    };
    loadClienteData();
  }, [proposta]);

  // Função para detectar se é PropostaCompleta ou PropostaUI
  const isPropostaCompleta = (prop: PropostaCompleta | PropostaUI): prop is PropostaCompleta => {
    return 'cliente' in prop && typeof prop.cliente === 'object';
  };

  // Função para extrair dados do cliente independente do formato
  const getClienteData = async () => {
    if (isPropostaCompleta(proposta)) {
      // ✅ Formato completo - verificar se precisa buscar dados reais
      const nome = proposta.cliente?.nome || 'Cliente';
      const email = proposta.cliente?.email || '';
      const telefone = proposta.cliente?.telefone || '';

      // 🚨 VERIFICAR SE EMAIL É FICTÍCIO E BUSCAR DADOS REAIS
      const isEmailFicticio = email.includes('@cliente.com') ||
        email.includes('@cliente.temp') ||
        email.includes('@email.com');

      if (isEmailFicticio && nome && nome !== 'Cliente') {
        console.log(`⚠️ Email fictício detectado: ${email}`);
        console.log(`🔍 Buscando dados REAIS do cliente: "${nome}"`);

        try {
          // Buscar cliente real no backend
          let clientesEncontrados = [];

          // Método 1: Busca por nome
          try {
            const response = await clientesService.getClientes({
              search: nome,
              limit: 100
            });
            if (response?.data) {
              clientesEncontrados = response.data.filter(c =>
                c.nome?.toLowerCase().includes(nome.toLowerCase()) ||
                nome.toLowerCase().includes(c.nome?.toLowerCase())
              );
            }
          } catch (error) {
            console.log('Erro na busca 1:', error);
          }

          // Método 2: Se não encontrou, buscar por partes do nome
          if (clientesEncontrados.length === 0) {
            try {
              const partes = nome.split(' ');
              for (const parte of partes) {
                if (parte.length > 3) {
                  const response = await clientesService.getClientes({
                    search: parte,
                    limit: 100
                  });
                  if (response?.data) {
                    const found = response.data.find(c =>
                      c.nome?.toLowerCase().includes(nome.toLowerCase()) ||
                      nome.toLowerCase().includes(c.nome?.toLowerCase())
                    );
                    if (found) {
                      clientesEncontrados = [found];
                      break;
                    }
                  }
                }
              }
            } catch (error) {
              console.log('Erro na busca 2:', error);
            }
          }

          if (clientesEncontrados.length > 0) {
            const clienteReal = clientesEncontrados[0];
            console.log(`✅ DADOS REAIS ENCONTRADOS:`, {
              id: clienteReal.id,
              nome: clienteReal.nome,
              email: clienteReal.email,
              telefone: clienteReal.telefone
            });

            return {
              nome: clienteReal.nome,
              email: clienteReal.email || '',
              telefone: clienteReal.telefone || ''
            };
          } else {
            console.log(`⚠️ Cliente real não encontrado para: "${nome}"`);
          }
        } catch (error) {
          console.error('❌ Erro ao buscar dados reais:', error);
        }
      }

      // Retornar dados originais se não conseguiu buscar reais
      return { nome, email, telefone };
    } else {
      // 🔧 Formato UI - buscar dados reais do cliente no backend
      const nome = proposta.cliente || 'Cliente';

      // 1️⃣ TENTATIVA: Verificar se cliente_contato já é um email válido
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      let email = '';
      let telefone = '';

      // Verificar se cliente_contato contém email válido
      if (proposta.cliente_contato && emailRegex.test(proposta.cliente_contato)) {
        email = proposta.cliente_contato;
      } else if (proposta.cliente_contato && proposta.cliente_contato.includes('(')) {
        // Se contém parênteses, provavelmente é telefone
        telefone = proposta.cliente_contato;
      }

      // 2️⃣ TENTATIVA: Buscar cliente real por nome no backend (SEMPRE para garantir telefone)
      if (nome && nome !== 'Cliente') {
        try {
          console.log(`🔍 Buscando cliente real por nome: "${nome}" (para garantir email e telefone)`);

          // Tentar múltiplas formas de busca
          let clientesEncontrados = [];

          // Busca 1: Nome completo
          try {
            clientesEncontrados = await clientesService.searchClientes(nome);
            console.log(`   📝 Busca por nome completo: ${clientesEncontrados?.length || 0} resultados`);
          } catch (error) {
            console.log(`   ❌ Erro na busca por nome completo:`, error);
          }

          // Busca 2: Apenas primeiro nome se busca completa falhou
          if (!clientesEncontrados || clientesEncontrados.length === 0) {
            const primeiroNome = nome.split(' ')[0];
            try {
              clientesEncontrados = await clientesService.searchClientes(primeiroNome);
              console.log(`   📝 Busca por primeiro nome "${primeiroNome}": ${clientesEncontrados?.length || 0} resultados`);
            } catch (error) {
              console.log(`   ❌ Erro na busca por primeiro nome:`, error);
            }
          }

          // Busca 3: Listar todos e filtrar localmente
          if (!clientesEncontrados || clientesEncontrados.length === 0) {
            try {
              const todosClientes = await clientesService.getClientes({ limit: 1000 });
              if (todosClientes?.data) {
                clientesEncontrados = todosClientes.data.filter(c =>
                  c.nome?.toLowerCase().includes(nome.toLowerCase()) ||
                  nome.toLowerCase().includes(c.nome?.toLowerCase())
                );
                console.log(`   📝 Busca local em ${todosClientes.data.length} clientes: ${clientesEncontrados.length} resultados`);
              }
            } catch (error) {
              console.log(`   ❌ Erro na busca local:`, error);
            }
          }

          if (clientesEncontrados && clientesEncontrados.length > 0) {
            // Buscar correspondência exata ou mais próxima
            const clienteExato = clientesEncontrados.find(c =>
              c.nome?.toLowerCase().trim() === nome.toLowerCase().trim()
            );

            const clienteReal = clienteExato || clientesEncontrados[0];

            console.log(`✅ Cliente real encontrado:`, {
              id: clienteReal.id,
              nome: clienteReal.nome,
              email: clienteReal.email,
              telefone: clienteReal.telefone,
              metodo: clienteExato ? 'correspondência exata' : 'mais próximo'
            });

            return {
              nome: clienteReal.nome,
              email: clienteReal.email || email, // Usar email real ou da proposta como fallback
              telefone: clienteReal.telefone || telefone // Usar telefone real ou da proposta como fallback
            };
          } else {
            console.log(`⚠️ Nenhum cliente encontrado com nome: "${nome}"`);
          }
        } catch (error) {
          console.error('❌ Erro ao buscar cliente no backend:', error);
        }
      }

      // 3️⃣ RETORNO: Usar dados extraídos ou buscar no backend se necessário
      console.log('🔍 [getClienteData] Dados extraídos inicialmente:', { nome, email, telefone });

      // Se não tem telefone, mas tem nome, tentar buscar no backend como fallback
      if (!telefone && nome && nome !== 'Cliente') {
        console.log('⚠️ Telefone vazio - tentando buscar no backend como fallback...');
        try {
          const response = await clientesService.getClientes({
            search: nome,
            limit: 100
          });
          if (response?.data) {
            const clienteEncontrado = response.data.find(c =>
              c.nome?.toLowerCase().includes(nome.toLowerCase()) ||
              nome.toLowerCase().includes(c.nome?.toLowerCase())
            );
            if (clienteEncontrado && clienteEncontrado.telefone) {
              console.log('✅ Telefone encontrado no backend:', clienteEncontrado.telefone);
              telefone = clienteEncontrado.telefone;
              if (!email && clienteEncontrado.email) {
                email = clienteEncontrado.email;
              }
            }
          }
        } catch (error) {
          console.log('❌ Erro ao buscar telefone no backend:', error);
        }
      }

      console.log('🔍 [getClienteData] Dados finais:', { nome, email, telefone });
      return { nome, email, telefone };
    }
  };

  // Função para extrair dados da proposta independente do formato
  const getPropostaData = () => {
    if (isPropostaCompleta(proposta)) {
      return {
        numero: proposta.numero || 'N/A',
        total: proposta.total || 0,
        dataValidade: proposta.dataValidade ? proposta.dataValidade.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        titulo: proposta.titulo || 'Proposta comercial'
      };
    } else {
      return {
        numero: proposta.numero || 'N/A',
        total: proposta.valor || 0,
        dataValidade: proposta.data_vencimento || new Date().toISOString().split('T')[0],
        titulo: proposta.titulo || 'Proposta comercial'
      };
    }
  };

  // Gerar token de acesso para a proposta
  const generateAccessToken = () => {
    // Gera um token numérico de 6 dígitos (mais fácil para o cliente)
    return Math.floor(Math.random() * 900000 + 100000).toString();
  };

  // Enviar proposta por email
  const handleSendEmail = async () => {
    const clienteData = await getClienteData();

    console.log('🔍 Dados do cliente extraídos:', clienteData);

    if (!clienteData.email) {
      toast.error('Cliente não possui email cadastrado');
      return;
    }

    // Validar se o email é válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clienteData.email)) {
      toast.error('Email do cliente é inválido: ' + clienteData.email);
      return;
    }

    // 🚨 DETECÇÃO DE EMAIL FICTÍCIO - Solicitar email real
    const isEmailFicticio = clienteData.email.includes('@cliente.com') ||
      clienteData.email.includes('@cliente.temp') ||
      clienteData.email.includes('@email.com') ||
      clienteData.email.includes('@exemplo.com') ||
      clienteData.email.includes('@cliente.') ||
      clienteData.email.includes('@temp.') ||
      clienteData.email.includes('@ficticio.');

    let emailFinal = clienteData.email;

    if (isEmailFicticio) {
      console.warn('⚠️ Email fictício detectado:', clienteData.email);

      // Solicitar email real do usuário
      const emailReal = prompt(`O email cadastrado "${clienteData.email}" é fictício.\n\nPor favor, digite o email REAL do cliente "${clienteData.nome}":\n\n(Ex: dhonlenofreitas@hotmail.com)`);

      if (!emailReal) {
        toast.error('Envio cancelado - Email real é obrigatório');
        return;
      }

      if (!emailRegex.test(emailReal)) {
        toast.error('Email informado é inválido: ' + emailReal);
        return;
      }

      console.log('✅ Email real informado pelo usuário:', emailReal);
      emailFinal = emailReal; // Usar o email real
      toast.success(`Email corrigido de "${clienteData.email}" para "${emailReal}"`);
    }

    console.log('📧 Enviando email para:', emailFinal);

    setSendingEmail(true);
    try {
      const token = generateAccessToken();
      const propostaData = getPropostaData();

      const emailData = {
        cliente: {
          nome: clienteData.nome,
          email: emailFinal  // ✅ Usar email real corrigido pelo usuário
        },
        proposta: {
          numero: propostaData.numero,
          valorTotal: propostaData.total,
          dataValidade: propostaData.dataValidade,
          token: token
        },
        vendedor: {
          nome: 'Vendedor',
          email: 'vendedor@conectcrm.com',
          telefone: '(62) 99668-9991'
        },
        empresa: {
          nome: 'ConectCRM',
          email: 'conectcrm@gmail.com',
          telefone: '(62) 99668-9991',
          endereco: 'Goiânia/GO'
        },
        portalUrl: `${window.location.origin}/portal`
      };

      const resultado = await emailServiceReal.enviarPropostaParaCliente(emailData);

      if (resultado.success) {
        toast.success(`✅ Proposta enviada por email para ${clienteData.nome}`);
        console.log('📧 Token de acesso gerado:', token);

        // 🔄 NOTIFICAR PÁGINA PAI PARA ATUALIZAÇÃO EM TEMPO REAL
        console.log('🔄 Disparando evento de atualização de proposta...');

        // Criar evento personalizado para notificar a PropostasPage
        const eventoAtualizacao = new CustomEvent('propostaAtualizada', {
          detail: {
            propostaId: propostaData.numero,
            novoStatus: 'enviada', // Status automaticamente alterado pelo backend
            fonte: 'email',
            timestamp: new Date().toISOString()
          }
        });

        // Disparar o evento globalmente
        window.dispatchEvent(eventoAtualizacao);

        // Aguardar um pouco e atualizar novamente para garantir sincronização
        setTimeout(() => {
          console.log('🔄 Segunda notificação de atualização...');
          window.dispatchEvent(new CustomEvent('atualizarPropostas', {
            detail: { fonte: 'email-enviado' }
          }));
        }, 1000);

      } else {
        toast.error(`❌ Erro ao enviar email: ${resultado.error}`);
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast.error('Erro ao enviar email da proposta');
    } finally {
      setSendingEmail(false);
    }
  };

  // Enviar proposta por WhatsApp
  const handleSendWhatsApp = async () => {
    const clienteData = await getClienteData();

    console.log('🔍 [handleSendWhatsApp] Dados do cliente:', clienteData);

    if (!clienteData.telefone) {
      toast.error('Cliente não possui telefone cadastrado');
      return;
    }

    // Validar formato do telefone (remover caracteres não numéricos)
    const phoneNumber = clienteData.telefone.replace(/\D/g, '');

    if (phoneNumber.length < 10) {
      toast.error('Telefone do cliente é inválido: ' + clienteData.telefone);
      return;
    }

    const token = generateAccessToken();
    const propostaData = getPropostaData();
    const portalUrl = `${window.location.origin}/portal-cliente/${propostaData.numero}/${token}`;

    const message = `🔔 *Proposta Comercial #${propostaData.numero}*

Olá *${clienteData.nome}*! 👋

Temos o prazer de enviar nossa proposta comercial para sua análise.

📋 *Detalhes:*
• Proposta: #${propostaData.numero}
• Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(propostaData.total)}
• Válida até: ${new Date(propostaData.dataValidade).toLocaleDateString('pt-BR')}

🔐 *Código de Acesso:* \`${token}\`

🌐 *Acesse o portal:* ${portalUrl}

*Como acessar:*
1️⃣ Clique no link acima
2️⃣ Digite o código: ${token}
3️⃣ Visualize todos os detalhes
4️⃣ Aceite ou solicite alterações

Em caso de dúvidas, estamos à disposição! 😊

Atenciosamente,
*ConectCRM*`;

    const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    toast.success(`📱 Abrindo WhatsApp para ${clienteData.nome}`);
    console.log('📱 Token de acesso gerado para WhatsApp:', token);
  };

  // Download da proposta em PDF
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      // Simular geração de PDF (implementar com biblioteca real)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Criar um blob fake para demonstração
      const clienteData = await getClienteData();
      const propostaData = getPropostaData();
      const pdfContent = `Proposta ${propostaData.numero} - ${clienteData.nome}`;
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `Proposta_${propostaData.numero}_${clienteData.nome.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`📄 PDF da proposta ${propostaData.numero} baixado`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF da proposta');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Compartilhar proposta
  const handleShare = async () => {
    const token = generateAccessToken();
    const propostaData = getPropostaData();
    const clienteData = await getClienteData();
    const shareUrl = `${window.location.origin}/portal-cliente/${propostaData.numero}/${token}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Proposta ${propostaData.numero} - ConectCRM`,
          text: `Proposta comercial para ${clienteData.nome}`,
          url: shareUrl
        });
        toast.success('🔗 Proposta compartilhada');
      } catch (error) {
        // Fallback para cópia do link
        navigator.clipboard.writeText(shareUrl);
        toast.success('🔗 Link da proposta copiado');
      }
    } else {
      // Fallback para navegadores sem suporte ao Web Share API
      navigator.clipboard.writeText(shareUrl);
      toast.success('🔗 Link da proposta copiado');
    }

    console.log('🔗 Token de acesso gerado para compartilhamento:', token);
  };

  const buttonClass = showLabels
    ? "flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors"
    : "p-2 rounded-md transition-colors";

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* Visualizar */}
      <button
        onClick={() => onViewProposta(proposta)}
        className={`${buttonClass} text-blue-600 hover:text-blue-900 hover:bg-blue-50`}
        title="Visualizar proposta"
      >
        <Eye className="w-4 h-4" />
        {showLabels && <span>Visualizar</span>}
      </button>

      {/* Email */}
      <button
        onClick={handleSendEmail}
        disabled={sendingEmail || !clienteData?.email}
        className={`${buttonClass} text-green-600 hover:text-green-900 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed`}
        title={clienteData?.email ? "Enviar por email" : "Cliente sem email"}
      >
        {sendingEmail ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Mail className="w-4 h-4" />
        )}
        {showLabels && <span>Email</span>}
      </button>

      {/* WhatsApp */}
      <button
        onClick={handleSendWhatsApp}
        disabled={!clienteData?.telefone}
        className={`${buttonClass} text-green-500 hover:text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed`}
        title={clienteData?.telefone ? "Enviar por WhatsApp" : "Cliente sem telefone"}
      >
        <MessageSquare className="w-4 h-4" />
        {showLabels && <span>WhatsApp</span>}
      </button>

      {/* Download PDF */}
      <button
        onClick={handleDownloadPdf}
        disabled={downloadingPdf}
        className={`${buttonClass} text-red-600 hover:text-red-900 hover:bg-red-50 disabled:opacity-50`}
        title="Baixar PDF"
      >
        {downloadingPdf ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {showLabels && <span>PDF</span>}
      </button>

      {/* Compartilhar */}
      <button
        onClick={handleShare}
        className={`${buttonClass} text-purple-600 hover:text-purple-900 hover:bg-purple-50`}
        title="Compartilhar link"
      >
        <Share2 className="w-4 h-4" />
        {showLabels && <span>Compartilhar</span>}
      </button>
    </div>
  );
};

export default PropostaActions;
