import { WebApp } from '@types/telegram-web-app';
declare global {
  interface Window {
    Telegram: {
      WebApp: WebApp;
    };
  }
}

export function getTelegramUserId(): number | null {
  if (typeof window === 'undefined') return null;
  
  const tg = window.Telegram?.WebApp;
  if (!tg?.initDataUnsafe?.user?.id) return null;
  
  return tg.initDataUnsafe.user.id;
}

export function getTelegramUser(): WebApp.User | null {
  if (typeof window === 'undefined') return null;
  
  const tg = window.Telegram?.WebApp;
  return tg?.initDataUnsafe?.user ?? null;
}

export function getTelegramInitData(): string | null {
  if (typeof window === 'undefined') return null;
  
  const tg = window.Telegram?.WebApp;
  return tg?.initData ?? null;
}

export function isTelegramWebApp(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.Telegram?.WebApp;
}

export function ready(): void {
  if (typeof window === 'undefined') return;
  window.Telegram?.WebApp?.ready();
}

export function expand(): void {
  if (typeof window === 'undefined') return;
  window.Telegram?.WebApp?.expand();
}

export function close(): void {
  if (typeof window === 'undefined') return;
  window.Telegram?.WebApp?.close();
}

export function onThemeChanged(callback: (themeParams: WebApp.ThemeParams) => void): void {
  if (typeof window === 'undefined') return;
  window.Telegram?.WebApp?.onEvent('themeChanged', callback);
}

export function offThemeChanged(callback: (themeParams: WebApp.ThemeParams) => void): void {
  if (typeof window === 'undefined') return;
  window.Telegram?.WebApp?.offEvent('themeChanged', callback);
}
