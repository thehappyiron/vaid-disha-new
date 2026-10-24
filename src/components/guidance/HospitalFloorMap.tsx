import React, { useState } from 'react';
import { Layers, ZoomIn, ZoomOut, RotateCcw, MapPin } from 'lucide-react';
import type { GraphNode, GraphEdge } from '../../services/pathfindingService';
import hospitalGraphData from '../../data/hospitalGraph.json';
import { FACILITY_PINS, type FacilityPin, type FacilityCategory } from '../../data/facilitiesData';

interface HospitalFloorMapProps {
  currentFloor: number;
  onSelectFloor: (floor: number) => void;
  startNode?: GraphNode | null;
  destinationNode?: GraphNode | null;
  activeNode?: GraphNode | null;
  pathNodes: GraphNode[];
  pathEdges: GraphEdge[];
  showFacilityPins?: boolean;
  selectedFacilityCategory?: FacilityCategory;
  selectedFacilityId?: string | null;
  onSelectFacility?: (facility: FacilityPin) => void;
}

export const HospitalFloorMap: React.FC<HospitalFloorMapProps> = ({
  currentFloor,
  onSelectFloor,
  startNode,
  destinationNode,
  activeNode,
  pathNodes,
  showFacilityPins = true,
  selectedFacilityCategory = 'all',
  selectedFacilityId,
  onSelectFacility,
}) => {
  const [zoom, setZoom] = useState<number>(1);

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))));
  const handleResetZoom = () => setZoom(1);

  const allNodes = hospitalGraphData.nodes as GraphNode[];
  const floorNodes = allNodes.filter((n) => n.floor === currentFloor);

  // Facility pins filtered for current floor and category
  const floorFacilityPins = FACILITY_PINS.filter((pin) => {
    if (pin.floor !== currentFloor) return false;
    if (selectedFacilityCategory !== 'all' && pin.category !== selectedFacilityCategory) return false;
    return true;
  });

  // Nodes on path that are on this floor
  const floorPathNodes = pathNodes.filter((n) => n.floor === currentFloor);

  // Path segments between consecutive nodes on this floor
  const pathSegments: { from: GraphNode; to: GraphNode }[] = [];
  for (let i = 0; i < pathNodes.length - 1; i++) {
    const a = pathNodes[i];
    const b = pathNodes[i + 1];
    if (a.floor === currentFloor && b.floor === currentFloor) {
      pathSegments.push({ from: a, to: b });
    }
  }

  const isUserOnThisFloor = activeNode?.floor === currentFloor;

  return (
    <div className="flex flex-col gap-3.5 w-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl p-3 sm:p-4 shadow-sm">
      {/* ── 1. FLOOR SWITCHER TABS (Exact 3-col grid, icon+text markers, no cutoffs) ── */}
      <div className="flex flex-col gap-2 pb-2 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--color-text-muted)]">
            <Layers size={16} className="text-[var(--color-primary-500)]" aria-hidden="true" />
            <span>Floor View</span>
          </div>
          <span className="text-xs text-[var(--color-text-muted)] font-bold">
            Floor {currentFloor} Active
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full" role="tablist" aria-label="Floor switcher">
          {[
            { level: 0, label: 'Ground (F0)' },
            { level: 1, label: 'Floor 1 (F1)' },
            { level: 2, label: 'Floor 2 (F2)' },
          ].map((fl) => {
            const hasUser = activeNode?.floor === fl.level;
            const hasDest = destinationNode?.floor === fl.level;
            const isSelected = currentFloor === fl.level;

            return (
              <button
                key={fl.level}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectFloor(fl.level)}
                className={[
                  'w-full min-h-14 px-2 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all',
                  'flex flex-col items-center justify-center text-center gap-1 leading-tight whitespace-normal break-words',
                  isSelected
                    ? 'bg-[var(--color-primary-500)] text-white shadow-sm ring-2 ring-[var(--color-primary-300)]'
                    : 'bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface)]',
                ].join(' ')}
              >
                <span className="leading-tight text-center">{fl.label}</span>
                <div className="flex items-center justify-center gap-1 flex-wrap">
                  {hasUser && (
                    <span
                      className={[
                        'inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full',
                        isSelected ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-900 border border-amber-300',
                      ].join(' ')}
                      aria-label="You are here"
                    >
                      📍 You
                    </span>
                  )}
                  {hasDest && (
                    <span
                      className={[
                        'inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full',
                        isSelected ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-900 border border-emerald-300',
                      ].join(' ')}
                      aria-label="Destination"
                    >
                      🎯 Dest
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. VERTICAL CROSS-FLOOR STATUS NOTICE (Exact prompt layout) ───────── */}
      {!isUserOnThisFloor && activeNode && (
        <div className="flex flex-col gap-2.5 w-full p-3.5 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-2 border-amber-300 dark:border-amber-700/60 rounded-xl">
          <div className="flex items-center gap-2 w-full text-xs sm:text-sm font-semibold">
            <MapPin size={18} className="shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <span className="w-full">
              You are currently on <strong>Floor {activeNode.floor}</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectFloor(activeNode.floor)}
            className="btn btn-secondary w-full min-h-12 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 text-center whitespace-normal break-words bg-white dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/80 transition-all shadow-xs"
          >
            Switch to your floor →
          </button>
        </div>
      )}

      {/* ── 3. ZOOM CONTROLS (Exact 56px buttons) ─────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-bold text-[var(--color-text-muted)]">
          Map Zoom & Touch Pan
        </span>
        <div className="flex items-center gap-2">
          {zoom > 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              className="btn btn-ghost min-h-[56px] px-3 py-2 rounded-xl text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center gap-1.5 whitespace-normal break-words"
              aria-label="Reset zoom"
            >
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            className="btn btn-secondary min-h-[56px] min-w-[56px] h-14 w-14 rounded-2xl p-0 flex items-center justify-center font-black text-2xl shadow-sm border border-[var(--color-border)] disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Zoom out floor map"
          >
            <ZoomOut size={22} aria-hidden="true" />
          </button>
          <span className="text-xs font-black min-w-[44px] text-center text-[var(--color-text)] font-mono">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 2.5}
            className="btn btn-secondary min-h-[56px] min-w-[56px] h-14 w-14 rounded-2xl p-0 flex items-center justify-center font-black text-2xl shadow-sm border border-[var(--color-border)] disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Zoom in floor map"
          >
            <ZoomIn size={22} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── 4. 2D FLOOR PLAN SVG IN TOUCH-PAN CONTAINER ──────────────────────── */}
      <div
        className="relative w-full overflow-x-auto overflow-y-auto touch-pan-x touch-pan-y bg-slate-50 dark:bg-slate-900/60 rounded-xl border-2 border-[var(--color-border)] shadow-inner select-none"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div
          style={{
            minWidth: `${zoom * 100}%`,
            width: `${zoom * 100}%`,
            transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <svg
            viewBox="0 0 800 520"
            className="w-full h-auto block select-none"
            role="img"
            aria-label={`Hospital 2D Floor Plan for Floor ${currentFloor}`}
          >
            <defs>
              {/* Pattern for accessible non-color room distinction */}
              <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" stroke="#cbd5e1" strokeWidth="1.5" />
              </pattern>
              {/* Grid dot background */}
              <pattern id="gridDots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#94a3b8" opacity="0.3" />
              </pattern>
              {/* Arrow marker for route line */}
              <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#0072B2" />
              </marker>
            </defs>

            {/* Background grid */}
            <rect width="800" height="520" fill="url(#gridDots)" />

            {/* Hospital Outer Boundary */}
            <rect
              x="40"
              y="40"
              width="720"
              height="440"
              rx="24"
              fill="#ffffff"
              stroke="#94a3b8"
              strokeWidth="3"
            />

            {/* Main Central Corridors */}
            <rect x="80" y="235" width="640" height="50" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
            <rect x="375" y="60" width="50" height="400" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />

            {/* Corridor guidance dashed center line */}
            <line x1="80" y1="260" x2="720" y2="260" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 4" />
            <line x1="400" y1="60" x2="400" y2="460" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 4" />

            {/* Vertical Core (Lifts & Stairs) — positioned with clearance */}
            <g id="vertical-core">
              <rect x="230" y="135" width="340" height="90" rx="12" fill="#f1f5f9" stroke="#0072B2" strokeWidth="2" strokeDasharray="4 2" />
              <text x="400" y="152" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#0072B2" letterSpacing="1">
                CENTRAL LIFT & STAIR CORE
              </text>
            </g>

            {/* Floor Rooms / Zones */}
            {floorNodes.map((node) => {
              if (node.category === 'corridor') return null;

              const isLift = node.category === 'vertical' && node.id.includes('lift');
              const isStairs = node.category === 'vertical' && node.id.includes('stairs');
              const isEntrance = node.category === 'entrance';
              const isClinic = node.category === 'clinic';
              const isFacility = node.category === 'facility';
              const isService = node.category === 'service';
              const isWaiting = node.category === 'waiting';

              const isStart = startNode?.id === node.id;
              const isDest = destinationNode?.id === node.id;
              const isRouteStop = pathNodes.some((p) => p.id === node.id);

              // Per prompt: show labels only for start, destination, route stops, and lifts
              const shouldShowLabel = isStart || isDest || isRouteStop || isLift;

              // Dimensions and box position
              const width = isLift || isStairs ? 72 : isEntrance ? 140 : 130;
              const height = isLift || isStairs ? 44 : isEntrance ? 46 : 66;
              const rx = 10;
              const xPos = node.x - width / 2;
              const yPos = node.y - height / 2;

              let bgColor = '#ffffff';
              let strokeColor = '#cbd5e1';

              if (isClinic) {
                bgColor = '#f0f9ff';
                strokeColor = '#38bdf8';
              } else if (isLift) {
                bgColor = '#eff6ff';
                strokeColor = '#0072B2';
              } else if (isStairs) {
                bgColor = '#fef3c7';
                strokeColor = '#d97706';
              } else if (isEntrance) {
                bgColor = '#f0fdf4';
                strokeColor = '#16a34a';
              } else if (isWaiting) {
                bgColor = '#fdf4ff';
                strokeColor = '#d946ef';
              } else if (isFacility || isService) {
                bgColor = '#f8fafc';
                strokeColor = '#64748b';
              }

              return (
                <g key={node.id} className="cursor-pointer">
                  <rect
                    x={xPos}
                    y={yPos}
                    width={width}
                    height={height}
                    rx={rx}
                    fill={bgColor}
                    stroke={strokeColor}
                    strokeWidth="2"
                  />

                  {shouldShowLabel ? (
                    <>
                      {/* Node Label — rendered at >= 12px */}
                      <text
                        x={node.x}
                        y={node.y - (node.roomNumber ? 7 : 0)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="12"
                        fontWeight="bold"
                        fill="#1e293b"
                      >
                        {node.name.length > 18 ? node.name.slice(0, 16) + '…' : node.name}
                      </text>

                      {/* Room or pillar number tag — rendered at >= 12px */}
                      {(node.roomNumber || node.pillarCode) && (
                        <text
                          x={node.x}
                          y={node.y + 13}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="12"
                          fontWeight="600"
                          fill="#64748b"
                        >
                          {node.roomNumber ? `Rm ${node.roomNumber}` : node.pillarCode}
                        </text>
                      )}
                    </>
                  ) : (
                    /* Other facilities show clean icon only, full labels in legend below */
                    <text
                      x={node.x}
                      y={node.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="16"
                      fill={strokeColor}
                    >
                      {isClinic ? '🩺' : isWaiting ? '🪑' : isEntrance ? '🚪' : isStairs ? '🪜' : '🏢'}
                    </text>
                  )}
                </g>
              );
            })}

            {/* ── HIGHLIGHTED PATH ON THIS FLOOR ────────────────────────────── */}
            {pathSegments.map((seg, idx) => (
              <g key={idx}>
                {/* Thick route backing for contrast */}
                <line
                  x1={seg.from.x}
                  y1={seg.from.y}
                  x2={seg.to.x}
                  y2={seg.to.y}
                  stroke="#ffffff"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                {/* Primary route line */}
                <line
                  x1={seg.from.x}
                  y1={seg.from.y}
                  x2={seg.to.x}
                  y2={seg.to.y}
                  stroke="#0072B2"
                  strokeWidth="6"
                  strokeDasharray="10 5"
                  strokeLinecap="round"
                  markerEnd="url(#arrow)"
                />
              </g>
            ))}

            {/* Path waypoint dots */}
            {floorPathNodes.map((n) => (
              <circle
                key={n.id}
                cx={n.x}
                cy={n.y}
                r="6"
                fill="#0072B2"
                stroke="#ffffff"
                strokeWidth="2.5"
              />
            ))}

            {/* ── START LOCATION PIN (if on this floor) ────────────────────── */}
            {startNode && startNode.floor === currentFloor && (
              <g transform={`translate(${startNode.x}, ${startNode.y})`}>
                <circle r="16" fill="#0072B2" opacity="0.25" />
                <circle r="9" fill="#0072B2" stroke="#ffffff" strokeWidth="2.5" />
                <rect x="-32" y="-36" width="64" height="20" rx="6" fill="#0072B2" />
                <text y="-22" textAnchor="middle" fontSize="12" fontWeight="black" fill="#ffffff">
                  START
                </text>
              </g>
            )}

            {/* ── CURRENT ACTIVE USER POSITION PIN ─────────────────────────── */}
            {activeNode && activeNode.floor === currentFloor && (
              <g transform={`translate(${activeNode.x}, ${activeNode.y})`}>
                <circle r="22" fill="none" stroke="#D55E00" strokeWidth="3" strokeDasharray="4 3" />
                <circle r="12" fill="#D55E00" stroke="#ffffff" strokeWidth="3" />
                <circle r="4" fill="#ffffff" />
                <rect x="-56" y="-38" width="112" height="22" rx="6" fill="#D55E00" />
                <text x="0" y="-23" textAnchor="middle" fontSize="12" fontWeight="black" fill="#ffffff">
                  YOU ARE HERE
                </text>
              </g>
            )}

            {/* ── DESTINATION PIN (if on this floor) ────────────────────────── */}
            {destinationNode && destinationNode.floor === currentFloor && (
              <g transform={`translate(${destinationNode.x}, ${destinationNode.y})`}>
                <circle r="22" fill="none" stroke="#009E73" strokeWidth="3.5" />
                <circle r="13" fill="#009E73" stroke="#ffffff" strokeWidth="3" />
                <circle r="4" fill="#ffffff" />
                <rect x="-56" y="-38" width="112" height="22" rx="6" fill="#009E73" />
                <text x="0" y="-23" textAnchor="middle" fontSize="12" fontWeight="black" fill="#ffffff">
                  DESTINATION
                </text>
              </g>
            )}

            {/* ── FACILITY PINS (Distinct SHAPE + ICON, labels in legend below) ── */}
            {showFacilityPins &&
              floorFacilityPins.map((pin) => {
                const isSelected = selectedFacilityId === pin.id;

                return (
                  <g
                    key={pin.id}
                    transform={`translate(${pin.x}, ${pin.y})`}
                    className="cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                    onClick={() => onSelectFacility?.(pin)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${pin.name} (${pin.shapeLabel})`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectFacility?.(pin);
                      }
                    }}
                  >
                    {/* Selected glow ring */}
                    {isSelected && (
                      <circle r="26" fill="none" stroke="#2563eb" strokeWidth="3" strokeDasharray="4 3" />
                    )}

                    {/* SHAPE RENDERING WITH ICONS (>= 12px text) */}
                    {pin.shape === 'rounded-square' && (
                      <>
                        <rect
                          x="-15"
                          y="-15"
                          width="30"
                          height="30"
                          rx="8"
                          fill={pin.bgColor}
                          stroke={pin.strokeColor}
                          strokeWidth={isSelected ? 3.5 : 2.5}
                        />
                        <text y="5" textAnchor="middle" fontSize="14">
                          ♿
                        </text>
                      </>
                    )}

                    {pin.shape === 'double-circle' && (
                      <>
                        <circle r="17" fill="none" stroke={pin.strokeColor} strokeWidth="2.5" />
                        <circle
                          r="13"
                          fill={pin.bgColor}
                          stroke={pin.strokeColor}
                          strokeWidth={isSelected ? 3 : 1.5}
                        />
                        <text y="5" textAnchor="middle" fontSize="12" fontWeight="bold">
                          ♿
                        </text>
                      </>
                    )}

                    {pin.shape === 'circle' && (
                      <>
                        <circle
                          r="15"
                          fill={pin.bgColor}
                          stroke={pin.strokeColor}
                          strokeWidth={isSelected ? 3.5 : 2.5}
                        />
                        <text y="4.5" textAnchor="middle" fontSize="12" fontWeight="900" fill={pin.strokeColor}>
                          WC
                        </text>
                      </>
                    )}

                    {pin.shape === 'hexagon' && (
                      <>
                        <polygon
                          points="0,-17 15,-8.5 15,8.5 0,17 -15,8.5 -15,-8.5"
                          fill={pin.bgColor}
                          stroke={pin.strokeColor}
                          strokeWidth={isSelected ? 3.5 : 2.5}
                        />
                        <text y="5" textAnchor="middle" fontSize="13" fontWeight="black" fill={pin.strokeColor}>
                          ⇅
                        </text>
                      </>
                    )}

                    {pin.shape === 'trapezoid' && (
                      <>
                        <polygon
                          points="-16,13 16,13 11,-13 -11,-13"
                          fill={pin.bgColor}
                          stroke={pin.strokeColor}
                          strokeWidth={isSelected ? 3.5 : 2.5}
                        />
                        <text y="4" textAnchor="middle" fontSize="12" fontWeight="bold" fill={pin.strokeColor}>
                          ⊿
                        </text>
                      </>
                    )}

                    {pin.shape === 'diamond' && (
                      <>
                        <polygon
                          points="0,-17 16,0 0,17 -16,0"
                          fill={pin.bgColor}
                          stroke={pin.strokeColor}
                          strokeWidth={isSelected ? 3.5 : 2.5}
                        />
                        <text y="5" textAnchor="middle" fontSize="13">
                          💧
                        </text>
                      </>
                    )}

                    {pin.shape === 'octagon' && (
                      <>
                        <polygon
                          points="-8,-17 8,-17 17,-8 17,8 8,17 -8,17 -17,8 -17,-8"
                          fill={pin.bgColor}
                          stroke={pin.strokeColor}
                          strokeWidth={isSelected ? 3.5 : 2.5}
                        />
                        <text y="5" textAnchor="middle" fontSize="13" fill={pin.strokeColor}>
                          ★
                        </text>
                      </>
                    )}

                    {pin.shape === 'cross' && (
                      <>
                        <path
                          d="M-6,-16 H6 V-6 H16 V6 H6 V16 H-6 V6 H-16 V-6 H-6 Z"
                          fill={pin.bgColor}
                          stroke={pin.strokeColor}
                          strokeWidth={isSelected ? 3.5 : 2.5}
                        />
                        <text y="4" textAnchor="middle" fontSize="12" fontWeight="900" fill={pin.strokeColor}>
                          Rx
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
          </svg>
        </div>
      </div>

      {/* ── 5. COMPREHENSIVE MAP LEGEND BELOW ─────────────────────────────────── */}
      <div className="flex flex-col gap-2 pt-1 px-1">
        <div className="text-[11px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
          Map Pins & Facility Symbols Legend:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs text-[var(--color-text)]">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-4 h-4 rounded-full bg-[#D55E00] border-2 border-white inline-block shadow-xs shrink-0" />
            <span>You are here</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-4 h-4 rounded-full bg-[#009E73] border-2 border-white inline-block shadow-xs shrink-0" />
            <span>Destination</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-4 h-4 rounded-full bg-[#0072B2] border border-white inline-block shadow-xs shrink-0" />
            <span>Route Start</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-4 h-4 rounded-md bg-blue-100 border border-blue-600 inline-flex items-center justify-center text-[10px] shrink-0">♿</span>
            <span>Wheelchair Stand (Square)</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-4 h-4 rounded-full bg-emerald-100 border-2 border-emerald-600 inline-flex items-center justify-center text-[10px] shrink-0">♿</span>
            <span>Accessible Washroom (Double Ring)</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-600 inline-flex items-center justify-center text-[9px] font-black shrink-0">WC</span>
            <span>Standard Washroom (Circle)</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-4 h-4 bg-blue-100 border border-blue-600 inline-flex items-center justify-center text-[10px] font-black shrink-0">⇅</span>
            <span>Lift / Elevator (Hexagon)</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-4 h-4 bg-indigo-100 border border-indigo-600 inline-flex items-center justify-center text-[10px] font-bold shrink-0">⊿</span>
            <span>Entrance Ramp (Trapezoid)</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-4 h-4 bg-sky-100 border border-sky-600 inline-flex items-center justify-center text-[10px] shrink-0">💧</span>
            <span>Drinking Water (Diamond)</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-4 h-4 bg-amber-100 border border-amber-600 inline-flex items-center justify-center text-[10px] shrink-0">★</span>
            <span>Prayer / Quiet Room (Octagon)</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-4 h-4 bg-red-100 border border-red-600 inline-flex items-center justify-center text-[9px] font-black text-red-600 shrink-0">+</span>
            <span>Central Pharmacy (Cross)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
