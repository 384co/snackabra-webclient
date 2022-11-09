import { makeObservable, observable, action, computed, onBecomeObserved, onBecomeUnobserved, configure, toJS } from "mobx"
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
  channel;
  rooms = {};
  motd = "";
  locked = false;
  isVerifiedGuest = false;
  roomMetadata = {};
  showAdminTab = false;
  userName = 'Me';
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
      socket: computed,
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
      channel: observable
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

  get socket() {
    return toJS(this.channel);
  }

  set socket(channel) {
    this.channel = channel;
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

  receiveMessage = (m, messageCallback) => {
    m.user._id = JSON.stringify(m.user._id);
    m.createdAt = new Date(parseInt(m.timestampPrefix,2));
    this.rooms[this.activeRoom].messages = [...toJS(this.rooms[this.activeRoom].messages), m]
    this.save()
    messageCallback(m)
  }

  #mergeMessages = (existing, received) => {
    let merged = [];
    for (let i = 0; i < existing.length + received.length; i++) {
      if (received.find((itmInner) => itmInner._id === existing[i]?._id)) {
        merged.push({
          ...existing[i],
          ...(received.find((itmInner) => itmInner._id === existing[i]?._id))
        });
      } else {
        merged.push(received[i])
      }

    }
    return merged.sort((a, b) => (a._id > b._id) ? 1 : -1)
  }

  getOldMessages = (length) => {
    return new Promise((resolve) => {
      this.socket.api.getOldMessages(length).then((r_messages) => {
        this.rooms[this.activeRoom].messages = this.#mergeMessages(toJS(this.rooms[this.activeRoom].messages), r_messages)
        this.save()
        resolve(r_messages);
      })
    })
  }

  createRoom = (secret) => {
    return new Promise((resolve, reject) => {
      // create a new channel (room), returns (owner) key and channel name:
      this.SB.create(this.sbConfig, secret).then((handle) => {
        console.log(`you can (probably) connect here: localhost:3000/rooms/${handle.channelId}`)
        // connect to the websocket with our handle info:
        console.log(handle)
        this.SB.connect(
          // must have a message handler:
          (m) => { this.receiveMessage(m) },
          handle.key, // if we omit then we're connecting anonymously (and not as owner)
          handle.channelId // since we're owner this is optional

        ).then((c) => c.ready).then((c) => {
          if(c){
            console.log(c)
            this.socket = c;
            this.activeroom = handle.channelId
            this.socket.userName = 'Me'
            this.rooms[handle.channelId] = {
              name: 'Room ' + Math.floor(Object.keys(this.rooms).length + 1),
              id: handle.channelId,
              key: handle.key,
              userName: 'Me',
              lastSeenMessage: 0,
              messages: []
            }
  
            this.save();
          }
          resolve('connected')
          // say hello to everybody! upon success it will return "success"
          // (new SBMessage(c, "Hello from TestBot!")).send().then((c) => { console.log(`test message sent! (${c})`) })
        }).catch((e) => {
          reject(e)
        })
      })
    })

  }

  getExistingRoom = (channelId) => {
    return toJS(this.rooms[channelId])
  }

  setMessages = (channelId, messages) => {
    return this.rooms[channelId].messages = messages;
  }

  getMessages = (channelId) => {
    if (this.rooms[channelId]) {
      return toJS(this.rooms[channelId].messages);
    } else {
      return []
    }

  }

  connect = async ({ roomId, username, messageCallback, key, secret }) => {
    return new Promise(async (resolve, reject) => {
      try {
        this.SB = new SB.Snackabra(this.sbConfig);
        let channel, channelId;
        if (secret) {
          channel = await this.SB.create(this.sbConfig, secret)
        }
        key = key ? key : channel?.key;
        console.log(key)
        channelId = roomId ? roomId : channel?.channelId;
        this.SB.connect(
          (m) => { this.receiveMessage(m, messageCallback) }, // must have a message handler:
          key ? key : null, // if we omit then we're connecting anonymously (and not as owner)
          channelId // since we're owner this is optional

        ).then((c) => c.ready).then((c) => {
          if(c){
            console.log(c)
            this.socket = c;
            this.activeroom = channelId
            this.rooms[channelId] = {
              name: 'Room ' + Math.floor(Object.keys(this.rooms).length + 1),
              id: channelId,
              key: typeof key !== 'undefined' ? key : c.exportable_privateKey,
              userName: username !== '' && typeof username !== 'undefined' ? username : '',
              lastSeenMessage: 0,
              messages: []
            }
            this.key = typeof key !== 'undefined' ? key : c.exportable_privateKey
            this.socket.userName = 'Me'
            this.save();
          }

          resolve('connected')
        }).catch((e) => {
          reject(e)
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
