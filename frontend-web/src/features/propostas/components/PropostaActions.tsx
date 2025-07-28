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

  // Função para detectar se é PropostaCompleta ou PropostaUI
  const isPropostaCompleta = (prop: PropostaCompleta | PropostaUI): prop is PropostaCompleta => {
    return 'cliente' in prop && typeof prop.cliente === 'object';
  };

  // Função para extrair dados do cliente independente do formato
  const getClienteData = () => {
    if (isPropostaCompleta(proposta)) {
      return {
        nome: proposta.cliente?.nome || 'Cliente',
        email: proposta.cliente?.email || '',
        telefone: proposta.cliente?.telefone || ''
      };
    } else {
      // Formato UI - extrair dados do cliente_contato e cliente
      const nome = proposta.cliente || 'Cliente';
      const email = proposta.cliente_contato || `${nome.toLowerCase().replace(/\s+/g, '.')}@email.com`;
      const telefone = proposta.cliente_contato?.includes('(') ? proposta.cliente_contato : '(62) 99999-9999';

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
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Enviar proposta por email
  const handleSendEmail = async () => {
    const clienteData = getClienteData();

    if (!clienteData.email) {
      toast.error('Cliente não possui email cadastrado');
      return;
    }

    setSendingEmail(true);
    try {
      const token = generateAccessToken();
      const propostaData = getPropostaData();

      const emailData = {
        cliente: {
          nome: clienteData.nome,
          email: clienteData.email
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
  const handleSendWhatsApp = () => {
    const clienteData = getClienteData();

    if (!clienteData.telefone) {
      toast.error('Cliente não possui telefone cadastrado');
      return;
    }

    const token = generateAccessToken();
    const propostaData = getPropostaData();
    const phoneNumber = clienteData.telefone.replace(/\D/g, '');
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
      const clienteData = getClienteData();
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
    const clienteData = getClienteData();
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
        disabled={sendingEmail || !getClienteData().email}
        className={`${buttonClass} text-green-600 hover:text-green-900 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed`}
        title={getClienteData().email ? "Enviar por email" : "Cliente sem email"}
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
        disabled={!getClienteData().telefone}
        className={`${buttonClass} text-green-500 hover:text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed`}
        title={getClienteData().telefone ? "Enviar por WhatsApp" : "Cliente sem telefone"}
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
