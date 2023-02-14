
import * as React from 'react'
import ResponsiveDialog from "../ResponsiveDialog";
import { useTheme } from '@mui/material/styles'

import ImageList from '@mui/material/ImageList'
import ImageListItem from '@mui/material/ImageListItem'

//import ImageViewer from './ImageViewer'


const ImageGallery = (props) => {
  const theme = useTheme()
  const [images, setImages] = React.useState(null)
  const { sbContext } = props

  const [open, setOpen] = React.useState(props.open)
  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])


  React.useEffect(() => {
    async function getRoomInfo() {
      return await sbContext.getChannel(props.roomId)
    }

    getRoomInfo().then((room) => {
      let imgs = []
      let count = 0
      room.messages.forEach(msg => {
        let img =  {
          key: count++,
          image: msg.image,
        }
        imgs.push(img)
      })

      setImages(imgs)
    })

  }, [])

  return (
    <ResponsiveDialog title={'Image Gallery'}
    open={open}
    onClose={props.onClose}
    showActions
    fullScreen
    >
      <ImageList variant="masonry" cols={3} gap={8}>
        {images.map((item) => (
          <ImageListItem key={item.key}>
          <img
            src={item.image}
          />
          </ImageListItem>
        ))}
      </ImageList>
    </ResponsiveDialog>
  )
}

export default ImageGallery
