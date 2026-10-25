import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Upload,
  Sparkles,
  Compass,
  Layers,
  AlertCircle,
  Lock,
  LogOut,
  Navigation,
  FileImage,
  RefreshCw,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { BaseLayout } from '../../components/layout';
import { Button, Card, StatusBadge, PageHeader } from '../../components/ui';

interface DetectedRoom {
  id: string;
  name: string;
  code: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

interface CorridorSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
}

interface EntrancePoint {
  name: string;
  x: number;
  y: number;
}

interface DigitizedLayout {
  hospitalName: string;
  wing: string;
  overview: string;
  detectedRooms: DetectedRoom[];
  corridors: CorridorSegment[];
  entrance: EntrancePoint;
  source: string;
}

const ROOM_COLORS: Record<string, string> = {
  emergency: '#ef4444',
  consultation: '#0284c7',
  lab: '#0d9488',
  pharmacy: '#d97706',
  reception: '#6366f1',
  lobby: '#6366f1',
  admin: '#64748b',
  washroom: '#10b981',
  patient_room: '#3b82f6',
};

const ROOM_LABELS: Record<string, string> = {
  emergency: 'Emergency / Triage',
  consultation: 'OPD Consultation',
  lab: 'Diagnostics & Lab',
  pharmacy: 'Central Pharmacy',
  reception: 'Reception & Triage',
  lobby: 'Waiting Lobby',
  admin: 'Administration',
  washroom: 'Accessible Restroom',
  patient_room: 'Patient Inpatient Room',
};

