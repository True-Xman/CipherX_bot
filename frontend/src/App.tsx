import { useEffect, useState } from 'react';
import XmanAppWrapper from './components/XmanAppWrapper';
import { getTelegramUserId } from './utils/telegram';
import WebApp from '@twa-dev/sdk';

export default function App() {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userId = getTelegramUserId() || "test_user_123";
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    if (WebApp && typeof WebApp.ready === 'function') {
      WebApp.ready();
      WebApp.expand();
    }
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        if (userId === "test_user_123") {
          setIsVerified(true);
          return;
        }

        const response = await fetch(`${API_URL}/api/user/status?userId=${userId}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true', // <-- اضافه شد
          },
        });
        const data = await response.json();
        setIsVerified(data.isVerified);
      } catch (err) {
        setError("Connection error. Please try again.");
      }
    };
    checkStatus();
  }, [userId, API_URL]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0A0A0C] text-red-500 font-mono p-4 text-center">
        {error}
      </div>
    );
  }

  if (isVerified === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0A0A0C] text-[#00FF88] font-mono animate-pulse">
        [ SYSTEM BOOTING... ]
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0A0A0C] text-white font-mono p-6 text-center border-4 border-red-500/30">
        <h1 className="text-2xl text-red-500 mb-4 shadow-red-500/50 drop-shadow-md">ACCESS DENIED</h1>
        <p className="text-gray-300">
          🔐 Please solve the captcha in the Telegram chat first, then reopen the Mini App.
        </p>
      </div>
    );
  }

  return <XmanAppWrapper userId={userId} apiUrl={API_URL} />;
}