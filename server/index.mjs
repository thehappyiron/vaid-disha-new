import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { sendActivityEmail, sendVerificationOtp, verifyOtp } from './email.mjs';

// Local development convenience: load only server-side values from .env.
// The file is gitignored and is never imported by the Vite client bundle.
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

const port = Number(process.env.PORT || 8787);
const sarvamKey = process.env.SARVAM_API_KEY;
const resendKey = process.env.RESEND_API_KEY;
const sarvamBaseUrl = 'https://api.sarvam.ai';
const maxBodyBytes = 10 * 1024 * 1024;

const hospitalTerms = /\b(hospital|room|route|direction|way|floor|lift|elevator|stairs|washroom|toilet|pharmacy|medicine|doctor|opd|queue|wait|token|report|lab|test|emergency|help|appointment|registration|billing|admission|discharge|wheelchair)\b|अस्पताल|कमरा|रास्ता|मंजिल|लिफ्ट|सीढ़ी|शौचालय|दवा|डॉक्टर|रिपोर्ट|आपात|मदद|हॉस्पिटल|रुग्णालय|खोली|मार्ग|मजला|औषध|डॉक्टर|अहवाल|मदत/i;

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBodyBytes) { reject(new Error('Request is too large.')); request.destroy(); return; }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

function assertConfigured(response) {
  if (sarvamKey) return true;
  sendJson(response, 503, { error: 'Voice assistant server is not configured.' });
  return false;
}

function languageCode(language) {
  if (!language || language === 'auto') return 'auto';
  const code = language.toLowerCase().slice(0, 2);
  return `${code === 'en' ? 'en' : code}-IN`;
}

function replyLanguageCode(language) {
  const value = String(language || 'en').trim();
  if (/^[a-z]{2,3}-IN$/i.test(value)) return value;
  const code = value.toLowerCase().slice(0, 3);
  return `${code === 'en' ? 'en' : code.slice(0, 2)}-IN`;
}

function safeHistory(history = []) {
  return history.slice(-4).map((item) => ({
    role: item.role === 'assistant' ? 'assistant' : 'user',
    content: String(item.text || '').slice(0, 600),
  }));
}

async function sarvam(path, options = {}) {
  return fetch(`${sarvamBaseUrl}${path}`, {
    ...options,
    headers: { 'api-subscription-key': sarvamKey, ...options.headers },
  });
}

async function translateReply(text, targetLanguage) {
  if (targetLanguage === 'en-IN') return text;
  const upstream = await sarvam('/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: text.slice(0, 2000),
      // The assistant generates its internal answer in English. Sarvam's
      // all-22-language translation model requires an explicit source code.
      source_language_code: 'en-IN',
      target_language_code: targetLanguage,
      model: 'sarvam-translate:v1',
    }),
  });
  if (!upstream.ok) throw new Error(`Sarvam translation failed (${upstream.status}).`);
  const data = await upstream.json();
  return String(data.translated_text || text);
}

const scopeInstruction = `You are Vaid Disha, a hospital wayfinding and patient-services assistant. Answer only hospital navigation, facilities, accessibility, appointments, tokens/queues, reports, registration, billing, admission/discharge, and emergency-routing questions. Never diagnose, prescribe, or provide medical advice. If the question is outside this scope, respond briefly that you can help only with hospital services and navigation. Reply in the user's language. Keep the answer under 70 words. Use only provided context; do not invent hospital locations, distances, availability, or policies.`;

