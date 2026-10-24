/**
 * Chatbot Service Entry Point
 * 
 * Picks provider via VITE_CHAT_PROVIDER ("mock" | "http", default "mock").
 */

import type { ChatProvider } from './provider';
import { MockChatProvider } from './mockProvider';
import { HttpChatProvider } from './httpProvider';
import type { ChatRequest, ChatResponse } from './types';

export * from './types';
export * from './provider';
export * from './mockProvider';
export * from './httpProvider';
export * from './sarvamProvider';

function createChatProvider(): ChatProvider {
  const providerType = (import.meta.env.VITE_CHAT_PROVIDER || 'http').toLowerCase();

  if (providerType === 'http') {
    return new HttpChatProvider();
  }

  return new MockChatProvider();
}

export const chatProvider: ChatProvider = createChatProvider();

export async function sendChatMessage(req: ChatRequest): Promise<ChatResponse> {
  return chatProvider.sendMessage(req);
}
