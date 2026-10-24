# Vaid Disha: Backend Engineering Handoff Specification
### Transitioning In-Memory Mock Services to Production REST & WebSocket Architecture

This document specifies the exact endpoints, payload schemas, and real-time infrastructure required to transition the frontend client services from in-memory mocks to a production backend.

---

## 🔒 Security & Secrets Requirement

> **CRITICAL**: The **Sarvam AI API key (`SARVAM_API_KEY`)** and any other sensitive credentials **must strictly live on the backend server**.
> The client frontend must never bundle or expose AI API keys. The browser talks exclusively to the backend gateway (`VITE_API_BASE_URL`), which proxies and authenticates requests to Sarvam AI or internal LLMs.

### Environment Variables (.env)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | Root URL for REST APIs and WebSocket endpoints |
| `VITE_CHAT_PROVIDER` | `mock` (or `sarvam`, `http`) | Active chatbot provider engine |

---

## 🌐 Real-Time Multi-Device Synchronization

In the frontend prototype, real-time live synchronization operates across tabs within the same browser instance via the HTML5 `BroadcastChannel` API (`vd_live_store_sync_channel`).

**For multi-device synchronization across patient smartphones and hospital staff desktops**:
- The backend must provide a **WebSocket** (`ws://.../ws/live-store`) or **Server-Sent Events (SSE)** connection (`GET /api/v1/live/stream`).
- When a staff member changes wait times, calls a token, or resolves an emergency, the backend broadcasts the change to all subscribed room channels.

---

## 📋 Comprehensive Service Mapping Table

| Service Area | Current Frontend File | Key Functions | Key TypeScript Types | Proposed Production Endpoint | Protocol |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication & Profile** | `src/context/AuthContext.tsx` | `login(phone, otp)`, `loginAsGuest()`, `logout()` | `UserProfile`, `Role`, `UserVisit` | `POST /auth/otp/send`<br>`POST /auth/otp/verify`<br>`POST /auth/guest` | REST (HTTPS) |
| **Outpatient Slips** | `src/services/hospitalService.ts` | `generateSlip(input)`, `getSlipById(id)`, `getPatientSlipHistory(userId)` | `Slip`, `Department`, `AccessibilityNeed` | `POST /slips/create`<br>`GET /slips/:id`<br>`GET /patients/:id/slips` | REST (HTTPS) |
| **Live Queue & Store** | `src/services/liveStore.ts` | `getDepartmentLiveStatus()`, `setDepartmentWaitTime()`, `setDepartmentCustomStatus()`, `startPatientConsultation()`, `completePatientConsultation()` | `LiveStoreState`, `QueueEntry`, `DepartmentLiveStatus` | `GET /live/queue`<br>`POST /live/queue/consult/start`<br>`POST /live/queue/consult/complete`<br>`PATCH /live/department/:id/status` | REST & WebSocket (`ws://.../ws/queue`) |
| **Smart Queue Engine** | `src/services/queueEngine.ts` | `sortQueueWithEngine(queue, settings)`, `getPatientPriorityExplanation(entry)` | `SmartQueueSettings`, `QueueEntry` | `POST /live/queue/recalculate`<br>`GET /live/queue/priority-explanation/:token` | REST / Backend Job |
| **Emergency Alerts** | `src/services/liveStore.ts` | `createEmergencyAlert(params)`, `acknowledgeEmergencyAlert(id)`, `resolveEmergencyAlert(id)` | `EmergencyRequest`, `LiveAlert` | `POST /emergency/alert`<br>`POST /emergency/:id/acknowledge`<br>`POST /emergency/:id/resolve` | REST + WebSocket (`/ws/emergencies`) |
| **Real-time Notifications** | `src/services/liveStore.ts` | `addNotification()`, `markNotificationAsRead()`, `clearAllNotifications()` | `PatientNotification`, `NotificationTriggerType` | `GET /notifications`<br>`PATCH /notifications/:id/read`<br>`POST /notifications/push` (WebPush) | REST & SSE (`/notifications/stream`) |
| **Diagnostic Lab Reports** | `src/data/labReportsData.ts` | `getPatientReports(userId)`, `getReportById(id)` | `LabReport`, `ReportParameter`, `ReportStatus` | `GET /patients/:id/reports`<br>`GET /reports/:id`<br>`GET /reports/:id/pdf` | REST (HTTPS) |
| **Facilities Directory** | `src/data/facilitiesData.ts` | `getHospitalFacilities(floor, category)` | `FacilityPin`, `FacilityCategory` | `GET /facilities?floor=X&category=Y` | REST (Cached CDN) |
| **Hospital Graph & Wayfinding**| `src/services/hospitalService.ts` | `findShortestAccessiblePath(graph, startId, endId, needs)` | `HospitalGraph`, `FloorMapPath`, `HospitalEdge` | `POST /navigation/route`<br>`GET /navigation/graph` | REST (Cached GeoJSON / Vector) |
| **AI Help Chatbot** | `src/services/chatbot/` | `sendChatMessage(text, lang, context)` | `ChatMessage`, `ChatResponse`, `ChatAction` | `POST /chat/completions` (Proxies Sarvam AI with Hospital RAG context) | REST (Streaming / SSE) |
| **Multilingual Voice (TTS/STT)** | `src/services/voice/` | `textToSpeech.speak()`, `speechToText.startListening()` | `SarvamTTSRequest`, `SarvamSTTResponse` | `POST /voice/synthesize`<br>`POST /voice/transcribe` | REST (Streams audio chunks) |

---

## 🗄 Recommended Database Entities

### 1. `patients`
- `id` (UUID, PK)
- `abha_id` (VARCHAR, Indexed, Nullable)
- `phone` (VARCHAR, Indexed)
- `full_name` (VARCHAR)
- `age` (INT)
- `gender` (VARCHAR)
- `blood_group` (VARCHAR)
- `is_guest` (BOOLEAN)
- `created_at` (TIMESTAMP)

### 2. `encounters` / `slips`
- `id` (UUID, PK)
- `token_number` (VARCHAR, Indexed, e.g. `CARD-1042`)
- `patient_id` (UUID, FK -> `patients.id`)
- `department_id` (VARCHAR, FK -> `departments.id`)
- `doctor_id` (UUID, Nullable)
- `room_number` (VARCHAR)
- `floor` (INT)
- `purpose` (TEXT)
- `accessibility_needs` (TEXT[] / JSONB)
- `status` (`waiting`, `turn_soon`, `in_progress`, `completed`, `cancelled`)
- `created_at`, `called_at`, `completed_at` (TIMESTAMP)

### 3. `emergencies`
- `id` (UUID, PK)
- `patient_token` (VARCHAR, Nullable)
- `patient_name` (VARCHAR, Nullable)
- `landmark` (VARCHAR, e.g. `"2nd Floor Near Lift B"`)
- `symptoms` (TEXT[] / JSONB)
- `note` (TEXT)
- `status` (`alerted`, `responding`, `resolved`)
- `created_at`, `resolved_at` (TIMESTAMP)

### 4. `lab_reports`
- `id` (UUID, PK)
- `patient_id` (UUID, FK -> `patients.id`)
- `encounter_id` (UUID, FK -> `encounters.id`)
- `test_name` (VARCHAR)
- `category` (VARCHAR, e.g. `Hematology`, `Biochemistry`)
- `status` (`ready`, `in_progress`, `pending`)
- `summary` (TEXT)
- `parameters` (JSONB: array of `{ name, value, unit, normalRange, isNormal, flag }`)
- `created_at` (TIMESTAMP)
