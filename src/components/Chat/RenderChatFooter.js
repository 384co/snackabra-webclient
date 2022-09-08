import React from 'react'
import { CircularProgress, Grid, IconButton, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

const RenderChatFooter = (props) => {

  const [files, setFiles] = React.useState([])
  const [loading, setLoading] = React.useState(props.loading)

  React.useEffect(() => {
    setFiles(props.files)
  }, [props.files])

  React.useEffect(() => {
    setLoading(props.loading)
  }, [props.loading])

  if (loading) {
    return (
      <Grid sx={{ width: '100%', minHeight: "50px" }}
            direction="row"
            justifyContent="center"
            alignItems="center"
            container>
        <Grid item>
          <CircularProgress color="inherit" />
        </Grid>
      </Grid>
    );
  }

  if (files.length > 0) {
    return (
      <Grid item>
        <Paper sx={{
          minHeight: "50px"
        }}>
          <Grid
            container
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
          >
            {files.map((file, index) => {
              return (
                <img key={index} id='previewImage'
                     width='150px'
                     style={{ padding: 8 }}
                     src={file.restrictedUrl}
                     alt='Image preview' />
              )
            })

            }

            <IconButton sx={{ position: "absolute", right: 0 }} onClick={props.removeInputFiles} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Grid>
        </Paper>
      </Grid>)
  }
  return null;
}

export default RenderChatFooter
