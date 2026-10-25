import graph from '../../data/hospitalGraph.json';
import { DEPARTMENTS } from '../../data/hospitalData';
import {
  FACILITY_PINS,
  type FacilityCategory,
} from '../../data/facilitiesData';
import type { GraphNode } from '../../services/pathfindingService';

type Point = { x: number; y: number };
type RoomBounds = Point & { width: number; height: number };

export interface MapNode extends GraphNode {
  bounds?: RoomBounds;
  icon?: string;
  mapTone?: string;
  mapLabelKey?: string;
  landmark?: string;
  landmarkKey?: string;
  facilityCategory?: FacilityCategory;
}

type Placement = Point &
  Pick<MapNode, 'bounds' | 'icon' | 'mapTone' | 'mapLabelKey'>;

// Drawing coordinates only. The routing graph, room codes and department data
// remain authoritative and are never modified by the map renderer.
const placements: Record<string, Placement> = {
  'entrance-main': { x: 600, y: 810 },
  reception: {
    x: 460,
    y: 415,
    bounds: { x: 350, y: 430, width: 220, height: 180 },
    icon: 'help',
    mapTone: 'teal',
  },
  pharmacy: {
    x: 215,
    y: 415,
    bounds: { x: 100, y: 430, width: 230, height: 180 },
    icon: 'pharmacy',
    mapTone: 'amber',
  },
  'emergency-dept': {
    x: 985,
    y: 335,
    bounds: { x: 880, y: 120, width: 210, height: 200 },
    icon: 'emergency',
    mapTone: 'rose',
  },
  radiology: {
    x: 215,
    y: 335,
    bounds: { x: 100, y: 120, width: 230, height: 200 },
    icon: 'xray',
    mapTone: 'blue',
  },
  canteen: {
    x: 755,
    y: 335,
    bounds: { x: 650, y: 120, width: 210, height: 200 },
    icon: 'canteen',
    mapTone: 'amber',
  },
  'billing-f0': {
    x: 460,
    y: 335,
    bounds: { x: 350, y: 120, width: 220, height: 200 },
    icon: 'registration',
    mapTone: 'blue',
  },
  'corridor-f0-center': { x: 600, y: 375 },
  'wheelchair-f0-main': {
    x: 1000,
    y: 655,
    bounds: { x: 910, y: 670, width: 180, height: 110 },
    icon: 'wheelchair',
    mapTone: 'teal',
    mapLabelKey: 'hospital.map.wheelchair',
  },
  'ramp-f0-main': {
    x: 940,
    y: 850,
    bounds: { x: 940, y: 825, width: 150, height: 50 },
    icon: 'ramp',
    mapTone: 'teal',
    mapLabelKey: 'hospital.map.ramp',
  },
  'water-f0': {
    x: 755,
    y: 415,
    bounds: { x: 650, y: 430, width: 210, height: 80 },
    icon: 'water',
    mapTone: 'teal',
    mapLabelKey: 'hospital.map.water',
  },
  'opd-general': {
    x: 315,
    y: 335,
    bounds: { x: 100, y: 120, width: 430, height: 200 },
    icon: 'clinic',
    mapTone: 'blue',
  },
  'opd-eye': {
    x: 880,
    y: 335,
    bounds: { x: 670, y: 120, width: 420, height: 200 },
    icon: 'eye',
    mapTone: 'blue',
  },
  'opd-derma': {
    x: 315,
    y: 415,
    bounds: { x: 100, y: 430, width: 430, height: 180 },
    icon: 'clinic',
    mapTone: 'blue',
  },
  'opd-pediatrics': {
    x: 940,
    y: 415,
    bounds: { x: 790, y: 430, width: 300, height: 180 },
    icon: 'children',
    mapTone: 'blue',
  },
  'washroom-f1-acc': {
    x: 445,
    y: 655,
    bounds: { x: 360, y: 670, width: 170, height: 110 },
    icon: 'toilet',
    mapTone: 'teal',
    mapLabelKey: 'hospital.map.accessibleToilets',
  },
  'prayer-f1': {
    x: 1000,
    y: 655,
    bounds: { x: 910, y: 670, width: 180, height: 110 },
    icon: 'prayer',
    mapTone: 'neutral',
    mapLabelKey: 'hospital.map.prayer',
  },
  'opd-ent': {
    x: 315,
    y: 335,
    bounds: { x: 100, y: 120, width: 430, height: 200 },
    icon: 'ear',
    mapTone: 'blue',
  },
  'opd-cardiology': {
    x: 880,
    y: 335,
    bounds: { x: 670, y: 120, width: 420, height: 200 },
    icon: 'heart',
    mapTone: 'blue',
  },
  'opd-neuro': {
    x: 315,
    y: 415,
    bounds: { x: 100, y: 430, width: 430, height: 180 },
    icon: 'brain',
    mapTone: 'blue',
  },
  'opd-ortho': {
    x: 940,
    y: 415,
    bounds: { x: 790, y: 430, width: 300, height: 180 },
    icon: 'clinic',
    mapTone: 'blue',
  },
  'pillar-f2-p7': { x: 880, y: 355 },
};

