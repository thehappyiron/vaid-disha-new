// Maps icon name strings from mock data to lucide-react components
import {
  Stethoscope,
  CalendarCheck,
  FlaskConical,
  Scan,
  TriangleAlert,
  Pill,
  Bed,
  DoorOpen,
  Receipt,
  Utensils,
  HelpCircle,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

type IconName =
  | 'stethoscope'
  | 'calendar-check'
  | 'flask-conical'
  | 'scan'
  | 'triangle-alert'
  | 'pill'
  | 'bed'
  | 'door-open'
  | 'receipt'
  | 'utensils';

const ICON_MAP: Record<IconName, React.ComponentType<LucideProps>> = {
  'stethoscope': Stethoscope,
  'calendar-check': CalendarCheck,
  'flask-conical': FlaskConical,
  'scan': Scan,
  'triangle-alert': TriangleAlert,
  'pill': Pill,
  'bed': Bed,
  'door-open': DoorOpen,
  'receipt': Receipt,
  'utensils': Utensils,
};

interface DynamicIconProps extends LucideProps {
  name: string;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const Component = ICON_MAP[name as IconName] ?? HelpCircle;
  return <Component {...props} />;
}
