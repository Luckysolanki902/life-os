/**
 * Haptic feedback utility that works on both Web and Capacitor
 * Uses the Web Vibration API and Capacitor Haptics plugin
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

// Vibration patterns (in ms) for different feedback types
const VIBRATION_PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 20], // Short-pause-medium
  warning: [15, 30, 15], // Medium pulses
  error: [30, 50, 30, 50, 30], // Triple heavy
  selection: 5, // Very subtle
};

// Check if we're in a Capacitor native environment
const isCapacitor = (): boolean => {
  return typeof window !== 'undefined' && 
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         !!(window as any).Capacitor?.isNativePlatform?.();
};

// Check if web vibration is supported
const hasVibrationSupport = (): boolean => {
  return typeof window !== 'undefined' && 'vibrate' in navigator;
};

/**
 * Trigger haptic feedback
 * Works seamlessly on web (Vibration API) and Capacitor (native haptics)
 */
export async function haptic(style: HapticStyle = 'light'): Promise<void> {
  try {
    if (isCapacitor()) {
      // Use Capacitor Haptics plugin if available
      const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
      
      switch (style) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;
        case 'selection':
          await Haptics.selectionStart();
          await Haptics.selectionEnd();
          break;
      }
    } else if (hasVibrationSupport()) {
      // Fallback to Web Vibration API
      const pattern = VIBRATION_PATTERNS[style];
      navigator.vibrate(pattern);
    }
    // Silently fail if neither is available (desktop browsers)
  } catch {
    // Silently fail - haptics are nice-to-have, not critical
  }
}

// Convenience functions for common actions
export const hapticLight = () => haptic('light');
export const hapticMedium = () => haptic('medium');
export const hapticHeavy = () => haptic('heavy');
export const hapticSuccess = () => haptic('success');
export const hapticWarning = () => haptic('warning');
export const hapticError = () => haptic('error');
export const hapticSelection = () => haptic('selection');

// Task-specific haptics
export const hapticTaskComplete = () => haptic('success');
export const hapticTaskUncomplete = () => haptic('light');
export const hapticTaskSkip = () => haptic('warning');
export const hapticTaskUnskip = () => haptic('light');
