export default function MessagesLoading() {
  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-3 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-[var(--bg-elevated)] rounded-xl">
          <div className="w-10 h-10 bg-[var(--bg-surface)] rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[var(--bg-surface)] rounded w-1/3" />
            <div className="h-3 bg-[var(--bg-surface)] rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
