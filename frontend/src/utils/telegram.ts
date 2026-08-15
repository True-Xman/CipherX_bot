/**
 * Type definitions for Telegram WebApp (inline, no external dependencies)
 */
interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface TelegramWebAppThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

interface TelegramWebApp {
  ready(): void;
  expand(): void;
  close(): void;
  initData?: string;
  initDataUnsafe?: {
    user?: TelegramWebAppUser;
  };
  themeParams?: TelegramWebAppThemeParams;
  colorScheme?: 'light' | 'dark';
  showConfirm(message: string, callback: (confirmed: boolean) => void): void;
  showAlert(message: string): void;
  onEvent(event: string, callback: (...args: any[]) => void): void;
  offEvent(event: string, callback: (...args: any[]) => void): void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

/**
 * Get the raw initData string from Telegram WebApp.
 */
export function getTelegramInitData(): string {
  if (typeof window === 'undefined') return '';
  return window.Telegram?.WebApp?.initData || '';
}

/**
 * Get the current Telegram user from the WebApp environment.
 */
export function getTelegramUser(): TelegramWebAppUser | null {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return null;
  return webApp.initDataUnsafe?.user ?? null;
}

/**
 * Get the current Telegram user ID as a string, or null if not available.
 */
export function getTelegramUserId(): string | null {
  const user = getTelegramUser();
  return user?.id?.toString() ?? null;
}

/**
 * Check if the app is running inside Telegram WebApp context.
 */
export function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}

/**
 * Notify Telegram that the Mini App is ready.
 */
export function readyWebApp(): void {
  if (isTelegramWebApp()) {
    window.Telegram?.WebApp?.ready();
  }
}

/**
 * Expand the Mini App to full screen.
 */
export function expandWebApp(): void {
  if (isTelegramWebApp()) {
    window.Telegram?.WebApp?.expand();
  }
}

/**
 * Close the Mini App.
 */
export function closeWebApp(): void {
  if (isTelegramWebApp()) {
    window.Telegram?.WebApp?.close();
  }
}

/**
 * Get the current theme parameters from Telegram.
 */
export function getThemeParams(): TelegramWebAppThemeParams | null {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return null;
  return webApp.themeParams ?? null;
}

/**
 * Register a callback for theme changes.
 */
export function onThemeChanged(callback: (themeParams: TelegramWebAppThemeParams) => void): void {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;
  webApp.onEvent('themeChanged', callback);
}

/**
 * Unregister a callback for theme changes.
 */
export function offThemeChanged(callback: (themeParams: TelegramWebAppThemeParams) => void): void {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;
  webApp.offEvent('themeChanged', callback);
}

/**
 * Get the current color scheme (light/dark).
 */
export function getColorScheme(): 'light' | 'dark' | null {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return null;
  return webApp.colorScheme ?? null;
}

/**
 * Show a popup confirmation dialog.
 */
export function showConfirm(
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
): void {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;

  webApp.showConfirm(message, (confirmed) => {
    if (confirmed) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
  });
}

/**
 * Show an alert popup.
 */
export function showAlert(message: string): void {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;
  webApp.showAlert(message);
}
