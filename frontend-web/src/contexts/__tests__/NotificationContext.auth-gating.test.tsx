import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NotificationProvider, useNotifications } from '../NotificationContext';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

jest.mock('../../services/api', () => ({
  __esModule: true,
  api: {
    delete: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  }),
}));

jest.mock('../../hooks/useAuth', () => ({
  __esModule: true,
  useAuth: jest.fn(),
}));

type AuthSnapshot = {
  isAuthenticated: boolean;
  user: { id: string } | null;
};

let authSnapshot: AuthSnapshot = {
  isAuthenticated: true,
  user: { id: 'user-default' },
};

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedApi = api as unknown as {
  delete: jest.Mock;
  put: jest.Mock;
};
const mockedToast = toast as unknown as jest.Mock & {
  success: jest.Mock;
  error: jest.Mock;
  loading: jest.Mock;
  dismiss: jest.Mock;
};

const makeAuthReturn = () =>
  ({
    user: authSnapshot.user as any,
    isAuthenticated: authSnapshot.isAuthenticated,
    isLoading: false,
    login: jest.fn(),
    verifyMfa: jest.fn(),
    resendMfa: jest.fn(),
    logout: jest.fn(),
    updateUser: jest.fn(),
  }) as any;

const Probe = () => {
  const {
    notifications,
    reminders,
    addNotification,
    addReminder,
    removeNotification,
    markAsRead,
  } = useNotifications();

  const localNotificationId =
    'agenda:runtime-reminder:agenda:reminder:c211afad-0436-4dd0-babc-c4c09c3a7dc2:1774445400000';
  const persistedNotificationId = '11111111-1111-4111-8111-111111111111';

  return (
    <div>
      <span data-testid="notifications-count">{notifications.length}</span>
      <span data-testid="reminders-count">{reminders.length}</span>
      <button
        data-testid="add-info"
        onClick={() =>
          addNotification({
            title: 'Teste',
            message: 'Mensagem de teste',
            type: 'info',
            priority: 'low',
          })
        }
      >
        add-info
      </button>
      <button
        data-testid="add-reminder"
        onClick={() =>
          addReminder({
            id: 'rem-1',
            title: 'Lembrete agenda',
            message: 'Evento em 10 minutos',
            entityType: 'agenda',
            scheduledFor: new Date(Date.now() + 10 * 60 * 1000),
            active: true,
          })
        }
      >
        add-reminder
      </button>
      <button
        data-testid="add-local-notification"
        onClick={() =>
          addNotification({
            id: localNotificationId,
            title: 'Lembrete local',
            message: 'Runtime reminder',
            type: 'reminder',
            priority: 'high',
          })
        }
      >
        add-local-notification
      </button>
      <button
        data-testid="remove-local-notification"
        onClick={() => {
          void removeNotification(localNotificationId);
        }}
      >
        remove-local-notification
      </button>
      <button
        data-testid="mark-local-read"
        onClick={() => {
          void markAsRead(localNotificationId);
        }}
      >
        mark-local-read
      </button>
      <button
        data-testid="add-persisted-notification"
        onClick={() =>
          addNotification({
            id: persistedNotificationId,
            title: 'Persistida',
            message: 'Notificação do backend',
            type: 'info',
            priority: 'low',
          })
        }
      >
        add-persisted-notification
      </button>
      <button
        data-testid="remove-persisted-notification"
        onClick={() => {
          void removeNotification(persistedNotificationId);
        }}
      >
        remove-persisted-notification
      </button>
    </div>
  );
};

const renderProvider = () =>
  render(
    <NotificationProvider>
      <Probe />
    </NotificationProvider>,
  );

