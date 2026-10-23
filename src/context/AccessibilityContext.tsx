import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

/* ── Types ────────────────────────────────────────────────── */

export type TextSize = 'normal' | 'large' | 'xlarge';
export type ColorMode = 'standard' | 'colorblind-assist';
export type AppTheme = 'light' | 'dark' | 'high-contrast';

export interface AccessibilitySettings {
  textSize: TextSize;
  colorMode: ColorMode;
  theme: AppTheme;
  reduceMotion: boolean;
  // Backwards compatibility properties
  highContrast: boolean;
  colorblindFriendly: boolean;
}

interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  setTextSize: (v: TextSize) => void;
  setColorMode: (v: ColorMode) => void;
  setTheme: (v: AppTheme) => void;
  setReduceMotion: (v: boolean) => void;
  // Backwards compatibility helpers
  setHighContrast: (v: boolean) => void;
  setColorblindFriendly: (v: boolean) => void;
  largeFontMode: boolean;
  toggleLargeFontMode: () => void;
}

/* ── Storage key + defaults ───────────────────────────────── */

const STORAGE_KEY = 'vd-a11y-settings';

const DEFAULTS: AccessibilitySettings = {
  textSize: 'normal',
  colorMode: 'standard',
  theme: 'light',
  reduceMotion: false,
  highContrast: false,
  colorblindFriendly: false,
};

function loadFromStorage(): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);

    // Normalize legacy keys
    let theme: AppTheme = parsed.theme || (parsed.highContrast ? 'high-contrast' : 'light');
    let colorMode: ColorMode = parsed.colorMode || (parsed.colorblindFriendly ? 'colorblind-assist' : 'standard');

    return {
      ...DEFAULTS,
      ...parsed,
      theme,
      colorMode,
      highContrast: theme === 'high-contrast',
      colorblindFriendly: colorMode === 'colorblind-assist',
    };
  } catch {
    return DEFAULTS;
  }
}

/* ── Sync settings → <html> classes ──────────────────────── */

const TEXT_SIZE_CLASSES: Record<TextSize, string> = {
  normal: 'text-normal',
  large:  'text-large',
  xlarge: 'text-xlarge',
};

function applyToHtml(settings: AccessibilitySettings) {
  const cl = document.documentElement.classList;

  // 1. Text size
  Object.values(TEXT_SIZE_CLASSES).forEach((c) => cl.remove(c));
  cl.add(TEXT_SIZE_CLASSES[settings.textSize]);

  // 2. Theme: Light, Dark, High-contrast
  cl.remove('theme-light', 'theme-dark', 'theme-high-contrast', 'dark', 'high-contrast');
  cl.add(`theme-${settings.theme}`);
  if (settings.theme === 'dark') cl.add('dark');
  if (settings.theme === 'high-contrast') cl.add('high-contrast');

  // 3. Colour mode: Standard vs Colorblind Assist
  cl.remove('color-standard', 'color-colorblind-assist', 'colorblind-assist', 'colorblind-friendly');
  if (settings.colorMode === 'colorblind-assist') {
    cl.add('colorblind-assist');
    cl.add('colorblind-friendly');
  } else {
    cl.add('color-standard');
  }

  // 4. Reduce motion
  cl.toggle('reduce-motion', settings.reduceMotion);
}

/* ── Context ──────────────────────────────────────────────── */

export const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);
export const AccessibilitySettingsContext = AccessibilityContext;

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(loadFromStorage);

  // Apply to <html> on every change and sync storage
  useEffect(() => {
    applyToHtml(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const patch = useCallback((partial: Partial<AccessibilitySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      // Sync compatibility flags
      if (partial.theme) {
        next.highContrast = partial.theme === 'high-contrast';
      }
      if (partial.colorMode) {
        next.colorblindFriendly = partial.colorMode === 'colorblind-assist';
      }
      return next;
    });
  }, []);

  const value: AccessibilityContextValue = {
    settings,
    setTextSize: (v) => patch({ textSize: v }),
    setColorMode: (v) => patch({ colorMode: v }),
    setTheme: (v) => patch({ theme: v }),
    setReduceMotion: (v) => patch({ reduceMotion: v }),
    // Compatibility helpers
    setHighContrast: (v) => patch({ theme: v ? 'high-contrast' : 'light' }),
    setColorblindFriendly: (v) => patch({ colorMode: v ? 'colorblind-assist' : 'standard' }),
    largeFontMode: settings.textSize !== 'normal',
    toggleLargeFontMode: () =>
      patch({ textSize: settings.textSize === 'normal' ? 'large' : 'normal' }),
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be inside AccessibilityProvider');
  return ctx;
}
