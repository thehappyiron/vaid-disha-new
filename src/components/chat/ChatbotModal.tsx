import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Trash2,
  ArrowRight,
  AlertTriangle,
  Bot,
  User,
} from 'lucide-react';
import { sendChatMessage, type ChatResponse, type ChatAction } from '../../services/chatbot';
import { textToSpeech, speechToText } from '../../services/voice';
import { useAuth } from '../../context/AuthContext';
import type { Slip } from '../../types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: number;
  actions?: ChatAction[];
  language?: string;
}

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'vd-chat-history';
const SPEAK_REPLIES_KEY = 'vd-chat-speak-replies';

function getStoredSlip(): Slip | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('vd-latest-slip');
    if (!raw) return null;
    return JSON.parse(raw) as Slip;
  } catch {
    return null;
  }
}

function getVoiceInputErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : '';
  const message = error instanceof Error ? error.message : '';

  if (name === 'NotAllowedError' || /permission|notallowed/i.test(message)) {
    return 'Microphone permission is blocked. Allow microphone access for localhost, then try again.';
  }
  if (/no speech|no microphone audio/i.test(message)) {
    return 'No speech was detected. Hold the microphone closer and try again.';
  }
  if (/Sarvam transcription failed/i.test(message)) {
    return 'The voice service could not transcribe this recording. Please try speaking again.';
  }
  return 'Voice input could not start. Check your microphone and try again.';
}

