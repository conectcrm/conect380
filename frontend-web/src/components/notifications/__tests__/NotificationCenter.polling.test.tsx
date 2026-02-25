import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotificationCenter from '../NotificationCenter';
import { NotificationProvider, useNotifications } from '../../../contexts/NotificationContext';
import notificationService from '../../../services/notificationService';

jest.mock('../../../services/api', () => ({
  __esModule: true,
  api: {
    delete: jest.fn(),
  },
}));

jest.mock('../../../services/notificationService', () => ({
  __esModule: true,
  default: {
    listar: jest.fn(),
    contarNaoLidas: jest.fn(),
    marcarComoLida: jest.fn(),
    marcarTodasComoLidas: jest.fn(),
    criar: jest.fn(),
  },
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockedNotificationService = notificationService as jest.Mocked<typeof notificationService>;

const NotificationsProbe = () => {
  const { notifications, markAsRead } = useNotifications();
  return (
    <div>
      <span data-testid="notifications-count">{notifications.length}</span>
      <span data-testid="first-notification-read">
        {notifications[0]?.read ? 'read' : 'unread'}
      </span>
      <span data-testid="first-notification-message">{notifications[0]?.message ?? ''}</span>
      <button
        data-testid="mark-first-as-read"
        onClick={() => {
          if (notifications[0]) {
            void markAsRead(notifications[0].id);
          }
        }}
      >
        mark
      </button>
    </div>
  );
};

const renderWithProviders = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NotificationProvider>
        <NotificationCenter />
        <NotificationsProbe />
      </NotificationProvider>
    </MemoryRouter>,
  );

describe('NotificationCenter polling sync', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('keeps a single notification entry for repeated API payloads with the same id', async () => {
    mockedNotificationService.listar
      .mockResolvedValueOnce([
        {
          id: 'notif-1',
          type: 'COTACAO_PENDENTE',
          title: 'Cotacao pendente',
          message: 'Primeira versao',
          read: false,
          createdAt: '2026-02-20T15:00:00.000Z',
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: 'notif-1',
          type: 'COTACAO_PENDENTE',
          title: 'Cotacao pendente',
          message: 'Atualizada no polling',
          read: true,
          createdAt: '2026-02-20T15:00:00.000Z',
        },
      ] as any);

    mockedNotificationService.contarNaoLidas
      .mockResolvedValueOnce(1 as any)
      .mockResolvedValueOnce(0 as any);

    renderWithProviders();

    await waitFor(() => expect(mockedNotificationService.listar).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId('notifications-count')).toHaveTextContent('1'));
    expect(screen.getByTestId('first-notification-read')).toHaveTextContent('unread');
    expect(screen.getByTestId('first-notification-message')).toHaveTextContent('Primeira versao');

    await act(async () => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => expect(mockedNotificationService.listar).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
    expect(screen.getByTestId('first-notification-read')).toHaveTextContent('read');
    expect(screen.getByTestId('first-notification-message')).toHaveTextContent('Atualizada no polling');
  });

  it('preserves a single entry after manual read and next polling sync', async () => {
    mockedNotificationService.listar
      .mockResolvedValueOnce([
        {
          id: 'notif-1',
          type: 'COTACAO_PENDENTE',
          title: 'Cotacao pendente',
          message: 'Nao lida',
          read: false,
          createdAt: '2026-02-20T15:00:00.000Z',
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: 'notif-1',
          type: 'COTACAO_PENDENTE',
          title: 'Cotacao pendente',
          message: 'Ja lida no backend',
          read: true,
          createdAt: '2026-02-20T15:00:00.000Z',
        },
      ] as any);

    mockedNotificationService.contarNaoLidas
      .mockResolvedValueOnce(1 as any)
      .mockResolvedValueOnce(0 as any);
    mockedNotificationService.marcarComoLida.mockResolvedValue(undefined);

    renderWithProviders();

    await waitFor(() => expect(screen.getByTestId('notifications-count')).toHaveTextContent('1'));
    expect(screen.getByTestId('first-notification-read')).toHaveTextContent('unread');

    fireEvent.click(screen.getByTestId('mark-first-as-read'));

    await waitFor(() => expect(mockedNotificationService.marcarComoLida).toHaveBeenCalledWith('notif-1'));
    await waitFor(() => expect(screen.getByTestId('first-notification-read')).toHaveTextContent('read'));

    await act(async () => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => expect(mockedNotificationService.listar).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
    expect(screen.getByTestId('first-notification-read')).toHaveTextContent('read');
    expect(screen.getByTestId('first-notification-message')).toHaveTextContent('Ja lida no backend');
  });
});
