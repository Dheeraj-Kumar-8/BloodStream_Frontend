const LoadingScreen = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-200">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />
        <div className="text-lg font-semibold">Preparing your workspace…</div>
      </div>
    </div>
  );
};

export default LoadingScreen;