export const ChatbotModal: React.FC<ChatbotModalProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  });
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [speakReplies, setSpeakReplies] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SPEAK_REPLIES_KEY) === 'true';
  });

  const currentLang = (i18n.language || 'en').toLowerCase().slice(0, 2);

  // Initialize greeting if empty
  useEffect(() => {
    if (messages.length === 0) {
      const initialGreeting: ChatMessage = {
        id: 'initial-greeting',
        sender: 'bot',
        text:
          currentLang === 'hi'
            ? 'नमस्ते! मैं आपका वैद्य दिशा सहायक हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?'
            : currentLang === 'mr'
            ? 'नमस्कार! मी आपला वैद्य दिशा सहाय्यक आहे. मी आज आपल्याला कशी मदत करू शकतो?'
            : 'Hello! I am your Vaid Disha hospital assistant. How can I assist you today?',
        timestamp: Date.now(),
        language: currentLang,
        actions: [
          { label: t('chatbot.quick_room', 'Where is my room?'), route: '/patient/facilities' },
          { label: t('chatbot.quick_washroom', 'Nearest washroom'), route: '/patient/facilities?filter=washroom' },
          { label: t('chatbot.quick_reports', 'My reports'), route: '/patient/reports' },
        ],
      };
      setMessages([initialGreeting]);
    }
  }, [currentLang, messages.length, t]);

  // Save messages to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch {
        // ignore
      }
    }
  }, [messages]);

  // Lock body scroll and handle ESC key
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          textToSpeech.stop();
          speechToText.stop();
          setSpeakingMessageId(null);
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
        textToSpeech.stop();
        speechToText.stop();
        setSpeakingMessageId(null);
      };
    }
  }, [isOpen, onClose]);

  // Auto-scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  // Send message
  const handleSendMessage = useCallback(
    async (textToSend?: string, requestedLanguage = currentLang, isVoiceQuery = false) => {
      const text = (textToSend || inputMessage).trim();
      if (!text) return;

      const userMsg: ChatMessage = {
        id: `msg-user-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: Date.now(),
        language: requestedLanguage,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputMessage('');
      setIsTyping(true);

      const slip = getStoredSlip();

      try {
        const response: ChatResponse = await sendChatMessage({
          message: text,
          language: requestedLanguage,
          context: {
            userType: isGuest ? 'guest' : user ? 'registered' : 'guest',
            slipId: slip?.id,
            currentLocation: localStorage.getItem('vd-last-location') || undefined,
            department: slip?.department?.id,
            accessibilityNeeds: slip?.accessibilityNeeds,
          },
          history: messages.slice(-6).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            text: m.text,
            timestamp: m.timestamp,
          })),
        });

        const botMsg: ChatMessage = {
          id: `msg-bot-${Date.now()}`,
          sender: 'bot',
          text: response.text,
          timestamp: Date.now(),
          actions: response.actions,
          language: response.language || currentLang,
        };

        setMessages((prev) => [...prev, botMsg]);

        // If the user asked via VOICE INPUT or has speakReplies turned on, speak aloud immediately!
        if (isVoiceQuery || speakReplies) {
          textToSpeech.stop();
          setSpeakingMessageId(botMsg.id);
          textToSpeech.speak(response.text, response.language || currentLang, {
            onEnd: () => setSpeakingMessageId(null),
            onError: () => {
              setSpeakingMessageId(null);
              setVoiceError('Voice reply is unavailable. You can still read the answer on screen.');
            },
          });
        }
      } catch (err) {
        console.error('Failed to get bot response', err);
        const errorMsg: ChatMessage = {
          id: `msg-err-${Date.now()}`,
          sender: 'bot',
          text: "I am having trouble answering right now. Please check with hospital staff or reception.",
          timestamp: Date.now(),
          actions: [{ label: 'Alert staff / emergency', route: '/patient/emergency' }],
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [currentLang, inputMessage, isGuest, messages, speakReplies, user]
  );

  // Toggle Speech-to-Text Microphone
  const toggleListening = () => {
    if (isListening) {
      speechToText.stop();
      setIsListening(false);
    } else {
      setVoiceError(null);
      if (!speechToText.isSupported()) {
        setVoiceError('Microphone input is not supported in this browser.');
        return;
      }
      setIsListening(true);
      speechToText.start(
        currentLang,
        (transcript: string, isFinal: boolean, detectedLanguage?: string) => {
          setInputMessage(transcript);
          if (isFinal) {
            setIsListening(false);
            // A completed voice recording is a voice query: send it to Groq and speak answer back!
            handleSendMessage(
              transcript,
              detectedLanguage && detectedLanguage !== 'unknown' ? detectedLanguage : currentLang,
              true /* isVoiceQuery */
            );
          }
        },
        (error) => {
          setIsListening(false);
          setVoiceError(getVoiceInputErrorMessage(error));
        }
      );
    }
  };

  // Toggle Speak Replies Setting
  const toggleSpeakReplies = () => {
    const nextVal = !speakReplies;
    setSpeakReplies(nextVal);
    localStorage.setItem(SPEAK_REPLIES_KEY, String(nextVal));
    if (!nextVal) {
      textToSpeech.stop();
      setSpeakingMessageId(null);
    }
  };

  // Clear Chat History
  const handleClearChat = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    textToSpeech.stop();
    setSpeakingMessageId(null);
    const freshGreeting: ChatMessage = {
      id: `initial-greeting-${Date.now()}`,
      sender: 'bot',
      text:
        currentLang === 'hi'
          ? 'चैट रीसेट हो गई है। मैं आपकी क्या सहायता कर सकता हूँ?'
          : currentLang === 'mr'
          ? 'चॅट रीसेट झाली आहे. मी आपल्याला कशी मदत करू?'
          : 'Chat cleared. How can I assist you?',
      timestamp: Date.now(),
      language: currentLang,
      actions: [
        { label: 'Where is my room?', route: '/patient/facilities' },
        { label: 'Nearest washroom', route: '/patient/facilities?filter=washroom' },
      ],
    };
    setMessages([freshGreeting]);
  };

  // Read message aloud or stop reading
  const handleSpeakSingleMessage = (msg: ChatMessage) => {
    if (speakingMessageId === msg.id) {
      textToSpeech.stop();
      setSpeakingMessageId(null);
      return;
    }
    setVoiceError(null);
    textToSpeech.stop();
    setSpeakingMessageId(msg.id);
    textToSpeech.speak(msg.text, msg.language || currentLang, {
      onEnd: () => setSpeakingMessageId(null),
      onError: () => {
        setSpeakingMessageId(null);
        setVoiceError('Voice reply is unavailable. You can still read the answer on screen.');
      },
    });
  };

  // Quick reply click (search / text query)
  const handleQuickReply = (query: string) => {
    handleSendMessage(query, currentLang, false /* isVoiceQuery: false */);
  };

  // Action button click
  const handleActionClick = (route: string) => {
    textToSpeech.stop();
    speechToText.stop();
    setSpeakingMessageId(null);
    onClose();
    navigate(route);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-stretch justify-end bg-black/50 backdrop-blur-xs transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Vaid Disha AI Help Assistant"
      ref={modalRef}
    >
      {/* Backdrop overlay dismiss */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Container: Bottom sheet on mobile (~85% height), Side panel on desktop (~400px wide) */}
      <div className="relative z-10 w-full h-[85vh] md:h-full md:w-[420px] max-w-full bg-[var(--color-surface)] border-t md:border-t-0 md:border-l-2 border-[var(--color-border)] rounded-t-3xl md:rounded-none shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
          <div className="flex items-center gap-2.5">
            <img src="/images/chat-mascot.png" alt="" className="w-12 h-12 object-contain" />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-base font-black text-[var(--color-text)]">
                  {t('chatbot.title', 'Vaid Disha Help')}
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                  {currentLang.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] font-bold">
                {t('chatbot.subtitle', 'Hospital Navigation & Live Queue Guide')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Speak replies toggle */}
            <button
              type="button"
              onClick={toggleSpeakReplies}
              title={speakReplies ? 'Speak replies: ON' : 'Speak replies: OFF'}
              className={[
                'p-2 rounded-xl transition-all',
                speakReplies
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-bold'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]',
              ].join(' ')}
              aria-label={speakReplies ? 'Disable auto read aloud' : 'Enable auto read aloud'}
            >
              {speakReplies ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            {/* Clear chat */}
            <button
              type="button"
              onClick={handleClearChat}
              title="Clear chat history"
              className="p-2 rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-all"
              aria-label="Clear chat"
            >
              <Trash2 size={18} />
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
              aria-label="Close assistant"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Quick-reply chips row at top */}
        <div className="px-3 py-2 bg-[var(--color-surface-2)] border-b border-[var(--color-border)] overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
          {[
            { label: 'Where is my room?', query: 'Where is my room?' },
            { label: 'Nearest washroom', query: 'Where is the nearest washroom?' },
            { label: 'How long is the wait?', query: 'How long is the wait time?' },
            { label: 'My reports', query: 'Show my lab reports' },
            { label: 'I need help', query: 'I need immediate medical help' },
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickReply(chip.query)}
              className="px-2.5 py-1.5 rounded-full text-xs font-bold whitespace-normal break-words bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] transition-all"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {voiceError && <div role="status" className="mx-3 mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">{voiceError}</div>}

        {/* Scrollable message list with aria-live */}
        <div
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5"
          aria-live="polite"
          aria-atomic="false"
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={[
                  'flex flex-col max-w-[85%] transition-all',
                  isUser ? 'self-end items-end' : 'self-start items-start',
                ].join(' ')}
              >
                <div className="flex items-end gap-1.5">
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-[var(--color-primary-500)] text-white flex items-center justify-center shrink-0 mb-1 text-xs">
                      <Bot size={13} />
                    </div>
                  )}

                  <div
                    className={[
                      'px-4 py-3 rounded-2xl text-sm font-semibold leading-relaxed shadow-xs',
                      isUser
                        ? 'bg-[var(--color-primary-500)] text-white rounded-br-xs'
                        : 'bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)] rounded-bl-xs',
                    ].join(' ')}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  {isUser && (
                    <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mb-1 text-xs">
                      <User size={13} />
                    </div>
                  )}
                </div>

                {/* Read Aloud button for Bot Message */}
                {!isUser && (
                  <div className="flex items-center gap-2 mt-1 ml-8">
                    <button
                      type="button"
                      onClick={() => handleSpeakSingleMessage(msg)}
                      className={[
                        'text-[11px] font-bold flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-colors',
                        speakingMessageId === msg.id
                          ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-950)] dark:text-[var(--color-primary-300)] animate-pulse'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary-500)]',
                      ].join(' ')}
                      title={speakingMessageId === msg.id ? 'Stop audio' : 'Read aloud'}
                    >
                      {speakingMessageId === msg.id ? (
                        <>
                          <VolumeX size={13} className="text-red-500" />
                          <span className="text-red-600 dark:text-red-400 font-black">Speaking… (tap to stop)</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={13} />
                          <span>Read aloud</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Action Buttons inside Bot Message */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 ml-8">
                    {msg.actions.map((act, actIdx) => (
                      <button
                        key={actIdx}
                        type="button"
                        onClick={() => handleActionClick(act.route)}
                        className="px-3 py-1.5 rounded-xl text-xs font-black bg-[var(--color-primary-50)] text-[var(--color-primary-700)] border border-[var(--color-primary-300)] hover:bg-[var(--color-primary-500)] hover:text-white transition-all flex items-center gap-1 shadow-2xs"
                      >
                        <span>{act.label}</span>
                        <ArrowRight size={13} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="self-start flex items-center gap-2 p-3 bg-[var(--color-surface-2)] rounded-2xl border border-[var(--color-border)] ml-7">
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary-500)] animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary-500)] animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary-500)] animate-bounce" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Short Safety Note */}
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-amber-600 shrink-0" />
            <span>This assistant gives general help. For medical emergencies press the Emergency button.</span>
          </div>
          <button
            type="button"
            onClick={() => handleActionClick('/patient/emergency')}
            className="text-[11px] font-black text-red-600 dark:text-red-400 underline shrink-0 uppercase"
          >
            Emergency →
          </button>
        </div>

        {/* Bottom Input Area */}
        <div className="p-3 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center gap-2 shrink-0">
          {/* Microphone speech-to-text button */}
          <button
            type="button"
            onClick={toggleListening}
            className={[
              'w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 border',
              isListening
                ? 'bg-red-500 text-white animate-pulse border-red-600 shadow-md'
                : 'bg-[var(--color-surface-2)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-surface)]',
            ].join(' ')}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            title={isListening ? 'Listening… Tap to stop' : 'Tap to speak'}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              isListening
                ? 'Listening to speech…'
                : t('chatbot.input_placeholder', 'Type a question or tap mic…')
            }
            className="flex-1 h-11 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim()}
            className="w-11 h-11 rounded-xl bg-[var(--color-primary-500)] disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0 shadow-xs hover:bg-[var(--color-primary-600)]"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
