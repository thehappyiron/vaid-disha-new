/**
 * HTTP Chat Provider
 * 
 * Sends ChatRequest to ${VITE_API_BASE_URL}/chat and parses ChatResponse.
 * Designed for production when a backend AI or orchestration server is deployed.
 */

import type { ChatProvider } from './provider';
import type { ChatRequest, ChatResponse } from './types';

export class HttpChatProvider implements ChatProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  }

  public async sendMessage(req: ChatRequest): Promise<ChatResponse> {
    const endpoint = `${this.baseUrl}/chat`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        throw new Error(`Chat API responded with status ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      return data;
    } catch (err) {
      console.error('HTTP Chat Provider error:', err);
      return {
        text: "I am having trouble reaching the hospital assistant server. Please ask the nearest reception desk or staff member.",
        language: req.language,
        actions: [{ label: 'Alert staff / emergency', route: '/patient/emergency' }],
      };
    }
  }
}
