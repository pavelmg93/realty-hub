export default function ListingDetailLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-pulse">
      <div className="h-64 bg-[var(--bg-elevated)] rounded-xl" />
      <div className="h-6 bg-[var(--bg-elevated)] rounded w-3/4" />
      <div className="h-4 bg-[var(--bg-elevated)] rounded w-1/2" />
      <div className="space-y-2">
        <div className="h-4 bg-[var(--bg-elevated)] rounded" />
        <div className="h-4 bg-[var(--bg-elevated)] rounded w-5/6" />
        <div className="h-4 bg-[var(--bg-elevated)] rounded w-4/6" />
      </div>
    </div>
  );
}