for (const floor of graph.floors) {
  const f = floor.level;
  placements['lift-a-f' + f] = {
    x: 720,
    y: 655,
    bounds: { x: 670, y: 670, width: 100, height: 110 },
    icon: 'lift',
    mapTone: 'neutral',
    mapLabelKey: 'hospital.map.liftA',
  };
  placements['lift-b-f' + f] = {
    x: 840,
    y: 655,
    bounds: { x: 790, y: 670, width: 100, height: 110 },
    icon: 'lift',
    mapTone: 'neutral',
    mapLabelKey: 'hospital.map.liftB',
  };
  placements['stairs-a-f' + f] = {
    x: f === 1 ? 285 : 155,
    y: 655,
    bounds: { x: f === 1 ? 230 : 100, y: 670, width: 110, height: 110 },
    icon: 'stairs',
    mapTone: 'neutral',
    mapLabelKey: 'hospital.map.stairs',
  };
  placements['washroom-f' + f] = {
    x: f === 1 ? 155 : 340,
    y: 655,
    bounds: {
      x: f === 1 ? 100 : 230,
      y: 670,
      width: f === 1 ? 110 : 220,
      height: 110,
    },
    icon: 'toilet',
    mapTone: 'teal',
    mapLabelKey: 'hospital.map.toilets',
  };
  if (f === 0) continue;
  placements['corridor-f' + f + '-west'] = { x: 315, y: 375 };
  placements['corridor-f' + f + '-east'] = { x: 880, y: 375 };
  placements['waiting-f' + f] = {
    x: 600,
    y: 675,
    bounds: { x: 550, y: 690, width: 100, height: 110 },
    icon: 'waiting',
    mapTone: 'neutral',
    mapLabelKey: 'hospital.map.waiting',
  };
  placements['water-f' + f] = {
    x: 720,
    y: 415,
    bounds: { x: 670, y: 430, width: 100, height: 80 },
    icon: 'water',
    mapTone: 'teal',
    mapLabelKey: 'hospital.map.water',
  };
}

export const MAP_NODES: MapNode[] = (graph.nodes as GraphNode[]).map((node) => {
  const facility = FACILITY_PINS.find((pin) => pin.nodeId === node.id);
  const department = DEPARTMENTS.find((item) => item.id === node.departmentId);
  return {
    ...node,
    ...placements[node.id],
    facilityCategory: facility?.category,
    landmarkKey: facility?.descriptionKey,
    landmark: department?.landmark,
  };
});

const nodeById = new Map(MAP_NODES.map((node) => [node.id, node]));

export function getMapNode(node: GraphNode | null | undefined): MapNode | null {
  return node ? nodeById.get(node.id) || node : null;
}

// Orthogonal display paths follow the drawn public corridors. These paths do
// not change the graph edges, shortest-path computation or walking distances.
export function mapSegmentPath(from: Point, to: Point): string {
  const lower = (point: Point) => point.y >= 640;
  const access = (point: Point): Point[] =>
    point.y >= 810
      ? [point, { x: 600, y: point.y }, { x: 600, y: 640 }]
      : [point, { x: point.x, y: lower(point) ? 640 : 375 }];
  let points: Point[];
  if (from.y >= 810 && to.y >= 810) {
    points = [from, { x: 600, y: from.y }, { x: 600, y: to.y }, to];
  } else if (from.x === to.x || (from.y === to.y && from.y < 810)) {
    points = [from, to];
  } else {
    const first = access(from);
    const last = access(to);
    points =
      lower(from) === lower(to)
        ? [...first, ...last.reverse()]
        : [
            ...first,
            { x: 600, y: lower(from) ? 640 : 375 },
            { x: 600, y: lower(to) ? 640 : 375 },
            ...last.reverse(),
          ];
  }
  return points
    .filter(
      (point, index) =>
        index === 0 ||
        point.x !== points[index - 1].x ||
        point.y !== points[index - 1].y
    )
    .map((point, index) => (index ? 'L' : 'M') + point.x + ' ' + point.y)
    .join('');
}
