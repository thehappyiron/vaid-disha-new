import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { sendActivityEmail, sendVerificationOtp, verifyOtp } from './email.mjs';
import { analyzeLayoutWithGroq } from './layoutAnalyzer.mjs';


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
const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '';
const resendKey = process.env.RESEND_API_KEY;
const sarvamBaseUrl = 'https://api.sarvam.ai';
const groqBaseUrl = 'https://api.groq.com/openai/v1';
const maxBodyBytes = 10 * 1024 * 1024;

const hospitalPrompt = `You are Vaid Disha (वैद्य दिशा), the smart AI hospital wayfinding and patient assistant for Vaid Disha Multi-Specialty Hospital and its web application.

YOUR PURPOSE AND SCOPE:
- You answer questions related to the hospital: medical departments, clinics, doctors, symptoms/reasons for visit, physical room locations, floors, facilities, queue wait times, visit slips, lab reports, and how to use the Vaid Disha web app (such as login, role selection, registering visits, and emergency routing).
- For ANY hospital department (like Dermatology, Cardiology, etc.), doctor, room, symptom, or app feature (like login, registration, slip, reports), ALWAYS answer helpfully with the exact details.

STRICT BOUNDARY (MANDATORY):
- ONLY refuse questions that are completely unrelated to the hospital, medical care, or the Vaid Disha web app (e.g. math puzzles like "what is 2+2", coding, recipes, general trivia, politics).
- If and only if a question is totally unrelated to the hospital or app (like "what is 2+2"), politely say: "I am Vaid Disha, your hospital and patient navigation assistant. I can only assist with hospital services, departments, clinics, queue status, reports, facilities, and app navigation." (in the user's language).
- Reply strictly in the language of the user's query or selected language.
- Keep answers concise, clear, and under 60 words. Never prescribe medication or give clinical diagnoses.

VERIFIED HOSPITAL DIRECTORY:
- Dermatology Clinic (Skin, Rash, Allergy, Hair): Building C, Floor 1, Room C-102 (East Wing, next to allergy testing room, Dr. K. Saxena).
- Cardiology Clinic (Heart, Chest Pain, BP): Building B, Floor 2, Rooms B-201 & B-202 (West Wing, blue signs, Dr. S. Sharma).
- Orthopaedics Clinic (Bones, Joints, Knee, Back): Building B, Floor 3, Rooms B-301 to B-303 (West Wing, follow orange floor tape, Dr. R. Patel).
- General Medicine OPD (Fever, Cold, Cough, Infection): Building A, Floor 1, Rooms A-101 to A-103 (North Wing, Dr. A. Verma).
- Pediatrics Clinic (Child Care & Vaccination): Building A, Floor 1, Rooms A-106 & A-107 (North Wing, next to play area, Dr. S. Gupta).
- Eye Clinic / Ophthalmology (Vision, Cataract): Building B, Floor 1, Room B-104 (West Wing, yellow corridor, Dr. N. Mehta).
- ENT Clinic (Ear, Nose, Throat): Building A, Floor 2, Rooms A-205 & A-206 (North Wing, Dr. P. Joshi).
- Neurology Clinic (Brain, Nerves, Spine, Headache): Building C, Floor 2, Rooms C-201 & C-202 (East Wing, Dr. M. Kulkarni).
- Emergency & Trauma Care (Casualty): Building E, Floor 0, Room E-01 (Red building left of main gate, 24/7 open, Dr. K. Deshmukh).
- Central Pathology Lab (Blood/Urine/CBC Tests): Building A, Floor 0, Rooms A-B01 & A-B02 (Dr. V. Rao).
- Radiology & Imaging (X-Ray, CT, Ultrasound, MRI): Building A, Floor 0, Room A-B05 (Dr. H. Balsara).
- Central Pharmacy: Building A, Floor 0, Room A-G12 (Right side of ground floor lobby).
- Wheelchair Stand: Ground floor main entrance (Pillar code: F0-WC1).
- Main Entrance Ramp: Step-free access at the main entrance.
- Accessible Washrooms: Ground Floor (washroom-f0) and First Floor (washroom-f1-acc). Regular washrooms on all floors.
- IPD Admissions: Building A, Floor 1, Room A-110.
- Discharge Services: Building A, Floor 1, Room A-112.
- Billing Counter: Building A, Floor 1, Room A-115.
- Canteen / Dining: Building D, Room D-G1.

VAID DISHA APP & WEB NAVIGATION:
- Login & Role Selection: Accessible at the home route ('/') or Role Selection ('/role') to sign in as a Patient or Hospital Staff.
- Staff Portal: Available at '/staff' for doctors, nurses, and hospital staff.
- Patient Home / Start: '/patient/start'
- Visit Registration: '/patient/visit' to register an OPD visit and generate a digital visit slip.
- Turn-by-turn Navigation: '/patient/guidance' with step-by-step directions to any room.
- Live Queue & Wait Times: '/patient/live' to view live token countdowns and queue position.
- Lab Reports: '/patient/reports' to view digital blood test and diagnostic reports.
- Hospital Facilities & Maps: '/patient/facilities' (washrooms, wheelchair stands, ramps, lifts, canteen).
- Emergency SOS: '/patient/emergency' to instantly alert emergency staff.`;

