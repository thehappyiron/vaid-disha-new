/**
 * Server-side Groq Vision Layout Digitizer Analyzer
 * Analyzes uploaded architectural blueprints / floor plan images using Groq Multimodal Vision (qwen/qwen3.8-27b)
 * and extracts 2D room boundaries, corridors, and navigational landmarks.
 */

const TYPE_COLORS = {
  emergency: '#ef4444',     // Red
  consultation: '#0284c7',  // Blue
  lab: '#0d9488',           // Teal
  pharmacy: '#d97706',      // Amber
  reception: '#6366f1',     // Indigo
  lobby: '#6366f1',         // Indigo
  patient_room: '#3b82f6',  // Light Blue
  washroom: '#10b981',      // Emerald
  admin: '#64748b',         // Slate
};

const DEFAULT_ROOMS = [
  { id: 'r1', name: 'Emergency & Trauma Triage', code: 'ER-01', type: 'emergency', x: 90, y: 120, width: 120, height: 85, color: '#ef4444' },
  { id: 'r2', name: 'General Medicine OPD', code: 'OPD-101', type: 'consultation', x: 230, y: 120, width: 110, height: 85, color: '#0284c7' },
  { id: 'r3', name: 'Central Diagnostic Lab', code: 'LAB-01', type: 'lab', x: 450, y: 120, width: 110, height: 85, color: '#0d9488' },
  { id: 'r4', name: 'Central Pharmacy', code: 'PH-01', type: 'pharmacy', x: 580, y: 120, width: 120, height: 85, color: '#d97706' },
  { id: 'r5', name: 'Radiology & Sonography', code: 'RAD-01', type: 'lab', x: 90, y: 280, width: 120, height: 85, color: '#0d9488' },
  { id: 'r6', name: 'Reception & Registration', code: 'REC-01', type: 'reception', x: 230, y: 280, width: 120, height: 85, color: '#6366f1' },
  { id: 'r7', name: 'Pediatrics Consultation', code: 'OPD-102', type: 'consultation', x: 450, y: 280, width: 110, height: 85, color: '#0284c7' },
  { id: 'r8', name: 'Billing & Insurance Desk', code: 'ADM-01', type: 'admin', x: 580, y: 280, width: 120, height: 85, color: '#64748b' },
];

const DEFAULT_CORRIDORS = [
  { x1: 60, y1: 235, x2: 740, y2: 235, label: 'Main Arterial Corridor' },
  { x1: 390, y1: 70, x2: 390, y2: 410, label: 'Central Wayfinding Spine' },
];

const DEFAULT_ENTRANCE = {
  name: 'Main Public Entrance Gate',
  x: 390,
  y: 430,
};

function sanitizeLayoutResult(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      hospitalName: 'Vaid Disha Medical Center - Digitized Floor Plan',
      wing: 'Clinical Ground Floor Wing',
      overview: 'Synthesized 2D wayfinding schematic with identified emergency triage, OPD clinics, diagnostics, and central reception spine.',
      detectedRooms: DEFAULT_ROOMS,
      corridors: DEFAULT_CORRIDORS,
      entrance: DEFAULT_ENTRANCE,
      source: 'synthesized_default',
    };
  }

  const hospitalName = String(raw.hospitalName || 'Digitized Hospital Layout').trim();
  const wing = String(raw.wing || 'Main Floor Wing').trim();
  const overview = String(raw.overview || 'AI-identified architectural layout with mapped rooms and navigation corridors.').trim();

  let detectedRooms = Array.isArray(raw.detectedRooms) ? raw.detectedRooms : [];
  if (detectedRooms.length === 0) {
    detectedRooms = DEFAULT_ROOMS;
  } else {
    detectedRooms = detectedRooms.map((room, idx) => {
      const type = String(room.type || 'consultation').toLowerCase().replace(/\s+/g, '_');
      const normalizedType = TYPE_COLORS[type] ? type : 'consultation';
      const color = room.color || TYPE_COLORS[normalizedType] || '#0284c7';
      const x = Math.max(40, Math.min(680, Number(room.x) || 100 + (idx * 60) % 550));
      const y = Math.max(40, Math.min(380, Number(room.y) || 120 + Math.floor(idx / 4) * 150));
      const width = Math.max(70, Math.min(180, Number(room.width) || 100));
      const height = Math.max(50, Math.min(140, Number(room.height) || 80));

      return {
        id: String(room.id || `r${idx + 1}`),
        name: String(room.name || `Unit ${idx + 1}`),
        code: String(room.code || `U-${100 + idx}`),
        type: normalizedType,
        x,
        y,
        width,
        height,
        color,
      };
    });
  }

  let corridors = Array.isArray(raw.corridors) ? raw.corridors : [];
  if (corridors.length === 0) {
    corridors = DEFAULT_CORRIDORS;
  } else {
    corridors = corridors.map((c, i) => ({
      x1: Number(c.x1) || 80,
      y1: Number(c.y1) || 240,
      x2: Number(c.x2) || 720,
      y2: Number(c.y2) || 240,
      label: String(c.label || `Corridor Segment ${i + 1}`),
    }));
  }

  const entrance = raw.entrance && typeof raw.entrance === 'object'
    ? {
        name: String(raw.entrance.name || 'Main Entrance Gate'),
        x: Math.max(60, Math.min(740, Number(raw.entrance.x) || 390)),
        y: Math.max(60, Math.min(460, Number(raw.entrance.y) || 430)),
      }
    : DEFAULT_ENTRANCE;

  return {
    hospitalName,
    wing,
    overview,
    detectedRooms,
    corridors,
    entrance,
    source: 'groq_vision_analyzed',
  };
}

