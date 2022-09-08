import * as React from 'react';
import { IconButton } from "@mui/material";
import AttachmentIcon from '@mui/icons-material/Attachment';
import { getFileData, restrictPhoto } from "../../utils/snackabra-js/ImageProcessor";

class FileAttachment {
  data
  dataUrl
  restricted
  restrictedUrl

  constructor(input) {
    return new Promise(async (resolve) => {
      const b64url = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(input);
      });
      this.dataUrl = b64url
      this.data = input
      this.restricted = await restrictPhoto(input, 15, "image/jpeg", 0.92)
      this.restrictedUrl = await getFileData(this.restricted, 'url')
      resolve(this)
    })
  }
}

function RenderAttachmentIcon(props) {

  const selectFiles = async (e) => {
    props.showLoading()
    try {
      const files = []
      for (let i in e.target.files) {
        if (typeof e.target.files[i] === 'object') {
          const attachment = await new FileAttachment(e.target.files[i])
          files.push(attachment)

        }
      }
      props.addFile(files)
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <IconButton component="label" id={'attach-menu'} aria-label="attach" size="large">
      <AttachmentIcon />
      <input
        id="fileInput"
        onChange={selectFiles}
        type="file"
        hidden
        multiple
      />
    </IconButton>
  )
}

export default RenderAttachmentIcon;
