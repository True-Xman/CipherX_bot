import { useState, useRef, useEffect } from 'react';
import { Send, Terminal, ShieldCheck } from 'lucide-react';
import { getTelegramUserId } from '../utils/telegram';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ActionButton {
  label: string;
  value: string;
}

interface XmanTerminalChatProps {
  _userId: string; // تغییر نام به _userId برای جلوگیری از خطای unused
  initialMessages?: Message[];
  onStageChange?: (stage: number) => void;
}

export default function XmanTerminalChat({
  _userId,
  initialMessages = [],
  onStageChange,
}: XmanTerminalChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [actionButtons, setActionButtons] = useState<ActionButton[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const resolvedUserId = getTelegramUserId() ?? _userId;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/xman/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: resolvedUserId,
          message: text.trim(),
          history,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setCurrentStage(data.stage);
        onStageChange?.(data.stage);

        const buttons = extractActionButtons(data.reply);
        setActionButtons(buttons);
      } else {
        console.error('Xman API error:', data.error);
      }
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const extractActionButtons = (reply: string): ActionButton[] => {
    const buttons: ActionButton[] = [];
    const matches = reply.match(/\[ ([^\]]+) \]/g);
    if (matches) {
      matches.forEach((match) => {
        const clean = match.replace(/\[|\]/g, '').trim();
        const parts = clean.split(':');
        if (parts.length === 2) {
          buttons.push({ label: parts[0].trim(), value: parts[1].trim() });
        } else {
          buttons.push({ label: clean, value: clean });
        }
      });
    }
    return buttons;
  };

  const handleActionClick = (value: string) => {
    sendMessage(value);
    setActionButtons([]);
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0C] text-gray-200 font-mono">
      <header className="flex items-center justify-between border-b border-primary/30 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
          </span>
          <span className="text-xs font-bold tracking-[0.25em] text-primary">XMAN // SOVEREIGNTY PROTOCOL</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary/70" />
          <span className="text-[10px] font-semibold tracking-[0.2em] text-primary/70">
            STAGE {currentStage} / 5
          </span>
        </div>
      </header>

      <div className="flex gap-1 px-5 pt-3" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                s <= currentStage ? 'bg-primary shadow-[0_0_8px_var(--neon)]' : 'bg-transparent'
              }`}
              style={{ width: s <= currentStage ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary/20 border border-primary/30 text-primary'
                  : 'bg-[#12131A] border border-gray-800 text-gray-300'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>
            <span className="text-[9px] text-gray-500 mt-1 px-1">
              {msg.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-2 text-gray-400">
            <Terminal className="h-4 w-4 animate-pulse" />
            <span className="text-sm">Xman is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {actionButtons.length > 0 && (
        <div className="flex flex-wrap gap-2 px-5 py-3 border-t border-border/50">
          {actionButtons.map((btn, idx) => (
            <button
              key={idx}
              onClick={() => handleActionClick(btn.value)}
              className="px-4 py-2 text-xs font-mono tracking-[0.15em] border border-primary/50 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all hover:shadow-[0_0_12px_rgba(0,255,102,0.3)]"
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      <footer className="border-t border-border/50 px-5 py-4">
        <div className="flex items-center gap-2 bg-[#12131A] rounded-xl border border-gray-800 focus-within:border-primary/50 transition-colors">
          <span className="pl-4 text-gray-500 font-mono text-sm tracking-wider">{'>'}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Type command or response..."
            className="flex-1 bg-transparent py-3 pr-2 text-sm text-gray-200 placeholder-gray-600 outline-none font-mono"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className={`px-4 py-3 rounded-r-xl transition-colors ${
              isLoading || !input.trim()
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-primary hover:text-primary/80'
            }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-center text-[9px] tracking-[0.2em] text-gray-500">
          SECURE CHANNEL // SIMULATION MODE
        </p>
      </footer>
    </div>
  );
}