export async function analyzeLayoutWithGroq(imageBase64, groqKey) {
  let imageUrl = String(imageBase64 || '').trim();
  if (!imageUrl.startsWith('data:image/')) {
    imageUrl = `data:image/jpeg;base64,${imageUrl}`;
  }

  const systemPrompt = `You are an expert architectural blueprint AI and hospital spatial wayfinding engine.
Analyze this uploaded hospital architectural floor plan / layout photograph.
Identify the building wing, main entrance, corridors, and 4 to 8 prominent rooms/facilities (Emergency, OPD clinics, Diagnostics/Lab, Pharmacy, Reception, Admin).
Translate their visual locations into 2D coordinates within an 800x480 coordinate space.

Return STRICTLY a compact JSON object with this exact structure:
{
  "hospitalName": "Extracted hospital name (or inferred from layout)",
  "wing": "e.g. Ground Floor - East Ambulatory Wing",
  "overview": "Concise 1-2 sentence description of identified architecture",
  "detectedRooms": [
    {
      "id": "r1",
      "name": "Emergency Care",
      "code": "ER-01",
      "type": "emergency",
      "x": 100,
      "y": 120,
      "width": 110,
      "height": 80
    }
  ],
  "corridors": [
    {
      "x1": 80,
      "y1": 240,
      "x2": 720,
      "y2": 240,
      "label": "Main Central Corridor"
    }
  ],
  "entrance": {
    "name": "Main Entrance Gate",
    "x": 400,
    "y": 430
  }
}

Keep detectedRooms between 4 and 8 rooms total.
Room "type" must be one of: 'emergency', 'consultation', 'lab', 'pharmacy', 'reception', 'lobby', 'admin', 'washroom', 'patient_room'.
All coordinates must fit within 800 width by 480 height.
Return ONLY the raw JSON object. Do not include markdown ticks or conversational text.`;

  if (!groqKey) {
    return sanitizeLayoutResult(null);
  }

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: systemPrompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 850,
      }),
    });

    if (!upstream.ok) {
      console.warn('Groq Vision upstream status:', upstream.status);
      return sanitizeLayoutResult(null);
    }

    const data = await upstream.json();
    const content = data.choices?.[0]?.message?.content || '';
    const cleaned = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    
    let parsed = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Partial JSON recovery
      const nameMatch = cleaned.match(/"hospitalName"\s*:\s*"([^"]+)"/i);
      const wingMatch = cleaned.match(/"wing"\s*:\s*"([^"]+)"/i);
      const overviewMatch = cleaned.match(/"overview"\s*:\s*"([^"]+)"/i);
      const roomChunks = cleaned.match(/\{[^{}]*"(?:id|name)"[^{}]*\}/g);
      const recoveredRooms = [];
      if (roomChunks) {
        for (const chunk of roomChunks) {
          try {
            const r = JSON.parse(chunk);
            if (r.name || r.id) recoveredRooms.push(r);
          } catch {}
        }
      }
      if (recoveredRooms.length > 0) {
        parsed = {
          hospitalName: nameMatch ? nameMatch[1] : 'Identified Hospital Layout',
          wing: wingMatch ? wingMatch[1] : 'Ground Floor Wing',
          overview: overviewMatch ? overviewMatch[1] : 'Extracted room topology and navigation corridors from floorplan.',
          detectedRooms: recoveredRooms,
        };
      }
    }

    return sanitizeLayoutResult(parsed);
  } catch (err) {
    console.warn('Groq layout analysis parse error, falling back:', err?.message);
    return sanitizeLayoutResult(null);
  }
}

