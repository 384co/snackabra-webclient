import { makeObservable, observable, action, computed, onBecomeObserved, onBecomeUnobserved } from "mobx"
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

  sbConfig = {
    channel_server: process.env.REACT_APP_ROOM_SERVER,
    channel_ws: process.env.REACT_APP_ROOM_SERVER_WS,
    storage_server: process.env.REACT_APP_STORAGE_SERVER
  }
  rooms = {};
  motd = "";
  locked = false;
  isVerifiedGuest = false;
  roomMetadata = {};
  showAdminTab = false;
  userName = '';
  ownerRotation;
  ownerKey;
  roomCapacity = 20;
  messages = [];
  roomOwner = false;
  roomAdmin = false;
  keys = {}
  userKey = {};
  //might be more of a local state thing
  loadingMore = false;
  moreMessages = false;
  replyTo;
  replyEncryptionKey = {}
  activeRoom;
  joinRequests = {};
  contacts = {};
  SB = new Snackabra(this.sbConfig)

  constructor() {
    makeObservable(this, {
      createRoom: action,
      username: computed,
      loadingMore: observable,
      sbConfig: observable,
      roomMetadata: observable,
      showAdminTab: observable,
      userName: observable,
      rooms: observable,
      motd: observable,
      locked: observable,
      isVerifiedGuest: observable,
      ownerRotation: observable,
      roomCapacity: observable,
      messages: observable,
      replyTo: observable,
      replyEncryptionKey: observable,
      activeRoom: observable,
      roomOwner: observable,
      keys: observable,
      userKey: observable,
      ownerKey: observable,
      joinRequests: observable,
      roomAdmin: observable,
      contacts: observable
    })
    onBecomeObserved(this, "roomMetadata", this.resume)
    onBecomeUnobserved(this, "roomMetadata", this.suspend)
  }

  resume = () => {
    // This will be used later to load the state of the room from a local store
    console.log(`Resuming`)
  }

  suspend = () => {
    // This will be used later to offload the state of the room to a local store
    console.log(`Suspending`, this)

  }

  init = async () => {
    const sb_data = JSON.parse(await document.cacheDb.getItem('sb_data'));
    for (let x in sb_data) {
      this[x] = sb_data[x]
    }
    console.log(this.rooms['c0_yPmmwLw2fuCHpG2j80rkNeJb_u52tJHXBKbO3qYgQkUU-pL9F_P5RnOlrMvyf'].name)
  }

  save = () => {
    document.cacheDb.setItem('sb_data', JSON.stringify(this))
  }

  set activeroom(channelId) {
    this.activeRoom = channelId
  }

  get activeroom() {
    return this.activeRoom
  }

  get username() {
    return this.userName
  }

  set username(userName) {
    this.rooms[this.activeRoom].userName = userName;
    this.userName = userName;
  }

  receiveMessage = (m) => {
    console.log(`got message: ${m}`)
  }

  createRoom = (secret) => {
    return new Promise((resolve, reject) => {
      // create a new channel (room), returns (owner) key and channel name:
      this.SB.create(this.sbConfig, secret).then((handle) => {
        console.log(`you can (probably) connect here: localhost:3000/rooms/${handle.channelId}`)
        // connect to the websocket with our handle info:
        this.SB.connect(
          // must have a message handler:
          (m) => { this.receiveMessage(m) },
          handle.key, // if we omit then we're connecting anonymously (and not as owner)
          handle.channelId // since we're owner this is optional

        ).then((c) => c.ready).then((c) => {
          this.activeroom = handle.channelId
          this.ownerKey = handle.key;
          this.userKey = handle.key;
          this.rooms[handle.channelId] = {
            name: 'Room ' + Math.floor(Object.keys(this.rooms).length + 1),
            id: handle.channelId,
            key: handle.key,
            userName: '',
            lastSeenMessage: 0,
            messages: []
          }
          this.roomOwner = true;
          this.roomAdmin = true;
          this.save();
          resolve('connected')
          // say hello to everybody! upon success it will return "success"
          // (new SBMessage(c, "Hello from TestBot!")).send().then((c) => { console.log(`test message sent! (${c})`) })
        }).catch((e) => {
          reject(e)
        })
      })
    })

  }
  /*
  const selectRoom = async (selectedRoom) => {
    try {

      setMessages([])
      await loadPersonalKeys(selectedRoom);
      join(selectedRoom);
      setUsername(getUsername())
      let rooms = roomContext.rooms;
      roomContext.goToRoom(selectedRoom)
      if (!rooms.hasOwnProperty(selectedRoom)) {
        rooms[selectedRoom] = { name: 'Room ' + (Object.keys(rooms).length + 1).toString() };
        //roomContext.updateRoomNames(rooms)
      }
    } catch (e) {
      console.error(e);
    }
  }
  */

  joinRoom = async (roomId, messageCallback) => {
    this.activeroom = roomId
    this.userKey = this.rooms[roomId].key;
    this.SB.connect(
      // print out any messages we get
      (m) => {
        if (messageCallback) {
          messageCallback(m)
        } else {
          this.receiveMessage(m);
        }
      },
      this.rooms[roomId].key, // if we omit then we're connecting anonymously
      roomId, // optional, will recreate if missing
    ).then((c) => c.ready).then((c) => {
      c.userName = this.rooms[roomId].userName ? this.rooms[roomId].userName : 'Unset'

      let sbm = new SBMessage(c, "Hello from test04d!")
      console.log("++++test04d++++ will try to send this message:")
      console.log(sbm)
      sbm.send().then((c) => {
        console.log("++++test04d++++ back from send promise - got response:")
        console.log(c)
      })

    })
  }

  getRooms = () => {
    return this.rooms;
  }

  sendMessage = () => {

  }


};
const sbStore = new SnackabraStore();
export default sbStore;
