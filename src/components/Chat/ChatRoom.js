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
import GiftedMessage from "../../utils/chat/Messages/GiftedMessage";
import RenderSend from "./RenderSend";
import RenderComposer from "./RenderComposer";
import { SBMessage } from "snackabra"
import { observer } from "mobx-react"

@observer
class ChatRoom extends React.Component {

  state = {
    openPreview: false,
    openChangeName: false,
    openFirstVisit: false,
    openMotd: false,
    anchorEl: null,
    img: '',
    imgLoaded: false,
    messages: [],
    controlMessages: [],
    roomId: this.props.roomId || 'offline',
    files: [],
    loading: false,
    user: {},
    height: 0,
  }
  sbContext = this.props.sbContext
  componentDidMount() {
 
    const handleResize = () => {
      this.setState({ height: window.innerHeight })
      
    }

    window.addEventListener('resize', handleResize)
    handleResize();
    this.props.sbContext.joinRoom(this.props.roomId, async (message) => {
      console.log(message)
      const msg = JSON.parse(message)
      if (msg) {
        console.log(this.sbContext.userKey())
        msg.user = msg.sender_username
        if(!msg.hasOwnProperty('_id')){
          msg._id = this.state.messages.length
        }
        this.setState({ messages: [...this.state.messages, msg] })
      } 
    })
    /*
    if (localStorage.getItem(this.props.roomId) === null && this.props.roomId !== '') {
      this.setState({ openFirstVisit: true })
    } else {
      const key = JSON.parse(localStorage.getItem(this.props.roomId))
      this.SB.setIdentity(key).then(async () => {
        await this.SB.connect(this.props.roomId)
        this.SB.channel.socket.onJoin = async (message) => {
          console.log('here', message)
        }
        this.props.sbContext.goToRoom(this.props.roomId, this.SB.channel.admin)
        this.props.sbContext.loadRoom(this.SB.channel.metaData, this.sendSystemInfo, this.sendSystemMessage)
        this.setState({ user: this.getUser() })
        this.SB.channel.api.getOldMessages(0).then(async (messages) => {
          const _oldMessages = [];
          for (let x in messages) {
            const message = {};
            message[x] = messages[x];
            const sb_message = await this.sb2giftedMessage(JSON.parse(await this.SB.channel.socket.receive(message)))
            if (sb_message) {
              _oldMessages.push(sb_message)
            }
          }
          this.setState({ messages: _oldMessages })
        });
        this.SB.channel.socket.onMessage = async (message) => {
          const sb_message = await this.sb2giftedMessage(JSON.parse(message))
          if (sb_message) {
            this.setState({ messages: [...this.state.messages, sb_message] })
          }
        }
      })
    }
    */
  }


  sb2giftedMessage = async (message) => {
    if (message.control) {
      this.setState({ controlMessages: [...this.state.controlMessages, message] })
      return;
    }
    let _text_verified;
    let _image_verified = true;
    let _imageMetadata_verified = true;
    const sign = message.sign;
    const _image_sign = message.image_sign
    const _imageMetadata_sign = message.imageMetadata_sign;
    if (!sign || !_image_sign || !_imageMetadata_sign) {
      _text_verified = false
    } else {
      const sender_pubKey = await this.SB.crypto.importKey("jwk", message.sender_pubKey, "ECDH", true, []);
      const verificationKey = await this.SB.crypto.deriveKey(this.SB.channel.keys.room_privateSignKey, sender_pubKey, "HMAC", false, ["sign", "verify"])
      _text_verified = await this.SB.crypto.verify(verificationKey, sign, message.contents)
      _image_verified = await this.SB.crypto.verify(verificationKey, _image_sign, message.image)
      _imageMetadata_verified = await this.SB.crypto.verify(verificationKey, _imageMetadata_sign, typeof message.imageMetaData === "object" ? JSON.stringify(message.imageMetaData) : message.imageMetaData)
    }
    return {
      _id: message._id,
      text: message.contents,
      user: this.getUser(message),
      whispered: message.encrypted,
      createdAt: parseInt(message._id.slice(-42), 2),
      verified: _text_verified && _image_verified && _imageMetadata_verified,
      image: message.image,
      imageMetaData: typeof message.imageMetaData === "object" ? message.imageMetaData : JSON.parse(message.imageMetaData)

    }

  }

