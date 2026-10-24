/**
 * Sarvam AI Chat Provider Stub
 * 
 * CRITICAL SECURITY ARCHITECTURE NOTE:
 * Do NOT place Sarvam AI API keys, tokens, or private secrets in frontend code.
 * The production chatbot pipeline must connect to a backend server proxy
 * (e.g., POST /api/chat or backend gateway) which holds the Sarvam credentials
 * securely in server-side environment variables.
 * 
 * TODO for teammates:
 * 1. Implement backend endpoint /api/chat that accepts ChatRequest.
 * 2. Backend injects hospital system prompts and calls Sarvam LLM API with private API key.
 * 3. Backend parses intent, injects hospital navigation routes, and returns ChatResponse.
 * 4. Configure frontend VITE_CHAT_PROVIDER=http and VITE_API_BASE_URL to point to backend.
 */

import type { ChatProvider } from './provider';
import type { ChatRequest, ChatResponse } from './types';

export class SarvamChatProvider implements ChatProvider {
  public async sendMessage(_req: ChatRequest): Promise<ChatResponse> {
    void _req;
    // Empty stub intentionally. Teammates must route via HttpChatProvider to backend proxy.
    throw new Error(
      'SarvamChatProvider: Direct frontend Sarvam API calls are blocked for security. Please use HttpChatProvider with a secure backend proxy.'
    );
  }
}
