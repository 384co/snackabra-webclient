import * as React from "react"
import ResponsiveDialog from "../ResponsiveDialog"
import { useTheme } from '@mui/material/styles'

import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import ListSubheader from '@mui/material/ListSubheader'
import Switch from '@mui/material/Switch'
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff'
import { SnackabraContext } from "mobx-snackabra-store"

function storageAvailable(type) {
  let storage;
  try {
      storage = window[type];
      const x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
  }
  catch (e) {
      return e instanceof DOMException && (
          // everything except Firefox
          e.code === 22 ||
          // Firefox
          e.code === 1014 ||
          // test name field too, because code might not be present
          // everything except Firefox
          e.name === 'QuotaExceededError' ||
          // Firefox
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
          // acknowledge QuotaExceededError only if there's something already stored
          (storage && storage.length !== 0);
  }
}

function GeneralNotificationSettingsDialog(props) {
  const theme = useTheme()
  const sbContext = React.useContext(SnackabraContext)
  const [open, setOpen] = React.useState(props.open)

  const [checked, setChecked] = React.useState([]);
  const handleToggle = (value) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
    handleSaveSettings(newChecked)
  };

  const defaultSettings = {
    disable: { isActive: false },
    //snooze: { isActive: false },
    adminRoomDataDownloaded: { isActive: false }
  }

  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])


  React.useEffect(() => {
    if (storageAvailable('localStorage')) {
      // For dev -- resets the object, if you change keys or whatever...
      //localStorage.removeItem('push-notif-settings-global')

      loadSettingsFromLocalStorage()
    }
  }, [])



  const loadSettingsFromLocalStorage = () => {
    //console.log('-- loadSettings --')

    if(storageAvailable('localStorage')) {
      let localStorage = window['localStorage']
      if(!localStorage.getItem('push-notif-settings-global')) {
        //console.log(' -- No settings found. Initializing settings.')
        localStorage.setItem('push-notif-settings-global', JSON.stringify(defaultSettings))
      } else {
        let settingsRaw = localStorage.getItem('push-notif-settings-global')
        let settings = JSON.parse(settingsRaw)

        let newChecked = [...checked]
        Object.keys(settings).forEach(key => {
          if(settings[key].isActive) {
            newChecked.push(key)
          }
        })
        setChecked(newChecked)
      }
    }
  }

  const handleSaveSettings = (activeSettings) => {
    // console.log('-- handleSaveSettings --')
    // console.dir(activeSettings)

    if (storageAvailable('localStorage')) {
      let settings = defaultSettings
      activeSettings.forEach(s => {
        console.log(`${s} is active`)
        settings[s].isActive = true
      })

      // console.log(settings)

      localStorage.setItem('push-notif-settings-global', JSON.stringify(settings))
    }
  }


  return (
    <ResponsiveDialog title={'Notification Settings'}
    open={open}
    onClose={props.onClose}
    showActions
    fullScreen>
      {/* <List sx={{ width: '100%', maxWidth: 640, bgcolor: 'background.paper' }}>
        <ListItem>
          <ListItemIcon>
            <NotificationsPausedIcon />
          </ListItemIcon>
          <ListItemText id="switch-list-label-notif-snooze" primary="Snooze Notifications" />
          <NativeSelect
            defaultValue={30}
            inputProps={{
              name: 'notif-snooze-duration',
              id: 'uncontrolled-native',
            }}
          >
            <option value={30}>30 Minutes</option>
            <option value={60}>1 Hour</option>
            <option value={120}>2 Hours</option>
          </NativeSelect>
          <Switch
            edge="end"
            onChange={handleToggle('snooze')}
            checked={checked.indexOf('snooze') !== -1}
            inputProps={{
              'aria-labelledby': 'switch-list-label-notif-snooze',
            }}
          />
        </ListItem>
      </List> */}

      <List
      sx={{ width: '100%', maxWidth: 640 }}
      subheader={<ListSubheader>General</ListSubheader>}
      disablePadding
      >
        <ListItem>
          <ListItemIcon>
            <NotificationsOffIcon />
          </ListItemIcon>
          <ListItemText id="switch-list-label-notif-disable" primary="Disable All Notifications" />
          <Switch
            edge="end"
            onChange={handleToggle('disable')}
            checked={checked.indexOf('disable') !== -1}
            inputProps={{
              'aria-labelledby': 'switch-list-label-notif-disable',
            }}
          />
        </ListItem>
      </List>


      <List
      sx={{ width: '100%', maxWidth: 640 }}
      subheader={<ListSubheader>Administrative</ListSubheader>}
      disablePadding
      >

      </List>


    </ResponsiveDialog>
  )
}

