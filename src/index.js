/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from 'react';
import './index.css';
import App from './App';
import { createRoot } from 'react-dom/client';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import IndexedKV from "./utils/IndexedKV";
import sbContext from './stores/Snackabra.Store'

const container = document.getElementById('root');
const root = createRoot(container);

document.addEventListener('touchmove', function (event) {
  if (event.scale !== 1) { event.preventDefault(); }
}, { passive: false });

document.addEventListener("localKvReady", async (e) => {
  sbContext.init().then(() => {
    root.render(<App />);
  })

});


const localKV = new IndexedKV({ db: 'sb_files', table: 'files' })

Object.defineProperty(document, 'cacheDb', {
  value: localKV
});

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const publicVapidKey =
  'BBD9IB4xvFCN_ZoU9MKJdaDbQH55aCOqmTZ5lvDU_LSgKSFCt9AnIdY3tT1kLI0bRjEtf8JQgJ-dhvYtEfqskGU'


function notify(registration) {
  console.log(JSON.stringify(Object.keys(window)))
  if(!("periodicSync" in registration)){
    console.log("This browser does not support desktop periodicSync");
  }else{
    registration.periodicSync.register('get-notifications', {
      minInterval: 60000,
    }).then(()=>{
      console.log()
    })
  }
  if (!("Notification" in window)) {
    // Check if the browser supports notifications
    console.log("This browser does not support desktop notification");
  } else if (Notification.permission === "granted") {
    registration.pushManager.getSubscription()
      .then((subscription) => {
        if (!subscription) {
          // We aren't subscribed to push
          return;
        }
        console.log('Existing sub:', subscription)
        fetch('https://heylisten-384co.herokuapp.com/subscription', {
          method: 'POST',
          body: JSON.stringify(subscription),
          headers: {
            'content-type': 'application/json',
          }
        })
      })
  } else if (Notification.permission !== "denied") {
    // We need to ask the user for permission
    Notification.requestPermission().then((permission) => {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        console.log(registration)
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
        }).then((subscription) => {
          fetch('https://heylisten-384co.herokuapp.com/subscription', {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: {
              'content-type': 'application/json',
            }
          }).then((res) => {
            if (res.ok) {
              return res.json();
            } else {
              throw new Error('Shit broke')
            }
          }).then((body) => {
            console.log(body);
            console.log('Sending push notification')
            localStorage.setItem('sb_push', body.id);
            const pushbody = {
              title: '[384co] Push?',
              text: 'Notifications registered!!',
              url: 'https://heylisten-384co.herokuapp.com/'
            }
            fetch(`https://heylisten-384co.herokuapp.com/subscription/${body.id}`, {
              method: 'POST',
              body: JSON.stringify(pushbody),
              headers: {
                'content-type': 'application/json'
              }
            })
          }).catch(console.error)
        })

      }
    });
  }

  // At last, if the user has denied notifications, and you
  // want to be respectful there is no need to bother them anymore.
}


if (process.env.NODE_ENV === 'production') {

  console.log(process.env.NODE_ENV + ' registering service worker')
  serviceWorkerRegistration.register(null, notify);
}

