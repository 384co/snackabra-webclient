
import * as React from 'react'
import ResponsiveDialog from "../ResponsiveDialog";
import { useTheme } from '@mui/material/styles'

import { isMobile } from 'react-device-detect'
import ImageList from '@mui/material/ImageList'
import ImageListItem from '@mui/material/ImageListItem'

//import ImageViewer from './ImageViewer'
import { observer } from "mobx-react"
import { SnackabraContext } from 'mobx-snackabra-store'


const ImageGallery = observer((props) => {
  const theme = useTheme()
  const sbContext = React.useContext(SnackabraContext)

  const [open, setOpen] = React.useState(props.open)
  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  //const { img, images, sbContext, controlMessages } = props
  //const [imageList, setImageList] = React.useState(images)

  React.useEffect(() => {
    console.log('ImageGallery useEffect')
    console.dir(props)
  }, [])


  return (
    <ResponsiveDialog title={'Image Gallery'}
    open={open}
    onClose={props.onClose()}
    showActions
    fullScreen
    >

        <p> Cheerio </p>
    </ResponsiveDialog>
  )
})

export default ImageGallery

//   <ImageViewer
//   image={item.img}
//   sbContext={sbContext}
//   controlMessages={controlMessages}
//   onOpen={() => {
//     props.onOpen()
//   }}
//   onClose={() => {
//     props.onClose()
//   }}
// />


{/* <ImageList variant="masonry" cols={3} gap={8}>
  {images.map((item) => (
    <ImageListItem key={item.img}>
      <img
        srcSet={`${item.img}?w=164&h=164&fit=crop&auto=format 1x,
        ${item.img}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
        alt={item.title}
        loading="lazy"
      />
    </ImageListItem>
  ))}
</ImageList> */}