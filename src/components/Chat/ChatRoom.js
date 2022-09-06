/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import * as React from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import RenderBubble from "./RenderBubble";
import { useContext, useState } from "react";
import ActiveChatContext from "../../contexts/ActiveChatContext";
import RenderAttachmentIcon from "./RenderAttachmentIcon";
import ImageOverlay from "../Modals/ImageOverlay";
import RenderImage from "./RenderImage";
import { retrieveData } from "../../utils/ImageProcessor";
import ChangeNameDialog from "../Modals/ChangeNameDialog";
import MotdDialog from "../Modals/MotdDialog";
import NotificationContext from "../../contexts/NotificationContext";
import { deriveKey, importKey } from "../../utils/crypto";
import RenderChatFooter from "./RenderChatFooter";
import RenderTime from "./RenderTime";
import { View } from "react-native";
import AttachMenu from "./AttachMenu";
import RoomContext from "../../contexts/RoomContext";
import config from "../../config";
import FirstVisitDialog from "../Modals/FirstVisitDialog";
import { orderBy, uniqBy } from "lodash";

const ChatRoom = (props) => {
  const activeChatContext = useContext(ActiveChatContext)
  const roomContext = useContext(RoomContext)
  const Notifications = useContext(NotificationContext)

  const [openPreview, setOpenPreview] = useState(false);
  const [openChangeName, setOpenChangeName] = useState(false);
  const [openFirstVisit, setOpenFirstVisit] = useState(false);
  const [openMotd, setMotdDialog] = useState(false);
  const [height, setHeight] = useState(0);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const attachMenu = Boolean(anchorEl);
  const [img, setImg] = useState('');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [controlMessages, setControlMessages] = useState([]);
  const [user, setUser] = React.useState({});
  const [files, setFiles] = React.useState([]); // [{dataUrl: "base64 data url", file: "raw file input}]

  React.useEffect(() => {
    roomContext.goToRoom(props.roomId)
    activeChatContext.changeRoomId(props.roomId)
    if (localStorage.getItem(props.roomId) === null && props.roomId !== '') {
      setOpenFirstVisit(true);
    } else {
      activeChatContext.joinRoom(props.roomId)
    }
    function handleResize() {
      setHeight(window.innerHeight)
    }

    window.addEventListener('resize', handleResize)
    handleResize();
    if (localStorage.getItem(props.roomId) === null && props.roomId !== '') {
      setOpenFirstVisit(true);
    } else {
      const key = JSON.parse(localStorage.getItem(props.roomId))
      console.log(key)
      document.Snackabra.setIdentity(key).then(async () => {
        await document.Snackabra.connect(props.roomId)
        setUser(getUser());
        document.Snackabra.channel.api.getOldMessages(0).then(async (messages) => {
          const _oldMessages = [];
          for (let x in messages) {
            const message = {};
            message[x] = messages[x];
            console.log(message[x])

            const _message = JSON.parse(await document.Snackabra.channel.socket.receive(message));
            _message.user = getUser(_message)
            _message.text = _message.contents
            _oldMessages.push(_message)
          }
          setMessages(_oldMessages)
        });

      })
    }
  }, [])

  /*
  React.useEffect(() => {
    const updatedControlMessages = [...controlMessages, ...activeChatContext.controlMessages];
    setControlMessages(updatedControlMessages)
  }, [activeChatContext.controlMessages]);

   */

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
          activeChatContext.sendSystemMessage('Could not open image: ' + data['error']);
        } else {
          setImgLoaded(true);
          setImg(data['url']);
        }
      })
    } catch (error) {
      console.log('openPreview() exception: ' + error.message);
      activeChatContext.sendSystemMessage('Could not open image (' + error.message + ')');
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


  const handleReply = async (user) => {
    try {
      if (activeChatContext.roomOwner) {

        const recipient_pubKey = await importKey("jwk", JSON.parse(user._id), "ECDH", true, []);
        const reply_encryptionKey = await deriveKey(activeChatContext.keys.privateKey, recipient_pubKey, "AES", false, ["encrypt", "decrypt"])
        activeChatContext.setReplyTo(user)
        activeChatContext.setReplyEncryptionKey(reply_encryptionKey)
      } else {
        notify('Whisper is only for room owners.', 'info')
      }
    } catch (e) {
      console.log(e);
      notify(e.message, 'error')
    }
  }

  const getOldMessages = () => {
    activeChatContext.getOldMessages()
  }

  const sendMessages = (messages) => {
    activeChatContext.sendMessage(messages);
    removeInputFiles();
  }

  const getExportablePubKey = () => {
    return activeChatContext.keys.exportable_pubKey;
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

  return (
    <View style={{ flexGrow: 1, flexBasis: 'fit-content', height: height - 48 }}>
      <ImageOverlay open={openPreview} img={img} imgLoaded={imgLoaded} onClose={imageOverlayClosed} />
      <ChangeNameDialog open={openChangeName} />
      <MotdDialog open={openMotd} roomName={props.roomName} />
      <AttachMenu open={attachMenu} handleClose={handleClose} />
      <FirstVisitDialog open={openFirstVisit} onClose={() => {
        setOpenFirstVisit(false)
      }} roomId={props.roomId} />
      <GiftedChat
        messages={messages}
        onSend={sendMessages}
        // timeFormat='L LT'
        user={{ _id: JSON.stringify(getExportablePubKey()) }}
        inverted={false}
        alwaysShowSend={true}
        loadEarlier={activeChatContext.moreMessages}
        isLoadingEarlier={activeChatContext.loadingMore}
        onLoadEarlier={getOldMessages}
        renderActions={(props) => {
          return <RenderAttachmentIcon {...props} openAttachMenu={openAttachMenu} />
        }}
        // renderUsernameOnMessage={true}
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
          return <RenderChatFooter removeInputFiles={removeInputFiles} imgUrl={activeChatContext.imgUrl} />
        }}
        renderBubble={(props) => {
          return <RenderBubble {...props} keys={activeChatContext.getKeys()} />
        }}
        onLongPress={() => false}
        renderTime={RenderTime}

      />
    </View>
  )

}

export default ChatRoom;
