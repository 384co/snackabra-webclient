import { makeObservable, observable, action, computed, onBecomeObserved, onBecomeUnobserved, configure, toJS } from "mobx"
import { Actions } from "react-native-gifted-chat";
const SB = require('snackabra')

configure({
  useProxies: "never"
})

class SnackabraStore {

  sbConfig = {
    channel_server: process.env.REACT_APP_ROOM_SERVER,
    channel_ws: process.env.REACT_APP_ROOM_SERVER_WS,
    storage_server: process.env.REACT_APP_STORAGE_SERVER
  }
  socket;
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
  SB = new SB.Snackabra(this.sbConfig)

  constructor() {

    makeObservable(this, {
      createRoom: action,
      getOldMessages: action,
      username: computed,
      key: computed,
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
      contacts: observable,
      socket: observable
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
    if (this.rooms[this.activeRoom]) this.rooms[this.activeRoom].userName = userName;
    this.userName = userName;
  }

  get giftedMessages() {
    return toJS(this.messages)
  }

  get key() {
    return toJS(this.userKey)
  }

  set key(key) {
    this.userKey = key
  }

  addMessage = (message) => {
    this.messages = [...this.messages, message]
  }

  receiveMessage = (m) => {
    console.log(`got message: ${m}`)
  }

  parseMessages = () => {
    return Promise((resolve, reject) => {

    })
  }

  getOldMessages = (length) => this.socket.api.getOldMessages(length);

  // const messageIdRegex = /([A-Za-z0-9+/_\-=]{64})([01]{42})/
  // const sbCrypto = new SB.SBCrypto()
  // const messages = await this.socket.api.getOldMessages(length)
  // let r_messages = [];
  // Object.keys(messages).forEach(async (value, index) => {
  //   const z = messageIdRegex.exec(value)
  //   if (z && messages[value].hasOwnProperty('encrypted_contents')) {
  //     let m = {
  //       type: 'encryptedChannelMessage',
  //       channelID: z[1],
  //       timestampPrefix: z[2],
  //       encrypted_contents: {
  //         content: messages[value].encrypted_contents.content,
  //         iv: new Uint8Array(Array.from(Object.values(messages[value].encrypted_contents.iv)))
  //       }
  //     }
  //     const unwrapped = await sbCrypto.unwrap(this.socket.keys.encryptionKey, m.encrypted_contents, 'string');
  //     m = { ...m, ...JSON.parse(unwrapped) };
  //     m.user = { name: m.sender_username ? m.sender_username : 'Unknown', _id: m.sender_pubKey }
  //     if (!m.hasOwnProperty('_id')) {
  //       m.text = m.contents
  //       m._id = m.channelID + m.timestampPrefix
  //     }
  //     r_messages.push(m)
  //   }
  //   if (index === Object.keys(messages).length - 1) {
  //     res(r_messages)
  //   }
  // })

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
          console.log(handle.key, JSON.stringify(handle.key))
          this.socket = c;
          this.activeroom = handle.channelId
          this.ownerKey = handle.key;
          this.key = handle.key;
          this.rooms[handle.channelId] = {
            name: 'Room ' + Math.floor(Object.keys(this.rooms).length + 1),
            id: handle.channelId,
            key: handle.key,
            userName: 'Me',
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
    return new Promise((resolve, reject) => {
      try {
        this.SB = new SB.Snackabra(this.sbConfig);
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
          console.log(c)
          this.socket = c;
          this.username = this.rooms[roomId].userName ? this.rooms[roomId].userName : 'Unset';
          c.userName = this.userName
          resolve(this)
        })
      } catch (e) {
        reject(e)
      }

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
