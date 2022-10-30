import * as React from "react"
import {
    ab2str,
    str2ab,
    base64ToArrayBuffer,
    arrayBufferToBase64,
    getRandomValues,
    // jsonParseWrapper,
    // Channel,
    // Identity,
    MessageBus,
    // SBFile,
    SBMessage,
    Snackabra,
    ChannelMessage,
    SBObjectHandle,
    SBChannelHandle,
    SBServer,
    compareBuffers
  } from "snackabra";

const SnackabraContext = React.createContext(undefined);


export const SnackabraProvider = ({ children }) => {
  const [showAdminTab, setShowAdminTab] = React.useState(false);
  const [roomMetadata, setRoomMetadata] = React.useState({});
    const [sbConfig, setSBConfig] = React.useState({
        channel_server: process.env.REACT_APP_ROOM_SERVER,
        channel_ws: process.env.REACT_APP_ROOM_SERVER_WS,
        storage_server: process.env.REACT_APP_STORAGE_SERVER
      });

    const createRoom = (secret) =>{
        const SB = new Snackabra(sbConfig)
        // create a new channel (room), returns (owner) key and channel name:
        SB.create(sbConfig, secret).then((handle) => {
          console.log(`you can (probably) connect here: localhost:3000/rooms/${handle.channelId}`)
          // connect to the websocket with our handle info:
          SB.connect(
            // must have a message handler:
            (m) => { console.log(`got message: ${m}`) },
            handle.key, // if we omit then we're connecting anonymously (and not as owner)
            handle.channelId // since we're owner this is optional
          ).then((c) => c.ready).then((c) => {
            c.userName = "TestBot"; // optional
            // say hello to everybody! upon success it will return "success"
            (new SBMessage(c, "Hello from TestBot!")).send().then((c) => { console.log(`test message sent! (${c})`) })
          })
        })
    }

    return (<SnackabraContext.Provider value={{
        createRoom,
        showAdminTab,
        roomMetadata
    }}>
        {children}
    </SnackabraContext.Provider>)
};

export default SnackabraContext;

