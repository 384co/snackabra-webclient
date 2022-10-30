import { makeObservable, observable, action, computed } from "mobx"
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



class SnackabraStore {
  @observable showAdminTab = false;
  @observable roomMetadata = {};
  @observable userName = '';
  @observable sbConfig = {
    channel_server: process.env.REACT_APP_ROOM_SERVER,
    channel_ws: process.env.REACT_APP_ROOM_SERVER_WS,
    storage_server: process.env.REACT_APP_STORAGE_SERVER
  }

  constructor() {
    makeObservable(this)
    onBecomeObserved(this, "roomMetadata", this.resume)
    onBecomeUnobserved(this, "roomMetadata", this.suspend)
  }

  resume = () => {
    console.log(`Resuming`)
}

  suspend = () => {
    console.log(`Suspending`, this)
}

  @action
  setUsername = (userName) => {
    this.userName = userName
  }

  @computed
  createRoom = (secret) => {
    const SB = new Snackabra(this.sbConfig)
    // create a new channel (room), returns (owner) key and channel name:
    SB.create(this.sbConfig, secret).then((handle) => {
      console.log(`you can (probably) connect here: localhost:3000/rooms/${handle.channelId}`)
      // connect to the websocket with our handle info:
      SB.connect(
        // must have a message handler:
        (m) => { console.log(`got message: ${m}`) },
        handle.key, // if we omit then we're connecting anonymously (and not as owner)
        handle.channelId // since we're owner this is optional
      ).then((c) => c.ready).then((c) => {
        c.userName = "TestBot"; // optional
        this.setUsername(c.userName)
        // say hello to everybody! upon success it will return "success"
        (new SBMessage(c, "Hello from TestBot!")).send().then((c) => { console.log(`test message sent! (${c})`) })
      })
    })
  }


};

export default SnackabraStore;
