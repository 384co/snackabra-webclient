import * as React from "react"
import ResponsiveDialog from "../ResponsiveDialog";
import { Grid, OutlinedInput } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import { useContext, useState, useEffect } from "react";
import RoomContext from "../../contexts/RoomContext";

export default function ChangeNameDialog(props) {
  const Room = useContext(RoomContext)

  const [open, setOpen] = useState(props.open);
  const [username, setUsername] = useState(props.open);

  useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  useEffect(() => {
    setUsername(Room.changeUsername?.name)
  }, [Room.changeUsername?.name])

  const updateUsername = (e) => {
    setUsername(e.target.value)
  }

  const setMe = () => {
    setUsername('Me')
    localStorage.setItem(Room.roomId + '_username', 'Me')
    Room.saveUsername(username)
    setOpen(false)
  }

  const saveUserName = () =>{
    localStorage.setItem(Room.roomId + '_username', username)
    Room.saveUsername(username)
    setOpen(false)
  }

  return (
    <ResponsiveDialog title={'Change Username'} open={open}>
      <Grid container
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start">
        <Grid item xs={12}>
          <OutlinedInput placeholder="Please enter text"
                         value={username}
                         onChange={updateUsername} fullWidth />
        </Grid>
        <StyledButton variant={'outlined'} onClick={saveUserName}>Save</StyledButton>
        <StyledButton variant={'outlined'} onClick={setMe}>Me</StyledButton>
      </Grid>
    </ResponsiveDialog>
  )

}
