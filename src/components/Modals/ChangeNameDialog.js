import * as React from "react"
import ResponsiveDialog from "../ResponsiveDialog";
import { Grid, OutlinedInput } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import { useState, useEffect } from "react";
import { observer } from "mobx-react"
import sbContext from "../../stores/Snackabra.Store"


const ChangeNameDialog = observer((props) => {

  const [open, setOpen] = useState(props.open);
  const [username, setUsername] = useState(sbContext.username);

  useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  const updateUsername = (e) => {
    setUsername(e.target.value)
  }

  const setMe = () => {
    setUsername('Me')
    sbContext.username = username
    props.onClose()
  }

  const saveUserName = () => {
    sbContext.username = username
    props.onClose()
  }

  return (
    <ResponsiveDialog title={'Change Username'} open={open} onClose={props.onClose}>
      <Grid container
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start">
        <Grid item xs={12} sx={{ pb: 1 }}>
          <OutlinedInput placeholder="Please enter text"
            value={username}
            onChange={updateUsername} fullWidth />
        </Grid>
        <StyledButton variant={'outlined'} onClick={saveUserName}>Save</StyledButton>
        <StyledButton variant={'outlined'} onClick={setMe}>Me</StyledButton>
      </Grid>
    </ResponsiveDialog>
  )

})

export default ChangeNameDialog