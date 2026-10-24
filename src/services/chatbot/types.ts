/**
 * Chatbot Contract and Interface Types
 */

export interface ChatContext {
  userType: 'guest' | 'registered' | 'staff';
  slipId?: string;
  currentLocation?: string;
  department?: string;
  accessibilityNeeds?: string[];
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: number;
}

export interface ChatRequest {
  message: string;
  language: string; // 'en' | 'hi' | 'mr'
  context: ChatContext;
  history: ChatHistoryItem[];
}

export interface ChatAction {
  label: string;
  route: string;
}

export interface ChatResponse {
  text: string;
  language: string;
  actions?: ChatAction[];
  suggestedReplies?: string[];
}