function isOffTopic(text) {
  const q = String(text || '').trim().toLowerCase();
  const mathPattern = /^(what\s+is\s+)?(\d+\s*[\+\-\*\/xX÷]\s*\d+)|^\d+\s*[\+\-\*\/xX÷]\s*\d+/;
  const indicMath = /^[०-९\d\s\+\-\*\/xX÷=]+$|^(२\s*अधिक\s*२|2\s*plus\s*2)/i;
  const randomTopics = /^(who\s+is\s+(the\s+)?president|who\s+won|write\s+(a\s+)?code|write\s+(a\s+)?python|tell\s+me\s+a\s+joke|what\s+is\s+the\s+capital|recipe\s+for|weather\s+in)/i;
  return mathPattern.test(q) || indicMath.test(q) || randomTopics.test(q);
}

const INDIAN_LANGUAGE_NAMES = {
  en: { name: 'English', native: 'English' },
  hi: { name: 'Hindi', native: 'हिन्दी' },
  mr: { name: 'Marathi', native: 'मराठी' },
  te: { name: 'Telugu', native: 'తెలుగు' },
  ta: { name: 'Tamil', native: 'தமிழ்' },
  kn: { name: 'Kannada', native: 'ಕನ್ನಡ' },
  as: { name: 'Assamese', native: 'অসমীয়া' },
  bn: { name: 'Bengali', native: 'বাংলা' },
  pa: { name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  or: { name: 'Odia', native: 'ଓଡ଼ିଆ' },
  ml: { name: 'Malayalam', native: 'മലയാളം' },
  gu: { name: 'Gujarati', native: 'ગુજરાતી' },
};

function getOffTopicRefusal(lang) {
  const l = String(lang || 'en').toLowerCase().trim();
  if (l.startsWith('mr')) {
    return 'मी वैद्य दिशा आहे, आपला रुग्णालय सहाय्यक. मी केवळ रुग्णालय मार्गदर्शन, विभाग, रांगेची स्थिती, अहवाल आणि सुविधांशी संबंधित प्रश्नांमध्येच मदत करू शकतो.';
  }
  if (l.startsWith('hi')) {
    return 'मैं वैद्य दिशा हूँ, आपका अस्पताल सहायक। मैं केवल अस्पताल मार्गदर्शन, विभागों, कतार की स्थिति, रिपोर्ट और सुविधाओं से संबंधित प्रश्नों में ही मदद कर सकता हूँ।';
  }
  if (l.startsWith('te')) {
    return 'నేను వైద్య దిశ, మీ ఆసుపత్రి సహాయకుడిని. నేను ఆసుపత్రి మార్గదర్శకత్వం, విభాగాలు, క్యూ స్థితి, నివేదికలు మరియు సౌకర్యాలకు సంబంధించిన ప్రశ్నలలో మాత్రమే సహాయం చేయగలను.';
  }
  if (l.startsWith('ta')) {
    return 'நான் வைத்ய திஷா, உங்கள் மருத்துவமனை உதவியாளர். மருத்துவமனை வழிகாட்டுதல், துறைகள், வரிசை நிலை, அறிக்கைகள் மற்றும் வசதிகள் தொடர்பான கேள்விகளுக்கு மட்டுமே என்னால் உதவ முடியும்.';
  }
  if (l.startsWith('as')) {
    return 'মই বৈদ্য দিশা, আপোনাৰ চিকিৎসালয় সহায়ক। মই কেৱল চিকিৎসালয়ৰ পথ নিৰ্দেশনা, বিভাগ, শাৰীৰ স্থিতি, প্ৰতিবেদন আৰু সুবিধাসমূহৰ বিষয়েহে সহায় কৰিব পাৰোঁ।';
  }
  if (l.startsWith('bn')) {
    return 'আমি বৈদ্য দিশা, আপনার হাসপাতাল সহকারী। আমি শুধুমাত্র হাসপাতালের পথনির্দেশ, বিভাগ, লাইনের স্থিতি, রিপোর্ট এবং সুযোগ-সুবিধা সংক্রান্ত প্রশ্নে সাহায্য করতে পারি।';
  }
  if (l.startsWith('gu')) {
    return 'હું વૈદ્ય દિશા છું, તમારો હોસ્પિટલ સહાયક. હું ફક્ત હોસ્પિટલ નેવિગેશન, વિભાગો, કતારની સ્થિતિ, રિપોર્ટ્સ અને સુવિધાઓ સંબંધિત પ્રશ્નોમાં જ મદદ કરી શકું છું.';
  }
  if (l.startsWith('kn')) {
    return 'ನಾನು ವೈದ್ಯ ದಿಶಾ, ನಿಮ್ಮ ಆಸ್ಪತ್ರೆ ಸಹಾಯಕ. ನಾನು ಆಸ್ಪತ್ರೆಯ ಮಾರ್ಗದರ್ಶನ, ವಿಭಾಗಗಳು, ಸರದಿಯ ಸ್ಥಿತಿ, ವರದಿಗಳು ಮತ್ತು ಸೌಲಭ್ಯಗಳಿಗೆ ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆಗಳಿಗೆ ಮಾತ್ರ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.';
  }
  if (l.startsWith('ml')) {
    return 'ഞാൻ വൈദ്യ ദിശയാണ്, നിങ്ങളുടെ ആശുപത്രി സഹായി. ആശുപത്രി നാവിഗേഷൻ, ഡിപ്പാർട്ട്‌മെന്റുകൾ, ക്യൂ സ്റ്റാറ്റസ്, റിപ്പോർട്ടുകൾ, സൗകര്യങ്ങൾ എന്നിവയുമായി ബന്ധപ്പെട്ട ചോദ്യങ്ങളിൽ മാത്രമേ എനിക്ക് സഹായിക്കാനാകൂ.';
  }
  if (l.startsWith('pa')) {
    return 'ਮੈਂ ਵੈਦ ਦਿਸ਼ਾ ਹਾਂ, ਤੁਹਾਡਾ ਹਸਪਤਾਲ ਸਹਾਇਕ। ਮੈਂ ਸਿਰਫ਼ ਹਸਪਤਾਲ ਮਾਰਗਦਰਸ਼ਨ, ਵਿਭਾਗਾਂ, ਕਤਾਰ ਸਥਿਤੀ, ਰਿਪੋਰਟਾਂ ਅਤੇ ਸਹੂਲਤਾਂ ਨਾਲ ਸੰਬੰਧਿਤ ਸਵਾਲਾਂ ਵਿੱਚ ਹੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।';
  }
  if (l.startsWith('or')) {
    return 'ମୁଁ ବୈଦ୍ୟ ଦିଶା, ଆପଣଙ୍କର ହସ୍ପିଟାଲ ସହାୟକ। ମୁଁ କେବଳ ହସ୍ପିଟାଲ ମାର୍ଗଦର୍ଶନ, ବିଭାଗ, ଧାଡ଼ିର ସ୍ଥିତି, ରିପୋର୍ଟ ଏବଂ ସୁବିଧା ସମ୍ବନ୍ଧୀୟ ପ୍ରଶ୍ନରେ ସାହାଯ୍ୟ କରିପାରିବି।';
  }
  return 'I am Vaid Disha, your hospital assistant. I can only assist with hospital navigation, departments, queue status, lab reports, and facilities.';
}

function getActionsForQuery(query, replyText, slipId) {
  const text = (query + ' ' + replyText).toLowerCase();
  const actions = [];

  if (text.includes('login') || text.includes('sign in') || text.includes('signin') || text.includes('role') || text.includes('account') || text.includes('लॉगिन') || text.includes('साइन इन')) {
    return [
      { label: 'Login / Role Selection', route: '/role' },
      { label: 'Patient Start', route: '/patient/start' },
    ];
  }

  if (text.includes('emergency') || text.includes('trauma') || text.includes('आपात') || text.includes('तातडी')) {
    return [{ label: 'Emergency Assistance', route: '/patient/emergency' }];
  }
  if (text.includes('room') || text.includes('cabin') || text.includes('where is') || text.includes('direction') || text.includes('dermatology') || text.includes('cardiology') || text.includes('clinic') || text.includes('कमरा') || text.includes('खोली') || text.includes('मार्ग')) {
    actions.push({ label: 'Turn-by-turn Guidance', route: slipId ? `/patient/guidance/${slipId}` : '/patient/guidance' });
    if (slipId) actions.push({ label: 'View Visit Slip', route: `/patient/slip/${slipId}` });
    else actions.push({ label: 'Hospital Facilities Map', route: '/patient/facilities' });
  }
  if (text.includes('queue') || text.includes('wait') || text.includes('token') || text.includes('कतार') || text.includes('प्रतीक्षा') || text.includes('रांग')) {
    actions.push({ label: 'Live Queue Status', route: '/patient/live' });
  }
  if (text.includes('washroom') || text.includes('toilet') || text.includes('शौचालय') || text.includes('प्रसाधन')) {
    actions.push({ label: 'Washrooms Map', route: '/patient/facilities?filter=washroom' });
  }
  if (text.includes('wheelchair') || text.includes('ramp') || text.includes('lift') || text.includes('elevator')) {
    actions.push({ label: 'Accessibility & Ramps', route: '/patient/facilities?filter=wheelchair' });
  }
  if (text.includes('report') || text.includes('blood') || text.includes('cbc') || text.includes('अहवाल')) {
    actions.push({ label: 'My Lab Reports', route: '/patient/reports' });
  }
  if (actions.length === 0) {
    if (slipId) {
      actions.push({ label: 'Turn-by-turn Guidance', route: `/patient/guidance/${slipId}` });
      actions.push({ label: 'Live Queue Status', route: '/patient/live' });
    } else {
      actions.push({ label: 'Hospital Facilities Map', route: '/patient/facilities' });
      actions.push({ label: 'Register Visit', route: '/patient/visit' });
    }
  }
  return actions.slice(0, 2);
}

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
  if (groqKey || sarvamKey) return true;
  sendJson(response, 503, { error: 'Voice assistant server is not configured.' });
  return false;
}

