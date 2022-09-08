/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from 'react';
import './index.css';
import App from './App';
import { createRoot } from 'react-dom/client';
import IndexedKV from "./utils/IndexedKV";
const SB = require('snackabra')
const sb_config = {
  channel_server: process.env.REACT_APP_ROOM_SERVER,
  channel_ws: process.env.REACT_APP_ROOM_SERVER_WS,
  storage_server: process.env.REACT_APP_STORAGE_SERVER
};
const container = document.getElementById('root');
const root = createRoot(container);

Object.defineProperty(document, 'Snackabra', {
  value: new SB.Snackabra(sb_config)
});

document.addEventListener("localKvReady", function(e) {
  root.render(<App />);
});


const localKV = new IndexedKV({db: 'sb_files', table: 'files'})

Object.defineProperty(document, 'cacheDb', {
  value: localKV
});




