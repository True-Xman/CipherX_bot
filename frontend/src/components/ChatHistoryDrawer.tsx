// frontend/src/components/ChatHistoryDrawer.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, History } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: number;
  stage: number;
}

interface ChatHistoryDrawerProps {
  userId: string;
  apiUrl: string;
  isOpen: boolean;
  onToggle: () => void;
}

export default function ChatHistoryDrawer({
  userId,
  apiUrl,
  isOpen,
  onToggle,
}: ChatHistoryDrawerProps) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/chat/history?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* دکمه‌ی باز/بسته کردن کشو */}
      <button
        onClick={onToggle}
        className="fixed bottom-20 right-4 z-50 bg-[#00FF88]/20 border border-[#00FF88]/50 text-[#00FF88] p-3 rounded-full shadow-lg hover:bg-[#00FF88]/30 transition-all backdrop-blur-sm"
        aria-label="Toggle chat history"
      >
        <History className="h-5 w-5" />
      </button>

      {/* کشوی تاریخچه چت */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-40 max-h-[60vh] bg-[#0A0A0C] border-t border-[#00FF88]/30 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,255,136,0.1)]"
          >
            {/* هدر کشو */}
            <div className="flex items-center justify-between p-4 border-b border-[#00FF88]/20">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-[#00FF88]" />
                <span className="text-xs font-mono tracking-widest text-[#00FF88]/80">CHAT HISTORY</span>
              </div>
              <button
                onClick={onToggle}
                className="text-[#00FF88]/50 hover:text-[#00FF88] transition-colors"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>

            {/* لیست پیام‌ها */}
            <div className="overflow-y-auto max-h-[calc(60vh-60px)] p-4 space-y-3">
              {isLoading ? (
                <div className="text-center text-gray-500 text-sm font-mono animate-pulse">
                  Loading history...
                </div>
              ) : history.length === 0 ? (
                <div className="text-center text-gray-500 text-sm font-mono">
                  No messages yet. Start chatting with Xman!
                </div>
              ) : (
                history.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2 rounded-lg text-xs font-mono ${
                        msg.role === 'user'
                          ? 'bg-[#00FF88]/20 border border-[#00FF88]/30 text-[#00FF88]'
                          : 'bg-[#12131A] border border-gray-800 text-gray-300'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <span className="block text-[9px] text-[#00FF88]/50 mb-1">XMAN</span>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <span className="block text-[8px] text-gray-500 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}