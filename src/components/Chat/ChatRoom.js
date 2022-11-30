/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import * as React from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import RenderBubble from "./RenderBubble";
import RenderAttachmentIcon from "./RenderAttachmentIcon";
import ImageOverlay from "../Modals/ImageOverlay";
import RenderImage from "./RenderImage";
import ChangeNameDialog from "../Modals/ChangeNameDialog";
import MotdDialog from "../Modals/MotdDialog";
import RenderChatFooter from "./RenderChatFooter";
import RenderTime from "./RenderTime";
import { View } from "react-native";
import AttachMenu from "./AttachMenu";
import FirstVisitDialog from "../Modals/FirstVisitDialog";
import RenderSend from "./RenderSend";
import RenderComposer from "./RenderComposer";
import { observer } from "mobx-react"
const SB = require('snackabra')

@observer
class ChatRoom extends React.Component {
  sending = {}
  state = {
    openPreview: false,
    openChangeName: false,
    openFirstVisit: false,
    changeUserNameProps: {},
    openMotd: false,
    anchorEl: null,
    img: '',
    imgLoaded: false,
    messages: [],
    controlMessages: [],
    roomId: this.props.roomId || 'offline',
    files: [],
    loading: false,
    uploading: false,
    user: {},
    height: 0,
    visibility: 'visible'
  }
  sbContext = this.props.sbContext

