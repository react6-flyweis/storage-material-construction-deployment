const LoadingScreen = () => {
  return (
    <div
      data-tour-loading
      className="min-h-screen flex items-center justify-center bg-background text-foreground"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card/80 px-8 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-md">
        <div
          className="h-14 w-14 animate-spin rounded-full border-4 border-muted border-t-primary"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