const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'http://localhost:5173');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return; }
  if (request.method === 'GET' && request.url === '/api/health') {
    sendJson(response, 200, { configured: Boolean(sarvamKey), emailConfigured: Boolean(resendKey) });
    return;
  }
  if (request.method !== 'POST') { sendJson(response, 405, { error: 'Method not allowed.' }); return; }

  try {
    const raw = await readBody(request);
    if (request.url === '/api/email/send-otp') {
      const body = JSON.parse(raw.toString('utf8') || '{}');
      const result = await sendVerificationOtp({
        email: body.email,
        patientName: body.patientName || body.patient_name,
      });
      sendJson(response, 200, { ok: true, ...result });
      return;
    }
    if (request.url === '/api/email/verify-otp') {
      const body = JSON.parse(raw.toString('utf8') || '{}');
      const result = verifyOtp({ email: body.email, otp: body.otp });
      sendJson(response, 200, { ok: true, ...result });
      return;
    }
    if (request.url === '/api/email/activity') {
      const body = JSON.parse(raw.toString('utf8') || '{}');
      const result = await sendActivityEmail({
        event: body.event,
        to: body.to,
        vars: body.vars || {},
      });
      sendJson(response, 200, { ok: true, ...result });
      return;
    }
    if (!assertConfigured(response)) return;
    if (request.url === '/api/chat') {
      const requestBody = JSON.parse(raw.toString('utf8'));
      const message = String(requestBody.message || '').trim().slice(0, 800);
      if (!message) { sendJson(response, 400, { error: 'A message is required.' }); return; }
      // Reject clearly unrelated English/Hindi/Marathi requests before calling an LLM.
      if (String(requestBody.language || 'en').startsWith('en') && !hospitalTerms.test(message) && message.split(/\s+/).length > 2) {
        sendJson(response, 200, { text: 'I can help with hospital navigation, facilities, queues, reports, and emergency assistance.', language: requestBody.language || 'en' });
        return;
      }
      const context = requestBody.context || {};
      const contextText = JSON.stringify({ department: context.department, currentLocation: context.currentLocation, accessibilityNeeds: context.accessibilityNeeds }).slice(0, 700);
      const replyLanguage = replyLanguageCode(requestBody.language);
      const upstream = await sarvam('/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'sarvam-105b-conversations', temperature: 0.2, reasoning_effort: null, max_tokens: 180, messages: [{ role: 'system', content: `${scopeInstruction}\nDraft the answer in English only. The server translates it to the patient's detected language (${replyLanguage}).\nContext: ${contextText}` }, ...safeHistory(requestBody.history), { role: 'user', content: message }] }),
      });
      if (!upstream.ok) throw new Error(`Sarvam chat failed (${upstream.status}).`);
      const data = await upstream.json();
      const rawReply = String(data.choices?.[0]?.message?.content || 'I could not prepare a response. Please ask hospital staff.');
      const translatedReply = await translateReply(rawReply, replyLanguage);
      sendJson(response, 200, { text: translatedReply, language: replyLanguage });
      return;
    }
    if (request.url === '/api/voice/synthesize') {
      const requestBody = JSON.parse(raw.toString('utf8'));
      const text = String(requestBody.text || '').trim().slice(0, 2500);
      if (!text) { sendJson(response, 400, { error: 'Text is required.' }); return; }
      const upstream = await sarvam('/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Bulbul v3's standard speaker is stable across its supported Indic
        // languages, unlike v4's language-specific persona IDs.
        body: JSON.stringify({ text, language_code: languageCode(requestBody.language), model: 'bulbul:v3', speaker: 'shubh', output_audio_codec: 'wav' }),
      });
      if (!upstream.ok) throw new Error(`Sarvam TTS failed (${upstream.status}).`);
      const data = await upstream.json();
      const audio = data.audios?.[0];
      if (!audio) throw new Error('Sarvam TTS returned no audio.');
      const buffer = Buffer.from(audio, 'base64');
      response.writeHead(200, { 'Content-Type': 'audio/wav', 'Cache-Control': 'private, max-age=3600' });
      response.end(buffer);
      return;
    }
    if (request.url === '/api/voice/transcribe') {
      const upstream = await sarvam('/speech-to-text', { method: 'POST', headers: { 'Content-Type': request.headers['content-type'] || 'application/octet-stream' }, body: raw });
      if (!upstream.ok) throw new Error(`Sarvam STT failed (${upstream.status}).`);
      const data = await upstream.json();
      sendJson(response, 200, { transcript: data.transcript || '', language: data.language_code || 'auto' });
      return;
    }
    sendJson(response, 404, { error: 'Unknown assistant endpoint.' });
  } catch (error) {
    const status = Number(error?.status) || 502;
    const message = error instanceof Error ? error.message : 'unknown';
    if (status < 500) {
      sendJson(response, status, { error: message });
      return;
    }
    console.error('Assistant proxy error:', message);
    sendJson(response, 502, { error: 'The assistant is temporarily unavailable.' });
  }
});

server.listen(port, () => console.log(`Vaid Disha assistant proxy listening on ${port}`));
