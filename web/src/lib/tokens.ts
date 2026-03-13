/**
 * Design tokens — single source of truth (aligned with ROADMAP-v2 / Stitch mockups).
 * Use CSS variables in components via var(--name); this file documents and types values.
 */

export const tokens = {
  orange: "#E87722",
  navy: "#1A2332",
  surface1: "#1E2A3B",
  surface2: "#243044",
  surface3: "#2C3A50",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  statusOpen: "#16A34A",
  statusNegotiating: "#E87722",
  statusPending: "#CA8A04",
  statusSold: "#DC2626",
  statusNfs: "#64748B",
  error: "#EF4444",
  info: "#3B82F6",
} as const;

export type TokenKey = keyof typeof tokens;