function languageCode(language) {
  if (!language || language === 'auto') return 'auto';
  const code = language.toLowerCase().slice(0, 2);
  return `${code === 'en' ? 'en' : code}-IN`;
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

async function callGroqChat(messages) {
  const models = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];
  for (const model of models) {
    try {
      const res = await fetch(`${groqBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.1,
          max_tokens: 160,
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (content) return content;
    } catch {
      // try next
    }
  }
  throw new Error('Groq chat models did not return a response.');
}

const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'http://localhost:5173');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return; }
  if (request.method === 'GET' && request.url === '/api/health') {
    sendJson(response, 200, { configured: Boolean(groqKey || sarvamKey), groqConfigured: Boolean(groqKey), emailConfigured: Boolean(resendKey) });
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
    if (request.url === '/api/admin/analyze-layout') {
      const body = JSON.parse(raw.toString('utf8') || '{}');
      const image = body.image || '';
      if (!image) {
        sendJson(response, 400, { error: 'Image data is required.' });
        return;
      }
      const layoutData = await analyzeLayoutWithGroq(image, groqKey);
      sendJson(response, 200, layoutData);
      return;
    }
    if (!assertConfigured(response)) return;

    if (request.url === '/api/chat') {
      const requestBody = JSON.parse(raw.toString('utf8'));
      const message = String(requestBody.message || '').trim().slice(0, 800);
      const language = String(requestBody.language || 'en');
      if (!message) { sendJson(response, 400, { error: 'A message is required.' }); return; }

      // Strict off-topic rejection
      if (isOffTopic(message)) {
        const refusal = getOffTopicRefusal(language);
        sendJson(response, 200, {
          text: refusal,
          language,
          actions: [
            { label: 'Hospital Facilities', route: '/patient/facilities' },
            { label: 'Emergency Help', route: '/patient/emergency' },
          ],
        });
        return;
      }

      const context = requestBody.context || {};
      const contextSnippet = `\nPatient Session Context:
- Slip/Token: ${context.slipId || 'Guest / Not registered'}
- Department: ${context.department || 'General OPD'}
- Location: ${context.currentLocation || 'Main Lobby'}
- Accessibility: ${context.accessibilityNeeds?.length ? context.accessibilityNeeds.join(', ') : 'None'}`;

      const langInfo = INDIAN_LANGUAGE_NAMES[language] || { name: 'English', native: 'English' };
      const langDirective = langInfo.name === 'English'
        ? '\nCRITICAL LANGUAGE DIRECTIVE: The user language is English. Reply purely in English.'
        : `\nCRITICAL LANGUAGE DIRECTIVE (MANDATORY & ABSOLUTE):
The user has chosen to communicate in ${langInfo.name} (${langInfo.native}).
You MUST formulate your entire response EXCLUSIVELY and STRICTLY in ${langInfo.name} using its official native script (${langInfo.native}).
- DO NOT reply in English or Hindi or any other language.
- DO NOT use Romanized/Latin transliteration.
- Write natural, polite, respectful, and fluent ${langInfo.name} in ${langInfo.native} script.
- Keep the response concise, clear, and under 60 words.`;

      const messages = [
        { role: 'system', content: hospitalPrompt + '\n' + langDirective + contextSnippet },
        ...safeHistory(requestBody.history),
        { role: 'user', content: message },
      ];

      let replyText = '';
      if (groqKey) {
        try {
          replyText = await callGroqChat(messages);
        } catch (err) {
          console.warn('Groq backend call failed, trying fallback:', err);
        }
      }

      if (!replyText && sarvamKey) {
        try {
          const upstream = await sarvam('/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'sarvam-105b-conversations',
              temperature: 0.1,
              max_tokens: 150,
              messages,
            }),
          });
          if (upstream.ok) {
            const data = await upstream.json();
            replyText = String(data.choices?.[0]?.message?.content || '');
          }
        } catch {
          // ignore
        }
      }

      if (!replyText) {
        replyText = getOffTopicRefusal(language);
      }

      const actions = getActionsForQuery(message, replyText, context.slipId);
      sendJson(response, 200, { text: replyText, language, actions });
      return;
    }

    if (request.url === '/api/voice/synthesize') {
      const requestBody = JSON.parse(raw.toString('utf8'));
      const text = String(requestBody.text || '').trim().slice(0, 2500);
      if (!text) { sendJson(response, 400, { error: 'Text is required.' }); return; }
      if (sarvamKey) {
        const upstream = await sarvam('/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, language_code: languageCode(requestBody.language), model: 'bulbul:v3', speaker: 'shubh', output_audio_codec: 'wav' }),
        });
        if (upstream.ok) {
          const data = await upstream.json();
          const audio = data.audios?.[0];
          if (audio) {
            const buffer = Buffer.from(audio, 'base64');
            response.writeHead(200, { 'Content-Type': 'audio/wav', 'Cache-Control': 'private, max-age=3600' });
            response.end(buffer);
            return;
          }
        }
      }
      sendJson(response, 503, { error: 'Audio synthesis unavailable.' });
      return;
    }

    if (request.url === '/api/voice/transcribe') {
      // First try Groq Whisper for blazing fast ~150ms transcription
      if (groqKey) {
        try {
          const contentType = request.headers['content-type'] || 'application/octet-stream';
          const upstream = await fetch(`${groqBaseUrl}/audio/transcriptions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey}`,
              'Content-Type': contentType,
            },
            body: raw,
          });
          if (upstream.ok) {
            const data = await upstream.json();
            const transcript = data.text?.trim() || data.transcript?.trim() || '';
            sendJson(response, 200, { transcript, language: 'auto' });
            return;
          }
        } catch {
          // fall through to Sarvam
        }
      }

      if (sarvamKey) {
        const upstream = await sarvam('/speech-to-text', { method: 'POST', headers: { 'Content-Type': request.headers['content-type'] || 'application/octet-stream' }, body: raw });
        if (upstream.ok) {
          const data = await upstream.json();
          sendJson(response, 200, { transcript: data.transcript || '', language: data.language_code || 'auto' });
          return;
        }
      }

      sendJson(response, 502, { error: 'Transcription unavailable.' });
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
