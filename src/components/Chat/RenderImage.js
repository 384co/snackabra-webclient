import React from 'react';
import { CircularProgress, Grid, IconButton } from "@mui/material";
import InputIcon from '@mui/icons-material/Download';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopy from '@mui/icons-material/ContentCopy'

const styles = {
  left: {
    right: -60
  },
  right: {
    left: -60
  }
}

const RenderImage = (props) => {
  const [isDling, setIsDownloading] = React.useState(false)
  const [downloaded, setDownloaded] = React.useState(false)
  const downloadImage = (message) => {
    setIsDownloading(true)
    props.sbContext.SB.storage.retrieveImage(message.imageMetaData, props.controlMessages).then((data) => {
      if (data.hasOwnProperty('error')) {
        setTimeout(()=>{
          setIsDownloading(false)
          setDownloaded(false)
        }, 2000)
        throw new Error(`Could not open image (${data.error})`)
        // props.notify('Could not open image (' + data.error + ')', 'error');
      } else {
        let element = document.createElement('a');
        element.setAttribute('href', data['url']);
        element.setAttribute('download', 'image.jpeg');
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        setDownloaded(true)
        setTimeout(() => {
          setIsDownloading(false)
          setDownloaded(false)
        }, 10000)
      }
    })
  }

  const [imageCopied, setImageCopied] = React.useState(false)
  const copyImage = async (message) => {
    if ('clipboard' in navigator) {
      // Write any data we may need to the clipboard here.
      // Currently, we copy only the image metadata -- we may need to construct
      // a payload that indicates this is snackabra image metadata, so when we
      // paste this into a snackabra room, it will be smart enough to know what
      // to do.
      await navigator.clipboard.writeText(JSON.stringify(message.imageMetaData))

      setImageCopied(true)
      setTimeout(() => {
        setImageCopied(false)
      }, 2000)

    } else {
      console.log('Clipboard not supported...')
    }
  }


  if (typeof props.currentMessage.image === 'string') {
    return (
      <Grid container sx={{ cursor: 'pointer' }} >
        <Grid item container>
          <Grid item>
            {!imageCopied ?
              <IconButton style={{ position: 'absolute', ...styles[props.position], top: '27%' }} onClick={() => { copyImage(props.currentMessage) }} component="div"
                  aria-label="attach" size="large">
                <ContentCopy color={'primary'} />
              </IconButton>
            :
              <IconButton style={{ position: 'absolute', ...styles[props.position], top: '27%' }} onClick={() => { copyImage(props.currentMessage) }} component="div"
                  aria-label="attach" size="large">
                <CheckIcon color={'primary'} />
              </IconButton>
            }
          </Grid>
          <Grid item>
            {!isDling ?
              <IconButton style={{ position: 'absolute', ...styles[props.position], top: '57%' }} onClick={() => { downloadImage(props.currentMessage) }} component="div"
                aria-label="attach" size="large">
                <InputIcon color={'primary'} />
              </IconButton> : !downloaded ?
                <IconButton style={{ position: 'absolute', ...styles[props.position], top: '57%' }} disabled component="div"
                  aria-label="attach" size="large">
                  <CircularProgress size={30} />
                </IconButton> :
                <IconButton style={{ position: 'absolute', ...styles[props.position], top: '57%' }} onClick={() => { downloadImage(props.currentMessage) }} component="div"
                  aria-label="attach" size="large">
                  <CheckIcon color={'primary'} />
                </IconButton>
            }
          </Grid>
        </Grid>

        <Grid item>
          <img className='msgImg' onClick={() => props.openImageOverlay(props.currentMessage)} src={props.currentMessage.image} alt='Previewed'></img>
        </Grid>
      </Grid>
    )
  }
  return null;
}

export default RenderImage;
