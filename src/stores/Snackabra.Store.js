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
  locked = false;
  isVerifiedGuest = false;
  roomMetadata = {};
  userName = 'Me';
  ownerRotation;
  ownerKey;
  roomCapacity = 20;
  keys = {}
  userKey = {};
  //might be more of a local state thing
  loadingMore = false;
  moreMessages = false;
  replyTo;
  replyEncryptionKey = {}
  activeRoom;
  joinRequests = {};
  SB = new SB.Snackabra(this.sbConfig)

  constructor() {
    makeObservable(this, {
      createRoom: action,
      getOldMessages: action,
      setRoom: action,
      importRoom: action,
      user: computed,
      username: computed,
      socket: computed,
      admin: computed,
      roomName: computed,
      motd: computed,
      activeroom: computed,
      messages: computed,
      contacts: computed,
      loadingMore: observable,
      sbConfig: observable,
      roomMetadata: observable,
      userName: observable,
      rooms: observable,
      locked: observable,
      isVerifiedGuest: observable,
      ownerRotation: observable,
      roomCapacity: observable,
      replyTo: observable,
      replyEncryptionKey: observable,
      activeRoom: observable,
      keys: observable,
      userKey: observable,
      ownerKey: observable,
      joinRequests: observable,
      channel: observable
    })

    onBecomeUnobserved(this, "rooms", this.suspend)
  }

  resume = () => {
    // This will be used later to load the state of the room from a local store
    console.log(`Resuming`)
  }

  suspend = () => {
    // This will be used later to offload the state of the room to a local store
    this.save()
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
    return this.channel ? toJS(this.channel) : undefined;
  }

  set socket(channel) {
    this.channel = channel;
  }

  get owner() {
    return this.socket ? this.socket.owner : false;
  }

  get admin() {
    return this.socket ? this.socket.admin : false;
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

  get roomName() {
    return this.rooms[this.activeRoom]?.name ? this.rooms[this.activeRoom].name : 'Room ' + Math.floor(Object.keys(this.rooms).length + 1)
  }

  set roomName(name) {
    this.rooms[this.activeRoom].name = name;
    this.save();
  }

  get user() {
    return this.socket ? { _id: JSON.stringify(this.socket.exportable_pubKey), name: this.socket.userName } : { _id: '', name: '' }

  }

  set username(userName) {
    if (this.rooms[this.activeRoom]) {
      this.rooms[this.activeRoom].userName = userName;
      const user_pubKey = this.user._id
      this.rooms[this.activeRoom].contacts[user_pubKey.x + ' ' + user_pubKey.y] = userName;
      this.userName = userName;
      this.save()
    }

  }


  set contacts(contacts) {
    if (this.rooms[this.activeRoom]) {
      this.rooms[this.activeRoom].contacts = contacts;
      this.save()
    }
  }

  get contacts() {
    if (this.rooms[this.activeRoom]) {
      return this.rooms[this.activeRoom].contacts ? toJS(this.rooms[this.activeRoom].contacts) : {}
    }
    return {}
  }

  get messages() {
    if (this.rooms[this.activeRoom]) {
      return this.rooms[this.activeRoom].messages ? toJS(this.rooms[this.activeRoom].messages) : []
    }
    return []
  }

  set messages(messages) {
    if (this.rooms[this.activeRoom]) {
      this.rooms[this.activeRoom].messages = messages;
      this.save()
    }
  }

  receiveMessage = (m, messageCallback) => {
    const user_pubKey = m.user._id;
    m.user._id = JSON.stringify(m.user._id);
    m.user.name = this.contacts[user_pubKey.x + ' ' + user_pubKey.y] !== undefined ? this.contacts[user_pubKey.x + ' ' + user_pubKey.y] : m.user.name;
    m.sender_username = m.user.name;
    m.createdAt = new Date(parseInt(m.timestampPrefix, 2));
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
      this.SB = new SB.Snackabra(this.sbConfig);
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
          if (c) {
            this.socket = c;
            this.activeroom = handle.channelId
            this.socket.userName = 'Me'
            this.rooms[handle.channelId] = {
              name: 'Room ' + Math.floor(Object.keys(this.rooms).length + 1),
              id: handle.channelId,
              key: handle.key,
              userName: 'Me',
              lastSeenMessage: 0,
              contacts: {},
              messages: []
            }

            this.save();
          }
          resolve(handle.channelId)
          // say hello to everybody! upon success it will return "success"
          // (new SBMessage(c, "Hello from TestBot!")).send().then((c) => { console.log(`test message sent! (${c})`) })
        }).catch((e) => {
          reject(e)
        })
      })
    })

  }

  importRoom = async (roomData) => {
    console.log(roomData)
    const channelId = roomData.roomId;
    const key = JSON.parse(roomData.ownerKey);
    try {
      this.SB = new SB.Snackabra(this.sbConfig);
      this.SB.connect(
        console.log,
        key,
        channelId

      ).then((c) => c.ready).then((c) => {
        if (c) {
          console.log(c)
          this.socket = c;
          this.activeroom = channelId
          const roomData = this.rooms[channelId] ? this.rooms[channelId] : {
            name: 'Room ' + Math.floor(Object.keys(this.rooms).length + 1),
            id: channelId,
            key: typeof key !== 'undefined' ? key : c.exportable_privateKey,
            userName: 'Me',
            contacts: {},
            lastSeenMessage: 0,
            messages: []
          }
          this.setRoom(channelId, roomData)
          this.key = typeof key !== 'undefined' ? key : c.exportable_privateKey
          this.socket.userName = 'Me'
          this.save();
          window.location.reload()
        }

      }).catch((e) => {
        console.error(e)
      })
    } catch (e) {
      console.error(e)
    }
  }


  get capacity() {
    return this.socket ? this.socket.adminData.capacity : 20;
  }

  setRoomCapacity = (capacity) => {
    this.socket.adminData.capacity = capacity;
    return this.socket.api.updateCapacity(capacity)
  }

  get motd() {
    return this.socket ? this.socket.motd : '';
  }

  set motd(motd) {
    console.log(motd)
  }

  setMOTD = (motd) => {
    return this.socket.api.setMOTD(motd)
  }

  // This isnt in the the jslib atm
  lockRoom = () => {
    return this.socket.api.lockRoom()
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

  setRoom = (channelId, roomData) => {
    this.rooms[channelId] = roomData
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
        channelId = roomId ? roomId : channel?.channelId;
        this.SB.connect(
          (m) => { this.receiveMessage(m, messageCallback) }, // must have a message handler:
          key ? key : null, // if we omit then we're connecting anonymously (and not as owner)
          channelId // since we're owner this is optional

        ).then((c) => c.ready).then((c) => {
          if (c) {
            this.socket = c;
            this.activeroom = channelId
            const roomData = this.rooms[channelId] ? this.rooms[channelId] : {
              name: 'Room ' + Math.floor(Object.keys(this.rooms).length + 1),
              id: channelId,
              key: typeof key !== 'undefined' ? key : c.exportable_privateKey,
              userName: username !== '' && typeof username !== 'undefined' ? username : '',
              lastSeenMessage: 0,
              contacts: {},
              messages: []
            }
            this.setRoom(channelId, roomData)
            this.key = typeof key !== 'undefined' ? key : c.exportable_privateKey
            this.socket.userName = roomData.userName
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
