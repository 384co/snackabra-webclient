import * as React from "react";
import ResponsiveDialog from "../ResponsiveDialog";
import CreateRoom from "../Rooms/CreateRoom";


export default function CreateRoomDialog(props){
  const [open, setOpen] = React.useState(props.open);

  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  return (
    <ResponsiveDialog title={'Create Room'} open={open} onClose={props.onClose} showActions>
      <CreateRoom onClose={props.onClose}/>
    </ResponsiveDialog>
  )

}