function RoomNotificationSettingsDialog(props) {
  const theme = useTheme()
  const sbContext = React.useContext(SnackabraContext)
  const [open, setOpen] = React.useState(props.open)

  const [checked, setChecked] = React.useState([]);
  const handleToggle = (value) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
    handleSaveSettings(newChecked)
  };

  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  React.useEffect(() => {
    if (storageAvailable('localStorage')) {
      // For dev -- resets the object, if you change keys or whatever...
      //localStorage.removeItem('push-notif-settings-global')
      loadSettingsFromLocalStorage()
    } else {
      console.log('Local storage not available. Unable to save settings.')
    }
  }, [])

  const defaultRoomSettings = {
    disable: {isActive: false },
    newMessageReceived: { isActive: false },
    newFileUploaded: { isActive: false },
    userFirstTimeEnter: { isActive: false },
    userEntered: { isActive: false },
    userExited: { isActive: false},
  }

  const loadSettingsFromLocalStorage = () => {
    //console.log('-- loadSettings --')

    if(storageAvailable('localStorage')) {
      let localStorage = window['localStorage']
      if(!localStorage.getItem(`push-notif-settings-${props.roomId}`)) {
        //console.log(' -- No settings found. Initializing settings.')
        localStorage.setItem(`push-notif-settings-${props.roomId}`, JSON.stringify(defaultRoomSettings))
      } else {
        let settingsRaw = localStorage.getItem(`push-notif-settings-${props.roomId}`)
        let settings = JSON.parse(settingsRaw)

        let newChecked = [...checked]
        Object.keys(settings).forEach(key => {
          if(settings[key].isActive) {
            newChecked.push(key)
          }
        })
        setChecked(newChecked)
      }
    }
  }

  const handleSaveSettings = (activeSettings) => {
    console.log('-- handleSaveSettings --')
    console.log(`RoomId: ${props.roomId}`)
    console.dir(activeSettings)

    if (storageAvailable('localStorage')) {
      let settings = defaultRoomSettings
      activeSettings.forEach(s => {
        settings[s].isActive = true
      })

      console.log('settings')
      console.dir(settings)

      localStorage.setItem(`push-notif-settings-${props.roomId}`, JSON.stringify(settings))
    }
  }


  return (
    <ResponsiveDialog title={'Room Notification Settings'}
    open={open}
    onClose={props.onClose}
    showActions
    fullScreen>
      <List sx={{ paddingBottom: '50px', width: '100%', maxWidth: 640, bgcolor: 'background.paper' }}>
        <ListItem>
          <ListItemIcon>
            <NotificationsOffIcon />
          </ListItemIcon>
          <ListItemText id="switch-list-label-notif-disable" primary="Disable notifications for this room" />
          <Switch
            edge="end"
            onChange={handleToggle('disable')}
            checked={checked.indexOf('disable') !== -1}
            inputProps={{
              'aria-labelledby': 'switch-list-label-notif-disable',
            }}
          />
        </ListItem>
      </List>

      <List
      sx={{ width: '100%', maxWidth: 640 }}
      subheader={<ListSubheader>Content</ListSubheader>}
      >
        <ListItem>
          <ListItemIcon />
          <ListItemText id="switch-list-label-notif-room-new-msg" primary="New message received" />
          <Switch
            edge="end"
            onChange={handleToggle('newMessageReceived')}
            checked={checked.indexOf('newMessageReceived') !== -1}
            inputProps={{
              'aria-labelledby': 'switch-list-label-notif-room-new-msg',
            }}
          />
        </ListItem>

        <ListItem>
          <ListItemIcon />
          <ListItemText id="switch-list-label-notif-room-new-file" primary="New file in chat" />
          <Switch
            edge="end"
            onChange={handleToggle('newFileUploaded')}
            checked={checked.indexOf('newFileUploaded') !== -1}
            inputProps={{
              'aria-labelledby': 'switch-list-label-notif-room-new-file',
            }}
          />
        </ListItem>
      </List>

      <List
      sx={{ width: '100%', maxWidth: 640 }}
      subheader={<ListSubheader>User</ListSubheader>}
      >
        <ListItem>
          <ListItemIcon />
          <ListItemText id="switch-list-label-notif-room-user-entered-first-time" primary="User entered chat for first time" />
          <Switch
            edge="end"
            onChange={handleToggle('userFirstTimeEnter')}
            checked={checked.indexOf('userFirstTimeEnter') !== -1}
            inputProps={{
              'aria-labelledby': 'switch-list-label-notif-room-user-entered-first-time',
            }}
          />
        </ListItem>

        <ListItem>
          <ListItemIcon />
          <ListItemText id="switch-list-label-notif-room-user-entered" primary="User entered chat" />
          <Switch
            edge="end"
            onChange={handleToggle('userEntered')}
            checked={checked.indexOf('userEntered') !== -1}
            inputProps={{
              'aria-labelledby': 'switch-list-label-notif-room-user-entered',
            }}
          />
        </ListItem>

        <ListItem>
          <ListItemIcon />
          <ListItemText id="switch-list-label-notif-room-user-exited" primary="User exited chat" />
          <Switch
            edge="end"
            onChange={handleToggle('userExited')}
            checked={checked.indexOf('userExited') !== -1}
            inputProps={{
              'aria-labelledby': 'switch-list-label-notif-room-user-exited',
            }}
          />
        </ListItem>
      </List>

      <List
      sx={{
        // BUG - This checks the *active* room, not the room we're actually querying.
        display: !sbContext.admin ? 'none' : 'inherit',
        width: '100%', maxWidth: 640 }}
      subheader={<ListSubheader>Admin</ListSubheader>}
      >
        <ListItem>
          <ListItemIcon />
          <ListItemText id="switch-list-label-notif-admin-room-data-downloaded" primary="Room data downloaded" />
          <Switch
            edge="end"
            onChange={handleToggle('adminRoomDataDownloaded')}
            checked={checked.indexOf('adminRoomDataDownloaded') !== -1}
            inputProps={{
              'aria-labelledby': 'switch-list-label-notif-admin-room-data-downloaded',
            }}
          />
        </ListItem>
      </List>

    </ResponsiveDialog>
  )
}

export { GeneralNotificationSettingsDialog, RoomNotificationSettingsDialog }