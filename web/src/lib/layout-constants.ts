/**
 * Layout constants — single source of truth for all layout dimensions.
 * Import from here instead of hardcoding pixel values in components.
 */
export const LAYOUT = {
  /** Fixed FIDT header bar (h-14 = 56px) */
  TOPBAR_HEIGHT: 56,
  /** Fixed mobile bottom nav */
  BOTTOMNAV_HEIGHT: 64,
  /** Search/filter toolbar row */
  TOOLBAR_HEIGHT: 48,
  /** Horizontal page padding class */
  PAGE_PADDING_X: 'px-4 sm:px-6',
  /** Max-width + centering for content containers */
  PAGE_MAX_WIDTH: 'max-w-3xl mx-auto',
  /**
   * Map height — fills space between topbar + toolbar and bottomnav.
   * Uses 100dvh (dynamic viewport height) to account for mobile browser chrome.
   * Capped at 500px on desktop via min(). On mobile, 100dvh - 176px < 500px so min() picks the dvh value.
   * Formula: min(100dvh - TOPBAR(56) - TOOLBAR(48) - BOTTOMNAV(64) - gap(8), 500px) = min(100dvh - 176px, 500px)
   */
  MAP_HEIGHT: 'min(calc(100dvh - 176px), 500px)',
} as const;
