export default function FeedLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-[var(--bg-elevated)] rounded-xl p-4 space-y-3">
          <div className="h-40 bg-[var(--bg-surface)] rounded-lg" />
          <div className="h-5 bg-[var(--bg-surface)] rounded w-3/4" />
          <div className="h-4 bg-[var(--bg-surface)] rounded w-1/2" />
          <div className="flex gap-3">
            <div className="h-4 bg-[var(--bg-surface)] rounded w-16" />
            <div className="h-4 bg-[var(--bg-surface)] rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
