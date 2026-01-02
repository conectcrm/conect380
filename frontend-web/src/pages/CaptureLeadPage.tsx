import React, { useState } from 'react';
import {
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  MessageSquare,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import leadsService, { CaptureLeadDto } from '../services/leadsService';

/**
 * CaptureLeadPage - Formulário Público de Captura de Leads
 *
 * Landing page pública (sem autenticação) para captura de leads externos.
 * Pode ser usada em:
 * - Links de campanhas de marketing
 * - QR codes em materiais impressos
 * - Botões "Fale Conosco" no site institucional
 * - Formulários de interesse em produtos
 */
const CaptureLeadPage: React.FC = () => {
  const [formData, setFormData] = useState<CaptureLeadDto>({
    nome: '',
    email: '',
    telefone: '',
    empresa_nome: '',
    mensagem: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    if (!formData.nome.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await leadsService.capturarPublico(formData);

      setSuccess(true);
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        empresa_nome: '',
        mensagem: '',
      });
    } catch (err: unknown) {
      console.error('Erro ao capturar lead:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Erro ao enviar formulário');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#159A9C]/10 via-white to-[#DEEFE7]/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-[#002333] mb-2">Mensagem Enviada!</h1>
            <p className="text-[#B4BEC9]">
              Obrigado pelo seu interesse. Nossa equipe entrará em contato em breve.
            </p>
          </div>

          <button
            onClick={() => setSuccess(false)}
            className="px-6 py-3 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors font-medium w-full"
          >
            Enviar Nova Mensagem
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#159A9C]/10 via-white to-[#DEEFE7]/30 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-[#159A9C]/10 rounded-full flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-[#159A9C]" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#002333] mb-3">Entre em Contato</h1>
          <p className="text-lg text-[#B4BEC9]">
            Preencha o formulário abaixo e nossa equipe entrará em contato
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-[#002333] mb-2">
                Nome completo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserPlus className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-[#002333]"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#002333] mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-[#002333]"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {/* Telefone */}
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-[#002333] mb-2">
                Telefone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-[#002333]"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            {/* Empresa */}
            <div>
              <label
                htmlFor="empresa_nome"
                className="block text-sm font-medium text-[#002333] mb-2"
              >
                Empresa
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="empresa_nome"
                  name="empresa_nome"
                  value={formData.empresa_nome}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-[#002333]"
                  placeholder="Nome da sua empresa"
                />
              </div>
            </div>

            {/* Mensagem */}
            <div>
              <label htmlFor="mensagem" className="block text-sm font-medium text-[#002333] mb-2">
                Mensagem
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  id="mensagem"
                  name="mensagem"
                  value={formData.mensagem}
                  onChange={handleChange}
                  rows={4}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-[#002333] resize-none"
                  placeholder="Como podemos ajudar você?"
                />
              </div>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Enviar Mensagem
                </>
              )}
            </button>

            {/* Disclaimer */}
            <p className="text-xs text-center text-gray-500">
              Ao enviar este formulário, você concorda com nossa política de privacidade. Suas
              informações serão usadas apenas para entrar em contato.
            </p>
          </form>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">Resposta em até 24 horas úteis</p>
        </div>
      </div>
    </div>
  );
};

export default CaptureLeadPage;
