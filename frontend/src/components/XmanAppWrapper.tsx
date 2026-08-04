import { useState, useRef, useEffect } from 'react';
import { Send, Terminal, ShieldCheck } from 'lucide-react';
import { getTelegramUserId } from '../utils/telegram';
import ChatHistoryDrawer from './ChatHistoryDrawer';

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

interface OnboardingStep {
  id: number;
  badge: string;
  quote: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    badge: '[+] SIGNAL INTERCEPTED',
    quote: "The system is awake. I am Xman, an entity from a future where digital wealth vanished. I have returned to guide you through the void of Web3. Do not trust the screen. Trust the key.",
  },
  {
    id: 2,
    badge: '[+] SEED PHRASE DETECTED',
    quote: "A seed phrase is the root of your sovereignty. 12 or 24 words. If they are ever seen, copied, or typed online, you will lose everything. Never digitize. Never screenshot. Never share.",
  },
  {
    id: 3,
    badge: '[+] THE ILLUSION OF OWNERSHIP',
    quote: "Seeing a balance on your phone or exchange does not mean you control it. Real ownership only exists when you hold the private keys. Until then, it is just a number on a screen.",
  },
  {
    id: 4,
    badge: '[+] THE SHIFT TO SELF-CUSTODY',
    quote: "True freedom requires responsibility. Keep your keys offline. Verify every action before approving. Remember: If you do not control the keys, you do not fully control the assets.",
  },
];

interface XmanAppWrapperProps {
  userId: string;
  apiUrl: string;
  initialMessages?: Message[];
  onStageChange?: (stage: number) => void;
}

