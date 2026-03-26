"use client";

import { Square, Grid3X3, MapPin } from "lucide-react";

export type ViewMode = "1col" | "2col" | "map";

export function ViewModeToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  const options: { mode: ViewMode; Icon: typeof Square }[] = [
    { mode: "1col", Icon: Square },
    { mode: "2col", Icon: Grid3X3 },
    { mode: "map", Icon: MapPin },
  ];

  return (
    <div
      className="flex items-center rounded-md p-0.5 gap-0.5"
      style={{ backgroundColor: "var(--bg-elevated)" }}
    >
      {options.map(({ mode, Icon }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={`p-1.5 rounded transition-colors ${
            value === mode
              ? "text-white"
              : "text-[var(--text-muted)] hover:text-white"
          }`}
          style={
            value === mode
              ? { backgroundColor: "var(--orange)" }
              : undefined
          }
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}
