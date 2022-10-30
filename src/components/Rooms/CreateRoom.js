import * as React from "react"
import { Trans } from "@lingui/macro";
import { Grid, TextField } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import { useState, useContext } from "react"
import NotificationContext from "../../contexts/NotificationContext";
import {observer} from "mobx-react"
import { useStateValues } from '../../stores/GlobalProvider';


const CreateRoom = observer((props) => {
  const Notifications = useContext(NotificationContext)
  const sbContext = useStateValues().sbStore
  const [secret, setSecret] = useState('');

  const success = () => {
    Notifications.setMessage('Room Created!');
    Notifications.setSeverity('success');
    Notifications.setOpen(true)
  }

  const error = () => {
    Notifications.setMessage('Error creating the room');
    Notifications.setSeverity('error');
    Notifications.setOpen(true)
  }


  const createRoom = async () => {
    try {

      await sbContext.createRoom(secret)
      if (typeof props?.onClose === 'function') {
        props.onClose()
      }
      success();
    } catch (e) {
      console.error(e)
      error()
    }
  }

  return (
    <Grid spacing={2}
          container
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start">

      <Grid xs={12} item>
        <TextField
          fullWidth
          placeholder={'Server Secret'}
          value={secret}
          onChange={(e) => {
            setSecret(e.target.value)
          }}
        />
      </Grid>
      <Grid xs={12} item>
        <StyledButton variant="contained" onClick={createRoom}><Trans id='new room header'>Create New
          Room</Trans></StyledButton>
      </Grid>

    </Grid>
  )
})

export default CreateRoom
