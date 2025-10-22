import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listNotifications,
  markNotificationRead,
  markAllNotifications,
} from '../../services/notifications';
import clsx from 'clsx';

const NotificationsPage = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'page'],
    queryFn: () => listNotifications({ limit: 30 }),
  });

  const markMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] }).catch(console.error);
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] }).catch(console.error);
    },
  });

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Notification center</h1>
          <p className="text-sm text-slate-400">
            Review real-time alerts, assignments, and updates across the BloodStream network.
          </p>
        </div>
        {data && data.items.length > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            className="rounded-lg border border-primary/40 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
          >
            Mark all as read
          </button>
        )}
      </header>

      <div className="space-y-4">
        {isLoading && (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
            ))}
          </div>
        )}

        {!isLoading && data && data.items.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
            You&apos;re all caught up—no notifications right now.
          </div>
        )}

        {!isLoading &&
          data?.items.map((notification: (typeof data)['items'][number]) => (
            <article
              key={notification._id}
              className={clsx(
                'rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg transition',
                !notification.isRead && 'border-primary/40'
              )}
            >
              <header className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-primary">{notification.category}</p>
                  <h2 className="mt-2 text-lg font-semibold text-white">{notification.title}</h2>
                  <p className="mt-2 text-sm text-slate-300">{notification.message}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  {new Date(notification.createdAt).toLocaleString()}
                </div>
              </header>
              <footer className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <div>
                  {notification.metadata && (
                    <pre className="mt-2 rounded-lg bg-slate-950/60 p-3 text-[11px] text-slate-400">
                      {JSON.stringify(notification.metadata, null, 2)}
                    </pre>
                  )}
                </div>
                {!notification.isRead && (
                  <button
                    onClick={() => markMutation.mutate(notification._id)}
                    className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Mark read
                  </button>
                )}
              </footer>
            </article>
          ))}
      </div>
    </section>
  );
};

export default NotificationsPage;
