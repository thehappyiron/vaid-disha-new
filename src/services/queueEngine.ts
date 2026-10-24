import type { QueueEntry } from './liveStore';

export interface SmartQueueSettings {
  prioritizeEmergency: boolean;
  prioritizeElderlyDisabled: boolean;
  autoRecalculateWaitTimes: boolean;
}

export const DEFAULT_SMART_QUEUE_SETTINGS: SmartQueueSettings = {
  prioritizeEmergency: true,
  prioritizeElderlyDisabled: true,
  autoRecalculateWaitTimes: true,
};

export interface PriorityExplanation {
  badge: string;
  reason: string;
  level: 'emergency' | 'priority' | 'normal';
}

/**
 * Generates a plain-language explanation for why a patient is in their queue position
 */
export function getPatientPriorityExplanation(
  patient: QueueEntry,
  settings: SmartQueueSettings = DEFAULT_SMART_QUEUE_SETTINGS
): PriorityExplanation {
  if (patient.isEmergency) {
    return {
      badge: 'Emergency Priority',
      reason: 'Urgent medical symptoms reported. Triaged to top of queue for immediate clinical attention.',
      level: 'emergency',
    };
  }

  if (settings.prioritizeElderlyDisabled) {
    const isElderly = (patient.age !== undefined && patient.age >= 65) || patient.isElderly;
    const hasAccessibility = patient.accessibilityNeeds && patient.accessibilityNeeds.length > 0;

    if (isElderly && hasAccessibility) {
      return {
        badge: 'Elderly & Accessibility Priority',
        reason: `Senior citizen (${patient.age || '65+'} yrs) requesting ${patient.accessibilityNeeds?.join(', ')} assistance. Moved ahead of standard tokens.`,
        level: 'priority',
      };
    }

    if (isElderly) {
      return {
        badge: 'Senior Citizen Priority',
        reason: `Patient age is ${patient.age || 65}+ (priority policy). Moved ahead of routine consultations.`,
        level: 'priority',
      };
    }

    if (hasAccessibility) {
      const needs = patient.accessibilityNeeds?.join(', ') || 'mobility assistance';
      return {
        badge: 'Accessibility Priority',
        reason: `Special assistance requested (${needs}). Priority room scheduling enabled.`,
        level: 'priority',
      };
    }
  }

  if (patient.status === 'in_progress') {
    return {
      badge: 'Attending Specialist',
      reason: 'Patient is actively consulting inside the consultation room.',
      level: 'normal',
    };
  }

  return {
    badge: 'Standard Queue Order',
    reason: `Position is determined by token issue order and check-in time.`,
    level: 'normal',
  };
}

/**
 * Reorders a department's waiting queue based on smart triage rules:
 * 1. Emergency first
 * 2. Elderly (65+) / Accessibility needs second
 * 3. Token order / timestamp third
 */
export function sortQueueWithEngine(
  entries: QueueEntry[],
  settings: SmartQueueSettings = DEFAULT_SMART_QUEUE_SETTINGS
): QueueEntry[] {
  const inProgress = entries.filter((e) => e.status === 'in_progress');
  const waiting = entries.filter((e) => e.status === 'waiting' || e.status === 'turn_soon');
  const completed = entries.filter((e) => e.status === 'completed' || e.status === 'cancelled');

  const sortedWaiting = [...waiting].sort((a, b) => {
    // 1. Emergency cases sort to the top
    if (settings.prioritizeEmergency) {
      const aEmg = a.isEmergency ? 1 : 0;
      const bEmg = b.isEmergency ? 1 : 0;
      if (aEmg !== bEmg) return bEmg - aEmg;
    }

    // 2. Elderly / Accessibility needs next
    if (settings.prioritizeElderlyDisabled) {
      const aPriority =
        (a.age && a.age >= 65) || a.isElderly || (a.accessibilityNeeds && a.accessibilityNeeds.length > 0)
          ? 1
          : 0;
      const bPriority =
        (b.age && b.age >= 65) || b.isElderly || (b.accessibilityNeeds && b.accessibilityNeeds.length > 0)
          ? 1
          : 0;
      if (aPriority !== bPriority) return bPriority - aPriority;
    }

    // 3. Fall back to original queue position / time
    return (a.position || 0) - (b.position || 0);
  });

  return [...inProgress, ...sortedWaiting, ...completed];
}
