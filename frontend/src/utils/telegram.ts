/// <reference types="@types/telegram-web-app" />

/**
 * Get the current Telegram user from the WebApp environment.
 */
export function getTelegramUser(): TelegramWebApp.User | null {
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
export function getThemeParams(): TelegramWebApp.ThemeParams | null {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return null;
  return webApp.themeParams ?? null;
}

/**
 * Register a callback for theme changes.
 * Note: This uses the WebApp's onEvent with 'themeChanged' (unofficial event).
 */
export function onThemeChanged(callback: (themeParams: TelegramWebApp.ThemeParams) => void): void {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;

  // Use type assertion to bypass missing official type
  (webApp as any).onEvent('themeChanged', callback);
}

/**
 * Unregister a callback for theme changes.
 */
export function offThemeChanged(callback: (themeParams: TelegramWebApp.ThemeParams) => void): void {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;

  // Use type assertion to bypass missing official type
  (webApp as any).offEvent('themeChanged', callback);
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