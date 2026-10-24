// Maps icon name strings to lucide-react components
import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

// Common aliases mapped to Lucide component names
const ALIASES: Record<string, string> = {
  'stethoscope': 'Stethoscope',
  'calendar-check': 'CalendarCheck',
  'flask-conical': 'FlaskConical',
  'scan': 'Scan',
  'triangle-alert': 'TriangleAlert',
  'pill': 'Pill',
  'bed': 'Bed',
  'door-open': 'DoorOpen',
  'door-closed': 'DoorClosed',
  'receipt': 'Receipt',
  'utensils': 'Utensils',
  'accessibility': 'Accessibility',
  'sparkles': 'Sparkles',
  'trending-up': 'TrendingUp',
  'chevrons-up-down': 'ChevronsUpDown',
  'droplets': 'Droplets',
  'heart-handshake': 'HeartHandshake',
  'plus-square': 'PlusSquare',
  'grid': 'Grid',
  'map-pin': 'MapPin',
  'clock': 'Clock',
  'building-2': 'Building2',
  'shield-check': 'ShieldCheck',
  'search': 'Search',
  'phone-call': 'PhoneCall',
  'user': 'User',
  'users': 'Users',
  'help-circle': 'HelpCircle',
  'circle-help': 'CircleHelp',
};

function toPascalCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter) => letter.toUpperCase())
    .replace(/[\s\-_]+/g, '');
}

interface DynamicIconProps extends LucideProps {
  name: string;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  // Check explicit aliases first, then converted PascalCase, then direct name
  const resolvedName = ALIASES[name.toLowerCase()] || toPascalCase(name) || name;
  
  // Look up in all Lucide icons
  const Component = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[resolvedName] 
    ?? Icons.HelpCircle 
    ?? Icons.CircleHelp;

  return <Component {...props} />;
}
