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
   * Map height — fills exactly the space between topbar + toolbar and bottomnav.
   * Formula: 100vh - TOPBAR(56) - TOOLBAR(48) - BOTTOMNAV(64) - padding(16) = 100vh - 184px
   */
  MAP_HEIGHT: 'calc(100vh - 56px - 48px - 64px - 16px)',
} as const;
