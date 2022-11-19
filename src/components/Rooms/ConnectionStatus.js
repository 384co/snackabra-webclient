import * as React from 'react';
import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import { observer } from "mobx-react"

const ConnectionStatus = (props) => {
    const [status, setStatus] = React.useState('warning')
    React.useEffect(() => {
        console.log(props.socket?.ws)
    }, [props])

    return (
        <>
            <Divider orientation="vertical" />
            <Badge
                badgeContent=""
                color={status}
                variant="solid"
            />

        </>
    );
}

export default ConnectionStatus