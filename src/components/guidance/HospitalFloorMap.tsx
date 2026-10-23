import React from 'react';
import { Layers } from 'lucide-react';
import type { GraphNode, GraphEdge } from '../../services/pathfindingService';
import hospitalGraphData from '../../data/hospitalGraph.json';

interface HospitalFloorMapProps {
  currentFloor: number;
  onSelectFloor: (floor: number) => void;
  startNode?: GraphNode | null;
  destinationNode?: GraphNode | null;
  activeNode?: GraphNode | null;
  pathNodes: GraphNode[];
  pathEdges: GraphEdge[];
}

export const HospitalFloorMap: React.FC<HospitalFloorMapProps> = ({
  currentFloor,
  onSelectFloor,
  startNode,
  destinationNode,
  activeNode,
  pathNodes,
}) => {
  const allNodes = hospitalGraphData.nodes as GraphNode[];
  const floorNodes = allNodes.filter((n) => n.floor === currentFloor);

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
    <div className="flex flex-col gap-3 w-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl p-3 sm:p-4 shadow-sm">
      {/* Floor switcher tabs */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--color-text-muted)]">
          <Layers size={16} className="text-[var(--color-primary-500)]" />
          <span>Floor View</span>
        </div>

        <div className="flex items-center gap-1.5" role="tablist" aria-label="Floor switcher">
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
                  'px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5',
                  isSelected
                    ? 'bg-[var(--color-primary-500)] text-white shadow-sm'
                    : 'bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface)]',
                ].join(' ')}
              >
                <span>{fl.label}</span>
                {hasUser && (
                  <span
                    className="w-2 h-2 rounded-full bg-amber-400"
                    title="You are on this floor"
                    aria-label="User is on this floor"
                  />
                )}
                {hasDest && (
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-400"
                    title="Destination on this floor"
                    aria-label="Destination is on this floor"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cross-floor status note */}
      {!isUserOnThisFloor && activeNode && (
        <div className="flex items-center justify-between text-xs font-semibold px-3 py-2 bg-amber-50 text-amber-900 border border-amber-300 rounded-xl">
          <span>
            📍 You are currently on <strong>Floor {activeNode.floor}</strong>.
          </span>
          <button
            type="button"
            onClick={() => onSelectFloor(activeNode.floor)}
            className="underline font-bold text-amber-950 ml-2 shrink-0"
          >
            Switch to your floor →
          </button>
        </div>
      )}

      {/* 2D Floor Plan SVG */}
      <div className="relative w-full overflow-hidden bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-[var(--color-border)]">
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
            strokeDasharray="0"
          />

          {/* Main Central Corridors */}
          {/* Horizontal Corridor */}
          <rect x="80" y="235" width="640" height="50" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
          {/* Vertical Central Corridor */}
          <rect x="375" y="60" width="50" height="400" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />

          {/* Corridor guidance dashed center line */}
          <line x1="80" y1="260" x2="720" y2="260" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 4" />
          <line x1="400" y1="60" x2="400" y2="460" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 4" />

          {/* Vertical Core (Lifts & Stairs) */}
          <g id="vertical-core">
            <rect x="250" y="160" width="300" height="70" rx="12" fill="#f1f5f9" stroke="#0072B2" strokeWidth="2" strokeDasharray="4 2" />
            <text x="400" y="178" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0072B2" letterSpacing="1">
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

            // Dimensions and box position
            const width = isLift || isStairs ? 70 : isEntrance ? 140 : 130;
            const height = isLift || isStairs ? 42 : isEntrance ? 45 : 65;
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

                {/* Node Label */}
                <text
                  x={node.x}
                  y={node.y - (node.roomNumber ? 6 : 0)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#1e293b"
                >
                  {node.name.length > 18 ? node.name.slice(0, 16) + '…' : node.name}
                </text>

                {/* Room or pillar number tag */}
                {(node.roomNumber || node.pillarCode) && (
                  <text
                    x={node.x}
                    y={node.y + 12}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="9.5"
                    fontWeight="600"
                    fill="#64748b"
                  >
                    {node.roomNumber ? `Rm ${node.roomNumber}` : node.pillarCode}
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
              r="5"
              fill="#0072B2"
              stroke="#ffffff"
              strokeWidth="2"
            />
          ))}

          {/* ── START LOCATION PIN (if on this floor) ────────────────────── */}
          {startNode && startNode.floor === currentFloor && (
            <g transform={`translate(${startNode.x}, ${startNode.y})`}>
              <circle r="14" fill="#0072B2" opacity="0.2" />
              <circle r="8" fill="#0072B2" stroke="#ffffff" strokeWidth="2" />
              <text y="-18" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0072B2">
                START
              </text>
            </g>
          )}

          {/* ── CURRENT ACTIVE USER POSITION PIN ─────────────────────────── */}
          {activeNode && activeNode.floor === currentFloor && (
            <g transform={`translate(${activeNode.x}, ${activeNode.y})`}>
              {/* Crosshair ring */}
              <circle r="18" fill="none" stroke="#D55E00" strokeWidth="2.5" strokeDasharray="3 3" />
              <circle r="10" fill="#D55E00" stroke="#ffffff" strokeWidth="2.5" />
              <circle r="3" fill="#ffffff" />
              <rect x="-40" y="-34" width="80" height="18" rx="6" fill="#D55E00" />
              <text x="0" y="-22" textAnchor="middle" fontSize="9.5" fontWeight="black" fill="#ffffff">
                YOU ARE HERE
              </text>
            </g>
          )}

          {/* ── DESTINATION PIN (if on this floor) ────────────────────────── */}
          {destinationNode && destinationNode.floor === currentFloor && (
            <g transform={`translate(${destinationNode.x}, ${destinationNode.y})`}>
              {/* Target checkered outer ring */}
              <circle r="18" fill="none" stroke="#009E73" strokeWidth="3" />
              <circle r="11" fill="#009E73" stroke="#ffffff" strokeWidth="2.5" />
              <circle r="4" fill="#ffffff" />
              <rect x="-42" y="-35" width="84" height="20" rx="6" fill="#009E73" />
              <text x="0" y="-21" textAnchor="middle" fontSize="9.5" fontWeight="black" fill="#ffffff">
                DESTINATION
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Map Legend */}
      <div className="flex items-center justify-between gap-3 flex-wrap text-xs text-[var(--color-text-muted)] pt-1 px-1">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="w-3.5 h-3.5 rounded-full bg-[#D55E00] border border-white inline-block shadow-xs" />
          <span>You are here</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold">
          <span className="w-3.5 h-3.5 rounded-full bg-[#009E73] border border-white inline-block shadow-xs" />
          <span>Destination</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold">
          <span className="w-6 h-1 border-t-2 border-dashed border-[#0072B2] inline-block" />
          <span>Guidance Route</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold">
          <span className="w-3.5 h-3.5 rounded-sm bg-blue-100 border border-blue-400 inline-block" />
          <span>Lift</span>
        </div>
      </div>
    </div>
  );
};
