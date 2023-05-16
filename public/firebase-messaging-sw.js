importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js')

const firebaseConfig = {
  apiKey: "AIzaSyASYz37SmN5JGJZuMy5J8YCD6_YF70hVkQ",
  authDomain: "galoy-pura-vida.firebaseapp.com",
  projectId: "galoy-pura-vida",
  storageBucket: "galoy-pura-vida.appspot.com",
  messagingSenderId: "864118073014",
  appId: "1:864118073014:web:e2e118331b93a07f37e817",
  measurementId: "G-K06EMBK41L"
}

firebase.initializeApp(firebaseConfig)

class CustomPushEvent extends Event {
  constructor(data) {
    super('push');

    Object.assign(this, data);
    this.custom = true;
  }
}

/*
 * Overrides push notification data, to avoid having 'notification' key and firebase blocking
 * the message handler from being called
 */
self.addEventListener('push', (e) => {
  // Skip if event is our own custom event
  if (e.custom) return;

  // Kep old event data to override
  const oldData = e.data;

  // Create a new event to dispatch, pull values from notification key and put it in data key,
  // and then remove notification key
  const newEvent = new CustomPushEvent({
    data: {
      ehheh: oldData.json(),
      json() {
        const newData = oldData.json();
        newData.data = {
          ...newData.data,
          ...newData.notification,
        };
        delete newData.notification;
        return newData;
      },
    },
    waitUntil: e.waitUntil.bind(e),
  });

  // Stop event propagation
  e.stopImmediatePropagation();

  // Dispatch the new wrapped event
  dispatchEvent(newEvent);
});

const messaging = firebase.messaging()

messaging.onBackgroundMessage(function(payload) {
  console.log(
      "[firebase-messaging-sw.js] Received background message ",
      payload,
  );

  const notificationTitle = "Bitcoin Jungle"
  const notificationOptions = {
      body: payload.data.title,
      icon: "/images/favicon-150x150.png",
  };

  return self.registration.showNotification(
      notificationTitle,
      notificationOptions,
  );
});