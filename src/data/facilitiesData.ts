/**
 * Facilities Metadata and Floor Map Pin Registry
 * 
 * Each facility type has a distinct SHAPE + ICON + LABEL for non-color accessibility.
 */

export type FacilityCategory =
  | 'all'
  | 'washroom'
  | 'wheelchair'
  | 'lift'
  | 'ramp'
  | 'drinking_water'
  | 'prayer_room'
  | 'pharmacy';

export type PinShape =
  | 'rounded-square'
  | 'circle'
  | 'double-circle'
  | 'hexagon'
  | 'trapezoid'
  | 'diamond'
  | 'octagon'
  | 'cross';

export interface FacilityPin {
  id: string;
  category: FacilityCategory;
  name: string;
  nameKey: string;
  descriptionKey: string;
  floor: number;
  x: number;
  y: number;
  nodeId: string;
  shape: PinShape;
  iconName: string;
  shapeLabel: string;
  isAccessible: boolean;
  pillarCode?: string;
  bgColor: string;
  strokeColor: string;
}

export const FACILITY_PINS: FacilityPin[] = [
  // ── Wheelchair Stands & Access Points (Rounded Square) ─────────────────────
  {
    id: 'fac-wc-1',
    category: 'wheelchair',
    name: 'Wheelchair Stand & Assistant Point',
    nameKey: 'facilities.wheelchair_stand_main',
    descriptionKey: 'facilities.wheelchair_stand_desc',
    floor: 0,
    x: 290,
    y: 460,
    nodeId: 'wheelchair-f0-main',
    shape: 'rounded-square',
    iconName: 'Accessibility',
    shapeLabel: 'Wheelchair Stand',
    isAccessible: true,
    pillarCode: 'F0-WC1',
    bgColor: '#dbeafe',
    strokeColor: '#2563eb',
  },

  // ── Ramps (Trapezoid / Incline) ───────────────────────────────────────────
  {
    id: 'fac-ramp-1',
    category: 'ramp',
    name: 'Main Entrance Access Ramp',
    nameKey: 'facilities.ramp_main',
    descriptionKey: 'facilities.ramp_main_desc',
    floor: 0,
    x: 510,
    y: 460,
    nodeId: 'ramp-f0-main',
    shape: 'trapezoid',
    iconName: 'TrendingUp',
    shapeLabel: 'Access Ramp',
    isAccessible: true,
    pillarCode: 'F0-RP1',
    bgColor: '#e0e7ff',
    strokeColor: '#4f46e5',
  },

  // ── Washrooms (Circle / Double-Circle for Accessible) ──────────────────────
  {
    id: 'fac-wash-0',
    category: 'washroom',
    name: 'Ground Floor Accessible Washroom',
    nameKey: 'facilities.washroom_f0_accessible',
    descriptionKey: 'facilities.washroom_f0_desc',
    floor: 0,
    x: 190,
    y: 250,
    nodeId: 'washroom-f0',
    shape: 'double-circle',
    iconName: 'Sparkles',
    shapeLabel: 'Accessible Washroom',
    isAccessible: true,
    pillarCode: 'F0-W1',
    bgColor: '#dcfce7',
    strokeColor: '#16a34a',
  },
  {
    id: 'fac-wash-1-acc',
    category: 'washroom',
    name: 'Floor 1 Accessible Washroom',
    nameKey: 'facilities.washroom_f1_accessible',
    descriptionKey: 'facilities.washroom_f1_acc_desc',
    floor: 1,
    x: 160,
    y: 260,
    nodeId: 'washroom-f1-acc',
    shape: 'double-circle',
    iconName: 'Sparkles',
    shapeLabel: 'Accessible Washroom',
    isAccessible: true,
    pillarCode: 'F1-WA1',
    bgColor: '#dcfce7',
    strokeColor: '#16a34a',
  },
  {
    id: 'fac-wash-1-std',
    category: 'washroom',
    name: 'Floor 1 Standard Washroom',
    nameKey: 'facilities.washroom_f1_std',
    descriptionKey: 'facilities.washroom_f1_std_desc',
    floor: 1,
    x: 170,
    y: 195,
    nodeId: 'washroom-f1',
    shape: 'circle',
    iconName: 'DoorClosed',
    shapeLabel: 'Standard Washroom',
    isAccessible: false,
    pillarCode: 'F1-W1',
    bgColor: '#f1f5f9',
    strokeColor: '#475569',
  },
  {
    id: 'fac-wash-2-std',
    category: 'washroom',
    name: 'Floor 2 Washroom',
    nameKey: 'facilities.washroom_f2_std',
    descriptionKey: 'facilities.washroom_f2_desc',
    floor: 2,
    x: 170,
    y: 195,
    nodeId: 'washroom-f2',
    shape: 'circle',
    iconName: 'DoorClosed',
    shapeLabel: 'Standard Washroom',
    isAccessible: false,
    pillarCode: 'F2-W1',
    bgColor: '#f1f5f9',
    strokeColor: '#475569',
  },

  // ── Lifts (Hexagon) ───────────────────────────────────────────────────────
  {
    id: 'fac-lift-a-f0',
    category: 'lift',
    name: 'Lift A (West Core)',
    nameKey: 'facilities.lift_a',
    descriptionKey: 'facilities.lift_desc',
    floor: 0,
    x: 350,
    y: 190,
    nodeId: 'lift-a-f0',
    shape: 'hexagon',
    iconName: 'ChevronsUpDown',
    shapeLabel: 'Lift',
    isAccessible: true,
    pillarCode: 'F0-L1',
    bgColor: '#eff6ff',
    strokeColor: '#0072b2',
  },
  {
    id: 'fac-lift-b-f0',
    category: 'lift',
    name: 'Lift B (East Core - Stretcher Size)',
    nameKey: 'facilities.lift_b',
    descriptionKey: 'facilities.lift_b_desc',
    floor: 0,
    x: 450,
    y: 190,
    nodeId: 'lift-b-f0',
    shape: 'hexagon',
    iconName: 'ChevronsUpDown',
    shapeLabel: 'Lift (Stretcher)',
    isAccessible: true,
    pillarCode: 'F0-L2',
    bgColor: '#eff6ff',
    strokeColor: '#0072b2',
  },
  {
    id: 'fac-lift-a-f1',
    category: 'lift',
    name: 'Lift A (Floor 1)',
    nameKey: 'facilities.lift_a',
    descriptionKey: 'facilities.lift_desc',
    floor: 1,
    x: 350,
    y: 190,
    nodeId: 'lift-a-f1',
    shape: 'hexagon',
    iconName: 'ChevronsUpDown',
    shapeLabel: 'Lift',
    isAccessible: true,
    pillarCode: 'F1-L1',
    bgColor: '#eff6ff',
    strokeColor: '#0072b2',
  },
  {
    id: 'fac-lift-b-f1',
    category: 'lift',
    name: 'Lift B (Floor 1)',
    nameKey: 'facilities.lift_b',
    descriptionKey: 'facilities.lift_b_desc',
    floor: 1,
    x: 450,
    y: 190,
    nodeId: 'lift-b-f1',
    shape: 'hexagon',
    iconName: 'ChevronsUpDown',
    shapeLabel: 'Lift (Stretcher)',
    isAccessible: true,
    pillarCode: 'F1-L2',
    bgColor: '#eff6ff',
    strokeColor: '#0072b2',
  },
  {
    id: 'fac-lift-a-f2',
    category: 'lift',
    name: 'Lift A (Floor 2)',
    nameKey: 'facilities.lift_a',
    descriptionKey: 'facilities.lift_desc',
    floor: 2,
    x: 350,
    y: 190,
    nodeId: 'lift-a-f2',
    shape: 'hexagon',
    iconName: 'ChevronsUpDown',
    shapeLabel: 'Lift',
    isAccessible: true,
    pillarCode: 'F2-L1',
    bgColor: '#eff6ff',
    strokeColor: '#0072b2',
  },
  {
    id: 'fac-lift-b-f2',
    category: 'lift',
    name: 'Lift B (Floor 2)',
    nameKey: 'facilities.lift_b',
    descriptionKey: 'facilities.lift_b_desc',
    floor: 2,
    x: 450,
    y: 190,
    nodeId: 'lift-b-f2',
    shape: 'hexagon',
    iconName: 'ChevronsUpDown',
    shapeLabel: 'Lift (Stretcher)',
    isAccessible: true,
    pillarCode: 'F2-L2',
    bgColor: '#eff6ff',
    strokeColor: '#0072b2',
  },

  // ── Drinking Water (Diamond) ──────────────────────────────────────────────
  {
    id: 'fac-water-0',
    category: 'drinking_water',
    name: 'Filtered Drinking Water Station (Ground)',
    nameKey: 'facilities.water_station_f0',
    descriptionKey: 'facilities.water_station_desc',
    floor: 0,
    x: 490,
    y: 360,
    nodeId: 'water-f0',
    shape: 'diamond',
    iconName: 'Droplets',
    shapeLabel: 'Drinking Water',
    isAccessible: true,
    pillarCode: 'F0-DW1',
    bgColor: '#e0f2fe',
    strokeColor: '#0284c7',
  },
  {
    id: 'fac-water-1',
    category: 'drinking_water',
    name: 'Filtered Drinking Water Station (Floor 1)',
    nameKey: 'facilities.water_station_f1',
    descriptionKey: 'facilities.water_station_desc',
    floor: 1,
    x: 490,
    y: 260,
    nodeId: 'water-f1',
    shape: 'diamond',
    iconName: 'Droplets',
    shapeLabel: 'Drinking Water',
    isAccessible: true,
    pillarCode: 'F1-DW1',
    bgColor: '#e0f2fe',
    strokeColor: '#0284c7',
  },
  {
    id: 'fac-water-2',
    category: 'drinking_water',
    name: 'Filtered Drinking Water Station (Floor 2)',
    nameKey: 'facilities.water_station_f2',
    descriptionKey: 'facilities.water_station_desc',
    floor: 2,
    x: 490,
    y: 260,
    nodeId: 'water-f2',
    shape: 'diamond',
    iconName: 'Droplets',
    shapeLabel: 'Drinking Water',
    isAccessible: true,
    pillarCode: 'F2-DW1',
    bgColor: '#e0f2fe',
    strokeColor: '#0284c7',
  },

  // ── Prayer / Quiet Room (Octagon) ─────────────────────────────────────────
  {
    id: 'fac-prayer-1',
    category: 'prayer_room',
    name: 'Interfaith Prayer & Quiet Room',
    nameKey: 'facilities.prayer_room_f1',
    descriptionKey: 'facilities.prayer_room_desc',
    floor: 1,
    x: 670,
    y: 260,
    nodeId: 'prayer-f1',
    shape: 'octagon',
    iconName: 'HeartHandshake',
    shapeLabel: 'Prayer & Quiet Room',
    isAccessible: true,
    pillarCode: 'F1-PR1',
    bgColor: '#fae8ff',
    strokeColor: '#c026d3',
  },

  // ── Pharmacy (Medical Cross) ──────────────────────────────────────────────
  {
    id: 'fac-pharmacy-0',
    category: 'pharmacy',
    name: 'Central Hospital Pharmacy (24/7)',
    nameKey: 'facilities.pharmacy_central',
    descriptionKey: 'facilities.pharmacy_desc',
    floor: 0,
    x: 160,
    y: 420,
    nodeId: 'pharmacy',
    shape: 'cross',
    iconName: 'PlusSquare',
    shapeLabel: 'Pharmacy',
    isAccessible: true,
    pillarCode: 'F0-P3',
    bgColor: '#fee2e2',
    strokeColor: '#dc2626',
  },
];

export const FACILITY_FILTER_OPTIONS: { id: FacilityCategory; labelKey: string; icon: string }[] = [
  { id: 'all', labelKey: 'facilities.filter_all', icon: 'Grid' },
  { id: 'washroom', labelKey: 'facilities.filter_washrooms', icon: 'Sparkles' },
  { id: 'wheelchair', labelKey: 'facilities.filter_wheelchair', icon: 'Accessibility' },
  { id: 'lift', labelKey: 'facilities.filter_lifts', icon: 'ChevronsUpDown' },
  { id: 'ramp', labelKey: 'facilities.filter_ramps', icon: 'TrendingUp' },
  { id: 'drinking_water', labelKey: 'facilities.filter_water', icon: 'Droplets' },
  { id: 'prayer_room', labelKey: 'facilities.filter_prayer', icon: 'HeartHandshake' },
  { id: 'pharmacy', labelKey: 'facilities.filter_pharmacy', icon: 'PlusSquare' },
];