export function AdminLayoutDigitizerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('vaid_admin_authenticated') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Upload & Digitization state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [digitizedLayout, setDigitizedLayout] = useState<DigitizedLayout | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'plan' | 'original' | 'split'>('plan');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to digitized map when ready
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (digitizedLayout && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [digitizedLayout]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'admin' && password.trim() === 'admin123') {
      sessionStorage.setItem('vaid_admin_authenticated', 'true');
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid administrator credentials. Use demo: admin / admin123');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('vaid_admin_authenticated');
    setIsAuthenticated(false);
    setImagePreview(null);
    setImageFile(null);
    setDigitizedLayout(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|jpg)$/i)) {
      setErrorMsg('Please upload an image file in JPG or PNG format.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds 10MB limit. Please upload a smaller image.');
      return;
    }

    setErrorMsg('');
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSampleBlueprint = async () => {
    setErrorMsg('');
    try {
      const response = await fetch('/demo-hospital-layout.png');
      const blob = await response.blob();
      const file = new File([blob], 'demo-hospital-layout.png', { type: 'image/png' });
      setImageFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(blob);
    } catch {
      setErrorMsg('Could not load sample layout. Please browse your device for a JPG/PNG file.');
    }
  };

  const handleAnalyzeWithGroq = async () => {
    if (!imagePreview) {
      setErrorMsg('Please select or upload a layout image first.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg('');
    setAnalyzeStep('Uploading layout image for vision analysis...');

    try {
      setTimeout(() => {
        setAnalyzeStep('Identifying architectural wings & corridor pathways...');
      }, 700);

      setTimeout(() => {
        setAnalyzeStep('Extracting consultation rooms, triage nodes, and facility coordinates...');
      }, 1400);

      const res = await fetch('/api/admin/analyze-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imagePreview }),
      });

      if (!res.ok) {
        throw new Error(`Analysis service returned status ${res.status}`);
      }

      const data: DigitizedLayout = await res.json();
      setDigitizedLayout(data);
      if (data.detectedRooms?.length > 0) {
        setSelectedRoomId(data.detectedRooms[0].id);
      }
    } catch (err: any) {
      console.error('Groq layout digitization error:', err);
      setErrorMsg('Layout analysis failed. Using architectural recovery layout for demo.');
    } finally {
      setIsAnalyzing(false);
      setAnalyzeStep('');
    }
  };

  const selectedRoom = digitizedLayout?.detectedRooms.find((r) => r.id === selectedRoomId);

  // Generate dynamic 2D navigation route from entrance to selected room
  const routePoints = (() => {
    if (!digitizedLayout || !selectedRoom) return [];
    const ent = digitizedLayout.entrance;
    const roomCenterX = selectedRoom.x + selectedRoom.width / 2;
    const roomCenterY = selectedRoom.y + selectedRoom.height / 2;

    // Route: Entrance -> Main Corridor Y (240) -> Room Corridor Intersection -> Room Door Center
    const corridorY = digitizedLayout.corridors[0]?.y1 || 240;
    return [
      { x: ent.x, y: ent.y },
      { x: ent.x, y: corridorY },
      { x: roomCenterX, y: corridorY },
      { x: roomCenterX, y: roomCenterY },
    ];
  })();

  const routePathD = routePoints.length
    ? `M ${routePoints[0].x} ${routePoints[0].y} ` +
      routePoints.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
    : '';

  return (
    <BaseLayout showHome={true} headerTitle={t('app.name')}>
      <div className="page-container py-6">
        <PageHeader
          title="Hospital Administration"
          subtitle="AI Architectural Blueprint Digitizer & 2D Floor Plan Generator"
          showBack={true}
          onBack={() => navigate('/')}
        />

        {/* STEP 1: ADMIN LOGIN GATE */}
        {!isAuthenticated ? (
          <div className="max-w-lg mx-auto w-full mt-4">
            <Card className="p-6 sm:p-8 bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-md rounded-2xl">
              <div className="flex flex-col items-center text-center gap-3 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[var(--color-primary-600)] flex items-center justify-center border border-blue-100 shadow-inner">
                  <ShieldCheck size={36} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[var(--color-text)]">
                    Admin Portal Login
                  </h2>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">
                    Sign in with administrator credentials to upload and digitize your hospital layout.
                  </p>
                </div>
              </div>


              {loginError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                    Admin Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full h-12 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    placeholder="e.g. admin"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-12 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    placeholder="••••••••"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full mt-2"
                  icon={<Lock size={18} />}
                >
                  Sign In as Administrator
                </Button>
              </form>
            </Card>
          </div>
        ) : (
          /* STEP 2: LOGGED IN ADMIN WORKSPACE */
          <div className="flex flex-col gap-6">
            {/* Admin Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[var(--color-primary-600)] flex items-center justify-center font-bold">
                  <Building2 size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--color-text)]">
                      Hospital Administration Portal
                    </span>
                    <StatusBadge variant="success" label="Admin Session Active" />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Logged in as: <strong>admin (Hospital Superintendent)</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLogout}
                  icon={<LogOut size={16} />}
                >
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Upload & Analysis Card */}
            <Card className="p-6 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl shadow-sm">
              <div className="flex flex-col gap-1 mb-5">
                <h3 className="text-lg font-black text-[var(--color-text)] flex items-center gap-2">
                  <Upload size={20} className="text-[var(--color-primary-500)]" />
                  Upload Your Hospital Layout (JPG or PNG)
                </h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Upload an architectural schematic, floor plan photograph, or evacuation blueprint to detect clinics, corridors, and entrance points and generate an interactive 2D floor plan.
                </p>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Upload Dropzone */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary-500)] bg-[var(--color-surface-2)] rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-blue-50/40 group min-h-[240px]"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[var(--color-primary-600)] group-hover:scale-110 transition-transform mb-3">
                    <FileImage size={28} />
                  </div>
                  <h4 className="font-bold text-sm text-[var(--color-text)]">
                    {imageFile ? imageFile.name : 'Choose a layout photo or drag & drop'}
                  </h4>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Accepts JPG or PNG (up to 10MB)
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[var(--color-primary-600)] bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm">
                    <Upload size={14} />
                    <span>Browse Files</span>
                  </div>
                </div>

                {/* Preview or Sample Helper */}
                <div className="flex flex-col justify-between border border-[var(--color-border)] rounded-2xl p-5 bg-[var(--color-surface)]">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                        Blueprint Preview
                      </span>
                      <button
                        type="button"
                        onClick={handleLoadSampleBlueprint}
                        className="text-xs font-semibold text-[var(--color-primary-600)] hover:underline flex items-center gap-1"
                      >
                        <Sparkles size={14} />
                        Load Sample Blueprint (1-Click Demo)
                      </button>
                    </div>

                    {imagePreview ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 aspect-video flex items-center justify-center max-h-[190px]">
                        <img
                          src={imagePreview}
                          alt="Hospital Blueprint Preview"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
                          JPG/PNG Ready
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 aspect-video flex flex-col items-center justify-center text-center p-4 text-[var(--color-text-muted)] max-h-[190px]">
                        <Compass size={28} className="mb-2 opacity-50" />
                        <span className="text-xs font-medium">No image loaded yet</span>
                        <span className="text-[11px] mt-1 text-slate-400">
                          Upload your photo or click "Load Sample Blueprint"
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-3">
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          setDigitizedLayout(null);
                        }}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                    <Button
                      variant="primary"
                      size="md"
                      disabled={!imagePreview || isAnalyzing}
                      onClick={handleAnalyzeWithGroq}
                      className="ml-auto"
                      icon={isAnalyzing ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    >
                      {isAnalyzing ? 'Analyzing Layout...' : '✨ Generate 2D Floor Plan'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Progress Banner */}
              {isAnalyzing && (
                <div className="mt-5 p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center gap-3 animate-pulse">
                  <RefreshCw size={20} className="text-blue-600 animate-spin shrink-0" />
                  <div className="text-xs sm:text-sm text-blue-900 font-medium">
                    {analyzeStep || 'Transmitting layout photo for architectural spatial analysis...'}
                  </div>
                </div>
              )}
            </Card>

            {/* STEP 3: DIGITIZED 2D PLAN DISPLAY (HERE ITSELF!) */}
            {digitizedLayout && (
              <div ref={resultRef} className="flex flex-col gap-6 animate-fadeIn">
                {/* Result Summary Bar */}
                <Card className="p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-slate-900">
                          {digitizedLayout.hospitalName}
                        </h3>
                        <StatusBadge
                          variant="info"
                          label="AI Vision Digitized"
                          icon={<Sparkles size={13} />}
                        />
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                        {digitizedLayout.wing} — {digitizedLayout.overview}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setActiveTab('plan')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                          activeTab === 'plan'
                            ? 'bg-[var(--color-primary-500)] text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        2D Wayfinding Map
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('split')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                          activeTab === 'split'
                            ? 'bg-[var(--color-primary-500)] text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Side-by-Side View
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('original')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                          activeTab === 'original'
                            ? 'bg-[var(--color-primary-500)] text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Original Upload
                      </button>
                    </div>
                  </div>
                </Card>

                {/* 2D Plan View / Split View */}
                <div
                  className={
                    activeTab === 'split'
                      ? 'grid grid-cols-1 lg:grid-cols-2 gap-6'
                      : 'w-full'
                  }
                >
                  {/* Left: Original Image (Shown in split or original tab) */}
                  {(activeTab === 'split' || activeTab === 'original') && (
                    <Card className="p-4 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs font-bold text-[var(--color-text-muted)]">
                        <span className="flex items-center gap-1.5">
                          <Eye size={15} className="text-[var(--color-primary-500)]" />
                          Original Uploaded Blueprint / Photo
                        </span>
                        <span className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded">
                          Input Image
                        </span>
                      </div>
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center min-h-[360px] max-h-[560px]">
                        {imagePreview && (
                          <img
                            src={imagePreview}
                            alt="Original Uploaded Hospital Layout"
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                    </Card>
                  )}

                  {/* Right (or Full Width): Generated 2D Interactive Plan */}
                  {(activeTab === 'split' || activeTab === 'plan') && (
                    <Card className="p-4 sm:p-5 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl flex flex-col gap-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers size={18} className="text-[var(--color-primary-500)]" />
                          <h4 className="font-bold text-sm text-[var(--color-text)]">
                            Interactive 2D Plan
                          </h4>
                          <span className="text-[11px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                            {digitizedLayout.detectedRooms.length} Rooms Mapped
                          </span>
                        </div>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          Click any room to simulate navigation
                        </span>
                      </div>

                      {/* Direction Guidance Banner */}
                      <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs sm:text-sm font-bold text-blue-950">
                        <span className="h-2 w-10 rounded-full bg-[#0072b2] shrink-0" />
                        <span>
                          {selectedRoom
                            ? `Follow the blue line to ${selectedRoom.name} (${selectedRoom.code})`
                            : 'Click any department below to trace the 2D route'}
                        </span>
                      </div>

                      {/* SVG 2D Floor Plan Canvas */}
                      <div className="relative h-[440px] sm:h-[500px] w-full overflow-hidden rounded-2xl border-2 border-slate-200 bg-[#f8fafc] shadow-inner">
                        <svg
                          viewBox="0 0 800 480"
                          className="absolute inset-0 h-full w-full select-none"
                          role="img"
                          aria-label="Digitized 2D hospital layout navigation map"
                        >
                          {/* Background Grid Pattern */}
                          <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
                            </pattern>
                          </defs>
                          <rect width="800" height="480" fill="url(#grid)" />

                          {/* Outer Building Boundary */}
                          <rect
                            x="40"
                            y="40"
                            width="720"
                            height="400"
                            rx="16"
                            fill="none"
                            stroke="#cbd5e1"
                            strokeWidth="3"
                          />

                          {/* Corridors / Hallways */}
                          {digitizedLayout.corridors.map((c, idx) => (
                            <g key={`corridor-${idx}`}>
                              {/* Wide corridor surface */}
                              <line
                                x1={c.x1}
                                y1={c.y1}
                                x2={c.x2}
                                y2={c.y2}
                                stroke="#e2e8f0"
                                strokeWidth="38"
                                strokeLinecap="round"
                              />
                              {/* Center guide line */}
                              <line
                                x1={c.x1}
                                y1={c.y1}
                                x2={c.x2}
                                y2={c.y2}
                                stroke="#cbd5e1"
                                strokeWidth="2"
                                strokeDasharray="6 4"
                              />
                            </g>
                          ))}

                          {/* Active Navigation Route Line (Entrance -> Room) */}
                          {routePathD && (
                            <>
                              {/* White outer halo */}
                              <path
                                d={routePathD}
                                fill="none"
                                stroke="#ffffff"
                                strokeWidth="16"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              {/* High contrast navigation path */}
                              <path
                                d={routePathD}
                                fill="none"
                                stroke="#0072b2"
                                strokeWidth="9"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </>
                          )}

                          {/* Detected Rooms */}
                          {digitizedLayout.detectedRooms.map((room) => {
                            const isSelected = room.id === selectedRoomId;
                            const roomColor = room.color || ROOM_COLORS[room.type] || '#0284c7';
                            const cx = room.x + room.width / 2;
                            const cy = room.y + room.height / 2;

                            return (
                              <g
                                key={room.id}
                                onClick={() => setSelectedRoomId(room.id)}
                                className="cursor-pointer transition-transform hover:opacity-95"
                              >
                                {/* Room Body */}
                                <rect
                                  x={room.x}
                                  y={room.y}
                                  width={room.width}
                                  height={room.height}
                                  rx="10"
                                  fill="#ffffff"
                                  stroke={isSelected ? '#0072b2' : roomColor}
                                  strokeWidth={isSelected ? 4 : 2.5}
                                  className="transition-all"
                                  style={{
                                    filter: isSelected
                                      ? 'drop-shadow(0 4px 8px rgba(0, 114, 178, 0.35))'
                                      : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.05))',
                                  }}
                                />

                                {/* Top Category Banner */}
                                <rect
                                  x={room.x}
                                  y={room.y}
                                  width={room.width}
                                  height="18"
                                  rx="8"
                                  fill={roomColor}
                                />

                                {/* Room Code */}
                                <text
                                  x={room.x + 8}
                                  y={room.y + 13}
                                  fontSize="10"
                                  fontWeight="900"
                                  fill="#ffffff"
                                  fontFamily="monospace"
                                >
                                  {room.code}
                                </text>

                                {/* Room Name */}
                                <text
                                  x={cx}
                                  y={cy + 4}
                                  textAnchor="middle"
                                  fontSize="11"
                                  fontWeight="800"
                                  fill="#0f172a"
                                  className="pointer-events-none"
                                >
                                  {room.name.length > 16
                                    ? room.name.slice(0, 15) + '…'
                                    : room.name}
                                </text>

                                {/* Subtitle Type */}
                                <text
                                  x={cx}
                                  y={cy + 18}
                                  textAnchor="middle"
                                  fontSize="9"
                                  fontWeight="600"
                                  fill="#64748b"
                                  className="pointer-events-none uppercase tracking-wider"
                                >
                                  {room.type}
                                </text>

                                {/* Door marker */}
                                <circle
                                  cx={cx}
                                  cy={room.y < 240 ? room.y + room.height : room.y}
                                  r="4"
                                  fill="#ffffff"
                                  stroke="#475569"
                                  strokeWidth="2"
                                />

                                {/* Selected Destination Marker */}
                                {isSelected && (
                                  <g>
                                    <circle
                                      cx={cx}
                                      cy={cy - 22}
                                      r="16"
                                      fill="#009e73"
                                      stroke="#ffffff"
                                      strokeWidth="3"
                                    />
                                    <text
                                      x={cx}
                                      y={cy - 18}
                                      textAnchor="middle"
                                      fontSize="10"
                                      fontWeight="900"
                                      fill="#ffffff"
                                    >
                                      DEST
                                    </text>
                                  </g>
                                )}
                              </g>
                            );
                          })}

                          {/* Entrance / Start Gate Marker */}
                          {digitizedLayout.entrance && (
                            <g>
                              {/* Pulse ring */}
                              <circle
                                cx={digitizedLayout.entrance.x}
                                cy={digitizedLayout.entrance.y}
                                r="22"
                                fill="#0072b2"
                                fillOpacity="0.15"
                              />
                              <circle
                                cx={digitizedLayout.entrance.x}
                                cy={digitizedLayout.entrance.y}
                                r="14"
                                fill="#0072b2"
                                stroke="#ffffff"
                                strokeWidth="3"
                              />
                              <text
                                x={digitizedLayout.entrance.x}
                                y={digitizedLayout.entrance.y + 24}
                                textAnchor="middle"
                                fontSize="12"
                                fontWeight="900"
                                fill="#0072b2"
                              >
                                START / ENTRANCE
                              </text>
                            </g>
                          )}
                        </svg>
                      </div>

                      {/* Map Legend */}
                      <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
                        <span className="font-bold text-[var(--color-text)]">Categories:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
                          <span>Emergency</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-[#0284c7]" />
                          <span>OPD Consultation</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-[#0d9488]" />
                          <span>Diagnostics & Lab</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-[#d97706]" />
                          <span>Pharmacy</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-[#6366f1]" />
                          <span>Reception & Triage</span>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Detected Rooms Grid & Selection */}
                <Card className="p-6 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-base text-[var(--color-text)]">
                        AI-Identified Clinical Facilities
                      </h4>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        Click any department to simulate turn-by-turn routing on the 2D floor plan above
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[var(--color-primary-600)]">
                      {digitizedLayout.detectedRooms.length} Departments
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {digitizedLayout.detectedRooms.map((room) => {
                      const isSelected = room.id === selectedRoomId;
                      const roomColor = room.color || ROOM_COLORS[room.type] || '#0284c7';

                      return (
                        <div
                          key={room.id}
                          onClick={() => setSelectedRoomId(room.id)}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                            isSelected
                              ? 'border-[#0072b2] bg-blue-50/70 shadow-sm scale-[1.02]'
                              : 'border-[var(--color-border)] hover:border-slate-300 bg-[var(--color-surface)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded text-white"
                              style={{ backgroundColor: roomColor }}
                            >
                              {room.code}
                            </span>
                            <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase">
                              {room.type}
                            </span>
                          </div>

                          <div>
                            <h5 className="font-bold text-sm text-[var(--color-text)] leading-tight">
                              {room.name}
                            </h5>
                            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                              {ROOM_LABELS[room.type] || 'Clinical Facility'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border)]/50 text-xs">
                            <span className="text-[10px] text-slate-400 font-mono">
                              Coords: ({Math.round(room.x)}, {Math.round(room.y)})
                            </span>
                            <span
                              className={`font-bold flex items-center gap-1 ${
                                isSelected ? 'text-[#0072b2]' : 'text-slate-500'
                              }`}
                            >
                              <Navigation size={12} />
                              {isSelected ? 'Routing Active' : 'Navigate'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </BaseLayout>
  );
}
