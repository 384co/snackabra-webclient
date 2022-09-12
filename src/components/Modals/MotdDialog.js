import * as React from "react"
import ResponsiveDialog from "../ResponsiveDialog";
import { Grid, TextField, Typography } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import { useContext, useState,useEffect } from "react";
import RoomContext from "../../contexts/RoomContext";
import { Trans } from "@lingui/macro";

export default function MotdDialog(props) {
  const Room = useContext(RoomContext)

  const [open, setOpen] = useState(props.open);
  const [text, setText] = useState('');

  useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  const updateWhisperText = (e) => {
    setText(e.target.value)
  }

  const sendWhisper = () => {
    Room.sendMessage(text, true);
    setText('')
    setOpen(false)
  }

  return (
    <ResponsiveDialog
      title={typeof props.roomName === 'string' ? props.roomName : 'MotdDialog'}
      open={open}>
      <Grid container
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start">
        <Grid item xs={12}>
          <Typography variant={'body1'}>
            {Room.motd !== '' &&
              <Trans id='motd text'>Message of the day: {Room.motd}</Trans>}
          </Typography>
        </Grid>
        {!Room.room_owner ?
          <>
            <TextField
              id="whisper-text"
              label="Whisper"
              onChange={updateWhisperText}
              multiline
              fullWidth
              rows={4}
              value={text}
              variant="filled"
            />
            <StyledButton variant={'outlined'} onClick={sendWhisper}>Send</StyledButton>
          </>
          : null
        }
      </Grid>
    </ResponsiveDialog>
  )

}

