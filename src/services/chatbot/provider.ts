/**
 * Chat Provider Interface
 */

import type { ChatRequest, ChatResponse } from './types';

export interface ChatProvider {
  sendMessage(req: ChatRequest): Promise<ChatResponse>;
}