  componentDidMount() {

    const handleResize = () => {
      this.setState({ height: window.innerHeight })

    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    handleResize();

    // reconnect when window comes into focus and the state of the socket is not opened
    document.addEventListener("visibilitychange", () => {
      if (this.state.visibility === 'hidden' && document.visibilityState === 'visible' && this.sbContext.socket?.status !== 'OPEN') {
        this.connect();
      }
      this.setState({ visibility: document.visibilityState })
    })
    if (!this.sbContext.rooms[this.props.roomId]?.key) {
      console.log(JSON.stringify(this.sbContext.activeroom))
      console.log(this.sbContext.rooms[this.props.roomId]?.key)
      this.setState({ openFirstVisit: true })
    } else {
      this.connect();
    }
  }

  connect = (username) => {
    const room = this.sbContext.getExistingRoom(this.props.roomId)
    const options = {
      roomId: this.props.roomId,
      username: username ? username : 'Unnamed',
      key: room?.key ? room?.key : null,
      secret: null,
      messageCallback: this.recieveMessages
    }
    this.sbContext.connect(options).then(() => {
      this.setState({ messages: this.sbContext.messages }, () => {
        this.sbContext.getOldMessages(0).then((r) => {
          let controlMessages = [];
          let messages = [];
          r.forEach((m, i) => {
            if (!m.control) {
              const user_pubKey = m.user._id;
              m.user._id = JSON.stringify(m.user._id);
              m.user.name = this.sbContext.contacts[user_pubKey.x + ' ' + user_pubKey.y] !== undefined ? this.sbContext.contacts[user_pubKey.x + ' ' + user_pubKey.y] : m.user.name;
              m.sender_username = m.user.name;
              m.createdAt = new Date(parseInt(m.timestampPrefix, 2));
              messages.push(m)
            } else {
              controlMessages.push(m)
            }

          })
          this.setState({ controlMessages: controlMessages })
          if (this.sbContext.motd !== '') {
            this.sendSystemInfo('MOTD: ' + this.props.sbContext.motd, (systemMessage) => {
              this.sbContext.messages = messages
              this.setState({ messages: [...messages, systemMessage] })
            })
          } else {
            this.sbContext.messages = messages
            this.setState({ messages: [...messages] })
          }

        })
      })
    })
  }

  recieveMessages = (msg) => {
    if (msg) {
      console.log(msg)
      if (!msg.control) {
        const messages = this.state.messages.reduce((acc, curr) => {
          if (!this.sending.hasOwnProperty(curr._id)) {
            acc.push(curr);
          } else {
            delete this.sending[curr._id]
          }
          return acc;
        }, []);
        this.setState({ messages: [...messages, msg] })
      } else {
        this.setState({ controlMessages: [...this.state.controlMessages, msg] })
      }

    }
  }

  notify = (message, severity) => {
    this.props.Notifications.setMessage(message);
    this.props.Notifications.setSeverity(severity);
    this.props.Notifications.setOpen(true)
  }

  openImageOverlay = (message) => {
    this.setState({ img: message.image, openPreview: true })
    try {
      console.log(message)
      this.sbContext.SB.storage.retrieveDataFromMessage(message.sign, this.state.controlMessages).then((data) => {
        console.log(data)
        if (data.hasOwnProperty('error')) {
          //activeChatContext.sendSystemMessage('Could not open image: ' + data['error']);
        } else {
          this.setState({ img: data['url'], imgLoaded: true })
        }
      })
    } catch (error) {
      console.log('openPreview() exception: ' + error.message);
      //activeChatContext.sendSystemMessage('Could not open image (' + error.message + ')');
      this.setState({ openPreview: false })
    }
  }

  imageOverlayClosed = () => {
    this.setState({ openPreview: false, img: '', imgLoaded: false })
  }

  promptUsername = (context) => {
    this.setState({ openChangeName: true, changeUserNameProps: context })
  }


  handleReply = (user) => {
    try {
      if (this.sbContext.roomOwner) {
        this.sbContext.handleReply(user)
      } else {
        this.notify('Whisper is only for room owners.', 'info')
      }
    } catch (e) {
      console.log(e);
      this.notify(e.message, 'error')
    }
  }

  loadFiles = async (loaded) => {
    this.setState({ loading: false, files: loaded })
  }
  //TODO: for images render in chat and then replace with received message
  sendFiles = (giftedMessage) => {
    this.setState({ uploading: true })
    const fileMessages = [];
    const arrayBufferPromises = [];
    this.state.files.forEach(async (file, i) => {

      const message = {
        createdAt: new Date().toString(),
        text: "",
        image: file.restrictedUrl,
        user: this.sbContext.user,
        _id: 'sending_' + giftedMessage[0]._id
      }
      this.sending[message._id] = message._id
      fileMessages.push(message)
      arrayBufferPromises.push(file.data.arrayBuffer())
      console.log(file)
      // this.sbContext.SB.storage.storeObject(file.arrayBuffer).then(()=>{

      // })
      //this.SB.sendFile(file.data)
    })
    this.setState({ messages: [...this.state.messages, ...fileMessages] })

    Promise.all(arrayBufferPromises).then((a) => {
      a.forEach((ab, i) => {
        // mtg: We are sending the message here missing the id of the image, I think we can use the signature 
        let sbm = new SB.SBMessage(this.sbContext.socket, '', this.state.files[i].restrictedUrl)
        sbm.contents.image = this.state.files[i].restrictedUrl
        sbm.send().then(() => {
          Promise.all([
            this.sbContext.SB.storage.storeObject(ab, 'f', this.sbContext.activeroom),
            this.sbContext.SB.storage.storeObject(ab, 'p', this.sbContext.activeroom)
          ]).then(async (o) => {
            console.log(o)
            let sbm = new SB.SBMessage(this.sbContext.socket, '', this.state.files[i].restrictedUrl)
            const imageMetadata = {
              imageId: o[0].id,
              imageKey: o[0].key,
              previewId: o[1].id,
              previewKey: o[1].key,
            }
            sbm.contents.id = o[1].id;
            sbm.contents.verificationToken = await o[1].verification
            sbm.contents.control = true;
            sbm.contents.imageMetaData = imageMetadata; // psm should work
            sbm.send();
            // sbm.setImageMetadata(imageMetadata).then(() => {
            //   sbm.send();
            // })
          }).finally(() => {
            if (i === arrayBufferPromises.length - 1) {
              this.setState({ uploading: false })
              this.removeInputFiles()
            }
          })
        })

      })

    })
  }

  sendMessages = async (giftedMessage) => {
    if (giftedMessage[0].text === "") {
      if (this.state.files.length > 0) {
        this.sendFiles(giftedMessage)
      }
    } else {
      giftedMessage[0]._id = 'sending_' + giftedMessage[0]._id;
      const msg_id = giftedMessage[0]._id;

      giftedMessage[0].user = { _id: JSON.stringify(this.sbContext.socket.exportable_pubKey), name: this.sbContext.username }
      this.setState({ messages: [...this.state.messages, giftedMessage[0]] })
      this.sending[msg_id] = msg_id
      let sbm = new SB.SBMessage(this.sbContext.socket, giftedMessage[0].text)
      sbm.send();

    }
  }

  sendSystemInfo = (msg_string, callback) => {
    const systemMessage = {
      _id: this.state.messages.length,
      text: msg_string,
      user: { _id: 'system', name: 'System Message' },
      whispered: false,
      verified: true,
      info: true
    }
    this.setState({
      messages: [...this.state.messages, systemMessage]
    }, () => {
      if (callback) {
        callback(systemMessage)
      }
    })
  }

  sendSystemMessage = (message) => {
    this.setState({
      messages: [...this.state.messages, {
        _id: this.state.messages.length,
        user: { _id: 'system', name: 'System Message' },
        text: message,
        system: true
      }]
    })
  }

  openAttachMenu = (e) => {
    this.setState({ anchorEl: e.currentTarget });
  }

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  removeInputFiles = () => {
    if (document.getElementById('fileInput')) {

      document.getElementById('fileInput').value = '';
    }
    this.setState({ files: [] })
  }

  showLoading = () => {
    this.setState({ loading: false })
  }

  saveUsername = (newUsername, _id) => {
    if (_id === this.sbContext.user._id) {
      console.log('its me!!!')
      this.sbContext.username = newUsername;
    }
    const contacts = this.sbContext.contacts
    const user_pubKey = JSON.parse(_id);
    contacts[user_pubKey.x + ' ' + user_pubKey.y] = newUsername;
    this.sbContext.contacts = contacts;
    const _messages = this.state.messages.map((message) => {
      if (message.user._id === _id) {
        message.user.name = newUsername;
        message.sender_username = newUsername;
      }
      return message;
    });
    this.setState({ messages: [] }, () => {
      this.setState({ messages: _messages, changeUserNameProps: {} })
      this.sbContext.messages = _messages;
    });
    // setTimeout(()=>{
    //   window.location.reload()
    // }, 1000)

  }

  render() {
    const attachMenu = Boolean(this.state.anchorEl);
    return (

      <View style={{
        flexGrow: 1,
        flexBasis: 'fit-content',
        height: this.state.height - 48
      }}>
        <ImageOverlay open={this.state.openPreview} img={this.state.img} imgLoaded={this.state.imgLoaded}
          onClose={this.imageOverlayClosed} />
        <ChangeNameDialog {...this.state.changeUserNameProps} open={this.state.openChangeName} onClose={(userName, _id) => {
          this.saveUsername(userName, _id)
          this.setState({ openChangeName: false })
        }} />
        <MotdDialog open={this.state.openMotd} roomName={this.props.roomName} />
        <AttachMenu open={attachMenu} handleClose={this.handleClose} />
        <FirstVisitDialog open={this.state.openFirstVisit} sbContext={this.sbContext} messageCallback={this.recieveMessages} onClose={(username) => {
          this.setState({ openFirstVisit: false })
          this.connect(username)
        }} roomId={this.state.roomId} />
        <GiftedChat
          messages={this.state.messages}
          onSend={this.sendMessages}
          // timeFormat='L LT'
          user={this.sbContext.user}
          inverted={false}
          alwaysShowSend={true}
          loadEarlier={this.props.sbContext.moreMessages}
          isLoadingEarlier={this.props.sbContext.loadingMore}
          onLoadEarlier={this.getOldMessages}
          renderActions={(props) => {
            return <RenderAttachmentIcon
              {...props}
              addFile={this.loadFiles}
              openAttachMenu={this.openAttachMenu}
              showLoading={this.showLoading} />
          }}
          //renderUsernameOnMessage={true}
          // infiniteScroll={true}   // This is not supported for web yet
          renderMessageImage={(props) => {
            return <RenderImage {...props} openImageOverlay={this.openImageOverlay} />
          }}
          scrollToBottom={true}
          showUserAvatar={true}
          onPressAvatar={this.promptUsername}
          onLongPressAvatar={(context) => {
            return this.handleReply(context)
          }}
          renderChatFooter={() => {
            return <RenderChatFooter removeInputFiles={this.removeInputFiles}
              files={this.state.files}
              uploading={this.state.uploading}
              loading={this.state.loading} />
          }}
          renderBubble={(props) => {
            return <RenderBubble {...props} keys={{ ...this.props.sbContext.socket.keys, ...this.props.sbContext.userKey }}
              socket={this.props.sbContext.socket}
              SB={this.SB} />
          }}
          renderSend={RenderSend}
          renderComposer={(props) => {
            return <RenderComposer {...props} filesAttached={this.state.files.length > 0} />
          }}
          onLongPress={() => false}
          renderTime={RenderTime}

        />
      </View>

    )
  }
}

export default ChatRoom;