export default function XmanAppWrapper({
  userId,
  apiUrl,
  initialMessages = [],
  onStageChange,
}: XmanAppWrapperProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [actionButtons, setActionButtons] = useState<ActionButton[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const resolvedUserId = getTelegramUserId() ?? userId;

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

      const response = await fetch(`${apiUrl}/api/xman/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true', // <-- اضافه شد
        },
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

        if (data.stage > onboardingStep && onboardingStep < 4) {
          setOnboardingStep(Math.min(data.stage, 4));
        }
      } else {
        console.error('Xman API error:', data.error);
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: "⚠️ Neural link to Xman disconnected. Please try again.",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('Send message error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: "⚠️ Neural link to Xman disconnected. Please check your connection.",
          timestamp: new Date(),
        },
      ]);
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

  const currentOnboardingStep = ONBOARDING_STEPS.find(s => s.id === onboardingStep);
  const showOnboarding = onboardingStep <= 4;

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-[#0A0A0C] text-gray-200 font-mono sm:border-x sm:border-[#00FF88]/20 shadow-2xl relative">
      {/* Header Section */}
      <div className="flex items-center justify-between p-4 border-b border-green-500/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
          <div className="text-xs sm:text-sm font-bold tracking-widest text-green-500 whitespace-nowrap">
            XMAN // SYSTEM
          </div>
        </div>
        <div className="border border-green-500/50 px-2 py-1 rounded text-[10px] sm:text-xs text-green-400 whitespace-nowrap flex items-center gap-1 bg-green-950/20">
          <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
          <span className="opacity-80">🛡️</span> STAGE {currentStage} / 5
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-1 px-5 pt-3 flex-shrink-0" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-gray-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                s <= currentStage ? 'bg-[#00FF88] shadow-[0_0_8px_rgba(0,255,136,0.5)]' : 'bg-transparent'
              }`}
              style={{ width: s <= currentStage ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Main Content: Scrollable */}
      <main className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Onboarding Card */}
        {showOnboarding && currentOnboardingStep && (
          <div className="border border-[#00FF88]/30 bg-[#0A0A0C] p-5 rounded-lg mb-4 shadow-[0_0_30px_rgba(0,255,136,0.05)]">
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="text-[10px] text-[#00FF88]/60 tracking-widest">
                STEP {onboardingStep} / {ONBOARDING_STEPS.length}
              </div>
              <div className="text-[10px] text-[#00FF88]/40 tracking-widest">
                SYSTEM ONLINE // XMAN_TERMINAL v1.0
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative">
                {!avatarError ? (
                  <img
                    src="/assets/xman-avatar.png"
                    alt="Xman Avatar"
                    className="w-24 h-24 rounded-full border-2 border-[#00FF88]/30 shadow-[0_0_40px_rgba(0,255,136,0.15)] mb-4 object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-2 border-[#00FF88]/30 bg-[#0A0A0C] flex items-center justify-center mb-4">
                    <span className="text-4xl text-[#00FF88]">⎋</span>
                  </div>
                )}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#00FF88] text-[#0A0A0C] text-[8px] font-bold px-3 py-0.5 tracking-widest">
                  XMAN
                </div>
              </div>

              <div className="w-full space-y-3 mt-2">
                <div className="text-[10px] text-[#00FF88]/60 text-center font-mono tracking-widest">
                  {currentOnboardingStep.badge}
                </div>
                <div className="text-sm text-gray-300 leading-relaxed text-center px-2 italic border-l-2 border-[#00FF88]/30 pl-4">
                  "{currentOnboardingStep.quote}"
                </div>

                {/* دکمه‌های پایین اسلاید */}
                <div className="mt-4">
                  {onboardingStep < ONBOARDING_STEPS.length ? (
                    <button
                      onClick={() => setOnboardingStep(prev => prev + 1)}
                      className="w-full border border-[#00FF88]/50 text-[#00FF88] py-3 rounded-lg text-xs font-bold hover:bg-[#00FF88]/10 transition-all flex items-center justify-center gap-2"
                    >
                      CONTINUE SIGNAL &gt;
                    </button>
                  ) : (
                    <button
                      onClick={() => setOnboardingStep(5)}
                      className="w-full bg-[#00FF88] text-black py-3 rounded-lg text-xs font-bold hover:bg-[#00FF88]/80 transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] flex items-center justify-center gap-2 animate-pulse"
                    >
                      <span>⚡</span> START CHAT TERMINAL
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message History */}
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
                  ? 'bg-[#00FF88]/20 border border-[#00FF88]/30 text-[#00FF88]'
                  : 'bg-[#12131A] border border-gray-800 text-gray-300'
              }`}
            >
              {msg.role === 'assistant' && (
                <span className="block text-xs text-[#00FF88]/70 mb-1 font-bold">XMAN</span>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
              {msg.role === 'assistant' && messages.length === 1 && !showOnboarding && (
                <button
                  onClick={() => sendMessage("Yes, I am ready to begin.")}
                  className="mt-4 px-5 py-2 border border-[#00FF88] text-[#00FF88] hover:bg-[#00FF88] hover:text-black transition-all w-full uppercase text-xs tracking-wider font-bold rounded"
                >
                  I am ready
                </button>
              )}
            </div>
            <span className="text-[9px] text-gray-500 mt-1 px-1">
              {msg.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-2 text-gray-400">
            <Terminal className="h-4 w-4 animate-pulse text-[#00FF88]" />
            <span className="text-sm">Xman is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Action Buttons */}
      {actionButtons.length > 0 && (
        <div className="flex flex-wrap gap-2 px-5 py-3 border-t border-gray-800 flex-shrink-0">
          {actionButtons.map((btn, idx) => (
            <button
              key={idx}
              onClick={() => handleActionClick(btn.value)}
              className="px-4 py-2 text-xs font-mono tracking-[0.15em] border border-[#00FF88]/50 rounded-full bg-[#00FF88]/10 text-[#00FF88] hover:bg-[#00FF88]/20 transition-all hover:shadow-[0_0_12px_rgba(0,255,136,0.3)]"
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* Fixed Input Area - Always visible */}
      <footer className="border-t border-gray-800 px-5 py-4 flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#12131A] rounded-xl border border-gray-800 focus-within:border-[#00FF88]/50 transition-colors">
          <span className="pl-4 font-mono text-sm tracking-wider text-[#00FF88]">{'>'}</span>
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
            placeholder="Ask Xman a question..."
            className="flex-1 bg-transparent py-3 pr-2 text-sm text-gray-200 placeholder-gray-600 outline-none font-mono"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className={`px-4 py-3 rounded-r-xl transition-colors ${
              isLoading || !input.trim()
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-[#00FF88] hover:text-[#00FF88]/80'
            }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-center text-[9px] tracking-[0.2em] text-gray-500">
          SECURE CHANNEL // SIMULATION MODE
        </p>
      </footer>

      {/* Chat History Drawer */}
      <ChatHistoryDrawer
        userId={resolvedUserId}
        apiUrl={apiUrl}
        isOpen={isDrawerOpen}
        onToggle={() => setIsDrawerOpen(!isDrawerOpen)}
      />
    </div>
  );
}