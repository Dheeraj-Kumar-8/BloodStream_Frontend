import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';

const ProtectedRoute = () => {
  const { user, status, initialize } = useAuthStore((state) => ({
    user: state.user,
    status: state.status,
    initialize: state.initialize,
  }));

  useEffect(() => {
    if (status === 'idle') {
      void initialize();
    }
  }, [status, initialize]);

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="animate-pulse text-xl font-semibold">Loading your workspace…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
