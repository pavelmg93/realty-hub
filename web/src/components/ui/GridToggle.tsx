"use client";

import { Grid3X3, Square } from "lucide-react";

type GridCols = 1 | 2;

export function GridToggle({
  value,
  onChange,
}: {
  value: GridCols;
  onChange: (v: GridCols) => void;
}) {
  return (
    <div
      className="flex items-center rounded-md p-0.5 gap-0.5"
      style={{ backgroundColor: "var(--bg-elevated)" }}
    >
      {([1, 2] as GridCols[]).map((n) => {
        const Icon = n === 1 ? Square : Grid3X3;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`p-1.5 rounded transition-colors ${
              value === n
                ? "text-white"
                : "text-[var(--text-muted)] hover:text-white"
            }`}
            style={
              value === n
                ? { backgroundColor: "var(--orange)" }
                : undefined
            }
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