  // START NEW FUNCTIONS ***************************************************
  getUser = (message = null) => {
    let username, user_id;
    const contacts = this.props.sbContext.contacts;
    if (message) {
      if (message.verificationToken) {
        return
      }
      user_id = JSON.stringify(message.sender_pubKey);
      let user_key = message.sender_pubKey.x + " " + message.sender_pubKey.y;
      const unnamed = ['Anonymous', 'No Name', 'Nameless', 'Incognito', 'Voldemort', 'Uomo Senza Nome', 'The Kid', 'Gunslinger', 'IT ', 'Person in Black', 'बेनाम', 'βλέμμυες', '混沌'];
      const local_username = contacts.hasOwnProperty(user_key) && contacts[user_key].split(' ')[0] !== 'User' && !unnamed.includes(contacts[user_key].trim()) ? contacts[user_key] : 'Unnamed';
      contacts[user_key] = local_username;
      const alias = message.hasOwnProperty('sender_username') ? message.sender_username : '';
      if (user_key === (this.SB.identity.exportable_pubKey.x + " " + this.SB.identity.exportable_pubKey.y) || local_username === 'Me') {
        contacts[user_key] = 'Me';
        username = 'Me';
        user_id = JSON.stringify(this.SB.identity.exportable_pubKey);
      } else {
        if (alias !== '') {
          username = (local_username === alias || local_username === 'Unnamed') ? alias : alias + '  (' + local_username + ')';
        } else {
          username = '(' + local_username + ')';
        }
        if (this.SB.crypto.areKeysSame(message.sender_pubKey, this.SB.channel.keys.exportable_verifiedGuest_pubKey)) {
          username += "  (Verified)"
        } else if (this.SB.crypto.areKeysSame(message.sender_pubKey, this.SB.channel.keys.exportable_owner_pubKey)) {
          username += "  (Owner)"
        }
      }
    } else {
      username = 'Me';
      user_id = JSON.stringify(this.SB.identity.exportable_pubKey);
    }
    return { _id: user_id, name: username };
  }

  notify = (message, severity) => {
    this.props.Notifications.setMessage(message);
    this.props.Notifications.setSeverity(severity);
    this.props.Notifications.setOpen(true)
  }

  openImageOverlay = (message) => {
    this.setState({ img: message.image, openPreview: true })
    try {
      this.SB.storage.retrieveDataFromMessage(message, this.state.controlMessages).then((data) => {
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

  promptUsername = () => {
    this.setState({ openChangeName: true })
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

  getOldMessages = async () => {
    this.SB.channel.api.getOldMessages()
  }

  loadFiles = async (loaded) => {
    this.setState({ loading: false, files: loaded })
  }
  //TODO: for images render in chat and then replace with received message
  sendFiles = () => {
    const fileMessages = [];
    this.state.files.forEach((file, i) => {
      /*
      const message = new GiftedMessage({
        createdAt: new Date().toString(),
        text: "",
        image: file.restrictedUrl,
        user: this.state.user,
        _id: "1fa5a124-451d-4fc8-88eb-49309d47732" + i
      }, true)
      fileMessages.push(message)

       */
      this.SB.sendFile(file.data)
    })
    //setMessages([...messages, ...fileMessages])
    this.removeInputFiles()
  }


  sendMessages = async (giftedMessage) => {
    if (giftedMessage[0].text === "") {
      if (this.state.files.length > 0) {
        this.sendFiles()
      }
    } else {
      //const message = new GiftedMessage(giftedMessage[0], true)
      //setMessages([...messages, message])
      //activeChatContext.sendMessage(message)
      const message = await new SBMessage(
        giftedMessage[0].text,
        this.SB.channel.keys.personal_signKey,
        this.SB.identity.exportable_pubKey
      )
      this.SB.sendMessage(message)
    }
  }

  sendSystemInfo = (msg_string) => {
    this.setState({
      messages: [...this.state.messages, {
        _id: this.state.messages.length,
        text: msg_string,
        user: { _id: 'system', name: 'System Message' },
        whispered: false,
        verified: true,
        info: true
      }]
    })
  }

  sendSystemMessage = (message) => {
    this.setState({
      messages: [...this.state.messages, {
        _id: this.state.messages.length,
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
        <ChangeNameDialog open={this.state.openChangeName} />
        <MotdDialog open={this.state.openMotd} roomName={this.props.roomName} />
        <AttachMenu open={attachMenu} handleClose={this.handleClose} />
        <FirstVisitDialog open={this.state.openFirstVisit} onClose={() => {
          this.setState({ openFirstVisit: false })
        }} roomId={this.state.roomId} />
        <GiftedChat
          messages={this.state.messages}
          onSend={this.sendMessages}
          // timeFormat='L LT'
          user={this.state.user}
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
              loading={this.state.loading} />
          }}
          renderBubble={(props) => {
            return <RenderBubble {...props} keys={{ ...this.SB.channel.keys, ...this.SB.identity }}
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
