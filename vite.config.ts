import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

function emailDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'email-dev-plugin',
    configureServer(server) {
      if (!process.env.RESEND_API_KEY && env.RESEND_API_KEY) {
        process.env.RESEND_API_KEY = env.RESEND_API_KEY;
      }
      if (!process.env.RESEND_FROM_EMAIL && env.RESEND_FROM_EMAIL) {
        process.env.RESEND_FROM_EMAIL = env.RESEND_FROM_EMAIL;
      }

      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url || '';
        if (!url.startsWith('/api/email/')) {
          return next();
        }

        const pathname = url.split('?')[0];
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        const chunks: Buffer[] = [];
        req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        req.on('end', async () => {
          let body: Record<string, unknown> = {};
          try {
            const raw = Buffer.concat(chunks).toString('utf-8');
            body = raw ? JSON.parse(raw) : {};
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            return;
          }

          res.setHeader('Content-Type', 'application/json');

          try {
            // Dynamically import server email handlers
            const emailModule = await import('./server/email.mjs');
            if (pathname === '/api/email/send-otp') {
              const result = await emailModule.sendVerificationOtp(body as any);
              res.statusCode = 200;
              res.end(JSON.stringify(result));
              return;
            }

            if (pathname === '/api/email/verify-otp') {
              const result = emailModule.verifyOtp(body as any);
              res.statusCode = 200;
              res.end(JSON.stringify(result));
              return;
            }

            if (pathname === '/api/email/activity') {
              const result = await emailModule.sendActivityEmail(body as any);
              res.statusCode = 200;
              res.end(JSON.stringify(result));
              return;
            }

            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Email endpoint not found' }));
          } catch (err: any) {
            res.statusCode = err?.status || 500;
            res.end(
              JSON.stringify({
                error: err?.message || 'Server error occurred while handling email request.',
                details: err?.details,
              })
            );
          }
        });
      });
    },
  };
}

