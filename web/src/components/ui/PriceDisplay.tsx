const VND_TO_USD = 25000;

export function PriceDisplay({
  vnd,
  showUsd = false,
  size = "md",
  strikethrough = false,
}: {
  vnd: number | null;
  showUsd?: boolean;
  size?: "sm" | "md" | "lg";
  strikethrough?: boolean;
}) {
  if (!vnd)
    return <span className="text-[var(--text-muted)]">—</span>;

  const billions = vnd / 1_000_000_000;
  const millions = vnd / 1_000_000;
  const formatted =
    billions >= 1
      ? `${billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1)} Tỷ`
      : `${millions.toFixed(0)} Tr`;
  const usd = Math.round(vnd / VND_TO_USD).toLocaleString("en-US");

  const sizes = { sm: "text-base", md: "text-xl", lg: "text-3xl" };

  return (
    <div>
      <span
        className={`font-bold text-white ${sizes[size]} ${
          strikethrough ? "line-through text-[var(--text-muted)]" : ""
        }`}
      >
        {formatted} ₫
      </span>
      {showUsd && (
        <div className="text-[var(--text-secondary)] text-sm">≈ ${usd} USD</div>
      )}
    </div>
  );
}
