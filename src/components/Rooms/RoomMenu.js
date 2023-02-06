import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MenuList from '@mui/material/MenuList';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import IosShareOutlinedIcon from '@mui/icons-material/IosShareOutlined';
import NotificationContext from "../../contexts/NotificationContext";
import ConnectionStatus from "./ConnectionStatus"
import { observer } from "mobx-react"
import { SnackabraContext } from "mobx-snackabra-store";

const ITEM_HEIGHT = 48;

const RoomMenu = observer((props) => {
  const sbContext = React.useContext(SnackabraContext);
  const notify = React.useContext(NotificationContext);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const copy = async () => {
    if ('clipboard' in navigator) {
      await navigator.clipboard.writeText(window.location.origin + '/r/' + props.roomId)
    } else {
      document.execCommand('copy', true, window.location.origin + '/r/' + props.roomId)
    }
    notify.setMessage('Room URL copied to clipboard!');
    notify.setSeverity('success');
    notify.setOpen(true)
    handleClose()

  }

  const getRoomData = React.useCallback(async (roomId) => {
    console.log(roomId)
    const room = await sbContext.getChannel(roomId)
    console.log(room)
    sbContext.downloadRoomData(roomId, room.key).then((data) => {
      delete data.channel.SERVER_SECRET
      console.log(data.channel)
      downloadFile(data.channel, sbContext.rooms[roomId].name + "_data.txt");
    }).catch((e) => {
      console.error(e)
      notify.error(e.message)
    })
  }, [notify, sbContext])

  const getRoomStorage = React.useCallback(async (roomId) => {
    const room = await sbContext.getChannel(roomId)
    sbContext.downloadRoomData(roomId, room.key).then((data) => {
      downloadFile(data.storage, sbContext.rooms[roomId].name + "_shards.txt")
    }).catch((e) => {
      console.error(e)
      notify.error(e.message)
    })
  }, [notify, sbContext])

  const downloadFile = (text, file) => {
    try {
      let element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8, ' + encodeURIComponent(JSON.stringify(text, null, 2).trim()));
      element.setAttribute('download', file);
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div>
      <IconButton
        aria-label="more"
        id="long-button"
        aria-controls={open ? 'long-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        <MoreVertIcon sx={{ color: props.selected ? '#fff' : 'inherit' }} />
      </IconButton>
      <Menu
        id="long-menu"
        MenuListProps={{
          'aria-labelledby': 'long-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4.5,
            width: '20ch',
          },
        }}
      >
        <MenuList>
          <MenuItem onClick={() => {
            handleClose()
            props.editRoom()
          }}>
            <ListItemIcon>
              <EditOutlinedIcon />
            </ListItemIcon>
            <ListItemText>Edit Name</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            handleClose()
            getRoomData(props.roomId)
          }}>
            <ListItemIcon>
              <FileDownloadOutlinedIcon />
            </ListItemIcon>
            <ListItemText>Get Channel</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            handleClose()
            getRoomStorage(props.roomId)
          }}>
            <ListItemIcon>
              <FileDownloadOutlinedIcon />
            </ListItemIcon>
            <ListItemText>Get Shards</ListItemText>
          </MenuItem>
          <MenuItem onClick={copy}>
            <ListItemIcon>
              <IosShareOutlinedIcon />
            </ListItemIcon>
            <ListItemText>Share</ListItemText>
          </MenuItem>
        </MenuList>
      </Menu>
      {props.selected ?
        <ConnectionStatus />
        : ''

      }

    </div>
  );
})



export default RoomMenu