function groqDevPlugin(env: Record<string, string>): Plugin {
  const groqKey = (env.GROQ_API_KEY || env.VITE_GROQ_API_KEY || '').trim();

  const hospitalPrompt = `You are Vaid Disha (वैद्य दिशा), the smart AI hospital wayfinding and patient assistant for Vaid Disha Multi-Specialty Hospital and its web application.

YOUR PURPOSE AND SCOPE:
- You answer questions related to the hospital: medical departments, clinics, doctors, symptoms/reasons for visit, physical room locations, floors, facilities, queue wait times, visit slips, lab reports, and how to use the Vaid Disha web app (such as login, role selection, registering visits, and emergency routing).
- For ANY hospital department (like Dermatology, Cardiology, etc.), doctor, room, symptom, or app feature (like login, registration, slip, reports), ALWAYS answer helpfully with the exact details.

STRICT BOUNDARY (MANDATORY):
- ONLY refuse questions that are completely unrelated to the hospital, medical care, or the Vaid Disha web app (e.g. math puzzles like "what is 2+2", coding, recipes, general trivia, politics).
- If and only if a question is totally unrelated to the hospital or app (like "what is 2+2"), politely say: "I am Vaid Disha, your hospital and patient navigation assistant. I can only assist with hospital services, departments, clinics, queue status, reports, facilities, and app navigation." (in the user's language).
- Reply in the language of the user's query (English, Hindi, or Marathi).
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

  function isOffTopic(text: string) {
    const q = String(text || '').trim().toLowerCase();
    const mathPattern = /^(what\s+is\s+)?(\d+\s*[\+\-\*\/xX÷]\s*\d+)|^\d+\s*[\+\-\*\/xX÷]\s*\d+/;
    const indicMath = /^[०-९\d\s\+\-\*\/xX÷=]+$|^(२\s*अधिक\s*२|2\s*plus\s*2)/i;
    const randomTopics = /^(who\s+is\s+(the\s+)?president|who\s+won|write\s+(a\s+)?code|write\s+(a\s+)?python|tell\s+me\s+a\s+joke|what\s+is\s+the\s+capital|recipe\s+for|weather\s+in)/i;
    return mathPattern.test(q) || indicMath.test(q) || randomTopics.test(q);
  }

  function getRefusal(lang: string) {
    const l = String(lang || 'en').toLowerCase();
    if (l.startsWith('mr')) return 'मी वैद्य दिशा आहे, आपला रुग्णालय सहाय्यक. मी केवळ रुग्णालय मार्गदर्शन, विभाग, रांगेची स्थिती, अहवाल आणि सुविधांशी संबंधित प्रश्नांमध्येच मदत करू शकतो.';
    if (l.startsWith('hi')) return 'मैं वैद्य दिशा हूँ, आपका अस्पताल सहायक। मैं केवल अस्पताल मार्गदर्शन, विभागों, कतार की स्थिति, रिपोर्ट और सुविधाओं से संबंधित प्रश्नों में ही मदद कर सकता हूँ।';
    return 'I am Vaid Disha, your hospital assistant. I can only assist with hospital navigation, departments, queue status, lab reports, and facilities.';
  }

  function getActions(query: string, replyText: string, slipId?: string) {
    const text = (query + ' ' + replyText).toLowerCase();
    const actions: Array<{ label: string; route: string }> = [];

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

  return {
    name: 'groq-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url || '';
        if (url === '/api/chat' && req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}');
              const message = String(body.message || '').trim();
              const lang = String(body.language || 'en');

              if (!message) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Message is required' }));
                return;
              }

              // Off-topic check (2+2)
              if (isOffTopic(message)) {
                res.statusCode = 200;
                res.end(JSON.stringify({
                  text: getRefusal(lang),
                  language: lang,
                  actions: [
                    { label: 'Hospital Facilities', route: '/patient/facilities' },
                    { label: 'Emergency Help', route: '/patient/emergency' },
                  ],
                }));
                return;
              }

              const context = body.context || {};
              const contextSnippet = `\nPatient Session Context:
- Slip/Token: ${context.slipId || 'Guest / Not registered'}
- Department: ${context.department || 'General OPD'}
- Location: ${context.currentLocation || 'Main Lobby'}
- Accessibility: ${context.accessibilityNeeds?.length ? context.accessibilityNeeds.join(', ') : 'None'}`;

              const messages = [
                { role: 'system', content: hospitalPrompt + contextSnippet },
                ...(body.history || []).slice(-4).map((h: any) => ({
                  role: h.role === 'assistant' ? 'assistant' : 'user',
                  content: String(h.text || ''),
                })),
                { role: 'user', content: message },
              ];

              const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${groqKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'qwen/qwen3.8-27b',
                  messages,
                  temperature: 0.1,
                  max_tokens: 160,
                }),
              });

              let replyText = '';
              if (groqRes.ok) {
                const data: any = await groqRes.json();
                replyText = data?.choices?.[0]?.message?.content?.trim() || '';
              } else {
                // Fallback to gpt-oss-120b
                const fallbackRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${groqKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    model: 'openai/gpt-oss-120b',
                    messages,
                    temperature: 0.1,
                    max_tokens: 160,
                  }),
                });
                if (fallbackRes.ok) {
                  const fbData: any = await fallbackRes.json();
                  replyText = fbData?.choices?.[0]?.message?.content?.trim() || '';
                }
              }

              if (!replyText) {
                replyText = getRefusal(lang);
              }

              const actions = getActions(message, replyText, context.slipId);
              res.statusCode = 200;
              res.end(JSON.stringify({ text: replyText, language: lang, actions }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err?.message || 'Chat error' }));
            }
          });
          return;
        }

        if (url === '/api/voice/transcribe' && req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const raw = Buffer.concat(chunks);
              const upstream = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${groqKey}`,
                  'Content-Type': req.headers['content-type'] || 'application/octet-stream',
                },
                body: raw,
              });

              if (upstream.ok) {
                const data: any = await upstream.json();
                res.statusCode = 200;
                res.end(JSON.stringify({ transcript: data?.text || data?.transcript || '', language: 'auto' }));
                return;
              }

              res.statusCode = 502;
              res.end(JSON.stringify({ error: 'Transcription unavailable' }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err?.message || 'Voice error' }));
            }
          });
          return;
        }

        if (url === '/api/admin/analyze-layout' && req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}');
              const image = body.image || '';
              if (!image) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Image data is required' }));
                return;
              }
              const analyzer = await import('./server/layoutAnalyzer.mjs');
              const layoutData = await analyzer.analyzeLayoutWithGroq(image, groqKey);
              res.statusCode = 200;
              res.end(JSON.stringify(layoutData));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err?.message || 'Layout analysis failed' }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), emailDevPlugin(env), groqDevPlugin(env)],
    server: {
      proxy: {
        // Proxy any other remaining /api endpoints to port 8787 if running
        '^/api/(?!email|chat|voice)': {
          target: 'http://localhost:8787',
          changeOrigin: true,
        },
      },
    },
  };
})

