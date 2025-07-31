import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Chat as ChatIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Label as LabelIcon
} from '@mui/icons-material';

interface ChatwootStats {
  conversations: {
    open: number;
    resolved: number;
    pending: number;
    total: number;
  };
  service: string;
  timestamp: string;
}

interface ChatwootConversation {
  id: number;
  contact: {
    name: string;
    phone_number?: string;
    email?: string;
  };
  status: 'open' | 'resolved' | 'pending';
  created_at: string;
  updated_at: string;
  labels?: string[];
  assignee?: {
    id: number;
    name: string;
  };
  messages_count: number;
  custom_attributes?: Record<string, any>;
}

interface ChatwootMessage {
  id: number;
  content: string;
  message_type: 'incoming' | 'outgoing';
  created_at: string;
  sender?: {
    name: string;
    type: string;
  };
  attachments?: any[];
}

const ChatwootManager: React.FC = () => {
  // Estados principais
  const [connected, setConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<ChatwootStats | null>(null);

  // Estados das conversas
  const [conversations, setConversations] = useState<ChatwootConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatwootConversation | null>(null);
  const [messages, setMessages] = useState<ChatwootMessage[]>([]);
  const [expandedConversations, setExpandedConversations] = useState<Set<number>>(new Set());

  // Estados dos modais
  const [messageDialog, setMessageDialog] = useState<boolean>(false);
  const [newMessage, setNewMessage] = useState<string>('');
  const [assignDialog, setAssignDialog] = useState<boolean>(false);
  const [agentId, setAgentId] = useState<string>('');

  // Estados de filtros
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Verificar status inicial
  useEffect(() => {
    checkConnection();
    loadStats();
    loadConversations();
  }, []);

  // Verificar conexão com Chatwoot
  const checkConnection = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch('/api/chatwoot/status');
      const data = await response.json();

      setConnected(data.success && data.status === 'connected');

      if (!data.success) {
        setError(data.message || 'Erro na conexão com Chatwoot');
      } else {
        setError('');
      }
    } catch (err) {
      console.error('❌ Erro ao verificar conexão:', err);
      setConnected(false);
      setError('Erro de comunicação com o servidor');
    } finally {
      setLoading(false);
    }
  };

  // Carregar estatísticas
  const loadStats = async (): Promise<void> => {
    try {
      const response = await fetch('/api/chatwoot/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar estatísticas:', err);
    }
  };

  // Carregar conversas
  const loadConversations = async (): Promise<void> => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/chatwoot/conversations?${params}`);
      const data = await response.json();

      if (data.success) {
        setConversations(data.data);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar conversas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar mensagens de uma conversa
  const loadMessages = async (conversationId: number): Promise<void> => {
    try {
      const response = await fetch(`/api/chatwoot/conversations/${conversationId}/messages`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.data);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar mensagens:', err);
    }
  };

  // Expandir/contrair conversa
  const toggleConversation = async (conversation: ChatwootConversation): Promise<void> => {
    const newExpanded = new Set(expandedConversations);

    if (expandedConversations.has(conversation.id)) {
      newExpanded.delete(conversation.id);
      setExpandedConversations(newExpanded);
    } else {
      newExpanded.add(conversation.id);
      setExpandedConversations(newExpanded);
      await loadMessages(conversation.id);
    }
  };

  // Enviar mensagem
  const sendMessage = async (): Promise<void> => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/chatwoot/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          message_type: 'outgoing'
        })
      });

      const data = await response.json();

      if (data.success) {
        setNewMessage('');
        setMessageDialog(false);
        await loadMessages(selectedConversation.id);
        await loadConversations(); // Atualizar lista
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('❌ Erro ao enviar mensagem:', err);
      setError('Erro ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  // Resolver conversa
  const resolveConversation = async (conversationId: number): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chatwoot/conversations/${conversationId}/resolve`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        await loadConversations();
        await loadStats();
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('❌ Erro ao resolver conversa:', err);
      setError('Erro ao resolver conversa');
    } finally {
      setLoading(false);
    }
  };

  // Atribuir conversa
  const assignConversation = async (): Promise<void> => {
    if (!selectedConversation || !agentId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/chatwoot/conversations/${selectedConversation.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: parseInt(agentId) })
      });

      const data = await response.json();

      if (data.success) {
        setAgentId('');
        setAssignDialog(false);
        await loadConversations();
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('❌ Erro ao atribuir conversa:', err);
      setError('Erro ao atribuir conversa');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar conversas
  const filteredConversations = conversations.filter(conv =>
    statusFilter === 'all' || conv.status === statusFilter
  );

  // Formatar data
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Obter cor do status
  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'resolved': return 'success';
      case 'pending': return 'warning';
      case 'open': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🎯 Chatwoot Manager
      </Typography>

      {/* Status Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={2}>
                <ChatIcon color={connected ? 'success' : 'error'} />
                <Box>
                  <Typography variant="h6">
                    Status da Conexão
                  </Typography>
                  <Chip
                    label={connected ? 'Conectado' : 'Desconectado'}
                    color={connected ? 'success' : 'error'}
                    icon={connected ? <CheckCircleIcon /> : <ErrorIcon />}
                  />
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  onClick={checkConnection}
                  disabled={loading}
                  startIcon={<RefreshIcon />}
                >
                  Verificar Conexão
                </Button>
                <Button
                  variant="contained"
                  onClick={loadConversations}
                  disabled={loading}
                  startIcon={<RefreshIcon />}
                >
                  Atualizar
                </Button>
              </Box>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {stats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Estatísticas
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="error">
                    {stats.conversations.open}
                  </Typography>
                  <Typography variant="body2">
                    Abertas
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main">
                    {stats.conversations.pending}
                  </Typography>
                  <Typography variant="body2">
                    Pendentes
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {stats.conversations.resolved}
                  </Typography>
                  <Typography variant="body2">
                    Resolvidas
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {stats.conversations.total}
                  </Typography>
                  <Typography variant="body2">
                    Total
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filtrar por Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Filtrar por Status"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="open">Abertas</MenuItem>
                  <MenuItem value="pending">Pendentes</MenuItem>
                  <MenuItem value="resolved">Resolvidas</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Lista de Conversas */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            💬 Conversas ({filteredConversations.length})
          </Typography>

          {filteredConversations.length === 0 ? (
            <Alert severity="info">
              Nenhuma conversa encontrada
            </Alert>
          ) : (
            <List>
              {filteredConversations.map((conversation, index) => (
                <React.Fragment key={conversation.id}>
                  <ListItem
                    button
                    onClick={() => toggleConversation(conversation)}
                  >
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1">
                            {conversation.contact.name}
                          </Typography>
                          <Chip
                            label={conversation.status}
                            color={getStatusColor(conversation.status)}
                            size="small"
                          />
                          {conversation.labels?.map((label) => (
                            <Chip
                              key={label}
                              label={label}
                              size="small"
                              variant="outlined"
                              icon={<LabelIcon />}
                            />
                          ))}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            📱 {conversation.contact.phone_number || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            📧 {conversation.contact.email || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            🕒 {formatDate(conversation.updated_at)}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConversation(conversation);
                          setMessageDialog(true);
                        }}
                        startIcon={<SendIcon />}
                      >
                        Enviar
                      </Button>
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConversation(conversation);
                          setAssignDialog(true);
                        }}
                        startIcon={<AssignmentIcon />}
                      >
                        Atribuir
                      </Button>
                      {conversation.status !== 'resolved' && (
                        <Button
                          size="small"
                          color="success"
                          onClick={(e) => {
                            e.stopPropagation();
                            resolveConversation(conversation.id);
                          }}
                          startIcon={<CheckCircleIcon />}
                        >
                          Resolver
                        </Button>
                      )}
                    </Box>
                    <IconButton>
                      {expandedConversations.has(conversation.id) ?
                        <ExpandLessIcon /> : <ExpandMoreIcon />
                      }
                    </IconButton>
                  </ListItem>

                  {/* Mensagens da conversa */}
                  <Collapse in={expandedConversations.has(conversation.id)}>
                    <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
                      {messages.length === 0 ? (
                        <Typography variant="body2" color="textSecondary">
                          Carregando mensagens...
                        </Typography>
                      ) : (
                        <List dense>
                          {messages.map((message) => (
                            <ListItem key={message.id}>
                              <Box
                                sx={{
                                  bgcolor: message.message_type === 'outgoing' ? 'primary.light' : 'grey.100',
                                  p: 1,
                                  borderRadius: 1,
                                  width: '100%',
                                  color: message.message_type === 'outgoing' ? 'white' : 'text.primary'
                                }}
                              >
                                <Typography variant="body2">
                                  {message.content}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  {formatDate(message.created_at)} - {message.sender?.name || 'Sistema'}
                                </Typography>
                              </Box>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Box>
                  </Collapse>

                  {index < filteredConversations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Dialog para enviar mensagem */}
      <Dialog open={messageDialog} onClose={() => setMessageDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Enviar Mensagem para {selectedConversation?.contact.name}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Mensagem"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || loading}
            variant="contained"
          >
            Enviar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para atribuir conversa */}
      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Atribuir Conversa
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="ID do Agente"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            margin="normal"
            type="number"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={assignConversation}
            disabled={!agentId || loading}
            variant="contained"
          >
            Atribuir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatwootManager;
