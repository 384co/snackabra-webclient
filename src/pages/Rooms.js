import * as React from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import AddCommentIcon from '@mui/icons-material/AddComment';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import InputAdornment from '@mui/material/InputAdornment';
import CloseIcon from '@mui/icons-material/Close';
import Toolbar from '@mui/material/Toolbar';
import { useContext } from "react";
import ImportDialog from "../components/Modals/ImportDialog";
import { useParams } from "react-router-dom";
import { Grid, Hidden, IconButton, TextField, Typography } from "@mui/material";
import ChatRoom from "../components/Chat/ChatRoom";
import CreateRoomDialog from "../components/Modals/CreateRoomDialog";
import JoinDialog from "../components/Modals/JoinDialog";
import AdminDialog from "../components/Modals/AdminDialog";
import { downloadRoomData } from "../utils/utils";
import Fab from '@mui/material/Fab';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import NotificationContext from "../contexts/NotificationContext";
import RoomMenu from "../components/Rooms/RoomMenu"
import { observer } from "mobx-react"
import sbContext from "../stores/Snackabra.Store"


const drawerWidth = 240;

const ResponsiveDrawer = observer((props) => {

  const Notifications = useContext(NotificationContext)
  let { room_id } = useParams();
  const { window } = props;
  const [roomId, setRoomId] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openImportDialog, setOpenImportDialog] = React.useState(false);
  const [openCreateDialog, setOpenCreateDialog] = React.useState(false);
  const [openAdminDialog, setOpenAdminDialog] = React.useState(false);
  const [openJoinDialog, setOpenJoinDialog] = React.useState(false);
  const [editingRoomId, setEditingRoomId] = React.useState(false);
  const [updatedName, setUpdatedName] = React.useState(false);

  React.useEffect(()=>{
    sbContext.init().then(()=>{
      setRoomId(room_id)
    })
  },[room_id])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getRoomData = (roomId) => {
    downloadRoomData(roomId, sbContext.roomMetadata)
  }

  const editRoom = (roomId) => {
    setEditingRoomId(roomId)
    setTimeout(() => {
      console.log(roomId)
      document.getElementById(roomId).focus()
    }, 250);
  }

  const submitName = (e) => {
    if (e.keyCode === 13) {
      sbContext.roomName = updatedName
      setEditingRoomId(false)
    }
  }

  const updateName = (e) => {
    setUpdatedName(e.target.value)
  }

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            setOpenJoinDialog(true)
          }}>
            <ListItemIcon>
              <AddCircleOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary={'Join a room'} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            setOpenCreateDialog(true)
          }}>
            <ListItemIcon>
              <AddCommentIcon />
            </ListItemIcon>
            <ListItemText primary={'Create a room'} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            setOpenImportDialog(true)
          }}>
            <ListItemIcon>
              <FileUploadIcon />
            </ListItemIcon>
            <ListItemText primary={'Import a room'} />
          </ListItemButton>
        </ListItem>
        <Hidden xsUp={!sbContext.admin}>
          <ListItem disablePadding>
            <ListItemButton onClick={() => {
              setOpenAdminDialog(true)
            }}>
              <ListItemIcon>
                <AdminPanelSettingsIcon />
              </ListItemIcon>
              <ListItemText primary={'Administration'} />
            </ListItemButton>
          </ListItem>
        </Hidden>
        <Divider />
        {Object.keys(sbContext.rooms).map((room, index) => {
          const bgColor = room === roomId ? '#ff5c42' : 'inherit';
          const color = room === roomId ? '#fff' : 'inherit';
          const roomName = sbContext.rooms[room].name
          return (
            <ListItem key={index} disablePadding sx={{ backgroundColor: bgColor, color: color }}>
              <ListItemButton>
                <Grid container
                  direction="row"
                  justifyContent={'space-between'}
                  alignItems={'center'}
                >
                  <Grid xs={7} item>
                    {editingRoomId !== room ?
                      <a href={`/rooms/${room}`}>
                        <ListItemText primary={roomName} />
                      </a> :
                      <TextField
                        id={editingRoomId}
                        value={updatedName}
                        onKeyDown={submitName}
                        onFocus={() => {
                          setUpdatedName('')
                        }}
                        onChange={updateName}
                        variant="standard"
                        autoComplete="false"
                        InputProps={{
                          endAdornment:
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="cancel room rename"
                                onClick={() => { setEditingRoomId(false) }}
                                onMouseDown={() => { setEditingRoomId(false) }}
                                edge="end"
                              >
                                <CloseIcon sx={{ color: "#fff" }} />
                              </IconButton>
                            </InputAdornment>
                        }}
                        autoFocus />
                    }
                  </Grid>
                  <Grid xs={5} item>
                    <RoomMenu
                      socket={sbContext.socket}
                      selected={room === roomId}
                      roomId={room}
                      editRoom={() => {
                        editRoom(room)
                      }}
                      getRoomData={() => {
                        getRoomData(room)
                      }}
                    />
                  </Grid>
                </Grid>
              </ListItemButton>
            </ListItem>

          )
        })}
      </List>
    </div>
  );

  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: 'flex', p: 0 }}>
      <CssBaseline />
      <ImportDialog open={openImportDialog} onClose={() => {
        setOpenImportDialog(false)
      }} />
      <CreateRoomDialog open={openCreateDialog} onClose={() => {
        setOpenCreateDialog(false)
      }} />
      <AdminDialog open={openAdminDialog} onClose={() => {
        setOpenAdminDialog(false)
      }} />
      <JoinDialog open={openJoinDialog} onClose={() => {
        setOpenJoinDialog(false)
      }} />
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Fab color="#ff5c42"
          variant="extended"
          onClick={handleDrawerToggle}
          sx={{ mt: 2, position: 'absolute', display: { xs: 'flex-inline', sm: 'none' }, }}>
          <Typography variant={'body2'}>Menu</Typography>
          <KeyboardArrowRightIcon />
        </Fab>
        {/* For future implementation on mobile */}
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, mt: '48px' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 0, width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        {(!roomId || !sbContext.activeroom) && (<Grid>
          <Toolbar />
          <Typography variant={'h6'}>Select a room or create a new one to get started.</Typography>
        </Grid>)
        }
        {(roomId && sbContext) &&
          (<ChatRoom roomId={roomId ? roomId : sbContext.activeroom} sbContext={sbContext} Notifications={Notifications} />)
        }
      </Box>
    </Box>
  );
})


export default ResponsiveDrawer;
