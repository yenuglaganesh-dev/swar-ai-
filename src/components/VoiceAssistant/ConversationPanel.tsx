import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Volume2, User, Bot, AlertCircle, Sparkles } from 'lucide-react';
import { ChatMessage } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import SuggestionChips from './SuggestionChips';

interface Props {
  messages: ChatMessage[];
  onSuggestion: (s: string) => void;
  onRepeat: (text: string) => void;
  onSimplify?: (text: string) => void;
}

export default function ConversationPanel({ messages, onSuggestion, onRepeat, onSimplify }: Props) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }, [messages, reduce]);

  return (
    <div className="conversation" role="log" aria-live="polite" aria-label="Conversation">
      {messages.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon"><Bot size={28} /></div>
          <p>{t('assistantPrompt')}</p>
        </div>
      )}
      <AnimatePresence initial={false}>
        {messages.map((m) => (
          <motion.div
            key={m.id}
            className={`msg msg-${m.role} ${m.error ? 'msg-error' : ''}`}
            initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            <div className="msg-avatar">
              {m.role === 'user' ? <User size={18} /> : m.error ? <AlertCircle size={18} /> : <Bot size={18} />}
            </div>
            <div className="msg-body">
              <div className="msg-meta">
                <span className="msg-name">{m.role === 'user' ? t('you') : t('assistant')}</span>
                {m.role === 'assistant' && !m.error && (
                  <div className="msg-actions">
                    <button className="msg-action" onClick={() => onRepeat(m.content)} aria-label={t('repeat')}>
                      <Volume2 size={14} /> {t('repeat')}
                    </button>
                    {onSimplify && (
                      <button className="msg-action" onClick={() => onSimplify(m.content)} aria-label={t('explainSimply')}>
                        <Sparkles size={14} /> {t('explainSimply')}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="msg-content">{m.content}</div>
              {m.role === 'assistant' && m.suggestions && m.suggestions.length > 0 && (
                <SuggestionChips suggestions={m.suggestions} onSelect={onSuggestion} />
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={endRef} />
      <style>{`
        .conversation { flex: 1; overflow-y: auto; padding: 8px 4px 16px; display: flex; flex-direction: column; gap: 16px; min-height: 0; }
        .empty-state { margin: auto; text-align: center; color: var(--text-muted); padding: 40px 20px; }
        .empty-icon { width: 64px; height: 64px; border-radius: 20px; margin: 0 auto 16px; display: grid; place-items: center; background: rgba(255,107,53,0.1); color: var(--accent); }
        .empty-state p { margin: 0; font-size: 1.05rem; }
        .msg { display: flex; gap: 12px; max-width: 92%; }
        .msg-user { align-self: flex-end; flex-direction: row-reverse; }
        .msg-assistant { align-self: flex-start; }
        .msg-avatar { width: 36px; height: 36px; border-radius: 12px; flex-shrink: 0; display: grid; place-items: center; background: rgba(255,255,255,0.06); color: #ddd; }
        .msg-assistant .msg-avatar { background: rgba(255,107,53,0.15); color: var(--accent); }
        .msg-error .msg-avatar { background: rgba(255,77,77,0.15); color: #ff6b6b; }
        .msg-body { padding: 14px 16px; border-radius: 18px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); min-width: 0; }
        .msg-user .msg-body { background: linear-gradient(135deg, rgba(255,107,53,0.22), rgba(255,154,90,0.12)); border-color: rgba(255,107,53,0.25); }
        .msg-error .msg-body { border-color: rgba(255,77,77,0.3); }
        .msg-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; flex-wrap: wrap; }
        .msg-name { font-size: 0.78rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .msg-actions { display: inline-flex; gap: 4px; flex-wrap: wrap; }
        .msg-action { display: inline-flex; align-items: center; gap: 4px; font-size: 0.78rem; color: var(--text-muted); padding: 4px 8px; border-radius: 6px; }
        .msg-action:hover { color: var(--accent); background: rgba(255,107,53,0.1); }
        .msg-content { font-size: 1rem; line-height: 1.7; white-space: pre-wrap; word-break: break-word; }
        @media (max-width: 640px) { .msg { max-width: 100%; } }
      `}</style>
    </div>
  );
}
