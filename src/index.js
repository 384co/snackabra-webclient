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
if (process.env.NODE_ENV === 'production') {

  console.log(process.env.NODE_ENV + ' registering service worker')
  serviceWorkerRegistration.register();
}

