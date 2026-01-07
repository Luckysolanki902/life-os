'use client';

// Push notification utilities for Capacitor
// This file handles push notification registration and permission requests

interface PushNotificationToken {
  value: string;
}

interface PushNotificationRegistration {
  token: string;
  platform: 'android' | 'ios' | 'web';
}

// Check if we're running in Capacitor (native app)
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
}

// Initialize push notifications
export async function initializePushNotifications(): Promise<PushNotificationRegistration | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    // Dynamically import Capacitor plugins only when needed
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const { Capacitor } = await import('@capacitor/core');
    
    if (!Capacitor.isNativePlatform()) {
      console.log('Not a native platform, skipping push notification setup');
      return null;
    }
    
    // Request permission
    const permStatus = await PushNotifications.requestPermissions();
    
    if (permStatus.receive !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }
    
    // Register with FCM/APNs
    await PushNotifications.register();
    
    // Wait for registration token
    return new Promise((resolve) => {
      PushNotifications.addListener('registration', async (token: PushNotificationToken) => {
        console.log('Push registration success, token:', token.value);
        
        // Send token to server
        try {
          await fetch('/api/notifications/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pushToken: token.value }),
          });
        } catch (error) {
          console.error('Failed to save push token:', error);
        }
        
        resolve({
          token: token.value,
          platform: Capacitor.getPlatform() as 'android' | 'ios',
        });
      });
      
      // Handle registration errors
      setTimeout(() => {
        // Timeout after 10 seconds
        resolve(null);
      }, 10000);
    });
    
  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
    return null;
  }
}

// Set up notification listeners
export async function setupNotificationListeners() {
  if (typeof window === 'undefined') return;
  
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const { Capacitor } = await import('@capacitor/core');
    
    if (!Capacitor.isNativePlatform()) return;
    
    // When notification is received while app is open
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
      
      // You can show an in-app notification here
      // Or update the UI based on the notification
    });
    
    // When user taps on notification
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push notification action:', action);
      
      // Navigate based on notification data
      const data = action.notification.data;
      if (data?.url) {
        window.location.href = data.url;
      }
    });
    
  } catch (error) {
    console.error('Failed to setup notification listeners:', error);
  }
}

// Request notification permission for web browsers
export async function requestWebNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'denied') {
    return false;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Show a local notification (for web)
export function showLocalNotification(title: string, body: string, url?: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }
  
  if (Notification.permission !== 'granted') {
    return;
  }
  
  const notification = new Notification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
  });
  
  if (url) {
    notification.onclick = () => {
      window.focus();
      window.location.href = url;
    };
  }
}
