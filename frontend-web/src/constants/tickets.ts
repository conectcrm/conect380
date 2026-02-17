export const TICKET_CREATE_DRAFT_STORAGE_PREFIX = 'conectcrm-ticket-create-draft-v1';
export const TICKET_CREATE_DRAFT_QUERY_PARAM = 'draft';

export const buildTicketCreateDraftStorageKey = (draftId: string): string =>
  `${TICKET_CREATE_DRAFT_STORAGE_PREFIX}:${draftId}`;

export const isTicketCreateDraftStorageKey = (storageKey: string): boolean =>
  storageKey.startsWith(`${TICKET_CREATE_DRAFT_STORAGE_PREFIX}:`);

export const parseTicketCreateDraftIdFromStorageKey = (storageKey: string): string | null => {
  const prefix = `${TICKET_CREATE_DRAFT_STORAGE_PREFIX}:`;
  if (!storageKey.startsWith(prefix)) {
    return null;
  }

  const draftId = storageKey.slice(prefix.length).trim();
  return draftId || null;
};

export const generateTicketCreateDraftId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};
