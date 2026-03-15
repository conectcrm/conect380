import type { Notification } from '../../contexts/NotificationContext';

type NotificationEntity = Pick<Notification, 'entityType' | 'entityId'>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeText = (value: unknown): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const getStringFromRecord = (record: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const raw = record[key];
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.trim();
    }
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return String(raw);
    }
  }
  return null;
};

const buildRouteWithQuery = (path: string, query: Record<string, string | undefined>): string => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value && value.trim().length > 0) {
      params.set(key, value.trim());
    }
  });
  const serialized = params.toString();
  return serialized ? `${path}?${serialized}` : path;
};

const resolveAgendaDestination = (entityId?: string): string => {
  const id = String(entityId || '').trim();
  if (!id) return '/agenda';
  if (id.startsWith('agenda:') || id.startsWith('batch:')) {
    return '/agenda';
  }
  return `/agenda/eventos/${encodeURIComponent(id)}`;
};

export const extractNotificationEntityFromData = (data: unknown): NotificationEntity => {
  if (!isRecord(data)) {
    return {};
  }

  const eventId = getStringFromRecord(data, ['eventId']);
  if (eventId) {
    return { entityType: 'agenda', entityId: eventId };
  }

  const oportunidadeId = getStringFromRecord(data, ['oportunidadeId', 'opportunityId']);
  if (oportunidadeId) {
    return { entityType: 'oportunidade', entityId: oportunidadeId };
  }

  const propostaId = getStringFromRecord(data, ['propostaId', 'proposalId']);
  if (propostaId) {
    return { entityType: 'proposta', entityId: propostaId };
  }

  const cotacaoId = getStringFromRecord(data, ['cotacaoId', 'quotationId']);
  if (cotacaoId) {
    return { entityType: 'cotacao', entityId: cotacaoId };
  }

  const clienteId = getStringFromRecord(data, ['clienteId', 'clientId']);
  if (clienteId) {
    return { entityType: 'cliente', entityId: clienteId };
  }

  const modulo = normalizeText(getStringFromRecord(data, ['modulo', 'module']) || '');
  if (modulo === 'agenda') {
    return { entityType: 'agenda' };
  }

  const category = normalizeText(getStringFromRecord(data, ['category']) || '');
  const event = normalizeText(getStringFromRecord(data, ['event']) || '');
  if (category.includes('comercial') || event.includes('venda_concluida')) {
    return { entityType: 'oportunidade' };
  }

  return {};
};

export const resolveNotificationDestination = (
  notification: Pick<Notification, 'entityType' | 'entityId' | 'title' | 'message' | 'data'>,
): string => {
  switch (notification.entityType) {
    case 'agenda':
      return resolveAgendaDestination(notification.entityId);
    case 'cliente': {
      const id = String(notification.entityId || '').trim();
      return id ? `/clientes/${encodeURIComponent(id)}` : '/clientes';
    }
    case 'proposta':
      return buildRouteWithQuery('/propostas', { proposta: notification.entityId });
    case 'oportunidade':
      return buildRouteWithQuery('/pipeline', { oportunidadeId: notification.entityId });
    case 'cotacao':
      return buildRouteWithQuery('/financeiro/cotacoes', { cotacaoId: notification.entityId });
    case 'tarefa':
      return '/agenda';
    default:
      break;
  }

  if (isRecord(notification.data)) {
    const inferredEntity = extractNotificationEntityFromData(notification.data);
    if (inferredEntity.entityType || inferredEntity.entityId) {
      return resolveNotificationDestination({
        ...notification,
        entityType: inferredEntity.entityType,
        entityId: inferredEntity.entityId,
      });
    }
  }

  const content = normalizeText(`${notification.title || ''} ${notification.message || ''}`);
  if (content.includes('pipeline') || content.includes('oportunidade') || content.includes('venda')) {
    return '/pipeline';
  }
  if (content.includes('proposta')) {
    return '/propostas';
  }
  if (content.includes('cotacao') || content.includes('aprovacao')) {
    return '/financeiro/cotacoes';
  }
  if (content.includes('agenda') || content.includes('evento') || content.includes('presenca')) {
    return '/agenda';
  }
  if (content.includes('cliente')) {
    return '/clientes';
  }

  return '/notifications';
};
