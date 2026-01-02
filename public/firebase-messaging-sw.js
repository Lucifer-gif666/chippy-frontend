// Import Firebase scripts for messaging
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase inside Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyB0N22KvaDiRJuXq_bB-JWzNT2-L1eEm-M",
  authDomain: "chippyinn-4d031.firebaseapp.com",
  projectId: "chippyinn-4d031",
  storageBucket: "chippyinn-4d031.appspot.com",
  messagingSenderId: "64488962751",
  appId: "1:64488962751:web:437264a36a27e4be93e40a"
});

const messaging = firebase.messaging();

// Handle background notifications (ANDROID SAFE)
messaging.onBackgroundMessage((payload) => {
  console.log("[FCM] Background payload:", payload);

  const title =
    payload.notification?.title || "Chippy Inn";
  const body =
    payload.notification?.body || "New update";

  const url = payload.data?.url || "/staff-dashboard";
  const notificationId = payload.data?.notificationId;

  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url, notificationId },
  });
});


// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { url, notificationId } = event.notification.data;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus an existing window or open a new one
      for (let client of windowClients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    }).then(() => {
      // Optional: mark notification as read in your backend
      fetch(`/api/mark-notification-read/${notificationId}`, { method: "POST" });
    })
  );
});
