import * as React from 'react';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';

const ConnectionStatus = (props) => {
    const [status, setStatus] = React.useState('warning')
    React.useEffect(() => {
        switch (props.socket?.status) {
            case 'CONNECTING':
                setStatus('warning')
                break;
            case 'OPEN':
                setStatus('success')
                break;
            case 'CLOSING':
                setStatus('warning')
                break;
            default:
                setStatus('error')
                break;
        }
    }, [props])
    console.log(status)
    return (
        <>
            <Tooltip title={`Connection Status (${props.socket?.status})`}>
                <Badge
                    sx={{ pl: 2 }}
                    badgeContent=""
                    color={status}
                    variant="solid"
                />
            </Tooltip>
        </>
    );
}

export default ConnectionStatus