/* eslint-disable no-restricted-globals */

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.
// You can also remove this file if you'd prefer not to use a
// service worker, and the Workbox build step will be skipped.

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';
const base64ToArrayBuffer = require('snackabra').base64ToArrayBuffer

clientsClaim();

// Precache all of the assets generated by your build process.
// Their URLs are injected into the manifest variable below.
// This variable must be present somewhere in your service worker file,
// even if you decide not to use precaching. See https://cra.link/PWA
precacheAndRoute(self.__WB_MANIFEST);

// Set up App Shell-style routing, so that all navigation requests
// are fulfilled with your index.html shell. Learn more at
// https://developers.google.com/web/fundamentals/architecture/app-shell
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  // Return false to exempt requests from being fulfilled by index.html.
  ({ request, url }) => {
    // If this isn't a navigation, skip.
    if (request.mode !== 'navigate') {
      return false;
    } // If this is a URL that starts with /_, skip.

    if (url.pathname.startsWith('/_')) {
      return false;
    } // If this looks like a URL for a resource, because it contains // a file extension, skip.

    if (url.pathname.match(fileExtensionRegexp)) {
      return false;
    } // Return true to signal that we want to use the handler.

    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// An example runtime caching route for requests that aren't handled by the
// precache, in this case same-origin .png requests like those from in public/
registerRoute(
  // Add in any other file extensions or routing criteria as needed.
  ({ url }) => (url.origin === self.location.origin && url.pathname.endsWith('.png')) || url.pathname.startsWith('data:image'), // Customize this strategy as needed, e.g., by changing to CacheFirst.
  new StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [
      // Ensure that once this runtime cache reaches a maximum size the
      // least-recently used images are removed.
      new ExpirationPlugin({ maxEntries: 500 }),
    ],
  })
);

// This allows the web app to trigger skipWaiting via
// registration.waiting.postMessage({type: 'SKIP_WAITING'})
self.addEventListener('message', (event) => {
  console.log('message', event)
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'NOTIFICATION_RESPOND') {
    notify(event.data.notification)
  }
});

// self.addEventListener('statechange', e => {
//   if (e.target.state === 'activated') {
//     window.location.reload();
//   }
// });

// Any other custom service worker logic can go here.
// For push notifications
let notificationTimeout = {}
const notify = (data) => {
  if (notificationTimeout[data.tag]) {
    clearTimeout(notificationTimeout[data.tag])
  }
  notificationTimeout[data.tag] = setTimeout(() => {
    self.registration.showNotification(data.title, {
      ...data
    })
    delete notificationTimeout[data.tag]
  }, 250)
}

self.addEventListener('push', (event) => {
  const data = event.data.json()

  console.log('Got push', data)
  const clients = self.clients;
  const channel_id = data.data.channel_id;
  data.icon = "https://sn.ac/mstile-144x144.png"
  event.waitUntil(clients.matchAll({ type: "window" }).then((clientList) => {
    console.log(clientList, clientList[0].url, clientList[0].url.endsWith(channel_id))
    if (clientList.length > 0) {
      for (let x in clientList) {
        console.log(clientList[x])
        clientList[x].postMessage({
          type: 'notification',
          channel_id: channel_id,
          notification: data
        })
      }
    } else {
      notify(data)
    }
  }));
})

self.addEventListener("pushsubscriptionchange", async (event) => {
  console.log('Subscription expired... renweing');
  const subscription = await window.sw_registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64ToArrayBuffer(process.env.REACT_APP_PUBLIC_VAPID_KEY),
  })

  await fetch(process.env.REACT_APP_NOTIFICATION_SERVER + '/subscribe', {
    method: 'POST',
    body: JSON.stringify({
      channel_id: this.props.roomId,
      subscription: subscription
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}, false);

self.addEventListener('notificationclick', (event) => {
  console.log('On notification click: ', event.notification);
  const channel_id = event.notification.data.channel_id;
  event.notification.close();
  const clients = self.clients;

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(clients.matchAll({ type: "window" }).then((clientList) => {
    for (const client of clientList) {
      console.log(client.url, channel_id)
      if ('focus' in client) {
        client.postMessage({
          type: 'focus',
          channel_id: channel_id,
        })
        return client.focus();
      }
    }

    if (clients.openWindow) return clients.openWindow('/' + channel_id);

  }));
});

function getNotifications() {
  return new Promise((resolve, reject) => {
    self.registration.pushManager.getSubscription()
      .then((subscription) => {
        if (!subscription) {
          // We aren't subscribed to push
          resolve('not subscribed')
        }
        console.log('Existing sub:', subscription)
        fetch(process.env.REACT_APP_NOTIFICATION_SERVER, {
          method: 'POST',
          body: JSON.stringify(subscription),
          headers: {
            'content-type': 'application/json',
          }
        }).then(() => {
          resolve('Success')
        })
      }).catch((e) => {
        console.error(e)
        reject(e)
      })
  })

}

self.addEventListener("periodicsync", (event) => {
  console.log('test', event)
  if (event.tag === "get-notifications") {
    event.waitUntil(getNotifications());
  }
});