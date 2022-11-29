import * as React from 'react';
import { useLocation } from "react-router-dom";
import { AppBar, Avatar, Box, Grid, IconButton, Typography } from "@mui/material";
import { AppBarTab, AppBarTabLink, AppBarTabs } from "../styles/AppBarTabs";
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import WhisperUserDialog from "./Modals/WhisperUserDialog";
import { observer } from "mobx-react"
import { SnackabraContext } from "mobx-snackabra-store";


const NavAppBar = observer((props) => {
  const sbContext = React.useContext(SnackabraContext);
  const [value, setValue] = React.useState(0);
  const [openWhisper, setOpenWhisper] = React.useState(false);
  const location = useLocation();

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const closeWhisper = () => {
    setOpenWhisper(false)
  }

  React.useEffect(() => {
    switch (location.pathname) {
      case '/':
        setValue(0);
        break;
      case '/guide':
        setValue(1);
        break;
      default:
        setValue(2);
        break;

    }
  }, [location]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <WhisperUserDialog open={openWhisper} onClose={closeWhisper} />
      <AppBar position="fixed" sx={{ backgroundColor: 'black', textTransform: 'none' }}>
        <Grid
          container
          justifyContent="space-between"
        >
          <Grid item>
            <AppBarTabs
              value={value}
              onChange={handleChange}
            >
              <AppBarTabLink to={'/'}>
                <AppBarTab
                  label="Home"
                  sx={{ mr: { lg: 1, xl: 6 } }}
                />
              </AppBarTabLink>
              <AppBarTabLink to={'/guide'}>
                <AppBarTab
                  label="Guide"

                  sx={{ mr: { lg: 1, xl: 6 } }}
                />
              </AppBarTabLink>
              <AppBarTabLink to={'/rooms'}>
                <AppBarTab
                  label="Rooms"

                  sx={{ mr: { lg: 1, xl: 6 } }}
                />
              </AppBarTabLink>
            </AppBarTabs>
          </Grid>
          <Grid item>
            <Grid
              container
              direction="row"
              justifyContent="center"
              alignItems="center"
            >
              <Grid item>
                <Typography variant='body2'>v{process.env.REACT_APP_CLIENT_VERSION}</Typography>
              </Grid>
              {!sbContext.admin && sbContext.socket?.status === "OPEN" ?
                <Avatar onClick={() => { setOpenWhisper(true) }} sx={{ width: 48, height: 48, bgcolor: 'transparent' }}>
                  <IconButton color="inherit" component="span">
                    <AccountCircleRoundedIcon />
                  </IconButton>
                </Avatar>
                :
                <Avatar sx={{ width: 48, height: 48, bgcolor: 'transparent', color: "#000" }}/>
              }
            </Grid>
          </Grid>
        </Grid>
      </AppBar>
    </Box>
  );
})

export default NavAppBar
