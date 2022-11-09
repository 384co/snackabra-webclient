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



    if (!this.sbContext.rooms[this.props.roomId]?.key) {
      this.setState({ openFirstVisit: true })
    } else {
      this.connect();
    }
  }

  connect = (username) => {
    const room = this.sbContext.getExistingRoom(this.props.roomId)
    const options = {
      roomId: this.props.roomId,
      username: 'Me',
      key: room?.key ? room?.key : null,
      secret: null,
      messageCallback: this.recieveMessages
    }
    // this.setState({ messages: this.sbContext.getMessages(this.props.roomId) })
    this.props.sbContext.connect(options).then(() => {
      this.props.sbContext.getOldMessages(0).then((r) => {
        const m = r.map((item, i) => {
          item.user._id = JSON.stringify(item.user._id);
          item.createdAt = new Date(parseInt(item.timestampPrefix, 2));
          return item;
        })
        this.setState({ messages: [...m] })
      })
    })
  }

  recieveMessages = (msg) => {
    if (msg) {
      const messages = this.state.messages.reduce((acc, curr) => {
        if (!this.sending.hasOwnProperty(curr._id)) {
          acc.push(curr);
        } else {
          delete this.sending[curr._id]
        }
        return acc;
      }, []);
      this.setState({ messages: [...messages, msg] })
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
      const msg_id = giftedMessage[0]._id;

      giftedMessage[0].user = { _id: JSON.stringify(this.sbContext.socket.exportable_pubKey), name: this.sbContext.username }
      console.log(giftedMessage[0])
      this.setState({ messages: [...this.state.messages, giftedMessage[0]] })
      this.sending[msg_id] = msg_id
      let sbm = new SB.SBMessage(this.sbContext.socket, giftedMessage[0].text)
      sbm.send();

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
        <FirstVisitDialog open={this.state.openFirstVisit} sbContext={this.sbContext} messageCallback={this.recieveMessages} onClose={(username) => {
          this.setState({ openFirstVisit: false })
          this.connect(username)
        }} roomId={this.state.roomId} />
        <GiftedChat
          messages={this.state.messages}
          onSend={this.sendMessages}
          // timeFormat='L LT'
          user={{ _id: JSON.stringify(this.sbContext.socket.exportable_pubKey), name: this.sbContext.socket.userName }}
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
