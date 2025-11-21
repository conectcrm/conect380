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
import ModalEnviarWhatsApp from '../../../components/whatsapp/ModalEnviarWhatsApp';
import { pdfPropostasService } from '../../../services/pdfPropostasService';

// Tipo união para aceitar tanto PropostaCompleta quanto o formato da UI
type PropostaUI = {
  id: string;
  numero: string;
  cliente: string;
  cliente_contato: string;
  cliente_telefone?: string;
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
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [propostaPdfBuffer, setPropostaPdfBuffer] = useState<Uint8Array | null>(null);

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

  // Função para extrair dados básicos da proposta
  const getPropostaData = () => {
    if (isPropostaCompleta(proposta)) {
      return {
        numero: proposta.numero || '',
        total: Number(proposta.total) || 0,
        dataValidade: proposta.dataValidade || new Date().toISOString(),
        titulo: `Proposta para ${proposta.cliente?.nome || 'Cliente'}`
      };
    } else {
      return {
        numero: proposta.numero || '',
        total: proposta.valor || 0,
        dataValidade: proposta.data_vencimento || new Date().toISOString(),
        titulo: proposta.titulo || `Proposta ${proposta.numero}`
      };
    }
  };

  // Função para extrair dados do cliente independente do formato
  const getClienteData = async () => {
    if (isPropostaCompleta(proposta)) {
      // Formato completo - verificar se precisa buscar dados reais
      const nome = proposta.cliente?.nome || 'Cliente';
      const email = proposta.cliente?.email || '';
      const telefone = proposta.cliente?.telefone || '';

      // Verificar se email é fictício e buscar dados reais
      const isEmailFicticio = email.includes('@cliente.com') ||
        email.includes('@cliente.temp') ||
        email.includes('@email.com');

      if (isEmailFicticio && nome && nome !== 'Cliente') {
        try {
          const response = await clientesService.getClientes({
            search: nome,
            limit: 100
          });

          if (response?.data) {
            const clienteReal = response.data.find(c =>
              c.nome?.toLowerCase().includes(nome.toLowerCase()) ||
              nome.toLowerCase().includes(c.nome?.toLowerCase())
            );

            if (clienteReal && clienteReal.email && clienteReal.email !== email) {
              return {
                nome: clienteReal.nome || nome,
                email: clienteReal.email,
                telefone: clienteReal.telefone || telefone
              };
            }
          }
        } catch (error) {
          console.error('Erro ao buscar dados reais do cliente:', error);
        }
      }

      return { nome, email, telefone };
    } else {
      // Formato UI
      return {
        nome: proposta.cliente || 'Cliente',
        email: proposta.cliente_contato || '',
        telefone: proposta.cliente_telefone || ''
      };
    }
  };

  // Gerar token de acesso simples
  const generateAccessToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Enviar proposta por email
  const handleSendEmail = async () => {
    const clienteData = await getClienteData();

    if (!clienteData.email) {
      toast.error('Cliente não possui email cadastrado');
      return;
    }

    setSendingEmail(true);

    try {
      const propostaData = getPropostaData();

      const emailData = {
        propostaNumero: propostaData.numero,
        clienteNome: clienteData.nome,
        clienteEmail: clienteData.email,
        valorTotal: propostaData.total,
        empresaNome: 'ConectCRM'
      };

      const resultado = await emailServiceReal.enviarPropostaParaCliente(emailData);

      if (resultado.sucesso) {
        toast.success(`✅ Email enviado para ${clienteData.nome}`);
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
    const cliente = await getClienteData();

    if (!cliente?.telefone) {
      toast.error('Cliente não possui telefone cadastrado');
      return;
    }

    // Gerar PDF para anexar
    try {
      const propostaData = getPropostaData();
      const pdfBlob = await pdfPropostasService.gerarPdf({
        numero: propostaData.numero,
        cliente: {
          nome: cliente.nome,
          email: cliente.email || '',
          telefone: cliente.telefone
        },
        empresa: { nome: 'ConectCRM' },
        valorTotal: propostaData.total,
        produtos: [],
        observacoes: propostaData.titulo
      });

      // Converter Blob para Uint8Array
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      setPropostaPdfBuffer(uint8Array);
    } catch (error) {
      console.error('Erro ao gerar PDF, enviando sem anexo:', error);
      setPropostaPdfBuffer(null);
    }

    // Abrir modal do WhatsApp
    setShowWhatsAppModal(true);
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);

    try {
      const cliente = await getClienteData();
      const propostaData = getPropostaData();

      const pdfBlob = await pdfPropostasService.gerarPdf({
        numero: propostaData.numero,
        cliente: {
          nome: cliente.nome,
          email: cliente.email || '',
          telefone: cliente.telefone
        },
        empresa: { nome: 'ConectCRM' },
        valorTotal: propostaData.total,
        produtos: [],
        observacoes: propostaData.titulo
      });

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Proposta_${propostaData.numero}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
    const cliente = await getClienteData();
    const shareUrl = `${window.location.origin}/portal-cliente/${propostaData.numero}/${token}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Proposta ${propostaData.numero} - ConectCRM`,
          text: `Proposta comercial para ${cliente.nome}`,
          url: shareUrl
        });
        toast.success('🔗 Proposta compartilhada');
      } catch (error) {
        navigator.clipboard.writeText(shareUrl);
        toast.success('🔗 Link da proposta copiado');
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('🔗 Link da proposta copiado');
    }
  };

  const buttonClass = showLabels
    ? "flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors"
    : "p-2 rounded-md transition-colors";

  return (
    <>
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

      {/* Modal WhatsApp */}
      {showWhatsAppModal && clienteData && (
        <ModalEnviarWhatsApp
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          proposta={{
            id: getPropostaData().numero,
            numero: getPropostaData().numero,
            cliente: {
              nome: clienteData.nome,
              whatsapp: clienteData.telefone,
              telefone: clienteData.telefone
            },
            valorTotal: getPropostaData().total,
            empresa: {
              nome: 'ConectCRM'
            }
          }}
          pdfBuffer={propostaPdfBuffer}
          onSuccess={() => {
            toast.success('Proposta enviada via WhatsApp!');
            setShowWhatsAppModal(false);
          }}
        />
      )}
    </>
  );
};

export default PropostaActions;