describe('NotificationContext auth gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    authSnapshot = {
      isAuthenticated: true,
      user: { id: 'user-a' },
    };
    mockedUseAuth.mockImplementation(() => makeAuthReturn());
  });

  it('does not enqueue notifications when user is unauthenticated', async () => {
    authSnapshot = {
      isAuthenticated: false,
      user: null,
    };

    renderProvider();

    fireEvent.click(screen.getByTestId('add-info'));

    expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
    expect(mockedToast).not.toHaveBeenCalled();
  });

  it('clears in-memory notifications on logout transition', async () => {
    const view = renderProvider();

    fireEvent.click(screen.getByTestId('add-info'));
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');

    authSnapshot = {
      isAuthenticated: false,
      user: null,
    };
    view.rerender(
      <NotificationProvider>
        <Probe />
      </NotificationProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('0'),
    );
    expect(mockedToast.dismiss).toHaveBeenCalled();
  });

  it('persists reminders in user-scoped storage key', async () => {
    authSnapshot = {
      isAuthenticated: true,
      user: { id: 'user-scope-1' },
    };

    renderProvider();
    fireEvent.click(screen.getByTestId('add-reminder'));

    await waitFor(() => {
      const stored = localStorage.getItem('conect-reminders:v2::empresa:none::user:user-scope-1');
      expect(stored).toContain('Lembrete agenda');
    });
    expect(localStorage.getItem('conect-reminders')).toBeNull();
  });

  it('migrates legacy reminders key to user-scoped key after login', async () => {
    localStorage.setItem(
      'conect-reminders:user-migrate-1',
      JSON.stringify([
        {
          id: 'legacy-rem-1',
          title: 'Legacy',
          message: 'Evento em 10 minutos',
          entityType: 'agenda',
          scheduledFor: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          active: true,
        },
      ]),
    );

    authSnapshot = {
      isAuthenticated: true,
      user: { id: 'user-migrate-1' },
    };

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId('reminders-count')).toHaveTextContent('1'),
    );
    expect(localStorage.getItem('conect-reminders:v2::empresa:none::user:user-migrate-1')).toContain(
      'legacy-rem-1',
    );
    expect(localStorage.getItem('conect-reminders')).toBeNull();
    expect(localStorage.getItem('conect-reminders:user-migrate-1')).toBeNull();
  });

  it('does not hydrate reminders from global legacy key when authenticated', async () => {
    localStorage.setItem(
      'conect-reminders',
      JSON.stringify([
        {
          id: 'legacy-global-rem-1',
          title: 'Legacy global',
          message: 'Nao deveria vazar entre tenants',
          entityType: 'agenda',
          scheduledFor: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          active: true,
        },
      ]),
    );

    authSnapshot = {
      isAuthenticated: true,
      user: { id: 'user-scope-safe' },
    };

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId('reminders-count')).toHaveTextContent('0'),
    );
    expect(
      localStorage.getItem('conect-reminders:v2::empresa:none::user:user-scope-safe'),
    ).toBe('[]');
    expect(localStorage.getItem('conect-reminders')).toContain('legacy-global-rem-1');
  });

  it('triggers agenda reminder only when due and auto closes toast', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-25T10:00:00.000Z'));

    try {
      renderProvider();
      fireEvent.click(screen.getByTestId('add-reminder'));

      expect(mockedToast).not.toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(9 * 60 * 1000);
      });

      expect(mockedToast).not.toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(60 * 1000);
      });

      expect(mockedToast).toHaveBeenCalledTimes(1);
      const [, options] = mockedToast.mock.calls[0];
      expect(options).toEqual(
        expect.objectContaining({
          duration: 8000,
          id: expect.stringContaining('agenda:runtime-reminder:rem-1:'),
        }),
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not call backend delete/read for local runtime notification ids', async () => {
    mockedApi.delete.mockResolvedValue(undefined);
    mockedApi.put.mockResolvedValue(undefined);

    renderProvider();

    fireEvent.click(screen.getByTestId('add-local-notification'));
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');

    fireEvent.click(screen.getByTestId('mark-local-read'));
    fireEvent.click(screen.getByTestId('remove-local-notification'));

    await waitFor(() =>
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('0'),
    );
    expect(mockedApi.put).not.toHaveBeenCalled();
    expect(mockedApi.delete).not.toHaveBeenCalled();
  });

  it('calls backend delete for persisted uuid notification ids', async () => {
    mockedApi.delete.mockResolvedValue(undefined);

    renderProvider();

    fireEvent.click(screen.getByTestId('add-persisted-notification'));
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');

    fireEvent.click(screen.getByTestId('remove-persisted-notification'));

    await waitFor(() =>
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('0'),
    );
    expect(mockedApi.delete).toHaveBeenCalledWith(
      '/notifications/11111111-1111-4111-8111-111111111111',
    );
  });
});
