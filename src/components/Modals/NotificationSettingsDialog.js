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


export default function GeneralNotificationSettingsDialog(props) {
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
    //console.log('-- handleSaveSettings --')

    if (storageAvailable('localStorage')) {
      let settings = defaultSettings
      activeSettings.forEach(s => {
        settings[s].isActive = true
      })

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

      {/* <List
      sx={{ width: '100%', maxWidth: 640, bgcolor: 'background.paper' }}
      subheader={<ListSubheader>General</ListSubheader>}
      >
        <ListItem>
          <ListItemIcon />
          <ListItemText primary="---" />
          <ListItemText primary="General" />
          <Switch
            edge="end"
            onChange={handleToggle('notif-general')}
            checked={checked.indexOf('notif-general') !== -1}
            inputProps={{
              'aria-labelledby': 'switch-list-label-notif-general',
            }}
          />
        </ListItem>
      </List> */}

      <List sx={{ paddingBottom: '50px', width: '100%', maxWidth: 640, bgcolor: 'background.paper' }}>
        <ListItem>
          <ListItemIcon>
            <NotificationsOffIcon />
          </ListItemIcon>
          <ListItemText id="switch-list-label-notif-disable" primary="Disable Notifications" />
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
        <ListItem>
          <ListItemIcon />
          <ListItemText id="switch-list-label-notif-admin-room-data-downloaded" primary="Room Data Downloaded" />
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