import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Alert,
  Box,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  WhatsApp as WhatsAppIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
  Chat as ChatIcon
} from '@mui/icons-material';

interface ModalEnviarChatwootProps {
  open: boolean;
  onClose: () => void;
  proposta?: {
    id: string;
    numero: string;
    clienteNome: string;
    clienteEmail?: string;
    clienteWhatsApp?: string;
    valorTotal: number;
    empresaNome: string;
  };
}

interface FormData {
  clienteNome: string;
  clienteWhatsApp: string;
  clienteEmail: string;
  mensagemPersonalizada: string;
}

const ModalEnviarChatwoot: React.FC<ModalEnviarChatwootProps> = ({
  open,
  onClose,
  proposta
}) => {
  // Estados principais
  const [activeStep, setActiveStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  // Estados do formulário
  const [formData, setFormData] = useState<FormData>({
    clienteNome: proposta?.clienteNome || '',
    clienteWhatsApp: proposta?.clienteWhatsApp || '',
    clienteEmail: proposta?.clienteEmail || '',
    mensagemPersonalizada: ''
  });

  // Estados de validação
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const steps = [
    'Dados do Cliente',
    'Personalizar Mensagem',
    'Confirmar e Enviar'
  ];

  // Reset modal ao abrir/fechar
  React.useEffect(() => {
    if (open) {
      setActiveStep(0);
      setError('');
      setSuccess(false);
      setPdfFile(null);
      setFormData({
        clienteNome: proposta?.clienteNome || '',
        clienteWhatsApp: proposta?.clienteWhatsApp || '',
        clienteEmail: proposta?.clienteEmail || '',
        mensagemPersonalizada: ''
      });
    }
  }, [open, proposta]);

  // Atualizar campo do formulário
  const handleFieldChange = (field: keyof FormData, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.clienteNome.trim()) {
      newErrors.clienteNome = 'Nome do cliente é obrigatório';
    }

    if (!formData.clienteWhatsApp.trim()) {
      newErrors.clienteWhatsApp = 'WhatsApp é obrigatório';
    } else {
      const cleaned = formData.clienteWhatsApp.replace(/\D/g, '');
      if (cleaned.length < 10 || cleaned.length > 15) {
        newErrors.clienteWhatsApp = 'WhatsApp inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Próximo passo
  const handleNext = (): void => {
    if (activeStep === 0 && !validateForm()) {
      return;
    }

    setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  // Passo anterior
  const handleBack = (): void => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  // Upload de PDF
  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setPdfFile(file);
        setError('');
      } else {
        setError('Apenas arquivos PDF são permitidos');
      }
    }
  };

  // Gerar mensagem padrão
  const gerarMensagemPadrao = (): string => {
    if (!proposta) return '';

    const valorFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(proposta.valorTotal);

    return `🎯 *Nova Proposta Comercial*

👋 Olá *${formData.clienteNome}*!

📋 Enviamos sua proposta comercial:
• *Número:* ${proposta.numero}
• *Valor Total:* ${valorFormatado}
• *Empresa:* ${proposta.empresaNome}

📎 O arquivo PDF com todos os detalhes está anexado.

✅ *Próximos Passos:*
• Analise a proposta com calma
• Entre em contato conosco para esclarecimentos
• Confirme sua aprovação quando estiver pronto

📞 *Dúvidas?* Responda esta mensagem!

---
_Enviado automaticamente pelo sistema ${proposta.empresaNome}_`;
  };

  // Carregar mensagem padrão
  const carregarMensagemPadrao = (): void => {
    const mensagem = gerarMensagemPadrao();
    setFormData(prev => ({ ...prev, mensagemPersonalizada: mensagem }));
  };

  // Enviar proposta
  const enviarProposta = async (): Promise<void> => {
    if (!proposta) return;

    try {
      setLoading(true);
      setError('');

      // Preparar FormData
      const formDataToSend = new FormData();
      formDataToSend.append('clienteNome', formData.clienteNome);
      formDataToSend.append('clienteWhatsApp', formData.clienteWhatsApp);
      formDataToSend.append('clienteEmail', formData.clienteEmail);
      formDataToSend.append('propostaNumero', proposta.numero);
      formDataToSend.append('valorTotal', proposta.valorTotal.toString());
      formDataToSend.append('empresaNome', proposta.empresaNome);

      if (formData.mensagemPersonalizada.trim()) {
        formDataToSend.append('mensagemPersonalizada', formData.mensagemPersonalizada);
      }

      if (pdfFile) {
        formDataToSend.append('pdf', pdfFile);
      }

      // Enviar requisição
      const response = await fetch('/api/chatwoot/send-proposal', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setActiveStep(steps.length); // Ir para tela de sucesso
      } else {
        setError(data.message || 'Erro ao enviar proposta');
      }

    } catch (err) {
      console.error('❌ Erro ao enviar proposta:', err);
      setError('Erro de comunicação com o servidor');
    } finally {
      setLoading(false);
    }
  };

  // Fechar modal
  const handleClose = (): void => {
    if (!loading) {
      onClose();
    }
  };

  // Renderizar conteúdo do passo
  const renderStepContent = (): React.ReactNode => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                📋 Dados do Cliente
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Cliente"
                value={formData.clienteNome}
                onChange={(e) => handleFieldChange('clienteNome', e.target.value)}
                error={!!errors.clienteNome}
                helperText={errors.clienteNome}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="WhatsApp"
                value={formData.clienteWhatsApp}
                onChange={(e) => handleFieldChange('clienteWhatsApp', e.target.value)}
                error={!!errors.clienteWhatsApp}
                helperText={errors.clienteWhatsApp || 'Ex: (11) 99999-9999'}
                required
                placeholder="(11) 99999-9999"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="E-mail (opcional)"
                type="email"
                value={formData.clienteEmail}
                onChange={(e) => handleFieldChange('clienteEmail', e.target.value)}
                error={!!errors.clienteEmail}
                helperText={errors.clienteEmail}
                placeholder="cliente@email.com"
              />
            </Grid>

            {proposta && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      📋 Dados da Proposta
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Número:
                        </Typography>
                        <Typography variant="body1">
                          {proposta.numero}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Valor Total:
                        </Typography>
                        <Typography variant="body1">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(proposta.valorTotal)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">
                  ✍️ Personalizar Mensagem
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={carregarMensagemPadrao}
                >
                  Carregar Padrão
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={12}
                label="Mensagem para WhatsApp"
                value={formData.mensagemPersonalizada}
                onChange={(e) => handleFieldChange('mensagemPersonalizada', e.target.value)}
                placeholder="Digite sua mensagem personalizada ou clique em 'Carregar Padrão'"
                helperText="Dica: Use *texto* para negrito e _texto_ para itálico"
              />
            </Grid>

            <Grid item xs={12}>
              <Box>
                <input
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  id="pdf-upload"
                  type="file"
                  onChange={handlePdfUpload}
                />
                <label htmlFor="pdf-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<AttachFileIcon />}
                    fullWidth
                  >
                    {pdfFile ? `📎 ${pdfFile.name}` : 'Anexar PDF da Proposta (opcional)'}
                  </Button>
                </label>

                {pdfFile && (
                  <Box mt={1} display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={`${pdfFile.name} (${(pdfFile.size / 1024 / 1024).toFixed(2)} MB)`}
                      onDelete={() => setPdfFile(null)}
                      color="primary"
                    />
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                ✅ Confirmar Envio
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    👤 Destinatário
                  </Typography>
                  <Typography variant="body1">
                    <strong>Nome:</strong> {formData.clienteNome}
                  </Typography>
                  <Typography variant="body1">
                    <strong>WhatsApp:</strong> {formData.clienteWhatsApp}
                  </Typography>
                  {formData.clienteEmail && (
                    <Typography variant="body1">
                      <strong>E-mail:</strong> {formData.clienteEmail}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {proposta && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      📋 Proposta
                    </Typography>
                    <Typography variant="body1">
                      <strong>Número:</strong> {proposta.numero}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(proposta.valorTotal)}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Empresa:</strong> {proposta.empresaNome}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    💬 Mensagem
                  </Typography>
                  <Box
                    sx={{
                      maxHeight: 200,
                      overflow: 'auto',
                      bgcolor: 'grey.50',
                      p: 2,
                      borderRadius: 1,
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {formData.mensagemPersonalizada || gerarMensagemPadrao()}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {pdfFile && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      📎 Anexo
                    </Typography>
                    <Chip
                      label={`${pdfFile.name} (${(pdfFile.size / 1024 / 1024).toFixed(2)} MB)`}
                      icon={<AttachFileIcon />}
                      color="primary"
                    />
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        );

      default:
        return null;
    }
  };

  // Renderizar tela de sucesso
  const renderSuccess = (): React.ReactNode => (
    <Box textAlign="center" py={4}>
      <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        ✅ Proposta Enviada!
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        A proposta foi enviada via Chatwoot para <strong>{formData.clienteNome}</strong>
      </Typography>
      <Typography variant="body2" color="textSecondary">
        WhatsApp: {formData.clienteWhatsApp}
      </Typography>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <ChatIcon color="primary" />
            <Typography variant="h6">
              Enviar via Chatwoot
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            disabled={loading}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success ? (
          renderSuccess()
        ) : (
          <>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {renderStepContent()}
          </>
        )}
      </DialogContent>

      <DialogActions>
        {!success && (
          <>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
            >
              Voltar
            </Button>

            <Box sx={{ flex: 1 }} />

            <Button
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>

            {activeStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                variant="contained"
                disabled={loading}
              >
                Próximo
              </Button>
            ) : (
              <Button
                onClick={enviarProposta}
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
              >
                {loading ? 'Enviando...' : 'Enviar Proposta'}
              </Button>
            )}
          </>
        )}

        {success && (
          <Button
            onClick={handleClose}
            variant="contained"
            color="success"
          >
            Fechar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ModalEnviarChatwoot;
