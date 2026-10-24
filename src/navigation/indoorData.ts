import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import hospitalGraphData from '../data/hospitalGraph.json';
import type { GraphEdge, GraphNode } from '../services/pathfindingService';

/** Uses only display coordinates and connectivity already supplied by hospitalGraph.json. */
const nodes = hospitalGraphData.nodes as GraphNode[];
const edges = hospitalGraphData.edges as GraphEdge[];
// MapLibre requires valid longitude/latitude ranges. This is a local rendering
// transform only; it does not assert that the graph has geographic coordinates.
export const toMapCoordinate = (x: number, y: number): [number, number] => [x / 100, y / 100];

const point = (node: GraphNode): Feature<Point> => ({
  type: 'Feature',
  properties: { id: node.id, name: node.name, floor: node.floor, category: node.category, roomNumber: node.roomNumber, pillarCode: node.pillarCode },
  geometry: { type: 'Point', coordinates: toMapCoordinate(node.x, node.y) },
});

export function floorFeatures(floor: number): FeatureCollection<Point> {
  return { type: 'FeatureCollection', features: nodes.filter((node) => node.floor === floor).map(point) };
}

export function floorWalkways(floor: number): FeatureCollection<LineString> {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return { type: 'FeatureCollection', features: edges.flatMap((edge) => {
    const from = byId.get(edge.from); const to = byId.get(edge.to);
    if (!from || !to || from.floor !== floor || to.floor !== floor) return [];
    return [{ type: 'Feature' as const, properties: { from: edge.from, to: edge.to, type: edge.type }, geometry: { type: 'LineString' as const, coordinates: [toMapCoordinate(from.x, from.y), toMapCoordinate(to.x, to.y)] } }];
  }) };
}

export function routeForFloor(pathNodes: GraphNode[], floor: number): FeatureCollection<LineString> {
  const features: Feature<LineString>[] = [];
  for (let index = 0; index < pathNodes.length - 1; index += 1) {
    const from = pathNodes[index]; const to = pathNodes[index + 1];
    if (from.floor === floor && to.floor === floor) features.push({ type: 'Feature', properties: { from: from.id, to: to.id }, geometry: { type: 'LineString', coordinates: [toMapCoordinate(from.x, from.y), toMapCoordinate(to.x, to.y)] } });
  }
  return { type: 'FeatureCollection', features };
}

export function markerFeature(node: GraphNode | null | undefined, floor: number, kind: 'start' | 'active' | 'destination'): FeatureCollection<Point> {
  return { type: 'FeatureCollection', features: node && node.floor === floor ? [{ ...point(node), properties: { ...point(node).properties, kind } }] : [] };
}
