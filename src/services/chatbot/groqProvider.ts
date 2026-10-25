/**
 * Groq AI Chat Provider for Vaid Disha
 * 
 * Powered by Groq's high-speed inference (sub-200ms latency)
 * Uses qwen/qwen3.8-27b with fallback to openai/gpt-oss-120b.
 * Strictly enforces hospital wayfinding and patient context.
 */

import type { ChatProvider } from './provider';
import type { ChatRequest, ChatResponse } from './types';
import {
  checkOffTopicQuery,
  getLivePatientContext,
  buildHospitalSystemPrompt,
  generateChatActions,
} from './hospitalKnowledge';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = (import.meta.env.VITE_GROQ_API_KEY || '').trim();

export class GroqChatProvider implements ChatProvider {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  }

  public async sendMessage(req: ChatRequest): Promise<ChatResponse> {
    const rawMessage = (req.message || '').trim();
    const lang = req.language || 'en';

    // 1. Strict fast pre-filter for non-hospital queries (e.g. 2+2) with 0 latency
    const offTopicRefusal = checkOffTopicQuery(rawMessage, lang);
    if (offTopicRefusal) {
      return {
        text: offTopicRefusal,
        language: lang,
        actions: [
          { label: 'Hospital Facilities', route: '/patient/facilities' },
          { label: 'Emergency Help', route: '/patient/emergency' },
        ],
        suggestedReplies: [
          lang.startsWith('mr') ? 'माझी खोली कुठे आहे?' : lang.startsWith('hi') ? 'मेरा कमरा कहाँ है?' : 'Where is my room?',
          lang.startsWith('mr') ? 'जवळचे प्रसाधनगृह' : lang.startsWith('hi') ? 'निकटतम शौचालय' : 'Nearest washroom',
        ],
      };
    }

    // 2. Load dynamic patient live context (room, queue position, wait time, doctor, etc.)
    const patientContext = await getLivePatientContext(req.context);
    const systemPrompt = buildHospitalSystemPrompt(patientContext);

    // 3. Format message history for Groq
    const historyMessages = (req.history || []).slice(-4).map((h) => ({
      role: h.role === 'assistant' ? 'assistant' : 'user',
      content: h.text,
    }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: rawMessage },
    ];

    let replyText = '';

    // 4. Try backend / dev proxy endpoint first
    try {
      const endpoint = `${this.apiBaseUrl.replace(/\/$/, '')}/chat`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          message: rawMessage,
          language: lang,
          context: req.context,
          history: req.history,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.text) {
          replyText = data.text;
        }
      }
    } catch {
      // Backend not reachable, fall back to direct Groq API
    }

    // 5. If backend did not provide reply, execute direct high-speed Groq inference
    if (!replyText) {
      try {
        const groqRes = await this.callGroqDirect(messages);
        replyText = groqRes;
      } catch (err) {
        console.error('Groq direct call failed:', err);
        // Fallback message
        replyText =
          lang.startsWith('mr')
            ? 'मी क्षमस्व आहे, सर्व्हरशी संपर्क होत नाही. कृपया जवळच्या रिसेप्शन किंवा कर्मचाऱ्यांशी संपर्क साधा.'
            : lang.startsWith('hi')
            ? 'क्षमा करें, सर्वर से संपर्क नहीं हो पा रहा है। कृपया नजदीकी रिसेप्शन या स्टाफ से संपर्क करें।'
            : 'I am temporarily unable to reach the assistant. Please speak with the nearest hospital reception desk or staff.';
      }
    }

    // 6. Generate interactive deep-link action buttons based on query and reply
    const actions = generateChatActions(rawMessage, replyText, patientContext);

    // 7. Contextual suggested replies
    const suggestedReplies = [
      lang.startsWith('mr') ? 'माझा नंबर कधी येईल?' : lang.startsWith('hi') ? 'मेरा नंबर कब आएगा?' : 'How long is the wait?',
      lang.startsWith('mr') ? 'जवळचे प्रसाधनगृह कुठे आहे?' : lang.startsWith('hi') ? 'शौचालय कहाँ है?' : 'Nearest washroom',
      lang.startsWith('mr') ? 'माझे रक्त तपासणी अहवाल' : lang.startsWith('hi') ? 'मेरी खून की रिपोर्ट' : 'My lab reports',
    ];

    return {
      text: replyText,
      language: lang,
      actions,
      suggestedReplies,
    };
  }

  /**
   * High-speed direct Groq API call with automatic model fallback
   */
  private async callGroqDirect(
    messages: Array<{ role: string; content: string }>
  ): Promise<string> {
    const models = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

    for (const model of models) {
      try {
        const res = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.1,
            max_tokens: 160,
          }),
        });

        if (!res.ok) {
          continue;
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) {
          return content;
        }
      } catch {
        // try next model
      }
    }

    throw new Error('All Groq models failed to respond.');
  }
}
