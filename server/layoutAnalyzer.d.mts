export interface DetectedRoom {
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

export interface CorridorSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
}

export interface EntrancePoint {
  name: string;
  x: number;
  y: number;
}

export interface DigitizedLayout {
  hospitalName: string;
  wing: string;
  overview: string;
  detectedRooms: DetectedRoom[];
  corridors: CorridorSegment[];
  entrance: EntrancePoint;
  source: string;
}

export function analyzeLayoutWithGroq(
  imageBase64: string,
  groqKey: string
): Promise<DigitizedLayout>;
