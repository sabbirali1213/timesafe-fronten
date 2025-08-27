// Firebase Cloud Messaging Service Worker
// This file handles background push notifications

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration - same as main app
const firebaseConfig = {
  apiKey: "AIzaSyAuyqinrl2P8MEDsZ5WsGarmLqyzlyvxHE",
  authDomain: "timesafe-delivery.firebaseapp.com",
  projectId: "timesafe-delivery",
  storageBucket: "timesafe-delivery.firebasestorage.app",
  messagingSenderId: "883970361561",
  appId: "1:883970361561:web:3b9f34bb0e99e6c19b96c8"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging object
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Background message received: ', payload);

  // Customize notification
  const notificationTitle = payload.notification?.title || '🏪 TimeSafe Delivery';
  const notificationOptions = {
    body: payload.notification?.body || 'New notification from TimeSafe Delivery',
    icon: payload.notification?.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'timesafe-delivery',
    requireInteraction: false,
    actions: [
      {
        action: 'open_app',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked: ', event);
  
  event.notification.close();

  if (event.action === 'open_app') {
    // Open app when notification is clicked
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'dismiss') {
    // Just close notification
    return;
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});