/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import * as React from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import RenderBubble from "./RenderBubble";
import { useContext, useState } from "react";
import RenderAttachmentIcon from "./RenderAttachmentIcon";
import ImageOverlay from "../Modals/ImageOverlay";
import RenderImage from "./RenderImage";
import { retrieveData, saveImage } from "../../utils/snackabra-js/ImageProcessor";
import ChangeNameDialog from "../Modals/ChangeNameDialog";
import MotdDialog from "../Modals/MotdDialog";
import NotificationContext from "../../contexts/NotificationContext";
import RenderChatFooter from "./RenderChatFooter";
import RenderTime from "./RenderTime";
import { View } from "react-native";
import AttachMenu from "./AttachMenu";
import RoomContext from "../../contexts/RoomContext";
import FirstVisitDialog from "../Modals/FirstVisitDialog";
import GiftedMessage from "../../utils/chat/Messages/GiftedMessage";
import RenderSend from "./RenderSend";
import RenderComposer from "./RenderComposer";
import SBMessage from "../../utils/chat/Messages/SnackabraMessage";
import ActiveChatContext from "../../contexts/ActiveChatContext";


const ChatRoom = (props) => {
  const activeChatContext = React.useContext(ActiveChatContext)
  const roomContext = useContext(RoomContext)
  const Notifications = useContext(NotificationContext)

  const [openPreview, setOpenPreview] = useState(false);
  const [openChangeName, setOpenChangeName] = useState(false);
  const [openFirstVisit, setOpenFirstVisit] = useState(false);
  const [openMotd, setMotdDialog] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const attachMenu = Boolean(anchorEl);
  const [img, setImg] = useState('');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [controlMessages, setControlMessages] = useState([]);
  const [roomId, setRoomId] = useState(props.roomId || 'offline')
  const [files, setFiles] = React.useState([]); // [{dataUrl: "base64 data url", file: "raw file input}]
  const [loading, setLoading] = React.useState(false);
  const [user, setUser] = React.useState({});
  const [height, setHeight] = React.useState(0);
  const SB = document.Snackabra;

  React.useEffect(() => {
    roomContext.goToRoom(props.roomId)

    function handleResize() {
      setHeight(window.innerHeight)
    }

    window.addEventListener('resize', handleResize)
    handleResize();

    if (localStorage.getItem(props.roomId) === null && props.roomId !== '') {
      setOpenFirstVisit(true);
    } else {
      const key = JSON.parse(localStorage.getItem(props.roomId))
      document.Snackabra.setIdentity(key).then(async () => {
        await document.Snackabra.connect(props.roomId)
        setUser(getUser());
        document.Snackabra.channel.api.getOldMessages(0).then(async (messages) => {
          const _oldMessages = [];
          for (let x in messages) {
            const message = {};
            message[x] = messages[x];
            //const sb_message = new SBMessage(x, )
            _oldMessages.push(JSON.parse(await document.Snackabra.channel.socket.receive(message)))
          }
          console.log(_oldMessages)
        });

      })
    }
  }, [])

  // START NEW FUNCTIONS ***************************************************
  const getUser = (message = null) => {

    let username, user_id;
    const contacts = roomContext.contacts;

    if (message) {
      user_id = JSON.stringify(message.sender_pubKey);
      let user_key = message.sender_pubKey.x + " " + message.sender_pubKey.y;
      const unnamed = ['Anonymous', 'No Name', 'Nameless', 'Incognito', 'Voldemort', 'Uomo Senza Nome', 'The Kid', 'Gunslinger', 'IT ', 'Person in Black', 'बेनाम', 'βλέμμυες', '混沌'];
      const local_username = contacts.hasOwnProperty(user_key) && contacts[user_key].split(' ')[0] !== 'User' && !unnamed.includes(contacts[user_key].trim()) ? contacts[user_key] : 'Unnamed';
      contacts[user_key] = local_username;
      const alias = message.hasOwnProperty('sender_username') ? message.sender_username : '';
      if (user_key === (document.Snackabra.identity.exportable_pubKey.x + " " + document.Snackabra.identity.exportable_pubKey.y) || local_username === 'Me') {
        contacts[user_key] = 'Me';
        username = 'Me';
        user_id = JSON.stringify(document.Snackabra.identity.exportable_pubKey);
      } else {
        if (alias !== '') {
          username = (local_username === alias || local_username === 'Unnamed') ? alias : alias + '  (' + local_username + ')';
        } else {
          username = '(' + local_username + ')';
        }
        if (document.Snackabra.crypto.areKeysSame(message.sender_pubKey, document.Snackabra.channel.keys.exportable_verifiedGuest_pubKey)) {
          username += "  (Verified)"
        } else if (document.Snackabra.crypto.areKeysSame(message.sender_pubKey, document.Snackabra.channel.keys.exportable_owner_pubKey)) {
          username += "  (Owner)"
        }
      }
    } else {
      username = 'Me';
      user_id = JSON.stringify(document.Snackabra.identity.exportable_pubKey);
    }
    return { _id: user_id, name: username };
  }

  const notify = (message, severity) => {
    Notifications.setMessage(message);
    Notifications.setSeverity(severity);
    Notifications.setOpen(true)
  }

  const openImageOverlay = (message) => {
    setImg(message.image);
    setOpenPreview(true)
    try {

      retrieveData(message, controlMessages).then((data) => {
        if (data.hasOwnProperty('error')) {
          //activeChatContext.sendSystemMessage('Could not open image: ' + data['error']);
        } else {
          setImgLoaded(true);
          setImg(data['url']);
        }
      })
    } catch (error) {
      console.log('openPreview() exception: ' + error.message);
      //activeChatContext.sendSystemMessage('Could not open image (' + error.message + ')');
      setOpenPreview(false)
    }
  }

  const imageOverlayClosed = () => {
    setImg('')
    setImgLoaded(false);
    setOpenPreview(false)
  }

  const promptUsername = () => {
    setOpenChangeName(true)
  }


  const handleReply = (user) => {
    try {
      if (roomContext.roomOwner) {
        roomContext.handleReply(user)
      } else {
        notify('Whisper is only for room owners.', 'info')
      }
    } catch (e) {
      console.log(e);
      notify(e.message, 'error')
    }
  }

  const getOldMessages = async () => {
    document.Snackabra.channel.api.getOldMessages()
  }

  const loadFiles = async (loaded) => {
    console.log(loaded)
    setFiles(loaded)
    setLoading(false)
  }

  const sendFiles = () => {
    const fileMessages = [];
    files.forEach((file, i) => {
      const message = new GiftedMessage({
        createdAt: new Date().toString(),
        text: "",
        image: file.restrictedUrl,
        user: user,
        _id: "1fa5a124-451d-4fc8-88eb-49309d47732" + i
      })
      fileMessages.push(message)
    })
    setMessages([...messages, ...fileMessages])
    removeInputFiles()
  }


  const sendMessages = (giftedMessage) => {
    if (giftedMessage[0].text === "") {
      if (files.length > 0) {
        sendFiles()
      }
    } else {
      const message = new GiftedMessage(giftedMessage[0])
      setMessages([...messages, message])
      //activeChatContext.sendMessage(message)
    }
  }

  const openAttachMenu = (e) => {
    setAnchorEl(e.currentTarget);
  }

  const handleClose = () => {
    setAnchorEl(null);
  };

  const removeInputFiles = () => {
    if (document.getElementById('fileInput')) {

      document.getElementById('fileInput').value = '';
    }
    setFiles([])
  }

  const showLoading = () => {
    setLoading(true)
  }
  return (
    <View style={{ flexGrow: 1, flexBasis: 'fit-content', height: height - 48 }}>
      <ImageOverlay open={openPreview} img={img} imgLoaded={imgLoaded} onClose={imageOverlayClosed} />
      <ChangeNameDialog open={openChangeName} />
      <MotdDialog open={openMotd} roomName={props.roomName} />
      <AttachMenu open={attachMenu} handleClose={handleClose} />
      <FirstVisitDialog open={openFirstVisit} onClose={() => {
        setOpenFirstVisit(false)
      }} roomId={roomId} />
      <GiftedChat
        messages={messages}
        onSend={sendMessages}
        // timeFormat='L LT'
        user={user}
        inverted={false}
        alwaysShowSend={true}
        loadEarlier={activeChatContext.moreMessages}
        isLoadingEarlier={activeChatContext.loadingMore}
        onLoadEarlier={getOldMessages}
        renderActions={(props) => {
          return <RenderAttachmentIcon
            {...props}
            addFile={loadFiles}
            openAttachMenu={openAttachMenu}
            showLoading={showLoading} />
        }}
        //renderUsernameOnMessage={true}
        // infiniteScroll={true}   // This is not supported for web yet
        renderMessageImage={(props) => {
          return <RenderImage {...props} openImageOverlay={openImageOverlay} />
        }}
        scrollToBottom={true}
        showUserAvatar={true}
        onPressAvatar={promptUsername}
        onLongPressAvatar={(context) => {
          return handleReply(context)
        }}
        renderChatFooter={() => {
          return <RenderChatFooter removeInputFiles={removeInputFiles} files={files} loading={loading} />
        }}
        renderBubble={(props) => {
          return <RenderBubble {...props} keys={''} SB={SB} />
        }}
        renderSend={RenderSend}
        renderComposer={(props) => {
          return <RenderComposer {...props} filesAttached={files.length > 0} />
        }}
        onLongPress={() => false}
        renderTime={RenderTime}

      />
    </View>
  )

}

export default ChatRoom;
