import React, { useState, useEffect } from 'react';
import { Mail, Check, X, Loader2, Send, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import CriarCanalEmailButton from './CriarCanalEmailButton';

interface ConfigEmailForm {
  provedor: 'sendgrid' | 'ses' | 'smtp';
  sendgrid_api_key?: string;
  from_email: string;
  from_name: string;
  test_email?: string;
}

/**
 * 📧 Configuração de Canal E-mail
 * 
 * Permite configurar:
 * - SendGrid (API Key)
 * - AWS SES (em breve)
 * - SMTP (em breve)
 */
export const ConfigurarCanalEmail: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testando, setTestando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState<ConfigEmailForm>({
    provedor: 'sendgrid',
    sendgrid_api_key: '',
    from_email: '',
    from_name: 'ConectCRM',
    test_email: '',
  });

  const [configExiste, setConfigExiste] = useState(false);

  useEffect(() => {
    carregarConfigExistente();
  }, []);

  const carregarConfigExistente = async () => {
    try {
      const response = await api.get('/api/atendimento/canais/integracoes');
      const configs = response.data?.data || [];
      const configEmail = configs.find((c: any) => c.tipo === 'email');

      if (configEmail) {
        setConfigExiste(true);
        setForm({
          provedor: configEmail.credenciais?.provedor || 'sendgrid',
          sendgrid_api_key: configEmail.credenciais?.sendgrid_api_key || '',
          from_email: configEmail.credenciais?.from_email || '',
          from_name: configEmail.credenciais?.from_name || 'ConectCRM',
          test_email: '',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    setSucesso(false);

    try {
      const payload = {
        tipo: 'email',
        nome: 'E-mail Principal',
        ativo: true,
        configuracao: {
          credenciais: {
            provedor: form.provedor,
            sendgrid_api_key: form.sendgrid_api_key,
            from_email: form.from_email,
            from_name: form.from_name,
          },
        },
      };

      const response = await api.post('/api/atendimento/canais', payload);

      if (response.data?.success) {
        setSucesso(true);
        setConfigExiste(true);
        setTimeout(() => setSucesso(false), 3000);
      } else {
        throw new Error(response.data?.message || 'Erro ao salvar configuração');
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      setErro(error.response?.data?.message || error.message || 'Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  };

  const handleTestar = async () => {
    if (!form.test_email) {
      setErro('Digite um e-mail para teste');
      return;
    }

    setTestando(true);
    setErro(null);

    try {
      const response = await api.post('/api/atendimento/canais/testar-email', {
        emailTeste: form.test_email,
      });

      if (response.data?.success) {
        alert(`✅ E-mail de teste enviado para ${form.test_email}!\n\nVerifique sua caixa de entrada.`);
      } else {
        throw new Error(response.data?.message || 'Erro ao enviar e-mail de teste');
      }
    } catch (error: any) {
      console.error('Erro ao testar:', error);
      setErro(error.response?.data?.message || error.message || 'Erro ao enviar e-mail de teste');
    } finally {
      setTestando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-[#159A9C]/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-[#159A9C]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#002333]">Configurar Canal E-mail</h1>
              <p className="text-sm text-gray-500">
                Configure o envio de e-mails via SendGrid, AWS SES ou SMTP
              </p>
            </div>
          </div>
        </div>

        {/* Botão para criar canal se não existir */}
        <div className="mb-6">
          <CriarCanalEmailButton />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6">
          {/* Provedor */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Provedor de E-mail *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, provedor: 'sendgrid' })}
                className={`p-4 rounded-lg border-2 transition-all ${form.provedor === 'sendgrid'
                  ? 'border-[#159A9C] bg-[#159A9C]/10'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="font-medium text-sm">SendGrid</div>
                <div className="text-xs text-gray-500 mt-1">Recomendado</div>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, provedor: 'ses' })}
                disabled
                className="p-4 rounded-lg border-2 border-gray-200 opacity-50 cursor-not-allowed"
              >
                <div className="font-medium text-sm">AWS SES</div>
                <div className="text-xs text-gray-500 mt-1">Em breve</div>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, provedor: 'smtp' })}
                disabled
                className="p-4 rounded-lg border-2 border-gray-200 opacity-50 cursor-not-allowed"
              >
                <div className="font-medium text-sm">SMTP</div>
                <div className="text-xs text-gray-500 mt-1">Em breve</div>
              </button>
            </div>
          </div>

          {/* SendGrid API Key */}
          {form.provedor === 'sendgrid' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SendGrid API Key *
              </label>
              <input
                type="text"
                value={form.sendgrid_api_key}
                onChange={(e) => setForm({ ...form, sendgrid_api_key: e.target.value })}
                placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Obtenha sua API Key em:{' '}
                <a
                  href="https://app.sendgrid.com/settings/api_keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#159A9C] hover:underline"
                >
                  SendGrid Dashboard
                </a>
              </p>
            </div>
          )}

          {/* E-mail Remetente */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail Remetente *
            </label>
            <input
              type="email"
              value={form.from_email}
              onChange={(e) => setForm({ ...form, from_email: e.target.value })}
              placeholder="contato@suaempresa.com.br"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Este e-mail aparecerá como remetente. Deve ser verificado no SendGrid.
            </p>
          </div>

          {/* Nome Remetente */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Remetente
            </label>
            <input
              type="text"
              value={form.from_name}
              onChange={(e) => setForm({ ...form, from_name: e.target.value })}
              placeholder="ConectCRM"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            />
          </div>

          {/* Separador */}
          <div className="border-t my-6"></div>

          {/* Teste de Envio */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Testar Configuração
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={form.test_email}
                onChange={(e) => setForm({ ...form, test_email: e.target.value })}
                placeholder="seu-email@teste.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleTestar}
                disabled={testando || !configExiste}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {testando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Testar
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {configExiste
                ? 'Enviaremos um e-mail de teste para verificar se a configuração está correta.'
                : 'Salve a configuração primeiro para testar o envio.'}
            </p>
          </div>

          {/* Mensagens */}
          {erro && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{erro}</p>
            </div>
          )}

          {sucesso && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800">Configuração salva com sucesso!</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {configExiste ? 'Atualizar Configuração' : 'Salvar Configuração'}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Dica */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Dica</h3>
          <p className="text-sm text-blue-800">
            Após configurar o e-mail, você poderá criar atendimentos por e-mail no modal{' '}
            <strong>"Novo Atendimento"</strong> e enviar mensagens diretamente do chat.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfigurarCanalEmail;
