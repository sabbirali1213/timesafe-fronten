// Firebase Configuration for TimeSafe Delivery - FCM & Hosting
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration - Using existing project
const firebaseConfig = {
  apiKey: "AIzaSyAuyqinrl2P8MEDsZ5WsGarmLqyzlyvxHE",
  authDomain: "timesafe-delivery.firebaseapp.com",
  projectId: "timesafe-delivery",
  storageBucket: "timesafe-delivery.firebasestorage.app",
  messagingSenderId: "883970361561",
  appId: "1:883970361561:web:3b9f34bb0e99e6c19b96c8",
  measurementId: "G-4SVYZCFHM9"
};

// Initialize Firebase (prevent multiple initialization)
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
export const db = getFirestore(app);

// Mock auth export to prevent import errors (still using Twilio)
export const auth = null;

// Notification permissions और token management
export const requestNotificationPermission = async () => {
  try {
    if (!messaging || !('Notification' in window)) {
      console.log('⚠️ Notifications not supported');
      return null;
    }

    console.log('🔔 Requesting notification permission...');
    
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      
      // Get FCM registration token
      const token = await getToken(messaging);
      
      if (token) {
        console.log('📱 FCM Token:', token);
        return token;
      } else {
        console.log('❌ No registration token available');
        return null;
      }
    } else {
      console.log('❌ Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

// Listen for foreground messages
export const onMessageListener = () => {
  if (!messaging) return Promise.resolve();
  
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('🔔 Foreground message received:', payload);
      
      // Show notification
      if (payload.notification) {
        showNotification(
          payload.notification.title || 'TimeSafe Delivery',
          payload.notification.body || 'New notification',
          payload.notification.icon
        );
      }
      
      resolve(payload);
    });
  });
};

// Show notification when app is in foreground
export const showNotification = (title, message, icon = '/favicon.ico') => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body: message,
      icon: icon,
      badge: icon,
      tag: 'timesafe-notification',
      requireInteraction: false
    });

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }
};

// Helper function to check if FCM is supported
export const isFirebaseMessagingSupported = () => {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window;
};

console.log('🔥 Firebase FCM ENABLED for push notifications');
export default app;