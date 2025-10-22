import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore, AuthState } from '../store/authStore';
import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listNotifications, markAllNotifications } from '../services/notifications';
import { Notification, UserRole } from '../types';
import { connectSocket, disconnectSocket } from '../utils/socketClient';

interface NavItem {
  label: string;
  to: string;
  roles: UserRole[];
}

const AppLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore((state: AuthState) => ({
    user: state.user,
    logout: state.logout,
  }));
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => listNotifications({ limit: 10 }),
    refetchInterval: 30_000,
    enabled: Boolean(user),
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket();
    socket.emit('join', { userId: user._id, role: user.role });

    const invalidateNotifications = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] }).catch(console.error);
    };

    socket.on('notification:new', invalidateNotifications);
    socket.on('notification:broadcast', invalidateNotifications);

    return () => {
      socket.off('notification:new', invalidateNotifications);
      socket.off('notification:broadcast', invalidateNotifications);
    };
  }, [user, queryClient]);

  const unreadCount = notifications?.items.filter((item: Notification) => !item.isRead).length ?? 0;

  const navItems = useMemo<NavItem[]>(
    () => [
      { label: 'Overview', to: '/dashboard/overview', roles: ['donor', 'recipient', 'delivery', 'admin'] },
      { label: 'Requests', to: '/dashboard/requests', roles: ['donor', 'recipient', 'admin'] },
      { label: 'Deliveries', to: '/dashboard/deliveries', roles: ['delivery', 'admin'] },
      { label: 'Appointments', to: '/dashboard/appointments', roles: ['donor', 'admin'] },
      { label: 'Blood Banks', to: '/dashboard/blood-banks', roles: ['donor', 'recipient', 'admin'] },
      { label: 'Analytics', to: '/dashboard/analytics', roles: ['admin'] },
      { label: 'Notifications', to: '/dashboard/notifications', roles: ['donor', 'recipient', 'delivery', 'admin'] },
      { label: 'Profile', to: '/dashboard/profile', roles: ['donor', 'recipient', 'delivery', 'admin'] },
    ],
    []
  );

  if (!user) return null;

  const filteredNav = navItems.filter((item: NavItem) => item.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-900/80 p-6 md:flex">
        <div className="mb-10 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <span className="text-2xl font-bold">🩸</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold">BloodStream</h1>
            <p className="text-xs text-slate-400">Lifelines at speed</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary/20 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => {
            void logout();
            navigate('/auth/login');
          }}
          className="mt-6 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
        >
          Sign out
        </button>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 px-4 py-3">
          <div className="md:hidden">
            <button
              onClick={() => setDrawerOpen((prev) => !prev)}
              className="rounded-lg border border-slate-800 px-3 py-2 text-sm"
            >
              Menu
            </button>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Welcome back, {user.firstName}</h2>
            <p className="text-sm text-slate-400">{user.role.toUpperCase()} workspace</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen((prev) => !prev)}
              className="relative rounded-full border border-slate-700 px-4 py-2 text-sm"
            >
              Alerts
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px]">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-950/90 p-4">
          <Outlet />
        </main>
      </div>
      {isDrawerOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-slate-800 bg-slate-900/95 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <button
              onClick={() => setDrawerOpen(false)}
              className="text-sm text-slate-400 hover:text-slate-100"
            >
              Close
            </button>
          </div>
          <div className="mt-4 space-y-3 overflow-y-auto">
            {notifications?.items.map((notification: (typeof notifications)['items'][number]) => (
              <article
                key={notification._id}
                className={clsx(
                  'rounded-lg border border-slate-800 bg-slate-800/60 p-4',
                  !notification.isRead && 'border-primary/40'
                )}
              >
                <header className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">{notification.title}</h4>
                  <span className="text-xs text-slate-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </header>
                <p className="mt-2 text-sm text-slate-300">{notification.message}</p>
              </article>
            ))}
            {notifications && notifications.items.length === 0 && (
              <p className="text-sm text-slate-400">No notifications yet.</p>
            )}
          </div>
          {notifications && notifications.items.length > 0 && (
            <button
              onClick={() => {
                void markAllNotifications().then(() =>
                  queryClient.invalidateQueries({ queryKey: ['notifications'] }).catch(console.error)
                );
                setDrawerOpen(false);
              }}
              className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold"
            >
              Mark all as read
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AppLayout;
