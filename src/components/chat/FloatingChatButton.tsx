import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import { ChatbotModal } from './ChatbotModal';

export function FloatingChatButton() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
        }}
        className={[
          'fixed right-4 z-40',
          'h-[56px] min-h-[56px] max-h-[56px] w-auto px-4 rounded-full',
          'bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white',
          'shadow-xl hover:shadow-2xl border-2 border-white dark:border-slate-800',
          'flex items-center justify-center gap-2',
          'transition-transform duration-200 hover:scale-105 active:scale-95',
          'focus:outline-none focus:ring-4 focus:ring-[var(--color-primary-300)]',
        ].join(' ')}
        aria-label={t('chatbot.open_assistant', 'Open AI Help Assistant')}
      >
        <MessageSquare size={24} className="shrink-0" aria-hidden="true" />
        <span
          className="font-black tracking-wide pr-0.5 whitespace-normal break-words"
          style={{
            fontSize: 'clamp(14px, 1rem, 20px)',
            lineHeight: '1.2',
          }}
        >
          {t('chatbot.help_button', 'Help')}
        </span>
      </button>

      <ChatbotModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
