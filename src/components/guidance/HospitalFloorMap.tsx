import { useMemo } from 'react';
import { Layers, MapPin } from 'lucide-react';
import type { GraphEdge, GraphNode } from '../../services/pathfindingService';
import { FACILITY_PINS, type FacilityCategory, type FacilityPin } from '../../data/facilitiesData';
import hospitalGraphData from '../../data/hospitalGraph.json';

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

const floors = [{ level: 0, label: 'Ground (F0)' }, { level: 1, label: 'Floor 1 (F1)' }, { level: 2, label: 'Floor 2 (F2)' }];
const allNodes = hospitalGraphData.nodes as GraphNode[];
const allEdges = hospitalGraphData.edges as GraphEdge[];

function getViewBox(nodes: GraphNode[]) {
  const xs = nodes.map((node) => node.x);
  const ys = nodes.map((node) => node.y);
  const width = Math.min(760, Math.max(300, Math.max(...xs) - Math.min(...xs) + 220));
  const height = Math.min(480, Math.max(230, Math.max(...ys) - Math.min(...ys) + 200));
  const mapWidth = Math.min(760, Math.max(width, height * 1.45));
  const mapHeight = Math.min(480, Math.max(height, mapWidth / 1.45));
  const centerX = (Math.max(...xs) + Math.min(...xs)) / 2;
  const centerY = (Math.max(...ys) + Math.min(...ys)) / 2;
  return `${Math.max(20, Math.min(780 - mapWidth, centerX - mapWidth / 2))} ${Math.max(20, Math.min(500 - mapHeight, centerY - mapHeight / 2))} ${mapWidth} ${mapHeight}`;
}

export function HospitalFloorMap({ currentFloor, onSelectFloor, startNode, destinationNode, activeNode, pathNodes, showFacilityPins = true, selectedFacilityCategory = 'all', selectedFacilityId, onSelectFacility }: HospitalFloorMapProps) {
  const nodeById = useMemo(() => new Map(allNodes.map((node) => [node.id, node])), []);
  const floorNodes = allNodes.filter((node) => node.floor === currentFloor);
  const routeNodes = pathNodes.filter((node) => node.floor === currentFloor);
  const focusNodes = routeNodes.length ? routeNodes : floorNodes;
  const viewBox = getViewBox(focusNodes);
  const floorEdges = allEdges.filter((edge) => nodeById.get(edge.from)?.floor === currentFloor && nodeById.get(edge.to)?.floor === currentFloor);
  const routeSegments = pathNodes.slice(0, -1).flatMap((node, index) => node.floor === currentFloor && pathNodes[index + 1].floor === currentFloor ? [{ from: node, to: pathNodes[index + 1] }] : []);
  const mapNodes = floorNodes.filter((node) => node.category === 'vertical' || routeNodes.some((routeNode) => routeNode.id === node.id));
  const facilities = FACILITY_PINS.filter((pin) => showFacilityPins && pin.floor === currentFloor && (selectedFacilityCategory === 'all' || pin.category === selectedFacilityCategory));

  return (
    <div className="flex flex-col gap-4 w-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-1.5 text-sm font-black uppercase tracking-wider text-[var(--color-text-muted)]"><Layers size={18} className="text-[var(--color-primary-500)]" />Floor View</div>
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Floor switcher">
        {floors.map((floor) => <button key={floor.level} type="button" role="tab" aria-selected={currentFloor === floor.level} onClick={() => onSelectFloor(floor.level)} className={currentFloor === floor.level ? 'btn btn-primary min-h-14 text-sm' : 'btn btn-secondary min-h-14 text-sm'}>{floor.label}</button>)}
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-950"><span className="h-2 w-12 rounded-full bg-[#0072b2]" />Follow the blue line to your destination.</div>
      <div className="relative h-[500px] sm:h-[590px] w-full overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50" aria-label={`Hospital floor ${currentFloor} map`}>
        <svg viewBox={viewBox} className="absolute inset-0 h-full w-full" role="img" aria-label={`Floor ${currentFloor} navigation plan`}>
          <rect width="800" height="520" fill="#f8fafc" />
          <path d="M80 260H720M400 60V460" stroke="#e2e8f0" strokeWidth="42" strokeLinecap="round" />
          {floorEdges.map((edge) => { const from = nodeById.get(edge.from)!; const to = nodeById.get(edge.to)!; return <line key={`${edge.from}-${edge.to}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />; })}
          {routeSegments.map((segment) => <line key={`route-outline-${segment.from.id}-${segment.to.id}`} x1={segment.from.x} y1={segment.from.y} x2={segment.to.x} y2={segment.to.y} stroke="#fff" strokeWidth="16" strokeLinecap="round" />)}
          {routeSegments.map((segment) => <line key={`route-${segment.from.id}-${segment.to.id}`} x1={segment.from.x} y1={segment.from.y} x2={segment.to.x} y2={segment.to.y} stroke="#0072b2" strokeWidth="10" strokeLinecap="round" />)}
          {facilities.map((pin) => <g key={pin.id} onClick={() => onSelectFacility?.(pin)} className="cursor-pointer">{pin.id === selectedFacilityId && <circle cx={pin.x} cy={pin.y - 5} r="23" fill="none" stroke="#1d4ed8" strokeWidth="4" strokeDasharray="5 4" />}<path d={`M ${pin.x} ${pin.y - 18} C ${pin.x - 11} ${pin.y - 18}, ${pin.x - 13} ${pin.y - 2}, ${pin.x} ${pin.y + 15} C ${pin.x + 13} ${pin.y - 2}, ${pin.x + 11} ${pin.y - 18}, ${pin.x} ${pin.y - 18}`} fill={pin.strokeColor} stroke="#fff" strokeWidth="3" /><circle cx={pin.x} cy={pin.y - 7} r="3.5" fill="#fff" /></g>)}
          {mapNodes.map((node) => <g key={node.id}><circle cx={node.x} cy={node.y} r="14" fill="#fff" stroke="#0072b2" strokeWidth="4" /><text x={node.x} y={node.y + 31} textAnchor="middle" fontSize="14" fontWeight="800" fill="#1e293b">{node.roomNumber || node.name}</text></g>)}
          {startNode?.floor === currentFloor && <g><circle cx={startNode.x} cy={startNode.y} r="20" fill="#0072b2" stroke="#fff" strokeWidth="4" /><text x={startNode.x} y={startNode.y - 28} textAnchor="middle" fontSize="15" fontWeight="900" fill="#0072b2">START</text></g>}
          {activeNode?.floor === currentFloor && <g><circle cx={activeNode.x} cy={activeNode.y} r="18" fill="#d55e00" stroke="#fff" strokeWidth="4" /><text x={activeNode.x} y={activeNode.y - 28} textAnchor="middle" fontSize="15" fontWeight="900" fill="#d55e00">YOU ARE HERE</text></g>}
          {destinationNode?.floor === currentFloor && <g><circle cx={destinationNode.x} cy={destinationNode.y} r="18" fill="#009e73" stroke="#fff" strokeWidth="4" /><text x={destinationNode.x} y={destinationNode.y - 28} textAnchor="middle" fontSize="15" fontWeight="900" fill="#009e73">DESTINATION</text></g>}
        </svg>
      </div>
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]"><MapPin size={17} className="text-[var(--color-primary-500)]" />Coloured pins mark facilities available on this floor.</div>
    </div>
  );
}
